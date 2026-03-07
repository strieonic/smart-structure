// Quick test for error handler system
const http = require('http');

console.log('Testing Error Handler System...\n');

// Test 1: Check if notification API is accessible
function testNotificationAPI() {
  return new Promise((resolve) => {
    http.get('http://localhost:9999/status', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Notification API is accessible');
        console.log('   Status:', JSON.parse(data));
        resolve(true);
      });
    }).on('error', () => {
      console.log('❌ Notification API is not running');
      console.log('   Start it with: node error-handler.js');
      resolve(false);
    });
  });
}

// Test 2: Check notifications endpoint
function testNotifications() {
  return new Promise((resolve) => {
    http.get('http://localhost:9999/notifications', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const notifications = JSON.parse(data).notifications;
        console.log(`✅ Notifications endpoint working`);
        console.log(`   Active notifications: ${notifications.length}`);
        if (notifications.length > 0) {
          console.log('\n   Recent notifications:');
          notifications.slice(0, 3).forEach(n => {
            console.log(`   - ${n.title}: ${n.message}`);
          });
        }
        resolve(true);
      });
    }).on('error', () => {
      console.log('❌ Cannot fetch notifications');
      resolve(false);
    });
  });
}

// Test 3: Check if frontend files exist
function testFrontendFiles() {
  const fs = require('fs');
  const files = [
    'frontend/error-notifications.js',
    'frontend/error-notifications.css',
    'frontend/index.html'
  ];
  
  let allExist = true;
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Test 4: Check if HTML includes notification system
function testHTMLIntegration() {
  const fs = require('fs');
  const html = fs.readFileSync('frontend/index.html', 'utf8');
  
  const checks = [
    { name: 'CSS included', pattern: 'error-notifications.css' },
    { name: 'JS included', pattern: 'error-notifications.js' }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    if (html.includes(check.pattern)) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name}`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Run all tests
async function runTests() {
  console.log('═══ Test 1: Notification API ═══\n');
  const apiWorking = await testNotificationAPI();
  
  if (apiWorking) {
    console.log('\n═══ Test 2: Notifications Endpoint ═══\n');
    await testNotifications();
  }
  
  console.log('\n═══ Test 3: Frontend Files ═══\n');
  testFrontendFiles();
  
  console.log('\n═══ Test 4: HTML Integration ═══\n');
  testHTMLIntegration();
  
  console.log('\n═══════════════════════════════════════');
  console.log('Testing Complete!');
  console.log('═══════════════════════════════════════\n');
  
  if (apiWorking) {
    console.log('✅ Error handler is working correctly');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:8080 in your browser');
    console.log('2. Look for the status indicator in bottom-right');
    console.log('3. Notifications will appear in top-right when errors occur');
  } else {
    console.log('⚠️  Error handler is not running');
    console.log('\nTo start it:');
    console.log('1. Run: node error-handler.js');
    console.log('2. Or use: start-with-monitoring.bat');
  }
}

runTests();
