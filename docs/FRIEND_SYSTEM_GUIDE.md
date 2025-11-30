# Friend System Implementation Guide

## Overview
A complete friend system has been added to your app. Users can now:
- Search for other users by username or email
- Send/receive friend requests
- Accept or reject friend requests
- View only friends in the messages screen
- Remove friends

## Files Created/Modified

### New Files
1. **`utils/friendHelpers.js`** - Friend management utilities
   - `sendFriendRequest(toUserId)` - Send friend request
   - `acceptFriendRequest(requestId, fromUserId)` - Accept request
   - `rejectFriendRequest(requestId)` - Reject request
   - `cancelFriendRequest(requestId)` - Cancel sent request
   - `removeFriend(friendId)` - Remove friend
   - `getFriends(userId)` - Get all friend IDs
   - `checkIfFriends(userId1, userId2)` - Check friendship status
   - `getFriendRequests(type)` - Get pending requests ('received' or 'sent')
   - `getFriendshipStatus(userId)` - Get status between users

2. **`AddFriendsScreen.js`** - Complete friend management UI
   - Search tab - Search users and send requests
   - Requests tab - View received friend requests
   - Sent tab - View sent requests

### Modified Files
1. **`firestore.rules`** - Added security rules for:
   - `friend_requests` collection
   - `users/{userId}/friends/{friendId}` subcollection

2. **`firestore.indexes.json`** - Added composite indexes for:
   - Friend requests by recipient, status, and time
   - Friend requests by sender, status, and time

3. **`messagescreen.js`** - Updated to:
   - Only show friends in messages list
   - Real-time updates when friends list changes
   - Added "Add Friends" button in header

4. **`App.js`** - Added AddFriendsScreen to navigation

## Firestore Structure

### Collections

#### `friend_requests`
```
{
  fromUserId: string,      // User who sent request
  toUserId: string,        // User receiving request
  status: 'pending',       // Request status
  createdAt: timestamp,    // When request was sent
  acceptedAt: timestamp    // When accepted (optional)
}
```

#### `users/{userId}/friends/{friendId}`
```
{
  userId: string,          // Friend's user ID
  addedAt: timestamp       // When friendship was established
}
```

## How to Deploy

### 1. Deploy Firestore Rules
**Option A: Firebase CLI** (if Node.js v20+ installed)
```bash
firebase deploy --only firestore:rules
```

**Option B: Firebase Console**
1. Go to https://console.firebase.google.com
2. Select project: `social-vibing-karr`
3. Navigate to **Firestore Database** → **Rules**
4. Copy contents of `firestore.rules`
5. Paste in console
6. Click **Publish**

### 2. Deploy Firestore Indexes
**Option A: Firebase CLI**
```bash
firebase deploy --only firestore:indexes
```

**Option B: Firebase Console**
1. Navigate to **Firestore Database** → **Indexes**
2. Click **Composite** tab
3. Create these indexes:

**Index 1: Friend Requests (Received)**
- Collection: `friend_requests`
- Fields:
  - `toUserId` - Ascending
  - `status` - Ascending
  - `createdAt` - Descending

**Index 2: Friend Requests (Sent)**
- Collection: `friend_requests`
- Fields:
  - `fromUserId` - Ascending
  - `status` - Ascending
  - `createdAt` - Descending

### 3. Restart Your App
```bash
npx expo start --clear
```

## Usage Flow

### Adding a Friend
1. User taps "Add Friends" button (person-add icon) in Messages header
2. Searches for user by username or email
3. Taps "Add" button
4. Friend request sent
5. Button changes to "Cancel" (pending state)

### Receiving Friend Requests
1. User receives friend request (shows in "Requests" tab with badge count)
2. User sees requester's profile info
3. User can:
   - Accept: Both users become friends
   - Reject: Request is deleted

### Viewing Friends in Messages
1. Only friends appear in messages list
2. Real-time updates when friends are added/removed
3. Can start conversations with any friend
4. Auto-creates conversation on first message

## Features

### Search & Discovery
- Search by username, name, displayName, fullName, or email
- Case-insensitive search
- Shows friendship status for each user:
  - "Add" - Can send request
  - "Cancel" - Request pending
  - "Accept" - They sent you a request
  - "Friends" - Already friends

### Friend Requests
- View received requests with accept/reject options
- View sent requests with cancel option
- Badge count shows pending request count
- Real-time updates

### Security
- Users can only read their own friend requests
- Users can only send requests from their own account
- Users can only accept requests sent to them
- Users can only manage their own friends list
- All operations require authentication

## Testing

### Test the Complete Flow
1. **Create two test accounts**
   - Account A and Account B

2. **Send friend request (Account A)**
   - Open Messages → Tap "Add Friends"
   - Search for Account B
   - Tap "Add"
   - Verify button changes to "Cancel"

3. **Accept request (Account B)**
   - Open Messages → Tap "Add Friends"
   - Go to "Requests" tab
   - See Account A's request
   - Tap green checkmark
   - Verify they're now friends

4. **Verify messages screen**
   - Both accounts should see each other in messages
   - Can start conversations
   - Only friends appear in list

5. **Test search filtering**
   - Search should only show friends
   - Non-friends shouldn't appear in messages

## Customization

### Change Colors
In `AddFriendsScreen.js`, update these values:
```javascript
const ACCENT = '#7C3AED';  // Purple accent
const BG = '#000';         // Background
const CARD = '#1a1a1a';    // Card background
```

### Add Friend Count Badge
In `messagescreen.js` header, add badge to show friend count:
```javascript
<TouchableOpacity 
  style={styles.hIcon}
  onPress={() => navigation.navigate('AddFriends')}
>
  <Ionicons name="person-add-outline" size={20} color="#fff" />
  {friendRequests.length > 0 && (
    <View style={styles.requestBadge}>
      <Text style={styles.badgeText}>{friendRequests.length}</Text>
    </View>
  )}
</TouchableOpacity>
```

### Add "Remove Friend" Option
In conversation item, add long-press menu:
```javascript
<TouchableOpacity
  onLongPress={() => {
    Alert.alert(
      'Remove Friend',
      `Remove ${item.name} from friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            const { removeFriend } = await import('./utils/friendHelpers');
            await removeFriend(item.userId);
          }
        }
      ]
    );
  }}
>
  {/* Existing UI */}
</TouchableOpacity>
```

## Troubleshooting

### "Permission denied" errors
- Deploy Firestore rules (see Step 1)
- Check Firebase Console → Rules are published
- Verify user is authenticated

### "Index required" errors
- Deploy Firestore indexes (see Step 2)
- Wait 2-5 minutes for indexes to build
- Check Firebase Console → Indexes tab

### Friends not appearing in messages
- Verify friend request was accepted
- Check Firestore Console → `users/{userId}/friends` subcollection exists
- Restart app to refresh real-time listeners

### Search not finding users
- Verify users have `username` or `email` fields
- Check search is case-insensitive
- Verify user documents exist in Firestore

### Request count badge not updating
- Ensure real-time listener is active
- Check `loadFriendRequests()` is called on mount
- Verify Firestore rules allow reading requests

## Next Steps

1. **Deploy rules and indexes** (required)
2. **Test with two accounts** (verify it works)
3. **Customize UI** (optional - colors, badges)
4. **Add friend removal** (optional - from profile screen)
5. **Add friend suggestions** (optional - mutual friends, recommendations)

---

Your friend system is ready to use! Deploy the rules and indexes, then test the complete flow.
