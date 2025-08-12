const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { auth } = require('../middleware/auth');

// GET /api/progress/student - Get progress for the logged-in student
router.get('/student', auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const progress = await Progress.find({ learnerId: studentId })
      .populate('learningPathId', 'name description')
      .populate('topicId', 'name description')
      .sort({ lastAccessed: -1 });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/student/:learningPathId - Get progress for a specific learning path
router.get('/student/:learningPathId', auth, async (req, res) => {
  try {
    const { learningPathId } = req.params;
    const studentId = req.user.id;
    
    const progress = await Progress.findOne({ 
      learnerId: studentId, 
      learningPathId: learningPathId 
    }).populate('learningPathId', 'name description');

    if (!progress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error fetching learning path progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/progress/update - Update or create progress
router.post('/update', auth, async (req, res) => {
  try {
    const { learningPathId, topicId, overallProgress, timeSpent } = req.body;
    const studentId = req.user.id;

    let progress = await Progress.findOne({ 
      learnerId: studentId, 
      learningPathId: learningPathId 
    });

    if (progress) {
      // Update existing progress
      progress.overallProgress = overallProgress || progress.overallProgress;
      progress.timeSpent = timeSpent || progress.timeSpent;
      progress.lastAccessed = new Date();
      
      if (topicId) {
        progress.currentTopic = {
          topicId,
          progress: overallProgress || 0,
          startTime: progress.currentTopic?.startTime || new Date()
        };
      }
    } else {
      // Create new progress
      progress = new Progress({
        learnerId: studentId,
        learningPathId,
        topicId,
        overallProgress: overallProgress || 0,
        timeSpent: timeSpent || 0,
        lastAccessed: new Date()
      });
    }

    await progress.save();
    res.json(progress);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
