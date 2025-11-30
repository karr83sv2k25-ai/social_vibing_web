// utils/userControls.js
import { 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Mute conversation
 */
export async function muteConversation(conversationId, userId, duration = null) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  const mutedUntil = duration ? new Date(Date.now() + duration) : null;
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.muted`]: true,
    [`userSettings.${userId}.mutedUntil`]: mutedUntil
  });
}

/**
 * Unmute conversation
 */
export async function unmuteConversation(conversationId, userId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.muted`]: false,
    [`userSettings.${userId}.mutedUntil`]: null
  });
}

/**
 * Archive conversation
 */
export async function archiveConversation(conversationId, userId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.archived`]: true
  });
}

/**
 * Unarchive conversation
 */
export async function unarchiveConversation(conversationId, userId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.archived`]: false
  });
}

/**
 * Block user
 */
export async function blockUser(currentUserId, userToBlockId) {
  const blockRef = doc(db, 'users', currentUserId, 'blocked', userToBlockId);
  
  await setDoc(blockRef, {
    blockedAt: serverTimestamp(),
    reason: null
  });
}

/**
 * Unblock user
 */
export async function unblockUser(currentUserId, userToUnblockId) {
  const blockRef = doc(db, 'users', currentUserId, 'blocked', userToUnblockId);
  await deleteDoc(blockRef);
}

/**
 * Clear chat history (only hides messages created before this point)
 */
export async function clearChatHistory(conversationId, userId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.clearedAt`]: serverTimestamp()
  });
}

/**
 * Pin message
 */
export async function pinMessage(conversationId, userId, messageId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.pinnedMessages`]: arrayUnion(messageId)
  });
}

/**
 * Unpin message
 */
export async function unpinMessage(conversationId, userId, messageId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.pinnedMessages`]: arrayRemove(messageId)
  });
}

/**
 * Set notification preference for conversation
 */
export async function setNotificationPreference(conversationId, userId, preference) {
  // preference: "all" | "mentions" | "off"
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.customNotifications`]: preference
  });
}

/**
 * Update last seen timestamp
 */
export async function updateLastSeen(conversationId, userId) {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  await updateDoc(conversationRef, {
    [`userSettings.${userId}.lastSeen`]: serverTimestamp()
  });
}

/**
 * Export chat history as text
 */
export async function exportChatHistory(conversationId, conversationName = 'Chat') {
  try {
    const { collection, query, orderBy, getDocs } = await import('firebase/firestore');
    
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    let chatText = `=== ${conversationName} ===\n`;
    chatText += `Exported on: ${new Date().toLocaleString()}\n`;
    chatText += `Total messages: ${snapshot.size}\n`;
    chatText += `${'='.repeat(50)}\n\n`;

    snapshot.forEach((doc) => {
      const msg = doc.data();
      const timestamp = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date();
      const dateStr = timestamp.toLocaleString();
      const sender = msg.senderName || 'Unknown';
      
      chatText += `[${dateStr}] ${sender}:\n`;
      
      if (msg.text) {
        chatText += `  ${msg.text}\n`;
      }
      
      if (msg.imageUrl) {
        chatText += `  📷 Image: ${msg.imageUrl}\n`;
      }
      
      if (msg.fileName) {
        chatText += `  📎 File: ${msg.fileName}\n`;
        if (msg.fileUrl) {
          chatText += `  Link: ${msg.fileUrl}\n`;
        }
      }
      
      if (msg.replyTo) {
        chatText += `  ↩️ Replied to: ${msg.replyTo.text || '(message)'}\n`;
      }
      
      chatText += '\n';
    });

    return chatText;
  } catch (error) {
    console.error('Error exporting chat:', error);
    throw error;
  }
}
