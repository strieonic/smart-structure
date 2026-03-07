const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testAPI() {
  console.log('🧪 Testing API Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data);

    // Test 2: Register User
    console.log('\n2. Testing user registration...');
    const testEmail = `testuser${Date.now()}@example.com`;
    const testPassword = 'Test123456';
    let token;
    
    const register = await axios.post(`${API_BASE}/auth/register`, {
      email: testEmail,
      password: testPassword,
      name: 'Test User'
    });
    console.log('✅ Registration successful');
    token = register.data.data.accessToken;
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Email:', testEmail);

    // Test 4: Create Land Survey
    console.log('\n4. Testing land survey creation...');
    const survey = await axios.post(
      `${API_BASE}/land-surveys`,
      {
        latitude: 19.0760,
        longitude: 72.8777,
        plotArea: 1000,
        soilType: 'CLAY',
        slope: 2.5,
        elevation: 250,
        waterTableDepth: 8.5,
        seismicZone: 'ZONE_IV',
        floodRisk: 'MEDIUM',
        nearbyWaterBodies: false
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const surveyId = survey.data.data.id;
    console.log('✅ Land survey created:', surveyId);

    // Test 5: Create Building Input
    console.log('\n5. Testing building input creation...');
    const building = await axios.post(
      `${API_BASE}/building-inputs`,
      {
        landSurveyId: surveyId,
        buildingType: 'RESIDENTIAL',
        totalFloors: 10,
        floorHeight: 3.0,
        totalHeight: 30.0,
        builtUpArea: 5000,
        orientation: 'NORTH_EAST',
        structuralSystem: 'RCC',
        basementFloors: 1,
        parkingFloors: 2
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const buildingId = building.data.data.id;
    console.log('✅ Building input created:', buildingId);

    // Test 6: Create Project (NEW AI FEATURE)
    console.log('\n6. Testing AI project creation...');
    const project = await axios.post(
      `${API_BASE}/projects`,
      {
        projectName: 'Test AI Project',
        latitude: 19.0760,
        longitude: 72.8777,
        buildingInputId: buildingId,
        projectType: 'RESIDENTIAL'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const projectId = project.data.data.project.id;
    console.log('✅ AI Project created:', projectId);
    console.log('Location:', project.data.data.project.location.city, ',', project.data.data.project.location.state);
    console.log('Zone Type:', project.data.data.project.location.zoneType);
    console.log('Applicable Rules:', project.data.data.applicableRules.length);

    // Test 7: Run AI Analysis (NEW AI FEATURE)
    console.log('\n7. Testing AI analysis...');
    console.log('⏳ Running hybrid analysis (this may take 10-20 seconds)...');
    const analysis = await axios.post(
      `${API_BASE}/projects/${projectId}/analyze`,
      {},
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000 // 60 second timeout
      }
    );
    console.log('✅ AI Analysis completed!');
    console.log('Combined Score:', analysis.data.data.combinedScore);
    console.log('Overall Status:', analysis.data.data.overallStatus);
    console.log('Critical Issues:', analysis.data.data.criticalIssues.length);
    console.log('Action Items:', analysis.data.data.actionItems.length);

    // Test 8: Create Chat Session (NEW AI FEATURE)
    console.log('\n8. Testing AI chat session...');
    const chatSession = await axios.post(
      `${API_BASE}/chat/sessions`,
      { projectId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const sessionId = chatSession.data.data.session.id;
    console.log('✅ Chat session created:', sessionId);

    // Test 9: Send Chat Message (NEW AI FEATURE)
    console.log('\n9. Testing AI chat message...');
    const chatMessage = await axios.post(
      `${API_BASE}/chat/sessions/${sessionId}/messages`,
      { message: 'What are the main compliance issues with my project?' },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    console.log('✅ AI Response received:');
    console.log(chatMessage.data.data.message.content.substring(0, 200) + '...');

    console.log('\n🎉 All tests passed!');
    console.log('\n📊 Summary:');
    console.log('- Health check: ✅');
    console.log('- Authentication: ✅');
    console.log('- Land survey: ✅');
    console.log('- Building input: ✅');
    console.log('- AI Project creation: ✅');
    console.log('- AI Analysis: ✅');
    console.log('- AI Chat: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

testAPI();
