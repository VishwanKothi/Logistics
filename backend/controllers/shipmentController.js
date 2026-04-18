const shipmentService = require('../services/shipmentService');

// Status transitions allowed per role
const ROLE_STATUS_MAP = {
  DRIVER: ['PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'],
  WAREHOUSE_STAFF: ['IN_WAREHOUSE'],
  MANAGER: ['PENDING_PICKUP', 'PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'],
  ADMIN: ['PENDING_PICKUP', 'PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'],
};

class ShipmentController {
  async createShipment(req, res) {
    try {
      const shipmentData = {
        order_id: parseInt(req.body.order_id, 10),
        items_count: parseInt(req.body.items_count, 10) || 0,
        weight_kg: parseFloat(req.body.weight_kg) || null,
        estimated_delivery_date: req.body.estimated_delivery_date || null,
        origin_warehouse_id: req.user.warehouse_id, // Set to manager's warehouse
        driver_id: req.body.driver_id ? parseInt(req.body.driver_id, 10) : null,
      };

      const shipment = await shipmentService.createShipment(shipmentData);
      res.status(201).json({ message: 'Shipment created successfully', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentById(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

      const shipment = await shipmentService.getShipmentById(shipmentId);
      if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

      res.status(200).json(shipment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentsByOrder(req, res) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

      const shipments = await shipmentService.getShipmentsByOrder(orderId);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getActiveShipments(req, res) {
    try {
      const user = req.user;
      const filters = {};

      // Role-based filtering
      if (user.role === 'MANAGER' || user.role === 'WAREHOUSE_STAFF') {
        filters.warehouseId = user.warehouse_id;
      }

      const shipments = await shipmentService.getActiveShipments(filters);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWarehouseShipments(req, res) {
    try {
      const user = req.user;
      const warehouseId = user.warehouse_id;
      const statusFilter = req.query.filter; // 'incoming', 'in_stock', or undefined for all

      if (!warehouseId) return res.status(400).json({ error: 'User not assigned to a warehouse' });

      const shipments = await shipmentService.getShipmentsByWarehouse(warehouseId, statusFilter);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipmentStatus(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

      const { newStatus, changeReason } = req.body;
      const userRole = req.user.role;

      // Validate role can set this status
      const allowed = ROLE_STATUS_MAP[userRole] || [];
      if (!allowed.includes(newStatus)) {
        return res.status(403).json({ error: `Role ${userRole} cannot set status to ${newStatus}` });
      }

      const shipment = await shipmentService.updateShipmentStatus(shipmentId, newStatus, changeReason);
      res.status(200).json({ message: 'Shipment status updated', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async routeShipment(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

      const { next_stop_warehouse_id, is_final_delivery } = req.body;

      const shipment = await shipmentService.routeShipment(
        shipmentId,
        next_stop_warehouse_id ? parseInt(next_stop_warehouse_id, 10) : null,
        is_final_delivery
      );
      res.status(200).json({ message: 'Shipment routed successfully', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async dispatchShipment(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      const driverId = parseInt(req.body.driver_id, 10);
      const isFinalDelivery = req.body.is_final_delivery || false;

      if (isNaN(shipmentId) || isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid shipment or driver ID' });
      }

      const shipment = await shipmentService.dispatchShipment(shipmentId, driverId, isFinalDelivery);
      res.status(200).json({ message: 'Shipment dispatched', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async receiveAtWarehouse(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

      const warehouseId = req.user.warehouse_id;
      if (!warehouseId) return res.status(400).json({ error: 'User not assigned to a warehouse' });

      const shipment = await shipmentService.receiveAtWarehouse(shipmentId, warehouseId);
      res.status(200).json({ message: 'Shipment received at warehouse', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async assignDriver(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      const driverId = parseInt(req.body.driverId || req.body.driver_id, 10);

      if (isNaN(shipmentId) || isNaN(driverId)) {
        return res.status(400).json({ error: 'Invalid shipment or driver ID' });
      }

      const shipment = await shipmentService.assignDriver(shipmentId, driverId);
      res.status(200).json({ message: 'Driver assigned successfully', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDriverDeliveries(req, res) {
    try {
      const driverId = req.user.user_id;
      const shipments = await shipmentService.getPendingDeliveries(driverId);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShipmentController();
