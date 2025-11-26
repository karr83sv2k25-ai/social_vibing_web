# Quick Reference - WhatsApp Message Box

## 🚀 Quick Start (3 Steps)

```javascript
// 1. Add to navigation
<Stack.Screen name="Chat" component={EnhancedChatScreen} />

// 2. Navigate to chat
navigation.navigate('Chat', {
  chatId: 'chat_123',
  user: { name: 'John', avatar: 'url' }
});

// 3. That's it! Everything works automatically
```

---

## 📦 Import Paths

```javascript
import { useChatState } from './hooks/useChatState';
import { MessageBox } from './components/MessageBox';
import { ScrollToBottomButton } from './components/ScrollToBottomButton';
import EnhancedChatScreen from './EnhancedChatScreen';
```

---

## 🎣 Hook Usage

```javascript
const {
  // Input
  messageText,         // string
  setMessageText,      // (text: string) => void
  clearMessage,        // () => void
  isTyping,           // boolean

  // Keyboard
  keyboardVisible,     // boolean
  keyboardHeight,      // number
  
  // Scroll
  shouldAutoScroll,    // boolean
  showScrollToBottom,  // boolean
  handleScroll,        // (event) => void
  
  // Input Mode
  inputMode,          // 'mic' | 'send'
  isRecording,        // boolean
  setIsRecording,     // (bool) => void
  
  // Network
  isOnline,           // boolean
} = useChatState(chatId);
```

---

## 🎨 MessageBox Props

```javascript
<MessageBox
  // Required
  value={text}
  onChangeText={setText}
  onSend={handleSend}
  
  // Optional
  onEmojiPress={() => {}}
  onAttachPress={() => {}}
  onVoiceRecordStart={() => {}}
  onVoiceRecordEnd={() => {}}
  isLoading={false}
  isOnline={true}
  isBlocked={false}
  inputMode="mic"
  isRecording={false}
  recordingDuration={0}
  maxLength={500}
  selectedColor="#fff"
  placeholder="Message"
  disabled={false}
/>
```

---

## 📍 ScrollToBottomButton Props

```javascript
<ScrollToBottomButton
  visible={true}
  onPress={() => scrollToBottom()}
  unreadCount={5}
/>
```

---

## 🔑 Key Functions

### Send Message
```javascript
const handleSend = async () => {
  const text = messageText.trim();
  if (!text) return;
  
  // Add to Firestore
  await addDoc(collection(db, 'messages'), {
    text,
    senderId: currentUser.id,
    timestamp: serverTimestamp()
  });
  
  // Clear input and draft
  clearMessage();
};
```

### Scroll to Bottom
```javascript
const scrollToBottom = () => {
  flatListRef.current?.scrollToEnd({ animated: true });
};
```

### Handle Scroll
```javascript
<FlatList
  onScroll={handleScroll}
  scrollEventThrottle={16}
/>
```

---

## 🎯 Common Patterns

### Pattern 1: Basic Chat
```javascript
function ChatScreen() {
  const { messageText, setMessageText, clearMessage } = useChatState(chatId);
  
  const handleSend = () => {
    console.log('Send:', messageText);
    clearMessage();
  };
  
  return (
    <MessageBox
      value={messageText}
      onChangeText={setMessageText}
      onSend={handleSend}
    />
  );
}
```

### Pattern 2: With Scroll Button
```javascript
function ChatScreen() {
  const { showScrollToBottom } = useChatState(chatId);
  const flatListRef = useRef(null);
  
  return (
    <>
      <FlatList ref={flatListRef} />
      <ScrollToBottomButton
        visible={showScrollToBottom}
        onPress={() => flatListRef.current?.scrollToEnd()}
      />
    </>
  );
}
```

### Pattern 3: With Voice Recording
```javascript
const [recording, setRecording] = useState(false);

<MessageBox
  onVoiceRecordStart={() => setRecording(true)}
  onVoiceRecordEnd={() => {
    setRecording(false);
    // Process recording
  }}
  isRecording={recording}
/>
```

---

## 🐛 Common Issues & Fixes

### Issue: Draft not saving
```javascript
// ✅ Fix: Check AsyncStorage permissions
import AsyncStorage from '@react-native-async-storage/async-storage';
AsyncStorage.setItem('test', 'value')
  .then(() => console.log('Works!'))
  .catch(err => console.error(err));
```

### Issue: Keyboard overlaps input
```javascript
// ✅ Fix: Adjust keyboardVerticalOffset
<KeyboardAvoidingView
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
/>
```

### Issue: Messages not auto-scrolling
```javascript
// ✅ Fix: Ensure shouldAutoScroll is true
useEffect(() => {
  if (shouldAutoScroll) {
    flatListRef.current?.scrollToEnd({ animated: true });
  }
}, [messages.length]);
```

### Issue: Back button doesn't close keyboard
```javascript
// ✅ Fix: Add BackHandler listener
useEffect(() => {
  const handler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (keyboardVisible) {
      Keyboard.dismiss();
      return true;
    }
    return false;
  });
  return () => handler.remove();
}, [keyboardVisible]);
```

---

## 🎨 Styling Quick Reference

### Colors
```javascript
const ACCENT = "#7C3AED";  // Primary purple
const BG = "#0B0B0E";      // Dark background
const CARD = "#17171C";     // Input/card bg
const TEXT_DIM = "#9CA3AF"; // Muted text
```

### MessageBox Container
```javascript
container: {
  backgroundColor: BG,
  borderTopWidth: 1,
  borderTopColor: '#1F1F25',
  paddingBottom: Platform.OS === 'ios' ? 20 : 10,
}
```

### Input Field
```javascript
input: {
  flex: 1,
  minHeight: 36,
  maxHeight: 100,
  backgroundColor: CARD,
  borderRadius: 18,
  paddingHorizontal: 16,
  color: '#fff',
}
```

---

## 📊 Performance Settings

### FlatList Optimization
```javascript
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

### Debounce Draft Saving
```javascript
// Already handled in useChatState
// Saves after 500ms of no typing
```

---

## 🧪 Testing Checklist

```
[ ] Draft saves when typing
[ ] Draft restores on return
[ ] Draft clears after send
[ ] Keyboard opens smoothly
[ ] Back button closes keyboard
[ ] Auto-scrolls when at bottom
[ ] No auto-scroll when reading
[ ] Scroll button appears/hides
[ ] Mic/Send button switches
[ ] Voice recording works
[ ] Offline mode works
[ ] Character limit shows
```

---

## 📱 Platform Differences

### iOS
```javascript
KeyboardAvoidingView behavior="padding"
keyboardVerticalOffset={90}
Keyboard events: keyboardWillShow/Hide
```

### Android
```javascript
KeyboardAvoidingView behavior="height"
keyboardVerticalOffset={20}
Keyboard events: keyboardDidShow/Hide
BackHandler for back button
```

---

## 🔧 Customization

### Change Max Length
```javascript
<MessageBox maxLength={1000} />
```

### Change Colors
```javascript
<MessageBox selectedColor="#00FF00" />
```

### Disable Voice
```javascript
<MessageBox
  onVoiceRecordStart={undefined}
  onVoiceRecordEnd={undefined}
/>
```

### Custom Placeholder
```javascript
<MessageBox placeholder="Write something..." />
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `MESSAGE_BOX_ARCHITECTURE.md` | Complete technical docs |
| `INTEGRATION_GUIDE.md` | Step-by-step setup |
| `IMPLEMENTATION_SUMMARY.md` | What was built |
| `VISUAL_ARCHITECTURE.md` | Diagrams & flows |
| `QUICK_REFERENCE.md` | This file (cheat sheet) |

---

## 🎓 Interview Questions & Answers

**Q: How does draft persistence work?**
> A: Drafts are saved to AsyncStorage per chat ID whenever the user types. The hook debounces saves to 500ms to avoid excessive writes. Drafts are restored when the chat reopens and cleared when messages are sent.

**Q: Why doesn't auto-scroll happen when I'm reading history?**
> A: The hook tracks scroll position. If you're >50px from bottom, it assumes you're reading history and disables auto-scroll. A floating button appears to let you manually scroll to bottom.

**Q: How does the mic/send button switch work?**
> A: The inputMode is derived from messageText: `messageText.trim() ? 'send' : 'mic'`. The MessageBox component renders different icons based on this mode.

**Q: What happens on back button press?**
> A: If keyboard is visible, it closes the keyboard first. Only on second press does it navigate back. This prevents accidental navigation when trying to close keyboard.

---

## 🚀 Next Steps

1. Test with your navigation setup
2. Connect to your Firestore
3. Customize colors/styles
4. Add emoji picker
5. Add image attachments
6. Deploy to production

---

## 💡 Pro Tips

- Use FlatList, not ScrollView (performance)
- Memoize message components
- Debounce draft saves (already done)
- Test on both iOS and Android
- Check AsyncStorage permissions
- Monitor scroll performance
- Use proper error handling

---

## 📞 Need Help?

1. Check `MESSAGE_BOX_ARCHITECTURE.md` for deep dive
2. Review `INTEGRATION_GUIDE.md` for setup steps
3. Look at `EnhancedChatScreen.js` for example
4. Check `VISUAL_ARCHITECTURE.md` for diagrams

---

**Last Updated**: November 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
