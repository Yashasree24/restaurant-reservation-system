const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getAllReservations,
  updateReservation,
  cancelReservation,
} = require('../controllers/adminController');
const {
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN)); // every route below requires an admin

router.get('/reservations', getAllReservations);
router.patch('/reservations/:id', updateReservation);
router.delete('/reservations/:id', cancelReservation);

router.post('/tables', createTable);
router.patch('/tables/:id', updateTable);
router.delete('/tables/:id', deleteTable);

module.exports = router;
