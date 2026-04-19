import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import shipmentService from '../services/shipmentService';
import warehouseService from '../services/warehouseService';

const STATUS_STEPS = ['PENDING_ROUTING', 'ROUTED', 'PICKUP_ASSIGNED', 'PICKED_UP', 'AT_ORIGIN_WAREHOUSE', 'TRANSIT_ASSIGNED', 'IN_TRANSIT', 'AT_DEST_WAREHOUSE', 'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STATUS_LABELS = { PENDING_ROUTING: 'Pending Routing', ROUTED: 'Routed', PICKUP_ASSIGNED: 'Pickup Assigned', PICKED_UP: 'Picked Up', AT_ORIGIN_WAREHOUSE: 'At Origin Hub', TRANSIT_ASSIGNED: 'Transit Assigned', IN_TRANSIT: 'In Transit', AT_DEST_WAREHOUSE: 'At Dest Hub', DELIVERY_ASSIGNED: 'Delivery Assigned', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', FAILED_DELIVERY: 'Failed' };

const ShipmentsPage = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignType, setAssignType] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  const role = user?.role;
  const isDriver = role === 'DRIVER';
  const isStaff = role === 'WAREHOUSE_STAFF';
  const isManager = role === 'MANAGER';
  const isAdmin = role === 'ADMIN';
  const isCustomer = role === 'CUSTOMER';

  const pageTitle = isDriver ? 'My Deliveries' : isStaff ? 'Warehouse Shipments' : isCustomer ? 'Track Shipments' : isManager ? 'Shipments' : 'All Shipments';

  useEffect(() => {
    fetchShipments();
    if (isManager || isStaff || isAdmin) fetchWarehouses();
    if ((isManager || isStaff) && user?.warehouse_id) fetchDrivers(user.warehouse_id);
    // eslint-disable-next-line
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      let res;
      if (isDriver) res = await shipmentService.getDriverDeliveries();
      else if (isStaff || isManager) res = await shipmentService.getWarehouseShipments();
      else res = await shipmentService.getActiveShipments();
      setShipments(res.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const fetchWarehouses = async () => { try { const res = await warehouseService.getAllWarehouses(); setWarehouses(res.data || []); } catch (e) {} };
  const fetchDrivers = async (whId) => { try { const res = await warehouseService.getWarehouseDrivers(whId); setDrivers(res.data || []); } catch (e) {} };

  const viewShipmentDetail = async (ship) => { try { const res = await shipmentService.getShipmentById(ship.shipment_id); setSelectedShipment(res.data); } catch (e) {} };

  const handleDriverStatusUpdate = async (status) => {
    try { await shipmentService.updateStatus(selectedShipment.shipment_id, status); await viewShipmentDetail(selectedShipment); fetchShipments(); }
    catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };



  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await shipmentService.assignDriver(selectedShipment.shipment_id, assignType, parseInt(assignDriverId, 10));
      setShowAssignModal(false); await viewShipmentDetail(selectedShipment); fetchShipments();
    } catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  const openAssignModal = (type) => { setAssignType(type); setAssignDriverId(''); setShowAssignModal(true); };

  const getDriverStatusButtons = () => {
    if (!selectedShipment || !isDriver) return [];
    const s = selectedShipment.status;
    const buttons = [];
    if (s === 'PICKUP_ASSIGNED') buttons.push({ label: 'Mark Picked Up', status: 'PICKED_UP', color: 'blue' });
    if (s === 'PICKED_UP') buttons.push({ label: 'Drop at Origin Hub', status: 'AT_ORIGIN_WAREHOUSE', color: 'green' });
    if (s === 'TRANSIT_ASSIGNED') buttons.push({ label: 'Start Transit', status: 'IN_TRANSIT', color: 'blue' });
    if (s === 'IN_TRANSIT') buttons.push({ label: 'Drop at Dest Hub', status: 'AT_DEST_WAREHOUSE', color: 'green' });
    if (s === 'DELIVERY_ASSIGNED') buttons.push({ label: 'Start Delivery', status: 'OUT_FOR_DELIVERY', color: 'blue' });
    if (s === 'OUT_FOR_DELIVERY') {
      buttons.push({ label: 'Mark Delivered', status: 'DELIVERED', color: 'emerald' });
      buttons.push({ label: 'Mark Failed', status: 'FAILED_DELIVERY', color: 'red' });
    }
    return buttons;
  };

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status);
  const currentStep = selectedShipment ? getStepIndex(selectedShipment.status) : -1;

  if (loading && shipments.length === 0) return <div className="page-loading"><div className="spinner" /></div>;

  // Detail View
  if (selectedShipment) {
    const s = selectedShipment;
    const isAtOriginWH = user?.warehouse_id === s.origin_warehouse_id;
    const isAtDestWH = user?.warehouse_id === s.dest_warehouse_id;

    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <button className="btn-back" onClick={() => setSelectedShipment(null)}>&larr; Back</button>
            <h1>Shipment {s.shipment_number}</h1>
          </div>
          <span className={`status-badge status-${s.status?.toLowerCase().replace(/_/g,'-')}`}>{STATUS_LABELS[s.status] || s.status}</span>
        </div>

        <div className="status-stepper">
          {STATUS_STEPS.map((step, i) => (
            <div key={step} className={`step ${i <= currentStep ? 'completed' : ''} ${i === currentStep ? 'current' : ''}`}>
              <div className="step-dot">{i <= currentStep ? '✓' : i + 1}</div>
              <div className="step-label">{STATUS_LABELS[step]}</div>
            </div>
          ))}
        </div>

        <div className="detail-grid">
          {s.order && (<>
            <div className="detail-card">
              <h3>Sender</h3>
              <div className="detail-row"><span className="detail-label">Name</span><span>{s.order.sender_name}</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span>{s.order.sender_phone}</span></div>
              <div className="detail-row"><span className="detail-label">Pickup</span><span>{s.order.pickup_address}, {s.order.pickup_city}</span></div>
            </div>
            <div className="detail-card">
              <h3>Receiver</h3>
              <div className="detail-row"><span className="detail-label">Name</span><span>{s.order.receiver_name}</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span>{s.order.receiver_phone}</span></div>
              <div className="detail-row"><span className="detail-label">Delivery</span><span>{s.order.delivery_address}, {s.order.delivery_city}</span></div>
            </div>
          </>)}
          <div className="detail-card">
            <h3>Shipment Details</h3>
            <div className="detail-row"><span className="detail-label">Items</span><span>{s.items_count}</span></div>
            <div className="detail-row"><span className="detail-label">Weight</span><span>{s.weight_kg ? `${s.weight_kg.toFixed(1)} kg` : '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Est. Delivery</span><span>{s.estimated_delivery_date ? new Date(s.estimated_delivery_date).toLocaleDateString() : '—'}</span></div>
            {s.pickup_driver && <div className="detail-row"><span className="detail-label">Pickup Driver</span><span>{s.pickup_driver.name}</span></div>}
            {s.heavy_driver && <div className="detail-row"><span className="detail-label">Heavy Driver</span><span>{s.heavy_driver.name}</span></div>}
            {s.delivery_driver && <div className="detail-row"><span className="detail-label">Delivery Driver</span><span>{s.delivery_driver.name}</span></div>}
          </div>
          <div className="detail-card">
            <h3>Locations</h3>
            <div className="detail-row"><span className="detail-label">Pickup From</span><span>{s.order?.pickup_address}, {s.order?.pickup_city}</span></div>
            <div className="detail-row"><span className="detail-label">Customer</span><span>{s.order?.sender_name} ({s.order?.sender_phone})</span></div>
            <hr style={{ margin: '12px 0', borderColor: 'var(--gray-200)' }} />
            <div className="detail-row"><span className="detail-label">Deliver To</span><span>{s.order?.delivery_address}, {s.order?.delivery_city}</span></div>
            <div className="detail-row"><span className="detail-label">Receiver</span><span>{s.order?.receiver_name} ({s.order?.receiver_phone})</span></div>
          </div>
          <div className="detail-card">
            <h3>Warehouse Route</h3>
            <div className="detail-row"><span className="detail-label">Origin Hub</span><span>{s.origin_warehouse?.name || '—'}</span></div>
            <div className="detail-row"><span className="detail-label">Dest Hub</span><span>{s.dest_warehouse?.name || 'Not routed yet'}</span></div>
          </div>
        </div>

        {/* Driver Actions */}
        {isDriver && getDriverStatusButtons().length > 0 && (
          <div className="action-bar"><h3>Driver Actions</h3>
            <div className="action-buttons">
              {getDriverStatusButtons().map(btn => (
                <button key={btn.status} className={`btn-primary btn-${btn.color}`} onClick={() => handleDriverStatusUpdate(btn.status)}>{btn.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* Staff Actions */}
        {isStaff && (
          <div className="action-bar"><h3>Warehouse Actions</h3>
            <div className="action-buttons">
              {isAtOriginWH && s.status === 'ROUTED' && <button className="btn-primary btn-blue" onClick={() => openAssignModal('pickup')}>Assign Pickup Driver</button>}
              {isAtOriginWH && s.status === 'AT_ORIGIN_WAREHOUSE' && <button className="btn-primary btn-blue" onClick={() => openAssignModal('heavy')}>Assign Heavy Driver</button>}
              {isAtDestWH && s.status === 'AT_DEST_WAREHOUSE' && <button className="btn-primary btn-blue" onClick={() => openAssignModal('delivery')}>Assign Delivery Driver</button>}
            </div>
          </div>
        )}



        {s.statusHistory?.length > 0 && (
          <div className="section-card"><h3>Status History</h3>
            {s.statusHistory.map((h, i) => (
              <div key={i} className="history-item"><span className="history-time">{new Date(h.changed_at).toLocaleString()}</span><span>{STATUS_LABELS[h.old_status] || h.old_status} &rarr; {STATUS_LABELS[h.new_status] || h.new_status}</span></div>
            ))}
          </div>
        )}



        {showAssignModal && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Assign {assignType} Driver</h2><p className="modal-subtitle">Select a driver from this warehouse</p>
              <form onSubmit={handleAssign}>
                <div className="form-group"><label>Available Drivers</label>
                  <select value={assignDriverId} onChange={e => setAssignDriverId(e.target.value)} required>
                    <option value="">-- Select Driver --</option>
                    {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.name} ({d.phone})</option>)}
                  </select>
                </div>
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button><button type="submit" className="btn-primary">Assign Driver</button></div>
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
        {(isStaff || isManager) && user?.warehouse && <span className="warehouse-indicator">{user.warehouse.name}</span>}
      </div>

      {shipments.length === 0 ? (
        <div className="empty-state"><h3>No shipments found</h3><p>{isDriver ? 'No deliveries assigned to you yet.' : isStaff ? 'No packages at your warehouse.' : 'No active shipments.'}</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Shipment #</th><th>{isDriver ? 'Sender' : 'Sender / Receiver'}</th><th>Route</th><th>Status</th><th>Est. Delivery</th><th>Actions</th></tr></thead>
            <tbody>
              {shipments.map(ship => (
                <tr key={ship.shipment_id}>
                  <td className="order-number">{ship.shipment_number}</td>
                  <td>{isDriver ? ship.order?.sender_name : `${ship.order?.sender_name || '—'} / ${ship.order?.receiver_name || '—'}`}</td>
                  <td>{`${ship.order?.pickup_city || '—'} → ${ship.order?.delivery_city || '—'}`}</td>
                  <td><span className={`status-badge status-${ship.status?.toLowerCase().replace(/_/g,'-')}`}>{STATUS_LABELS[ship.status] || ship.status}</span></td>
                  <td>{ship.estimated_delivery_date ? new Date(ship.estimated_delivery_date).toLocaleDateString() : '—'}</td>
                  <td className="actions-cell">
                    <button className="btn-sm" onClick={() => viewShipmentDetail(ship)}>{isCustomer ? 'Track' : 'View'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShipmentsPage;
