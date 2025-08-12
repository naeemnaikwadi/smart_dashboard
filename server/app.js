const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/skills', require('./routes/skill'));
app.use('/api/excel', require('./routes/excel'));
app.use('/api/learning-paths', require('./routes/learningPathRoutes')); // Learning Path route
app.use('/api/instructor', require('./routes/instructorRoutes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/student', require('./routes/student')); // Student routes
app.use('/api/upload', require('./routes/fileUpload')); // File upload routes

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date() });
});

module.exports = app;
