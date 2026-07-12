const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { ApiError } = require('../middleware/errorHandler');
const { RESERVATION_STATUS } = require('../config/constants');
const {
  isValidDateString,
  isValidTimeSlot,
  isPositiveInteger,
} = require('../utils/validators');
const { isTableFree } = require('./reservationController');

// GET /api/admin/reservations?date=YYYY-MM-DD&status=confirmed
const getAllReservations = async (req, res, next) => {
  try {
    const { date, status } = req.query;
    const filter = {};

    if (date) {
      if (!isValidDateString(date)) {
        throw new ApiError(400, 'date must be in YYYY-MM-DD format');
      }
      filter.date = date;
    }
    if (status) {
      if (!Object.values(RESERVATION_STATUS).includes(status)) {
        throw new ApiError(400, 'invalid status filter');
      }
      filter.status = status;
    }

    const reservations = await Reservation.find(filter)
      .populate('table', 'tableNumber capacity')
      .populate('user', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    res.status(200).json({ reservations });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/reservations/:id
// Admin can update date/timeSlot/table/guests/status of any reservation.
// Any change that could create a conflict is re-validated against availability.
const updateReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }

    const { date, timeSlot, tableId, guests, status } = req.body;

    const nextDate = date ?? reservation.date;
    const nextTimeSlot = timeSlot ?? reservation.timeSlot;
    const nextGuests = guests ?? reservation.guests;
    let nextTableId = tableId ?? reservation.table.toString();

    if (date && !isValidDateString(date)) {
      throw new ApiError(400, 'date must be in YYYY-MM-DD format');
    }
    if (timeSlot && !isValidTimeSlot(timeSlot)) {
      throw new ApiError(400, 'invalid timeSlot');
    }
    if (guests !== undefined && !isPositiveInteger(guests)) {
      throw new ApiError(400, 'guests must be a positive integer');
    }
    if (status && !Object.values(RESERVATION_STATUS).includes(status)) {
      throw new ApiError(400, 'invalid status');
    }

    const isRescheduling = date || timeSlot || tableId || guests !== undefined;

    if (isRescheduling && (status ?? reservation.status) === RESERVATION_STATUS.CONFIRMED) {
      const table = await Table.findById(nextTableId);
      if (!table || !table.isActive) {
        throw new ApiError(400, 'Selected table does not exist or is inactive');
      }
      if (table.capacity < nextGuests) {
        throw new ApiError(400, 'Selected table capacity is less than the number of guests');
      }
      const free = await isTableFree(nextTableId, nextDate, nextTimeSlot, reservation._id);
      if (!free) {
        throw new ApiError(409, 'Selected table is already booked for that date and time slot');
      }
    }

    reservation.date = nextDate;
    reservation.timeSlot = nextTimeSlot;
    reservation.guests = nextGuests;
    reservation.table = nextTableId;
    if (status) reservation.status = status;

    await reservation.save();
    const populated = await reservation.populate([
      { path: 'table', select: 'tableNumber capacity' },
      { path: 'user', select: 'name email' },
    ]);

    res.status(200).json({ reservation: populated });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/reservations/:id  (admin cancels any reservation)
const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw new ApiError(404, 'Reservation not found');
    }
    reservation.status = RESERVATION_STATUS.CANCELLED;
    await reservation.save();
    res.status(200).json({ reservation });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllReservations, updateReservation, cancelReservation };
