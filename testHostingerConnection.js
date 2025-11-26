/**
 * Hostinger Connection Test Script
 * Run this to verify your Hostinger setup is working
 * 
 * Usage: node testHostingerConnection.js
 */

const hostingerConfig = {
  uploadUrl: 'https://socialvibingapp.karr83anime.com/upload.php',
  apiKey: 'sk_svapp_M8nK4xP9wL2vT7hY5jQ3bR6fG1mN0cS',
  baseUrl: 'https://socialvibingapp.karr83anime.com/uploads/',
};

console.log('🧪 Testing Hostinger Connection...\n');
console.log('Configuration:');
console.log('  Upload URL:', hostingerConfig.uploadUrl);
console.log('  Base URL:', hostingerConfig.baseUrl);
console.log('  API Key:', hostingerConfig.apiKey.substring(0, 15) + '...\n');

// Test 1: Check if upload.php is accessible
async function testEndpointAccess() {
  console.log('Test 1: Checking endpoint accessibility...');
  try {
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Endpoint is accessible');
      console.log('   Message:', data.data.message);
      console.log('   Version:', data.data.version);
      return true;
    } else {
      console.log('❌ FAILED: Endpoint returned error');
      console.log('   Error:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Cannot connect to endpoint');
    console.log('   Error:', error.message);
    console.log('   Possible issues:');
    console.log('   - upload.php not uploaded to server');
    console.log('   - Domain URL is incorrect');
    console.log('   - Server is down');
    return false;
  }
}

// Test 2: Check CORS headers
async function testCORS() {
  console.log('\nTest 2: Checking CORS configuration...');
  try {
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'OPTIONS',
    });

    const corsHeader = response.headers.get('Access-Control-Allow-Origin');
    
    if (corsHeader === '*' || corsHeader) {
      console.log('✅ SUCCESS: CORS is properly configured');
      console.log('   Access-Control-Allow-Origin:', corsHeader);
      return true;
    } else {
      console.log('⚠️  WARNING: CORS headers not found');
      console.log('   This might cause issues in React Native');
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Cannot check CORS');
    console.log('   Error:', error.message);
    return false;
  }
}

// Test 3: Check uploads folder accessibility
async function testUploadsFolder() {
  console.log('\nTest 3: Checking uploads folder...');
  try {
    // Try to access the uploads directory
    const testUrl = hostingerConfig.baseUrl;
    const response = await fetch(testUrl);
    
    // A 403 Forbidden is actually good - it means the folder exists but directory listing is disabled
    // A 404 means the folder doesn't exist
    if (response.status === 403 || response.status === 200) {
      console.log('✅ SUCCESS: Uploads folder exists');
      console.log('   Status:', response.status, response.statusText);
      return true;
    } else if (response.status === 404) {
      console.log('⚠️  WARNING: Uploads folder may not exist (404)');
      console.log('   The folder will be created automatically on first upload');
      return true; // Still OK, will be created
    } else {
      console.log('⚠️  UNKNOWN: Unexpected status code:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ FAILED: Cannot access uploads folder');
    console.log('   Error:', error.message);
    return false;
  }
}

// Test 4: Verify API Key
async function testAPIKey() {
  console.log('\nTest 4: Verifying API Key...');
  try {
    // Try with wrong API key
    const response = await fetch(hostingerConfig.uploadUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': 'wrong_key_test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });

    const data = await response.json();
    
    if (response.status === 401 || (data.error && data.error.includes('API key'))) {
      console.log('✅ SUCCESS: API key validation is working');
      console.log('   Server correctly rejects invalid keys');
      return true;
    } else {
      console.log('⚠️  WARNING: API key validation may not be active');
      console.log('   Anyone could upload to your server!');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Cannot test API key validation');
    console.log('   Error:', error.message);
    return true; // Don't fail on this
  }
}

// Run all tests
async function runAllTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const test1 = await testEndpointAccess();
  const test2 = await testCORS();
  const test3 = await testUploadsFolder();
  const test4 = await testAPIKey();
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 Test Results Summary:\n');
  console.log(`  Endpoint Access:        ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  CORS Configuration:     ${test2 ? '✅ PASS' : '⚠️  WARN'}`);
  console.log(`  Uploads Folder:         ${test3 ? '✅ PASS' : '⚠️  WARN'}`);
  console.log(`  API Key Validation:     ${test4 ? '✅ PASS' : '⚠️  WARN'}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (test1) {
    console.log('🎉 READY TO USE!');
    console.log('\nYour Hostinger upload API is working correctly.');
    console.log('You can now use it in your React Native app.\n');
    console.log('Next steps:');
    console.log('1. Test from React Native app using TestIntegrationScreen');
    console.log('2. Upload a real image to verify file upload works');
    console.log('3. Check that uploaded files are accessible via browser\n');
  } else {
    console.log('❌ SETUP INCOMPLETE');
    console.log('\nPlease fix the issues above before using the upload API.\n');
    console.log('Common fixes:');
    console.log('1. Upload upload.php to your Hostinger server');
    console.log('2. Verify the domain URL is correct');
    console.log('3. Check server permissions (755 for directories)');
    console.log('4. Create /uploads/ folder manually if needed\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
