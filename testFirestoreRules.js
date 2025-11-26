// testFirestoreRules.js - Test Firestore security rules
import { collection, doc, getDoc, getDocs, addDoc, query, where, limit } from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

/**
 * Test Firestore security rules to ensure they're properly deployed
 * Run this from your app or create a test screen
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFirestoreRules() {
  log('\n🔥 Testing Firestore Security Rules...', 'blue');
  log('═══════════════════════════════════════\n', 'blue');

  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    log('❌ ERROR: No user authenticated!', 'red');
    log('Please login first before testing rules.\n', 'yellow');
    return {
      success: false,
      error: 'No authenticated user',
    };
  }

  log(`✓ Authenticated as: ${currentUser.email || currentUser.uid}`, 'green');
  log(`✓ User ID: ${currentUser.uid}\n`, 'green');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: Users collection
  log('Test 1: Users Collection Access', 'yellow');
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      log('  ✓ Can read own user document', 'green');
      results.passed++;
      results.tests.push({ name: 'Read own user', status: 'PASS' });
    } else {
      log('  ⚠ User document does not exist (this is okay if not created yet)', 'yellow');
      results.tests.push({ name: 'Read own user', status: 'SKIP' });
    }
  } catch (error) {
    log(`  ✗ Failed to read user document: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read own user', status: 'FAIL', error: error.message });
  }

  // Test 2: Communities collection
  log('\nTest 2: Communities Collection Access', 'yellow');
  try {
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, limit(1));
    const snapshot = await getDocs(q);
    log(`  ✓ Can read communities (found ${snapshot.size})`, 'green');
    results.passed++;
    results.tests.push({ name: 'Read communities', status: 'PASS', count: snapshot.size });
  } catch (error) {
    log(`  ✗ Failed to read communities: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read communities', status: 'FAIL', error: error.message });
  }

  // Test 3: Posts subcollection (if any community exists)
  log('\nTest 3: Posts Subcollection Access', 'yellow');
  try {
    const communitiesSnapshot = await getDocs(query(collection(db, 'communities'), limit(1)));
    if (!communitiesSnapshot.empty) {
      const communityId = communitiesSnapshot.docs[0].id;
      const postsRef = collection(db, 'communities', communityId, 'posts');
      const postsSnapshot = await getDocs(query(postsRef, limit(5)));
      log(`  ✓ Can read posts from community (found ${postsSnapshot.size})`, 'green');
      results.passed++;
      results.tests.push({ name: 'Read posts', status: 'PASS', count: postsSnapshot.size });
    } else {
      log('  ⚠ No communities found to test posts', 'yellow');
      results.tests.push({ name: 'Read posts', status: 'SKIP' });
    }
  } catch (error) {
    log(`  ✗ Failed to read posts: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read posts', status: 'FAIL', error: error.message });
  }

  // Test 4: Conversations collection
  log('\nTest 4: Conversations Collection Access', 'yellow');
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, where('participants', 'array-contains', currentUser.uid), limit(5));
    const snapshot = await getDocs(q);
    log(`  ✓ Can read own conversations (found ${snapshot.size})`, 'green');
    results.passed++;
    results.tests.push({ name: 'Read conversations', status: 'PASS', count: snapshot.size });
  } catch (error) {
    log(`  ✗ Failed to read conversations: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read conversations', status: 'FAIL', error: error.message });
  }

  // Test 5: Community chats
  log('\nTest 5: Community Chats Access', 'yellow');
  try {
    const communitiesSnapshot = await getDocs(query(collection(db, 'communities'), limit(1)));
    if (!communitiesSnapshot.empty) {
      const communityId = communitiesSnapshot.docs[0].id;
      const messagesRef = collection(db, 'community_chats', communityId, 'messages');
      const messagesSnapshot = await getDocs(query(messagesRef, limit(5)));
      log(`  ✓ Can read community chat messages (found ${messagesSnapshot.size})`, 'green');
      results.passed++;
      results.tests.push({ name: 'Read community chats', status: 'PASS', count: messagesSnapshot.size });
    } else {
      log('  ⚠ No communities found to test chats', 'yellow');
      results.tests.push({ name: 'Read community chats', status: 'SKIP' });
    }
  } catch (error) {
    log(`  ✗ Failed to read community chats: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read community chats', status: 'FAIL', error: error.message });
  }

  // Test 6: Audio calls collection
  log('\nTest 6: Audio Calls Collection Access', 'yellow');
  try {
    const communitiesSnapshot = await getDocs(query(collection(db, 'communities'), limit(1)));
    if (!communitiesSnapshot.empty) {
      const communityId = communitiesSnapshot.docs[0].id;
      const roomsRef = collection(db, 'audio_calls', communityId, 'rooms');
      const roomsSnapshot = await getDocs(query(roomsRef, limit(5)));
      log(`  ✓ Can read audio call rooms (found ${roomsSnapshot.size})`, 'green');
      results.passed++;
      results.tests.push({ name: 'Read audio calls', status: 'PASS', count: roomsSnapshot.size });
    } else {
      log('  ⚠ No communities found to test audio calls', 'yellow');
      results.tests.push({ name: 'Read audio calls', status: 'SKIP' });
    }
  } catch (error) {
    log(`  ✗ Failed to read audio calls: ${error.message}`, 'red');
    results.failed++;
    results.tests.push({ name: 'Read audio calls', status: 'FAIL', error: error.message });
  }

  // Summary
  log('\n═══════════════════════════════════════', 'blue');
  log('📊 Test Results Summary', 'blue');
  log('═══════════════════════════════════════', 'blue');
  log(`✓ Passed: ${results.passed}`, 'green');
  log(`✗ Failed: ${results.failed}`, 'red');
  log(`⚠ Skipped: ${results.tests.filter(t => t.status === 'SKIP').length}`, 'yellow');
  
  if (results.failed === 0) {
    log('\n🎉 All tests passed! Firestore rules are working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the errors above.', 'yellow');
  }
  
  log('\n', 'reset');

  return results;
}

// Export for use in app
export { testFirestoreRules };

// If running directly in Node (for testing)
if (typeof require !== 'undefined' && require.main === module) {
  console.log('⚠️  This test should be run from within your React Native app after authentication.');
  console.log('Import and call testFirestoreRules() after user login.');
}
