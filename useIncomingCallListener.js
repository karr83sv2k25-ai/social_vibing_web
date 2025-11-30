import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { listenForIncomingCalls } from './callHelpers';

/**
 * Hook to listen for incoming calls globally
 * Add this to your root component (App.js or main navigation)
 * 
 * @param {string} userId - Current user ID
 */
export const useIncomingCallListener = (userId) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!userId) return;

    console.log('[CallListener] Starting to listen for calls for user:', userId);

    const unsubscribe = listenForIncomingCalls(userId, (callData) => {
      console.log('[CallListener] 📞 Incoming call from:', callData.callerName);
      
      // TODO: Add IncomingCallScreen to App.js navigation
      // For now, just log the incoming call
      console.log('[CallListener] Call data:', callData);
      
      // Navigation disabled until CallScreen is implemented
      // navigation.navigate('IncomingCallScreen', {
      //   callData,
      // });
    });

    return () => {
      console.log('[CallListener] Stopped listening for calls');
      unsubscribe();
    };
  }, [userId]);
};

/**
 * Example: How to add call button to user profile
 * 
 * Add this to any screen where you want to initiate a call (e.g., profile screen, chat screen)
 */

/*
import { initiateCall, CALL_TYPE, getUserActiveCall } from './callHelpers';
import { getAuth } from 'firebase/auth';
import { app as firebaseApp } from './firebaseConfig';

// Inside your component:
const handleVoiceCall = async () => {
  try {
    const auth = getAuth(firebaseApp);
    const currentUserId = auth.currentUser.uid;
    const currentUserName = auth.currentUser.displayName || 'User';
    
    // Check if user is already in a call
    const activeCall = await getUserActiveCall(currentUserId);
    if (activeCall) {
      Alert.alert('Already in Call', 'Please end your current call first');
      return;
    }
    
    // Show loading
    Alert.alert('Calling', 'Initiating call...');
    
    // Start call
    const callId = await initiateCall(
      currentUserId,           // Your ID
      currentUserName,         // Your name
      currentUser.profileImage, // Your image
      otherUser.id,            // User to call
      otherUser.name,          // Their name
      otherUser.profileImage,  // Their image
      CALL_TYPE.VOICE          // or CALL_TYPE.VIDEO
    );
    
    // Navigate to CallScreen
    navigation.navigate('CallScreen', {
      callId,
      isIncoming: false,
    });
  } catch (error) {
    if (error.message === 'User is busy') {
      Alert.alert('User Busy', 'This user is currently in another call');
    } else if (error.message === 'You are already in a call') {
      Alert.alert('Already in Call', 'Please end your current call first');
    } else if (error.message === 'Call already exists between these users') {
      Alert.alert('Call in Progress', 'There is already an active call with this user');
    } else {
      Alert.alert('Error', 'Failed to initiate call');
    }
  }
};

// UI Button:
<TouchableOpacity onPress={handleVoiceCall} style={styles.callButton}>
  <Ionicons name="call" size={24} color="#fff" />
  <Text style={styles.callButtonText}>Voice Call</Text>
</TouchableOpacity>
*/
