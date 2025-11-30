// utils/presenceHelpers.js
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  deleteField,
  writeBatch
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { db } from '../firebaseConfig';

/**
 * Mark messages as delivered
 */
export async function markMessagesAsDelivered(conversationId, messageIds, userId) {
  const batch = writeBatch(db);
  
  messageIds.forEach(messageId => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    batch.update(messageRef, {
      [`status.delivered.${userId}`]: serverTimestamp()
    });
  });
  
  await batch.commit();
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(conversationId, messageIds, userId) {
  const batch = writeBatch(db);
  
  messageIds.forEach(messageId => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    batch.update(messageRef, {
      [`status.read.${userId}`]: serverTimestamp()
    });
  });
  
  // Reset unread count
  const conversationRef = doc(db, 'conversations', conversationId);
  batch.update(conversationRef, {
    [`unreadCount.${userId}`]: 0
  });
  
  await batch.commit();
}

/**
 * Typing indicator
 */
let typingTimeout = null;

export async function setTypingStatus(conversationId, userId, isTyping) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  if (isTyping) {
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: serverTimestamp()
    });
    
    // Auto-clear after 5 seconds
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      updateDoc(conversationRef, {
        [`typing.${userId}`]: deleteField()
      }).catch(() => {});
    }, 5000);
  } else {
    clearTimeout(typingTimeout);
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: deleteField()
    }).catch(() => {});
  }
}

/**
 * Update user presence
 */
export async function updateUserPresence(userId, status) {
  const presenceRef = doc(db, 'user_presence', userId);
  
  await setDoc(presenceRef, {
    status, // online, offline, away
    lastSeen: serverTimestamp(),
    currentDevice: Platform.OS
  }, { merge: true });
}

/**
 * Track active conversation
 */
export async function setActiveConversation(userId, conversationId) {
  const presenceRef = doc(db, 'user_presence', userId);
  
  await updateDoc(presenceRef, {
    [`activeConversations.${conversationId}`]: {
      openedAt: serverTimestamp(),
      lastActivity: serverTimestamp()
    }
  });
}

/**
 * Clear active conversation
 */
export async function clearActiveConversation(userId, conversationId) {
  const presenceRef = doc(db, 'user_presence', userId);
  
  await updateDoc(presenceRef, {
    [`activeConversations.${conversationId}`]: deleteField()
  });
}

/**
 * Increment unread count for conversation
 */
export async function incrementUnreadCount(conversationId, userIds) {
  const conversationRef = doc(db, 'conversations', conversationId);
  const batch = writeBatch(db);
  
  userIds.forEach(userId => {
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: increment(1)
    });
  });
  
  await batch.commit();
}
