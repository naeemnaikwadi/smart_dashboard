const fs = require('fs');
const path = require('path');

// Test file paths
const testFiles = {
  smallImage: path.join(__dirname, 'uploads', 'doubts', 'answers', 'answer-1755351261162-865217390.jpg'),
  smallPdf: path.join(__dirname, 'uploads', '1755375095239-C08 DAA EXP3.pdf')
};

console.log('🧪 Testing Cloudinary Upload Endpoints...\n');

// Test 1: Check if test files exist
console.log('📁 Checking test files...');
Object.entries(testFiles).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  ✅ ${name}: ${path.basename(filePath)} (${sizeMB} MB)`);
  } else {
    console.log(`  ❌ ${name}: File not found`);
  }
});

console.log('\n🔗 Available Upload Endpoints:');
console.log('  POST /api/upload/single - Upload single file to Cloudinary');
console.log('  POST /api/upload/multiple - Upload multiple files to Cloudinary');
console.log('  POST /api/upload/doubt - Upload doubt image to Cloudinary');
console.log('  POST /api/upload/profile - Upload profile image to Cloudinary');
console.log('  DELETE /api/upload/files/:cloudinaryId - Delete file from Cloudinary');
console.log('  GET /api/upload/files/:cloudinaryId - Get file info from Cloudinary');

console.log('\n📋 File Size Limits:');
console.log('  • Maximum file size: 10MB (Cloudinary free tier)');
console.log('  • Maximum files per upload: 10');
console.log('  • Supported formats: PDF, Word, Excel, Images, Videos, Audio');

console.log('\n📂 Cloudinary Folders:');
console.log('  • Course materials: smart-learning/courses');
console.log('  • Doubt images: smart-learning/doubts');
console.log('  • Profile images: smart-learning/profiles');
console.log('  • Learning paths: smart-learning/learning-paths');

console.log('\n🚀 To test the endpoints:');
console.log('  1. Start your server: npm start');
console.log('  2. Use Postman or curl to test the endpoints');
console.log('  3. Include authentication token in headers');
console.log('  4. Files will be automatically uploaded to Cloudinary');

console.log('\n💡 Example curl command (replace TOKEN with actual token):');
console.log('  curl -X POST http://localhost:4000/api/upload/single \\');
console.log('    -H "Authorization: Bearer TOKEN" \\');
console.log('    -F "file=@uploads/doubts/answers/answer-1755351261162-865217390.jpg"');

console.log('\n🎯 All future uploads will now go directly to Cloudinary!');
