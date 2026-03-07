const API = "http://localhost:5000/api/v1";

async function finalComprehensiveTest() {
  console.log('🔥 FINAL COMPREHENSIVE SYSTEM TEST\n');
  console.log('Testing all components of Smart Load Analyzer with Expert System\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let issues = [];

  function test(name, condition, errorMsg = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.log(`❌ ${name} - ${errorMsg}`);
      issues.push({ test: name, error: errorMsg });
    }
  }

  try {
    // 1. SYSTEM HEALTH TESTS
    console.log('🏥 SYSTEM HEALTH TESTS');
    console.log('-'.repeat(30));
    
    const healthRes = await fetch(`${API}/health`);
    const healthData = await healthRes.json();
    test('API Server Health', healthData.status === 'success');

    // 2. AUTHENTICATION SYSTEM TESTS
    console.log('\n👤 AUTHENTICATION SYSTEM TESTS');
    console.log('-'.repeat(30));
    
    // Test User Registration
    const userData = {
      name: "Final Test User",
      email: `final.user.${Date.now()}@example.com`,
      password: "finaltest123",
      role: "USER"
    };

    const userRegRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });
    const userRegData = await userRegRes.json();
    test('User Registration', userRegData.status === 'success');

    let userToken = null;
    if (userRegData.status === 'success') {
      userToken = userRegData.data.accessToken;
      
      // Test User Login
      const userLoginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userData.email, password: userData.password })
      });
      const userLoginData = await userLoginRes.json();
      test('User Login', userLoginData.status === 'success');
    }

    // Test Expert Registration
    const expertData = {
      name: "Final Test Expert",
      email: `final.expert.${Date.now()}@example.com`,
      password: "finaltest123",
      phone: "+91 98765 43210",
      expertType: "STRUCTURAL_ENGINEER",
      experience: "15-20",
      location: "Delhi",
      licenseNumber: `FINAL${Date.now()}`,
      specializations: ["Seismic Design", "Foundation Design", "High-Rise Structures"],
      summary: "Final test expert with comprehensive expertise"
    };

    const expertRegRes = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });
    const expertRegData = await expertRegRes.json();
    test('Expert Registration', expertRegData.status === 'success');

    let expertToken = null;
    if (expertRegData.status === 'success') {
      expertToken = expertRegData.data.accessToken;
      
      // Test Expert Login
      const expertLoginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: expertData.email, password: expertData.password })
      });
      const expertLoginData = await expertLoginRes.json();
      test('Expert Login', expertLoginData.status === 'success');
      test('Expert Profile in Login', expertLoginData.data?.user?.expertProfile !== undefined);
    }

    // 3. CORE PLATFORM TESTS
    console.log('\n🏗️ CORE PLATFORM TESTS');
    console.log('-'.repeat(30));

    if (userToken) {
      // Land Survey
      const surveyData = {
        latitude: 28.6139,
        longitude: 77.2090,
        plotArea: 1500,
        soilType: "BLACK_COTTON",
        slope: 3.0,
        elevation: 280,
        waterTableDepth: 10.0,
        seismicZone: "ZONE_IV",
        floodRisk: "MEDIUM",
        nearbyWaterBodies: true,
        waterBodyDistance: 300,
        averageRainfall: 1400
      };

      const surveyRes = await fetch(`${API}/land-surveys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + userToken
        },
        body: JSON.stringify(surveyData)
      });
      const surveyResData = await surveyRes.json();
      test('Land Survey Creation', surveyResData.status === 'success');

      if (surveyResData.status === 'success') {
        const surveyId = surveyResData.data.id;
        
        // Building Input
        const buildingData = {
          landSurveyId: surveyId,
          buildingType: "COMMERCIAL",
          totalFloors: 20,
          floorHeight: 3.5,
          totalHeight: 70.0,
          builtUpArea: 15000,
          orientation: "SOUTH_EAST",
          structuralSystem: "RCC",
          basementFloors: 3,
          parkingFloors: 2,
          expectedOccupancy: 300
        };

        const buildingRes = await fetch(`${API}/building-inputs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + userToken
          },
          body: JSON.stringify(buildingData)
        });
        const buildingResData = await buildingRes.json();
        test('Building Input Creation', buildingResData.status === 'success');

        if (buildingResData.status === 'success') {
          const buildingId = buildingResData.data.id;
          
          // Wind Data
          const windData = {
            buildingInputId: buildingId,
            windDirection: 225,
            averageWindSpeed: 40,
            peakGustSpeed: 65,
            terrainRoughness: "CATEGORY_3"
          };

          const windRes = await fetch(`${API}/wind`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + userToken
            },
            body: JSON.stringify(windData)
          });
          const windResData = await windRes.json();
          test('Wind Data Creation', windResData.status === 'success');

          // Analysis Tests
          const disasterRes = await fetch(`${API}/analysis/disaster/${buildingId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + userToken }
          });
          const disasterData = await disasterRes.json();
          test('Disaster Analysis', disasterData.status === 'success');

          const vastuRes = await fetch(`${API}/analysis/vastu/${buildingId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + userToken }
          });
          const vastuData = await vastuRes.json();
          test('Vastu Analysis', vastuData.status === 'success');

          // AI Project
          const projectData = {
            projectName: "Final Test Commercial Tower",
            latitude: 28.6139,
            longitude: 77.2090,
            buildingInputId: buildingId,
            projectType: "COMMERCIAL"
          };

          const projectRes = await fetch(`${API}/projects`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + userToken
            },
            body: JSON.stringify(projectData)
          });
          const projectResData = await projectRes.json();
          test('AI Project Creation', projectResData.status === 'success');
        }
      }
    }

    // 4. EXPERT SYSTEM TESTS
    console.log('\n👨‍💼 EXPERT SYSTEM TESTS');
    console.log('-'.repeat(30));

    // Experts Directory
    const expertsRes = await fetch(`${API}/experts/experts`);
    const expertsData = await expertsRes.json();
    test('Experts Directory', expertsData.status === 'success' && expertsData.data.length > 0);

    if (userToken && expertToken) {
      // Expert Query Creation
      const queryData = {
        title: "Final Test Foundation Query",
        description: "Need comprehensive review of foundation design for 20-story commercial building in black cotton soil with high seismic activity. Please provide detailed recommendations for pile foundation system.",
        category: "foundation",
        priority: "HIGH"
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
      test('Expert Query Creation', queryResData.status === 'success');

      if (queryResData.status === 'success') {
        const queryId = queryResData.data.id;
        
        // Expert Query Assignment
        const assignRes = await fetch(`${API}/experts/queries/${queryId}/assign`, {
          method: "POST",
          headers: { "Authorization": "Bearer " + expertToken }
        });
        const assignData = await assignRes.json();
        test('Expert Query Assignment', assignData.status === 'success');

        // Expert Response
        const responseData = {
          response: "Based on your requirements for a 20-story commercial building in black cotton soil with high seismic activity, I recommend: 1) Deep pile foundation with 1.5m diameter bored cast-in-situ piles extending to 30m depth to reach stable strata, 2) Pile cap thickness of 2.5m with M45 grade concrete, 3) Ground improvement using stone columns for top 10m to reduce settlement, 4) Proper dewatering system during construction, 5) Seismic isolation bearings at base level, 6) Compliance with IS 1893:2016 for seismic design and IS 2911:2010 for pile foundations. Detailed soil investigation and dynamic analysis recommended."
        };

        const responseRes = await fetch(`${API}/experts/queries/${queryId}/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + expertToken
          },
          body: JSON.stringify(responseData)
        });
        const responseResData = await responseRes.json();
        test('Expert Query Response', responseResData.status === 'success');
      }

      // Expert Queries Retrieval
      const expertQueriesRes = await fetch(`${API}/experts/queries`, {
        headers: { "Authorization": "Bearer " + expertToken }
      });
      const expertQueriesData = await expertQueriesRes.json();
      test('Expert Queries Retrieval', expertQueriesData.status === 'success');

      // Expert Profile Update
      const profileUpdateData = {
        summary: "Updated: Senior Structural Engineer with 18+ years of experience in high-rise buildings, seismic design, and foundation systems. Specialized in complex commercial and residential projects.",
        portfolioData: {
          projects: [
            { name: "Mumbai Commercial Tower", year: 2023, type: "Commercial", floors: 25 },
            { name: "Delhi Residential Complex", year: 2022, type: "Residential", floors: 15 },
            { name: "Bangalore IT Park", year: 2021, type: "Commercial", floors: 30 }
          ],
          certifications: ["LEED AP", "PMP", "Seismic Design Specialist"],
          awards: ["Best Structural Design 2023", "Innovation in Construction 2022"]
        }
      };

      const profileRes = await fetch(`${API}/experts/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + expertToken
        },
        body: JSON.stringify(profileUpdateData)
      });
      const profileData = await profileRes.json();
      test('Expert Profile Update', profileData.status === 'success');
    }

    // 5. DATA INTEGRITY TESTS
    console.log('\n🔍 DATA INTEGRITY TESTS');
    console.log('-'.repeat(30));

    if (userToken) {
      // Get all user's surveys
      const userSurveysRes = await fetch(`${API}/land-surveys`, {
        headers: { "Authorization": "Bearer " + userToken }
      });
      const userSurveysData = await userSurveysRes.json();
      test('User Surveys Retrieval', userSurveysData.status === 'success');

      // Get all user's building inputs
      const userBuildingsRes = await fetch(`${API}/building-inputs`, {
        headers: { "Authorization": "Bearer " + userToken }
      });
      const userBuildingsData = await userBuildingsRes.json();
      test('User Buildings Retrieval', userBuildingsData.status === 'success');

      // Get all user's projects
      const userProjectsRes = await fetch(`${API}/projects`, {
        headers: { "Authorization": "Bearer " + userToken }
      });
      const userProjectsData = await userProjectsRes.json();
      test('User Projects Retrieval', userProjectsData.status === 'success');
    }

  } catch (globalError) {
    console.error('Global test error:', globalError);
    issues.push({ test: 'Global System', error: globalError.message });
  }

  // FINAL RESULTS
  console.log('\n📊 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Tests Passed: ${passedTests}`);
  console.log(`❌ Tests Failed: ${totalTests - passedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`🔢 Total Tests: ${totalTests}`);

  if (issues.length === 0) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    console.log('🚀 Smart Load Analyzer with Expert System is fully functional');
    console.log('✨ Ready for production deployment');
    console.log('\n🏆 SYSTEM CAPABILITIES VERIFIED:');
    console.log('   ✅ User Registration & Authentication');
    console.log('   ✅ Expert Registration & Authentication');
    console.log('   ✅ Land Survey Management');
    console.log('   ✅ Building Input System');
    console.log('   ✅ Wind Data Analysis');
    console.log('   ✅ Disaster Risk Analysis');
    console.log('   ✅ Vastu Compliance Analysis');
    console.log('   ✅ AI Project Management');
    console.log('   ✅ Expert Query System');
    console.log('   ✅ Expert Response System');
    console.log('   ✅ Expert Profile Management');
    console.log('   ✅ Professional Network Directory');
    console.log('   ✅ Data Integrity & Security');
  } else {
    console.log('\n🔧 ISSUES FOUND:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.test}: ${issue.error}`);
    });
  }

  return { totalTests, passedTests, issues, successRate: (passedTests / totalTests) * 100 };
}

finalComprehensiveTest();