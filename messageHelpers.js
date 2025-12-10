// messageHelpers.js - Helper functions for messaging functionality
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Get or create a conversation between two users
 * @param {string} currentUserId - Current user's ID
 * @param {string} otherUserId - Other user's ID
 * @returns {Promise<string>} - Conversation ID
 */
export async function getOrCreateConversation(currentUserId, otherUserId) {
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId)
    );
    
    const snapshot = await getDocs(q);
    
    // Find existing conversation with the other user
    for (const docSnap of snapshot.docs) {
      const participants = docSnap.data().participants;
      // Support both array of strings and array of objects
      const hasUser = Array.isArray(participants) && participants.length > 0 &&
        (typeof participants[0] === 'string'
          ? participants.includes(otherUserId)
          : participants.some(p => p.userId === otherUserId));
      if (hasUser) {
        return docSnap.id;
      }
    }
    
    // Create new conversation if none exists
    const newConversationRef = doc(collection(db, 'conversations'));
    await setDoc(newConversationRef, {
      participants: [currentUserId, otherUserId],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
    });
    
    return newConversationRef.id;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
}

/**
 * Navigate to chat with a specific user
 * Usage: From profile screen, add a "Message" button that calls this
 * 
 * Example:
 * <TouchableOpacity onPress={() => startConversation(auth.currentUser.uid, profileUserId, navigation)}>
 *   <Text>Message</Text>
 * </TouchableOpacity>
 */
export async function startConversation(currentUserId, otherUserId, otherUserData, navigation) {
  try {
    const conversationId = await getOrCreateConversation(currentUserId, otherUserId);
    
    navigation.navigate('Chat', {
      user: {
        name: otherUserData.username || otherUserData.name || 'User',
        handle: otherUserData.email || '@user',
        avatar: otherUserData.profilePicture ? { uri: otherUserData.profilePicture } : null,
        userId: otherUserId,
      },
      conversationId,
      otherUserId,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    alert('Failed to start conversation. Please try again.');
  }
}
