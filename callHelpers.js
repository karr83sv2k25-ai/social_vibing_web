import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Call States
 */
export const CALL_STATUS = {
  RINGING: 'ringing',      // Call initiated, waiting for answer
  ANSWERED: 'answered',    // Call accepted and active
  DECLINED: 'declined',    // Call rejected by receiver
  MISSED: 'missed',        // Call not answered in time
  ENDED: 'ended',          // Call ended by either party
  BUSY: 'busy',            // Receiver is in another call
};

/**
 * Call Types
 */
export const CALL_TYPE = {
  VOICE: 'voice',
  VIDEO: 'video',
  GROUP_VOICE: 'group_voice',
  GROUP_VIDEO: 'group_video',
};

/**
 * Initiate a call to another user
 * @param {string} callerId - Current user ID
 * @param {string} callerName - Current user name
 * @param {string} callerImage - Current user profile image
 * @param {string} receiverId - User to call
 * @param {string} receiverName - Receiver's name
 * @param {string} receiverImage - Receiver's profile image
 * @param {string} callType - 'voice' or 'video'
 * @returns {Promise<string>} Call ID
 */
export const initiateCall = async (
  callerId,
  callerName,
  callerImage,
  receiverId,
  receiverName,
  receiverImage,
  callType = CALL_TYPE.VOICE
) => {
  try {
    // Validate required parameters
    if (!callerId || !receiverId) {
      throw new Error('Caller ID and Receiver ID are required');
    }
    if (!callerName || !receiverName) {
      throw new Error('Caller name and Receiver name are required');
    }

    // Simplified validation - just check for ANSWERED calls, not RINGING
    // This allows multiple call attempts without complex queries
    const callerActiveQuery = query(
      collection(db, 'calls'),
      where('callerId', '==', callerId),
      where('status', '==', CALL_STATUS.ANSWERED),
      limit(1)
    );
    const callerActive = await getDocs(callerActiveQuery);
    
    const callerAsReceiverQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', callerId),
      where('status', '==', CALL_STATUS.ANSWERED),
      limit(1)
    );
    const callerAsReceiver = await getDocs(callerAsReceiverQuery);
    
    if (!callerActive.empty || !callerAsReceiver.empty) {
      throw new Error('You are already in an active call');
    }

    // Check receiver
    const receiverActiveQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', receiverId),
      where('status', '==', CALL_STATUS.ANSWERED),
      limit(1)
    );
    const receiverActive = await getDocs(receiverActiveQuery);
    
    const receiverAsCallerQuery = query(
      collection(db, 'calls'),
      where('callerId', '==', receiverId),
      where('status', '==', CALL_STATUS.ANSWERED),
      limit(1)
    );
    const receiverAsCaller = await getDocs(receiverAsCallerQuery);
    
    if (!receiverActive.empty || !receiverAsCaller.empty) {
      throw new Error('User is busy');
    }

    // Create call document
    const callData = {
      callerId,
      callerName,
      callerImage: callerImage || null,
      receiverId,
      receiverName,
      receiverImage: receiverImage || null,
      callType,
      status: CALL_STATUS.RINGING,
      createdAt: serverTimestamp(),
      answeredAt: null,
      endedAt: null,
      duration: 0,
      channelName: null,
    };

    const callRef = await addDoc(collection(db, 'calls'), callData);
    
    await updateDoc(callRef, {
      channelName: callRef.id,
    });

    return callRef.id;
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
};

/**
 * Answer an incoming call
 * @param {string} callId - Call document ID
 */
export const answerCall = async (callId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: CALL_STATUS.ANSWERED,
      answeredAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error answering call:', error);
    throw error;
  }
};

/**
 * Decline an incoming call
 * @param {string} callId - Call document ID
 */
export const declineCall = async (callId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: CALL_STATUS.DECLINED,
      endedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error declining call:', error);
    throw error;
  }
};

/**
 * End an active call
 * @param {string} callId - Call document ID
 * @param {number} duration - Call duration in seconds
 */
export const endCall = async (callId, duration = 0) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: CALL_STATUS.ENDED,
      endedAt: serverTimestamp(),
      duration,
    });
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
};

/**
 * Mark call as missed (timeout)
 * @param {string} callId - Call document ID
 */
export const markCallAsMissed = async (callId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, {
      status: CALL_STATUS.MISSED,
      endedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking call as missed:', error);
    throw error;
  }
};

/**
 * Delete call document (cleanup)
 * @param {string} callId - Call document ID
 */
export const deleteCall = async (callId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await deleteDoc(callRef);
  } catch (error) {
    console.error('Error deleting call:', error);
    throw error;
  }
};

/**
 * Listen for incoming calls
 * @param {string} userId - Current user ID
 * @param {function} onIncomingCall - Callback when call received
 * @returns {function} Unsubscribe function
 */
export const listenForIncomingCalls = (userId, onIncomingCall) => {
  const q = query(
    collection(db, 'calls'),
    where('receiverId', '==', userId),
    where('status', '==', CALL_STATUS.RINGING),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const callData = {
          id: change.doc.id,
          ...change.doc.data(),
        };
        onIncomingCall(callData);
      }
    });
  });
};

/**
 * Listen for call status changes
 * @param {string} callId - Call document ID
 * @param {function} onStatusChange - Callback when status changes
 * @returns {function} Unsubscribe function
 */
export const listenToCallStatus = (callId, onStatusChange) => {
  const callRef = doc(db, 'calls', callId);
  
  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      const callData = {
        id: snapshot.id,
        ...snapshot.data(),
      };
      onStatusChange(callData);
    } else {
      // Call was deleted
      onStatusChange(null);
    }
  });
};

/**
 * Get call details
 * @param {string} callId - Call document ID
 * @returns {Promise<object>} Call data
 */
export const getCallDetails = async (callId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    const callSnap = await getDoc(callRef);
    
    if (callSnap.exists()) {
      return {
        id: callSnap.id,
        ...callSnap.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting call details:', error);
    throw error;
  }
};

/**
 * Check if user is currently in any active call
 * @param {string} userId - User ID to check
 * @returns {Promise<object|null>} Active call data or null
 */
export const getUserActiveCall = async (userId) => {
  try {
    // Check as caller
    const asCallerQuery = query(
      collection(db, 'calls'),
      where('callerId', '==', userId),
      where('status', 'in', [CALL_STATUS.RINGING, CALL_STATUS.ANSWERED]),
      limit(1)
    );
    const asCallerSnap = await getDocs(asCallerQuery);
    
    if (!asCallerSnap.empty) {
      return {
        id: asCallerSnap.docs[0].id,
        ...asCallerSnap.docs[0].data(),
      };
    }
    
    // Check as receiver
    const asReceiverQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', userId),
      where('status', 'in', [CALL_STATUS.RINGING, CALL_STATUS.ANSWERED]),
      limit(1)
    );
    const asReceiverSnap = await getDocs(asReceiverQuery);
    
    if (!asReceiverSnap.empty) {
      return {
        id: asReceiverSnap.docs[0].id,
        ...asReceiverSnap.docs[0].data(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking active call:', error);
    return null;
  }
};

/**
 * Clean up old ended calls (optional - for housekeeping)
 * @param {number} olderThanHours - Delete calls older than X hours (default 24)
 */
export const cleanupOldCalls = async (olderThanHours = 24) => {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);
    
    const oldCallsQuery = query(
      collection(db, 'calls'),
      where('status', 'in', [CALL_STATUS.ENDED, CALL_STATUS.DECLINED, CALL_STATUS.MISSED]),
      where('endedAt', '<', cutoffTime)
    );
    
    const oldCalls = await getDocs(oldCallsQuery);
    const deletePromises = oldCalls.docs.map(doc => deleteDoc(doc.ref));
    
    await Promise.all(deletePromises);
    console.log(`Cleaned up ${oldCalls.size} old calls`);
  } catch (error) {
    console.error('Error cleaning up old calls:', error);
  }
};

/**
 * Initiate a group call
 * @param {string} callerId - User starting the call
 * @param {string} callerName - Caller's name
 * @param {string} callerImage - Caller's profile image
 * @param {string} groupId - Community/Group ID
 * @param {string} groupName - Community/Group name
 * @param {string} callType - 'group_voice' or 'group_video'
 * @returns {Promise<string>} Call ID
 */
export const initiateGroupCall = async (
  callerId,
  callerName,
  callerImage,
  groupId,
  groupName,
  callType = CALL_TYPE.GROUP_VOICE
) => {
  try {
    // Validate required parameters
    if (!callerId || !groupId) {
      console.error('[GroupCall] Missing IDs:', { callerId, groupId });
      throw new Error('Caller ID and Group ID are required');
    }
    if (!callerName || !groupName) {
      console.error('[GroupCall] Missing names:', { callerName, groupName });
      throw new Error('Caller name and Group name are required');
    }

    console.log('[GroupCall] Creating call with:', {
      callerId,
      callerName,
      groupId,
      groupName,
      callType
    });

    // Create call document
    const callData = {
      callerId,
      callerName,
      callerImage: callerImage || null,
      groupId,
      groupName,
      callType,
      status: CALL_STATUS.RINGING,
      createdAt: serverTimestamp(),
      answeredAt: null,
      endedAt: null,
      duration: 0,
      participants: [{
        userId: callerId,
        userName: callerName,
        profileImage: callerImage || null,
        joinedAt: serverTimestamp(),
        isMuted: false,
        isSpeaking: false,
      }],
      channelName: null, // Will be set to callId after creation
      isActive: true,
    };

    const callRef = await addDoc(collection(db, 'calls'), callData);
    
    console.log('[GroupCall] Call document created:', callRef.id);
    
    // Update with channel name
    await updateDoc(callRef, {
      channelName: callRef.id,
    });

    console.log('[GroupCall] Channel name updated');
    
    return callRef.id;
  } catch (error) {
    console.error('Error initiating group call:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    throw error;
  }
};

/**
 * Join a group call
 * @param {string} callId - Call document ID
 * @param {string} userId - User joining
 * @param {string} userName - User's name
 * @param {string} userImage - User's profile image
 */
export const joinGroupCall = async (callId, userId, userName, userImage) => {
  try {
    const callRef = doc(db, 'calls', callId);
    const callSnap = await getDoc(callRef);
    
    if (!callSnap.exists()) {
      throw new Error('Call not found');
    }

    const callData = callSnap.data();
    const participants = callData.participants || [];
    
    // Check if user already in call
    const alreadyJoined = participants.some(p => p.userId === userId);
    if (alreadyJoined) {
      return; // Already in call
    }

    // Add participant
    await updateDoc(callRef, {
      participants: [...participants, {
        userId,
        userName,
        profileImage: userImage || null,
        joinedAt: serverTimestamp(),
        isMuted: false,
        isSpeaking: false,
      }],
      status: CALL_STATUS.ANSWERED, // Mark as answered when first person joins
    });
  } catch (error) {
    console.error('Error joining group call:', error);
    throw error;
  }
};

/**
 * Leave a group call
 * @param {string} callId - Call document ID
 * @param {string} userId - User leaving
 */
export const leaveGroupCall = async (callId, userId) => {
  try {
    const callRef = doc(db, 'calls', callId);
    const callSnap = await getDoc(callRef);
    
    if (!callSnap.exists()) {
      return;
    }

    const callData = callSnap.data();
    const participants = (callData.participants || []).filter(p => p.userId !== userId);
    
    // If no participants left, end the call
    if (participants.length === 0) {
      await updateDoc(callRef, {
        status: CALL_STATUS.ENDED,
        endedAt: serverTimestamp(),
        participants: [],
        isActive: false,
      });
    } else {
      await updateDoc(callRef, {
        participants,
      });
    }
  } catch (error) {
    console.error('Error leaving group call:', error);
    throw error;
  }
};
