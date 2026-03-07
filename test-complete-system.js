const API = "http://localhost:5000/api/v1";

async function testCompleteSystem() {
  console.log('🚀 Testing Complete Expert System...\n');

  // Test 1: Expert Registration
  console.log('1️⃣ Testing Expert Registration...');
  const expertData = {
    name: "Ar. Jane Smith",
    email: "jane.architect@example.com",
    password: "securepass123",
    phone: "+91 98765 43211",
    expertType: "ARCHITECT",
    experience: "15-20",
    location: "Delhi",
    licenseNumber: "ARCH789012",
    specializations: ["Sustainable Design", "BIM Expert", "Green Buildings"],
    summary: "Award-winning architect specializing in sustainable and green building design"
  };

  try {
    const regRes = await fetch(`${API}/auth/register-expert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expertData)
    });

    const regData = await regRes.json();
    if (regData.status === 'success') {
      console.log('✅ Expert registration successful');
      const expertToken = regData.data.accessToken;
      
      // Test 2: Regular User Registration
      console.log('\n2️⃣ Testing Regular User Registration...');
      const userData = {
        name: "John Client",
        email: "john.client@example.com",
        password: "clientpass123",
        role: "USER"
      };

      const userRegRes = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
      });

      const userRegData = await userRegRes.json();
      if (userRegData.status === 'success') {
        console.log('✅ User registration successful');
        const userToken = userRegData.data.accessToken;

        // Test 3: Create Expert Query
        console.log('\n3️⃣ Testing Expert Query Creation...');
        const queryData = {
          title: "Foundation Design Review Needed",
          description: "I need an expert review of my foundation design for a 15-story residential building in seismic zone IV. The soil report shows black cotton soil with high plasticity.",
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
        if (queryResData.status === 'success') {
          console.log('✅ Expert query created successfully');
          const queryId = queryResData.data.id;

          // Test 4: Expert Assigns Query to Self
          console.log('\n4️⃣ Testing Query Assignment...');
          const assignRes = await fetch(`${API}/experts/queries/${queryId}/assign`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + expertToken }
          });

          const assignData = await assignRes.json();
          if (assignData.status === 'success') {
            console.log('✅ Query assigned to expert successfully');

            // Test 5: Expert Responds to Query
            console.log('\n5️⃣ Testing Expert Response...');
            const responseData = {
              response: "After reviewing your foundation requirements for a 15-story building in seismic zone IV with black cotton soil, I recommend: 1) Deep pile foundation with 1.2m diameter piles extending to 25m depth, 2) Pile cap thickness of 2m with grade M40 concrete, 3) Ground improvement using stone columns for the top 8m, 4) Proper drainage system to manage moisture content in black cotton soil. The design should comply with IS 1893 for seismic considerations and IS 2911 for pile foundation design."
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
            if (responseResData.status === 'success') {
              console.log('✅ Expert response submitted successfully');

              // Test 6: Get Expert Queries (for expert dashboard)
              console.log('\n6️⃣ Testing Expert Dashboard Queries...');
              const expertQueriesRes = await fetch(`${API}/experts/queries`, {
                headers: { "Authorization": "Bearer " + expertToken }
              });

              const expertQueriesData = await expertQueriesRes.json();
              if (expertQueriesData.status === 'success') {
                console.log('✅ Expert queries retrieved successfully');
                console.log(`   Found ${expertQueriesData.data.length} queries for expert`);

                // Test 7: Get All Experts (for directory)
                console.log('\n7️⃣ Testing Experts Directory...');
                const expertsRes = await fetch(`${API}/experts/experts`);
                const expertsData = await expertsRes.json();
                
                if (expertsData.status === 'success') {
                  console.log('✅ Experts directory retrieved successfully');
                  console.log(`   Found ${expertsData.data.length} verified experts`);

                  // Test 8: Expert Profile Update
                  console.log('\n8️⃣ Testing Expert Profile Update...');
                  const profileUpdateData = {
                    summary: "Updated: Award-winning architect with 18+ years of experience specializing in sustainable design, green buildings, and BIM implementation. Certified LEED AP and expert in energy-efficient building design.",
                    portfolioData: {
                      projects: [
                        { name: "Green Office Complex", year: 2023, type: "Commercial" },
                        { name: "Sustainable Residential Tower", year: 2022, type: "Residential" }
                      ]
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
                  if (profileData.status === 'success') {
                    console.log('✅ Expert profile updated successfully');

                    // Final Summary
                    console.log('\n🎉 ALL TESTS PASSED! Expert System is fully functional:');
                    console.log('   ✅ Expert Registration & Authentication');
                    console.log('   ✅ User Registration & Authentication');
                    console.log('   ✅ Expert Query Creation');
                    console.log('   ✅ Query Assignment System');
                    console.log('   ✅ Expert Response System');
                    console.log('   ✅ Expert Dashboard Queries');
                    console.log('   ✅ Experts Directory');
                    console.log('   ✅ Expert Profile Management');
                    console.log('\n🚀 The system is ready for production use!');
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Error during testing:', err.message);
  }
}

testCompleteSystem();