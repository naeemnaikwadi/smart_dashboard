// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you want DB operations

// Test route
router.get('/', (req, res) => {
  res.json({ message: '✅ Users route is active' });
});

module.exports = router;
