const orderService = require('../services/orderService');

class OrderController {
  async createOrder(req, res) {
    try {
      const user = req.user;
      const orderData = {
        ...req.body,
        user_id: user.user_id,
        origin_warehouse_id: parseInt(req.body.origin_warehouse_id, 10),
      };

      // Auto-fill sender info for customers
      if (user.role === 'CUSTOMER') {
        orderData.sender_name = orderData.sender_name || user.name;
        orderData.sender_email = orderData.sender_email || user.email;
        orderData.sender_phone = orderData.sender_phone || user.phone;
      }

      const order = await orderService.createOrder(orderData);
      res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrderById(req, res) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

      const order = await orderService.getOrderById(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });

      // Customer can only see their own orders
      if (req.user.role === 'CUSTOMER' && order.user_id !== req.user.user_id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.status(200).json(order);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOrders(req, res) {
    try {
      const user = req.user;
      const filters = {
        status: req.query.status || undefined,
        limit: parseInt(req.query.limit, 10) || 100,
        offset: parseInt(req.query.offset, 10) || 0,
      };

      // Role-based filtering
      if (user.role === 'CUSTOMER') {
        filters.user_id = user.user_id; // Customers see only their own orders
      } else if (user.role === 'MANAGER') {
        filters.origin_warehouse_id = user.warehouse_id; // Managers see their warehouse orders
      }
      // ADMIN sees all orders (no filter)

      const orders = await orderService.getAllOrders(filters);
      res.status(200).json(orders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrder(req, res) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

      const order = await orderService.updateOrder(orderId, req.body);
      res.status(200).json({ message: 'Order updated successfully', order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

      const { status } = req.body;
      const order = await orderService.updateOrderStatus(orderId, status);
      res.status(200).json({ message: 'Order status updated', order });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new OrderController();
