// Test Report Generation
const axios = require('axios');

const API = 'http://localhost:5000/api/v1';

async function testReportGeneration() {
  console.log('\n🧪 Testing Report Generation\n');
  
  let token = '';
  let buildingId = '';
  
  try {
    // Step 1: Register and login
    console.log('1. Creating test user...');
    const email = `test_${Date.now()}@test.com`;
    await axios.post(`${API}/auth/register`, {
      email,
      password: 'Test@123456',
      name: 'Test User',
      role: 'USER'
    });
    
    const loginRes = await axios.post(`${API}/auth/login`, {
      email,
      password: 'Test@123456'
    });
    token = loginRes.data.data.accessToken;
    console.log('   ✓ User logged in');
    
    // Step 2: Create land survey
    console.log('\n2. Creating land survey...');
    const surveyRes = await axios.post(`${API}/land-surveys`, {
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
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const surveyId = surveyRes.data.data.id;
    console.log('   ✓ Land survey created');
    
    // Step 3: Create building input
    console.log('\n3. Creating building input...');
    const buildingRes = await axios.post(`${API}/building-inputs`, {
      landSurveyId: surveyId,
      buildingType: 'RESIDENTIAL',
      totalFloors: 10,
      floorHeight: 3.5,
      totalHeight: 35,
      builtUpArea: 400,
      orientation: 'NORTH',
      structuralSystem: 'RCC',  // Fixed: Changed from RCC_FRAME to RCC
      basementFloors: 2,
      parkingFloors: 1,
      expectedOccupancy: 100
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    buildingId = buildingRes.data.data.id;
    console.log('   ✓ Building input created');
    
    // Step 4: Add wind data
    console.log('\n4. Adding wind data...');
    await axios.post(`${API}/wind`, {
      buildingInputId: buildingId,
      windDirection: 270,
      averageWindSpeed: 25,
      peakGustSpeed: 45,
      terrainRoughness: 'CATEGORY_2'  // Fixed: Changed from URBAN to CATEGORY_2
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Wind data added');
    
    // Step 5: Run disaster analysis (required for final report)
    console.log('\n5. Running disaster analysis...');
    const disasterRes = await axios.post(`${API}/analysis/disaster/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Disaster analysis completed');
    
    // Step 6: Run Vastu analysis (required for final report)
    console.log('\n6. Running Vastu analysis...');
    const vastuRes = await axios.post(`${API}/analysis/vastu/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('   ✓ Vastu analysis completed');
    
    // Step 7: Generate final report
    console.log('\n7. Generating final report...');
    const reportRes = await axios.post(`${API}/analysis/report/${buildingId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📊 REPORT GENERATION RESULT:');
    console.log('Status:', reportRes.data.status);
    console.log('Message:', reportRes.data.message || 'No message');
    
    if (reportRes.data.status === 'success' && reportRes.data.data) {
      console.log('\n✅ SUCCESS! Report generated with data:');
      console.log('- Overall Safety Score:', reportRes.data.data.overallSafetyScore);
      console.log('- Cost Efficiency Score:', reportRes.data.data.costEfficiencyScore);
      console.log('- Sustainability Score:', reportRes.data.data.sustainabilityScore);
      console.log('- Vastu Score:', reportRes.data.data.vastuScore);
      console.log('- Report Status:', reportRes.data.data.reportStatus);
      console.log('\n✓ Report generation is working correctly!');
    } else {
      console.log('\n❌ FAILED! Report not generated properly');
      console.log('Response:', JSON.stringify(reportRes.data, null, 2));
    }
    
    // Step 6: Try to retrieve the report
    console.log('\n8. Retrieving generated report...');
    const getReportRes = await axios.get(`${API}/analysis/report/${buildingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (getReportRes.data.status === 'success' && getReportRes.data.data) {
      console.log('   ✓ Report retrieved successfully');
      console.log('   ✓ Report can be viewed in frontend');
    } else {
      console.log('   ✗ Report retrieval failed');
      console.log('   Response:', JSON.stringify(getReportRes.data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testReportGeneration();
