// server/routes/instructorRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const { auth, instructorOnly } = require('../middleware/auth');

// GET /api/instructor/stats/:instructorId
router.get('/stats/:instructorId', async (req, res) => {
  try {
    const instructorId = req.params.instructorId;

    // Count courses
    const totalCourses = await Course.countDocuments({ instructor: instructorId });

    // Count total students (assumes 'enrolledStudents' array)
    const courses = await Course.find({ instructor: instructorId });
    const totalStudents = courses.reduce((acc, course) => acc + (course.enrolledStudents?.length || 0), 0);

    // Calculate average rating (assumes 'rating' on course)
    const ratedCourses = courses.filter(course => course.rating);
    const averageRating = ratedCourses.length
      ? (ratedCourses.reduce((acc, c) => acc + c.rating, 0) / ratedCourses.length).toFixed(2)
      : 0;

    res.json({
      totalCourses,
      totalStudents,
      averageRating
    });
  } catch (err) {
    console.error('Instructor stats error:', err);
    res.status(500).json({ error: 'Failed to fetch instructor stats' });
  }
});

// GET /api/instructor/courses
router.get('/courses', auth, instructorOnly, async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user.id })
      .populate('classroom', 'name')
      .populate('studentsEnrolled', 'name email')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /api/instructor/classrooms
router.get('/classrooms', auth, instructorOnly, async (req, res) => {
  try {
    const classrooms = await Classroom.find({ instructor: req.user.id })
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json({ classrooms });
  } catch (error) {
    console.error('Error fetching instructor classrooms:', error);
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

module.exports = router;
