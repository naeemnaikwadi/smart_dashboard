const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');

// GET /api/instructor/stats/:instructorId
router.get('/stats/:instructorId', async (req, res) => {
  const { instructorId } = req.params;

  try {
    const courses = await Course.find({ instructorId });

    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, course) => acc + (course.studentsEnrolled?.length || 0), 0);
    const averageRating = courses.length
      ? (courses.reduce((acc, course) => acc + (course.averageRating || 0), 0) / courses.length).toFixed(2)
      : 0;

    res.json({ totalCourses, totalStudents, averageRating });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
