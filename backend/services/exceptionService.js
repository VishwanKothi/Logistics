const prisma = require('../config/database');

class ExceptionService {
  async createException(exceptionData) {
    const exception = await prisma.exceptionReport.create({
      data: {
        shipment_id: exceptionData.shipment_id,
        exception_type: exceptionData.exception_type,
        description: exceptionData.description,
        severity: exceptionData.severity,
        reported_by_id: exceptionData.reported_by_id,
      },
      include: {
        shipment: { select: { shipment_number: true } },
        reportedBy: { select: { name: true } },
      },
    });
    return exception;
  }

  async getExceptionById(exceptionId) {
    const exception = await prisma.exceptionReport.findUnique({
      where: { exception_id: exceptionId },
      include: {
        shipment: { select: { shipment_number: true, order_id: true } },
        reportedBy: { select: { user_id: true, name: true } },
      },
    });
    return exception || null;
  }

  async getExceptionsByShipment(shipmentId) {
    return prisma.exceptionReport.findMany({
      where: { shipment_id: shipmentId },
      orderBy: { reported_at: 'desc' },
    });
  }

  async getOpenExceptions(filters = {}) {
    const where = { is_resolved: false };

    if (filters.severity) where.severity = filters.severity;
    if (filters.exception_type) where.exception_type = filters.exception_type;
    if (filters.reported_by_id) where.reported_by_id = filters.reported_by_id;

    // Filter by warehouse: find exceptions whose shipments are at this warehouse
    if (filters.warehouse_id) {
      where.shipment = {
        OR: [
          { current_warehouse_id: filters.warehouse_id },
          { order: { origin_warehouse_id: filters.warehouse_id } },
        ],
      };
    }

    const exceptions = await prisma.exceptionReport.findMany({
      where,
      include: {
        shipment: {
          select: {
            shipment_id: true,
            shipment_number: true,
            order: { select: { sender_name: true, receiver_name: true } },
          },
        },
        reportedBy: { select: { name: true } },
      },
      orderBy: { reported_at: 'desc' },
    });
    return exceptions;
  }

  async resolveException(exceptionId, resolution_notes) {
    const exception = await prisma.exceptionReport.update({
      where: { exception_id: exceptionId },
      data: {
        is_resolved: true,
        resolution: resolution_notes,
        resolved_at: new Date(),
      },
      include: { shipment: { select: { shipment_number: true } } },
    });
    return exception;
  }
}

module.exports = new ExceptionService();
