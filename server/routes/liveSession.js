// backend/routes/liveSession.js
const express = require('express');
const router = express.Router();
const LiveSession = require('../models/LiveSession');
const { auth, instructorOnly } = require('../middleware/auth');
const Classroom = require('../models/Classroom');
const mongoose = require('mongoose');

// Get all live sessions for the user (based on role)
router.get('/', auth, async (req, res) => {
  try {
    let sessions;
    
    if (req.user.role === 'instructor') {
      // Instructors see all sessions they created
      sessions = await LiveSession.find({ instructor: req.user.id })
        .populate('instructor', 'name email')
        .populate('classroom', 'name')
        .populate('courseId', 'name')
        .sort({ date: 1 });
    } else {
      // Students see sessions from classrooms they're enrolled in
      const enrolledClassrooms = await Classroom.find({
        students: req.user.id
      });
      
      const classroomIds = enrolledClassrooms.map(c => c._id);
      
      sessions = await LiveSession.find({
        classroom: { $in: classroomIds }
      })
        .populate('instructor', 'name email')
        .populate('classroom', 'name')
        .populate('courseId', 'name')
        .sort({ date: 1 });
    }
    
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get live sessions for an instructor explicitly (for UI that calls this path)
router.get('/instructor/:instructorId', auth, instructorOnly, async (req, res) => {
  try {
    const { instructorId } = req.params;
    if (instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const sessions = await LiveSession.find({ instructor: instructorId })
      .populate('instructor', 'name email')
      .populate('classroom', 'name')
      .populate('courseId', 'name')
      .sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Create session (Instructor)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, date, classroomId, courseId } = req.body;
    if (!title || !date || !classroomId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const instructor = req.user.id;
    // Use a relative link for frontend routing
    const link = `/live/${classroomId}/${title.replace(/\s+/g, '-')}`;

    const session = new LiveSession({
      title,
      description,
      date,
      instructor,
      classroom: classroomId,
      courseId,
      link,
    });

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get sessions for a specific classroom (for members of that classroom)
router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if user is instructor or student in this classroom
    const isInstructor = classroom.instructor.toString() === req.user.id;
    const isStudent = classroom.students.some(studentId => studentId.toString() === req.user.id);

    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sessions = await LiveSession.find({ classroom: classroomId }).populate('instructor', 'name').sort({ date: 1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// I've added the following routes to complete the CRUD functionality for live sessions.

// @route   GET api/live-sessions/:id
// @desc    Get a single live session
// @access  Private (Classroom members only)
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate({
      path: 'classroom',
      select: 'instructor students'
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is instructor or student in this classroom
    const { classroom } = session;
    const isInstructor = classroom.instructor.toString() === req.user.id;
    const isStudent = classroom.students.some(studentId => studentId.toString() === req.user.id);

    if (!isInstructor && !isStudent) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// @route   PUT api/live-sessions/:id
// @desc    Update a live session
// @access  Private (Instructor only)
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    let session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to update this session' });
    }

    session = await LiveSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(session);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/live-sessions/:id
// @desc    Delete a live session
// @access  Private (Instructor only)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (session.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to delete this session' });
    }

    await LiveSession.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
