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

// @route   GET api/courses/enrolled
// @desc    Get all courses that a student is enrolled in
// @access  Private (Student)
router.get('/enrolled', auth, async (req, res) => {
    try {
        // Get classrooms where student is enrolled (explicit projection to avoid heavy docs)
        const enrolledClassrooms = await Classroom.find(
            { students: req.user.id },
            { _id: 1 }
        );

        if (!enrolledClassrooms || enrolledClassrooms.length === 0) {
            return res.json([]);
        }

        const classroomIds = enrolledClassrooms.map(c => c._id);

        // Get courses in those classrooms
        const courses = await Course.find({ classroom: { $in: classroomIds }})
            .populate('instructor', 'name email')
            .populate('classroom', 'name')
            .sort({ date: -1 });

        res.json(Array.isArray(courses) ? courses : []);
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
        
        // Get learning paths for this course
        const LearningPath = require('../models/LearningPath');
        const learningPaths = await LearningPath.find({ 
            courseId: course._id,
            isActive: true 
        }).select('title description totalSteps estimatedTotalTime learners');
        
        // Add learning paths to course object
        const courseWithPaths = course.toObject();
        courseWithPaths.learningPaths = learningPaths;
        
        res.json(courseWithPaths);
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
        const { title, type, url, fileName, fileSize, cloudinaryId, cloudinaryUrl } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Verify the instructor owns this course
        if (course.instructor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to add materials to this course' });
        }
        
        // Always store only secure_url in `url` and mark as Cloudinary
        const secureUrl = cloudinaryUrl || url || '';
        const newMaterial = {
            title,
            type,
            url: secureUrl,
            fileName,
            fileSize,
            // Keep cloudinaryId for management if provided, but do not rely on it for delivery
            cloudinaryId: cloudinaryId || undefined,
            cloudinaryUrl: undefined,
            isCloudinary: true
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

// POST /api/courses/:courseId/rate - Rate a course
router.post('/:courseId/rate', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, review } = req.body;
    const studentId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if student is enrolled in the classroom that contains this course
    const classroom = await Classroom.findById(course.classroom);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    if (!classroom.students.includes(studentId)) {
      return res.status(403).json({ error: 'You must be enrolled in this classroom to rate courses in it' });
    }

    // Check if student has already rated this course
    const existingRatingIndex = course.ratings.findIndex(r => r.studentId.toString() === studentId);
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      course.ratings[existingRatingIndex].rating = rating;
      course.ratings[existingRatingIndex].review = review || '';
      course.ratings[existingRatingIndex].createdAt = new Date();
    } else {
      // Add new rating
      course.ratings.push({
        studentId,
        rating,
        review: review || ''
      });
    }

    // Save course to trigger pre-save middleware for average calculation
    await course.save();

    res.json({ 
      message: 'Rating submitted successfully',
      averageRating: course.averageRating,
      totalRatings: course.totalRatings
    });
  } catch (error) {
    console.error('Error rating course:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// GET /api/courses/:courseId/ratings - Get course ratings
router.get('/:courseId/ratings', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId)
      .populate('ratings.studentId', 'name email')
      .select('ratings averageRating totalRatings');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Transform ratings to include userName for frontend compatibility
    const transformedRatings = course.ratings.map(rating => ({
      ...rating.toObject(),
      userName: rating.studentId?.name || 'Anonymous',
      createdAt: rating.createdAt
    }));

    res.json(transformedRatings);
  } catch (error) {
    console.error('Error fetching course ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
