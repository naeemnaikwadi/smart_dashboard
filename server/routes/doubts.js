const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { auth, instructorOnly, studentOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Classroom = require('../models/Classroom'); // Added missing import for Classroom

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/doubts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doubt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new doubt (Student only)
router.post('/', auth, studentOnly, upload.array('images', 5), async (req, res) => {
  try {
    const { courseId, title, description, priority, tags, isUrgent } = req.body;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if student is enrolled in the classroom that contains this course
    const classroom = await Classroom.findById(course.classroom);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    if (!classroom.students.map(id => id.toString()).includes(req.user.id)) {
      return res.status(403).json({ error: 'You are not enrolled in this classroom' });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/doubts/${file.filename}`,
      fileName: file.originalname
    })) : [];

    const doubt = new Doubt({
      student: req.user.id,
      course: courseId,
      classroom: course.classroom,
      title,
      description,
      images,
      priority: priority || 'medium',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isUrgent: isUrgent === 'true'
    });

    await doubt.save();

    // Create notification for instructor
    const notification = new Notification({
      recipient: course.instructor,
      type: 'doubt',
      title: 'New Doubt Submitted',
      message: `Student ${req.user.name} has submitted a doubt in course "${course.name}"`,
      relatedData: {
        doubt: doubt._id,
        course: courseId,
        student: req.user.id
      },
      priority: isUrgent === 'true' ? 'urgent' : 'high',
      actionUrl: `/instructor/doubts/${doubt._id}`
    });

    await notification.save();

    res.status(201).json({
      message: 'Doubt submitted successfully',
      doubt: await doubt.populate(['student', 'course', 'classroom'])
    });
  } catch (error) {
    console.error('Error creating doubt:', error);
    res.status(500).json({ error: 'Failed to submit doubt' });
  }
});

// Get all doubts (general route that redirects based on role)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'instructor') {
      // Redirect to instructor doubts
      const { page = 1, limit = 10, courseId, status, priority, search } = req.query;
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = { 'course.instructor': req.user.id };
      if (courseId) filter['course'] = courseId;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const doubts = await Doubt.find(filter)
        .populate('student', 'name email')
        .populate('course', 'name')
        .populate('classroom', 'name')
        .populate('answer.instructor', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Doubt.countDocuments(filter);
      
      res.json({
        doubts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDoubts: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      });
    } else {
      // Redirect to student doubts
      const { page = 1, limit = 10, courseId, status, search } = req.query;
      const skip = (page - 1) * limit;
      
      // Build filter object
      const filter = { student: req.user.id };
      if (courseId) filter.course = courseId;
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      const doubts = await Doubt.find(filter)
        .populate('course', 'name')
        .populate('classroom', 'name')
        .populate('answer.instructor', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Doubt.countDocuments(filter);
      
      res.json({
        doubts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalDoubts: total,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1
        }
      });
    }
  } catch (error) {
    console.error('Error fetching doubts:', error);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// Get all doubts for an instructor with filters
router.get('/instructor', auth, instructorOnly, async (req, res) => {
  try {
    const { 
      courseId, 
      classroomId, 
      status, 
      priority, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (courseId) filter.course = courseId;
    if (classroomId) filter.classroom = classroomId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    // Get courses where user is instructor
    const instructorCourses = await Course.find({ instructor: req.user.id }).select('_id');
    const courseIds = instructorCourses.map(course => course._id);
    
    // Add course filter to ensure instructor only sees doubts from their courses
    filter.course = { $in: courseIds };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const doubts = await Doubt.find(filter)
      .populate('student', 'name email avatarUrl')
      .populate('course', 'name')
      .populate('classroom', 'name')
      .populate('answer.instructor', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doubt.countDocuments(filter);

    res.json({
      doubts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDoubts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching instructor doubts:', error);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// Get doubts for a student
router.get('/student', auth, studentOnly, async (req, res) => {
  try {
    const { courseId, status, page = 1, limit = 10 } = req.query;
    
    const filter = { student: req.user.id };
    if (courseId) filter.course = courseId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const doubts = await Doubt.find(filter)
      .populate('course', 'name')
      .populate('classroom', 'name')
      .populate('answer.instructor', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Doubt.countDocuments(filter);

    res.json({
      doubts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalDoubts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching student doubts:', error);
    res.status(500).json({ error: 'Failed to fetch doubts' });
  }
});

// Get a specific doubt by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('student', 'name email avatarUrl')
      .populate('course', 'name description')
      .populate('classroom', 'name')
      .populate('answer.instructor', 'name');

    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    // Check if user has access to this doubt
    const course = await Course.findById(doubt.course);
    if (req.user.role === 'student' && doubt.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'instructor' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(doubt);
  } catch (error) {
    console.error('Error fetching doubt:', error);
    res.status(500).json({ error: 'Failed to fetch doubt' });
  }
});

// Configure multer for answer attachments
const answerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/doubts/answers/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'answer-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const answerUpload = multer({
  storage: answerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for PDFs and images
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});

// Answer a doubt (Instructor only)
router.put('/:id/answer', auth, instructorOnly, answerUpload.array('attachments', 5), async (req, res) => {
  try {
    const { answer, links } = req.body;
    
    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'Answer text is required' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    // Verify instructor owns the course
    const course = await Course.findById(doubt.course);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Process uploaded attachments
    const attachments = req.files ? req.files.map(file => ({
      url: `/uploads/doubts/answers/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      uploadedAt: new Date()
    })) : [];

    // Process links
    const processedLinks = links ? JSON.parse(links).map(link => ({
      url: link.url,
      title: link.title || link.url,
      addedAt: new Date()
    })) : [];

    doubt.answer = {
      instructor: req.user.id,
      text: answer.trim(),
      attachments,
      links: processedLinks,
      answeredAt: new Date()
    };
    doubt.status = 'answered';

    await doubt.save();

    // Create notification for student
    const notification = new Notification({
      recipient: doubt.student,
      type: 'doubt',
      title: 'Doubt Answered',
      message: `Your doubt "${doubt.title}" has been answered by your instructor`,
      relatedData: {
        doubt: doubt._id,
        course: doubt.course,
        instructor: req.user.id
      },
      priority: 'medium',
      actionUrl: `/student/doubts/${doubt._id}`
    });

    await notification.save();

    res.json({
      message: 'Doubt answered successfully',
      doubt: await doubt.populate(['student', 'course', 'classroom', 'answer.instructor'])
    });
  } catch (error) {
    console.error('Error answering doubt:', error);
    res.status(500).json({ error: 'Failed to answer doubt' });
  }
});

// Update doubt status
router.put('/:id/status', auth, instructorOnly, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'answered', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    // Verify instructor owns the course
    const course = await Course.findById(doubt.course);
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    doubt.status = status;
    await doubt.save();

    res.json({
      message: 'Doubt status updated successfully',
      doubt: await doubt.populate(['student', 'course', 'classroom', 'answer.instructor'])
    });
  } catch (error) {
    console.error('Error updating doubt status:', error);
    res.status(500).json({ error: 'Failed to update doubt status' });
  }
});

// Delete a doubt (Student only, if not answered)
router.delete('/:id', auth, studentOnly, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    if (doubt.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (doubt.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete answered or resolved doubts' });
    }

    await Doubt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doubt deleted successfully' });
  } catch (error) {
    console.error('Error deleting doubt:', error);
    res.status(500).json({ error: 'Failed to delete doubt' });
  }
});

module.exports = router;
