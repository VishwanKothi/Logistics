const prisma = require('../config/database');

class ShipmentService {
  async createShipment(shipmentData) {
    const shipment_number = `SHIP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const shipment = await prisma.shipment.create({
      data: {
        shipment_number,
        order_id: shipmentData.order_id,
        items_count: shipmentData.items_count || 0,
        weight_kg: shipmentData.weight_kg || null,
        estimated_delivery_date: shipmentData.estimated_delivery_date ? new Date(shipmentData.estimated_delivery_date) : null,
        current_warehouse_id: shipmentData.origin_warehouse_id || null,
        driver_id: shipmentData.driver_id || null,
        status: 'PENDING_PICKUP',
      },
    });

    return shipment;
  }

  async getShipmentById(shipmentId) {
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id: shipmentId },
      include: {
        order: {
          select: {
            order_id: true, order_number: true,
            sender_name: true, sender_phone: true, sender_email: true,
            receiver_name: true, receiver_phone: true, receiver_email: true,
            pickup_address: true, pickup_city: true,
            delivery_address: true, delivery_city: true,
            origin_warehouse_id: true,
          },
        },
        driver: { select: { user_id: true, name: true, phone: true } },
        current_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        next_stop_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        deliveryProofs: true,
        statusHistory: { orderBy: { changed_at: 'desc' } },
      },
    });
    return shipment || null;
  }

  async getShipmentsByWarehouse(warehouseId, statusFilter) {
    const where = {};

    if (statusFilter === 'incoming') {
      // Shipments heading to this warehouse
      where.OR = [
        { current_warehouse_id: warehouseId, status: { in: ['ARRIVED_AT_WAREHOUSE'] } },
        { next_stop_warehouse_id: warehouseId, status: { in: ['IN_TRANSIT'] } },
      ];
    } else if (statusFilter === 'in_stock') {
      where.current_warehouse_id = warehouseId;
      where.status = { in: ['IN_WAREHOUSE', 'ROUTED'] };
    } else {
      // All warehouse-relevant shipments
      where.OR = [
        { current_warehouse_id: warehouseId },
        { next_stop_warehouse_id: warehouseId },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: { select: { order_number: true, sender_name: true, receiver_name: true, delivery_city: true } },
        driver: { select: { user_id: true, name: true, phone: true } },
        current_warehouse: { select: { name: true, city: true } },
        next_stop_warehouse: { select: { name: true, city: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return shipments;
  }

  async getActiveShipments(filters = {}) {
    const where = {};
    if (filters.warehouseId) {
      where.OR = [
        { current_warehouse_id: filters.warehouseId },
        { next_stop_warehouse_id: filters.warehouseId },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    } else {
      where.status = { in: ['PENDING_PICKUP', 'PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] };
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        order: { select: { order_number: true, sender_name: true, receiver_name: true, pickup_city: true, delivery_city: true } },
        driver: { select: { user_id: true, name: true, phone: true } },
        current_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        next_stop_warehouse: { select: { warehouse_id: true, name: true, city: true } },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit || 100,
    });
    return shipments;
  }

  async getPendingDeliveries(driverId) {
    const shipments = await prisma.shipment.findMany({
      where: {
        driver_id: driverId,
        status: { in: ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_WAREHOUSE'] },
      },
      include: {
        order: {
          select: {
            order_number: true, sender_name: true, sender_phone: true,
            receiver_name: true, receiver_phone: true,
            pickup_address: true, pickup_city: true,
            delivery_address: true, delivery_city: true,
          },
        },
        current_warehouse: { select: { name: true, city: true } },
        next_stop_warehouse: { select: { name: true, city: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    return shipments;
  }

  async updateShipmentStatus(shipmentId, newStatus, changeReason = null) {
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id: shipmentId },
      select: { status: true, current_warehouse_id: true },
    });

    if (!shipment) throw new Error('Shipment not found');

    await prisma.shipmentStatusHistory.create({
      data: { shipment_id: shipmentId, old_status: shipment.status, new_status: newStatus, change_reason: changeReason },
    });

    const updateData = { status: newStatus };
    if (newStatus === 'DELIVERED') {
      updateData.actual_delivery_date = new Date();
    }

    const updatedShipment = await prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: updateData,
    });
    return updatedShipment;
  }

  async routeShipment(shipmentId, nextStopWarehouseId, isFinalDelivery) {
    const updateData = {
      status: 'ROUTED',
      is_final_delivery: isFinalDelivery || false,
      next_stop_warehouse_id: isFinalDelivery ? null : nextStopWarehouseId,
    };

    // Record status change
    const shipment = await prisma.shipment.findUnique({ where: { shipment_id: shipmentId }, select: { status: true } });
    if (shipment) {
      await prisma.shipmentStatusHistory.create({
        data: { shipment_id: shipmentId, old_status: shipment.status, new_status: 'ROUTED' },
      });
    }

    const updated = await prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: updateData,
      include: {
        next_stop_warehouse: { select: { name: true, city: true } },
      },
    });
    return updated;
  }

  async assignDriver(shipmentId, driverId) {
    const shipment = await prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: { driver_id: driverId },
      include: {
        driver: { select: { user_id: true, name: true, phone: true } },
      },
    });
    return shipment;
  }

  async dispatchShipment(shipmentId, driverId, isFinalDelivery) {
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id: shipmentId },
      select: { status: true, current_warehouse_id: true, next_stop_warehouse_id: true },
    });
    if (!shipment) throw new Error('Shipment not found');

    const newStatus = isFinalDelivery ? 'OUT_FOR_DELIVERY' : 'IN_TRANSIT';

    await prisma.shipmentStatusHistory.create({
      data: { shipment_id: shipmentId, old_status: shipment.status, new_status: newStatus },
    });

    // Create handoff record
    if (shipment.current_warehouse_id && shipment.next_stop_warehouse_id) {
      await prisma.handoff.create({
        data: {
          shipment_id: shipmentId,
          from_warehouse_id: shipment.current_warehouse_id,
          to_warehouse_id: shipment.next_stop_warehouse_id,
        },
      });
    }

    const updated = await prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: {
        driver_id: driverId,
        status: newStatus,
        current_warehouse_id: null, // No longer at warehouse
      },
    });
    return updated;
  }

  async receiveAtWarehouse(shipmentId, warehouseId) {
    const shipment = await prisma.shipment.findUnique({
      where: { shipment_id: shipmentId },
      select: { status: true },
    });
    if (!shipment) throw new Error('Shipment not found');

    await prisma.shipmentStatusHistory.create({
      data: { shipment_id: shipmentId, old_status: shipment.status, new_status: 'IN_WAREHOUSE' },
    });

    const updated = await prisma.shipment.update({
      where: { shipment_id: shipmentId },
      data: {
        status: 'IN_WAREHOUSE',
        current_warehouse_id: warehouseId,
        next_stop_warehouse_id: null,
        is_final_delivery: false,
        driver_id: null, // Unassign driver after delivery to warehouse
      },
    });
    return updated;
  }

  async getShipmentsByOrder(orderId) {
    return prisma.shipment.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: 'desc' },
    });
  }
}

module.exports = new ShipmentService();
