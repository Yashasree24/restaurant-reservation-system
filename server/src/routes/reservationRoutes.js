const express = require('express');
const {
  createReservation,
  getMyReservations,
  cancelMyReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // all reservation routes require authentication

router.post('/', createReservation);
router.get('/mine', getMyReservations);
router.delete('/:id', cancelMyReservation);

module.exports = router;
