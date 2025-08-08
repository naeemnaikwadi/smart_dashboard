const mongoose = require('mongoose');
require('dotenv').config();

async function updateClassroomsWithNames() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Classroom = require('./models/Classroom');
    const User = require('./models/User');
    
    console.log('\n🔄 UPDATING EXISTING CLASSROOMS WITH INSTRUCTOR NAMES:');
    console.log('=====================================================');
    
    // Get all classrooms
    const classrooms = await Classroom.find({});
    
    for (let i = 0; i < classrooms.length; i++) {
      const classroom = classrooms[i];
      
      // Get instructor details
      const instructor = await User.findById(classroom.instructor);
      
      if (instructor) {
        // Update classroom with instructor name
        await Classroom.findByIdAndUpdate(classroom._id, {
          instructorName: instructor.name
        });
        
        console.log(`${i + 1}. Updated "${classroom.name}" - Instructor: ${instructor.name}`);
      } else {
        console.log(`${i + 1}. ⚠️  Instructor not found for "${classroom.name}" (ID: ${classroom.instructor})`);
      }
    }
    
    console.log('\n✅ ALL CLASSROOMS UPDATED!');
    
    // Show updated classrooms
    console.log('\n📚 UPDATED CLASSROOM LIST:');
    console.log('==========================');
    const updatedClassrooms = await Classroom.find({});
    
    updatedClassrooms.forEach((classroom, index) => {
      console.log(`${index + 1}. ${classroom.name}`);
      console.log(`   Instructor: ${classroom.instructorName} (ID: ${classroom.instructor})`);
      console.log(`   Course: ${classroom.course}`);
      console.log(`   Entry Code: ${classroom.entryCode}`);
      console.log('   -------------------------');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

updateClassroomsWithNames(); 