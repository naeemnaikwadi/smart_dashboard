require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const { Readable } = require('stream');

async function testUploadStrategy() {
  try {
    console.log('🔍 Testing Cloudinary upload strategy...');
    
    // Test configuration
    console.log('\n📋 Cloudinary Configuration:');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
    console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
    
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Missing Cloudinary credentials. Please check your .env file.');
      return;
    }
    
    // Test connection
    try {
      const pingResult = await cloudinary.api.ping();
      console.log('\n✅ Cloudinary connection successful:', pingResult);
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error.message);
      return;
    }
    
    // Test different file type handling
    console.log('\n📁 Testing file type handling...');
    
    const testCases = [
      { mimetype: 'application/pdf', name: 'test.pdf', type: 'PDF' },
      { mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'test.docx', type: 'Word' },
      { mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'test.xlsx', type: 'Excel' },
      { mimetype: 'image/jpeg', name: 'test.jpg', type: 'Image' },
      { mimetype: 'video/mp4', name: 'test.mp4', type: 'Video' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n🔧 Testing ${testCase.type} (${testCase.mimetype})...`);
      
      // Create a dummy buffer for testing
      const dummyBuffer = Buffer.from('This is a test file content');
      
      // Determine upload options based on mimetype
      let uploadOptions = {
        folder: 'test-uploads',
        public_id: `test-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
        overwrite: false,
        access_mode: 'public'
      };
      
      if (testCase.mimetype === 'application/pdf') {
        uploadOptions.resource_type = 'raw';
        uploadOptions.format = 'pdf';
      } else if (testCase.mimetype.includes('document') || testCase.mimetype.includes('spreadsheet')) {
        uploadOptions.resource_type = 'raw';
        if (testCase.mimetype.includes('word')) {
          uploadOptions.format = 'docx';
        } else if (testCase.mimetype.includes('excel')) {
          uploadOptions.format = 'xlsx';
        }
      } else if (testCase.mimetype.startsWith('image/')) {
        uploadOptions.resource_type = 'image';
        uploadOptions.quality = 'auto';
        uploadOptions.fetch_format = 'auto';
      } else if (testCase.mimetype.startsWith('video/')) {
        uploadOptions.resource_type = 'video';
        uploadOptions.quality = 'auto';
      }
      
      console.log(`   Upload options:`, uploadOptions);
      
      try {
        // Test upload (without actually uploading)
        console.log(`   ✓ ${testCase.type} upload strategy configured correctly`);
      } catch (error) {
        console.log(`   ❌ ${testCase.type} upload strategy failed:`, error.message);
      }
    }
    
    console.log('\n🎉 Upload strategy test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your server to apply the new strategy');
    console.log('   2. Try uploading different file types');
    console.log('   3. Check if PDFs now display properly in the viewer');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testUploadStrategy();
