const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const { auth, instructorOnly } = require('../middleware/auth');

// Get all skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create skill (instructor only)
router.post('/', auth, instructorOnly, async (req, res) => {
  try {
    const { title, description, resources } = req.body;
    const skill = await Skill.create({ title, description, resources, createdBy: req.user.id });
    res.status(201).json(skill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get skill by ID
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update skill (instructor only)
router.put('/:id', auth, instructorOnly, async (req, res) => {
  try {
    let skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    // Ensure the instructor owns the skill
    if (skill.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to update this skill' });
    }

    skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(skill);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete skill (instructor only)
router.delete('/:id', auth, instructorOnly, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    if (skill.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'User not authorized to delete this skill' });
    }

    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;