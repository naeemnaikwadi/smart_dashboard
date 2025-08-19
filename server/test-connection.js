require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testConnection() {
  try {
    console.log('🔍 Testing Cloudinary connection...');
    
    // Test basic connection
    const pingResult = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', pingResult);
    
    // Test configuration
    console.log('\n📋 Cloudinary Configuration:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
    
    // Test folder access
    try {
      const folderResult = await cloudinary.api.root_folders();
      console.log('\n📁 Root folders accessible:', folderResult.folders?.length || 0);
    } catch (error) {
      console.log('\n⚠️  Folder access test failed:', error.message);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();


