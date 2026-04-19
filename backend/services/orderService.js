const prisma = require('../config/database');

class OrderService {
  async createOrder(orderData) {
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        order_number,
        user_id: orderData.user_id,
        sender_name: orderData.sender_name,
        sender_email: orderData.sender_email,
        sender_phone: orderData.sender_phone,
        pickup_address: orderData.pickup_address,
        pickup_city: orderData.pickup_city,
        pickup_state: orderData.pickup_state,
        receiver_name: orderData.receiver_name,
        receiver_email: orderData.receiver_email || null,
        receiver_phone: orderData.receiver_phone,
        delivery_address: orderData.delivery_address,
        delivery_city: orderData.delivery_city,
        delivery_state: orderData.delivery_state,
        items_count: orderData.items_count,
        weight_kg: orderData.weight_kg,
        origin_warehouse_id: orderData.origin_warehouse_id,
        notes: orderData.notes,
        status: 'PLACED',
      },
      include: {
        origin_warehouse: { select: { name: true, city: true } },
      },
    });

    return order;
  }

  async getOrderById(orderId) {
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      include: {
        user: { select: { user_id: true, name: true, email: true, role: true } },
        origin_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        shipments: {
          select: { shipment_id: true, shipment_number: true, status: true, estimated_delivery_date: true },
        },
      },
    });
    return order || null;
  }

  async getAllOrders(filters = {}) {
    const where = {};

    if (filters.status) where.status = filters.status;
    if (filters.user_id) where.user_id = filters.user_id;
    if (filters.origin_warehouse_id) where.origin_warehouse_id = filters.origin_warehouse_id;

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { user_id: true, name: true, email: true } },
        origin_warehouse: { select: { warehouse_id: true, name: true, city: true } },
        shipments: {
          select: { shipment_id: true, shipment_number: true, status: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });

    return orders;
  }

  async updateOrderStatus(orderId, newStatus) {
    const order = await prisma.order.findUnique({
      where: { order_id: orderId },
      select: { status: true },
    });

    if (!order) throw new Error('Order not found');

    await prisma.orderStatusHistory.create({
      data: { order_id: orderId, old_status: order.status, new_status: newStatus },
    });

    const updatedOrder = await prisma.order.update({
      where: { order_id: orderId },
      data: { status: newStatus },
    });

    return updatedOrder;
  }

  async updateOrder(orderId, updateData) {
    const data = {};
    const fields = ['sender_name', 'sender_email', 'sender_phone', 'receiver_name', 'receiver_email', 'receiver_phone',
      'pickup_address', 'pickup_city', 'pickup_state', 'delivery_address', 'delivery_city', 'delivery_state', 'notes', 'status'];
    for (const f of fields) {
      if (updateData[f] !== undefined) data[f] = updateData[f];
    }
    const order = await prisma.order.update({ where: { order_id: orderId }, data });
    return order;
  }
}

module.exports = new OrderService();
