const express = require('express');
const router = express.Router();
const LearningPath = require('../models/LearningPath');
const Progress = require('../models/Progress');
const Classroom = require('../models/Classroom');
const Course = require('../models/Course');
const { auth, instructorOnly } = require('../middleware/auth');

// @route   POST api/learning-paths
// @desc    Create a learning path for a specific course (instructor only)
// @access  Private (Instructor)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, estimatedTime, resources, courseId } = req.body;
    
    // Check if course exists and instructor owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only create learning paths for your own courses' });
    }

    // Get classroomId from course
    const classroomId = course.classroom;

    const path = await LearningPath.create({ 
      title, 
      description, 
      estimatedTime,
      resources,
      instructorId: req.user.id,
      classroomId,
      courseId
    });
    
    res.status(201).json(path);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths
// @desc    Get learning paths based on user role and course access
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let paths;
    
    if (req.user.role === 'instructor') {
      // Instructors see all learning paths they created
      paths = await LearningPath.find({ instructorId: req.user.id })
        .populate('instructorId', 'name email')
        .populate('classroomId', 'name description')
        .populate('courseId', 'name description')
        .populate('resources');
    } else {
      // Students see learning paths only for courses they're enrolled in
      const enrolledClassrooms = await Classroom.find({
        'students.studentId': req.user.id
      });
      
      const classroomIds = enrolledClassrooms.map(c => c._id);
      
      // Get courses in enrolled classrooms
      const enrolledCourses = await Course.find({
        classroom: { $in: classroomIds }
      });
      
      const courseIds = enrolledCourses.map(c => c._id);
      
      paths = await LearningPath.find({ 
        courseId: { $in: courseIds },
        isActive: true 
      })
        .populate('instructorId', 'name email')
        .populate('classroomId', 'name description')
        .populate('courseId', 'name description')
        .populate('resources');
    }
    
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths/course/:courseId
// @desc    Get learning paths for a specific course
// @access  Private
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user is instructor or enrolled student
    const isInstructor = course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      // Check if student is enrolled in the classroom that contains this course
      const classroom = await Classroom.findById(course.classroom);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      const isEnrolled = classroom.students.some(student => student.studentId.toString() === req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
      }
    }
    
    const paths = await LearningPath.find({ 
      courseId,
      isActive: true 
    })
      .populate('instructorId', 'name email')
      .populate('classroomId', 'name description')
      .populate('courseId', 'name description')
      .populate('resources');
    
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths/classroom/:classroomId
// @desc    Get learning paths for a specific classroom (all courses)
// @access  Private
router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const { classroomId } = req.params;
    
    // Check if user has access to this classroom
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    // Check if user is instructor or enrolled student
    const isInstructor = classroom.instructorId.toString() === req.user.id;
    const isEnrolled = classroom.students.some(student => student.studentId.toString() === req.user.id);
    
    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ error: 'Access denied. You are not enrolled in this classroom.' });
    }
    
    const paths = await LearningPath.find({ 
      classroomId,
      isActive: true 
    })
      .populate('instructorId', 'name email')
      .populate('classroomId', 'name description')
      .populate('courseId', 'name description')
      .populate('resources');
    
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths/:id
// @desc    Get a single learning path
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id)
      .populate('instructorId', 'name email')
      .populate('classroomId', 'name description')
      .populate('courseId', 'name description')
      .populate('resources');
    
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    // Check if user has access to this learning path
    const course = await Course.findById(path.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const isInstructor = course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      // Check if student is enrolled in the classroom that contains this course
      const classroom = await Classroom.findById(course.classroom);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      const isEnrolled = classroom.students.some(student => student.studentId.toString() === req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
      }
    }
    
    res.json(path);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/learning-paths/:id
// @desc    Update a learning path
// @access  Private (Instructor)
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, estimatedTime, resources } = req.body;
    let path = await LearningPath.findById(req.params.id);
    
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    // Authorization check: only the creator can update
    if (path.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized' });
    }

    path = await LearningPath.findByIdAndUpdate(
      req.params.id, 
      { title, description, estimatedTime, resources, updatedAt: Date.now() }, 
      { new: true }
    );
    res.json(path);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/learning-paths/:id
// @desc    Delete a learning path
// @access  Private (Instructor)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    if (path.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized' });
    }

    await LearningPath.findByIdAndDelete(req.params.id);
    res.json({ message: 'Learning path removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/learning-paths/:id/start-session
// @desc    Start a learning session for a specific learning path
// @access  Private
router.post('/:id/start-session', auth, async (req, res) => {
  try {
    const { topic, resourceId } = req.body;
    const learningPathId = req.params.id;
    
    // Check if user has access to this learning path
    const path = await LearningPath.findById(learningPathId);
    if (!path) {
      return res.status(404).json({ error: 'Learning path not found' });
    }
    
    const course = await Course.findById(path.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const isInstructor = course.instructor.toString() === req.user.id;
    
    if (!isInstructor) {
      // Check if student is enrolled in the classroom that contains this course
      const classroom = await Classroom.findById(course.classroom);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      const isEnrolled = classroom.students.some(student => student.studentId.toString() === req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied. You are not enrolled in this course.' });
      }
    }
    
    // Create or update progress
    let progress = await Progress.findOne({ 
      learnerId: req.user.id, 
      learningPathId 
    });
    
    if (!progress) {
      progress = new Progress({
        learnerId: req.user.id,
        learningPathId,
        topicId: resourceId
      });
    }
    
    const session = progress.startReadingSession(topic, resourceId);
    await progress.save();
    
    res.json({ 
      message: 'Learning session started',
      sessionId: session._id,
      progress: progress.overallProgress
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/learning-paths/:id/end-session
// @desc    End a learning session
// @access  Private
router.put('/:id/end-session', auth, async (req, res) => {
  try {
    const { sessionId, duration, pagesRead, completionPercentage } = req.body;
    const learningPathId = req.params.id;
    
    const progress = await Progress.findOne({ 
      learnerId: req.user.id, 
      learningPathId 
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }
    
    progress.endReadingSession(sessionId, duration, pagesRead, completionPercentage);
    await progress.save();
    
    res.json({ 
      message: 'Learning session ended',
      progress: progress.overallProgress
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths/:id/progress
// @desc    Get progress for a specific learning path
// @access  Private
router.get('/:id/progress', auth, async (req, res) => {
  try {
    const learningPathId = req.params.id;
    
    const progress = await Progress.findOne({ 
      learnerId: req.user.id, 
      learningPathId 
    });
    
    if (!progress) {
      return res.json({
        overallProgress: 0,
        timeSpent: 0,
        readingSessions: [],
        lastAccessed: null
      });
    }
    
    res.json(progress);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/learning-paths/:id/update-progress
// @desc    Update progress for a learning path
// @access  Private
router.put('/:id/update-progress', auth, async (req, res) => {
  try {
    const { progressPercentage } = req.body;
    const learningPathId = req.params.id;
    
    let progress = await Progress.findOne({ 
      learnerId: req.user.id, 
      learningPathId 
    });
    
    if (!progress) {
      progress = new Progress({
        learnerId: req.user.id,
        learningPathId
      });
    }
    
    progress.updateProgress(progressPercentage);
    await progress.save();
    
    res.json({ 
      message: 'Progress updated',
      progress: progress.overallProgress
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths/instructor/:instructorId
// @desc    Get all learning paths created by an instructor
// @access  Private (Instructor)
router.get('/instructor/:instructorId', auth, instructorOnly, async (req, res) => {
  try {
    if (req.params.instructorId !== req.user.id) {
      return res.status(403).json({ error: 'You can only view your own learning paths' });
    }
    
    const paths = await LearningPath.find({ instructorId: req.user.id })
      .populate('instructorId', 'name email')
      .populate('classroomId', 'name description')
      .populate('courseId', 'name description')
      .populate('resources');
    
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
