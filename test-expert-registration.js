const API = "http://localhost:5000/api/v1";

async function testExpertRegistration() {
  const expertData = {
    // Basic Info
    name: "Er. Test Expert",
    email: "test.expert@example.com",
    password: "testpassword123",
    phone: "+91 98765 43210",
    
    // Professional Details
    expertType: "STRUCTURAL_ENGINEER",
    experience: "10-15",
    location: "Mumbai",
    licenseNumber: "TEST123456",
    
    // Specializations
    specializations: ["Seismic Design", "Foundation Design"],
    summary: "Experienced structural engineer with expertise in seismic design"
  };

  try {
    console.log('Testing expert registration...');
    
    const res = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });

    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.status === 'success') {
      console.log('✅ Expert registration successful!');
      
      // Test login
      console.log('\nTesting expert login...');
      const loginRes = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: expertData.email, 
          password: expertData.password 
        })
      });

      const loginData = await loginRes.json();
      console.log('Login Response:', JSON.stringify(loginData, null, 2));
      
      if (loginData.status === 'success') {
        console.log('✅ Expert login successful!');
        
        // Test getting experts list
        console.log('\nTesting experts list...');
        const expertsRes = await fetch(`${API}/experts/experts`);
        const expertsData = await expertsRes.json();
        console.log('Experts List:', JSON.stringify(expertsData, null, 2));
        
        if (expertsData.status === 'success') {
          console.log('✅ Experts list retrieved successfully!');
        }
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testExpertRegistration();