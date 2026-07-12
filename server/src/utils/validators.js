const { TIME_SLOTS } = require('../config/constants');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const isPastDate = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return target < today;
};

const isValidTimeSlot = (value) => TIME_SLOTS.includes(value);

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

module.exports = {
  isValidDateString,
  isPastDate,
  isValidTimeSlot,
  isPositiveInteger,
};
