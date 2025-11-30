# Group Chat Quick Reference Guide

## 🚀 Quick Start

### 1. Add Navigation Routes
In `App.js`, add these screens:
```javascript
<Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
<Stack.Screen name="AddGroupMembers" component={AddGroupMembersScreen} />
<Stack.Screen name="GroupChat" component={GroupChatScreen} />
<Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
```

### 2. Add "New Group" Button
In your messages screen or menu:
```javascript
<TouchableOpacity onPress={() => navigation.navigate('CreateGroup')}>
  <Ionicons name="people" size={24} color="#fff" />
  <Text>New Group</Text>
</TouchableOpacity>
```

### 3. Import Required Screens
```javascript
import CreateGroupScreen from './screens/CreateGroupScreen';
import AddGroupMembersScreen from './screens/AddGroupMembersScreen';
// Add GroupChatScreen and GroupInfoScreen when implemented
```

---

## 📋 Common Code Snippets

### Fetch User's Groups
```javascript
useEffect(() => {
  const groupsRef = collection(db, 'users', currentUser.uid, 'groups');
  const q = query(groupsRef, orderBy('updatedAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const groupsList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setGroups(groupsList);
  });
  
  return () => unsubscribe();
}, []);
```

### Send Message to Group
```javascript
const sendMessage = async (text) => {
  if (!text.trim()) return;
  
  try {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    await addDoc(messagesRef, {
      text: text.trim(),
      senderId: currentUser.uid,
      senderName: currentUserName,
      senderImage: currentUserImage,
      type: 'text',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reactions: {},
      isPinned: false,
      isEdited: false,
      isDeleted: false,
    });
    
    // Update group last message
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      lastMessage: {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: currentUserName,
        timestamp: serverTimestamp(),
        type: 'text'
      },
      messageCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Add Reaction to Message
```javascript
const addReaction = async (messageId, emoji) => {
  const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
  
  try {
    await updateDoc(messageRef, {
      [`reactions.${emoji}`]: arrayUnion(currentUser.uid)
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
  }
};
```

### Remove Member from Group
```javascript
const removeMember = async (userId) => {
  if (!canRemoveMembers()) {
    Alert.alert('Permission Denied', 'You cannot remove members.');
    return;
  }
  
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      [`members.${userId}`]: deleteField(),
      memberCount: increment(-1),
    });
    
    // Remove from user's groups
    const userGroupRef = doc(db, 'users', userId, 'groups', groupId);
    await deleteDoc(userGroupRef);
    
    // Log activity
    const activityRef = collection(db, 'groups', groupId, 'activity');
    await addDoc(activityRef, {
      type: 'member_removed',
      performedBy: currentUser.uid,
      performedByName: currentUserName,
      affectedUser: userId,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing member:', error);
  }
};
```

### Check User Permission
```javascript
const canUserPerformAction = (action, userRole, settings) => {
  const roleHierarchy = { member: 1, moderator: 2, admin: 3 };
  
  const permissions = {
    sendMessage: settings.whoCanSendMessages === 'all' || roleHierarchy[userRole] >= 2,
    addMembers: settings.whoCanAddMembers === 'all' || roleHierarchy[userRole] >= 2,
    deleteAnyMessage: roleHierarchy[userRole] >= 2,
    pinMessage: roleHierarchy[userRole] >= 2,
    editGroup: roleHierarchy[userRole] >= 3,
    changeSettings: roleHierarchy[userRole] >= 3,
    promoteToModerator: roleHierarchy[userRole] >= 3,
  };
  
  return permissions[action] || false;
};
```

### Listen to Group Messages
```javascript
useEffect(() => {
  if (!groupId) return;
  
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messagesList = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .reverse(); // Oldest first
      
    setMessages(messagesList);
  });
  
  return () => unsubscribe();
}, [groupId]);
```

### Update User's Typing Status
```javascript
const updateTypingStatus = async (isTyping) => {
  const memberRef = doc(db, 'groups', groupId, 'members', currentUser.uid);
  
  try {
    await updateDoc(memberRef, {
      isTyping: isTyping,
      typingAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
};

// Usage
const handleTextChange = (text) => {
  setText(text);
  updateTypingStatus(text.length > 0);
};
```

### Pin/Unpin Message
```javascript
const togglePinMessage = async (messageId) => {
  if (!canPinMessages()) return;
  
  const groupRef = doc(db, 'groups', groupId);
  const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
  
  try {
    const groupDoc = await getDoc(groupRef);
    const pinnedMessages = groupDoc.data().pinnedMessages || [];
    const isPinned = pinnedMessages.includes(messageId);
    
    if (isPinned) {
      // Unpin
      await updateDoc(groupRef, {
        pinnedMessages: arrayRemove(messageId)
      });
      await updateDoc(messageRef, {
        isPinned: false,
        pinnedBy: null,
        pinnedAt: null,
      });
    } else {
      // Pin (max 3)
      if (pinnedMessages.length >= 3) {
        Alert.alert('Limit Reached', 'Maximum 3 messages can be pinned.');
        return;
      }
      await updateDoc(groupRef, {
        pinnedMessages: arrayUnion(messageId)
      });
      await updateDoc(messageRef, {
        isPinned: true,
        pinnedBy: currentUser.uid,
        pinnedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error toggling pin:', error);
  }
};
```

### Leave Group
```javascript
const leaveGroup = async () => {
  Alert.alert(
    'Leave Group',
    'Are you sure you want to leave this group?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, {
              [`members.${currentUser.uid}`]: deleteField(),
              memberCount: increment(-1),
            });
            
            const userGroupRef = doc(db, 'users', currentUser.uid, 'groups', groupId);
            await deleteDoc(userGroupRef);
            
            navigation.goBack();
          } catch (error) {
            console.error('Error leaving group:', error);
          }
        }
      }
    ]
  );
};
```

### Upload Group Photo
```javascript
const uploadGroupPhoto = async (imageUri) => {
  try {
    setUploading(true);
    
    // Upload to Hostinger
    const imageUrl = await uploadImageToHostinger(imageUri, 'group_images');
    
    // Update group
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      groupImage: imageUrl,
      updatedAt: serverTimestamp(),
    });
    
    setUploading(false);
    return imageUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    setUploading(false);
    throw error;
  }
};
```

---

## 🎯 Common Patterns

### Group Card Component
```javascript
const GroupCard = ({ group, onPress }) => (
  <TouchableOpacity style={styles.groupCard} onPress={onPress}>
    <View style={styles.groupImageContainer}>
      {group.groupImage ? (
        <Image source={{ uri: group.groupImage }} style={styles.groupImage} />
      ) : (
        <View style={[styles.groupImagePlaceholder, { backgroundColor: group.theme?.color }]}>
          <Text style={styles.groupEmoji}>{group.theme?.emoji || '👥'}</Text>
        </View>
      )}
    </View>
    
    <View style={styles.groupInfo}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        {group.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{group.unreadCount}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.lastMessage} numberOfLines={1}>
        {group.lastMessage?.text || 'No messages yet'}
      </Text>
      
      <View style={styles.groupMeta}>
        <Ionicons name="people" size={12} color="#9CA3AF" />
        <Text style={styles.memberCount}>{group.memberCount} members</Text>
        <Text style={styles.timestamp}>
          {formatTimestamp(group.updatedAt)}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);
```

### Message Bubble Component
```javascript
const MessageBubble = ({ message, isOwnMessage }) => (
  <View style={[styles.messageRow, isOwnMessage && styles.ownMessage]}>
    {!isOwnMessage && (
      <Image source={{ uri: message.senderImage }} style={styles.senderAvatar} />
    )}
    
    <View style={[
      styles.bubble,
      isOwnMessage ? styles.ownBubble : styles.otherBubble
    ]}>
      {!isOwnMessage && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}
      
      {message.replyTo && (
        <View style={styles.replyPreview}>
          <Text style={styles.replyText}>{message.replyTo.text}</Text>
        </View>
      )}
      
      <Text style={styles.messageText}>{message.text}</Text>
      
      {Object.keys(message.reactions || {}).length > 0 && (
        <View style={styles.reactions}>
          {Object.entries(message.reactions).map(([emoji, users]) => (
            <View key={emoji} style={styles.reaction}>
              <Text>{emoji}</Text>
              <Text style={styles.reactionCount}>{users.length}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.timestamp}>
        {formatTime(message.createdAt)}
        {isOwnMessage && message.readBy && ` ✓✓`}
      </Text>
    </View>
  </View>
);
```

---

## 📱 Navigation Examples

### Navigate to Group Chat
```javascript
navigation.navigate('GroupChat', {
  groupId: 'group123',
  groupName: 'Gaming Squad',
  groupImage: 'https://...',
});
```

### Navigate to Group Info
```javascript
navigation.navigate('GroupInfo', {
  groupId: 'group123',
});
```

### Navigate to Create Group
```javascript
navigation.navigate('CreateGroup', {
  selectedMembers: [] // or pre-selected array
});
```

### Navigate to Add Members
```javascript
navigation.navigate('AddGroupMembers', {
  groupId: 'group123',
  currentMembers: [...existingMembers],
  returnScreen: 'GroupInfo'
});
```

---

## 🔧 Utility Functions

### Format Timestamp
```javascript
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};
```

### Extract Mentions
```javascript
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
};
```

### Generate Invite Link
```javascript
const generateInviteLink = (groupId) => {
  return `https://socialvibing.app/group/${groupId}`;
  // or deep link: socialvibing://group/${groupId}
};
```

---

## 🎨 Theming

### Apply Group Theme
```javascript
const getThemeColors = (themeColor) => ({
  primary: themeColor,
  primaryLight: themeColor + '33',
  primaryDark: adjustColor(themeColor, -20),
});

// Usage in styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: getThemeColors(group.theme.color).primaryLight,
  },
  button: {
    backgroundColor: getThemeColors(group.theme.color).primary,
  },
});
```

---

## ⚠️ Error Handling

### Comprehensive Error Handler
```javascript
const handleGroupError = (error, action) => {
  console.error(`Error ${action}:`, error);
  
  let message = 'Something went wrong. Please try again.';
  
  if (error.code === 'permission-denied') {
    message = 'You don\'t have permission to perform this action.';
  } else if (error.code === 'not-found') {
    message = 'Group not found.';
  } else if (error.code === 'unauthenticated') {
    message = 'Please sign in to continue.';
  }
  
  Alert.alert('Error', message);
};
```

---

## 📊 Performance Tips

1. **Pagination**: Load messages in batches of 50
2. **Caching**: Cache recent messages locally
3. **Image Optimization**: Compress images before upload
4. **Lazy Loading**: Load media only when visible
5. **Debouncing**: Debounce typing indicators
6. **Indexes**: Create Firestore indexes for common queries

### Example Pagination
```javascript
const [lastVisible, setLastVisible] = useState(null);
const [hasMore, setHasMore] = useState(true);

const loadMoreMessages = async () => {
  if (!hasMore) return;
  
  let q = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  if (lastVisible) {
    q = query(q, startAfter(lastVisible));
  }
  
  const snapshot = await getDocs(q);
  
  if (snapshot.docs.length < 50) {
    setHasMore(false);
  }
  
  setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
  // Process messages...
};
```

---

## 🔍 Debugging Checklist

- [ ] Check Firestore rules are deployed
- [ ] Verify user is authenticated
- [ ] Confirm user is member of group
- [ ] Check network connectivity
- [ ] Verify Firestore indexes exist
- [ ] Check console for errors
- [ ] Validate data structure matches schema
- [ ] Test with real-time listeners active

---

**Quick Reference v1.0** | *Last Updated: November 28, 2025*
