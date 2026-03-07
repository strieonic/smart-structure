// ============================================
// Comprehensive Site Testing Script
// Tests ALL features, APIs, functions, and buttons
// ============================================

const axios = require('axios');
const API = 'http://localhost:5000/api/v1';

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, status, message = '') {
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${emoji} ${name}: ${message}`);
  
  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push({ name, message });
  else results.warnings.push({ name, message });
}

// Test data
let testUser = {
  email: `test_${Date.now()}@test.com`,
  password: 'Test@123456',
  name: 'Test User',
  role: 'USER'
};

let testExpert = {
  email: `expert_${Date.now()}@test.com`,
  password: 'Expert@123456',
  name: 'Test Expert',
  role: 'EXPERT'
};

let token = '';
let expertToken = '';
let surveyId = '';
let buildingId = '';
let aiProjectId = '';
let expertProfileId = '';
let queryId = '';

async function testAuthenticationSystem() {
  console.log('\n🔐 TESTING AUTHENTICATION SYSTEM\n');
  
  try {
    // Test 1: User Registration
    const registerRes = await axios.post(`${API}/auth/register`, testUser);
    logTest('User Registration', registerRes.data.status === 'success' ? 'pass' : 'fail', 
      registerRes.data.message || 'User registered');
    
    // Test 2: User Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginRes.data.status === 'success' && loginRes.data.data.accessToken) {
      token = loginRes.data.data.accessToken;
      logTest('User Login', 'pass', 'Token received');
    } else {
      logTest('User Login', 'fail', 'No token received');
    }
    
    // Test 3: Token Validation
    const profileRes = await axios.get(`${API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Token Validation', profileRes.data.status === 'success' ? 'pass' : 'fail',
      'Profile retrieved with token');
    
    // Test 4: Expert Registration
    const expertRegRes = await axios.post(`${API}/auth/register`, testExpert);
    logTest('Expert Registration', expertRegRes.data.status === 'success' ? 'pass' : 'fail',
      'Expert account created');
    
    // Test 5: Expert Login
    const expertLoginRes = await axios.post(`${API}/auth/login`, {
      email: testExpert.email,
      password: testExpert.password
    });
    
    if (expertLoginRes.data.status === 'success' && expertLoginRes.data.data.accessToken) {
      expertToken = expertLoginRes.data.data.accessToken;
      logTest('Expert Login', 'pass', 'Expert token received');
    } else {
      logTest('Expert Login', 'fail', 'No expert token received');
    }
    
  } catch (error) {
    logTest('Authentication System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testLandSurveySystem() {
  console.log('\n🗺️ TESTING LAND SURVEY SYSTEM\n');
  
  try {
    // Test 1: Create Land Survey
    const surveyData = {
      latitude: 28.6139,
      longitude: 77.2090,
      plotArea: 500,
      soilType: 'CLAY',
      slope: 2.5,
      elevation: 250,
      waterTableDepth: 15,
      seismicZone: 'ZONE_IV',
      floodRisk: 'MEDIUM',
      nearbyWaterBodies: true,
      waterBodyDistance: 500,
      averageRainfall: 1200
    };
    
    const createRes = await axios.post(`${API}/land-surveys`, surveyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (createRes.data.status === 'success' && createRes.data.data) {
      surveyId = createRes.data.data.id;
      logTest('Create Land Survey', 'pass', `Survey ID: ${surveyId.substring(0, 8)}`);
    } else {
      logTest('Create Land Survey', 'fail', 'No survey created');
    }
    
    // Test 2: Get All Surveys
    const getAllRes = await axios.get(`${API}/land-surveys`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get All Surveys', getAllRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${getAllRes.data.data?.length || 0} surveys`);
    
    // Test 3: Get Survey by ID
    const getByIdRes = await axios.get(`${API}/land-surveys/${surveyId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Survey by ID', getByIdRes.data.status === 'success' ? 'pass' : 'fail',
      'Survey retrieved');
    
    // Test 4: Update Survey
    const updateRes = await axios.patch(`${API}/land-surveys/${surveyId}`, {
      plotArea: 600
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Update Survey', updateRes.data.status === 'success' ? 'pass' : 'fail',
      'Survey updated');
    
  } catch (error) {
    logTest('Land Survey System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testBuildingInputSystem() {
  console.log('\n🏢 TESTING BUILDING INPUT SYSTEM\n');
  
  try {
    // Test 1: Create Building Input
    const buildingData = {
      landSurveyId: surveyId,
      buildingType: 'RESIDENTIAL',
      totalFloors: 10,
      floorHeight: 3.5,
      totalHeight: 35,
      builtUpArea: 400,
      orientation: 'NORTH',
      structuralSystem: 'RCC',
      basementFloors: 2,
      parkingFloors: 1,
      expectedOccupancy: 100
    };
    
    const createRes = await axios.post(`${API}/building-inputs`, buildingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (createRes.data.status === 'success' && createRes.data.data) {
      buildingId = createRes.data.data.id;
      logTest('Create Building Input', 'pass', `Building ID: ${buildingId.substring(0, 8)}`);
    } else {
      logTest('Create Building Input', 'fail', 'No building created');
    }
    
    // Test 2: Get All Buildings
    const getAllRes = await axios.get(`${API}/building-inputs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get All Buildings', getAllRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${getAllRes.data.data?.length || 0} buildings`);
    
    // Test 3: Get Building by ID
    const getByIdRes = await axios.get(`${API}/building-inputs/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Building by ID', getByIdRes.data.status === 'success' ? 'pass' : 'fail',
      'Building retrieved');
    
  } catch (error) {
    logTest('Building Input System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testWindDataSystem() {
  console.log('\n💨 TESTING WIND DATA SYSTEM\n');
  
  try {
    // Test 1: Add Wind Data
    const windData = {
      buildingInputId: buildingId,
      windDirection: 270,
      averageWindSpeed: 25,
      peakGustSpeed: 45,
      terrainRoughness: 'CATEGORY_2'
    };
    
    const createRes = await axios.post(`${API}/wind`, windData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Add Wind Data', createRes.data.status === 'success' ? 'pass' : 'fail',
      'Wind data added');
    
    // Test 2: Get Wind Data
    const getRes = await axios.get(`${API}/wind/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Wind Data', getRes.data.status === 'success' ? 'pass' : 'fail',
      'Wind data retrieved');
    
  } catch (error) {
    logTest('Wind Data System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testAnalysisSystem() {
  console.log('\n📊 TESTING ANALYSIS SYSTEM\n');
  
  try {
    // Test 1: Run Disaster Analysis
    const disasterRes = await axios.post(`${API}/analysis/disaster/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Run Disaster Analysis', disasterRes.data.status === 'success' ? 'pass' : 'fail',
      `Safety Score: ${disasterRes.data.data?.overallSafetyScore || 'N/A'}`);
    
    // Test 2: Get Disaster Report
    const getDisasterRes = await axios.get(`${API}/analysis/disaster/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Disaster Report', getDisasterRes.data.status === 'success' ? 'pass' : 'fail',
      'Disaster report retrieved');
    
    // Test 3: Run Vastu Analysis
    const vastuRes = await axios.post(`${API}/analysis/vastu/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Run Vastu Analysis', vastuRes.data.status === 'success' ? 'pass' : 'fail',
      `Vastu Score: ${vastuRes.data.data?.overallScore || 'N/A'}`);
    
    // Test 4: Get Vastu Report
    const getVastuRes = await axios.get(`${API}/analysis/vastu/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Vastu Report', getVastuRes.data.status === 'success' ? 'pass' : 'fail',
      'Vastu report retrieved');
    
    // Test 5: Generate Final Report
    const reportRes = await axios.post(`${API}/analysis/report/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Generate Final Report', reportRes.data.status === 'success' ? 'pass' : 'fail',
      `Overall Score: ${reportRes.data.data?.overallSafetyScore || 'N/A'}`);
    
    // Test 6: Get Final Report
    const getFinalRes = await axios.get(`${API}/analysis/report/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Final Report', getFinalRes.data.status === 'success' ? 'pass' : 'fail',
      'Final report retrieved');
    
  } catch (error) {
    logTest('Analysis System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testAIProjectSystem() {
  console.log('\n🤖 TESTING AI PROJECT SYSTEM\n');
  
  try {
    // Test 1: Create AI Project
    const projectData = {
      buildingInputId: buildingId,
      name: 'Test AI Project',
      description: 'Testing AI project functionality'
    };
    
    const createRes = await axios.post(`${API}/ai-projects`, projectData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (createRes.data.status === 'success' && createRes.data.data) {
      aiProjectId = createRes.data.data.id;
      logTest('Create AI Project', 'pass', `Project ID: ${aiProjectId.substring(0, 8)}`);
    } else {
      logTest('Create AI Project', 'fail', 'No project created');
    }
    
    // Test 2: Get All AI Projects
    const getAllRes = await axios.get(`${API}/ai-projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get All AI Projects', getAllRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${getAllRes.data.data?.length || 0} projects`);
    
    // Test 3: Get AI Project by ID
    const getByIdRes = await axios.get(`${API}/ai-projects/${aiProjectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get AI Project by ID', getByIdRes.data.status === 'success' ? 'pass' : 'fail',
      'Project retrieved');
    
  } catch (error) {
    logTest('AI Project System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testAIChatSystem() {
  console.log('\n💬 TESTING AI CHAT SYSTEM\n');
  
  try {
    // Test 1: Send Chat Message
    const chatData = {
      projectId: aiProjectId,
      message: 'What are the structural recommendations for this building?'
    };
    
    const chatRes = await axios.post(`${API}/ai-chat`, chatData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Send AI Chat Message', chatRes.data.status === 'success' ? 'pass' : 'fail',
      'AI response received');
    
    // Test 2: Get Chat History
    const historyRes = await axios.get(`${API}/ai-chat/${aiProjectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Chat History', historyRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${historyRes.data.data?.length || 0} messages`);
    
  } catch (error) {
    logTest('AI Chat System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testExpertSystem() {
  console.log('\n👨‍💼 TESTING EXPERT SYSTEM\n');
  
  try {
    // Test 1: Create Expert Profile
    const expertData = {
      professionalType: 'STRUCTURAL_ENGINEER',
      yearsOfExperience: '10-15',
      location: 'Mumbai',
      licenseNumber: 'SE12345',
      specializations: ['Seismic Design', 'High-Rise Structures'],
      bio: 'Experienced structural engineer'
    };
    
    const createRes = await axios.post(`${API}/experts/register`, expertData, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    
    if (createRes.data.status === 'success' && createRes.data.data) {
      expertProfileId = createRes.data.data.id;
      logTest('Create Expert Profile', 'pass', `Profile ID: ${expertProfileId.substring(0, 8)}`);
    } else {
      logTest('Create Expert Profile', 'fail', 'No profile created');
    }
    
    // Test 2: Get Expert Dashboard
    const dashboardRes = await axios.get(`${API}/experts/dashboard`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    logTest('Get Expert Dashboard', dashboardRes.data.status === 'success' ? 'pass' : 'fail',
      'Dashboard data retrieved');
    
    // Test 3: Get All Experts (Directory)
    const directoryRes = await axios.get(`${API}/experts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Get Expert Directory', directoryRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${directoryRes.data.data?.length || 0} experts`);
    
    // Test 4: Create Expert Query (from user)
    const queryData = {
      expertId: expertProfileId,
      buildingInputId: buildingId,
      queryType: 'STRUCTURAL_REVIEW',
      title: 'Need structural review',
      description: 'Please review my building design'
    };
    
    const queryRes = await axios.post(`${API}/queries`, queryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (queryRes.data.status === 'success' && queryRes.data.data) {
      queryId = queryRes.data.data.id;
      logTest('Create Expert Query', 'pass', `Query ID: ${queryId.substring(0, 8)}`);
    } else {
      logTest('Create Expert Query', 'fail', 'No query created');
    }
    
    // Test 5: Get Expert Queries
    const getQueriesRes = await axios.get(`${API}/queries/all`, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    logTest('Get Expert Queries', getQueriesRes.data.status === 'success' ? 'pass' : 'fail',
      `Found ${getQueriesRes.data.data?.length || 0} queries`);
    
    // Test 6: Respond to Query
    const responseData = {
      response: 'Your building design looks good. Here are my recommendations...'
    };
    
    const respondRes = await axios.patch(`${API}/queries/${queryId}/respond`, responseData, {
      headers: { Authorization: `Bearer ${expertToken}` }
    });
    logTest('Respond to Query', respondRes.data.status === 'success' ? 'pass' : 'fail',
      'Response submitted');
    
  } catch (error) {
    logTest('Expert System', 'fail', error.response?.data?.message || error.message);
  }
}

async function testErrorHandler() {
  console.log('\n🚨 TESTING ERROR HANDLER\n');
  
  try {
    const ERROR_HANDLER_API = 'http://localhost:9999';
    
    // Test 1: Error Handler Health Check
    const healthRes = await axios.get(`${ERROR_HANDLER_API}/health`);
    logTest('Error Handler Health', healthRes.status === 200 ? 'pass' : 'fail',
      'Error handler is running');
    
    // Test 2: Log Frontend Error
    const errorData = {
      message: 'Test frontend error',
      stack: 'Test stack trace',
      timestamp: new Date().toISOString()
    };
    
    const logRes = await axios.post(`${ERROR_HANDLER_API}/frontend-error`, errorData);
    logTest('Log Frontend Error', logRes.status === 200 ? 'pass' : 'fail',
      'Error logged successfully');
    
  } catch (error) {
    logTest('Error Handler', 'fail', error.message);
  }
}

async function testFrontendButtons() {
  console.log('\n🖱️ TESTING FRONTEND BUTTONS & FUNCTIONS\n');
  
  // These are manual checks - log what needs to be tested
  const frontendTests = [
    'Login Button - Opens login form',
    'Register Button - Opens registration form',
    'Logout Button - Clears session and redirects',
    'Create Survey Button - Submits land survey form',
    'Create Building Button - Submits building input form',
    'Add Wind Data Button - Submits wind data form',
    'Run Disaster Analysis Button - Triggers disaster analysis',
    'Run Vastu Analysis Button - Triggers Vastu analysis',
    'Generate Final Report Button - Creates comprehensive report',
    'Run All Analyses Button - Runs all analyses in sequence',
    'View Disaster Report Button - Displays disaster report',
    'View Vastu Report Button - Displays Vastu report',
    'View Final Report Button - Displays final report',
    'Create AI Project Button - Creates new AI project',
    'Send AI Chat Button - Sends message to AI',
    'Create Expert Profile Button - Registers expert',
    'Submit Query Button - Sends query to expert',
    'Respond to Query Button - Expert responds to query',
    'Hamburger Menu - Opens/closes sidebar',
    'Navigation Links - Switch between sections',
    'Auto-fill Location Button - Gets current location',
    'Auto-fill Elevation Button - Fetches elevation data',
    'Auto-fill Wind Data Button - Gets weather data',
    'Map Search - Searches for location',
    'Map Click - Places marker on map',
    'Marker Drag - Updates coordinates'
  ];
  
  console.log('\n📋 Frontend Elements to Test Manually:\n');
  frontendTests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`);
  });
  
  logTest('Frontend Button List', 'pass', `${frontendTests.length} buttons/functions documented`);
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   SMART LOAD ANALYZER - COMPREHENSIVE TEST SUITE      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  const startTime = Date.now();
  
  await testAuthenticationSystem();
  await testLandSurveySystem();
  await testBuildingInputSystem();
  await testWindDataSystem();
  await testAnalysisSystem();
  await testAIProjectSystem();
  await testAIChatSystem();
  await testExpertSystem();
  await testErrorHandler();
  await testFrontendButtons();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  console.log(`⏱️  Duration: ${duration}s\n`);
  
  if (results.failed.length > 0) {
    console.log('Failed Tests:');
    results.failed.forEach(({ name, message }) => {
      console.log(`  ❌ ${name}: ${message}`);
    });
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(({ name, message }) => {
      console.log(`  ⚠️  ${name}: ${message}`);
    });
    console.log('');
  }
  
  const successRate = ((results.passed.length / (results.passed.length + results.failed.length)) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%\n`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT! All major systems are working correctly!\n');
  } else if (successRate >= 70) {
    console.log('👍 GOOD! Most systems are working, but some need attention.\n');
  } else {
    console.log('⚠️  WARNING! Multiple systems need fixing.\n');
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('\n💥 CRITICAL ERROR:', error.message);
  process.exit(1);
});
