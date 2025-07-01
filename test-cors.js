const axios = require('axios');

async function testCORS() {
  try {
    console.log('Testing login endpoint with CORS...');
    
    const response = await axios.post(
      'https://sipesda-rpl.vercel.app/api/users/login',
      { username: 'admin', password: 'admin123' },
      {
        headers: {
          'Origin': 'https://sipesda-rpl-fe.vercel.app',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Success!', response.status);
    console.log('Headers:', response.headers);
    console.log('Data:', response.data);
  } catch (error) {
    console.error('Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      console.log('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testCORS(); 