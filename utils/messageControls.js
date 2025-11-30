// utils/messageControls.js
import { 
  doc, 
  updateDoc, 
  deleteField, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  setDoc,
  collection,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Edit message
 */
export async function editMessage(conversationId, messageId, newText) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    text: newText,
    isEdited: true,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete message for me only
 */
export async function deleteMessageForMe(conversationId, messageId, userId) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    deletedFor: arrayUnion(userId)
  });
}

/**
 * Delete message for everyone
 */
export async function deleteMessageForEveryone(conversationId, messageId) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    isDeleted: true,
    text: 'This message was deleted',
    mediaUrl: deleteField(),
    updatedAt: serverTimestamp()
  });
}

/**
 * Add reaction to message
 */
export async function addReaction(conversationId, messageId, userId, emoji) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    [`reactions.${emoji}`]: arrayUnion(userId)
  });
}

/**
 * Remove reaction from message
 */
export async function removeReaction(conversationId, messageId, userId, emoji) {
  const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
  
  await updateDoc(messageRef, {
    [`reactions.${emoji}`]: arrayRemove(userId)
  });
}

/**
 * Forward message to multiple conversations
 */
export async function forwardMessage(sourceConversationId, messageId, targetConversationIds, userId) {
  // Get original message
  const messageDoc = await getDoc(doc(db, 'conversations', sourceConversationId, 'messages', messageId));
  
  if (!messageDoc.exists()) {
    throw new Error('Message not found');
  }
  
  const originalMessage = messageDoc.data();
  
  // Forward to each target conversation
  const batch = writeBatch(db);
  
  for (const targetConversationId of targetConversationIds) {
    const newMessageRef = doc(collection(db, 'conversations', targetConversationId, 'messages'));
    
    batch.set(newMessageRef, {
      senderId: userId,
      text: originalMessage.text,
      type: originalMessage.type,
      mediaUrl: originalMessage.mediaUrl || null,
      createdAt: serverTimestamp(),
      forwardedFrom: {
        conversationId: sourceConversationId,
        originalSenderId: originalMessage.senderId,
        originalTimestamp: originalMessage.createdAt
      },
      status: {
        sent: serverTimestamp(),
        delivered: {},
        read: {}
      }
    });
    
    // Update conversation's last message
    const conversationRef = doc(db, 'conversations', targetConversationId);
    batch.update(conversationRef, {
      lastMessage: {
        text: originalMessage.text,
        senderId: userId,
        timestamp: serverTimestamp(),
        type: originalMessage.type
      }
    });
  }
  
  await batch.commit();
}

/**
 * Reply to message
 */
export async function replyToMessage(conversationId, replyToMessageId, replyData, userId) {
  // Get original message
  const originalMessageDoc = await getDoc(
    doc(db, 'conversations', conversationId, 'messages', replyToMessageId)
  );
  
  if (!originalMessageDoc.exists()) {
    throw new Error('Original message not found');
  }
  
  const originalMessage = originalMessageDoc.data();
  
  // Create reply message
  const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'));
  
  await setDoc(messageRef, {
    senderId: userId,
    text: replyData.text,
    type: replyData.type || 'text',
    mediaUrl: replyData.mediaUrl || null,
    createdAt: serverTimestamp(),
    replyTo: {
      messageId: replyToMessageId,
      senderId: originalMessage.senderId,
      text: originalMessage.text,
      type: originalMessage.type
    },
    status: {
      sent: serverTimestamp(),
      delivered: {},
      read: {}
    }
  });
  
  return messageRef.id;
}
