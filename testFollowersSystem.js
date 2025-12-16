/**
 * Test Helper for Followers/Following System
 * Run this in your app to debug followers and notifications
 */

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

export async function debugFollowersSystem(userId = null) {
  const currentUser = auth.currentUser;
  const targetUserId = userId || currentUser?.uid;
  
  if (!targetUserId) {
    console.error('❌ No user ID provided and no user logged in');
    return;
  }

  console.log('\n🔍 ========== FOLLOWERS SYSTEM DEBUG ==========');
  console.log(`Testing for user: ${targetUserId}`);
  console.log(`Current logged in user: ${currentUser?.uid}`);
  console.log('');

  try {
    // 1. Check user document
    console.log('1️⃣ Checking user document...');
    const userRef = doc(db, 'users', targetUserId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log('✅ User document found');
      console.log(`   - Name: ${userData.name || userData.displayName || 'N/A'}`);
      console.log(`   - Followers Count (stored): ${userData.followersCount || 0}`);
      console.log(`   - Following Count (stored): ${userData.followingCount || 0}`);
    } else {
      console.log('❌ User document NOT found');
      return;
    }
    
    console.log('');

    // 2. Check followers subcollection
    console.log('2️⃣ Checking followers subcollection...');
    const followersRef = collection(db, 'users', targetUserId, 'followers');
    const followersSnap = await getDocs(followersRef);
    
    console.log(`✅ Followers subcollection size: ${followersSnap.size}`);
    if (followersSnap.size > 0) {
      console.log('   Followers:');
      followersSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: userId=${data.userId}, followedAt=${data.followedAt}`);
      });
    } else {
      console.log('   ⚠️  No followers found in subcollection');
    }
    
    console.log('');

    // 3. Check following subcollection
    console.log('3️⃣ Checking following subcollection...');
    const followingRef = collection(db, 'users', targetUserId, 'following');
    const followingSnap = await getDocs(followingRef);
    
    console.log(`✅ Following subcollection size: ${followingSnap.size}`);
    if (followingSnap.size > 0) {
      console.log('   Following:');
      followingSnap.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${doc.id}: userId=${data.userId}, followedAt=${data.followedAt}`);
      });
    } else {
      console.log('   ⚠️  Not following anyone');
    }
    
    console.log('');

    // 4. Check notifications subcollection
    console.log('4️⃣ Checking notifications subcollection...');
    const notificationsRef = collection(db, 'users', targetUserId, 'notifications');
    const notificationsSnap = await getDocs(notificationsRef);
    
    console.log(`✅ Notifications subcollection size: ${notificationsSnap.size}`);
    if (notificationsSnap.size > 0) {
      console.log('   Recent notifications:');
      const notifs = [];
      notificationsSnap.forEach((doc) => {
        const data = doc.data();
        notifs.push({ id: doc.id, ...data });
      });
      
      // Sort by createdAt
      notifs.sort((a, b) => {
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt?.toDate?.();
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt?.toDate?.();
        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      });
      
      // Show last 5
      notifs.slice(0, 5).forEach((notif) => {
        console.log(`   - [${notif.type}] from ${notif.fromUserName || notif.senderName || 'Unknown'}`);
        console.log(`     Message: ${notif.message || 'N/A'}`);
        console.log(`     Created: ${notif.createdAt}`);
        console.log(`     Read: ${notif.read ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('   ⚠️  No notifications found');
    }
    
    console.log('');
    console.log('✅ Debug complete!');
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    console.error('Error details:', error.message);
  }
}

// Quick test function to verify Firestore connection
export async function testFirestoreConnection() {
  console.log('\n🔌 Testing Firestore connection...');
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('❌ No user logged in');
      return false;
    }
    
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      console.log('✅ Firestore connection OK');
      console.log(`✅ Current user: ${userSnap.data().name || 'N/A'}`);
      return true;
    } else {
      console.log('❌ User document not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message);
    return false;
  }
}

// Export for easy import
export default {
  debugFollowersSystem,
  testFirestoreConnection,
};
