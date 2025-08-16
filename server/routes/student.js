const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Classroom = require('../models/Classroom');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { auth, instructorOnly, studentOnly } = require('../middleware/auth');

// Get all students with their information (instructor only)
router.get('/info', auth, instructorOnly, async (req, res) => {
  try {
    const { classroom, course } = req.query;
    
    let query = { role: 'student' };
    let students = [];

    // If classroom filter is applied
    if (classroom) {
      const classroomData = await Classroom.findById(classroom).populate('students');
      if (classroomData) {
        students = classroomData.students;
      }
    } else {
      // Get all students
      students = await User.find(query);
    }

    // If course filter is applied
    if (course) {
      // Filter students by course enrollment (this would need to be implemented based on your enrollment system)
      // For now, we'll return all students
    }

    // Get progress information for each student
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const progress = await Progress.findOne({ learnerId: student._id });
        
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: student.createdAt,
          progress: progress ? progress.overallProgress : 0,
          timeSpent: progress ? progress.timeSpent : 0,
          lastAccessed: progress ? progress.lastAccessed : null,
          classroom: classroom ? { _id: classroom, name: 'Current Classroom' } : null
        };
      })
    );

    res.json(studentsWithProgress);
  } catch (error) {
    console.error('Error fetching student info:', error);
    res.status(500).json({ message: 'Failed to fetch student information' });
  }
});

// Get detailed information for a specific student
router.get('/details/:id', auth, instructorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's progress
    const progress = await Progress.findOne({ learnerId: id });
    
    // Get student's classrooms
    const classrooms = await Classroom.find({ students: id }).populate('instructor', 'name email');
    
    // Get student's courses (if you have an enrollment system)
    const courses = []; // This would need to be implemented based on your enrollment system

    const studentDetails = {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
      createdAt: student.createdAt,
      progress: progress ? progress.overallProgress : 0,
      timeSpent: progress ? progress.timeSpent : 0,
      lastAccessed: progress ? progress.lastAccessed : null,
      classrooms: classrooms,
      courses: courses,
      readingStatistics: progress ? progress.readingStatistics : null,
      achievements: progress ? progress.achievements : []
    };

    res.json(studentDetails);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Failed to fetch student details' });
  }
});

// Get students for a specific classroom
router.get('/classroom/:classroomId', auth, instructorOnly, async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    const classroom = await Classroom.findById(classroomId)
      .populate('students', 'name email role createdAt')
      .populate('instructor', 'name email');
    
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    // Check if the authenticated user is the instructor of this classroom
    if (classroom.instructor._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get progress for each student in the classroom
    const studentsWithProgress = await Promise.all(
      classroom.students.map(async (student) => {
        const progress = await Progress.findOne({ learnerId: student._id });
        
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          createdAt: student.createdAt,
          progress: progress ? progress.overallProgress : 0,
          timeSpent: progress ? progress.timeSpent : 0,
          lastAccessed: progress ? progress.lastAccessed : null
        };
      })
    );

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        instructor: classroom.instructor
      },
      students: studentsWithProgress
    });
  } catch (error) {
    console.error('Error fetching classroom students:', error);
    res.status(500).json({ message: 'Failed to fetch classroom students' });
  }
});

// GET /api/student/courses
router.get('/courses', auth, studentOnly, async (req, res) => {
  try {
    const courses = await Course.find({ studentsEnrolled: req.user.id })
      .populate('classroom', 'name')
      .populate('instructor', 'name')
      .sort({ createdAt: -1 });

    res.json({ courses });
  } catch (error) {
    console.error('Error fetching student courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
