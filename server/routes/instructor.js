const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Progress = require('../models/Progress');
const { auth, instructorOnly } = require('../middleware/auth');

// GET /api/instructor/stats/:instructorId
router.get('/stats/:instructorId', auth, instructorOnly, async (req, res) => {
  const { instructorId } = req.params;

  try {
    // Fetch courses with populated data
    const courses = await Course.find({ instructor: instructorId })
      .populate('classroom', 'name')
      .populate('studentsEnrolled', 'name email');

    // Fetch classrooms for this instructor
    const classrooms = await Classroom.find({ instructor: instructorId });

    // Calculate stats
    const totalCourses = courses.length;
    
    // Count unique students across all courses
    const uniqueStudents = new Set();
    courses.forEach(course => {
      course.studentsEnrolled.forEach(student => {
        uniqueStudents.add(student._id.toString());
      });
    });
    const totalStudents = uniqueStudents.size;

    // Calculate average rating
    const coursesWithRatings = courses.filter(course => course.averageRating > 0);
    const averageRating = coursesWithRatings.length > 0
      ? (courses.reduce((acc, course) => acc + (course.averageRating || 0), 0) / coursesWithRatings.length).toFixed(1)
      : 0;

    // Count active learners (students with recent activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeLearners = await Progress.countDocuments({
      learnerId: { $in: Array.from(uniqueStudents) },
      lastAccessed: { $gte: thirtyDaysAgo }
    });

    // Get monthly enrollments for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyEnrollments = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const enrollments = courses.filter(course => 
        course.createdAt >= monthStart && course.createdAt <= monthEnd
      ).length;

      monthlyEnrollments.unshift({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        enrollments
      });
    }

    res.json({ 
      totalCourses, 
      totalStudents, 
      averageRating: parseFloat(averageRating),
      activeLearners,
      totalClassrooms: classrooms.length,
      monthlyEnrollments
    });
  } catch (err) {
    console.error('Error fetching instructor stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
