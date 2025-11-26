# Integration Guide - WhatsApp-Style Message Box

## Quick Start

### Step 1: Add Navigation Route

Update your navigation stack to include the EnhancedChatScreen:

```javascript
// In your navigation file (e.g., App.js or navigation.js)
import EnhancedChatScreen from './EnhancedChatScreen';

<Stack.Screen 
  name="Chat" 
  component={EnhancedChatScreen}
  options={{ headerShown: false }}
/>
```

### Step 2: Navigate from Chat List

```javascript
// In your chat list screen (e.g., messagescreen.js)
<TouchableOpacity
  onPress={() => navigation.navigate('Chat', {
    chatId: `chat_${item.id}`,
    user: {
      id: item.id,
      name: item.name,
      handle: item.handle,
      avatar: item.avatar
    }
  })}
>
  {/* Your chat list item UI */}
</TouchableOpacity>
```

### Step 3: Connect to Firebase (for real messages)

Update `EnhancedChatScreen.js` to load messages from Firestore:

```javascript
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Inside EnhancedChatScreen component
useEffect(() => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      from: doc.data().senderId === currentUser.id ? 'me' : 'them',
    }));
    setMessages(msgs);
  });

  return () => unsubscribe();
}, [chatId]);
```

---

## Using the Components Separately

### 1. Use MessageBox Component Only

If you just want the enhanced message input:

```javascript
import { MessageBox } from './components/MessageBox';
import { useChatState } from './hooks/useChatState';

function YourChatScreen() {
  const chatId = 'your_chat_id';
  const {
    messageText,
    setMessageText,
    inputMode,
    clearMessage,
  } = useChatState(chatId);

  const handleSend = () => {
    // Your send logic
    console.log('Sending:', messageText);
    clearMessage();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Your existing chat UI */}
      
      <MessageBox
        value={messageText}
        onChangeText={setMessageText}
        onSend={handleSend}
        inputMode={inputMode}
      />
    </View>
  );
}
```

### 2. Add Scroll-to-Bottom Button

```javascript
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import { useChatState } from './hooks/useChatState';

function YourChatScreen() {
  const { showScrollToBottom, handleScroll } = useChatState(chatId);
  const flatListRef = useRef(null);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      
      <ScrollToBottomButton
        visible={showScrollToBottom}
        onPress={scrollToBottom}
        unreadCount={5}
      />
    </View>
  );
}
```

---

## Customization

### Change Colors

Edit `MessageBox.js` and `EnhancedChatScreen.js`:

```javascript
const ACCENT = "#7C3AED";  // Your primary color
const BG = "#0B0B0E";      // Background color
const CARD = "#17171C";     // Card/input background
```

### Adjust Character Limit

```javascript
<MessageBox
  maxLength={1000}  // Default is 500
  value={messageText}
  onChangeText={setMessageText}
/>
```

### Disable Voice Recording

```javascript
<MessageBox
  onVoiceRecordStart={undefined}  // Remove voice handler
  onVoiceRecordEnd={undefined}
/>
```

### Add Emoji Picker

Install emoji picker:
```bash
npm install emoji-mart-native
```

Update your screen:
```javascript
import EmojiSelector from 'emoji-mart-native';

const [showEmojiPicker, setShowEmojiPicker] = useState(false);

<MessageBox
  onEmojiPress={() => setShowEmojiPicker(true)}
/>

{showEmojiPicker && (
  <EmojiSelector
    onEmojiSelected={(emoji) => {
      setMessageText(prev => prev + emoji.native);
      setShowEmojiPicker(false);
    }}
  />
)}
```

---

## Integrating with Existing Chat (groupinfo.js)

If you want to enhance your existing `groupinfo.js` chat:

### Option 1: Replace Message Input

```javascript
// In groupinfo.js, replace your existing input section with:
import { MessageBox } from './components/MessageBox';
import { useChatState } from './hooks/useChatState';

// Inside component
const {
  messageText: chatInput,
  setMessageText: setChatInput,
  inputMode,
  clearMessage,
} = useChatState(communityId);

// Replace your TextInput with:
<MessageBox
  value={chatInput}
  onChangeText={setChatInput}
  onSend={handleSendMessage}
  inputMode={inputMode}
  selectedColor={selectedTextColor}
/>
```

### Option 2: Add Draft Saving Only

```javascript
import { useChatState } from './hooks/useChatState';

const { messageText, setMessageText } = useChatState(communityId);

// Use messageText instead of your current state
// Drafts will auto-save!
```

---

## Testing

### Test Draft Persistence

1. Open a chat
2. Type a message (don't send)
3. Navigate back
4. Return to the chat
5. ✅ Message should be restored

### Test Keyboard Handling

1. Open a chat
2. Tap input (keyboard opens)
3. Press back button
4. ✅ Keyboard closes (doesn't navigate)
5. Press back again
6. ✅ Navigate back to list

### Test Auto-Scroll

1. Open a chat with many messages
2. Scroll up to read history
3. Receive a new message (or send one)
4. ✅ Should NOT auto-scroll
5. ✅ Should show floating button
6. Tap floating button
7. ✅ Smooth scroll to bottom

### Test Input Mode

1. Message box empty
2. ✅ Shows mic icon
3. Type any text
4. ✅ Changes to send icon
5. Clear text
6. ✅ Back to mic icon

---

## Troubleshooting

### Draft Not Saving

Check AsyncStorage permissions:
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test storage
AsyncStorage.setItem('test', 'value')
  .then(() => console.log('Storage works!'))
  .catch(err => console.error('Storage error:', err));
```

### Keyboard Overlapping Input

Adjust `keyboardVerticalOffset` in `KeyboardAvoidingView`:
```javascript
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
>
```

### Messages Not Auto-Scrolling

Ensure `shouldAutoScroll` is true when at bottom:
```javascript
// Check scroll position
const handleScroll = (event) => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const isNearBottom = 
    contentSize.height - layoutMeasurement.height - contentOffset.y < 50;
  setShouldAutoScroll(isNearBottom);
};
```

---

## Performance Tips

### 1. Use FlatList Instead of ScrollView

```javascript
<FlatList
  data={messages}
  renderItem={renderMessage}
  keyExtractor={(item) => item.id}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={21}
  removeClippedSubviews={true}
/>
```

### 2. Memoize Message Components

```javascript
const MessageBubble = React.memo(({ item }) => (
  <View style={styles.bubble}>
    <Text>{item.text}</Text>
  </View>
));
```

### 3. Debounce Draft Saving

Already implemented in `useChatState.js` with 500ms debounce.

---

## Next Steps

1. **Add Image/Video Attachments**: Use `expo-image-picker`
2. **Add Voice Recording**: Use `expo-av` for audio recording
3. **Add Typing Indicators**: Broadcast typing status via Firestore
4. **Add Read Receipts**: Track message read status
5. **Add Message Reactions**: Long press to add emoji reactions
6. **Add Reply/Forward**: Add message context menu

---

## Support

For questions or issues:
1. Check the comprehensive docs: `MESSAGE_BOX_ARCHITECTURE.md`
2. Review the example implementation: `EnhancedChatScreen.js`
3. Test with the provided example data first

---

## Files Overview

```
/hooks
  └── useChatState.js           # State management hook (250 lines)
/components
  ├── MessageBox.js             # Input component (300 lines)
  └── ScrollToBottomButton.js   # Scroll button (60 lines)
/screens
  └── EnhancedChatScreen.js     # Complete example (400 lines)
/docs
  ├── MESSAGE_BOX_ARCHITECTURE.md  # Detailed explanation
  └── INTEGRATION_GUIDE.md         # This file
```

**Total Code**: ~1000 lines of production-ready, documented code.

Happy coding! 🚀
