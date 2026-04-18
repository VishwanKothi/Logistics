const express = require('express');
const prisma = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all warehouses (for customers to pick origin warehouse)
router.get('/', async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      select: { warehouse_id: true, name: true, city: true, state: true, location: true },
      orderBy: { city: 'asc' },
    });
    res.status(200).json(warehouses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get warehouse by ID
router.get('/:warehouseId', async (req, res) => {
  try {
    const warehouseId = parseInt(req.params.warehouseId, 10);
    const warehouse = await prisma.warehouse.findUnique({
      where: { warehouse_id: warehouseId },
      include: {
        users: { select: { user_id: true, name: true, role: true, phone: true } },
      },
    });
    if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drivers at a specific warehouse
router.get('/:warehouseId/drivers', authMiddleware, async (req, res) => {
  try {
    const warehouseId = parseInt(req.params.warehouseId, 10);
    const drivers = await prisma.user.findMany({
      where: { warehouse_id: warehouseId, role: 'DRIVER', is_active: true },
      select: { user_id: true, name: true, phone: true },
    });
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
