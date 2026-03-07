// ============================================
// Frontend Validation Script
// Checks for common JavaScript errors
// ============================================

const fs = require('fs');
const path = require('path');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: []
};

function log(type, message) {
  results.total++;
  if (type === 'pass') {
    results.passed++;
    console.log(`✓ ${message}`);
  } else if (type === 'fail') {
    results.failed++;
    console.log(`✗ ${message}`);
  } else {
    results.warnings.push(message);
    console.log(`⚠ ${message}`);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║              FRONTEND VALIDATION                           ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Check if files exist
console.log('═══ FILE EXISTENCE CHECKS ═══\n');

const requiredFiles = [
  'frontend/index.html',
  'frontend/script.js',
  'frontend/expert-interface.js',
  'frontend/style.css'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    log('pass', `${file} exists`);
  } else {
    log('fail', `${file} is missing`);
  }
});

// Check HTML structure
console.log('\n═══ HTML STRUCTURE CHECKS ═══\n');

try {
  const html = fs.readFileSync('frontend/index.html', 'utf8');
  
  // Check for required sections
  const requiredSections = [
    'auth-section',
    'survey-section',
    'building-section',
    'wind-section',
    'analysis-section',
    'reports-section',
    'ai-projects-section',
    'ai-chat-section',
    'expert-queries-section',
    'expert-dashboard-section'
  ];
  
  requiredSections.forEach(section => {
    if (html.includes(`id="${section}"`)) {
      log('pass', `Section ${section} found`);
    } else {
      log('fail', `Section ${section} missing`);
    }
  });
  
  // Check for script includes
  if (html.includes('script.js')) {
    log('pass', 'script.js included');
  } else {
    log('fail', 'script.js not included');
  }
  
  if (html.includes('expert-interface.js')) {
    log('pass', 'expert-interface.js included');
  } else {
    log('fail', 'expert-interface.js not included');
  }
  
  // Check for style includes
  if (html.includes('style.css')) {
    log('pass', 'style.css included');
  } else {
    log('fail', 'style.css not included');
  }
  
} catch (error) {
  log('fail', `Error reading HTML: ${error.message}`);
}

// Check JavaScript syntax
console.log('\n═══ JAVASCRIPT CHECKS ═══\n');

try {
  const scriptJs = fs.readFileSync('frontend/script.js', 'utf8');
  
  // Check for required functions
  const requiredFunctions = [
    'login',
    'register',
    'logout',
    'createSurvey',
    'createBuilding',
    'addWind',
    'runDisaster',
    'runVastu',
    'generateReport'
  ];
  
  requiredFunctions.forEach(func => {
    const regex = new RegExp(`(async\\s+)?function\\s+${func}|const\\s+${func}\\s*=|${func}\\s*=\\s*(async\\s+)?function`, 'g');
    if (regex.test(scriptJs)) {
      log('pass', `Function ${func}() found`);
    } else {
      log('warn', `Function ${func}() not found or has different signature`);
    }
  });
  
  // Check for API constant
  if (scriptJs.includes('const API =') || scriptJs.includes('const API=')) {
    log('pass', 'API constant defined');
  } else {
    log('fail', 'API constant not defined');
  }
  
} catch (error) {
  log('fail', `Error reading script.js: ${error.message}`);
}

// Check expert interface
console.log('\n═══ EXPERT INTERFACE CHECKS ═══\n');

try {
  const expertJs = fs.readFileSync('frontend/expert-interface.js', 'utf8');
  
  const expertFunctions = [
    'selectAccountType',
    'expertLogin',
    'registerExpert',
    'loadExpertDashboard',
    'assignQueryToSelf',
    'respondToQuery',
    'loadVerifiedExperts',
    'updateExpertProfile'
  ];
  
  expertFunctions.forEach(func => {
    const regex = new RegExp(`(async\\s+)?function\\s+${func}|const\\s+${func}\\s*=|${func}\\s*=\\s*(async\\s+)?function`, 'g');
    if (regex.test(expertJs)) {
      log('pass', `Expert function ${func}() found`);
    } else {
      log('warn', `Expert function ${func}() not found`);
    }
  });
  
} catch (error) {
  log('fail', `Error reading expert-interface.js: ${error.message}`);
}

// Check CSS
console.log('\n═══ CSS CHECKS ═══\n');

try {
  const css = fs.readFileSync('frontend/style.css', 'utf8');
  
  const requiredClasses = [
    '.account-type-card',
    '.expert-registration-steps',
    '.specialization-grid',
    '.expert-card',
    '.expert-avatar',
    '.experts-grid',
    '.expert-dashboard'
  ];
  
  requiredClasses.forEach(className => {
    if (css.includes(className)) {
      log('pass', `CSS class ${className} found`);
    } else {
      log('warn', `CSS class ${className} not found`);
    }
  });
  
} catch (error) {
  log('fail', `Error reading style.css: ${error.message}`);
}

// Print summary
console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                    VALIDATION SUMMARY                      ║');
console.log('╠════════════════════════════════════════════════════════════╣');
console.log(`║  Total Checks: ${results.total}`);
console.log(`║  Passed: ${results.passed}`);
console.log(`║  Failed: ${results.failed}`);
console.log(`║  Warnings: ${results.warnings.length}`);
console.log(`║  Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
console.log('╚════════════════════════════════════════════════════════════╝');

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS (non-critical):');
  results.warnings.forEach((warn, idx) => {
    console.log(`${idx + 1}. ${warn}`);
  });
}

if (results.failed === 0) {
  console.log('\n✅ Frontend validation passed!');
} else {
  console.log('\n❌ Frontend validation found issues.');
}
