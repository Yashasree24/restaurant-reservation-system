const mongoose = require('mongoose');
const { TIME_SLOTS, RESERVATION_STATUS } = require('../config/constants');

const reservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    date: { type: String, required: true }, // stored as 'YYYY-MM-DD' for simple, unambiguous matching
    timeSlot: { type: String, enum: TIME_SLOTS, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.CONFIRMED,
    },
  },
  { timestamps: true }
);

// Speeds up the conflict-check query (table + date + timeSlot + status).
// Not a hard unique constraint because a table can have many *cancelled*
// reservations for the same slot; the application layer enforces that only
// one *confirmed* reservation may hold a given table/date/slot at a time.
reservationSchema.index({ table: 1, date: 1, timeSlot: 1, status: 1 });
reservationSchema.index({ user: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
