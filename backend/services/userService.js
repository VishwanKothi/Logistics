const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

class UserService {
  async createUser(userData) {
    const { name, email, phone, password, role = 'CUSTOMER' } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phone, password_hash: hashedPassword, role, is_active: true },
      select: { user_id: true, name: true, email: true, phone: true, role: true, warehouse_id: true, is_active: true, created_at: true },
    });
    return user;
  }

  async authenticateUser(email, password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { warehouse: { select: { warehouse_id: true, name: true, city: true } } },
    });

    if (!user || !user.is_active) throw new Error('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) throw new Error('Invalid password');

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, role: user.role, warehouse_id: user.warehouse_id },
      config.JWT_SECRET,
      { expiresIn: config.JWT_EXPIRY }
    );

    return {
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        warehouse_id: user.warehouse_id,
        warehouse: user.warehouse,
      },
    };
  }

  async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, name: true, email: true, phone: true, role: true, warehouse_id: true, is_active: true, created_at: true },
    });
    return user || null;
  }

  async getUsersByRole(role) {
    return prisma.user.findMany({
      where: { role, is_active: true },
      select: { user_id: true, name: true, email: true, phone: true, role: true, warehouse_id: true },
    });
  }

  async getDriversByWarehouse(warehouseId) {
    return prisma.user.findMany({
      where: { role: 'DRIVER', warehouse_id: warehouseId, is_active: true },
      select: { user_id: true, name: true, phone: true },
    });
  }

  async updateUser(userId, updateData) {
    const { name, email, phone, role } = updateData;
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(role && { role }),
      },
      select: { user_id: true, name: true, email: true, phone: true, role: true, warehouse_id: true, is_active: true, updated_at: true },
    });
    return user;
  }

  async deactivateUser(userId) {
    return prisma.user.update({
      where: { user_id: userId },
      data: { is_active: false },
      select: { user_id: true, name: true, email: true, is_active: true },
    });
  }
}

module.exports = new UserService();
