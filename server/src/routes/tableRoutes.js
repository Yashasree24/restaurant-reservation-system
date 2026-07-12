const express = require('express');
const { getTables } = require('../controllers/tableController');
const { protect } = require('../middleware/auth');
const { TIME_SLOTS } = require('../config/constants');

const router = express.Router();

router.get('/', protect, getTables);
router.get('/time-slots', protect, (req, res) => {
  res.status(200).json({ timeSlots: TIME_SLOTS });
});

module.exports = router;
