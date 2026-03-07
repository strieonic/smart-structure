// ============================================
// API Integration Test Script
// Tests all 4 free APIs integrated into the project
// ============================================

const fetch = require('node-fetch');

console.log('🧪 Testing Free API Integrations...\n');

// Test 1: GeoJS - IP-based Location Detection
async function testGeoJS() {
  console.log('1️⃣ Testing GeoJS (IP-based location)...');
  try {
    const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const data = await response.json();
    
    if (data.latitude && data.longitude) {
      console.log('   ✅ GeoJS API working!');
      console.log(`   📍 Location: ${data.city}, ${data.country}`);
      console.log(`   🗺️  Coordinates: ${data.latitude}, ${data.longitude}\n`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ GeoJS API failed:', error.message, '\n');
    return false;
  }
}

// Test 2: Open-Meteo - Weather Data
async function testOpenMeteo() {
  console.log('2️⃣ Testing Open-Meteo (weather data)...');
  try {
    // Test with Delhi coordinates
    const lat = 28.6139;
    const lon = 77.2090;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.current_weather) {
      console.log('   ✅ Open-Meteo API working!');
      console.log(`   🌡️  Temperature: ${data.current_weather.temperature}°C`);
      console.log(`   💨 Wind Speed: ${data.current_weather.windspeed} m/s`);
      console.log(`   🧭 Wind Direction: ${data.current_weather.winddirection}°\n`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Open-Meteo API failed:', error.message, '\n');
    return false;
  }
}

// Test 3: Open-Elevation - Elevation Data
async function testOpenElevation() {
  console.log('3️⃣ Testing Open-Elevation (elevation data)...');
  try {
    // Test with Delhi coordinates
    const lat = 28.6139;
    const lon = 77.2090;
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      console.log('   ✅ Open-Elevation API working!');
      console.log(`   🏔️  Elevation: ${data.results[0].elevation}m above sea level\n`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Open-Elevation API failed:', error.message, '\n');
    return false;
  }
}

// Test 4: Nominatim - Address Search
async function testNominatim() {
  console.log('4️⃣ Testing Nominatim (address search)...');
  try {
    const query = 'Mumbai, India';
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SmartLoadAnalyzer/1.0'
      }
    });
    const data = await response.json();
    
    if (data.length > 0) {
      console.log('   ✅ Nominatim API working!');
      console.log(`   🔍 Search: "${query}"`);
      console.log(`   📍 Found: ${data[0].display_name}`);
      console.log(`   🗺️  Coordinates: ${data[0].lat}, ${data[0].lon}\n`);
      return true;
    }
  } catch (error) {
    console.log('   ❌ Nominatim API failed:', error.message, '\n');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('🚀 Smart Load Analyzer - API Integration Test Suite\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = {
    geojs: await testGeoJS(),
    openMeteo: await testOpenMeteo(),
    openElevation: await testOpenElevation(),
    nominatim: await testNominatim()
  };
  
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📊 Test Results Summary:\n');
  console.log(`   GeoJS (Location):        ${results.geojs ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Open-Meteo (Weather):    ${results.openMeteo ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Open-Elevation (Terrain): ${results.openElevation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Nominatim (Search):      ${results.nominatim ? '✅ PASS' : '❌ FAIL'}`);
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n   Total: ${passCount}/${totalCount} APIs working`);
  
  if (passCount === totalCount) {
    console.log('\n   🎉 All APIs are working perfectly!\n');
  } else {
    console.log('\n   ⚠️  Some APIs failed. Check your internet connection.\n');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
