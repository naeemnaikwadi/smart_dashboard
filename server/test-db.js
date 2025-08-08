const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
async function testDB() {
  try {
    console.log('Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ MongoDB connected successfully');
    
    // Test Classroom model
    const Classroom = require('./models/Classroom');
    const classrooms = await Classroom.find({});
    console.log('Total classrooms in DB:', classrooms.length);
    console.log('Sample classroom:', classrooms[0]);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testDB(); 