const mongoose = require('mongoose');
require('dotenv').config();

async function viewClassroomsWithInstructors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const Classroom = require('./models/Classroom');
    const User = require('./models/User');
    
    // Get all classrooms with instructor details
    const classrooms = await Classroom.find({}).populate('instructor', 'name email');
    
    console.log('\n📚 ALL CLASSROOMS WITH INSTRUCTOR DETAILS:');
    console.log('==========================================');
    
    if (classrooms.length === 0) {
      console.log('No classrooms found in the database.');
    } else {
      classrooms.forEach((classroom, index) => {
        console.log(`\n${index + 1}. Classroom: ${classroom.name}`);
        console.log(`   Description: ${classroom.description}`);
        console.log(`   Course: ${classroom.course}`);
        console.log(`   Date: ${new Date(classroom.date).toLocaleDateString()}`);
        console.log(`   Entry Code: ${classroom.entryCode}`);
        console.log(`   Students: ${classroom.students.length}`);
        console.log(`   Instructor ID: ${classroom.instructor._id}`);
        console.log(`   Instructor Name: ${classroom.instructor.name || 'N/A'}`);
        console.log(`   Instructor Email: ${classroom.instructor.email || 'N/A'}`);
        console.log(`   Created: ${new Date(classroom.createdAt).toLocaleString()}`);
        console.log('   ----------------------------------------');
      });
    }
    
    // Also show all users for reference
    console.log('\n👥 ALL USERS IN THE SYSTEM:');
    console.log('==========================');
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

viewClassroomsWithInstructors(); 