// ============================================
// Expert System Comprehensive Test Script
// ============================================

const API = "http://localhost:5000/api/v1";

// Test data
const testUser = {
  email: `user_${Date.now()}@test.com`,
  password: "Test@12345",
  name: "Test User"
};

const testExpert = {
  email: `expert_${Date.now()}@test.com`,
  password: "Expert@12345",
  name: "Er. Test Expert",
  phone: "+91 9876543210",
  expertType: "STRUCTURAL_ENGINEER",
  experience: "10-15",
  location: "Mumbai",
  licenseNumber: "MH/SE/2024/12345",
  specializations: ["Seismic Design", "Foundation Design", "High-Rise Structures"],
  summary: "Experienced structural engineer with expertise in seismic design and high-rise buildings."
};

let userToken = '';
let expertToken = '';
let queryId = '';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API}${endpoint}`, options);
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test functions
async function test1_RegisterUser() {
  console.log('\n=== TEST 1: Register Regular User ===');
  const result = await apiCall('/auth/register', 'POST', testUser);
  
  if (result.success && result.data.data) {
    userToken = result.data.data.accessToken;
    console.log('✓ User registered successfully');
    console.log('  User ID:', result.data.data.user.id);
    console.log('  Email:', result.data.data.user.email);
    return true;
  } else {
    console.log('✗ User registration failed:', result.data.message || result.error);
    return false;
  }
}

async function test2_RegisterExpert() {
  console.log('\n=== TEST 2: Register Expert ===');
  const result = await apiCall('/auth/register-expert', 'POST', testExpert);
  
  if (result.success && result.data.data) {
    expertToken = result.data.data.accessToken;
    console.log('✓ Expert registered successfully');
    console.log('  Expert ID:', result.data.data.user.id);
    console.log('  Email:', result.data.data.user.email);
    console.log('  Role:', result.data.data.user.role);
    console.log('  Expert Type:', result.data.data.expertProfile?.expertType);
    return true;
  } else {
    console.log('✗ Expert registration failed:', result.data.message || result.error);
    return false;
  }
}

async function test3_ExpertLogin() {
  console.log('\n=== TEST 3: Expert Login ===');
  const result = await apiCall('/auth/login', 'POST', {
    email: testExpert.email,
    password: testExpert.password
  });
  
  if (result.success && result.data.data) {
    expertToken = result.data.data.accessToken;
    console.log('✓ Expert logged in successfully');
    console.log('  Role:', result.data.data.user.role);
    console.log('  Is Expert:', result.data.data.user.isExpert);
    return true;
  } else {
    console.log('✗ Expert login failed:', result.data.message || result.error);
    return false;
  }
}

async function test4_GetExpertDashboard() {
  console.log('\n=== TEST 4: Get Expert Dashboard ===');
  const result = await apiCall('/experts/dashboard/stats', 'GET', null, expertToken);
  
  if (result.success && result.data.data) {
    console.log('✓ Expert dashboard loaded successfully');
    console.log('  Pending Queries:', result.data.data.stats.totalPendingQueries);
    console.log('  Solved Queries:', result.data.data.stats.totalSolvedQueries);
    console.log('  Assigned Queries:', result.data.data.stats.totalAssignedQueries);
    return true;
  } else {
    console.log('✗ Failed to load expert dashboard:', result.data.message || result.error);
    return false;
  }
}

async function test5_GetVerifiedExperts() {
  console.log('\n=== TEST 5: Get Verified Experts (Public) ===');
  const result = await apiCall('/experts', 'GET');
  
  if (result.success && result.data.data) {
    console.log('✓ Verified experts loaded successfully');
    console.log('  Total Experts:', result.data.data.length);
    if (result.data.data.length > 0) {
      console.log('  First Expert:', result.data.data[0].name);
      console.log('  Type:', result.data.data[0].expertType);
      console.log('  Location:', result.data.data[0].location);
    }
    return true;
  } else {
    console.log('✗ Failed to load experts:', result.data.message || result.error);
    return false;
  }
}

async function test6_CreateQuery() {
  console.log('\n=== TEST 6: User Creates Query ===');
  const queryData = {
    title: "Foundation Design Review Needed",
    description: "I need an expert to review my foundation design for a 15-story residential building in seismic zone IV.",
    category: "foundation",
    priority: "HIGH"
  };
  
  const result = await apiCall('/experts/queries', 'POST', queryData, userToken);
  
  if (result.success && result.data.data) {
    queryId = result.data.data.id;
    console.log('✓ Query created successfully');
    console.log('  Query ID:', result.data.data.id);
    console.log('  Title:', result.data.data.title);
    console.log('  Status:', result.data.data.status);
    return true;
  } else {
    console.log('✗ Failed to create query:', result.data.message || result.error);
    return false;
  }
}

async function test7_ExpertAssignQuery() {
  console.log('\n=== TEST 7: Expert Assigns Query to Self ===');
  
  if (!queryId) {
    console.log('✗ No query ID available');
    return false;
  }
  
  const result = await apiCall(`/experts/queries/${queryId}/assign`, 'POST', null, expertToken);
  
  if (result.success && result.data.data) {
    console.log('✓ Query assigned successfully');
    console.log('  Query ID:', result.data.data.id);
    console.log('  Status:', result.data.data.status);
    console.log('  Assigned to:', result.data.data.expert?.user.name);
    return true;
  } else {
    console.log('✗ Failed to assign query:', result.data.message || result.error);
    return false;
  }
}

async function test8_ExpertRespondToQuery() {
  console.log('\n=== TEST 8: Expert Responds to Query ===');
  
  if (!queryId) {
    console.log('✗ No query ID available');
    return false;
  }
  
  const responseData = {
    response: "I have reviewed your foundation design. Based on the seismic zone IV requirements and 15-story height, I recommend using a deep pile foundation with a minimum depth of 12 meters. The pile diameter should be at least 600mm with grade M40 concrete. Please ensure proper tie beams and pile caps are designed as per IS 2911 standards."
  };
  
  const result = await apiCall(`/experts/queries/${queryId}/respond`, 'POST', responseData, expertToken);
  
  if (result.success && result.data.data) {
    console.log('✓ Response submitted successfully');
    console.log('  Query ID:', result.data.data.id);
    console.log('  Status:', result.data.data.status);
    console.log('  Response:', result.data.data.expertResponse.substring(0, 100) + '...');
    return true;
  } else {
    console.log('✗ Failed to submit response:', result.data.message || result.error);
    return false;
  }
}

async function test9_GetExpertQueries() {
  console.log('\n=== TEST 9: Get Expert Queries ===');
  const result = await apiCall('/experts/queries/all', 'GET', null, expertToken);
  
  if (result.success && result.data.data) {
    console.log('✓ Expert queries loaded successfully');
    console.log('  Total Queries:', result.data.data.length);
    if (result.data.data.length > 0) {
      console.log('  First Query:', result.data.data[0].title);
      console.log('  Status:', result.data.data[0].status);
    }
    return true;
  } else {
    console.log('✗ Failed to load queries:', result.data.message || result.error);
    return false;
  }
}

async function test10_UpdateExpertProfile() {
  console.log('\n=== TEST 10: Update Expert Profile ===');
  const profileData = {
    phone: "+91 9876543211",
    location: "Mumbai, Maharashtra",
    summary: "Updated: Experienced structural engineer with 15+ years of expertise in seismic design, high-rise buildings, and foundation engineering."
  };
  
  const result = await apiCall('/experts/profile', 'PUT', profileData, expertToken);
  
  if (result.success && result.data.data) {
    console.log('✓ Profile updated successfully');
    console.log('  Phone:', result.data.data.phone);
    console.log('  Location:', result.data.data.location);
    return true;
  } else {
    console.log('✗ Failed to update profile:', result.data.message || result.error);
    return false;
  }
}

async function test11_GetExpertProfile() {
  console.log('\n=== TEST 11: Get Expert Profile (Public) ===');
  
  // First get the list of experts to get an ID
  const expertsResult = await apiCall('/experts', 'GET');
  
  if (!expertsResult.success || !expertsResult.data.data || expertsResult.data.data.length === 0) {
    console.log('✗ No experts available to test');
    return false;
  }
  
  const expertId = expertsResult.data.data[0].id;
  const result = await apiCall(`/experts/${expertId}`, 'GET');
  
  if (result.success && result.data.data) {
    console.log('✓ Expert profile loaded successfully');
    console.log('  Name:', result.data.data.name);
    console.log('  Type:', result.data.data.expertType);
    console.log('  Experience:', result.data.data.experience);
    console.log('  Specializations:', result.data.data.specializations.join(', '));
    return true;
  } else {
    console.log('✗ Failed to load expert profile:', result.data.message || result.error);
    return false;
  }
}

async function test12_FilterExperts() {
  console.log('\n=== TEST 12: Filter Experts by Location ===');
  const result = await apiCall('/experts?location=Mumbai', 'GET');
  
  if (result.success && result.data.data) {
    console.log('✓ Filtered experts loaded successfully');
    console.log('  Total Experts in Mumbai:', result.data.data.length);
    return true;
  } else {
    console.log('✗ Failed to filter experts:', result.data.message || result.error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     EXPERT SYSTEM COMPREHENSIVE TEST SUITE                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const tests = [
    test1_RegisterUser,
    test2_RegisterExpert,
    test3_ExpertLogin,
    test4_GetExpertDashboard,
    test5_GetVerifiedExperts,
    test6_CreateQuery,
    test7_ExpertAssignQuery,
    test8_ExpertRespondToQuery,
    test9_GetExpertQueries,
    test10_UpdateExpertProfile,
    test11_GetExpertProfile,
    test12_FilterExperts
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('✗ Test threw an error:', error.message);
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Total Tests: ${tests.length}`);
  console.log(`║  Passed: ${passed}`);
  console.log(`║  Failed: ${failed}`);
  console.log(`║  Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Expert system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
});
