#!/usr/bin/env node

/**
 * Automated System Test Script
 * Tests all backend endpoints and verifies connections
 */

const http = require('http');

const API_BASE = 'http://localhost:5000/api/v1';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function test(name, fn) {
  testResults.total++;
  try {
    await fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testResults.passed++;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    testResults.failed++;
  }
}

// Assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

// Test state
let testToken = '';
let testSurveyId = '';
let testBuildingId = '';

// Main test suite
async function runTests() {
  console.log(`\n${colors.blue}==================================${colors.reset}`);
  console.log(`${colors.blue}  System Integration Tests${colors.reset}`);
  console.log(`${colors.blue}==================================${colors.reset}\n`);

  // Test 1: Health Check
  await test('Health endpoint responds', async () => {
    const res = await makeRequest('GET', '/health');
    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.message, 'Should have message');
  });

  // Test 2: Register User
  await test('User registration works', async () => {
    const timestamp = Date.now();
    const res = await makeRequest('POST', '/auth/register', {
      email: `test${timestamp}@example.com`,
      password: 'Test123456',
      name: 'Test User',
      role: 'USER',
    });
    
    if (res.status === 409) {
      // User already exists, try login instead
      console.log(`  ${colors.yellow}Note: User exists, will test login${colors.reset}`);
      return;
    }
    
    assertEqual(res.status, 201, 'Status code should be 201');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.accessToken, 'Should return access token');
  });

  // Test 3: Login User
  await test('User login works', async () => {
    const res = await makeRequest('POST', '/auth/login', {
      email: 'test@example.com',
      password: 'Test123456',
    });

    if (res.status === 401) {
      // User doesn't exist, create it first
      const regRes = await makeRequest('POST', '/auth/register', {
        email: 'test@example.com',
        password: 'Test123456',
        name: 'Test User',
      });
      
      if (regRes.status === 201) {
        testToken = regRes.data.data.accessToken;
        return;
      }
    }

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.accessToken, 'Should return access token');
    testToken = res.data.data.accessToken;
  });

  // Test 4: Create Land Survey
  await test('Create land survey works', async () => {
    const res = await makeRequest(
      'POST',
      '/land-surveys',
      {
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
      },
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 201, 'Status code should be 201');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.id, 'Should return survey ID');
    testSurveyId = res.data.data.id;
  });

  // Test 5: Get Land Surveys
  await test('Get land surveys works', async () => {
    const res = await makeRequest('GET', '/land-surveys', null, {
      Authorization: `Bearer ${testToken}`,
    });

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(Array.isArray(res.data.data), 'Should return array');
  });

  // Test 6: Create Building Input
  await test('Create building input works', async () => {
    const res = await makeRequest(
      'POST',
      '/building-inputs',
      {
        landSurveyId: testSurveyId,
        buildingType: 'RESIDENTIAL',
        totalFloors: 10,
        floorHeight: 3.0,
        totalHeight: 30.0,
        builtUpArea: 5000,
        orientation: 'NORTH_EAST',
        structuralSystem: 'RCC',
        basementFloors: 1,
        parkingFloors: 2,
        expectedOccupancy: 100,
      },
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 201, 'Status code should be 201');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.id, 'Should return building ID');
    testBuildingId = res.data.data.id;
  });

  // Test 7: Add Wind Data
  await test('Add wind data works', async () => {
    const res = await makeRequest(
      'POST',
      '/wind',
      {
        buildingInputId: testBuildingId,
        windDirection: 270,
        averageWindSpeed: 35,
        peakGustSpeed: 55,
        terrainRoughness: 'CATEGORY_2',
      },
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 201, 'Status code should be 201');
    assert(res.data.status === 'success', 'Status should be success');
  });

  // Test 8: Run Disaster Analysis
  await test('Disaster analysis works', async () => {
    const res = await makeRequest(
      'POST',
      `/analysis/disaster/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.deadLoad, 'Should calculate dead load');
    assert(res.data.data.earthquakeSafetyScore, 'Should calculate safety score');
  });

  // Test 9: Run Vastu Analysis
  await test('Vastu analysis works', async () => {
    const res = await makeRequest(
      'POST',
      `/analysis/vastu/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.vastuComplianceScore !== undefined, 'Should calculate Vastu score');
  });

  // Test 10: Generate Final Report
  await test('Final report generation works', async () => {
    const res = await makeRequest(
      'POST',
      `/analysis/report/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
    assert(res.data.data.overallSafetyScore !== undefined, 'Should have safety score');
    assert(res.data.data.finalRecommendations, 'Should have recommendations');
  });

  // Test 11: Get Disaster Report
  await test('Get disaster report works', async () => {
    const res = await makeRequest(
      'GET',
      `/analysis/disaster/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
  });

  // Test 12: Get Vastu Report
  await test('Get Vastu report works', async () => {
    const res = await makeRequest(
      'GET',
      `/analysis/vastu/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
  });

  // Test 13: Get Final Report
  await test('Get final report works', async () => {
    const res = await makeRequest(
      'GET',
      `/analysis/report/${testBuildingId}`,
      null,
      { Authorization: `Bearer ${testToken}` }
    );

    assertEqual(res.status, 200, 'Status code should be 200');
    assert(res.data.status === 'success', 'Status should be success');
  });

  // Print results
  console.log(`\n${colors.blue}==================================${colors.reset}`);
  console.log(`${colors.blue}  Test Results${colors.reset}`);
  console.log(`${colors.blue}==================================${colors.reset}\n`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  if (testResults.failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
console.log(`${colors.yellow}Starting system tests...${colors.reset}`);
console.log(`${colors.yellow}Make sure backend is running on http://localhost:5000${colors.reset}\n`);

runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
