import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const ACCENT = '#8B2EF0';
const BG = '#0B0B0E';
const CARD = '#17171C';

export default function CommunityGroupChatScreen({ navigation, route }) {
  const { communityId, groupId, groupName, groupImage, groupEmoji, groupColor } = route?.params || {};
  const currentUser = auth.currentUser;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [groupData, setGroupData] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const scrollViewRef = useRef(null);

  // Fetch group data and check membership
  useEffect(() => {
    if (!communityId || !groupId || !currentUser?.uid) return;

    const fetchGroupData = async () => {
      try {
        const groupRef = doc(db, 'communities', communityId, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        
        if (groupSnap.exists()) {
          const data = groupSnap.data();
          setGroupData(data);
          
          // Check if user is already a member
          const memberRef = doc(db, 'communities', communityId, 'groups', groupId, 'members', currentUser.uid);
          const memberSnap = await getDoc(memberRef);
          setIsMember(memberSnap.exists());
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [communityId, groupId, currentUser?.uid]);

  // Listen to messages
  useEffect(() => {
    if (!communityId || !groupId) return;

    const messagesRef = collection(db, 'communities', communityId, 'groups', groupId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setMessages(messagesList);
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, (error) => {
      console.error('Error fetching messages:', error);
    });

    return () => unsubscribe();
  }, [communityId, groupId]);

  const handleJoinGroup = async () => {
    if (!currentUser?.uid) {
      Alert.alert('Error', 'Please login to join this group.');
      return;
    }

    setJoining(true);
    try {
      const groupRef = doc(db, 'communities', communityId, 'groups', groupId);
      
      // Get user info
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const userName = userData.name || userData.displayName || 'User';
      const userImage = userData.profileImage || userData.avatar || null;
      
      // Add member to members subcollection
      const memberRef = doc(db, 'communities', communityId, 'groups', groupId, 'members', currentUser.uid);
      await setDoc(memberRef, {
        userId: currentUser.uid,
        userName: userName,
        userImage: userImage,
        joinedAt: serverTimestamp(),
        role: 'member',
      });
      
      // Increment member count
      await updateDoc(groupRef, {
        memberCount: increment(1),
      });

      // Add join message
      const messagesRef = collection(db, 'communities', communityId, 'groups', groupId, 'messages');
      await addDoc(messagesRef, {
        senderId: 'system',
        senderName: 'System',
        senderImage: null,
        text: `${userName} joined the group`,
        type: 'system',
        createdAt: serverTimestamp(),
        isDeleted: false,
      });

      setIsMember(true);
      Alert.alert('Success', 'You have joined the group!');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !currentUser?.uid) return;

    setSending(true);
    try {
      // Get user info
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const userName = userData.name || userData.displayName || 'User';
      const userImage = userData.profileImage || userData.avatar || null;

      const messagesRef = collection(db, 'communities', communityId, 'groups', groupId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: userName,
        senderImage: userImage,
        text: text,
        type: 'text',
        createdAt: serverTimestamp(),
        isDeleted: false,
      });

      // Update group's last message and message count
      const groupRef = doc(db, 'communities', communityId, 'groups', groupId);
      await updateDoc(groupRef, {
        lastMessage: {
          text: text,
          senderId: currentUser.uid,
          senderName: userName,
          createdAt: serverTimestamp(),
        },
        messageCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
        <Text style={styles.loadingText}>Loading group...</Text>
      </View>
    );
  }

  if (!isMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{groupName || 'Group'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.joinContainer}>
          <View style={[styles.groupIconLarge, { backgroundColor: groupColor || ACCENT }]}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupIconLarge} />
            ) : (
              <Text style={{ fontSize: 48 }}>{groupEmoji || '💬'}</Text>
            )}
          </View>

          <Text style={styles.joinTitle}>{groupName}</Text>
          {groupData?.description && (
            <Text style={styles.joinDescription}>{groupData.description}</Text>
          )}

          <View style={styles.joinStats}>
            <View style={styles.joinStat}>
              <Ionicons name="people" size={20} color="#888" />
              <Text style={styles.joinStatText}>{groupData?.memberCount || 0} members</Text>
            </View>
            {groupData?.settings?.privacy === 'private' && (
              <View style={styles.joinStat}>
                <Ionicons name="lock-closed" size={20} color="#888" />
                <Text style={styles.joinStatText}>Private</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.joinButton, joining && styles.joinButtonDisabled]}
            onPress={handleJoinGroup}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.joinButtonText}>Join Group</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => navigation.navigate('GroupDetails', {
            communityId,
            groupId,
            groupName: groupName || groupData?.name,
            groupImage,
            groupEmoji,
            groupColor,
          })}
          activeOpacity={0.7}
        >
          <View style={[styles.groupIcon, { backgroundColor: groupColor || ACCENT }]}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupIcon} />
            ) : (
              <Text style={{ fontSize: 20 }}>{groupEmoji || '💬'}</Text>
            )}
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{groupName || 'Group'}</Text>
            <Text style={styles.headerSubtitle}>{groupData?.memberCount || 0} members</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupDetails', {
            communityId,
            groupId,
            groupName: groupName || groupData?.name,
            groupImage,
            groupEmoji,
            groupColor,
          })}
        >
          <Ionicons name="information-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.type === 'system' || msg.senderId === 'system';
              const isCurrentUser = msg.senderId === currentUser?.uid;

              if (isSystem) {
                return (
                  <View key={msg.id} style={styles.systemMessageContainer}>
                    <Text style={styles.systemMessageText}>{msg.text}</Text>
                  </View>
                );
              }

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.myMessage : styles.otherMessage,
                  ]}
                >
                  {!isCurrentUser && (
                    <TouchableOpacity
                      onPress={() => {
                        if (msg.senderId && msg.senderId !== 'system') {
                          navigation.navigate('Profile', { userId: msg.senderId });
                        }
                      }}
                    >
                      <Image
                        source={msg.senderImage ? { uri: msg.senderImage } : require('../assets/a1.png')}
                        style={styles.messageAvatar}
                      />
                    </TouchableOpacity>
                  )}
                  <View style={styles.messageContent}>
                    {!isCurrentUser && (
                      <TouchableOpacity
                        onPress={() => {
                          if (msg.senderId && msg.senderId !== 'system') {
                            navigation.navigate('Profile', { userId: msg.senderId });
                          }
                        }}
                      >
                        <Text style={styles.messageSender}>{msg.senderName || 'User'}</Text>
                      </TouchableOpacity>
                    )}
                    <View
                      style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.myMessageBubble : styles.otherMessageBubble,
                      ]}
                    >
                      <Text style={styles.messageText}>{msg.text}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '70%',
  },
  messageSender: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myMessageBubble: {
    backgroundColor: ACCENT,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  groupIconLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  joinTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  joinDescription: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  joinStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
  },
  joinStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinStatText: {
    color: '#888',
    fontSize: 14,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
