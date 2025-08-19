const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LearningPath = require('../models/LearningPath');
const { auth, instructorOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CloudinaryService = require('../services/cloudinaryService');

// Configure multer for memory storage (to get file buffer for Cloudinary)
const storage = multer.memoryStorage();

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
      // Upload file to Cloudinary
      const cloudinaryResult = await CloudinaryService.uploadFile(
        req.file.buffer, 
        req.file, 
        'smart-learning/quizzes'
      );
      
      // Store Cloudinary URL instead of local path
      const questionFile = cloudinaryResult.cloudinaryUrl;
      
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
        // For MCQ ensure correctAnswer is a single option text
        if (question.type === 'mcq') {
          const correct = (question.options || []).find(o => o.isCorrect);
          processedQuestion.correctAnswer = question.correctAnswer || (correct ? correct.text : '');
        } else {
          processedQuestion.correctAnswer = question.correctAnswer || '';
        }
      } else if (question.type === 'long_answer') {
        processedQuestion.longAnswerGuidelines = question.longAnswerGuidelines || '';
      } else if (question.type === 'numerical') {
        if (question.numericAnswer === undefined || question.numericAnswer === null || question.numericAnswer === '') {
          throw new Error(`Question ${index + 1}: Numeric answer is required for numerical questions`);
        }
        processedQuestion.numericAnswer = Number(question.numericAnswer);
        processedQuestion.numericTolerance = Number(question.numericTolerance || 0);
      } else if (question.type === 'assignment') {
        processedQuestion.requiresUpload = question.requiresUpload !== false;
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

    // For students, don't send correct answers or isCorrect flags
    if (!isInstructor) {
      const quizObj = quiz.toObject();
      quizObj.questions = quizObj.questions.map(q => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
        options: Array.isArray(q.options)
          ? q.options.map(opt => ({ text: opt.text }))
          : undefined
      }));
      return res.json(quizObj);
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
// Allow file uploads for assignment-type answers
router.post('/:id/submit', auth, upload.any(), async (req, res) => {
  try {
    // Answers may come as JSON string when multipart/form-data is used
    const rawAnswers = req.body.answers;
    const { attemptId } = req.body;
    const answers = typeof rawAnswers === 'string' ? JSON.parse(rawAnswers) : rawAnswers;
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

    // Index uploaded files by fieldname for easy lookup
    const uploadedFilesByField = (req.files || []).reduce((acc, file) => {
      acc[file.fieldname] = file;
      return acc;
    }, {});

    // Process answers and calculate scores
    const processedAnswers = answers.map(raw => {
      const question = quiz.questions.id(raw.questionId);
      if (!question) return null;

      let isCorrect = false;
      let pointsEarned = 0;
      let feedback = '';
      let answerPayload = raw.answer;

      if (question.type === 'mcq') {
        const expected = (question.correctAnswer || '').trim();
        const given = typeof raw.answer === 'string' ? raw.answer.trim() : '';
        isCorrect = expected && given && expected === given;
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct!' : 'Incorrect.';
      } else if (question.type === 'multiple_choice') {
        // Compare sets of correct options
        const expectedOptions = (question.options || []).filter(o => o.isCorrect).map(o => (o.text || '').trim()).sort();
        const givenArray = Array.isArray(raw.answer) ? raw.answer.map(v => (v || '').trim()) : [];
        const givenSorted = [...new Set(givenArray)].sort();
        isCorrect = expectedOptions.length === givenSorted.length && expectedOptions.every((v, i) => v === givenSorted[i]);
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct!' : 'Incorrect.';
        // Normalize stored answer
        answerPayload = givenSorted;
      } else if (question.type === 'numerical') {
        const expected = Number(question.numericAnswer);
        const tolerance = Number(question.numericTolerance || 0);
        const given = Number(raw.answer);
        if (!Number.isNaN(given) && !Number.isNaN(expected)) {
          isCorrect = Math.abs(given - expected) <= tolerance;
        }
        pointsEarned = isCorrect ? question.points : 0;
        feedback = isCorrect ? 'Correct value.' : `Expected approximately ${expected} ± ${tolerance}.`;
        answerPayload = given;
      } else if (question.type === 'assignment') {
        // Expect a file field named assignment_<questionId>
        const fieldName = `assignment_${String(raw.questionId)}`;
        const file = uploadedFilesByField[fieldName];
        if (file) {
          // Upload to Cloudinary
          // Store Cloudinary URL in answer payload
          answerPayload = { fileName: file.originalname };
          // upload
          // Note: await sequentially to keep code simple
          // eslint-disable-next-line no-async-promise-executor
        }
        pointsEarned = 0;
        isCorrect = false;
        feedback = 'Assignment submitted for instructor review.';
      } else if (question.type === 'long_answer') {
        // Manual grading only
        pointsEarned = 0;
        isCorrect = false;
        feedback = 'Answer submitted. Instructor will review and grade.';
      }

      return {
        questionId: raw.questionId,
        answer: answerPayload,
        isCorrect,
        pointsEarned,
        feedback,
        timeSpent: raw.timeSpent || 0
      };
    }).filter(Boolean);

    // Upload assignment files to Cloudinary and enrich answers (do uploads after mapping to avoid mixing async in map)
    for (const ans of processedAnswers) {
      const q = quiz.questions.id(ans.questionId);
      if (q && q.type === 'assignment') {
        const fieldName = `assignment_${String(ans.questionId)}`;
        const file = uploadedFilesByField[fieldName];
        if (file) {
          const uploadRes = await CloudinaryService.uploadFile(file.buffer, file, 'smart-learning/assignments');
          ans.answer = {
            fileName: file.originalname,
            fileSize: file.size,
            cloudinaryId: uploadRes.cloudinaryId,
            fileUrl: uploadRes.cloudinaryUrl
          };
        }
      }
    }

    // Update attempt with answers and complete it
    attempt.answers = processedAnswers;
    attempt.completeAttempt();

    // Calculate totals and pass/fail against quiz passing score
    attempt.answers = processedAnswers;
    attempt.completeAttempt();
    // Manually recompute aggregate scoring
    const totalScore = processedAnswers.reduce((t, a) => t + (a.pointsEarned || 0), 0);
    attempt.totalScore = totalScore;
    attempt.percentage = Math.round((totalScore / (attempt.maxScore || 1)) * 100);
    attempt.passed = attempt.percentage >= (quiz.passingScore || 70);

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
            percentage: attempt.percentage,
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

// @route   GET api/quizzes/attempts/:attemptId
// @desc    Get a single attempt (instructor only)
// @access  Private (Instructor)
router.get('/attempts/:attemptId', auth, instructorOnly, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(attempt);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT api/quizzes/attempts/:attemptId/grade
// @desc    Grade answers for an attempt (long_answer/assignment) and finalize scores
// @access  Private (Instructor)
router.put('/attempts/:attemptId/grade', auth, instructorOnly, async (req, res) => {
  try {
    const { grades } = req.body; // [{questionId, pointsEarned, feedback}]
    const attempt = await QuizAttempt.findById(req.params.attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    if (quiz.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const gradeMap = new Map((grades || []).map(g => [String(g.questionId), g]));

    attempt.answers = attempt.answers.map(ans => {
      const g = gradeMap.get(String(ans.questionId));
      if (g && typeof g.pointsEarned === 'number') {
        ans.pointsEarned = g.pointsEarned;
        if (typeof g.feedback === 'string') ans.feedback = g.feedback;
      }
      return ans;
    });

    // Recompute totals and pass/fail
    const totalScore = attempt.answers.reduce((t, a) => t + (a.pointsEarned || 0), 0);
    attempt.totalScore = totalScore;
    attempt.percentage = Math.round((totalScore / (attempt.maxScore || 1)) * 100);
    attempt.passed = attempt.percentage >= (quiz.passingScore || 70);
    await attempt.save();

    // Update learning path learner quizResults (append a new record)
    await LearningPath.updateOne(
      {
        _id: attempt.learningPathId,
        'learners.learnerId': attempt.studentId
      },
      {
        $push: {
          'learners.$.quizResults': {
            stepId: attempt.stepId,
            quizId: attempt.quizId,
            bestScore: attempt.totalScore,
            attempts: attempt.attemptNumber,
            passed: attempt.passed,
            percentage: attempt.percentage,
            lastAttemptDate: new Date()
          }
        }
      }
    );

    res.json({
      message: 'Attempt graded successfully',
      score: attempt.totalScore,
      percentage: attempt.percentage,
      passed: attempt.passed
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
