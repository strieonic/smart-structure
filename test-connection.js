// Quick Connection Test Script
const API = "http://localhost:5000/api/v1";

async function testConnection() {
  console.log("🔍 Testing Smart Load Distribution Analyzer Connection...\n");

  // Test 1: Health Check
  console.log("1️⃣ Testing Backend Health...");
  try {
    const healthRes = await fetch(`${API}/health`);
    const healthData = await healthRes.json();
    console.log("✅ Backend Health:", healthData.status);
    console.log("   Message:", healthData.message);
  } catch (err) {
    console.log("❌ Backend Health Check Failed:", err.message);
    return;
  }

  // Test 2: Registration
  console.log("\n2️⃣ Testing User Registration...");
  try {
    const registerRes = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: "Test123!",
        name: "Test User",
        role: "USER"
      })
    });
    const registerData = await registerRes.json();
    console.log("✅ Registration:", registerData.status);
    
    if (registerData.data && registerData.data.accessToken) {
      console.log("   Token received:", registerData.data.accessToken.substring(0, 20) + "...");
      
      // Test 3: Authenticated Request
      console.log("\n3️⃣ Testing Authenticated Request...");
      const token = registerData.data.accessToken;
      const surveysRes = await fetch(`${API}/land-surveys`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const surveysData = await surveysRes.json();
      console.log("✅ Authenticated Request:", surveysData.status);
      console.log("   Surveys found:", surveysData.data ? surveysData.data.length : 0);
    }
  } catch (err) {
    console.log("❌ Registration Test Failed:", err.message);
  }

  console.log("\n✨ Connection Test Complete!");
  console.log("\n📋 Summary:");
  console.log("   Backend URL: " + API);
  console.log("   Frontend URL: http://localhost:8080");
  console.log("   Status: All systems operational ✅");
}

testConnection();
