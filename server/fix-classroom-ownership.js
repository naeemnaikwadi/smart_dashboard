const mongoose = require('mongoose');
require('dotenv').config();

async function fixClassroomOwnership() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Classroom = require('./models/Classroom');
    
    // Update the classroom with wrong instructor ID
    const result = await Classroom.updateMany(
      { instructor: '687cab2a72e50e3691540e2c' },
      { instructor: '687e4ec0e2a998dfdac6d39d' }
    );
    
    console.log('✅ Updated classrooms:', result.modifiedCount);
    
    // Verify the update
    const classrooms = await Classroom.find({});
    console.log('\n📚 ALL CLASSROOMS AFTER UPDATE:');
    console.log('================================');
    
    classrooms.forEach((classroom, index) => {
      console.log(`${index + 1}. ${classroom.name} - Instructor: ${classroom.instructor}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixClassroomOwnership(); 