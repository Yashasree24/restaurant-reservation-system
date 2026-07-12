const Table = require('../models/Table');
const { ApiError } = require('../middleware/errorHandler');
const { isPositiveInteger } = require('../utils/validators');

// GET /api/tables  (any authenticated user - customers need this to know capacities)
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.status(200).json({ tables });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/tables
const createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity } = req.body;
    if (!isPositiveInteger(tableNumber) || !isPositiveInteger(capacity)) {
      throw new ApiError(400, 'tableNumber and capacity must be positive integers');
    }
    const table = await Table.create({ tableNumber, capacity });
    res.status(201).json({ table });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/tables/:id
const updateTable = async (req, res, next) => {
  try {
    const { capacity, isActive } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');

    if (capacity !== undefined) {
      if (!isPositiveInteger(capacity)) {
        throw new ApiError(400, 'capacity must be a positive integer');
      }
      table.capacity = capacity;
    }
    if (isActive !== undefined) table.isActive = Boolean(isActive);

    await table.save();
    res.status(200).json({ table });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/tables/:id
const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) throw new ApiError(404, 'Table not found');
    await table.deleteOne();
    res.status(200).json({ message: 'Table deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTables, createTable, updateTable, deleteTable };
