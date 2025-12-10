import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  where,
  setDoc,
} from 'firebase/firestore';
import { app as firebaseApp, db } from './firebaseConfig';
import { uploadImageToHostinger } from './hostingerConfig';

const { width } = Dimensions.get('window');

// Color presets for character customization
const colorPresets = [
  { name: 'Gold', frame: '#FFD700', text: '#1F2937' },
  { name: 'Purple', frame: '#7C3AED', text: '#FFFFFF' },
  { name: 'Blue', frame: '#3B82F6', text: '#FFFFFF' },
  { name: 'Green', frame: '#10B981', text: '#FFFFFF' },
  { name: 'Red', frame: '#EF4444', text: '#FFFFFF' },
  { name: 'Pink', frame: '#EC4899', text: '#FFFFFF' },
  { name: 'Cyan', frame: '#06B6D4', text: '#1F2937' },
  { name: 'Orange', frame: '#F97316', text: '#FFFFFF' },
];

export default function RoleplayScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { communityId, sessionId, groupTitle, selectedRole } = route.params || {};

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [scenario, setScenario] = useState('');
  const [roles, setRoles] = useState([]);
  const [myRole, setMyRole] = useState(null);
  
  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef(null);

  // Character customization states
  const [showCharacterCustomization, setShowCharacterCustomization] = useState(false);
  const [characterImage, setCharacterImage] = useState(null);
  const [characterName, setCharacterName] = useState('');
  const [characterDescription, setCharacterDescription] = useState('');
  const [frameColor, setFrameColor] = useState('#FFD700');
  const [textColor, setTextColor] = useState('#1F2937');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState('frame'); // 'frame' or 'text'
  const [myCharacterId, setMyCharacterId] = useState(null);
  const [participantCharacters, setParticipantCharacters] = useState({});
  const [existingCharacters, setExistingCharacters] = useState([]);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  // Helper functions for color contrast
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;
    
    const rLin = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLin = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLin = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
    
    return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
  };

  const getContrastRatio = (color1, color2) => {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const hasGoodContrast = (bgColor, textColor) => {
    const contrast = getContrastRatio(bgColor, textColor);
    return contrast >= 4.5; // WCAG AA standard
  };

  // Apply color preset
  const applyPreset = (preset) => {
    setFrameColor(preset.frame);
    setTextColor(preset.text);
  };

  // Handle gallery upload
  const handleGalleryUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery access to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setShowImageOptions(false);
        setUploadingImage(true);

        try {
          const imageUrl = await uploadImageToHostinger(result.assets[0].uri, 'roleplay_characters');

          setCharacterImage(imageUrl);
          setUploadingImage(false);
          Alert.alert('Success', 'Character image uploaded!');
        } catch (error) {
          console.error('Error uploading image:', error);
          setUploadingImage(false);
          Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadingImage(false);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  // Handle AI generation
  const handleAIGeneration = () => {
    setShowImageOptions(false);
    
    Alert.alert(
      'AI Image Generation',
      'Generate custom character art with AI. This is a premium feature available in the marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Marketplace',
          onPress: () => {
            navigation.navigate('Marketplace', {
              screen: 'AIImageGenerator',
              params: {
                returnTo: 'RoleplayScreen',
                characterId: myCharacterId,
                purpose: 'character_image'
              }
            });
          }
        }
      ]
    );
  };

  // Select existing character for this session
  const selectExistingCharacter = async (character) => {
    try {
      const characterId = `char_${currentUser.id}_${sessionId}_${Date.now()}`;
      const characterRef = doc(db, 'roleplay_characters', characterId);

      const characterData = {
        userId: currentUser.id,
        communityId: communityId,
        sessionId: sessionId,
        name: character.name,
        description: character.description || '',
        imageUrl: character.imageUrl,
        imageSource: character.imageSource,
        frameColor: character.frameColor || '#FFD700',
        textColor: character.textColor || '#1F2937',
        role: myRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        copiedFrom: character.id, // Track original character
      };

      await setDoc(characterRef, characterData);

      setMyCharacterId(characterId);
      setCharacterName(character.name);
      setCharacterDescription(character.description || '');
      setCharacterImage(character.imageUrl);
      setFrameColor(character.frameColor || '#FFD700');
      setTextColor(character.textColor || '#1F2937');
      setShowCharacterSelector(false);
      
      Alert.alert('Success', `Character "${character.name}" selected!`);
    } catch (error) {
      console.error('Error selecting character:', error);
      Alert.alert('Error', 'Failed to select character');
    }
  };

  // Save character customization
  const saveCharacterCustomization = async () => {
    if (!characterName.trim()) {
      Alert.alert('Error', 'Please enter a character name');
      return;
    }

    try {
      const characterId = myCharacterId || `char_${currentUser.id}_${sessionId}_${Date.now()}`;
      const characterRef = doc(db, 'roleplay_characters', characterId);

      const characterData = {
        userId: currentUser.id,
        communityId: communityId,
        sessionId: sessionId,
        name: characterName.trim(),
        description: characterDescription.trim(),
        imageUrl: characterImage,
        imageSource: characterImage ? 'gallery' : null,
        frameColor: frameColor,
        textColor: textColor,
        role: myRole,
        updatedAt: serverTimestamp(),
      };

      if (!myCharacterId) {
        characterData.createdAt = serverTimestamp();
        characterData.isActive = true;
      }

      await setDoc(characterRef, characterData, { merge: true });

      setMyCharacterId(characterId);
      setShowCharacterCustomization(false);
      
      Alert.alert('Success', `Character "${characterName}" saved!`);
    } catch (error) {
      console.error('Error saving character:', error);
      Alert.alert('Error', 'Failed to save character customization');
    }
  };

  // Load existing characters (all characters created by user)
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadExistingCharacters = async () => {
      try {
        setLoadingCharacters(true);
        const charsRef = collection(db, 'roleplay_characters');
        const q = query(
          charsRef,
          where('userId', '==', currentUser.id)
        );
        
        const snapshot = await getDocs(q);
        const chars = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setExistingCharacters(chars);
        setLoadingCharacters(false);
      } catch (error) {
        console.error('Error loading existing characters:', error);
        setLoadingCharacters(false);
      }
    };

    loadExistingCharacters();
  }, [currentUser?.id]);

  // Load character data for this session
  useEffect(() => {
    if (!currentUser?.id || !communityId || !sessionId) return;

    const loadCharacter = async () => {
      try {
        // First, check if user has characters from the session (from character collection)
        const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          
          // Find user's participant data which should have their selected characters
          const userParticipant = sessionData.participants?.find(p => p.userId === currentUser.id);
          
          if (userParticipant && userParticipant.characters && userParticipant.characters.length > 0) {
            // User has selected characters from character collection
            // Use the first character as the active character
            const characterIds = userParticipant.characters;
            const sessionCharacters = sessionData.characters || [];
            const userCharacter = sessionCharacters.find(char => 
              characterIds.includes(char.id) && char.ownerId === currentUser.id
            );
            
            if (userCharacter) {
              setCharacterName(userCharacter.name || currentUser.name);
              setCharacterDescription(userCharacter.description || '');
              setCharacterImage(userCharacter.avatar || currentUser.profileImage);
              setFrameColor(userCharacter.themeColor || '#A855F7');
              setTextColor('#FFFFFF');
              setMyCharacterId(userCharacter.id);
              return; // Exit early, we found the character
            }
          }
        }
        
        // Fallback: Check roleplay_characters collection
        const charsRef = collection(db, 'roleplay_characters');
        const q = query(
          charsRef,
          where('userId', '==', currentUser.id),
          where('sessionId', '==', sessionId)
        );
        
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const charData = snapshot.docs[0].data();
          const charId = snapshot.docs[0].id;
          
          setMyCharacterId(charId);
          setCharacterName(charData.name || '');
          setCharacterDescription(charData.description || '');
          setCharacterImage(charData.imageUrl || null);
          setFrameColor(charData.frameColor || '#FFD700');
          setTextColor(charData.textColor || '#1F2937');
        } else {
          // No character found - use default character settings
          setCharacterName(currentUser.name || 'User');
          setCharacterImage(currentUser.profileImage || null);
          setFrameColor('#A855F7');
          setTextColor('#FFFFFF');
        }
      } catch (error) {
        console.error('Error loading character:', error);
      }
    };

    loadCharacter();
  }, [currentUser?.id, communityId, sessionId, currentUser?.name, currentUser?.profileImage]);

  // Load all participants' characters
  useEffect(() => {
    if (!communityId || !sessionId || participants.length === 0) return;

    const loadParticipantCharacters = async () => {
      try {
        // First, get characters from the session data
        const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);
        const sessionSnap = await getDoc(sessionRef);
        
        const chars = {};
        
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          const sessionCharacters = sessionData.characters || [];
          
          // Map session characters to participants
          participants.forEach((participant) => {
            // Find character for this participant from session.characters array
            const participantCharacter = sessionCharacters.find(char => 
              char.ownerId === participant.userId
            );
            
            if (participantCharacter) {
              chars[participant.userId] = {
                id: participantCharacter.id,
                name: participantCharacter.name,
                imageUrl: participantCharacter.avatar,
                frameColor: participantCharacter.themeColor,
                textColor: '#FFFFFF',
                description: participantCharacter.description,
                ...participantCharacter
              };
            }
          });
        }
        
        // Also check roleplay_characters collection for any custom characters
        const charsRef = collection(db, 'roleplay_characters');
        const q = query(
          charsRef,
          where('sessionId', '==', sessionId)
        );
        
        const snapshot = await getDocs(q);
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Only add if not already added from session data
          if (!chars[data.userId]) {
            chars[data.userId] = {
              id: doc.id,
              ...data
            };
          }
        });
        
        setParticipantCharacters(chars);
      } catch (error) {
        console.error('Error loading participant characters:', error);
      }
    };

    loadParticipantCharacters();
  }, [communityId, sessionId, participants]);

  // Fetch current user and join roleplay
  useEffect(() => {
    const initializeRoleplay = async () => {
      try {
        const auth = getAuth(firebaseApp);
        // db is now imported globally

        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          
          // Get user data
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};
          
          const user = {
            id: userId,
            name: userData.displayName || userData.name || auth.currentUser.displayName || 'User',
            profileImage: userData.profileImage || userData.avatar || null,
          };
          
          setCurrentUser(user);

          // Get roleplay session data
          const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);
          const sessionSnap = await getDoc(sessionRef);

          if (sessionSnap.exists()) {
            const sessionData = sessionSnap.data();
            setScenario(sessionData.scenario || '');
            setRoles(sessionData.roles || []);
            setParticipants(sessionData.participants || []);

            // Find user's role
            const userParticipant = sessionData.participants?.find(p => p.userId === userId);
            if (userParticipant) {
              setMyRole(userParticipant.role);
            } else if (selectedRole) {
              // User just joined, add them
              const updatedRoles = sessionData.roles.map(r => 
                r.id === selectedRole.id 
                  ? { ...r, taken: true, takenBy: userId, takenByName: user.name }
                  : r
              );

              await updateDoc(sessionRef, {
                participants: arrayUnion({
                  userId: user.id,
                  userName: user.name,
                  profileImage: user.profileImage,
                  joinedAt: new Date().toISOString(),
                  role: selectedRole.name,
                  roleId: selectedRole.id,
                }),
                roles: updatedRoles,
                updatedAt: serverTimestamp(),
              });

              setMyRole(selectedRole.name);
            }
          }
        }
        setLoading(false);
      } catch (e) {
        console.log('Error initializing roleplay:', e);
        setLoading(false);
      }
    };

    initializeRoleplay();
  }, [communityId, sessionId, selectedRole]);

  // Listen for roleplay session updates
  useEffect(() => {
    if (!communityId || !sessionId) return;

    // db is now imported globally
    const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);

    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setParticipants(data.participants || []);
        setRoles(data.roles || []);
        setScenario(data.scenario || '');
      }
    });

    return () => unsubscribe();
  }, [communityId, sessionId]);

  // Listen for chat messages
  useEffect(() => {
    if (!communityId || !sessionId) return;

    console.log('Setting up chat listener for session:', sessionId);

    // db is now imported globally
    const chatRef = collection(db, 'roleplay_sessions', communityId, 'sessions', sessionId, 'chat');
    const q = query(chatRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Roleplay chat messages received:', snapshot.docs.length);
      const messages = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        console.log('Message data:', data);
        return {
          id: docSnap.id,
          ...data
        };
      });
      setChatMessages(messages);
      
      // Update unread count if chat is closed
      if (!showChat && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.senderId !== currentUser?.id) {
          setUnreadCount(prev => prev + 1);
        }
      }
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (chatScrollRef.current && showChat) {
          chatScrollRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }, (error) => {
      console.error('Error listening to roleplay chat:', error);
    });

    return () => unsubscribe();
  }, [communityId, sessionId, currentUser?.id]);

  // Reset unread count when chat opens
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Send chat message
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !currentUser) return;

    try {
      // db is now imported globally
      const chatRef = collection(db, 'roleplay_sessions', communityId, 'sessions', sessionId, 'chat');
      
      // Build message data without undefined values
      const messageData = {
        text: chatInput.trim(),
        senderId: currentUser.id,
        senderName: characterName || currentUser.name || 'User',
        senderImage: characterImage || currentUser.profileImage || null,
        frameColor: frameColor || '#A855F7',
        textColor: textColor || '#FFFFFF',
        createdAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (myRole) messageData.senderRole = myRole;
      if (myCharacterId) messageData.characterId = myCharacterId;
      
      await addDoc(chatRef, messageData);
      
      setChatInput('');
      Keyboard.dismiss();
    } catch (error) {
      console.log('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // End session (creator only)
  const handleEndSession = () => {
    Alert.alert(
      'End Roleplay Session',
      'Are you sure you want to end this roleplay session for everyone? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              // db is now imported globally
              const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);
              
              // Find and update the chat message efficiently
              const chatRef = collection(db, 'community_chats', communityId, 'messages');
              const q = query(
                chatRef,
                where('type', '==', 'roleplay'),
                where('sessionId', '==', sessionId)
              );
              const messagesSnap = await getDocs(q);
              
              // Update chat messages and delete session in parallel
              const updatePromises = messagesSnap.docs.map(msgDoc =>
                updateDoc(doc(db, 'community_chats', communityId, 'messages', msgDoc.id), {
                  isActive: false,
                  closedAt: serverTimestamp(),
                  closedBy: currentUser.id,
                })
              );

              // Wait for all operations to complete
              await Promise.all([
                ...updatePromises,
                deleteDoc(sessionRef)
              ]);
              
              Alert.alert('Session Ended', 'The roleplay session has been closed for all participants.');
              navigation.goBack();
            } catch (error) {
              console.error('Error ending session:', error);
              Alert.alert('Error', 'Failed to end session. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Leave roleplay
  const handleLeaveRoleplay = async () => {
    try {
      // Check if user is the creator
      const sessionRef = doc(db, 'roleplay_sessions', communityId, 'sessions', sessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        const isCreator = data.createdBy === currentUser?.id;
        
        if (isCreator) {
          // Creator leaving - offer to end session
          Alert.alert(
            'End Roleplay Session?',
            'You are the creator of this roleplay session. Do you want to end it for everyone?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Just Leave',
                onPress: async () => {
                  try {
                    const updatedParticipants = (data.participants || []).filter(
                      p => p.userId !== currentUser.id
                    );

                    // Mark role as available again
                    const updatedRoles = data.roles.map(r => 
                      r.takenBy === currentUser.id
                        ? { ...r, taken: false, takenBy: null, takenByName: null }
                        : r
                    );

                    if (updatedParticipants.length === 0) {
                      await deleteDoc(sessionRef);
                    } else {
                      await updateDoc(sessionRef, {
                        participants: updatedParticipants,
                        roles: updatedRoles,
                        updatedAt: serverTimestamp(),
                      });
                    }
                    
                    navigation.goBack();
                  } catch (error) {
                    console.log('Error leaving roleplay:', error);
                    Alert.alert('Error', 'Failed to leave roleplay session');
                  }
                },
              },
              {
                text: 'End Session',
                style: 'destructive',
                onPress: async () => {
                  handleEndSession();
                },
              },
            ]
          )
        } else {
          // Regular participant leaving
          Alert.alert(
            'Leave Roleplay',
            'Are you sure you want to leave this roleplay session?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Leave',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const updatedParticipants = (data.participants || []).filter(
                      p => p.userId !== currentUser.id
                    );

                    // Mark role as available again
                    const updatedRoles = data.roles.map(r => 
                      r.takenBy === currentUser.id
                        ? { ...r, taken: false, takenBy: null, takenByName: null }
                        : r
                    );

                    if (updatedParticipants.length === 0) {
                      await deleteDoc(sessionRef);
                    } else {
                      await updateDoc(sessionRef, {
                        participants: updatedParticipants,
                        roles: updatedRoles,
                        updatedAt: serverTimestamp(),
                      });
                    }
                    
                    navigation.goBack();
                  } catch (error) {
                    console.log('Error leaving roleplay:', error);
                    Alert.alert('Error', 'Failed to leave roleplay session');
                  }
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.log('Error checking creator status:', error);
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>Loading roleplay...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <LinearGradient colors={['#7C3AED', '#9333EA', '#A855F7']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{groupTitle || 'Roleplay'}</Text>
              <Text style={styles.headerSubtitle}>{participants.length} participants</Text>
            </View>
            <MaterialCommunityIcons name="drama-masks" size={28} color="#fff" />
          </View>
        </LinearGradient>

        {/* Main Roleplay Stage Area */}
        <View style={styles.mainStageContainer}>
          {/* Circular Participants Layout */}
          <View style={styles.circularParticipantsContainer}>
            {participants.map((participant, index) => {
              const character = participantCharacters[participant.userId];
              const characterImage = character?.imageUrl;
              const displayName = character?.name || participant.userName;
              const charFrameColor = character?.frameColor || '#FFD700';
              
              // Position participants in a circle
              const angle = (index * 360) / participants.length;
              const radius = 100;
              const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
              const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
              
              return (
                <View 
                  key={participant.userId} 
                  style={[
                    styles.circularParticipant,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y }
                      ]
                    }
                  ]}
                >
                  {/* Crown icon for active/special participants */}
                  <View style={styles.crownIconContainer}>
                    <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
                  </View>
                  
                  {/* Character Avatar */}
                  <View style={[
                    styles.circularAvatar,
                    { borderColor: charFrameColor }
                  ]}>
                    {characterImage ? (
                      <Image
                        source={{ uri: characterImage }}
                        style={styles.circularAvatarImage}
                        defaultSource={require('./assets/a1.png')}
                      />
                    ) : (
                      <Image
                        source={require('./assets/a1.png')}
                        style={styles.circularAvatarImage}
                      />
                    )}
                  </View>
                  
                  {/* Character/Participant Name */}
                  <Text style={styles.circularParticipantName} numberOfLines={1}>
                    {displayName}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Center Play Button */}
          <View style={styles.centerPlayButtonContainer}>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => setShowChat(true)}
            >
              <MaterialCommunityIcons name="play" size={28} color="#000" />
              <Text style={styles.playButtonText}>Play</Text>
            </TouchableOpacity>
          </View>

          {/* Scenario Display */}
          {scenario ? (
            <View style={styles.scenarioDisplayContainer}>
              <Text style={styles.scenarioDisplayText} numberOfLines={2}>
                {scenario}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
  

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => setShowChat(!showChat)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Chat</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRoleplay}>
            <Ionicons name="exit-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Chat Overlay */}
        {showChat && (
          <View style={styles.chatOverlay}>
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTitle}>Roleplay Chat</Text>
                <TouchableOpacity onPress={() => setShowChat(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                ref={chatScrollRef}
                style={styles.chatMessages}
                contentContainerStyle={styles.chatMessagesContent}
              >
                {chatMessages.map((msg) => {
                  const isOwnMessage = msg.senderId === currentUser?.id;
                  // Use bright purple/pink colors for better visibility
                  const msgFrameColor = msg.frameColor || (isOwnMessage ? '#A855F7' : '#EC4899');
                  // Always use white text for maximum visibility
                  const msgTextColor = '#FFFFFF';
                  
                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatMessage,
                        isOwnMessage ? styles.chatMessageOwn : styles.chatMessageOther
                      ]}
                    >
                      {!isOwnMessage && (
                        <Image
                          source={msg.senderImage ? { uri: msg.senderImage } : require('./assets/a1.png')}
                          style={styles.chatAvatar}
                        />
                      )}
                      <View style={[
                        styles.chatBubble,
                        {
                          borderColor: msgFrameColor,
                          borderWidth: 2,
                          backgroundColor: `${msgFrameColor}40`,
                        }
                      ]}>
                        <View style={styles.chatSenderHeader}>
                          <Text style={[styles.chatSenderName, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                            {msg.senderName || 'User'}
                          </Text>
                          {msg.senderRole && (
                            <Text style={[
                              styles.chatSenderRole,
                              { color: '#FFFFFF', opacity: 0.9 }
                            ]}>[{msg.senderRole}]</Text>
                          )}
                        </View>
                        <Text style={[styles.chatText, { color: '#FFFFFF' }]}>{msg.text || ''}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
              >
                <View style={styles.chatInputContainer}>
                  <TextInput
                    style={styles.chatInput}
                    placeholder="Type a message..."
                    placeholderTextColor="#666"
                    value={chatInput}
                    onChangeText={setChatInput}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity 
                    style={styles.chatSendButton}
                    onPress={sendChatMessage}
                    disabled={!chatInput.trim()}
                  >
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={chatInput.trim() ? '#fff' : '#999'} 
                    />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          </View>
        )}

        {/* Character Customization Modal */}
        <Modal
          visible={showCharacterCustomization}
          animationType="slide"
          transparent={false}
        >
          <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
              {/* Customization Header */}
              <LinearGradient colors={['#7C3AED', '#9333EA', '#A855F7']} style={styles.header}>
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={() => setShowCharacterCustomization(false)} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Customize Character</Text>
                    <Text style={styles.headerSubtitle}>Personalize your roleplay identity</Text>
                  </View>
                  <MaterialCommunityIcons name="palette" size={28} color="#fff" />
                </View>
              </LinearGradient>

              <ScrollView style={styles.customizationScroll}>
                {/* Character Image Section */}
                <View style={styles.characterImageSection}>
                  <Text style={styles.sectionTitle}>Character Image</Text>
                  
                  <TouchableOpacity 
                    style={styles.imagePreviewContainer}
                    onPress={() => setShowImageOptions(true)}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <View style={styles.imagePlaceholder}>
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text style={styles.placeholderText}>Uploading...</Text>
                      </View>
                    ) : characterImage ? (
                      <Image 
                        source={{ uri: characterImage }} 
                        style={styles.characterImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons 
                          name="account-circle-outline" 
                          size={80} 
                          color="#666" 
                        />
                        <Text style={styles.placeholderText}>Add Character Image</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Character Info */}
                <View style={styles.characterInfoSection}>
                  <Text style={styles.sectionTitle}>Character Details</Text>
                  
                  <TextInput
                    style={styles.characterInput}
                    placeholder="Character Name"
                    placeholderTextColor="#666"
                    value={characterName}
                    onChangeText={setCharacterName}
                    maxLength={50}
                  />
                  
                  <TextInput
                    style={[styles.characterInput, styles.characterTextArea]}
                    placeholder="Character Description (optional)"
                    placeholderTextColor="#666"
                    value={characterDescription}
                    onChangeText={setCharacterDescription}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                  />
                </View>

                {/* Color Frame Customization */}
                <View style={styles.characterAppearanceSection}>
                  <Text style={styles.sectionTitle}>Character Appearance</Text>
                  <Text style={styles.sectionSubtitle}>
                    Customize how your character appears in roleplay chats
                  </Text>

                  {/* Live Preview */}
                  <View style={styles.colorPreview}>
                    <View 
                      style={[
                        styles.previewBubble, 
                        { 
                          borderColor: frameColor,
                          borderWidth: 3,
                          backgroundColor: `${frameColor}20`
                        }
                      ]}
                    >
                      <Text style={[styles.previewName, { color: textColor }]}>
                        {characterName || 'Character Name'}
                      </Text>
                      <Text style={[styles.previewMessage, { color: textColor }]}>
                        This is how your character will appear in roleplay chats
                      </Text>
                    </View>
                  </View>

                  {/* Frame Color Picker */}
                  <View style={styles.colorPickerContainer}>
                    <Text style={styles.colorLabel}>Frame Color</Text>
                    <TouchableOpacity
                      style={[styles.colorPreviewButton, { backgroundColor: frameColor }]}
                      onPress={() => {
                        setColorPickerType('frame');
                        setShowColorPicker(true);
                      }}
                    >
                      <Text style={styles.colorCode}>{frameColor}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Text Color Picker */}
                  <View style={styles.colorPickerContainer}>
                    <Text style={styles.colorLabel}>Text Color</Text>
                    <TouchableOpacity
                      style={[styles.colorPreviewButton, { backgroundColor: textColor }]}
                      onPress={() => {
                        setColorPickerType('text');
                        setShowColorPicker(true);
                      }}
                    >
                      <Text style={styles.colorCode}>{textColor}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Contrast Warning */}
                  {!hasGoodContrast(frameColor, textColor) && (
                    <View style={styles.contrastWarning}>
                      <Ionicons name="warning" size={16} color="#F59E0B" />
                      <Text style={styles.warningText}>
                        Low contrast - text may be hard to read
                      </Text>
                    </View>
                  )}

                  {/* Preset Color Combinations */}
                  <View style={styles.presetsContainer}>
                    <Text style={styles.presetsTitle}>Quick Presets</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {colorPresets.map((preset, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.presetButton}
                          onPress={() => applyPreset(preset)}
                        >
                          <View 
                            style={[
                              styles.presetCircle,
                              { 
                                borderColor: preset.frame,
                                backgroundColor: `${preset.frame}40`
                              }
                            ]}
                          >
                            <View 
                              style={[
                                styles.presetInner,
                                { backgroundColor: preset.text }
                              ]}
                            />
                          </View>
                          <Text style={styles.presetName}>{preset.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={saveCharacterCustomization}
                >
                  <Text style={styles.saveButtonText}>Save Character</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        {/* Image Options Modal */}
        <Modal
          visible={showImageOptions}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.imageOptionsModal}>
              <Text style={styles.modalTitle}>Add Character Image</Text>
              
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={handleGalleryUpload}
              >
                <Ionicons name="images" size={24} color="#7C3AED" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Upload from Gallery</Text>
                  <Text style={styles.optionSubtitle}>Free • Choose from your photos</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionButton}
                onPress={handleAIGeneration}
              >
                <MaterialCommunityIcons name="auto-fix" size={24} color="#F59E0B" />
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Generate with AI</Text>
                  <Text style={styles.optionSubtitle}>Premium • AI-powered character art</Text>
                </View>
                <View style={styles.premiumBadge}>
                  <Ionicons name="diamond" size={12} color="#fff" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowImageOptions(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.colorPickerModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select {colorPickerType === 'frame' ? 'Frame' : 'Text'} Color
                </Text>
                <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                <View style={styles.colorGrid}>
                  {['#FFD700', '#7C3AED', '#3B82F6', '#10B981', '#EF4444', '#EC4899', 
                    '#06B6D4', '#F97316', '#8B5CF6', '#14B8A6', '#F59E0B', '#6366F1',
                    '#1F2937', '#FFFFFF', '#9CA3AF', '#4B5563'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[styles.colorOption, { backgroundColor: color }]}
                      onPress={() => {
                        if (colorPickerType === 'frame') {
                          setFrameColor(color);
                        } else {
                          setTextColor(color);
                        }
                        setShowColorPicker(false);
                      }}
                    >
                      {(colorPickerType === 'frame' && frameColor === color) ||
                       (colorPickerType === 'text' && textColor === color) ? (
                        <Ionicons name="checkmark" size={24} color="#fff" />
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Character Selector Modal */}
        <Modal
          visible={showCharacterSelector}
          animationType="slide"
          transparent={false}
        >
          <LinearGradient colors={['#1a0a2e', '#2d1b4e', '#1a0a2e']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
              {/* Selector Header */}
              <LinearGradient colors={['#7C3AED', '#9333EA', '#A855F7']} style={styles.header}>
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={() => setShowCharacterSelector(false)} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Select Character</Text>
                    <Text style={styles.headerSubtitle}>Choose from your characters</Text>
                  </View>
                  <MaterialCommunityIcons name="account-group" size={28} color="#fff" />
                </View>
              </LinearGradient>

              <ScrollView style={styles.characterSelectorScroll}>
                {loadingCharacters ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#A855F7" />
                    <Text style={styles.loadingText}>Loading characters...</Text>
                  </View>
                ) : (
                  <>
                    {existingCharacters.map((character) => (
                      <TouchableOpacity
                        key={character.id}
                        style={styles.existingCharacterCard}
                        onPress={() => selectExistingCharacter(character)}
                      >
                        <View style={[
                          styles.existingCharacterAvatar,
                          { borderColor: character.frameColor || '#FFD700' }
                        ]}>
                          {character.imageUrl ? (
                            <Image
                              source={{ uri: character.imageUrl }}
                              style={styles.existingCharacterImage}
                            />
                          ) : (
                            <MaterialCommunityIcons
                              name="account-circle"
                              size={60}
                              color="#666"
                            />
                          )}
                        </View>
                        <View style={styles.existingCharacterInfo}>
                          <Text style={styles.existingCharacterName}>{character.name}</Text>
                          {character.description && (
                            <Text style={styles.existingCharacterDesc} numberOfLines={2}>
                              {character.description}
                            </Text>
                          )}
                          <View style={styles.characterColorPreview}>
                            <View
                              style={[
                                styles.colorPreviewDot,
                                { backgroundColor: character.frameColor || '#FFD700' }
                              ]}
                            />
                            <View
                              style={[
                                styles.colorPreviewDot,
                                { backgroundColor: character.textColor || '#1F2937' }
                              ]}
                            />
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#999" />
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.createNewCharacterButton}
                      onPress={() => {
                        setShowCharacterSelector(false);
                        setShowCharacterCustomization(true);
                      }}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={32} color="#A855F7" />
                      <Text style={styles.createNewCharacterText}>Create New Character</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scenarioContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A855F7',
  },
  scenarioText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
  },
  myRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  myRoleText: {
    color: '#A855F7',
    fontSize: 14,
    fontWeight: '600',
  },
  mainStageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  circularParticipantsContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularParticipant: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
  },
  crownIconContainer: {
    position: 'absolute',
    top: -15,
    zIndex: 10,
  },
  circularAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    padding: 3,
    backgroundColor: 'rgba(26, 10, 46, 0.8)',
    position: 'relative',
  },
  circularAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
  },
  userProfileBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1a0a2e',
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  userProfileBadgeImage: {
    width: '100%',
    height: '100%',
  },
  circularParticipantName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  centerPlayButtonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ADE80',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scenarioDisplayContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  scenarioDisplayText: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 16,
    marginBottom: 12,
  },
  participantsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  participantCard: {
    alignItems: 'center',
    width: 80,
  },
  participantAvatarContainer: {
    borderRadius: 32,
    padding: 2,
  },
  participantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  participantName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
  characterLabel: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  roleTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  roleTagText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },

  roleItem: {
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  roleItemTaken: {
    borderColor: '#666',
    opacity: 0.7,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A855F7',
    flex: 1,
  },
  roleTakenText: {
    color: '#999',
  },
  roleDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  takenText: {
    color: '#A855F7',
    fontSize: 12,
    fontWeight: '600',
  },
  availableBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  takenByText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  customizeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.3)',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  chatButton: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  endSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#1a0a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124, 58, 237, 0.5)',
    backgroundColor: 'rgba(45, 27, 78, 0.3)',
  },
  chatTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
  },
  chatMessagesContent: {
    padding: 16,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  chatMessageOwn: {
    justifyContent: 'flex-end',
  },
  chatMessageOther: {
    justifyContent: 'flex-start',
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  chatBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  chatSenderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  chatSenderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatSenderRole: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  chatText: {
    fontSize: 15,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124, 58, 237, 0.5)',
    backgroundColor: 'rgba(45, 27, 78, 0.3)',
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(45, 27, 78, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.5)',
  },
  chatSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Character Customization Styles
  customizationScroll: {
    flex: 1,
  },
  characterSelectorScroll: {
    flex: 1,
    padding: 16,
  },
  existingCharacterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  existingCharacterAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  existingCharacterImage: {
    width: '100%',
    height: '100%',
  },
  existingCharacterInfo: {
    flex: 1,
    marginLeft: 16,
  },
  existingCharacterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  existingCharacterDesc: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  characterColorPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  colorPreviewDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  createNewCharacterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#A855F7',
    gap: 12,
    marginTop: 8,
  },
  createNewCharacterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A855F7',
  },
  characterImageSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  imagePreviewContainer: {
    alignSelf: 'center',
    marginTop: 12,
  },
  characterImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#A855F7',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#666',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  characterInfoSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  characterInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  characterTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterAppearanceSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(45, 27, 78, 0.5)',
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    lineHeight: 18,
  },
  colorPreview: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  previewBubble: {
    padding: 16,
    borderRadius: 16,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewMessage: {
    fontSize: 16,
    lineHeight: 22,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  colorLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  colorPreviewButton: {
    width: 100,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  colorCode: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contrastWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginTop: 12,
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 13,
  },
  presetsContainer: {
    marginTop: 16,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
  },
  presetButton: {
    alignItems: 'center',
    marginRight: 16,
  },
  presetCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  presetInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  presetName: {
    fontSize: 11,
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#A855F7',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  imageOptionsModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  premiumBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 6,
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  colorPickerModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  colorOption: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

