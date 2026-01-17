// screens/EnhancedChatScreenV2.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Clipboard,
  ActivityIndicator,
  Keyboard,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  limit,
  startAfter
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MessageBox } from '../components/MessageBox';
import { MessageItem } from '../components/MessageItemEnhanced';
import { MessageActionsSheet } from '../components/MessageActionsSheet';
import { ScrollToBottomButton } from '../components/ScrollToBottomButton';
import { SimpleInlineStatus } from '../components/StatusBadge';
import EmojiSelector from 'react-native-emoji-selector';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToHostinger, uploadVideoToHostinger, uploadAudioToHostinger } from '../hostingerConfig';
import {
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  addReaction,
  removeReaction,
  replyToMessage,
  forwardMessage
} from '../utils/messageControls';
import {
  setTypingStatus,
  markMessagesAsRead,
  updateUserPresence,
  setActiveConversation,
  clearActiveConversation
} from '../utils/presenceHelpers';
import {
  muteConversation,
  unmuteConversation,
  archiveConversation,
  blockUser,
  clearChatHistory,
  pinMessage,
  unpinMessage
} from '../utils/userControls';

const ACCENT = '#7C3AED';
const BG = '#0B0B0E';
const CARD = '#17171C';
const PAGE_SIZE = 50;

export default function EnhancedChatScreenV2({ route, navigation }) {
  const { conversationId, isGroup, groupName, otherUserId } = route.params;
  const currentUserId = auth.currentUser?.uid;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [conversationData, setConversationData] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [otherUserData, setOtherUserData] = useState(null);
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [selectedTextColor, setSelectedTextColor] = useState('#fff');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const textColors = ['#fff', '#FF4444', '#FF6B6B', '#FFA500', '#FFD700', '#4CAF50', '#00CED1', '#4169E1', '#8B2EF0', '#FF1493'];

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messageInputRef = useRef(null);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    // Load other user data for 1-on-1 chats
    if (!isGroup && otherUserId) {
      const loadOtherUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setOtherUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error loading other user:', error);
        }
      };
      loadOtherUser();
    }

    // Update presence
    updateUserPresence(currentUserId, 'online');
    setActiveConversation(currentUserId, conversationId);

    // Keyboard listeners to hide emoji picker when keyboard shows
    const keyboardShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setShowEmojiPicker(false);
    });

    // Load conversation data
    const conversationRef = doc(db, 'conversations', conversationId);
    const unsubConversation = onSnapshot(conversationRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setConversationData(data);

        // Update typing indicators
        if (data.typing) {
          const typing = Object.entries(data.typing)
            .filter(([userId]) => userId !== currentUserId)
            .map(([userId]) => userId);
          setTypingUsers(typing);
        }
      }
    });

    // Load messages
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

    const unsubMessages = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort messages to handle null timestamps properly
      const sortedMsgs = msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA; // Descending order (newest first for inverted list)
      });

      setMessages(sortedMsgs);
      setLoading(false);

      // Mark as read
      const unreadIds = sortedMsgs
        .filter(m => m.senderId !== currentUserId && !m.status?.read?.[currentUserId])
        .map(m => m.id);

      if (unreadIds.length > 0) {
        markMessagesAsRead(conversationId, unreadIds, currentUserId);
      }
    });

    return () => {
      keyboardShowListener.remove();
      unsubConversation();
      unsubMessages();
      clearActiveConversation(currentUserId, conversationId);

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [conversationId, currentUserId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    // Immediately set sending state and clear text to prevent duplicate sends
    setSending(true);
    const textToSend = messageText;
    const colorToSend = selectedTextColor;
    setMessageText('');

    try {
      const messageData = {
        senderId: currentUserId,
        text: textToSend,
        type: 'text',
        textColor: colorToSend,
        createdAt: serverTimestamp(),
        status: {
          sent: serverTimestamp(),
          delivered: {},
          read: {}
        }
      };

      // Add reply context if replying
      if (replyTo) {
        messageData.replyTo = {
          messageId: replyTo.id,
          senderId: replyTo.senderId,
          text: replyTo.text,
          type: replyTo.type
        };
        setReplyTo(null);
      }

      await addDoc(
        collection(db, 'conversations', conversationId, 'messages'),
        messageData
      );

      // Update conversation last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: {
          text: textToSend,
          senderId: currentUserId,
          timestamp: serverTimestamp(),
          type: 'text'
        },
        lastMessageTime: serverTimestamp()
      });

      // Stop typing indicator
      setTypingStatus(conversationId, currentUserId, false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTextChange = (text) => {
    setMessageText(text);

    // Typing indicator
    if (text.trim()) {
      setTypingStatus(conversationId, currentUserId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(conversationId, currentUserId, false);
      }, 3000);
    } else {
      setTypingStatus(conversationId, currentUserId, false);
    }
  };

  const handleMessageLongPress = (message) => {
    setSelectedMessage(message);
    setActionsVisible(true);
  };

  const handleEdit = (message) => {
    setMessageText(message.text);
    setMessageToEdit(message);
    setEditMode(true);
    setActionsVisible(false);
  };

  const handleDelete = async (message, deleteType) => {
    try {
      if (deleteType === 'everyone') {
        Alert.alert(
          'Delete for everyone?',
          'This message will be deleted for all participants',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                await deleteMessageForEveryone(conversationId, message.id);
              }
            }
          ]
        );
      } else {
        await deleteMessageForMe(conversationId, message.id, currentUserId);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
  };

  const handleForward = (message) => {
    // Navigate to conversation selector
    navigation.navigate('ForwardMessage', {
      message,
      conversationId
    });
  };

  const handleReact = async (messageId, emoji) => {
    try {
      // Check if already reacted
      const message = messages.find(m => m.id === messageId);
      if (message?.reactions?.[emoji]?.includes(currentUserId)) {
        await removeReaction(conversationId, messageId, currentUserId, emoji);
      } else {
        await addReaction(conversationId, messageId, currentUserId, emoji);
      }
    } catch (error) {
      console.error('Error reacting:', error);
    }
  };

  const handleCopy = (message) => {
    Clipboard.setString(message.text);
    Alert.alert('Copied', 'Message copied to clipboard');
  };

  const handlePin = async (message) => {
    try {
      await pinMessage(conversationId, currentUserId, message.id);
      Alert.alert('Pinned', 'Message pinned');
    } catch (error) {
      console.error('Error pinning:', error);
    }
  };

  const handleAttachment = async () => {
    try {
      const handlePhotoVideo = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          if (Platform.OS === 'web') {
            window.alert('Please grant photo library access to send images.');
          } else {
            Alert.alert('Permission Required', 'Please grant photo library access to send images.');
          }
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images', 'videos'],
          allowsEditing: true,
          quality: 0.8,
          videoMaxDuration: 60,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];

          // On web, check if URI is accessible
          if (Platform.OS === 'web' && asset.uri && asset.uri.startsWith('file://')) {
            window.alert('Unable to access local file on web. Please try a different image.');
            return;
          }

          setUploadProgress('Uploading...');

          try {
            let uploadedUrl;
            if (asset.type === 'video') {
              uploadedUrl = await uploadVideoToHostinger(asset.uri, 'chat_videos');
            } else {
              uploadedUrl = await uploadImageToHostinger(asset.uri, 'chat_images');
            }

            // Send message with attachment
            const messageData = {
              senderId: currentUserId,
              type: asset.type === 'video' ? 'video' : 'image',
              url: uploadedUrl,
              createdAt: serverTimestamp(),
              status: {
                sent: serverTimestamp(),
                delivered: {},
                read: {}
              }
            };

            // Add reply context if replying
            if (replyTo) {
              messageData.replyTo = {
                messageId: replyTo.id,
                senderId: replyTo.senderId,
                text: replyTo.text,
                type: replyTo.type
              };
              setReplyTo(null);
            }

            await addDoc(
              collection(db, 'conversations', conversationId, 'messages'),
              messageData
            );

            // Update conversation last message
            await updateDoc(doc(db, 'conversations', conversationId), {
              lastMessage: {
                text: asset.type === 'video' ? '📹 Video' : '📷 Photo',
                senderId: currentUserId,
                timestamp: serverTimestamp(),
                type: asset.type === 'video' ? 'video' : 'image'
              },
              lastMessageTime: serverTimestamp()
            });

            setUploadProgress(null);

            // Scroll to bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          } catch (uploadError) {
            console.error('Upload error:', uploadError);
            setUploadProgress(null);
            if (Platform.OS === 'web') {
              window.alert('Upload Failed: Could not upload attachment. Please try again.');
            } else {
              Alert.alert('Upload Failed', 'Could not upload attachment. Please try again.');
            }
          }
        }
      };

      if (Platform.OS === 'web') {
        // On web, directly open photo/video picker
        handlePhotoVideo();
      } else {
        // On mobile, show options
        Alert.alert(
          'Send Attachment',
          'Choose attachment type',
          [
            {
              text: 'Photo/Video',
              onPress: handlePhotoVideo,
            },
            {
              text: 'Camera',
              onPress: async () => {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                  Alert.alert('Permission Required', 'Please grant camera access to take photos.');
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  allowsEditing: true,
                  quality: 0.8,
                });

                if (!result.canceled && result.assets[0]) {
                  const asset = result.assets[0];

                  setUploadProgress('Uploading...');

                  try {
                    const uploadedUrl = await uploadImageToHostinger(asset.uri, 'chat_images');

                    // Send message with attachment
                    const messageData = {
                      senderId: currentUserId,
                      type: 'image',
                      url: uploadedUrl,
                      createdAt: serverTimestamp(),
                      status: {
                        sent: serverTimestamp(),
                        delivered: {},
                        read: {}
                      }
                    };

                    // Add reply context if replying
                    if (replyTo) {
                      messageData.replyTo = {
                        messageId: replyTo.id,
                        senderId: replyTo.senderId,
                        text: replyTo.text,
                        type: replyTo.type
                      };
                      setReplyTo(null);
                    }

                    await addDoc(
                      collection(db, 'conversations', conversationId, 'messages'),
                      messageData
                    );

                    // Update conversation last message
                    await updateDoc(doc(db, 'conversations', conversationId), {
                      lastMessage: {
                        text: '📷 Photo',
                        senderId: currentUserId,
                        timestamp: serverTimestamp(),
                        type: 'image'
                      },
                      lastMessageTime: serverTimestamp()
                    });

                    setUploadProgress(null);

                    // Scroll to bottom
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  } catch (uploadError) {
                    console.error('Upload error:', uploadError);
                    setUploadProgress(null);
                    Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
                  }
                }
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {
      console.error('Attachment error:', error);
      if (Platform.OS === 'web') {
        window.alert('Error: Failed to select attachment. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to select attachment. Please try again.');
      }
    }
  };

  const handleInputFocus = () => {
    // When text input is focused, ensure emoji picker is closed
    console.log('Input focused, closing emoji picker');
    setShowEmojiPicker(false);
  };

  const handleEmojiPress = () => {
    console.log('Emoji button pressed, current state:', showEmojiPicker);
    if (showEmojiPicker) {
      // Close emoji picker and show keyboard
      setShowEmojiPicker(false);
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } else {
      // Dismiss keyboard and show emoji picker
      Keyboard.dismiss();
      setTimeout(() => {
        console.log('Setting emoji picker to true');
        setShowEmojiPicker(true);
      }, 150);
    }
  };

  const handleEmojiSelect = (emoji) => {
    console.log('Emoji selected:', emoji);
    setMessageText(prev => {
      const newText = prev + emoji;
      console.log('New message text:', newText);
      return newText;
    });
    // Don't close emoji picker, let user select multiple emojis
    // Don't auto-focus back to input - keep emoji picker open
  };

  const handleVoiceRecordStart = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Permission to record audio is required!');
        } else {
          Alert.alert('Permission Required', 'Permission to record audio is required!');
        }
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      if (Platform.OS === 'web') {
        window.alert('Failed to start recording');
      } else {
        Alert.alert('Error', 'Failed to start recording');
      }
    }
  };

  const handleVoiceRecordEnd = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      const duration = recordingDuration;
      setIsRecording(false);
      setRecordingDuration(0);

      if (!recording) return;

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      const uri = recording.getURI();
      setRecording(null);

      if (duration < 1) {
        if (Platform.OS === 'web') {
          window.alert('Voice message must be at least 1 second');
        } else {
          Alert.alert('Too Short', 'Voice message must be at least 1 second');
        }
        return;
      }

      // Upload audio file
      setUploadProgress('Uploading audio...');

      try {
        const audioUrl = await uploadAudioToHostinger(uri, 'chat_audio');

        // Create voice message
        const messageData = {
          senderId: currentUserId,
          type: 'voice',
          url: audioUrl,
          duration: duration,
          createdAt: serverTimestamp(),
          status: {
            sent: serverTimestamp(),
            delivered: {},
            read: {}
          }
        };

        // Add reply context if replying
        if (replyTo) {
          messageData.replyTo = {
            messageId: replyTo.id,
            senderId: replyTo.senderId,
            text: replyTo.text,
            type: replyTo.type
          };
          setReplyTo(null);
        }

        await addDoc(
          collection(db, 'conversations', conversationId, 'messages'),
          messageData
        );

        // Update conversation last message
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: {
            text: '🎤 Voice message',
            senderId: currentUserId,
            timestamp: serverTimestamp(),
            type: 'voice'
          },
          lastMessageTime: serverTimestamp()
        });

        setUploadProgress(null);

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        setUploadProgress(null);
        if (Platform.OS === 'web') {
          window.alert('Could not upload audio. Please try again.');
        } else {
          Alert.alert('Upload Failed', 'Could not upload audio. Please try again.');
        }
      }
    } catch (error) {
      console.error('Voice record end error:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to save recording');
      } else {
        Alert.alert('Error', 'Failed to save recording');
      }
    }
  };

  const handleActivityPress = () => {
    Keyboard.dismiss();
    setShowActivityModal(!showActivityModal);
    setShowColorPicker(false);
  };

  const handleColorPickerPress = () => {
    Keyboard.dismiss();
    setShowColorPicker(!showColorPicker);
    setShowActivityModal(false);
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

    setShowScrollButton(contentHeight - offsetY - scrollViewHeight > 100);
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {isGroup ? (
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => navigation.navigate('NewGroupInfo', { conversationId })}
            activeOpacity={0.7}
          >
            {conversationData?.groupIcon ? (
              <Image
                source={{ uri: conversationData.groupIcon }}
                style={styles.groupAvatar}
              />
            ) : (
              <View style={styles.groupAvatarPlaceholder}>
                <Ionicons name="people" size={20} color="#fff" />
              </View>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {conversationData?.groupName || groupName || 'Group'}
              </Text>
              {conversationData?.participants ? (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {conversationData.participants.length} members{conversationData.groupDescription ? ` • ${conversationData.groupDescription}` : ''}
                </Text>
              ) : typingUsers.length > 0 ? (
                <Text style={styles.typingIndicator}>typing...</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerInfo}
            onPress={() => {
              if (otherUserId) {
                navigation.navigate('Profile', { userId: otherUserId });
              }
            }}
            activeOpacity={0.7}
          >
            {otherUserData?.profileImage ? (
              <Image
                source={{ uri: otherUserData.profileImage }}
                style={[
                  styles.userAvatar,
                  Platform.OS === 'web' && { objectFit: 'cover' }
                ]}
                onError={(e) => {
                  console.log('❌ Failed to load user avatar:', otherUserData.profileImage);
                }}
              />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {otherUserData?.name || otherUserData?.username || 'User'}
              </Text>
              {otherUserId && (
                <View style={{ marginTop: 4 }}>
                  <SimpleInlineStatus
                    userId={otherUserId}
                  />
                </View>
              )}
              {typingUsers.length > 0 && (
                <Text style={styles.typingIndicator}>typing...</Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.headerActions}>
          {isGroup && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('NewGroupInfo', { conversationId })}
            >
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('ChatSettings', { conversationId })}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reply preview */}
      {replyTo && (
        <View style={styles.replyPreview}>
          <View style={styles.replyContent}>
            <Text style={styles.replyLabel}>Replying to</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages and Input Area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages Container */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageItem
                message={item}
                currentUserId={currentUserId}
                onLongPress={handleMessageLongPress}
                onReact={handleReact}
              />
            )}
            inverted
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={true}
            onContentSizeChange={() => {
              // Auto-scroll to bottom when new message arrives
              if (!showScrollButton) {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
              }
            }}
          />
        </View>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <ScrollToBottomButton onPress={scrollToBottom} />
        )}

        {/* Edit mode indicator */}
        {editMode && messageToEdit && (
          <View style={styles.editModeBar}>
            <View style={styles.editModeContent}>
              <Ionicons name="create-outline" size={16} color={ACCENT} />
              <Text style={styles.editModeText}>Edit message</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditMode(false);
                setMessageToEdit(null);
                setMessageText('');
              }}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Message input */}
        <MessageBox
          ref={messageInputRef}
          value={messageText}
          onChangeText={handleTextChange}
          onFocus={handleInputFocus}
          onSend={editMode ? async () => {
            if (messageToEdit) {
              await editMessage(conversationId, messageToEdit.id, messageText);
              setEditMode(false);
              setMessageToEdit(null);
              setMessageText('');
            }
          } : handleSendMessage}
          onAttachPress={handleAttachment}
          onEmojiPress={handleEmojiPress}
          onVoiceRecordStart={handleVoiceRecordStart}
          onVoiceRecordEnd={handleVoiceRecordEnd}
          onActivityPress={handleActivityPress}
          onColorPickerPress={handleColorPickerPress}
          selectedColor={selectedTextColor}
          sending={sending}
          inputMode={messageText.trim() ? 'send' : 'mic'}
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          placeholder={editMode ? 'Edit message...' : 'Message'}
        />

        {/* Color Picker */}
        {showColorPicker && (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Choose Text Color</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.colorPickerScroll}
              contentContainerStyle={styles.colorPickerContent}
            >
              {textColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedTextColor === color && styles.colorItemSelected
                  ]}
                  onPress={() => {
                    setSelectedTextColor(color);
                    setShowColorPicker(false);
                    messageInputRef.current?.focus();
                  }}
                >
                  {selectedTextColor === color && (
                    <Ionicons name="checkmark" size={20} color={color === '#fff' ? '#000' : '#fff'} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Activity Modal */}
        {showActivityModal && (
          <View style={styles.activityModalContainer}>
            <Text style={styles.activityModalTitle}>Activity Options</Text>
            <TouchableOpacity
              style={styles.activityOption}
              onPress={() => {
                setShowActivityModal(false);
                navigation.navigate('GroupAudioCall', {
                  conversationId: conversationId,
                  conversationName: isGroup ? groupName : otherUserData?.name || 'User'
                });
              }}
            >
              <Ionicons name="call" size={24} color="#00CED1" />
              <Text style={styles.activityOptionText}>Voice Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activityOption}
              onPress={() => {
                setShowActivityModal(false);
                navigation.navigate('ScreenSharingRoom', {
                  conversationId: conversationId,
                  conversationName: isGroup ? groupName : otherUserData?.name || 'User'
                });
              }}
            >
              <Ionicons name="tv" size={24} color="#DA70D6" />
              <Text style={styles.activityOptionText}>Screen Sharing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.activityOption}
              onPress={() => {
                setShowActivityModal(false);
                navigation.navigate('Roleplay', {
                  conversationId: conversationId,
                  conversationName: isGroup ? groupName : otherUserData?.name || 'User'
                });
              }}
            >
              <Ionicons name="people" size={24} color="#FFA500" />
              <Text style={styles.activityOptionText}>Roleplay</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <View style={styles.emojiPickerContainer}>
            <EmojiSelector
              onEmojiSelected={handleEmojiSelect}
              showSearchBar={false}
              showTabs={true}
              showHistory={true}
              showSectionTitles={true}
              category={undefined}
              columns={8}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Upload Progress Indicator */}
      {uploadProgress && (
        <View style={styles.uploadProgressContainer}>
          <ActivityIndicator size="small" color={ACCENT} />
          <Text style={styles.uploadProgressText}>{uploadProgress}</Text>
        </View>
      )}

      {/* Actions sheet */}
      <MessageActionsSheet
        visible={actionsVisible}
        message={selectedMessage}
        currentUserId={currentUserId}
        onClose={() => setActionsVisible(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReply={handleReply}
        onForward={handleForward}
        onReact={handleReact}
        onCopy={handleCopy}
        onPin={handlePin}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    ...(Platform.OS === 'web' && { height: '100vh' })
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333'
  },
  groupAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333'
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerTextContainer: {
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerButton: {
    padding: 4
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 12,
    marginTop: 2
  },
  typingIndicator: {
    color: ACCENT,
    fontSize: 12,
    marginTop: 2
  },
  messagesList: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12
  },
  replyContent: {
    flex: 1
  },
  replyLabel: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  replyText: {
    color: '#ccc',
    fontSize: 14
  },
  editModeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editModeText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  emojiPickerContainer: {
    height: 350,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  uploadProgressContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
    backgroundColor: CARD,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  uploadProgressText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  colorPickerContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  colorPickerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  colorPickerScroll: {
    maxHeight: 80,
  },
  colorPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: '#7C3AED',
  },
  activityModalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  activityModalTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: CARD,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  activityOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
