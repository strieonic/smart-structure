/**
 * COMPLETE SITE TEST SUITE
 * Tests all features, functions, and code
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:5000/api';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failedTestDetails = [];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testResult(testName, passed, error = null) {
  totalTests++;
  if (passed) {
    passedTests++;
    log(`✓ ${testName}`, 'green');
  } else {
    failedTests++;
    log(`✗ ${testName}`, 'red');
    if (error) {
      log(`  Error: ${error.message}`, 'red');
      failedTestDetails.push({ test: testName, error: error.message });
    }
  }
}

// Test data
let testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test User',
  role: 'USER'
};

let testExpert = {
  email: `expert_${Date.now()}@example.com`,
  password: 'ExpertPassword123!',
  name: 'Test Expert',
  phone: '+91 9876543210',
  professionalType: 'STRUCTURAL_ENGINEER',
  experience: '10-15',
  location: 'Mumbai',
  licenseNumber: 'TEST123456',
  specializations: ['Seismic Design', 'Foundation Design'],
  summary: 'Test expert profile'
};

let authToken = null;
let expertToken = null;
let surveyId = null;
let buildingId = null;
let windDataId = null;
let projectId = null;
let queryId = null;

// ============================================
// 1. AUTHENTICATION TESTS
// ============================================

async function testAuthentication() {
  log('\n=== AUTHENTICATION TESTS ===', 'cyan');

  // Test 1.1: User Registration
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    testResult('User Registration', response.status === 201 && response.data.token);
    if (response.data.token) authToken = response.data.token;
  } catch (error) {
    testResult('User Registration', false, error);
  }

  // Test 1.2: User Login
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    testResult('User Login', response.status === 200 && response.data.token);
    if (response.data.token) authToken = response.data.token;
  } catch (error) {
    testResult('User Login', false, error);
  }

  // Test 1.3: Invalid Login
  try {
    await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'WrongPassword'
    });
    testResult('Invalid Login (should fail)', false);
  } catch (error) {
    testResult('Invalid Login (should fail)', error.response?.status === 401);
  }

  // Test 1.4: Duplicate Registration
  try {
    await axios.post(`${BASE_URL}/auth/register`, testUser);
    testResult('Duplicate Registration (should fail)', false);
  } catch (error) {
    testResult('Duplicate Registration (should fail)', error.response?.status === 400);
  }
}

// ============================================
// 2. EXPERT AUTHENTICATION TESTS
// ============================================

async function testExpertAuthentication() {
  log('\n=== EXPERT AUTHENTICATION TESTS ===', 'cyan');

  // Test 2.1: Expert Registration
  try {
    const response = await axios.post(`${BASE_URL}/expert/register`, testExpert);
    testResult('Expert Registration', response.status === 201 && response.data.token);
    if (response.data.token) expertToken = response.data.token;
  } catch (error) {
    testResult('Expert Registration', false, error);
  }

  // Test 2.2: Expert Login
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testExpert.email,
      password: testExpert.password
    });
    testResult('Expert Login', response.status === 200 && response.data.token);
    if (response.data.token) expertToken = response.data.token;
  } catch (error) {
    testResult('Expert Login', false, error);
  }

  // Test 2.3: Get Expert Profile
  try {
    const response = await axios.get(`${BASE_URL}/expert/profile`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    testResult('Get Expert Profile', response.status === 200 && response.data.name === testExpert.name);
  } catch (error) {
    testResult('Get Expert Profile', false, error);
  }

  // Test 2.4: Update Expert Profile
  try {
    const response = await axios.put(`${BASE_URL}/expert/profile`, {
      summary: 'Updated expert profile'
    }, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    testResult('Update Expert Profile', response.status === 200);
  } catch (error) {
    testResult('Update Expert Profile', false, error);
  }
}

// ============================================
// 3. LAND SURVEY TESTS
// ============================================

async function testLandSurvey() {
  log('\n=== LAND SURVEY TESTS ===', 'cyan');

  const surveyData = {
    latitude: 28.6139,
    longitude: 77.2090,
    plotArea: 1000,
    soilType: 'CLAY',
    slope: 2.5,
    elevation: 250,
    waterTableDepth: 8.5,
    seismicZone: 'ZONE_IV',
    floodRisk: 'MEDIUM',
    nearbyWaterBodies: false,
    waterBodyDistance: 500,
    averageRainfall: 1200
  };

  // Test 3.1: Create Land Survey
  try {
    const response = await axios.post(`${BASE_URL}/survey`, surveyData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create Land Survey', response.status === 201 && response.data.id);
    if (response.data.id) surveyId = response.data.id;
  } catch (error) {
    testResult('Create Land Survey', false, error);
  }

  // Test 3.2: Get All Surveys
  try {
    const response = await axios.get(`${BASE_URL}/survey`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get All Surveys', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get All Surveys', false, error);
  }

  // Test 3.3: Get Survey by ID
  try {
    const response = await axios.get(`${BASE_URL}/survey/${surveyId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Survey by ID', response.status === 200 && response.data.id === surveyId);
  } catch (error) {
    testResult('Get Survey by ID', false, error);
  }

  // Test 3.4: Update Survey
  try {
    const response = await axios.put(`${BASE_URL}/survey/${surveyId}`, {
      plotArea: 1200
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Update Survey', response.status === 200);
  } catch (error) {
    testResult('Update Survey', false, error);
  }
}

// ============================================
// 4. BUILDING INPUT TESTS
// ============================================

async function testBuildingInput() {
  log('\n=== BUILDING INPUT TESTS ===', 'cyan');

  const buildingData = {
    surveyId: surveyId,
    buildingType: 'RESIDENTIAL',
    totalFloors: 15,
    floorHeight: 3.0,
    totalHeight: 45.0,
    buildingLength: 30.0,
    buildingWidth: 20.0,
    foundationType: 'PILE',
    structuralSystem: 'RCC_FRAME',
    roofType: 'FLAT',
    wallMaterial: 'BRICK',
    occupancyType: 'RESIDENTIAL',
    expectedLifespan: 50,
    basementLevels: 2,
    parkingType: 'BASEMENT'
  };

  // Test 4.1: Create Building Input
  try {
    const response = await axios.post(`${BASE_URL}/building`, buildingData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create Building Input', response.status === 201 && response.data.id);
    if (response.data.id) buildingId = response.data.id;
  } catch (error) {
    testResult('Create Building Input', false, error);
  }

  // Test 4.2: Get All Buildings
  try {
    const response = await axios.get(`${BASE_URL}/building`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get All Buildings', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get All Buildings', false, error);
  }

  // Test 4.3: Get Building by ID
  try {
    const response = await axios.get(`${BASE_URL}/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Building by ID', response.status === 200 && response.data.id === buildingId);
  } catch (error) {
    testResult('Get Building by ID', false, error);
  }

  // Test 4.4: Update Building
  try {
    const response = await axios.put(`${BASE_URL}/building/${buildingId}`, {
      totalFloors: 18
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Update Building', response.status === 200);
  } catch (error) {
    testResult('Update Building', false, error);
  }
}

// ============================================
// 5. WIND DATA TESTS
// ============================================

async function testWindData() {
  log('\n=== WIND DATA TESTS ===', 'cyan');

  const windData = {
    buildingId: buildingId,
    basicWindSpeed: 47,
    terrainCategory: 'CATEGORY_2',
    riskCoefficient: 1.0,
    topographyFactor: 1.0,
    importanceFactor: 1.0,
    windZone: 'ZONE_3',
    exposureCondition: 'NORMAL'
  };

  // Test 5.1: Create Wind Data
  try {
    const response = await axios.post(`${BASE_URL}/wind`, windData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create Wind Data', response.status === 201 && response.data.id);
    if (response.data.id) windDataId = response.data.id;
  } catch (error) {
    testResult('Create Wind Data', false, error);
  }

  // Test 5.2: Get Wind Data by Building ID
  try {
    const response = await axios.get(`${BASE_URL}/wind/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Wind Data by Building ID', response.status === 200);
  } catch (error) {
    testResult('Get Wind Data by Building ID', false, error);
  }

  // Test 5.3: Update Wind Data
  try {
    const response = await axios.put(`${BASE_URL}/wind/${windDataId}`, {
      basicWindSpeed: 50
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Update Wind Data', response.status === 200);
  } catch (error) {
    testResult('Update Wind Data', false, error);
  }
}

// ============================================
// 6. ANALYSIS TESTS
// ============================================

async function testAnalysis() {
  log('\n=== ANALYSIS TESTS ===', 'cyan');

  // Test 6.1: Disaster Analysis
  try {
    const response = await axios.post(`${BASE_URL}/analysis/disaster`, {
      buildingId: buildingId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Disaster Analysis', response.status === 200 && response.data.overallRisk);
  } catch (error) {
    testResult('Disaster Analysis', false, error);
  }

  // Test 6.2: Vastu Analysis
  try {
    const response = await axios.post(`${BASE_URL}/analysis/vastu`, {
      buildingId: buildingId,
      mainEntranceDirection: 'NORTH',
      plotShape: 'RECTANGULAR'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Vastu Analysis', response.status === 200 && response.data.overallScore !== undefined);
  } catch (error) {
    testResult('Vastu Analysis', false, error);
  }

  // Test 6.3: Generate Report
  try {
    const response = await axios.post(`${BASE_URL}/analysis/report`, {
      buildingId: buildingId,
      reportType: 'COMPREHENSIVE'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Generate Report', response.status === 200 && response.data.reportId);
  } catch (error) {
    testResult('Generate Report', false, error);
  }
}

// ============================================
// 7. AI PROJECTS TESTS
// ============================================

async function testAIProjects() {
  log('\n=== AI PROJECTS TESTS ===', 'cyan');

  const projectData = {
    buildingId: buildingId,
    projectType: 'STRUCTURAL_ANALYSIS',
    description: 'Test AI project for structural analysis'
  };

  // Test 7.1: Create AI Project
  try {
    const response = await axios.post(`${BASE_URL}/ai/project`, projectData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create AI Project', response.status === 201 && response.data.id);
    if (response.data.id) projectId = response.data.id;
  } catch (error) {
    testResult('Create AI Project', false, error);
  }

  // Test 7.2: Get All AI Projects
  try {
    const response = await axios.get(`${BASE_URL}/ai/project`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get All AI Projects', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get All AI Projects', false, error);
  }

  // Test 7.3: Get AI Project by ID
  try {
    const response = await axios.get(`${BASE_URL}/ai/project/${projectId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get AI Project by ID', response.status === 200 && response.data.id === projectId);
  } catch (error) {
    testResult('Get AI Project by ID', false, error);
  }
}

// ============================================
// 8. AI CHAT TESTS
// ============================================

async function testAIChat() {
  log('\n=== AI CHAT TESTS ===', 'cyan');

  // Test 8.1: Create Chat Session
  try {
    const response = await axios.post(`${BASE_URL}/ai/chat/session`, {
      buildingId: buildingId
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create Chat Session', response.status === 201 && response.data.sessionId);
  } catch (error) {
    testResult('Create Chat Session', false, error);
  }

  // Test 8.2: Send Chat Message
  try {
    const response = await axios.post(`${BASE_URL}/ai/chat/message`, {
      buildingId: buildingId,
      message: 'What is the seismic risk for this building?'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Send Chat Message', response.status === 200 && response.data.response);
  } catch (error) {
    testResult('Send Chat Message', false, error);
  }
}

// ============================================
// 9. EXPERT QUERIES TESTS
// ============================================

async function testExpertQueries() {
  log('\n=== EXPERT QUERIES TESTS ===', 'cyan');

  const queryData = {
    buildingId: buildingId,
    title: 'Foundation Design Query',
    description: 'Need expert advice on foundation design for high-rise building',
    category: 'FOUNDATION',
    priority: 'HIGH'
  };

  // Test 9.1: Create Expert Query
  try {
    const response = await axios.post(`${BASE_URL}/expert/query`, queryData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Create Expert Query', response.status === 201 && response.data.id);
    if (response.data.id) queryId = response.data.id;
  } catch (error) {
    testResult('Create Expert Query', false, error);
  }

  // Test 9.2: Get All Queries (User)
  try {
    const response = await axios.get(`${BASE_URL}/expert/query`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get All Queries (User)', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get All Queries (User)', false, error);
  }

  // Test 9.3: Get Query by ID
  try {
    const response = await axios.get(`${BASE_URL}/expert/query/${queryId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Query by ID', response.status === 200 && response.data.id === queryId);
  } catch (error) {
    testResult('Get Query by ID', false, error);
  }
}

// ============================================
// 10. EXPERT DASHBOARD TESTS
// ============================================

async function testExpertDashboard() {
  log('\n=== EXPERT DASHBOARD TESTS ===', 'cyan');

  // Test 10.1: Get Expert Dashboard Stats
  try {
    const response = await axios.get(`${BASE_URL}/expert/dashboard/stats`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    testResult('Get Expert Dashboard Stats', response.status === 200);
  } catch (error) {
    testResult('Get Expert Dashboard Stats', false, error);
  }

  // Test 10.2: Get Available Queries (Expert)
  try {
    const response = await axios.get(`${BASE_URL}/expert/dashboard/queries`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    testResult('Get Available Queries (Expert)', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get Available Queries (Expert)', false, error);
  }

  // Test 10.3: Respond to Query
  try {
    const response = await axios.post(`${BASE_URL}/expert/query/${queryId}/respond`, {
      response: 'Based on the soil conditions, I recommend pile foundation with depth of 15m.'
    }, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    testResult('Respond to Query', response.status === 200);
  } catch (error) {
    testResult('Respond to Query', false, error);
  }

  // Test 10.4: Get Expert Directory
  try {
    const response = await axios.get(`${BASE_URL}/expert/directory`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Expert Directory', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get Expert Directory', false, error);
  }
}

// ============================================
// 11. REPORTS TESTS
// ============================================

async function testReports() {
  log('\n=== REPORTS TESTS ===', 'cyan');

  // Test 11.1: Get All Reports
  try {
    const response = await axios.get(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get All Reports', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get All Reports', false, error);
  }

  // Test 11.2: Get Reports by Building
  try {
    const response = await axios.get(`${BASE_URL}/reports/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Get Reports by Building', response.status === 200 && Array.isArray(response.data));
  } catch (error) {
    testResult('Get Reports by Building', false, error);
  }
}

// ============================================
// 12. CLEANUP TESTS
// ============================================

async function testCleanup() {
  log('\n=== CLEANUP TESTS ===', 'cyan');

  // Test 12.1: Delete Wind Data
  try {
    const response = await axios.delete(`${BASE_URL}/wind/${windDataId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Delete Wind Data', response.status === 200);
  } catch (error) {
    testResult('Delete Wind Data', false, error);
  }

  // Test 12.2: Delete Building
  try {
    const response = await axios.delete(`${BASE_URL}/building/${buildingId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Delete Building', response.status === 200);
  } catch (error) {
    testResult('Delete Building', false, error);
  }

  // Test 12.3: Delete Survey
  try {
    const response = await axios.delete(`${BASE_URL}/survey/${surveyId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testResult('Delete Survey', response.status === 200);
  } catch (error) {
    testResult('Delete Survey', false, error);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║     COMPLETE SITE TEST SUITE - ALL FEATURES          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  try {
    await testAuthentication();
    await testExpertAuthentication();
    await testLandSurvey();
    await testBuildingInput();
    await testWindData();
    await testAnalysis();
    await testAIProjects();
    await testAIChat();
    await testExpertQueries();
    await testExpertDashboard();
    await testReports();
    await testCleanup();

    // Print summary
    log('\n╔════════════════════════════════════════════════════════╗', 'blue');
    log('║                    TEST SUMMARY                        ║', 'blue');
    log('╚════════════════════════════════════════════════════════╝', 'blue');
    log(`\nTotal Tests: ${totalTests}`, 'cyan');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 'cyan');

    if (failedTests > 0) {
      log('\n╔════════════════════════════════════════════════════════╗', 'red');
      log('║                  FAILED TEST DETAILS                   ║', 'red');
      log('╚════════════════════════════════════════════════════════╝', 'red');
      failedTestDetails.forEach((detail, index) => {
        log(`\n${index + 1}. ${detail.test}`, 'red');
        log(`   Error: ${detail.error}`, 'yellow');
      });
    }

    log('\n╔════════════════════════════════════════════════════════╗', 'blue');
    log('║                  TEST COMPLETE                         ║', 'blue');
    log('╚════════════════════════════════════════════════════════╝', 'blue');

  } catch (error) {
    log('\n╔════════════════════════════════════════════════════════╗', 'red');
    log('║                  CRITICAL ERROR                        ║', 'red');
    log('╚════════════════════════════════════════════════════════╝', 'red');
    log(`\nError: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
runAllTests();
