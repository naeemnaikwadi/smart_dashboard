const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth, instructorOnly } = require('../middleware/auth');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const multer = require('multer');
const xlsx = require('xlsx');

// Multer config for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Generate 6-char entry code
const generateEntryCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// 📌 Get all classrooms (for testing and general access)
router.get('/', auth, async (req, res) => {
  try {
    let classrooms;
    
    if (req.user.role === 'instructor') {
      // Instructors see their own classrooms
      classrooms = await Classroom.find({ instructor: req.user.id })
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Students see classrooms they're enrolled in
      classrooms = await Classroom.find({ students: req.user.id })
        .populate('instructor', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.json(classrooms);
  } catch (error) {
    console.error('Fetch classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Create Classroom
router.post('/create', auth, instructorOnly, upload.single('excelFile'), async (req, res) => {
  try {
    const { name, description, date, course } = req.body;
    const instructorId = req.user.id;
    const instructorName = req.user.name || 'Unknown Instructor';

    // Unique entry code
    let entryCode;
    let isUnique = false;
    while (!isUnique) {
      entryCode = generateEntryCode();
      const exists = await Classroom.findOne({ entryCode });
      if (!exists) isUnique = true;
    }

    // Excel parsing (if uploaded)
    let students = [];
    if (req.file) {
      try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        students = data.map(row => ({
          name: row.name || row.Name || row.NAME || '',
          email: row.email || row.Email || row.EMAIL || '',
          studentId: row.studentId || row.student_id || row.StudentId || row.STUDENT_ID || ''
        })).filter(s => s.name || s.email);
      } catch (error) {
        console.error('Excel parsing error:', error);
        return res.status(400).json({ message: 'Invalid Excel file format' });
      }
    }

    const classroom = new Classroom({
      name,
      description,
      date: new Date(date),
      course,
      instructor: instructorId,
      instructorName, // Ensure instructorName is included
      entryCode,
      classCode: entryCode,
      students
    });

    await classroom.save();

    // Return the full classroom object, including the instructor's name
    res.status(201).json({
      ...classroom.toObject(),
      instructorName: instructorName
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Get classrooms for instructor
router.get('/instructor/:instructorId', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.instructorId)
      return res.status(403).json({ message: 'Unauthorized access' });

    const classrooms = await Classroom.find({ instructor: req.params.instructorId }).sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (error) {
    console.error('Fetch instructor classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Get classrooms for filters (dropdown options)
router.get('/filters', auth, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ instructor: req.user.id })
      .select('_id name')
      .sort({ name: 1 });
    
    res.json({ classrooms });
  } catch (error) {
    console.error('Fetch classrooms for filters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Get classrooms for the logged-in student
router.get('/student/me', auth, async (req, res) => {
  try {
    // Find classrooms where the logged-in student's ID is in the 'students' array
    const classrooms = await Classroom.find({ students: req.user.id })
      .populate('instructor', 'name email')
      .sort({ createdAt: -1 });
    res.json(classrooms);
  } catch (error) {
    console.error('Fetch student classrooms error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Get single classroom by ID (for members only)
router.get('/:id', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');

    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    // Check if user is the instructor or an enrolled student
    const isInstructor = classroom.instructor._id.toString() === req.user.id;
    const isStudent = classroom.students.some(student => student._id.toString() === req.user.id);

    if (!isInstructor && !isStudent) {
        return res.status(403).json({ message: 'Access denied' });
    }

    res.json(classroom);
  } catch (error) {
    console.error('Fetch classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Get classroom by entry code
router.get('/find-by-code/:entryCode', async (req, res) => {
  try {
    const { entryCode } = req.params;
    const classroom = await Classroom.findOne({ entryCode });
    if (!classroom) return res.status(404).json({ message: 'Classroom not found.' });
    res.status(200).json(classroom);
  } catch (error) {
    console.error('Find classroom by code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Join classroom by code (for registered user)
router.post('/join', auth, async (req, res) => {
  console.log('Server received join request:', req.body);
  console.log('Authenticated user ID:', req.user.id);
  try {
    const { classCode } = req.body;
    const studentId = req.user.id; // Get student ID from authenticated user

    console.log('Attempting to join with classCode:', classCode);
    console.log('Attempting to join with studentId:', studentId);

    if (!classCode) {
      console.log('Error: Missing class code.');
      return res.status(400).json({ message: 'Missing class code.' });
    }

    const classroom = await Classroom.findOne({ entryCode: classCode });
    console.log('Classroom found:', classroom ? classroom.name : 'None');
    if (!classroom) {
      console.log('Error: Classroom not found with this code.');
      return res.status(404).json({ message: 'Classroom not found with this code.' });
    }

    const user = await User.findById(studentId);
    console.log('User found:', user ? user.email : 'None');
    if (!user) {
      console.log('Error: User not found.');
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if student is already in the classroom's students array
    const alreadyJoined = classroom.students.some(s => s.toString() === studentId);
    console.log('Already joined status:', alreadyJoined);
      if (alreadyJoined) {
        console.log('Already joined status: true');
        console.log('User is already a member of this classroom.');
        return res.status(200).json({ success: true, message: 'You are already a member of this classroom.' });
      }

    classroom.students.push(studentId);
    await classroom.save();

    res.status(200).json({ message: 'Successfully joined the classroom!', classroom });
  } catch (error) {
    console.error('Join classroom error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// 📌 Update classroom
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }
    const { name, description } = req.body;
    let classroom = await Classroom.findById(req.params.id);

    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this classroom' });
    }

    classroom = await Classroom.findByIdAndUpdate(req.params.id, { name, description }, { new: true });

    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    res.json(classroom);
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Delete classroom
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.instructor.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    await Classroom.findByIdAndDelete(req.params.id);
    res.json({ message: 'Classroom deleted successfully' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📌 Remove a student from classroom
router.post('/:id/remove-student', auth, instructorOnly, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid classroom ID' });
    }
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify this classroom' });
    }

    classroom.students = classroom.students.filter(sid => sid.toString() !== studentId);
    await classroom.save();
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
