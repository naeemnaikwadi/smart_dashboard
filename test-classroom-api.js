const axios = require('axios');

async function testClassroomAPI() {
  try {
    console.log('Testing classroom API...');
    
    // Test the join endpoint (doesn't require auth)
    const response = await axios.get('http://localhost:4000/api/classrooms/join/TEST123');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error:', error.response?.data || error.message);
  }
}

testClassroomAPI(); 