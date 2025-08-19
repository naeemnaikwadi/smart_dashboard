require('dotenv').config();
const cloudinary = require('./config/cloudinary');
const { Readable } = require('stream');

async function testSimpleUpload() {
  try {
    console.log('🔍 Testing simple Cloudinary upload...');
    
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
    
    // Test simple upload
    console.log('\n📁 Testing simple upload...');
    
    // Create a more realistic PDF buffer (PDF header + content)
    const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF Content) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF\n');
    
    const testFileInfo = {
      mimetype: 'application/pdf',
      originalname: 'test.pdf',
      size: pdfHeader.length
    };
    
    const uploadOptions = {
      folder: 'test-uploads',
      public_id: `test-${Date.now()}`,
      overwrite: false,
      access_mode: 'public',
      resource_type: 'image',
      format: 'pdf'
    };
    
    console.log('   Upload options:', uploadOptions);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = Readable.from(pdfHeader);
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.pipe(uploadStream);
      });
      
      console.log('   ✅ Upload successful!');
      console.log('   URL:', result.secure_url);
      console.log('   Public ID:', result.public_id);
      
      // Test the corrected URL with authentication parameters
      const correctedUrl = result.secure_url.replace('/raw/upload/', '/raw/upload/fl_attachment,fl_sanitize,fl_force_strip/');
      console.log('   Corrected URL:', correctedUrl);
      
      // Test if the URL is accessible
      console.log('\n🔗 Testing URL accessibility...');
      try {
        const response = await fetch(result.secure_url);
        if (response.ok) {
          console.log('   ✅ Original URL is accessible');
        } else {
          console.log(`   ⚠️ Original URL returned status: ${response.status}`);
        }
      } catch (error) {
        console.log('   ⚠️ Could not test original URL accessibility:', error.message);
      }
      
      // Test corrected URL
      console.log('\n🔗 Testing corrected URL accessibility...');
      try {
        const response = await fetch(correctedUrl);
        if (response.ok) {
          console.log('   ✅ Corrected URL is accessible');
        } else {
          console.log(`   ⚠️ Corrected URL returned status: ${response.status}`);
        }
      } catch (error) {
        console.log('   ⚠️ Could not test corrected URL accessibility:', error.message);
      }
      
    } catch (error) {
      console.log('   ❌ Upload failed:', error.message);
      console.log('   Full error:', error);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testSimpleUpload();
