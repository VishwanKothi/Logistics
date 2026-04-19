const shipmentService = require('../services/shipmentService');

class ShipmentController {
  async createShipment(req, res) {
    try {
      const shipmentData = {
        order_id: parseInt(req.body.order_id, 10),
        estimated_delivery_date: req.body.estimated_delivery_date || null,
        origin_warehouse_id: req.user.warehouse_id, // Manager's warehouse
        dest_warehouse_id: req.body.dest_warehouse_id ? parseInt(req.body.dest_warehouse_id, 10) : null, // The routed destination
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
      if (user.role === 'MANAGER' || user.role === 'WAREHOUSE_STAFF') {
        filters.warehouseId = user.warehouse_id;
      } else if (user.role === 'CUSTOMER') {
        filters.userId = user.user_id;
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
      if (!warehouseId) return res.status(400).json({ error: 'User not assigned to a warehouse' });
      const shipments = await shipmentService.getShipmentsByWarehouse(warehouseId);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDriverDeliveries(req, res) {
    try {
      const driverId = req.user.user_id;
      const shipments = await shipmentService.getDriverDeliveries(driverId);
      res.status(200).json(shipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateShipmentStatus(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });
      const { newStatus } = req.body;
      
      const role = req.user.role;
      const driverOnlyStatuses = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'];
      if (role === 'WAREHOUSE_STAFF' && driverOnlyStatuses.includes(newStatus)) {
        return res.status(403).json({ error: 'Insufficient permissions for this status' });
      }
      if (role === 'CUSTOMER') {
        return res.status(403).json({ error: 'Customers cannot update shipment status' });
      }

      const shipment = await shipmentService.updateShipmentStatus(shipmentId, newStatus);
      res.status(200).json({ message: 'Shipment status updated', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async routeShipment(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });
      const destWarehouseId = parseInt(req.body.dest_warehouse_id, 10);
      if (!destWarehouseId) return res.status(400).json({ error: 'Destination warehouse is required' });
      
      const shipment = await shipmentService.routeShipment(shipmentId, destWarehouseId);
      res.status(200).json({ message: 'Shipment routed successfully', shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async assignDriver(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });
      const driverId = parseInt(req.body.driver_id, 10);
      const driverType = req.body.driver_type; // 'pickup', 'heavy', 'delivery'

      if (!['pickup', 'heavy', 'delivery'].includes(driverType)) {
        return res.status(400).json({ error: 'Invalid driver type' });
      }

      const shipment = await shipmentService.assignDriver(shipmentId, driverType, driverId);
      res.status(200).json({ message: `Assigned ${driverType} driver`, shipment });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ShipmentController();
