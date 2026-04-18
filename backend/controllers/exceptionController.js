const exceptionService = require('../services/exceptionService');

class ExceptionController {
  async createException(req, res) {
    try {
      const exceptionData = {
        shipment_id: parseInt(req.body.shipment_id, 10),
        exception_type: req.body.exception_type,
        severity: req.body.severity,
        description: req.body.description,
        reported_by_id: req.user.user_id,
      };

      const exception = await exceptionService.createException(exceptionData);
      res.status(201).json({ message: 'Exception reported successfully', exception });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getExceptionById(req, res) {
    try {
      const exceptionId = parseInt(req.params.exceptionId, 10);
      if (isNaN(exceptionId)) return res.status(400).json({ error: 'Invalid exception ID' });

      const exception = await exceptionService.getExceptionById(exceptionId);
      if (!exception) return res.status(404).json({ error: 'Exception not found' });

      res.status(200).json(exception);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getShipmentExceptions(req, res) {
    try {
      const shipmentId = parseInt(req.params.shipmentId, 10);
      if (isNaN(shipmentId)) return res.status(400).json({ error: 'Invalid shipment ID' });

      const exceptions = await exceptionService.getExceptionsByShipment(shipmentId);
      res.status(200).json(exceptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOpenExceptions(req, res) {
    try {
      const user = req.user;
      const filters = {
        severity: req.query.severity,
        exception_type: req.query.exceptionType,
      };

      // Role-based filtering
      if (user.role === 'DRIVER' || user.role === 'WAREHOUSE_STAFF') {
        filters.reported_by_id = user.user_id; // See only their own reported exceptions
      } else if (user.role === 'MANAGER') {
        filters.warehouse_id = user.warehouse_id; // See exceptions from their warehouse
      }
      // ADMIN sees all

      const exceptions = await exceptionService.getOpenExceptions(filters);
      res.status(200).json(exceptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async resolveException(req, res) {
    try {
      const exceptionId = parseInt(req.params.exceptionId, 10);
      if (isNaN(exceptionId)) return res.status(400).json({ error: 'Invalid exception ID' });

      const { resolutionNotes } = req.body;
      const exception = await exceptionService.resolveException(exceptionId, resolutionNotes);
      res.status(200).json({ message: 'Exception resolved', exception });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ExceptionController();
