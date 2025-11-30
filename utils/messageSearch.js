// utils/messageSearch.js
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Search messages in a specific conversation
 * Note: For production, use Algolia or ElasticSearch for full-text search
 */
export async function searchMessagesInConversation(conversationId, searchTerm) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'));
  
  const allMessages = await getDocs(q);
  
  const results = allMessages.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(msg => 
      msg.text?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !msg.isDeleted
    );
  
  return results;
}

/**
 * Search across all user's conversations
 */
export async function searchAcrossAllConversations(userId, searchTerm) {
  // Get all user's conversations
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('participants', 'array-contains', userId));
  
  const conversations = await getDocs(q);
  const allResults = [];
  
  for (const convDoc of conversations.docs) {
    const messagesInConv = await searchMessagesInConversation(convDoc.id, searchTerm);
    allResults.push(...messagesInConv.map(msg => ({
      ...msg,
      conversationId: convDoc.id,
      conversationName: convDoc.data().groupName || 'Private Chat'
    })));
  }
  
  return allResults;
}

/**
 * Filter messages by type
 */
export async function filterMessagesByType(conversationId, messageType) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef, 
    where('type', '==', messageType),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get media messages (images, videos, files)
 */
export async function getMediaMessages(conversationId) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(
    messagesRef,
    where('type', 'in', ['image', 'video', 'file']),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
