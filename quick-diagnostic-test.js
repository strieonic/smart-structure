/**
 * QUICK DIAGNOSTIC TEST
 * Identifies actual issues in the codebase
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

let issues = [];
let warnings = [];
let passed = [];

// ============================================
// FILE EXISTENCE CHECKS
// ============================================

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    passed.push(`✓ ${description}: ${filePath}`);
    return true;
  } else {
    issues.push(`✗ ${description} missing: ${filePath}`);
    return false;
  }
}

log('\n=== FILE EXISTENCE CHECKS ===', 'cyan');

// Frontend files
checkFileExists('frontend/index.html', 'Main HTML file');
checkFileExists('frontend/style.css', 'Main CSS file');
checkFileExists('frontend/script.js', 'Main JavaScript file');
checkFileExists('frontend/refined-theme.css', 'Refined theme CSS');
checkFileExists('frontend/dark-theme-override.css', 'Dark theme override CSS');
checkFileExists('frontend/modern-theme.css', 'Modern theme CSS');
checkFileExists('frontend/modern-menu.css', 'Modern menu CSS');
checkFileExists('frontend/modern-menu.js', 'Modern menu JavaScript');

// Backend files
checkFileExists('src/server.ts', 'Server file');
checkFileExists('package.json', 'Package.json');
checkFileExists('.env', 'Environment file');
checkFileExists('prisma/schema.prisma', 'Prisma schema');

// ============================================
// HTML STRUCTURE CHECKS
// ============================================

log('\n=== HTML STRUCTURE CHECKS ===', 'cyan');

if (fs.existsSync('frontend/index.html')) {
  const html = fs.readFileSync('frontend/index.html', 'utf8');
  
  // Check for essential elements
  if (html.includes('class="logo"')) {
    passed.push('✓ Logo element exists');
  } else {
    issues.push('✗ Logo element missing');
  }
  
  if (html.includes('id="menu-btn"') || html.includes('class="menu-btn"')) {
    passed.push('✓ Menu button exists');
  } else {
    issues.push('✗ Menu button missing');
  }
  
  if (html.includes('id="map"')) {
    passed.push('✓ Map element exists');
  } else {
    warnings.push('⚠ Map element missing');
  }
  
  if (html.includes('navigateTo')) {
    passed.push('✓ navigateTo function defined');
  } else {
    issues.push('✗ navigateTo function not defined');
  }
  
  if (html.includes('showNavigationContent')) {
    passed.push('✓ showNavigationContent function defined');
  } else {
    issues.push('✗ showNavigationContent function not defined');
  }
  
  // Check for all sections
  const sections = [
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
  
  sections.forEach(section => {
    if (html.includes(`id="${section}"`)) {
      passed.push(`✓ Section exists: ${section}`);
    } else {
      issues.push(`✗ Section missing: ${section}`);
    }
  });
  
  // Check CSS links
  if (html.includes('refined-theme.css')) {
    passed.push('✓ Refined theme CSS linked');
  } else {
    warnings.push('⚠ Refined theme CSS not linked');
  }
  
  if (html.includes('dark-theme-override.css')) {
    passed.push('✓ Dark theme override CSS linked');
  } else {
    warnings.push('⚠ Dark theme override CSS not linked');
  }
}

// ============================================
// CSS CHECKS
// ============================================

log('\n=== CSS CHECKS ===', 'cyan');

if (fs.existsSync('frontend/refined-theme.css')) {
  const css = fs.readFileSync('frontend/refined-theme.css', 'utf8');
  
  if (css.includes('.logo') || css.includes('logo')) {
    passed.push('✓ Logo styles defined');
  } else {
    warnings.push('⚠ Logo styles not defined');
  }
  
  if (css.includes('.map-container') || css.includes('.google-map') || css.includes('#map')) {
    passed.push('✓ Map styles defined');
  } else {
    warnings.push('⚠ Map styles not defined');
  }
  
  if (css.includes('8b5cf6') || css.includes('139, 92, 246')) {
    passed.push('✓ Purple accent color used');
  } else {
    warnings.push('⚠ Purple accent color not found');
  }
  
  if (css.includes('#0a0a0a') || css.includes('#000000') || css.includes('0, 0, 0')) {
    passed.push('✓ Dark background colors defined');
  } else {
    warnings.push('⚠ Dark background colors not found');
  }
}

// ============================================
// JAVASCRIPT CHECKS
// ============================================

log('\n=== JAVASCRIPT CHECKS ===', 'cyan');

if (fs.existsSync('frontend/script.js')) {
  const js = fs.readFileSync('frontend/script.js', 'utf8');
  
  if (js.includes('function login') || js.includes('const login')) {
    passed.push('✓ Login function exists');
  } else {
    warnings.push('⚠ Login function not found');
  }
  
  if (js.includes('function register') || js.includes('const register')) {
    passed.push('✓ Register function exists');
  } else {
    warnings.push('⚠ Register function not found');
  }
  
  if (js.includes('function showSection') || js.includes('const showSection')) {
    passed.push('✓ showSection function exists');
  } else {
    warnings.push('⚠ showSection function not found');
  }
}

// ============================================
// PACKAGE.JSON CHECKS
// ============================================

log('\n=== PACKAGE.JSON CHECKS ===', 'cyan');

if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (pkg.scripts && pkg.scripts.dev) {
    passed.push('✓ Dev script defined');
  } else {
    warnings.push('⚠ Dev script not defined');
  }
  
  if (pkg.dependencies) {
    const requiredDeps = ['express', 'prisma', '@prisma/client'];
    requiredDeps.forEach(dep => {
      if (pkg.dependencies[dep] || (pkg.devDependencies && pkg.devDependencies[dep])) {
        passed.push(`✓ Dependency installed: ${dep}`);
      } else {
        warnings.push(`⚠ Dependency missing: ${dep}`);
      }
    });
  }
}

// ============================================
// ENVIRONMENT CHECKS
// ============================================

log('\n=== ENVIRONMENT CHECKS ===', 'cyan');

if (fs.existsSync('.env')) {
  const env = fs.readFileSync('.env', 'utf8');
  
  if (env.includes('DATABASE_URL')) {
    passed.push('✓ DATABASE_URL defined');
  } else {
    issues.push('✗ DATABASE_URL not defined in .env');
  }
  
  if (env.includes('JWT_SECRET')) {
    passed.push('✓ JWT_SECRET defined');
  } else {
    warnings.push('⚠ JWT_SECRET not defined in .env');
  }
  
  if (env.includes('PORT')) {
    passed.push('✓ PORT defined');
  } else {
    warnings.push('⚠ PORT not defined in .env');
  }
}

// ============================================
// PRINT RESULTS
// ============================================

log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
log('║                  DIAGNOSTIC RESULTS                    ║', 'cyan');
log('╚════════════════════════════════════════════════════════╝', 'cyan');

log(`\n✓ PASSED: ${passed.length}`, 'green');
passed.forEach(item => log(item, 'green'));

if (warnings.length > 0) {
  log(`\n⚠ WARNINGS: ${warnings.length}`, 'yellow');
  warnings.forEach(item => log(item, 'yellow'));
}

if (issues.length > 0) {
  log(`\n✗ ISSUES: ${issues.length}`, 'red');
  issues.forEach(item => log(item, 'red'));
}

log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
log('║                      SUMMARY                           ║', 'cyan');
log('╚════════════════════════════════════════════════════════╝', 'cyan');

const total = passed.length + warnings.length + issues.length;
const score = ((passed.length / total) * 100).toFixed(1);

log(`\nTotal Checks: ${total}`, 'cyan');
log(`Passed: ${passed.length}`, 'green');
log(`Warnings: ${warnings.length}`, 'yellow');
log(`Issues: ${issues.length}`, issues.length > 0 ? 'red' : 'green');
log(`Health Score: ${score}%`, score > 80 ? 'green' : score > 60 ? 'yellow' : 'red');

if (issues.length === 0 && warnings.length === 0) {
  log('\n🎉 ALL CHECKS PASSED! Site is healthy.', 'green');
} else if (issues.length === 0) {
  log('\n✓ No critical issues found. Some warnings to review.', 'yellow');
} else {
  log('\n⚠ Critical issues found. Please fix them.', 'red');
}
