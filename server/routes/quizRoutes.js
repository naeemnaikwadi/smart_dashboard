const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LearningPath = require('../models/LearningPath');
const { auth, instructorOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/quiz-questions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
    // cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @route   POST api/quizzes
// @desc    Create a new quiz for a learning path step
// @access  Private (Instructor)
router.post('/', auth, instructorOnly, upload.single('questionFile'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      learningPathId, 
      stepId, 
      questions, 
      timeLimit, 
      passingScore, 
      allowRetakes, 
      maxAttempts 
    } = req.body;

    // Check if learning path exists and instructor owns it
    const learningPath = await LearningPath.findById(learningPathId);
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    if (learningPath.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only create quizzes for your own learning paths' });
    }

    // Parse questions if it's a string
    let parsedQuestions = questions;
    if (typeof questions === 'string') {
      try {
        parsedQuestions = JSON.parse(questions);
      } catch (error) {
        return res.status(400).json({ error: 'Invalid questions format' });
      }
    }

    // Process file upload if provided
    if (req.file) {
      // Handle file upload for questions
      // This could be a CSV, Excel, or text file with questions
      // For now, we'll store the file path and let the frontend handle parsing
      const questionFile = req.file.path.replace(/\\/g, '/').replace('uploads/', '/uploads/');
      
      // You can add logic here to parse different file formats
      // For now, we'll require manual question creation
      if (!parsedQuestions || parsedQuestions.length === 0) {
        return res.status(400).json({ error: 'Questions are required when uploading a file' });
      }
    }

    // Validate questions
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    // Process and validate each question
    const processedQuestions = parsedQuestions.map((question, index) => {
      const processedQuestion = {
        question: question.question,
        type: question.type,
        points: question.points || 1,
        difficulty: question.difficulty || 'medium',
        explanation: question.explanation || ''
      };

      if (question.type === 'mcq' || question.type === 'multiple_choice') {
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          throw new Error(`Question ${index + 1}: Options are required for MCQ/multiple choice questions`);
        }
        processedQuestion.options = question.options;
        processedQuestion.correctAnswer = question.correctAnswer;
      } else if (question.type === 'long_answer') {
        processedQuestion.longAnswerGuidelines = question.longAnswerGuidelines || '';
      }

      return processedQuestion;
    });

    const quiz = await Quiz.create({
      title,
      description,
      learningPathId,
      stepId,
      instructorId: req.user.id,
      questions: processedQuestions,
      timeLimit: timeLimit || 30,
      passingScore: passingScore || 70,
      allowRetakes: allowRetakes !== 'false',
      maxAttempts: maxAttempts || 3
    });

    // Update learning path step to include quiz
    await LearningPath.updateOne(
      { 
        _id: learningPathId, 
        'steps._id': stepId 
      },
      { 
        $set: { 
          'steps.$.hasQuiz': true,
          'steps.$.quizId': quiz._id,
          'steps.$.quizRequired': true,
          'steps.$.quizPassingScore': passingScore || 70
        } 
      }
    );

    res.status(201).json(quiz);
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('Question')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/quizzes/learning-path/:learningPathId
// @desc    Get all quizzes for a learning path
// @access  Private
router.get('/learning-path/:learningPathId', auth, async (req, res) => {
  try {
    const { learningPathId } = req.params;

    // Check if user has access to this learning path
    const learningPath = await LearningPath.findById(learningPathId);
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const course = await require('../models/Course').findById(learningPath.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    if (!isInstructor) {
      const classroom = await require('../models/Classroom').findById(course.classroom);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      const isEnrolled = classroom.students.includes(req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const quizzes = await Quiz.find({ 
      learningPathId,
      isActive: true 
    }).populate('instructorId', 'name email');

    res.json(quizzes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/quizzes/:id
// @desc    Get a specific quiz
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('instructorId', 'name email')
      .populate('learningPathId', 'title');

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check access permissions
    const learningPath = await LearningPath.findById(quiz.learningPathId);
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const course = await require('../models/Course').findById(learningPath.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const isInstructor = course.instructor.toString() === req.user.id;
    if (!isInstructor) {
      const classroom = await require('../models/Classroom').findById(course.classroom);
      if (!classroom) {
        return res.status(404).json({ error: 'Classroom not found' });
      }
      
      const isEnrolled = classroom.students.includes(req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // For students, don't send correct answers
    if (!isInstructor) {
      const studentQuiz = {
        ...quiz.toObject(),
        questions: quiz.questions.map(q => ({
          ...q,
          correctAnswer: undefined,
          explanation: undefined
        }))
      };
      return res.json(studentQuiz);
    }

    res.json(quiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/quizzes/:id/start
// @desc    Start a quiz attempt
// @access  Private
router.post('/:id/start', auth, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check if student has access to this quiz
    const learningPath = await LearningPath.findById(quiz.learningPathId);
    if (!learningPath) {
      return res.status(404).json({ error: 'Learning path not found' });
    }

    const course = await require('../models/Course').findById(learningPath.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const classroom = await require('../models/Classroom').findById(course.classroom);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }
    
    const isEnrolled = classroom.students.includes(req.user.id);
    if (!isEnrolled) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if student has exceeded max attempts
    const existingAttempts = await QuizAttempt.find({
      studentId: req.user.id,
      quizId: quizId
    });

    if (existingAttempts.length >= quiz.maxAttempts) {
      return res.status(400).json({ error: 'Maximum attempts exceeded for this quiz' });
    }

    // Create new attempt
    const attempt = new QuizAttempt({
      studentId: req.user.id,
      quizId: quizId,
      learningPathId: quiz.learningPathId,
      stepId: quiz.stepId,
      maxScore: quiz.totalPoints,
      attemptNumber: existingAttempts.length + 1
    });

    await attempt.save();

    res.json({
      message: 'Quiz started',
      attemptId: attempt._id,
      timeLimit: quiz.timeLimit,
      totalQuestions: quiz.questions.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST api/quizzes/:id/submit
// @desc    Submit quiz answers
// @access  Private
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (attempt.studentId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (attempt.status === 'completed') {
      return res.status(400).json({ error: 'Quiz already completed' });
    }

    // Process answers and calculate scores
    const processedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      if (!question) return null;

      let isCorrect = false;
      let pointsEarned = 0;
      let feedback = '';

      if (question.type === 'mcq' || question.type === 'multiple_choice') {
        isCorrect = answer.answer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`;
      } else if (question.type === 'long_answer') {
        // For long answer, instructor needs to grade manually
        // For now, we'll give partial credit based on answer length
        const answerLength = answer.answer.length;
        if (answerLength > 100) {
          pointsEarned = question.points * 0.8;
          feedback = 'Good effort. Instructor will review for final grade.';
        } else if (answerLength > 50) {
          pointsEarned = question.points * 0.5;
          feedback = 'Basic answer. Instructor will review for final grade.';
        } else {
          pointsEarned = 0;
          feedback = 'Answer too short. Instructor will review.';
        }
        isCorrect = false; // Long answers need manual grading
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        pointsEarned,
        feedback,
        timeSpent: answer.timeSpent || 0
      };
    }).filter(Boolean);

    // Update attempt with answers and complete it
    attempt.answers = processedAnswers;
    attempt.completeAttempt();

    await attempt.save();

    // Update learning path progress
    await LearningPath.updateOne(
      { 
        _id: attempt.learningPathId,
        'learners.learnerId': req.user.id
      },
      {
        $push: {
          'learners.$.quizResults': {
            stepId: attempt.stepId,
            quizId: attempt.quizId,
            bestScore: attempt.totalScore,
            attempts: attempt.attemptNumber,
            passed: attempt.passed,
            lastAttemptDate: new Date()
          }
        }
      }
    );

    res.json({
      message: 'Quiz submitted successfully',
      score: attempt.totalScore,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      passed: attempt.passed,
      feedback: attempt.feedback
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/quizzes/:id/attempts
// @desc    Get quiz attempts for a specific quiz
// @access  Private (Instructor)
router.get('/:id/attempts', auth, instructorOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const attempts = await QuizAttempt.find({ quizId: req.params.id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/quizzes/:id
// @desc    Update a quiz
// @access  Private (Instructor)
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedQuiz);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE api/quizzes/:id
// @desc    Delete a quiz
// @access  Private (Instructor)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update learning path step to remove quiz reference
    await LearningPath.updateOne(
      { 'steps.quizId': req.params.id },
      { 
        $set: { 
          'steps.$.hasQuiz': false,
          'steps.$.quizId': null,
          'steps.$.quizRequired': false
        } 
      }
    );

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
