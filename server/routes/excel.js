const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const multer = require('multer');
const xlsx = require('exceljs');
const { auth } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

// Excel upload and parse
router.post('/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'instructor') return res.status(403).json({ error: 'Forbidden' });
    const workbook = new xlsx.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.worksheets[0];
    const skills = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const [title, description, resourceType, resourceTitle, resourceUrl] = row.values.slice(1);
      skills.push({
        title,
        description,
        resources: [{ type: resourceType, title: resourceTitle, url: resourceUrl }],
        createdBy: req.user.id
      });
    });
    const created = await Skill.insertMany(skills);
    res.json({ message: 'Skills imported successfully', count: created.length });
  } catch (err) {
    console.error('Excel import error:', err.message);
    res.status(500).json({ error: 'Failed to import skills from Excel file.' });
  }
});

module.exports = router;