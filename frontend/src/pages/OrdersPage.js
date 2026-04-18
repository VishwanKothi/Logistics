import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import shipmentService from '../services/shipmentService';
import warehouseService from '../services/warehouseService';

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateShipmentModal, setShowCreateShipmentModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const role = user?.role;
  const isCustomer = role === 'CUSTOMER';
  const isManager = role === 'MANAGER';
  // eslint-disable-next-line
  const isAdmin = role === 'ADMIN';

  const [form, setForm] = useState({
    sender_name: '', sender_email: '', sender_phone: '',
    receiver_name: '', receiver_email: '', receiver_phone: '',
    pickup_address: '', pickup_city: '', pickup_state: '',
    delivery_address: '', delivery_city: '', delivery_state: '',
    origin_warehouse_id: '', notes: '',
  });

  const [shipmentForm, setShipmentForm] = useState({ items_count: 1, weight_kg: '', estimated_delivery_date: '' });

  useEffect(() => {
    fetchOrders();
    fetchWarehouses();
    // eslint-disable-next-line
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await orderService.getAllOrders(params);
      setOrders(res.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await warehouseService.getAllWarehouses();
      setWarehouses(res.data || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await orderService.createOrder(form);
      setShowCreateModal(false);
      setForm({
        sender_name: '', sender_email: '', sender_phone: '',
        receiver_name: '', receiver_email: '', receiver_phone: '',
        pickup_address: '', pickup_city: '', pickup_state: '',
        delivery_address: '', delivery_city: '', delivery_state: '',
        origin_warehouse_id: '', notes: '',
      });
      fetchOrders();
    } catch (error) {
      alert('Error creating order: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await orderService.updateOrderStatus(orderId, 'CONFIRMED');
      fetchOrders();
      if (selectedOrder?.order_id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'CONFIRMED' }));
      }
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      await shipmentService.createShipment({
        order_id: selectedOrder.order_id,
        items_count: parseInt(shipmentForm.items_count, 10),
        weight_kg: parseFloat(shipmentForm.weight_kg) || null,
        estimated_delivery_date: shipmentForm.estimated_delivery_date || null,
      });
      setShowCreateShipmentModal(false);
      await orderService.updateOrderStatus(selectedOrder.order_id, 'IN_PROGRESS');
      fetchOrders();
      const updated = await orderService.getOrderById(selectedOrder.order_id);
      setSelectedOrder(updated.data);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    }
  };

  const openCreateModal = () => {
    if (isCustomer && user) {
      setForm(prev => ({ ...prev, sender_name: user.name || '', sender_email: user.email || '', sender_phone: user.phone || '' }));
    }
    setShowCreateModal(true);
  };

  const viewOrderDetail = async (order) => {
    try {
      const res = await orderService.getOrderById(order.order_id);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const pageTitle = isCustomer ? 'My Orders' : isManager ? 'Manage Orders' : 'All Orders';

  if (loading && orders.length === 0) return <div className="page-loading"><div className="spinner" /></div>;

  // Detail View
  if (selectedOrder) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setSelectedOrder(null)}>&larr; Back</button>
            <h1>Order {selectedOrder.order_number}</h1>
          </div>
          <span className={`status-badge status-${selectedOrder.status?.toLowerCase()}`}>{selectedOrder.status}</span>
        </div>

        <div className="detail-grid">
          <div className="detail-card">
            <h3>Sender Information</h3>
            <div className="detail-row"><span className="detail-label">Name</span><span>{selectedOrder.sender_name}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span>{selectedOrder.sender_email}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span>{selectedOrder.sender_phone}</span></div>
            <div className="detail-row"><span className="detail-label">Address</span><span>{selectedOrder.pickup_address}</span></div>
            <div className="detail-row"><span className="detail-label">City</span><span>{selectedOrder.pickup_city}, {selectedOrder.pickup_state}</span></div>
          </div>

          <div className="detail-card">
            <h3>Receiver Information</h3>
            <div className="detail-row"><span className="detail-label">Name</span><span>{selectedOrder.receiver_name}</span></div>
            <div className="detail-row"><span className="detail-label">Email</span><span>{selectedOrder.receiver_email || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Phone</span><span>{selectedOrder.receiver_phone}</span></div>
            <div className="detail-row"><span className="detail-label">Address</span><span>{selectedOrder.delivery_address}</span></div>
            <div className="detail-row"><span className="detail-label">City</span><span>{selectedOrder.delivery_city}, {selectedOrder.delivery_state}</span></div>
          </div>

          <div className="detail-card">
            <h3>Origin Warehouse</h3>
            <div className="detail-row"><span className="detail-label">Hub</span><span>{selectedOrder.origin_warehouse?.name}</span></div>
            <div className="detail-row"><span className="detail-label">City</span><span>{selectedOrder.origin_warehouse?.city}</span></div>
          </div>

          {selectedOrder.notes && (
            <div className="detail-card">
              <h3>Notes</h3>
              <p>{selectedOrder.notes}</p>
            </div>
          )}
        </div>

        {isManager && selectedOrder.status === 'PLACED' && (
          <div className="action-bar">
            <button className="btn-primary" onClick={() => handleConfirmOrder(selectedOrder.order_id)}>Confirm Order</button>
          </div>
        )}

        {isManager && selectedOrder.status === 'CONFIRMED' && (
          <div className="action-bar">
            <button className="btn-primary" onClick={() => setShowCreateShipmentModal(true)}>Create Shipment</button>
          </div>
        )}

        {selectedOrder.shipments?.length > 0 && (
          <div className="section-card">
            <h3>Linked Shipments</h3>
            {selectedOrder.shipments.map(s => (
              <div key={s.shipment_id} className="linked-item">
                <span className="linked-number">{s.shipment_number}</span>
                <span className={`status-badge status-${s.status?.toLowerCase().replace(/_/g,'-')}`}>{s.status?.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {showCreateShipmentModal && (
          <div className="modal-overlay" onClick={() => setShowCreateShipmentModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Create Shipment</h2>
              <p className="modal-subtitle">For order {selectedOrder.order_number}</p>
              <form onSubmit={handleCreateShipment}>
                <div className="form-group"><label>Number of Items</label><input type="number" min="1" value={shipmentForm.items_count} onChange={e => setShipmentForm({...shipmentForm, items_count: e.target.value})} required /></div>
                <div className="form-group"><label>Weight (kg)</label><input type="number" step="0.1" value={shipmentForm.weight_kg} onChange={e => setShipmentForm({...shipmentForm, weight_kg: e.target.value})} /></div>
                <div className="form-group"><label>Est. Delivery Date</label><input type="date" value={shipmentForm.estimated_delivery_date} onChange={e => setShipmentForm({...shipmentForm, estimated_delivery_date: e.target.value})} /></div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateShipmentModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Shipment</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <div className="header-actions">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {(isCustomer || isManager) && <button className="btn-primary" onClick={openCreateModal}>+ New Order</button>}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders found</h3>
          <p>{isCustomer ? 'Create your first order to get started.' : 'No orders to display.'}</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Order #</th><th>Sender</th><th>Receiver</th><th>Route</th><th>Hub</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.order_id}>
                  <td className="order-number">{order.order_number}</td>
                  <td>{order.sender_name}</td>
                  <td>{order.receiver_name}</td>
                  <td>{order.pickup_city} &rarr; {order.delivery_city}</td>
                  <td>{order.origin_warehouse?.city || '—'}</td>
                  <td><span className={`status-badge status-${order.status?.toLowerCase()}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="btn-sm" onClick={() => viewOrderDetail(order)}>View</button>
                    {isManager && order.status === 'PLACED' && <button className="btn-sm btn-confirm" onClick={() => handleConfirmOrder(order.order_id)}>Confirm</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <h2>New Order</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="form-section"><h3>Sender Information</h3>
                <div className="form-grid">
                  <div className="form-group"><label>Name *</label><input value={form.sender_name} onChange={e => setForm({...form, sender_name: e.target.value})} readOnly={isCustomer} required /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={form.sender_email} onChange={e => setForm({...form, sender_email: e.target.value})} readOnly={isCustomer} /></div>
                  <div className="form-group"><label>Phone *</label><input value={form.sender_phone} onChange={e => setForm({...form, sender_phone: e.target.value})} readOnly={isCustomer} required /></div>
                </div>
              </div>
              <div className="form-section"><h3>Pickup Address</h3>
                <div className="form-grid">
                  <div className="form-group form-full"><label>Address *</label><input value={form.pickup_address} onChange={e => setForm({...form, pickup_address: e.target.value})} required /></div>
                  <div className="form-group"><label>City *</label><input value={form.pickup_city} onChange={e => setForm({...form, pickup_city: e.target.value})} required /></div>
                  <div className="form-group"><label>State</label><input value={form.pickup_state} onChange={e => setForm({...form, pickup_state: e.target.value})} /></div>
                </div>
              </div>
              <div className="form-section"><h3>Select Nearest Warehouse</h3>
                <div className="form-group"><label>Origin Warehouse *</label>
                  <select value={form.origin_warehouse_id} onChange={e => setForm({...form, origin_warehouse_id: e.target.value})} required>
                    <option value="">-- Select Warehouse --</option>
                    {warehouses.map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name} ({w.city})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-section"><h3>Receiver Information</h3>
                <div className="form-grid">
                  <div className="form-group"><label>Name *</label><input value={form.receiver_name} onChange={e => setForm({...form, receiver_name: e.target.value})} required /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={form.receiver_email} onChange={e => setForm({...form, receiver_email: e.target.value})} /></div>
                  <div className="form-group"><label>Phone *</label><input value={form.receiver_phone} onChange={e => setForm({...form, receiver_phone: e.target.value})} required /></div>
                </div>
              </div>
              <div className="form-section"><h3>Delivery Address</h3>
                <div className="form-grid">
                  <div className="form-group form-full"><label>Address *</label><input value={form.delivery_address} onChange={e => setForm({...form, delivery_address: e.target.value})} required /></div>
                  <div className="form-group"><label>City *</label><input value={form.delivery_city} onChange={e => setForm({...form, delivery_city: e.target.value})} required /></div>
                  <div className="form-group"><label>State</label><input value={form.delivery_state} onChange={e => setForm({...form, delivery_state: e.target.value})} /></div>
                </div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="e.g., Fragile, temperature-sensitive..." /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Place Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
