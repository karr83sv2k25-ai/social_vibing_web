# Testing Guide - Friend System & Messages

## Current Status
The friend system is now fully implemented. Here's how everything works:

## How It Works

### 1. Users Must Be Friends First
- The messages screen **only shows friends**
- You must add friends before you can message them
- This is intentional for privacy and spam prevention

### 2. Adding Friends
1. Open Messages screen
2. Tap the **person-add icon** (top right)
3. Go to **Search** tab
4. Search by:
   - First name
   - Last name
   - Email
   - Username (if set)
5. Tap **Add** to send friend request
6. Friend receives request in **Requests** tab

### 3. Accepting Friends
1. Open Add Friends screen
2. Go to **Requests** tab (shows badge count)
3. Tap **green checkmark** to accept
4. Both users now see each other in Messages

### 4. Messaging Friends
1. Friends appear in Messages screen automatically
2. Tap a friend to start chatting
3. Conversation is created on first message

## Testing Checklist

### Test 1: Add Your First Friend
- [ ] Open Messages → Tap person-add icon
- [ ] Search for another test user by email
- [ ] Tap "Add" button
- [ ] Verify button changes to "Cancel"
- [ ] Check "Sent" tab shows the request

### Test 2: Accept Friend Request
- [ ] Login to second account
- [ ] Open Messages → Tap person-add icon
- [ ] Go to "Requests" tab
- [ ] See pending request with badge count
- [ ] Tap green checkmark
- [ ] Verify "Friends" status

### Test 3: See Friends in Messages
- [ ] Go back to Messages screen
- [ ] Friend should now appear in list
- [ ] Name shows as "FirstName LastName" (not "User")
- [ ] Handle shows as "@email" or "@username"

### Test 4: Start Conversation
- [ ] Tap on friend in messages list
- [ ] Opens chat screen
- [ ] Send a test message
- [ ] Verify it appears in conversation

### Test 5: Filter Tabs Work
- [ ] Tap "Private" - shows 1-on-1 chats
- [ ] Tap "Groups" - shows group chats
- [ ] Active tab highlighted in purple
- [ ] Tap "Invites" - shows all (placeholder)
- [ ] Tap "Mentions" - shows all (placeholder)

## Troubleshooting

### "No friends yet" Message
**This is correct!** You need to:
1. Add friends first via Add Friends screen
2. They must accept your request
3. Then they'll appear in Messages

### Search Not Finding Users
Check:
- Are you searching for users who exist?
- Try searching by email (e.g., "test@example.com")
- Try searching by first name
- Users are case-insensitive search

### Names Show as "User"
This was fixed! Names now show as:
1. Username (if set in profile)
2. "FirstName LastName" (from signup)
3. Email username as fallback

### Handle Shows Email Instead of @username
This is correct behavior:
- If user has username set: shows "@username"
- If no username: shows "@email" (e.g., "@john")

## Expected Behavior

### Empty States
- **No friends**: "No friends yet" + "Add Friends" button
- **No conversations**: "No messages yet" + "Start a conversation!"
- **Groups tab (no groups)**: "No group chats"

### Name Display Priority
1. username (if set in Edit Profile)
2. firstName + lastName (from signup)
3. displayName (if exists)
4. email username (fallback)

### Search Fields Checked
- username
- email
- email username (before @)
- firstName
- lastName
- firstName + lastName combined
- displayName
- name

## Current Limitations

### Features Working
✅ Add friends by search
✅ Send/receive friend requests
✅ Accept/reject requests
✅ View friends in messages
✅ Filter by Private/Groups
✅ Name display from firstName/lastName
✅ Real-time friend updates

### Features Not Yet Implemented
⏳ Invites filter (shows all for now)
⏳ Mentions filter (shows all for now)
⏳ Remove friend option
⏳ Block user option
⏳ Friend suggestions

## Quick Test with Two Accounts

### Account A (Sender)
```
1. Login as user1@test.com
2. Messages → Add Friends → Search
3. Search: "user2@test.com"
4. Tap "Add" button
5. Go to "Sent" tab - see pending request
```

### Account B (Receiver)
```
1. Login as user2@test.com
2. Messages → Add Friends → Requests
3. See request from user1@test.com
4. Tap green checkmark
5. Go back to Messages - see user1 in list
```

### Both Accounts
```
1. Both should see each other in Messages
2. Tap to open chat
3. Send messages back and forth
4. Names show correctly
5. Conversations appear in list
```

## Console Logs to Check

Look for these in Metro bundler:
- `Loaded friend IDs: [...]` - Shows your friends
- `Friends updated, count: X` - Real-time updates
- `User XYZ display name: John Doe` - Name resolution

## Next Steps After Testing

1. ✅ Verify friends system works
2. ✅ Test messaging between friends
3. 🔄 Deploy Firestore rules (for security)
4. 🔄 Deploy Firestore indexes (for performance)
5. 🔄 Build APK for production

## Need Help?

If something's not working:
1. Check Metro bundler console logs
2. Verify Firebase console shows user documents
3. Check Firestore rules are deployed
4. Ensure both users are authenticated
