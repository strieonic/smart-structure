// ============================================
// FIX ALL ISSUES - Diagnostic and Repair Script
// ============================================

const axios = require('axios');
const fs = require('fs');

const API = 'http://localhost:5000/api/v1';
const issues = [];
const fixes = [];

console.log('\n🔍 DIAGNOSING ALL ISSUES...\n');

async function diagnoseAndFix() {
  // Issue 1: Check if backend routes exist
  console.log('1. Checking backend routes...');
  try {
    const response = await axios.get(`${API}/health`);
    console.log('   ✓ Backend health endpoint working');
  } catch (error) {
    issues.push('Backend health endpoint not working');
    console.log('   ✗ Backend health endpoint failed');
  }

  // Issue 2: Test authentication flow
  console.log('\n2. Testing authentication...');
  let token = '';
  try {
    // Register
    const regResponse = await axios.post(`${API}/auth/register`, {
      email: `testuser_${Date.now()}@test.com`,
      password: 'Test@123456',
      name: 'Test User',
      role: 'USER'
    });
    console.log('   ✓ User registration working');
    
    // Login
    const loginResponse = await axios.post(`${API}/auth/login`, {
      email: regResponse.data.data.user.email,
      password: 'Test@123456'
    });
    
    if (loginResponse.data.data.accessToken) {
      token = loginResponse.data.data.accessToken;
      console.log('   ✓ User login working');
      console.log('   ✓ Token received');
    }
  } catch (error) {
    issues.push(`Authentication error: ${error.response?.data?.message || error.message}`);
    console.log(`   ✗ Authentication failed: ${error.response?.data?.message || error.message}`);
  }

  // Issue 3: Test land survey creation with detailed error
  console.log('\n3. Testing land survey creation...');
  try {
    const response = await axios.post(`${API}/land-surveys`, {
      latitude: 28.6139,
      longitude: 77.2090,
      plotArea: 500,
      soilType: 'CLAY',
      slope: 2.5,
      elevation: 250,
      waterTableDepth: 15,
      seismicZone: 'ZONE_IV',
      floodRisk: 'MODERATE',
      nearbyWaterBodies: true,
      waterBodyDistance: 500,
      averageRainfall: 1200
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Land survey creation working');
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data?.errors || error.response?.data;
    issues.push(`Land survey creation: ${errorMsg}`);
    console.log(`   ✗ Land survey failed: ${errorMsg}`);
    if (errorDetails) {
      console.log(`   Details: ${JSON.stringify(errorDetails, null, 2)}`);
    }
  }

  // Issue 4: Check expert routes
  console.log('\n4. Checking expert routes...');
  try {
    const response = await axios.get(`${API}/experts/experts`);
    console.log('   ✓ Expert listing endpoint working');
  } catch (error) {
    issues.push(`Expert routes: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    console.log(`   ✗ Expert routes failed: ${error.response?.status}`);
  }

  // Issue 5: Check missing frontend files
  console.log('\n5. Checking frontend files...');
  const frontendFiles = [
    'frontend/index.html',
    'frontend/script.js',
    'frontend/refined-theme.css',
    'frontend/expert-interface.js',
    'frontend/error-notifications.js',
    'frontend/site-status.html'
  ];
  
  frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file} exists`);
    } else {
      issues.push(`Missing file: ${file}`);
      console.log(`   ✗ ${file} MISSING`);
    }
  });

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    DIAGNOSIS COMPLETE                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`Total Issues Found: ${issues.length}\n`);
  
  if (issues.length > 0) {
    console.log('ISSUES:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('✓ No issues found!');
  }

  // Save report
  fs.writeFileSync('diagnostic-report.json', JSON.stringify({ issues, timestamp: new Date() }, null, 2));
  console.log('\n✓ Diagnostic report saved to: diagnostic-report.json\n');
}

diagnoseAndFix().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
