// ChatScreen.js — header visible (back + avatar + name + email + info icon)
import React, { useState, useLayoutEffect, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, serverTimestamp, getDoc, limit, where, getDocs, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';
import { uploadImageToHostinger } from './hostingerConfig';
import { uploadFileToHostinger, getFileIcon, formatFileSize, getFileTypeLabel } from './utils/fileUpload';
import { StickerPicker } from './components/StickerPicker';
import { AttachmentPicker } from './components/AttachmentPicker';
import { cacheMessages, getCachedMessages } from './utils/messageCache';
import * as WebBrowser from 'expo-web-browser';

const ACCENT = "#7C3AED";
const CYAN = "#08FFE2";
const BG = "#0B0B0E";
const CARD = "#17171C";
const TEXT_DIM = "#9CA3AF";
const GREEN = "#22C55E";

const FALLBACK_AVATAR = require("./assets/profile.png");

const Avatar = ({ name, size = 34, color = ACCENT, source }) => {
  const initials = useMemo(() => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [name]);

  return source ? (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: `${color}88`,
        backgroundColor: CARD,
      }}
      resizeMode="cover"
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `${color}33`,
        borderWidth: 1,
        borderColor: `${color}88`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>{initials}</Text>
    </View>
  );
};

export default function ChatScreen({ route, navigation }) {
  const scrollViewRef = useRef(null);
  const currentUser = auth.currentUser;
  
  const user = route?.params?.user || {
    name: "Ken Kaneki",
    handle: "ghoul123@gmail.com",
    avatar: FALLBACK_AVATAR,
  };
  
  const conversationId = route?.params?.conversationId;
  const otherUserId = route?.params?.otherUserId || route?.params?.user?.userId;
  const isGroupChat = route?.params?.isGroup || route?.params?.user?.isGroup || false;

  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [sending, setSending] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Check if user is blocked
  useEffect(() => {
    if (!currentUser || !otherUserId) return;

    const checkBlockStatus = async () => {
      try {
        const blockRef = doc(db, 'users', currentUser.uid, 'blocked', otherUserId);
        const blockDoc = await getDoc(blockRef);
        
        if (blockDoc.exists() && blockDoc.data()?.blocked === true) {
          setIsBlocked(true);
        } else {
          setIsBlocked(false);
        }
      } catch (error) {
        console.error('Error checking block status:', error);
      }
    };

    checkBlockStatus();
  }, [currentUser, otherUserId]);

  // Fetch messages from Firestore (OPTIMIZED with caching and limit)
  useEffect(() => {
    if (!conversationId || !currentUser) {
      setLoading(false);
      return;
    }

    // Load cached messages first for instant display
    getCachedMessages(conversationId).then(cached => {
      if (cached && cached.length > 0) {
        setMsgs(cached);
        setLoading(false);
      }
    });

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef, 
      orderBy('createdAt', 'desc'),
      limit(50) // Load last 50 messages initially
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            from: data.senderId === currentUser.uid ? 'me' : 'them',
            isMine: data.senderId === currentUser.uid,
            text: data.text || data.message || '',
            imageUrl: data.imageUrl || null,
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            fileSize: data.fileSize || null,
            fileType: data.fileType || null,
            type: data.type || 'text',
            time: formatTime(data.createdAt?.toDate()),
            createdAt: data.createdAt,
          };
        })
        .reverse(); // Reverse to show oldest first
      
      setMsgs(messages);
      setLoading(false);
      
      // Cache messages
      cacheMessages(conversationId, messages);
      
      // Scroll to bottom when new messages arrive
      requestAnimationFrame(() =>
        scrollViewRef.current?.scrollToEnd({ animated: true })
      );
    });

    return () => unsubscribe();
  }, [conversationId, currentUser]);

  const formatTime = (date) => {
    if (!date) return 'now';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const send = async () => {
    const message = text.trim();
    if (!message || !currentUser || sending) return;

    // Prevent sending if user is blocked
    if (isBlocked) {
      Alert.alert(
        'User Blocked',
        'You have blocked this user. Please unblock them to send messages.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Clear text immediately for better UX
    setText("");
    setSending(true);

    try {
      // Create conversation if it doesn't exist
      let convoId = conversationId;
      
      if (!convoId && otherUserId) {
        // Create new conversation
        const conversationRef = doc(collection(db, 'conversations'));
        convoId = conversationRef.id;
        
        await setDoc(conversationRef, {
          participants: [currentUser.uid, otherUserId],
          lastMessage: message,
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 1,
          },
        });
      }

      if (convoId) {
        // Add message to conversation
        const messagesRef = collection(db, 'conversations', convoId, 'messages');
        await addDoc(messagesRef, {
          text: message,
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        // Update conversation last message
        const conversationRef = doc(db, 'conversations', convoId);
        await setDoc(conversationRef, {
          lastMessage: message,
          lastMessageTime: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: (await getDoc(conversationRef)).data()?.unreadCount?.[otherUserId] + 1 || 1,
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      // Restore text if send failed
      setText(message);
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = async () => {
    try {
      const blockRef = doc(db, 'users', currentUser.uid, 'blocked', otherUserId);
      
      if (isBlocked) {
        // Unblock user
        await setDoc(blockRef, { blocked: false }, { merge: true });
        setIsBlocked(false);
        Alert.alert('User Unblocked', 'You can now send messages to this user.');
      } else {
        // Block user
        await setDoc(blockRef, { blocked: true, blockedAt: serverTimestamp() }, { merge: true });
        setIsBlocked(true);
        Alert.alert(
          'User Blocked', 
          'This user has been blocked. They will remain in your messages list but you cannot send messages until you unblock them.',
          [{ text: 'OK' }]
        );
      }
      setShowInfoModal(false);
    } catch (error) {
      console.error('Error toggling block:', error);
      Alert.alert('Error', 'Failed to update block status. Please try again.');
    }
  };

  // Handle sticker selection
  const handleStickerSelect = async (sticker) => {
    if (!currentUser || sending || isBlocked) return;

    setSending(true);

    try {
      let convoId = conversationId;
      
      if (!convoId && otherUserId) {
        const conversationRef = doc(collection(db, 'conversations'));
        convoId = conversationRef.id;
        
        await setDoc(conversationRef, {
          participants: [currentUser.uid, otherUserId],
          lastMessage: '🎨 Sticker',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 1,
          },
        });
      }

      if (convoId) {
        const messagesRef = collection(db, 'conversations', convoId, 'messages');
        await addDoc(messagesRef, {
          text: sticker,
          type: 'sticker',
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        const conversationRef = doc(db, 'conversations', convoId);
        await setDoc(conversationRef, {
          lastMessage: '🎨 Sticker',
          lastMessageTime: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: (await getDoc(conversationRef)).data()?.unreadCount?.[otherUserId] + 1 || 1,
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error sending sticker:', error);
      Alert.alert('Error', 'Failed to send sticker. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle image upload (Using Hostinger Storage)
  const handleImageSelected = async (imageAsset) => {
    if (!currentUser || isBlocked) return;

    setUploadingImage(true);

    try {
      // Validate image
      if (!imageAsset.uri) {
        throw new Error('Invalid image selected');
      }

      console.log('Starting image upload to Hostinger...', imageAsset.uri);

      // Upload to Hostinger
      const imageUrl = await uploadImageToHostinger(imageAsset.uri, 'chat_images');
      console.log('✅ Image uploaded to Hostinger:', imageUrl);

      // Send image message
      let convoId = conversationId;
      
      if (!convoId && otherUserId) {
        const conversationRef = doc(collection(db, 'conversations'));
        convoId = conversationRef.id;
        
        await setDoc(conversationRef, {
          participants: [currentUser.uid, otherUserId],
          lastMessage: '📷 Photo',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 1,
          },
        });
      }

      if (convoId) {
        const messagesRef = collection(db, 'conversations', convoId, 'messages');
        await addDoc(messagesRef, {
          text: '',
          imageUrl: imageUrl,
          type: 'image',
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        const conversationRef = doc(db, 'conversations', convoId);
        const convoDoc = await getDoc(conversationRef);
        const currentUnread = convoDoc.data()?.unreadCount?.[otherUserId] || 0;
        
        await setDoc(conversationRef, {
          lastMessage: '📷 Photo',
          lastMessageTime: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: currentUnread + 1,
        }, { merge: true });
      }

      console.log('✅ Photo sent successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Detailed error reporting
      let errorMessage = 'Failed to send photo. ';
      
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle file upload
  const handleFileSelected = async (file) => {
    if (!currentUser || isBlocked) return;

    setUploadingFile(true);

    try {
      // Validate file
      if (!file.uri) {
        throw new Error('Invalid file selected');
      }

      console.log('📁 Starting file upload to Hostinger...', file.name);

      // Upload to Hostinger
      const fileData = await uploadFileToHostinger(file, 'chat_files');
      console.log('✅ File uploaded to Hostinger:', fileData.url);

      // Send file message
      let convoId = conversationId;
      
      if (!convoId && otherUserId) {
        const conversationRef = doc(collection(db, 'conversations'));
        convoId = conversationRef.id;
        
        await setDoc(conversationRef, {
          participants: [currentUser.uid, otherUserId],
          lastMessage: `📎 ${file.name}`,
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.uid]: 0,
            [otherUserId]: 1,
          },
        });
      }

      if (convoId) {
        const messagesRef = collection(db, 'conversations', convoId, 'messages');
        await addDoc(messagesRef, {
          text: '',
          fileUrl: fileData.url,
          fileName: fileData.name,
          fileSize: fileData.size,
          fileType: fileData.type,
          type: 'file',
          senderId: currentUser.uid,
          createdAt: serverTimestamp(),
        });

        const conversationRef = doc(db, 'conversations', convoId);
        const convoDoc = await getDoc(conversationRef);
        const currentUnread = convoDoc.data()?.unreadCount?.[otherUserId] || 0;
        
        await setDoc(conversationRef, {
          lastMessage: `📎 ${file.name}`,
          lastMessageTime: serverTimestamp(),
          [`unreadCount.${otherUserId}`]: currentUnread + 1,
        }, { merge: true });
      }

      console.log('✅ File sent successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      
      let errorMessage = 'Failed to send file. ';
      if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploadingFile(false);
    }
  };

  // ✅ We build our own header manually
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Avatar name={user.name} size={40} source={user.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerName}>{user.name}</Text>
            <Text style={styles.headerEmail}>{user.handle}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => setShowInfoModal(true)}>
            <Ionicons name="information-circle-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 💬 Chat Section */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 10} // ⬆️ Keyboard slightly higher
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={ACCENT} />
            <Text style={{ color: TEXT_DIM, marginTop: 10 }}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {msgs.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
                <Ionicons name="chatbubbles-outline" size={64} color={TEXT_DIM} />
                <Text style={{ color: TEXT_DIM, marginTop: 16, fontSize: 16 }}>No messages yet</Text>
                <Text style={{ color: TEXT_DIM, marginTop: 4, fontSize: 12 }}>Send a message to start the conversation</Text>
              </View>
            ) : (
              msgs.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubbleRow,
                    m.from === "me" && styles.bubbleRight,
                  ]}
                >
                  {m.from !== "me" && (
                    <Avatar name={user.name} size={28} source={user.avatar} />
                  )}
                  <View
                    style={[
                      styles.bubble,
                      m.from === "me" ? styles.bubbleMe : styles.bubbleThem,
                      m.type === 'sticker' && styles.bubbleSticker,
                    ]}
                  >
                    {m.type === 'image' && m.imageUrl ? (
                      <>
                        <Image 
                          source={{ uri: m.imageUrl }} 
                          style={styles.messageImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.bubbleTime}>{m.time}</Text>
                      </>
                    ) : m.type === 'sticker' ? (
                      <>
                        <Text style={styles.stickerText}>{m.text}</Text>
                        <Text style={styles.bubbleTime}>{m.time}</Text>
                      </>
                    ) : m.type === 'file' && m.fileUrl ? (
                      <>
                        <TouchableOpacity 
                          style={styles.fileContainer}
                          onPress={() => {
                            Alert.alert(
                              'Download File',
                              `Do you want to download ${m.fileName}?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                  text: 'Open', 
                                  onPress: () => {
                                    // Open file in browser
                                    if (m.fileUrl) {
                                      WebBrowser.openBrowserAsync(m.fileUrl);
                                    }
                                  }
                                },
                              ]
                            );
                          }}
                        >
                          <View style={styles.fileIconContainer}>
                            <Ionicons 
                              name={getFileIcon(m.fileType, m.fileName)} 
                              size={32} 
                              color={ACCENT} 
                            />
                          </View>
                          <View style={styles.fileInfo}>
                            <Text style={styles.fileName} numberOfLines={2}>
                              {m.fileName || 'File'}
                            </Text>
                            <Text style={styles.fileDetails}>
                              {getFileTypeLabel(m.fileType, m.fileName)} • {formatFileSize(m.fileSize)}
                            </Text>
                          </View>
                          <Ionicons name="download-outline" size={20} color={TEXT_DIM} />
                        </TouchableOpacity>
                        <Text style={styles.bubbleTime}>{m.time}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.bubbleText}>{m.text}</Text>
                        <Text style={styles.bubbleTime}>{m.time}</Text>
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* ✍️ Message Composer */}
        {(uploadingImage || uploadingFile) && (
          <View style={styles.uploadingBar}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.uploadingText}>
              {uploadingImage ? 'Uploading image...' : 'Uploading file...'}
            </Text>
          </View>
        )}
        {isBlocked ? (
          <View style={styles.blockedBar}>
            <Ionicons name="ban" size={20} color="#EF4444" />
            <Text style={styles.blockedText}>
              You have blocked this user. Unblock them to send messages.
            </Text>
            <TouchableOpacity 
              style={styles.unblockButton}
              onPress={() => setShowInfoModal(true)}
            >
              <Text style={styles.unblockButtonText}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.composerBar}>
            <View style={styles.composerInner}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a message"
                placeholderTextColor={TEXT_DIM}
                style={styles.composerInput}
                multiline
                editable={!sending && !uploadingImage && !uploadingFile}
              />
              <TouchableOpacity 
                onPress={() => setShowStickerPicker(true)}
                disabled={uploadingImage || sending || uploadingFile}
                style={{ marginRight: 8 }}
              >
                <MaterialCommunityIcons 
                  name="sticker-emoji" 
                  size={20} 
                  color={uploadingImage || sending || uploadingFile ? "#444" : TEXT_DIM} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.plusBtn} 
                onPress={() => setShowAttachmentPicker(true)}
                disabled={uploadingImage || sending || uploadingFile}
              >
                <Ionicons 
                  name="add" 
                  size={18} 
                  color={uploadingImage || sending || uploadingFile ? "#666" : "#000"} 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={send} 
              style={styles.sendBtn} 
              disabled={sending || uploadingImage || uploadingFile}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="send" size={18} color="#000" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInfoModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Information</Text>
              <TouchableOpacity onPress={() => setShowInfoModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.userInfoRow}>
                <Avatar name={user.name} size={60} source={user.avatar} />
                <View style={styles.userInfoText}>
                  <Text style={styles.userInfoName}>{user.name}</Text>
                  <Text style={styles.userInfoHandle}>{user.handle}</Text>
                </View>
              </View>

              <View style={styles.modalDivider} />

              <TouchableOpacity
                style={[styles.modalButton, isBlocked && styles.modalButtonUnblock]}
                onPress={handleBlockToggle}
              >
                <Ionicons
                  name={isBlocked ? "checkmark-circle-outline" : "ban-outline"}
                  size={20}
                  color={isBlocked ? GREEN : "#EF4444"}
                />
                <Text style={[styles.modalButtonText, isBlocked && styles.modalButtonTextUnblock]}>
                  {isBlocked ? "Unblock User" : "Block User"}
                </Text>
              </TouchableOpacity>

              {isBlocked && (
                <Text style={styles.blockNotice}>
                  User is blocked. They will remain in your messages list but cannot send you messages.
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sticker Picker Modal */}
      <StickerPicker
        visible={showStickerPicker}
        onClose={() => setShowStickerPicker(false)}
        onSelectSticker={handleStickerSelect}
      />

      {/* Attachment Picker Modal */
      <AttachmentPicker
        visible={showAttachmentPicker}
        onClose={() => setShowAttachmentPicker(false)}
        onImageSelected={handleImageSelected}
        onFileSelected={handleFileSelected}
      />}
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  flex: { flex: 1 },

  customHeader: {
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F25",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  backBtn: { marginRight: 8 },
  headerName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  headerEmail: { color: TEXT_DIM, fontSize: 12 },
  headerRight: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12,
    paddingHorizontal: 6 
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${ACCENT}33`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${ACCENT}66`,
  },

  scrollContainer: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 100,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 8,
  },
  bubbleRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  bubbleThem: { backgroundColor: CARD, borderColor: "#23232A" },
  bubbleMe: { backgroundColor: `${ACCENT}33`, borderColor: `${ACCENT}66` },
  bubbleText: { color: "#fff" },
  bubbleTime: { color: TEXT_DIM, fontSize: 10, marginTop: 4, textAlign: "right" },

  // Message type specific styles
  bubbleSticker: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 4,
  },
  stickerText: {
    fontSize: 64,
    lineHeight: 70,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },

  // File message styles
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#23232A',
    minWidth: 200,
    maxWidth: 250,
    marginBottom: 4,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 8,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileDetails: {
    color: TEXT_DIM,
    fontSize: 11,
  },

  // Uploading indicator
  uploadingBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 70,
    padding: 10,
    backgroundColor: CARD,
    borderTopWidth: 1,
    borderTopColor: "#23232A",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadingText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '600',
  },

  composerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    backgroundColor: BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#19191F",
  },
  composerInner: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#23232A",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerInput: { flex: 1, color: "#fff", paddingVertical: 4, minHeight: 20 },
  plusBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CYAN,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    backgroundColor: CYAN,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  
  // Blocked bar styles
  blockedBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#1F1F25',
    borderTopWidth: 1,
    borderTopColor: '#EF444444',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockedText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
  },
  unblockButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#23232A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#23232A',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfoText: {
    marginLeft: 15,
    flex: 1,
  },
  userInfoName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfoHandle: {
    color: TEXT_DIM,
    fontSize: 14,
    marginTop: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#23232A',
    marginVertical: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF444420',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 10,
  },
  modalButtonUnblock: {
    backgroundColor: `${GREEN}20`,
    borderColor: GREEN,
  },
  modalButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextUnblock: {
    color: GREEN,
  },
  blockNotice: {
    color: TEXT_DIM,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },
});


