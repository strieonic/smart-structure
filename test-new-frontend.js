// ============================================
// New Frontend Comprehensive Test
// Tests all features after redesign
// ============================================

const axios = require('axios');

const API = 'http://localhost:5000/api/v1';
const FRONTEND = 'http://localhost:8080';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}${message ? ': ' + message : ''}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testFrontendAccessibility() {
  console.log('\n🌐 Testing Frontend Accessibility...\n');
  
  try {
    const response = await axios.get(FRONTEND);
    logTest('Frontend Server', response.status === 200, `Status: ${response.status}`);
    
    // Check for key elements in HTML
    const html = response.data;
    logTest('Hero Section', html.includes('Engineering Intelligence Platform'));
    logTest('Menu Button', html.includes('menu-btn'));
    logTest('Feature Cards', html.includes('feature-card'));
    logTest('Authentication Section', html.includes('auth-section'));
    logTest('Survey Section', html.includes('survey-section'));
    logTest('Building Section', html.includes('building-section'));
    logTest('Wind Section', html.includes('wind-section'));
    logTest('Analysis Section', html.includes('analysis-section'));
    logTest('Reports Section', html.includes('reports-section'));
    logTest('AI Projects Section', html.includes('ai-projects-section'));
    logTest('AI Chat Section', html.includes('ai-chat-section'));
    logTest('Expert Queries Section', html.includes('expert-queries-section'));
    logTest('Expert Dashboard Section', html.includes('expert-dashboard-section'));
    
    // Check for scripts
    logTest('Main Script', html.includes('script.js'));
    logTest('Expert Interface Script', html.includes('expert-interface.js'));
    logTest('Error Notifications Script', html.includes('error-notifications.js'));
    
    // Check for styles
    logTest('Refined Theme CSS', html.includes('refined-theme.css'));
    logTest('Error Notifications CSS', html.includes('error-notifications.css'));
    
    // Check for Google Maps
    logTest('Google Maps API', html.includes('maps.googleapis.com'));
    
  } catch (error) {
    logTest('Frontend Server', false, error.message);
  }
}

async function testBackendHealth() {
  console.log('\n🏥 Testing Backend Health...\n');
  
  try {
    const response = await axios.get(`${API}/health`);
    logTest('Backend Server', response.status === 200);
    logTest('Health Check Response', response.data.status === 'ok');
  } catch (error) {
    logTest('Backend Server', false, error.message);
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 Testing Authentication Flow...\n');
  
  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456',
    name: 'Test User',
    role: 'USER'
  };
  
  try {
    // Test Registration
    const registerRes = await axios.post(`${API}/auth/register`, testUser);
    logTest('User Registration', registerRes.data.status === 'success');
    
    // Test Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    logTest('User Login', loginRes.data.status === 'success');
    logTest('Access Token Received', !!loginRes.data.data.accessToken);
    
    return loginRes.data.data.accessToken;
  } catch (error) {
    logTest('Authentication Flow', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testLandSurveyFlow(token) {
  console.log('\n🗺️ Testing Land Survey Flow...\n');
  
  if (!token) {
    logTest('Land Survey Flow', false, 'No auth token');
    return null;
  }
  
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
  
  try {
    const response = await axios.post(`${API}/land-surveys`, surveyData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    logTest('Create Land Survey', response.data.status === 'success');
    logTest('Survey ID Generated', !!response.data.data?.id);
    
    return response.data.data?.id;
  } catch (error) {
    logTest('Land Survey Flow', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testBuildingInputFlow(token, surveyId) {
  console.log('\n🏢 Testing Building Input Flow...\n');
  
  if (!token || !surveyId) {
    logTest('Building Input Flow', false, 'Missing token or survey ID');
    return null;
  }
  
  const buildingData = {
    landSurveyId: surveyId,
    buildingType: 'RESIDENTIAL',
    totalFloors: 15,
    floorHeight: 3.0,
    totalHeight: 45.0,
    builtUpArea: 12000,
    orientation: 'NORTH_EAST',
    structuralSystem: 'RCC',
    basementFloors: 2,
    parkingFloors: 2,
    expectedOccupancy: 150
  };
  
  try {
    const response = await axios.post(`${API}/building-inputs`, buildingData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    logTest('Create Building Input', response.data.status === 'success');
    logTest('Building ID Generated', !!response.data.data?.id);
    
    return response.data.data?.id;
  } catch (error) {
    logTest('Building Input Flow', false, error.response?.data?.message || error.message);
    return null;
  }
}

async function testWindDataFlow(token, buildingId) {
  console.log('\n💨 Testing Wind Data Flow...\n');
  
  if (!token || !buildingId) {
    logTest('Wind Data Flow', false, 'Missing token or building ID');
    return;
  }
  
  const windData = {
    buildingInputId: buildingId,
    windDirection: 270,
    averageWindSpeed: 35,
    peakGustSpeed: 55,
    terrainRoughness: 'CATEGORY_2'
  };
  
  try {
    const response = await axios.post(`${API}/wind`, windData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    logTest('Add Wind Data', response.data.status === 'success');
  } catch (error) {
    logTest('Wind Data Flow', false, error.response?.data?.message || error.message);
  }
}

async function testAnalysisFlow(token, buildingId) {
  console.log('\n📊 Testing Analysis Flow...\n');
  
  if (!token || !buildingId) {
    logTest('Analysis Flow', false, 'Missing token or building ID');
    return;
  }
  
  try {
    // Test Disaster Analysis
    const disasterRes = await axios.post(`${API}/analysis/disaster/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Disaster Analysis', disasterRes.data.status === 'success');
    
    // Test Vastu Analysis
    const vastuRes = await axios.post(`${API}/analysis/vastu/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Vastu Analysis', vastuRes.data.status === 'success');
    
    // Test Final Report
    const reportRes = await axios.post(`${API}/analysis/report/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    logTest('Final Report Generation', reportRes.data.status === 'success');
    
  } catch (error) {
    logTest('Analysis Flow', false, error.response?.data?.message || error.message);
  }
}

async function testExpertSystem(token) {
  console.log('\n👨‍💼 Testing Expert System...\n');
  
  if (!token) {
    logTest('Expert System', false, 'No auth token');
    return;
  }
  
  try {
    // Test posting a query
    const queryData = {
      title: 'Foundation Design Question',
      description: 'Need advice on foundation design for high water table area',
      category: 'foundation',
      priority: 'MEDIUM'
    };
    
    const response = await axios.post(`${API}/experts/queries`, queryData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    logTest('Post Expert Query', response.data.status === 'success');
    
    // Test loading verified experts
    const expertsRes = await axios.get(`${API}/experts`);
    logTest('Load Verified Experts', expertsRes.data.status === 'success');
    
  } catch (error) {
    logTest('Expert System', false, error.response?.data?.message || error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     NEW FRONTEND COMPREHENSIVE TEST SUITE             ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  // Test frontend and backend
  await testFrontendAccessibility();
  await testBackendHealth();
  
  // Test complete user flow
  const token = await testAuthenticationFlow();
  
  if (token) {
    const surveyId = await testLandSurveyFlow(token);
    
    if (surveyId) {
      const buildingId = await testBuildingInputFlow(token, surveyId);
      
      if (buildingId) {
        await testWindDataFlow(token, buildingId);
        await testAnalysisFlow(token, buildingId);
      }
    }
    
    await testExpertSystem(token);
  }
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed > 0) {
    console.log('Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(t => {
      console.log(`  ❌ ${t.name}: ${t.message}`);
    });
  }
  
  console.log('\n✨ Testing complete!\n');
}

// Run tests
runAllTests().catch(console.error);
