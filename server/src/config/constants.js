// Fixed, non-overlapping time slots the restaurant operates.
// Using discrete slots (instead of free-form start/end times) keeps the
// double-booking check simple and reliable: two reservations conflict only
// if they share the same table, date, and slot.
const TIME_SLOTS = [
  '12:00-13:30',
  '13:30-15:00',
  '19:00-20:30',
  '20:30-22:00',
  '22:00-23:30',
];

const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

module.exports = { TIME_SLOTS, RESERVATION_STATUS, ROLES };
