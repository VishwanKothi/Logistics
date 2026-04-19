const prisma = require('../config/database');

class ShipmentService {
  async createShipment(shipmentData) {
    const shipment_number = `SHIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Fetch order details for items and weight
    const order = await prisma.order.findUnique({ where: { order_id: shipmentData.order_id } });

    const shipment = await prisma.shipment.create({
      data: {
        shipment_number,
        order_id: shipmentData.order_id,
        items_count: order.items_count || 1,
        weight_kg: order.weight_kg || null,
        estimated_delivery_date: shipmentData.estimated_delivery_date ? new Date(shipmentData.estimated_delivery_date) : null,
        origin_warehouse_id: shipmentData.origin_warehouse_id,
        dest_warehouse_id: shipmentData.dest_warehouse_id,
        status: 'ROUTED',
      },
    });
    
    await this.recordStatusChange(shipment.shipment_id, 'PENDING_ROUTING', 'ROUTED', 'Routed at creation');
    return shipment;
  }

  async getShipmentById(shipmentId) {
    return prisma.shipment.findUnique({
      where: { shipment_id: shipmentId },
      include: {
        order: { select: { order_number: true, sender_name: true, sender_phone: true, pickup_address: true, pickup_city: true, receiver_name: true, receiver_phone: true, delivery_address: true, delivery_city: true } },
        origin_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        dest_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        pickup_driver: { select: { user_id: true, name: true, phone: true } },
        heavy_driver: { select: { user_id: true, name: true, phone: true } },
        delivery_driver: { select: { user_id: true, name: true, phone: true } },
        deliveryProofs: true,
        statusHistory: { orderBy: { changed_at: 'desc' } },
      },
    });
  }

  async getShipmentsByWarehouse(warehouseId) {
    return prisma.shipment.findMany({
      where: {
        OR: [
          { origin_warehouse_id: warehouseId },
          { dest_warehouse_id: warehouseId }
        ]
      },
      include: {
        order: { select: { order_number: true, sender_name: true, receiver_name: true, delivery_city: true } },
        origin_warehouse: { select: { name: true, city: true } },
        dest_warehouse: { select: { name: true, city: true } },
        pickup_driver: { select: { name: true } },
        heavy_driver: { select: { name: true } },
        delivery_driver: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getActiveShipments(filters = {}) {
    const where = {};
    if (filters.warehouseId) {
      where.OR = [
        { origin_warehouse_id: filters.warehouseId },
        { dest_warehouse_id: filters.warehouseId }
      ];
    }
    if (filters.userId) {
      where.order = { user_id: filters.userId };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    return prisma.shipment.findMany({
      where,
      include: {
        order: { select: { order_number: true, sender_name: true, receiver_name: true, pickup_city: true, delivery_city: true } },
        origin_warehouse: { select: { name: true, city: true } },
        dest_warehouse: { select: { name: true, city: true } },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit || 100,
    });
  }

  async getDriverDeliveries(driverId) {
    return prisma.shipment.findMany({
      where: {
        OR: [
          { pickup_driver_id: driverId, status: { in: ['PICKUP_ASSIGNED', 'PICKED_UP'] } },
          { heavy_driver_id: driverId, status: { in: ['TRANSIT_ASSIGNED', 'IN_TRANSIT'] } },
          { delivery_driver_id: driverId, status: { in: ['DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY'] } },
        ]
      },
      include: {
        order: { select: { order_number: true, sender_name: true, pickup_address: true, pickup_city: true, receiver_name: true, delivery_address: true, delivery_city: true } },
        origin_warehouse: { select: { name: true, city: true } },
        dest_warehouse: { select: { name: true, city: true } },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  async recordStatusChange(shipmentId, oldStatus, newStatus, reason = null) {
    await prisma.shipmentStatusHistory.create({
      data: { shipment_id: shipmentId, old_status: oldStatus, new_status: newStatus, change_reason: reason }
    });
  }

  async updateShipmentStatus(shipmentId, newStatus) {
    const shipment = await prisma.shipment.findUnique({ where: { shipment_id: shipmentId }, select: { status: true } });
    if (!shipment) throw new Error('Shipment not found');

    await this.recordStatusChange(shipmentId, shipment.status, newStatus);
    const data = { status: newStatus };
    if (newStatus === 'DELIVERED') data.actual_delivery_date = new Date();
    
    return prisma.shipment.update({ where: { shipment_id: shipmentId }, data });
  }

  async routeShipment(shipmentId, destWarehouseId) {
    const shipment = await prisma.shipment.findUnique({ where: { shipment_id: shipmentId } });
    await this.recordStatusChange(shipmentId, shipment.status, 'ROUTED');
    return prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: { status: 'ROUTED', dest_warehouse_id: destWarehouseId }
    });
  }

  async assignDriver(shipmentId, driverType, driverId) {
    const shipment = await prisma.shipment.findUnique({ where: { shipment_id: shipmentId } });
    const data = {};
    let newStatus = shipment.status;

    if (driverType === 'pickup') {
      data.pickup_driver_id = driverId;
      newStatus = 'PICKUP_ASSIGNED';
    } else if (driverType === 'heavy') {
      data.heavy_driver_id = driverId;
      newStatus = 'TRANSIT_ASSIGNED';
    } else if (driverType === 'delivery') {
      data.delivery_driver_id = driverId;
      newStatus = 'DELIVERY_ASSIGNED';
    }

    if (newStatus !== shipment.status) {
      await this.recordStatusChange(shipmentId, shipment.status, newStatus);
      data.status = newStatus;
    }

    return prisma.shipment.update({ where: { shipment_id: shipmentId }, data });
  }

  async getShipmentsByOrder(orderId) {
    return prisma.shipment.findMany({ where: { order_id: orderId }, orderBy: { created_at: 'desc' } });
  }
}

module.exports = new ShipmentService();
