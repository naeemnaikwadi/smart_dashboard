const mongoose = require('mongoose');
require('dotenv').config();

async function viewClassroomsDetailed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Classroom = require('./models/Classroom');
    const User = require('./models/User');
    
    console.log('\n📚 DETAILED CLASSROOM INFORMATION:');
    console.log('==================================');
    
    // Get all classrooms
    const classrooms = await Classroom.find({});
    
    if (classrooms.length === 0) {
      console.log('No classrooms found in the database.');
    } else {
      for (let i = 0; i < classrooms.length; i++) {
        const classroom = classrooms[i];
        
        // Get instructor details separately
        const instructor = await User.findById(classroom.instructor);
        
        console.log(`\n${i + 1}. CLASSROOM DETAILS:`);
        console.log(`   Name: ${classroom.name}`);
        console.log(`   Description: ${classroom.description}`);
        console.log(`   Course: ${classroom.course}`);
        console.log(`   Date: ${new Date(classroom.date).toLocaleDateString()}`);
        console.log(`   Entry Code: ${classroom.entryCode}`);
        console.log(`   Students Count: ${classroom.students.length}`);
        console.log(`   Created At: ${new Date(classroom.createdAt).toLocaleString()}`);
        
        console.log(`\n   INSTRUCTOR DETAILS:`);
        if (instructor) {
          console.log(`   - ID: ${instructor._id}`);
          console.log(`   - Name: ${instructor.name}`);
          console.log(`   - Email: ${instructor.email}`);
          console.log(`   - Role: ${instructor.role}`);
        } else {
          console.log(`   - Instructor not found (ID: ${classroom.instructor})`);
        }
        
        console.log('   ' + '='.repeat(50));
      }
    }
    
    console.log('\n👥 ALL USERS IN SYSTEM:');
    console.log('=======================');
    const users = await User.find({});
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log('   -------------------------');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

viewClassroomsDetailed(); 