/**
 * Follow System Debug Script
 * Run this to verify follow functionality is working
 */

import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

// Test follow action in real-time
export async function testFollowAction(targetUserId) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user logged in');
    return;
  }
  
  console.log('\n🧪 Testing Follow System');
  console.log('='.repeat(50));
  console.log(`Current User: ${currentUser.uid}`);
  console.log(`Target User: ${targetUserId}`);
  console.log('='.repeat(50));
  
  // Listen to following subcollection
  const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
  const unsubFollowing = onSnapshot(followingRef, (snap) => {
    console.log(`\n📊 Following doc exists: ${snap.exists()}`);
    if (snap.exists()) {
      console.log('   Data:', snap.data());
    }
  });
  
  // Listen to followers subcollection
  const followersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
  const unsubFollowers = onSnapshot(followersRef, (snap) => {
    console.log(`\n📊 Followers doc exists: ${snap.exists()}`);
    if (snap.exists()) {
      console.log('   Data:', snap.data());
    }
  });
  
  // Listen to current user document
  const currentUserRef = doc(db, 'users', currentUser.uid);
  const unsubCurrentUser = onSnapshot(currentUserRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      console.log(`\n👤 Current User followingCount: ${data.followingCount || 0}`);
    }
  });
  
  // Listen to target user document
  const targetUserRef = doc(db, 'users', targetUserId);
  const unsubTargetUser = onSnapshot(targetUserRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      console.log(`\n🎯 Target User followersCount: ${data.followersCount || 0}`);
    }
  });
  
  console.log('\n✅ Listeners attached. Now tap Follow button and watch logs...\n');
  
  // Return cleanup function
  return () => {
    unsubFollowing();
    unsubFollowers();
    unsubCurrentUser();
    unsubTargetUser();
    console.log('\n🛑 Listeners removed\n');
  };
}

// Quick check if follow system is working
export async function quickFollowCheck(targetUserId) {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user logged in');
    return false;
  }
  
  console.log('\n🔍 Quick Follow Check');
  console.log('='.repeat(50));
  
  try {
    // Check following entry
    const followingRef = doc(db, 'users', currentUser.uid, 'following', targetUserId);
    const followingSnap = await getDoc(followingRef);
    
    console.log(`\n1️⃣ Following entry exists: ${followingSnap.exists()}`);
    if (followingSnap.exists()) {
      console.log('   Path: users/${currentUser.uid}/following/${targetUserId}');
      console.log('   Data:', followingSnap.data());
    }
    
    // Check followers entry
    const followersRef = doc(db, 'users', targetUserId, 'followers', currentUser.uid);
    const followersSnap = await getDoc(followersRef);
    
    console.log(`\n2️⃣ Followers entry exists: ${followersSnap.exists()}`);
    if (followersSnap.exists()) {
      console.log(`   Path: users/${targetUserId}/followers/${currentUser.uid}`);
      console.log('   Data:', followersSnap.data());
    }
    
    // Check counts
    const currentUserRef = doc(db, 'users', currentUser.uid);
    const currentUserSnap = await getDoc(currentUserRef);
    const currentUserData = currentUserSnap.data() || {};
    
    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserSnap = await getDoc(targetUserRef);
    const targetUserData = targetUserSnap.data() || {};
    
    console.log(`\n3️⃣ Current user followingCount: ${currentUserData.followingCount || 0}`);
    console.log(`\n4️⃣ Target user followersCount: ${targetUserData.followersCount || 0}`);
    
    // Verify consistency
    const isConsistent = followingSnap.exists() === followersSnap.exists();
    
    if (isConsistent) {
      console.log('\n✅ Data is consistent!');
      return true;
    } else {
      console.log('\n⚠️ WARNING: Data inconsistency detected!');
      console.log(`   Following exists: ${followingSnap.exists()}`);
      console.log(`   Followers exists: ${followersSnap.exists()}`);
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error during check:', error);
    return false;
  } finally {
    console.log('='.repeat(50) + '\n');
  }
}

export default {
  testFollowAction,
  quickFollowCheck,
};
