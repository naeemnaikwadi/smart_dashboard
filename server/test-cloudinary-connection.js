require('dotenv').config();
const cloudinary = require('./config/cloudinary');

async function testCloudinaryConnection() {
  try {
    console.log('🔍 Testing Cloudinary connection...');
    
    // Test basic connection
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful:', result);
    
    // Test upload with a simple text file
    const testBuffer = Buffer.from('This is a test file for Cloudinary upload');
    const testFileInfo = {
      originalname: 'test.txt',
      mimetype: 'text/plain',
      size: testBuffer.length
    };
    
    console.log('📁 Testing file upload...');
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'smart-learning/test',
          public_id: `test-${Date.now()}`,
          overwrite: false
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(testBuffer);
    });
    
    console.log('✅ Upload test successful!');
    console.log('📄 Upload result:', {
      public_id: uploadResult.public_id,
      secure_url: uploadResult.secure_url,
      resource_type: uploadResult.resource_type
    });
    
    // Test URL access
    console.log('🔗 Testing URL access...');
    const response = await fetch(uploadResult.secure_url);
    if (response.ok) {
      console.log('✅ URL access successful');
    } else {
      console.log('❌ URL access failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error);
  }
}

testCloudinaryConnection();

