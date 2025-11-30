# 1-on-1 Calling System

Complete voice/video calling system with ringing, answer/decline, and individual hangup.

## 🎯 Features

✅ **Call Initiation** - Start voice or video calls
✅ **Incoming Call Screen** - Beautiful ringing UI with vibration
✅ **Active Call Screen** - Mute, speaker, and end call controls
✅ **Call States** - Ringing, answered, declined, missed, busy, ended
✅ **Auto-timeout** - Calls auto-decline after 30 seconds
✅ **Individual Hangup** - Each person can end for themselves
✅ **Firestore Rules** - Secure call data access
✅ **Agora Integration** - High-quality audio/video

## 📁 Files Created

```
callHelpers.js              - Call management functions
IncomingCallScreen.js       - Ringing screen when receiving calls
CallScreen.js               - Active call screen
useIncomingCallListener.js  - Hook to listen for incoming calls
```

## 🔧 Setup Steps

### 1. Add Routes to Navigation

In your `App.js` or navigation file:

```javascript
import IncomingCallScreen from './IncomingCallScreen';
import CallScreen from './CallScreen';

// Add to your Stack Navigator:
<Stack.Screen 
  name="IncomingCallScreen" 
  component={IncomingCallScreen}
  options={{ 
    headerShown: false,
    presentation: 'fullScreenModal' // Important for call screens
  }}
/>
<Stack.Screen 
  name="CallScreen" 
  component={CallScreen}
  options={{ 
    headerShown: false,
    presentation: 'fullScreenModal'
  }}
/>
```

### 2. Add Call Listener to Root Component

In your root component or main navigation:

```javascript
import { useIncomingCallListener } from './useIncomingCallListener';
import { getAuth } from 'firebase/auth';

function App() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  // Listen for incoming calls globally
  useIncomingCallListener(userId);
  
  return (
    // Your app content
  );
}
```

### 3. Add Call Buttons to User Profiles

Example in `profile.js` or any user screen:

```javascript
import { initiateCall, CALL_TYPE } from './callHelpers';
import { getAuth } from 'firebase/auth';
import { app as firebaseApp } from './firebaseConfig';

const handleVoiceCall = async (otherUser) => {
  try {
    const auth = getAuth(firebaseApp);
    const currentUserId = auth.currentUser.uid;
    const currentUserName = auth.currentUser.displayName || 'User';
    const currentUserImage = null; // Get from your user data
    
    // Start call
    const callId = await initiateCall(
      currentUserId,
      currentUserName,
      currentUserImage,
      otherUser.id,
      otherUser.name,
      otherUser.profileImage,
      CALL_TYPE.VOICE // or CALL_TYPE.VIDEO
    );
    
    // Navigate to CallScreen
    navigation.navigate('CallScreen', {
      callId,
      isIncoming: false,
    });
  } catch (error) {
    if (error.message === 'User is busy') {
      Alert.alert('User Busy', 'This user is currently in another call');
    } else {
      Alert.alert('Error', 'Failed to initiate call');
    }
  }
};

// UI:
<TouchableOpacity onPress={() => handleVoiceCall(userProfile)}>
  <Ionicons name="call" size={24} color="#00d4aa" />
</TouchableOpacity>
```

## 📱 Call Flow

### Outgoing Call
1. User presses call button
2. `initiateCall()` creates call document in Firestore
3. Navigate to `CallScreen` with `isIncoming: false`
4. CallScreen shows "Calling..." status
5. When receiver answers, Agora channel joins
6. Call becomes active

### Incoming Call
1. Call listener detects new call
2. Navigate to `IncomingCallScreen` automatically
3. Screen shows caller info with ringing animation
4. Phone vibrates
5. User can answer or decline
6. If answer → Navigate to `CallScreen`
7. If decline → Call ends
8. Auto-decline after 30 seconds

### Active Call
1. Both users join Agora channel
2. Call timer starts
3. Controls: Mute, Speaker, End Call
4. Either user can end the call
5. Call ends only for that user (individual hangup)
6. When last user leaves, call document updates to 'ended'

## 🔐 Firestore Rules

Already deployed! Rules ensure:
- Only caller and receiver can read/update their calls
- Calls are properly scoped to participants
- Secure access control

## 🎨 UI Features

### IncomingCallScreen
- Pulsing caller image
- Animated ripple waves
- Vibration pattern
- Answer/Decline buttons
- Auto-timeout indicator

### CallScreen  
- Real-time call duration
- Connection status indicator
- Mute toggle with visual feedback
- Speaker toggle
- Large end call button
- Beautiful gradients

## 🔧 Agora Configuration

Make sure to:
1. Disable App Certificate in Agora Console (for testing with null token)
2. Or generate valid tokens for production

Current config in `agoraConfig.js`:
```javascript
token: null // For testing mode
```

## 📊 Call Data Structure

```javascript
{
  callerId: "user1_id",
  callerName: "John Doe",
  callerImage: "https://...",
  receiverId: "user2_id",
  receiverName: "Jane Smith",
  receiverImage: "https://...",
  callType: "voice", // or "video"
  status: "ringing", // ringing, answered, declined, missed, busy, ended
  channelName: "call_id", // Agora channel name
  createdAt: Timestamp,
  answeredAt: Timestamp,
  endedAt: Timestamp,
  duration: 45 // seconds
}
```

## 🚀 Testing

1. Build app: `npx expo run:android`
2. Open app on two devices
3. From user A → Open user B's profile → Press call button
4. On user B's device → IncomingCallScreen appears with ringing
5. User B answers
6. Both users now in CallScreen
7. Either user can end call individually

## 🆚 Difference from Group Voice Room

| Feature | Group Voice Room | 1-on-1 Calls |
|---------|-----------------|--------------|
| Participants | Multiple | Only 2 |
| Join | Anyone can join | Only caller/receiver |
| Ringing | No | Yes ✓ |
| Individual Hangup | No | Yes ✓ |
| Call States | Active only | Ringing, answered, declined, missed, ended |
| Notifications | No | Yes ✓ |
| Timeout | No | 30 seconds ✓ |

## 🎯 Next Steps

1. **Add to Profile Screen**: Add call button next to message button
2. **Add to Chat Screen**: Quick call from conversations
3. **Push Notifications**: Alert user when app is closed
4. **Call History**: Show recent calls list
5. **Video Support**: Enable camera for video calls

## 📞 Function Reference

### `initiateCall()`
Start a new call

### `answerCall(callId)`
Answer incoming call

### `declineCall(callId)`
Reject incoming call

### `endCall(callId, duration)`
End active call

### `listenForIncomingCalls(userId, callback)`
Listen for new calls

### `listenToCallStatus(callId, callback)`
Monitor call status changes

---

**Status**: ✅ Complete and ready to use!

Just add the navigation routes and call buttons to your UI.
