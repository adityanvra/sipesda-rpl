const axios = require('axios');

async function checkDeployment() {
  console.log('🔍 SIPESDA Deployment Check\n');
  
  // Replace with your actual Vercel deployment URL
  const DEPLOYMENT_URL = process.argv[2] || 'https://your-app.vercel.app';
  
  console.log(`🌐 Testing deployment: ${DEPLOYMENT_URL}\n`);
  
  try {
    // Test 1: Frontend Check
    console.log('🎨 Testing Frontend...');
    try {
      const frontendResponse = await axios.get(DEPLOYMENT_URL, { timeout: 10000 });
      console.log('✅ Frontend accessible');
      console.log(`   Status: ${frontendResponse.status}`);
      console.log(`   Content-Type: ${frontendResponse.headers['content-type']}`);
    } catch (error) {
      console.log('❌ Frontend error:', error.message);
    }

    // Test 2: API Health Check
    console.log('\n🚀 Testing Backend API...');
    try {
      const apiResponse = await axios.get(`${DEPLOYMENT_URL}/api`, { timeout: 10000 });
      console.log('✅ Backend API accessible');
      console.log(`   Status: ${apiResponse.status}`);
      console.log(`   Response:`, apiResponse.data);
    } catch (error) {
      console.log('❌ Backend API error:', error.message);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }

    // Test 3: Database Connection via API
    console.log('\n🗄️ Testing Database Connection...');
    try {
      const studentsResponse = await axios.get(`${DEPLOYMENT_URL}/api/students`, { timeout: 15000 });
      console.log('✅ Database connection successful');
      console.log(`   Students found: ${studentsResponse.data.length}`);
      if (studentsResponse.data.length > 0) {
        console.log(`   Sample: ${studentsResponse.data[0].nama} (${studentsResponse.data[0].nisn})`);
      }
    } catch (error) {
      console.log('❌ Database connection error:', error.message);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }

    // Test 4: CORS Check
    console.log('\n🌐 Testing CORS...');
    try {
      const corsResponse = await axios.options(`${DEPLOYMENT_URL}/api/students`);
      console.log('✅ CORS configured');
      console.log(`   Status: ${corsResponse.status}`);
    } catch (error) {
      console.log('⚠️ CORS might have issues:', error.message);
    }

    console.log('\n📋 Deployment Check Complete!');
    console.log('\n💡 Common Issues & Solutions:');
    console.log('   1. Environment Variables: Check Vercel dashboard settings');
    console.log('   2. Database: Verify Railway credentials in env vars');
    console.log('   3. CORS: Update allowed origins in backend/api/index.js');
    console.log('   4. Build: Check Vercel Functions tab for errors');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Usage: node check-deployment.js https://your-app.vercel.app
checkDeployment(); 