/**
 * Migration Script: Fix Followers Subcollection
 * 
 * Problem: Existing follows only have "following" subcollection
 * Solution: Create corresponding "followers" subcollection entries
 * 
 * HOW TO RUN:
 * 1. Import this in App.js temporarily
 * 2. Call fixFollowersSubcollection() once
 * 3. Remove the import after migration completes
 */

import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function fixFollowersSubcollection() {
  console.log('🔧 Starting followers subcollection migration...\n');
  
  try {
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📊 Found ${usersSnapshot.size} users to process`);
    
    let totalFollowsProcessed = 0;
    let totalFollowersCreated = 0;
    let errors = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userName = userDoc.data().name || userDoc.data().displayName || 'Unknown';
      
      console.log(`\n👤 Processing user: ${userName} (${userId})`);
      
      try {
        // Get this user's following list
        const followingRef = collection(db, 'users', userId, 'following');
        const followingSnapshot = await getDocs(followingRef);
        
        if (followingSnapshot.empty) {
          console.log(`  ⏭️  No following entries, skipping...`);
          continue;
        }
        
        console.log(`  📋 Found ${followingSnapshot.size} following entries`);
        
        // For each person this user follows
        for (const followDoc of followingSnapshot.docs) {
          const followData = followDoc.data();
          const targetUserId = followData.userId || followDoc.id;
          
          totalFollowsProcessed++;
          
          // Check if target user exists
          const targetUserRef = doc(db, 'users', targetUserId);
          const targetUserSnap = await getDoc(targetUserRef);
          
          if (!targetUserSnap.exists()) {
            console.log(`  ⚠️  Target user ${targetUserId} doesn't exist, skipping...`);
            continue;
          }
          
          // Check if followers entry already exists
          const followerDocRef = doc(db, 'users', targetUserId, 'followers', userId);
          const followerDocSnap = await getDoc(followerDocRef);
          
          if (followerDocSnap.exists()) {
            console.log(`  ✅ Follower entry already exists for ${targetUserId}`);
            continue;
          }
          
          // Create the followers entry
          await setDoc(followerDocRef, {
            userId: userId,
            followedAt: followData.followedAt || new Date().toISOString(),
          });
          
          totalFollowersCreated++;
          console.log(`  ✨ Created follower entry in ${targetUserId}'s followers`);
        }
        
      } catch (userError) {
        console.error(`  ❌ Error processing user ${userId}:`, userError.message);
        errors++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Migration Complete!');
    console.log('='.repeat(50));
    console.log(`📊 Total follows processed: ${totalFollowsProcessed}`);
    console.log(`✨ New follower entries created: ${totalFollowersCreated}`);
    console.log(`❌ Errors encountered: ${errors}`);
    console.log('='.repeat(50) + '\n');
    
    return {
      success: true,
      totalFollowsProcessed,
      totalFollowersCreated,
      errors,
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Quick test to verify data structure
export async function verifyFollowersStructure(userId) {
  console.log(`\n🔍 Verifying followers structure for user: ${userId}\n`);
  
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('❌ User not found');
      return false;
    }
    
    const userData = userSnap.data();
    console.log(`User: ${userData.name || 'Unknown'}`);
    console.log(`Followers count (stored): ${userData.followersCount || 0}`);
    console.log(`Following count (stored): ${userData.followingCount || 0}\n`);
    
    // Check following subcollection
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    console.log(`Following subcollection size: ${followingSnap.size}`);
    
    // Check followers subcollection
    const followersRef = collection(db, 'users', userId, 'followers');
    const followersSnap = await getDocs(followersRef);
    console.log(`Followers subcollection size: ${followersSnap.size}\n`);
    
    if (followersSnap.size === 0 && userData.followersCount > 0) {
      console.log('⚠️  WARNING: Followers count > 0 but subcollection is empty!');
      console.log('👉 Run fixFollowersSubcollection() to fix this.\n');
      return false;
    }
    
    console.log('✅ Followers structure looks good!\n');
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

export default {
  fixFollowersSubcollection,
  verifyFollowersStructure,
};
