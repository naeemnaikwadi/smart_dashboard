require('dotenv').config();

async function testCloudinaryUpload() {
  try {
    console.log('☁️ Testing Cloudinary upload...');
    
    // Test Cloudinary config
    const cloudinary = require('./config/cloudinary');
    console.log('✅ Cloudinary config loaded');
    
    // Test Cloudinary service
    const CloudinaryService = require('./services/cloudinaryService');
    console.log('✅ CloudinaryService loaded');
    
    // Test connection
    const isConnected = await CloudinaryService.testConnection();
    if (isConnected) {
      console.log('✅ Cloudinary connection successful');
    } else {
      console.log('❌ Cloudinary connection failed');
      return;
    }
    
    // Create a test file buffer
    const testBuffer = Buffer.from('This is a test file content for Cloudinary upload');
    const testFileInfo = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: testBuffer.length
    };
    
    console.log('📁 Test file info:', testFileInfo);
    
    // Try to upload
    console.log('🚀 Attempting upload...');
    const result = await CloudinaryService.uploadFile(testBuffer, testFileInfo, 'smart-learning/test');
    
    console.log('✅ Upload successful!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
  }
}

testCloudinaryUpload();
