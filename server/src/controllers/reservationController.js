const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { ApiError } = require('../middleware/errorHandler');
const { RESERVATION_STATUS } = require('../config/constants');
const {
  isValidDateString,
  isPastDate,
  isValidTimeSlot,
  isPositiveInteger,
} = require('../utils/validators');

/**
 * Core availability logic.
 * Finds an active table whose capacity can fit `guests` and which has no
 * CONFIRMED reservation for the same date + timeSlot. Prefers the smallest
 * sufficient table so larger tables stay free for bigger parties.
 *
 * excludeReservationId is used when re-checking availability during an update
 * (so a reservation doesn't conflict with itself).
 */
const findAvailableTable = async (date, timeSlot, guests, excludeReservationId = null) => {
  const candidateTables = await Table.find({
    isActive: true,
    capacity: { $gte: guests },
  }).sort({ capacity: 1 });

  if (candidateTables.length === 0) return null;

  const conflictQuery = {
    date,
    timeSlot,
    status: RESERVATION_STATUS.CONFIRMED,
    table: { $in: candidateTables.map((t) => t._id) },
  };
  if (excludeReservationId) {
    conflictQuery._id = { $ne: excludeReservationId };
  }

  const conflictingReservations = await Reservation.find(conflictQuery).select('table');
  const bookedTableIds = new Set(conflictingReservations.map((r) => r.table.toString()));

  return candidateTables.find((t) => !bookedTableIds.has(t._id.toString())) || null;
};

/**
 * Checks whether a *specific* table is free for a given date/timeSlot.
 * Used by admins when manually assigning/updating a table.
 */
const isTableFree = async (tableId, date, timeSlot, excludeReservationId = null) => {
  const query = { table: tableId, date, timeSlot, status: RESERVATION_STATUS.CONFIRMED };
  if (excludeReservationId) query._id = { $ne: excludeReservationId };
  const conflict = await Reservation.findOne(query);
  return !conflict;
};

const validateReservationInput = ({ date, timeSlot, guests }) => {
  if (!date || !timeSlot || guests === undefined) {
    throw new ApiError(400, 'date, timeSlot, and guests are required');
  }
  if (!isValidDateString(date)) {
    throw new ApiError(400, 'date must be a valid string in YYYY-MM-DD format');
  }
  if (isPastDate(date)) {
    throw new ApiError(400, 'date cannot be in the past');
  }
  if (!isValidTimeSlot(timeSlot)) {
    throw new ApiError(400, 'timeSlot is not a valid slot');
  }
  if (!isPositiveInteger(guests)) {
    throw new ApiError(400, 'guests must be a positive integer');
  }
};

// POST /api/reservations
const createReservation = async (req, res, next) => {
  try {
    const { date, timeSlot, guests } = req.body;
    validateReservationInput({ date, timeSlot, guests });

    const table = await findAvailableTable(date, timeSlot, guests);
    if (!table) {
      throw new ApiError(
        409,
        'No table is available for the requested date, time slot, and party size'
      );
    }

    const reservation = await Reservation.create({
      user: req.user._id,
      table: table._id,
      date,
      timeSlot,
      guests,
      status: RESERVATION_STATUS.CONFIRMED,
    });

    const populated = await reservation.populate('table', 'tableNumber capacity');
    res.status(201).json({ reservation: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/reservations/mine
const getMyReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('table', 'tableNumber capacity')
      .sort({ date: 1, timeSlot: 1 });
    res.status(200).json({ reservations });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/reservations/:id  (customer cancels their own reservation)
const cancelMyReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }
    if (reservation.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only cancel your own reservations');
    }
    if (reservation.status === RESERVATION_STATUS.CANCELLED) {
      throw new ApiError(400, 'Reservation is already cancelled');
    }

    reservation.status = RESERVATION_STATUS.CANCELLED;
    await reservation.save();

    res.status(200).json({ reservation });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReservation,
  getMyReservations,
  cancelMyReservation,
  findAvailableTable,
  isTableFree,
  validateReservationInput,
};
