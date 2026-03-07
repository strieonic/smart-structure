// ============================================
// Menu System Testing Script
// Tests the new system menu functionality
// ============================================

const fs = require('fs');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           SYSTEM MENU TESTING                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function test(name, condition, message = '') {
  if (condition) {
    console.log(`✓ ${name}`);
    passed++;
  } else {
    console.log(`✗ ${name}: ${message}`);
    failed++;
  }
}

// Test 1: Check if menu files exist
console.log('═══ Test 1: Menu Files ═══\n');
test('system-menu.js exists', fs.existsSync('frontend/system-menu.js'));
test('system-menu.css exists', fs.existsSync('frontend/system-menu.css'));

// Test 2: Check HTML integration
console.log('\n═══ Test 2: HTML Integration ═══\n');
const html = fs.readFileSync('frontend/index.html', 'utf8');
test('system-menu.css included', html.includes('system-menu.css'));
test('system-menu.js included', html.includes('system-menu.js'));

// Test 3: Check JavaScript functions
console.log('\n═══ Test 3: JavaScript Functions ═══\n');
const menuJs = fs.readFileSync('frontend/system-menu.js', 'utf8');
test('toggleSystemMenu() found', menuJs.includes('function toggleSystemMenu()'));
test('showSiteStatus() found', menuJs.includes('function showSiteStatus()'));
test('showSettings() found', menuJs.includes('function showSettings()'));
test('initSystemMenu() found', menuJs.includes('function initSystemMenu()'));
test('closeSystemMenu() found', menuJs.includes('function closeSystemMenu()'));

// Test 4: Check CSS classes
console.log('\n═══ Test 4: CSS Classes ═══\n');
const menuCss = fs.readFileSync('frontend/system-menu.css', 'utf8');
test('.system-menu-btn found', menuCss.includes('.system-menu-btn'));
test('.system-menu found', menuCss.includes('.system-menu'));
test('.system-menu-overlay found', menuCss.includes('.system-menu-overlay'));
test('.status-card found', menuCss.includes('.status-card'));
test('.settings-group found', menuCss.includes('.settings-group'));
test('.notification-item found', menuCss.includes('.notification-item'));
test('.ai-suggestion-text found', menuCss.includes('.ai-suggestion-text'));

// Test 5: Check error handler updates
console.log('\n═══ Test 5: Error Handler Updates ═══\n');
const errorHandler = fs.readFileSync('error-handler.js', 'utf8');
test('Check interval is 60000', errorHandler.includes('CHECK_INTERVAL: 60000'));
test('aiSuggestion field added', errorHandler.includes('aiSuggestion'));
test('Enhanced AI handling', errorHandler.includes('canAutoFix'));
test('Command extraction logic', errorHandler.includes('commandMatch'));

// Test 6: Check notification system updates
console.log('\n═══ Test 6: Notification System Updates ═══\n');
const notificationJs = fs.readFileSync('frontend/error-notifications.js', 'utf8');
test('Polling interval is 60000', notificationJs.includes('60000'));
test('Status indicator hide logic', notificationJs.includes('hasIssue'));
test('AI suggestion display', notificationJs.includes('aiSuggestion'));

const notificationCss = fs.readFileSync('frontend/error-notifications.css', 'utf8');
test('Status indicator hidden by default', notificationCss.includes('display: none'));
test('AI suggestion styling', notificationCss.includes('.ai-suggestion'));

// Test 7: Check documentation
console.log('\n═══ Test 7: Documentation ═══\n');
test('SYSTEM_IMPROVEMENTS_V2.md exists', fs.existsSync('SYSTEM_IMPROVEMENTS_V2.md'));
test('QUICK_GUIDE_V2.txt exists', fs.existsSync('QUICK_GUIDE_V2.txt'));

// Summary
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    TEST SUMMARY                            ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  Total Tests: ${passed + failed}`);
console.log(`║  Passed: ${passed}`);
console.log(`║  Failed: ${failed}`);
console.log(`║  Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (failed === 0) {
  console.log('🎉 All menu system tests passed!\n');
  console.log('Next steps:');
  console.log('1. Open http://localhost:8080 in your browser');
  console.log('2. Look for the ☰ button in top-right corner');
  console.log('3. Click to open the system menu');
  console.log('4. Test Site Status and Settings tabs');
} else {
  console.log('⚠️  Some tests failed. Review the errors above.\n');
}
