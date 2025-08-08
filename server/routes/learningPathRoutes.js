const express = require('express');
const router = express.Router();
const LearningPath = require('../models/LearningPath');
const { auth, instructorOnly } = require('../middleware/auth');

// @route   POST api/learning-paths
// @desc    Create a learning path (instructor only)
// @access  Private (Instructor)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, skills } = req.body;
    const path = await LearningPath.create({ title, description, skills, createdBy: req.user.id });
    res.status(201).json(path);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET api/learning-paths
// @desc    Get all learning paths
// @access  Public
router.get('/', async (req, res) => {
  try {
    const paths = await LearningPath.find().populate('skills').populate('createdBy', 'name email');
    res.json(paths);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// I recommend adding the following routes for full functionality:

// @route   GET api/learning-paths/:id
// @desc    Get a single learning path
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id).populate('skills').populate('createdBy', 'name email');
    if (!path) return res.status(404).json({ error: 'Learning path not found' });
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
    const { title, description, skills } = req.body;
    let path = await LearningPath.findById(req.params.id);
    if (!path) return res.status(404).json({ error: 'Learning path not found' });

    // Authorization check: only the creator can update
    if (path.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized' });
    }

    path = await LearningPath.findByIdAndUpdate(req.params.id, { title, description, skills }, { new: true });
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
    if (!path) return res.status(404).json({ error: 'Learning path not found' });

    if (path.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized' });
    }

    await LearningPath.findByIdAndDelete(req.params.id);
    res.json({ message: 'Learning path removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
