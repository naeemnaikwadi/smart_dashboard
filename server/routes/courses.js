const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Classroom = require('../models/Classroom');
const { auth, instructorOnly } = require('../middleware/auth');

// @route   GET api/courses
// @desc    Get all courses (for testing)
// @access  Public (for testing)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email')
      .populate('classroom', 'name')
      .sort({ date: -1 });
    res.json(courses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/courses
// @desc    Create a course (instructor only)
// @access  Private (Instructor)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { name, description, date, classroom } = req.body;
    
    // Verify the classroom exists and belongs to the instructor
    const classroomDoc = await Classroom.findById(classroom);
    if (!classroomDoc) {
      return res.status(404).json({ message: 'Classroom not found' });
    }
    
    if (classroomDoc.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create courses for this classroom' });
    }

    const course = new Course({
      name,
      description,
      date: new Date(date),
      classroom,
      instructor: req.user.id
    });

    await course.save();
    
    // Populate the instructor and classroom details
    await course.populate('instructor', 'name email');
    await course.populate('classroom', 'name');
    
    res.status(201).json(course);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/courses/classroom/:classroomId
// @desc    Get all courses for a classroom (for both instructor and students)
// @access  Private
router.get('/classroom/:classroomId', auth, async (req, res) => {
    try {
        const { classroomId } = req.params;
        
        // Verify user has access to this classroom
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
        
        const courses = await Course.find({ classroom: classroomId })
            .populate('instructor', 'name email')
            .sort({ date: -1 });
            
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/:id
// @desc    Get single course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name email')
            .populate('classroom', 'name');
            
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Check if user has access to this course's classroom
        const classroom = await Classroom.findById(course.classroom);
        const isInstructor = classroom.instructor.toString() === req.user.id;
        const isStudent = classroom.students.some(studentId => studentId.toString() === req.user.id);
        
        if (!isInstructor && !isStudent) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/courses/:id
// @desc    Update a course (instructor only)
// @access  Private (Instructor)
router.put('/:id', auth, instructorOnly, async (req, res) => {
    try {
        const { name, description, date } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this course' });
        }
        
        course.name = name || course.name;
        course.description = description || course.description;
        course.date = date ? new Date(date) : course.date;
        
        await course.save();
        await course.populate('instructor', 'name email');
        await course.populate('classroom', 'name');
        
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/instructor/:instructorId
// @desc    Get all courses for an instructor
// @access  Private (Instructor)
router.get('/instructor/:instructorId', auth, instructorOnly, async (req, res) => {
    try {
        const { instructorId } = req.params;
        
        // Verify the instructor is requesting their own courses
        if (req.user.id !== instructorId) {
            return res.status(403).json({ message: 'Not authorized to view these courses' });
        }
        
        const courses = await Course.find({ instructor: instructorId })
            .populate('classroom', 'name')
            .sort({ date: -1 });
            
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/courses/:id
// @desc    Delete a course (instructor only)
// @access  Private (Instructor)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }
        
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/:id/materials
// @desc    Add material to a course (instructor only)
// @access  Private (Instructor)
router.post('/:id/materials', auth, instructorOnly, async (req, res) => {
    try {
        const { title, type, url, fileName, fileSize } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to add materials to this course' });
        }
        
        const newMaterial = {
            title,
            type,
            url,
            fileName,
            fileSize
        };
        
        course.materials.push(newMaterial);
        await course.save();
        
        res.status(201).json(course.materials[course.materials.length - 1]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/courses/:id/materials/:materialId
// @desc    Delete material from a course (instructor only)
// @access  Private (Instructor)
router.delete('/:id/materials/:materialId', auth, instructorOnly, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete materials from this course' });
        }
        
        course.materials = course.materials.filter(
            material => material._id.toString() !== req.params.materialId
        );
        
        await course.save();
        res.json({ message: 'Material deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/:id/live-sessions
// @desc    Add live session to a course (instructor only)
// @access  Private (Instructor)
router.post('/:id/live-sessions', auth, instructorOnly, async (req, res) => {
    try {
        const { title, description, scheduledAt, duration } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to add live sessions to this course' });
        }
        
        // Generate unique room name
        const roomName = `${course.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
        
        const newLiveSession = {
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            duration: duration || 60,
            roomName
        };
        
        course.liveSessions.push(newLiveSession);
        await course.save();
        
        res.status(201).json(course.liveSessions[course.liveSessions.length - 1]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/courses/:id/live-sessions/:sessionId
// @desc    Delete live session from a course (instructor only)
// @access  Private (Instructor)
router.delete('/:id/live-sessions/:sessionId', auth, instructorOnly, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete live sessions from this course' });
        }
        
        course.liveSessions = course.liveSessions.filter(
            session => session._id.toString() !== req.params.sessionId
        );
        
        await course.save();
        res.json({ message: 'Live session deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
