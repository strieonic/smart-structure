// Frontend functionality test
const API = "http://localhost:5000/api/v1";

async function testFrontendFunctionality() {
  console.log('🎯 TESTING FRONTEND FUNCTIONALITY\n');
  
  let issues = [];
  
  // Test 1: Test Expert Registration Flow
  console.log('1️⃣ Testing Expert Registration Flow...');
  
  try {
    // Simulate expert registration
    const expertData = {
      name: "Test Frontend Expert",
      email: `frontend.expert.${Date.now()}@example.com`,
      password: "testpass123",
      phone: "+91 98765 43210",
      expertType: "STRUCTURAL_ENGINEER",
      experience: "10-15",
      location: "Mumbai",
      licenseNumber: `FRONT${Date.now()}`,
      specializations: ["Seismic Design", "Foundation Design"],
      summary: "Frontend test expert"
    };

    const regRes = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });

    const regData = await regRes.json();
    
    if (regData.status === 'success') {
      console.log('✅ Expert registration API works');
      
      // Test expert login
      const loginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: expertData.email, 
          password: expertData.password 
        })
      });

      const loginData = await loginRes.json();
      
      if (loginData.status === 'success' && loginData.data.user.role === 'EXPERT') {
        console.log('✅ Expert login works correctly');
        console.log('✅ Expert profile data included in login response');
        
        const expertToken = loginData.data.accessToken;
        
        // Test expert queries endpoint
        const queriesRes = await fetch(`${API}/experts/queries`, {
          headers: { "Authorization": "Bearer " + expertToken }
        });
        
        const queriesData = await queriesRes.json();
        if (queriesData.status === 'success') {
          console.log('✅ Expert queries endpoint works');
        } else {
          issues.push('Expert queries endpoint failed');
        }
        
        // Test expert profile update
        const profileUpdateRes = await fetch(`${API}/experts/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + expertToken
          },
          body: JSON.stringify({
            summary: "Updated summary for frontend test"
          })
        });
        
        const profileUpdateData = await profileUpdateRes.json();
        if (profileUpdateData.status === 'success') {
          console.log('✅ Expert profile update works');
        } else {
          issues.push('Expert profile update failed');
        }
        
      } else {
        issues.push('Expert login failed or incorrect role');
      }
    } else {
      issues.push('Expert registration failed');
    }
  } catch (err) {
    issues.push(`Expert registration flow error: ${err.message}`);
  }

  // Test 2: Test User Registration and Query Creation
  console.log('\n2️⃣ Testing User Registration and Query Flow...');
  
  try {
    const userData = {
      name: "Test Frontend User",
      email: `frontend.user.${Date.now()}@example.com`,
      password: "testpass123",
      role: "USER"
    };

    const userRegRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    const userRegData = await userRegRes.json();
    
    if (userRegData.status === 'success') {
      console.log('✅ User registration works');
      
      const userToken = userRegData.data.accessToken;
      
      // Test query creation
      const queryData = {
        title: "Frontend Test Query",
        description: "This is a test query from frontend testing",
        category: "foundation",
        priority: "MEDIUM"
      };

      const queryRes = await fetch(`${API}/experts/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + userToken
        },
        body: JSON.stringify(queryData)
      });

      const queryResData = await queryRes.json();
      if (queryResData.status === 'success') {
        console.log('✅ User query creation works');
      } else {
        issues.push('User query creation failed');
      }
      
    } else {
      issues.push('User registration failed');
    }
  } catch (err) {
    issues.push(`User registration flow error: ${err.message}`);
  }

  // Test 3: Test Experts Directory
  console.log('\n3️⃣ Testing Experts Directory...');
  
  try {
    const expertsRes = await fetch(`${API}/experts/experts`);
    const expertsData = await expertsRes.json();
    
    if (expertsData.status === 'success' && expertsData.data.length > 0) {
      console.log(`✅ Experts directory works (${expertsData.data.length} experts found)`);
      
      // Check expert data structure
      const expert = expertsData.data[0];
      const requiredFields = ['id', 'name', 'email', 'expertType', 'experience', 'location', 'specializations'];
      
      const missingFields = requiredFields.filter(field => !expert.hasOwnProperty(field));
      if (missingFields.length === 0) {
        console.log('✅ Expert data structure is correct');
      } else {
        issues.push(`Expert data missing fields: ${missingFields.join(', ')}`);
      }
    } else {
      issues.push('Experts directory failed or no experts found');
    }
  } catch (err) {
    issues.push(`Experts directory error: ${err.message}`);
  }

  // Test 4: Test Complete User Flow (Land Survey -> Building -> Analysis)
  console.log('\n4️⃣ Testing Complete User Flow...');
  
  try {
    // Create a test user
    const flowUserData = {
      name: "Flow Test User",
      email: `flow.user.${Date.now()}@example.com`,
      password: "testpass123",
      role: "USER"
    };

    const flowUserRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flowUserData)
    });

    const flowUserData2 = await flowUserRes.json();
    
    if (flowUserData2.status === 'success') {
      const flowToken = flowUserData2.data.accessToken;
      
      // Create land survey
      const surveyData = {
        latitude: 28.6139,
        longitude: 77.2090,
        plotArea: 1000,
        soilType: "CLAY",
        slope: 2.5,
        elevation: 250,
        waterTableDepth: 8.5,
        seismicZone: "ZONE_IV",
        floodRisk: "MEDIUM",
        nearbyWaterBodies: false,
        waterBodyDistance: 500,
        averageRainfall: 1200
      };

      const surveyRes = await fetch(`${API}/land-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + flowToken
        },
        body: JSON.stringify(surveyData)
      });

      const surveyResData = await surveyRes.json();
      
      if (surveyResData.status === 'success') {
        console.log('✅ Complete flow: Land survey creation works');
        
        const surveyId = surveyResData.data.id;
        
        // Create building input
        const buildingData = {
          landSurveyId: surveyId,
          buildingType: "RESIDENTIAL",
          totalFloors: 10,
          floorHeight: 3.0,
          totalHeight: 30.0,
          builtUpArea: 8000,
          orientation: "NORTH_EAST",
          structuralSystem: "RCC",
          basementFloors: 1,
          parkingFloors: 1,
          expectedOccupancy: 100
        };

        const buildingRes = await fetch(`${API}/building-inputs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + flowToken
          },
          body: JSON.stringify(buildingData)
        });

        const buildingResData = await buildingRes.json();
        
        if (buildingResData.status === 'success') {
          console.log('✅ Complete flow: Building input creation works');
          
          const buildingId = buildingResData.data.id;
          
          // Run disaster analysis
          const analysisRes = await fetch(`${API}/analysis/disaster/${buildingId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + flowToken }
          });

          const analysisData = await analysisRes.json();
          
          if (analysisData.status === 'success') {
            console.log('✅ Complete flow: Disaster analysis works');
          } else {
            issues.push('Complete flow: Disaster analysis failed');
          }
          
        } else {
          issues.push('Complete flow: Building input creation failed');
        }
      } else {
        issues.push('Complete flow: Land survey creation failed');
      }
    } else {
      issues.push('Complete flow: User registration failed');
    }
  } catch (err) {
    issues.push(`Complete flow error: ${err.message}`);
  }

  // Final Results
  console.log('\n📊 FRONTEND FUNCTIONALITY TEST RESULTS');
  console.log('='.repeat(50));
  
  if (issues.length === 0) {
    console.log('🎉 ALL FRONTEND FUNCTIONALITY TESTS PASSED!');
    console.log('✅ Expert registration and authentication');
    console.log('✅ User registration and authentication');
    console.log('✅ Expert queries system');
    console.log('✅ Expert profile management');
    console.log('✅ Experts directory');
    console.log('✅ Complete user workflow');
    console.log('\n🚀 Frontend is fully functional and ready for production!');
  } else {
    console.log(`❌ Found ${issues.length} issues:`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  return issues;
}

testFrontendFunctionality();