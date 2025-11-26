# Message Box Architecture - WhatsApp-Style Implementation

## Overview

This document explains how our message box system works, implementing WhatsApp-style persistent input with advanced UX features.

## 1. Persistent Input Field (Message Box UI Behaviour)

### Core Principles
- **Always Visible**: Message box stays fixed at bottom, never disappears during scrolling
- **Auto-resize**: Expands automatically as user types long messages (up to 100px height)
- **Multi-modal**: Supports text, emoji, attachments, and voice recording
- **Constant Availability**: User always feels chat is active and ready to respond

### Implementation
```javascript
// MessageBox.js - Fixed positioning with auto-resize TextInput
<View style={styles.container}> {/* Fixed at bottom */}
  <TextInput
    multiline
    maxHeight={100}
    style={styles.input}
  />
</View>
```

### Features
- ✅ Emoji picker integration
- ✅ Attachment support (images, videos, documents)
- ✅ Voice recording (long press microphone)
- ✅ Auto-expanding text area (4 lines max)
- ✅ Character count display (when >80% capacity)

---

## 2. Navigation Flow

### 2.1 Opening a Chat

**Flow:**
```
Chat List → Tap Chat → Chat Screen
```

**Parameters Passed:**
```javascript
navigation.navigate('Chat', {
  chatId: 'unique_chat_id',
  user: {
    name: 'User Name',
    avatar: 'url',
    handle: '@username'
  },
  unreadCount: 3
})
```

**What Loads:**
1. Message list (last 50 messages initially)
2. Message box (with restored draft if any)
3. Keyboard state (remembered from last session)
4. Scroll position (bottom by default)

**UX Goal:** Smooth, instant entry with recent messages visible

### 2.2 Handling Back Navigation

**Smart Back Button Logic:**
```javascript
BackHandler.addEventListener('hardwareBackPress', () => {
  if (keyboardVisible) {
    Keyboard.dismiss();
    return true; // Prevent navigation
  }
  return false; // Allow navigation back to chat list
});
```

**Behavior:**
1. **First Press**: Closes keyboard (if open)
2. **Second Press**: Navigates back to chat list
3. **Draft Preservation**: Typed (unsent) message is automatically saved

**Example:**
> You typed "Hey, how are you?" but didn't send → Press back → Return to chat → Message is still there!

---

## 3. State Management Inside the Message Box

### 3.1 Input State

**Managed States:**
```javascript
const {
  messageText,        // Text inside message box
  setMessageText,     // Update text
  cursorPosition,     // Current cursor position
  isTyping,          // Whether user is actively typing
  clearMessage,      // Clear after send
} = useChatState(chatId);
```

**Draft Storage:**
```javascript
// Persisted to AsyncStorage per chat
const DRAFT_STORAGE_KEY = '@chat_drafts';

// Structure:
{
  "chat_user123": "Hey, how are you?",
  "chat_user456": "See you tomorrow!",
  "group_abc": "Great idea!"
}
```

**Auto-save Logic:**
- Draft saved **automatically** on every text change (debounced 500ms)
- Draft loaded when chat opens
- Draft cleared when message sent
- Drafts persist across app restarts

### 3.2 Keyboard State

**Tracked States:**
```javascript
const {
  keyboardHeight,     // Height of keyboard (for spacing)
  keyboardVisible,    // Boolean: keyboard open/closed
  handleKeyboardShow, // Listener for keyboard show
  handleKeyboardHide, // Listener for keyboard hide
} = useChatState(chatId);
```

**Automatic Adjustments:**
```javascript
// When keyboard opens:
useEffect(() => {
  if (keyboardVisible && shouldAutoScroll) {
    flatListRef.current?.scrollToEnd({ animated: true });
  }
}, [keyboardVisible]);
```

**UX Goal:** 
- User should always see what they're replying to
- Message list scrolls up automatically when keyboard opens
- Latest messages remain visible above keyboard

### 3.3 Scroll State

**Managed States:**
```javascript
const {
  shouldAutoScroll,      // Should auto-scroll on new messages?
  showScrollToBottom,    // Show floating scroll button?
  isUserScrolling,       // User actively reading old messages?
  handleScroll,          // Scroll event handler
} = useChatState(chatId);
```

**Smart Scroll Logic:**
```javascript
const handleScroll = (event) => {
  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
  const distanceFromBottom = 
    contentSize.height - layoutMeasurement.height - contentOffset.y;
  
  // Show scroll-to-bottom button if scrolled up >100px
  setShowScrollToBottom(distanceFromBottom > 100);
  
  // Enable auto-scroll if within 50px of bottom
  setShouldAutoScroll(distanceFromBottom < 50);
  
  // Track if user is reading history
  setIsUserScrolling(distanceFromBottom > 50);
};
```

**Behaviors:**
1. **New message arrives + user at bottom** → Auto-scroll ✅
2. **New message arrives + user reading history** → No scroll, show badge 🔴
3. **User scrolls up** → Show floating "scroll to bottom" button
4. **User taps scroll button** → Smooth scroll + clear unread badge

---

## 4. Real-Time Typing Indicators

### Implementation
```javascript
// Typing detection with 2-second timeout
useEffect(() => {
  if (messageText.trim()) {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  } else {
    setIsTyping(false);
  }
}, [messageText]);
```

### Broadcast Logic
```javascript
// Send typing status to other participants
if (isTyping) {
  firestore()
    .collection('chats')
    .doc(chatId)
    .update({
      typingUsers: firestore.FieldValue.arrayUnion(currentUserId)
    });
}
```

### Display
```javascript
// Header subtitle shows typing status
<Text style={styles.headerStatus}>
  {isTyping ? 'typing...' : isOnline ? 'online' : 'offline'}
</Text>
```

**UX Benefits:**
- Improves perceived responsiveness
- Shows only while actively typing (not just focused)
- Stops after 2 seconds of inactivity
- Multiple users: "John, Sarah, and 2 others are typing..."

---

## 5. Input Mode Switching

### Dynamic Button Logic

**State-based Icon:**
```javascript
const inputMode = messageText.trim() ? 'send' : 'mic';
```

| State | Right-side Button | Action |
|-------|------------------|--------|
| Empty textbox | 🎤 Mic button | Long press to record voice |
| Text present | ➤ Send button | Tap to send message |
| Recording | ⏹ Stop button | Release to send voice |
| Loading | ⏳ Spinner | Message being sent |

### Voice Recording
```javascript
// Long press detection (200ms minimum)
const handleMicPressIn = () => {
  micPressTimer.current = setTimeout(() => {
    onVoiceRecordStart(); // Start recording after 200ms
  }, 200);
};

const handleMicPressOut = () => {
  clearTimeout(micPressTimer.current);
  if (isRecording) {
    onVoiceRecordEnd(); // Stop and send
  }
};
```

**Recording UI:**
```
🔴 Recording... 0:15  ← Release to send
```

---

## 6. Safety & UX Enhancements

### 6.1 Draft Persistence
```javascript
// Auto-save draft when switching chats
useEffect(() => {
  return () => {
    // On unmount, save current text as draft
    if (messageText.trim()) {
      saveDraft(chatId, messageText);
    }
  };
}, []);
```

### 6.2 Network Status Handling

**Offline Mode:**
```javascript
if (!isOnline) {
  return (
    <View style={styles.statusBar}>
      <Ionicons name="cloud-offline" size={16} color="#ef4444" />
      <Text>Waiting for network...</Text>
    </View>
  );
}
```

**Behavior:**
- Send button disabled when offline
- Messages queued for sending when reconnected
- Visual indicator: "Waiting for network..."

### 6.3 Blocked Contact Handling

```javascript
if (isBlocked) {
  return (
    <View style={styles.statusBar}>
      <Ionicons name="ban" size={16} color="#ef4444" />
      <Text>You can't send messages to this chat</Text>
    </View>
  );
}
```

### 6.4 Character Limit

```javascript
<TextInput
  maxLength={500}
  value={messageText}
/>

{/* Show count when >80% capacity */}
{messageText.length > 400 && (
  <Text style={styles.charCount}>
    {messageText.length}/500
  </Text>
)}
```

---

## 7. Component Architecture

### File Structure
```
/hooks
  └── useChatState.js         # Chat state management hook
/components
  ├── MessageBox.js           # Main message input component
  └── ScrollToBottomButton.js # Floating scroll button
/screens
  └── EnhancedChatScreen.js   # Complete chat implementation
```

### Data Flow
```
User Types
    ↓
useChatState Hook
    ↓
Update messageText state
    ↓
Auto-save draft to AsyncStorage
    ↓
Update inputMode (mic → send)
    ↓
Trigger typing indicator
    ↓
User Presses Send
    ↓
handleSend() → Add message
    ↓
clearMessage() → Clear input + draft
    ↓
Auto-scroll to bottom
```

---

## 8. Key Features Summary

| Feature | Status | Description |
|---------|--------|-------------|
| 🔒 Persistent Input | ✅ | Always visible at bottom |
| 💾 Draft Saving | ✅ | Auto-save per chat |
| ⌨️ Keyboard Handling | ✅ | Smart dismiss + auto-scroll |
| 📜 Scroll Management | ✅ | Auto-scroll + manual button |
| ⌨️ Typing Indicators | ✅ | Real-time broadcast |
| 🎤 Voice Recording | ✅ | Long press mic button |
| 📤 Mode Switching | ✅ | Mic ↔ Send dynamic |
| 🌐 Network Status | ✅ | Offline detection |
| 🚫 Block Handling | ✅ | Disable when blocked |
| 📏 Character Limit | ✅ | 500 chars with counter |
| 🔙 Back Navigation | ✅ | Keyboard-first logic |
| 📱 Platform Support | ✅ | iOS + Android |

---

## 9. Usage Example

```javascript
import EnhancedChatScreen from './EnhancedChatScreen';

// In your navigator
<Stack.Screen 
  name="Chat" 
  component={EnhancedChatScreen}
  options={{ headerShown: false }}
/>

// Navigate from chat list
navigation.navigate('Chat', {
  chatId: 'chat_123',
  user: {
    name: 'John Doe',
    avatar: 'https://...',
    handle: '@johndoe'
  }
});
```

---

## 10. Interview Explanation Template

**"My message box works like WhatsApp's. Here's how:"**

1. **Persistent & Fixed**: The message box always stays at the bottom of the screen, even when scrolling through old messages. This gives users a sense of constant availability.

2. **Smart State Management**: I use a custom `useChatState` hook that manages:
   - Input text with auto-save drafts per chat
   - Keyboard state with automatic scroll adjustments
   - Typing indicators with 2-second timeout
   - Scroll position to prevent interrupting users reading history

3. **Draft Persistence**: When you type a message but don't send it, the text is automatically saved to AsyncStorage. When you return to the chat, your unsent message is restored.

4. **Intelligent Navigation**: The back button first closes the keyboard if open, then navigates back to the chat list. This prevents accidental exits.

5. **Dynamic Input Mode**: The input switches between mic and send button:
   - Empty → Mic (long press to record voice)
   - Text present → Send button
   - Recording → Stop button with duration counter

6. **Auto-Scroll Behavior**: 
   - If user is at bottom, new messages auto-scroll
   - If user is reading old messages, no auto-scroll (shows floating button + unread badge)
   - Keyboard opening automatically scrolls to show latest messages

7. **Safety Features**:
   - Network status detection ("Waiting for network...")
   - Blocked contact handling
   - Character limit (500) with counter
   - Message queuing when offline

This creates a smooth, responsive chat experience that feels native and professional.

---

## 11. Performance Optimizations

### Debounced Draft Saving
```javascript
// Only save after 500ms of no typing
const debouncedSave = useCallback(
  debounce((text) => saveDraft(chatId, text), 500),
  [chatId]
);
```

### Optimized Scroll
```javascript
// Use FlatList for large message lists
<FlatList
  data={messages}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={21}
  removeClippedSubviews={true}
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
  }}
/>
```

### Memoized Components
```javascript
const MessageBubble = React.memo(({ item }) => (
  <View style={styles.bubble}>
    <Text>{item.text}</Text>
  </View>
));
```

---

## Conclusion

This architecture provides a production-ready, WhatsApp-style chat experience with:
- ✅ Smooth UX with no janky scrolling
- ✅ Reliable draft persistence
- ✅ Smart keyboard and scroll handling
- ✅ Professional real-time features
- ✅ Offline-first architecture
- ✅ Performance optimizations

All components are modular, reusable, and thoroughly documented.
