const mongoose = require('mongoose');
require('dotenv').config();

async function updateClassrooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Classroom = require('./models/Classroom');
    
    // Update all classrooms to belong to the current user
    const result = await Classroom.updateMany(
      {}, 
      { instructor: '687e4ec0e2a998dfdac6d39d' }
    );
    
    console.log('✅ Updated classrooms:', result.modifiedCount);
    
    // Verify the update
    const classrooms = await Classroom.find({});
    console.log('Total classrooms:', classrooms.length);
    classrooms.forEach(c => {
      console.log(`- ${c.name} (Instructor: ${c.instructor})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateClassrooms(); 