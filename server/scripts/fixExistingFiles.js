require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

async function fixExistingFiles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all courses with materials
    const courses = await Course.find({}).populate('materials');
    console.log(`🔍 Found ${courses.length} courses to check`);
    
    let totalFixed = 0;
    let totalErrors = 0;
    
    for (const course of courses) {
      if (!course.materials || course.materials.length === 0) continue;
      
      console.log(`\n📚 Processing course: ${course.name}`);
      
      for (const material of course.materials) {
        // Check if this is a PDF that needs fixing
        if (material.type === 'pdf' && 
            material.cloudinaryUrl && 
            material.cloudinaryUrl.includes('/document/upload/')) {
          
          console.log(`  🔧 Fixing PDF: ${material.title}`);
          
          try {
            // Convert document URL to raw URL
            const fixedUrl = material.cloudinaryUrl.replace('/document/upload/', '/raw/upload/');
            
            // Update the material
            material.cloudinaryUrl = fixedUrl;
            material.url = fixedUrl;
            await material.save();
            
            console.log(`    ✅ Fixed: ${fixedUrl}`);
            totalFixed++;
            
          } catch (error) {
            console.log(`    ❌ Error fixing ${material.title}:`, error.message);
            totalErrors++;
          }
        }
      }
    }
    
    console.log(`\n🎉 File Fix Complete!`);
    console.log(`   Fixed: ${totalFixed} files`);
    console.log(`   Errors: ${totalErrors}`);
    
    if (totalFixed > 0) {
      console.log('\n💡 Next steps:');
      console.log('   1. Restart your server');
      console.log('   2. Try viewing the fixed PDFs');
      console.log('   3. They should now display properly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixExistingFiles();


