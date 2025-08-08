// server/routes/instructorRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // adjust the path if needed
const User = require('../models/User');     // for counting students
//const Enrollment = require('../models/Enrollment'); // optional
//const Rating = require('../models/Rating');

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

module.exports = router;
