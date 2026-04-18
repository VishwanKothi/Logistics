import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import shipmentService from '../services/shipmentService';
import warehouseService from '../services/warehouseService';

const STATUS_STEPS = ['PENDING_PICKUP', 'PICKED_UP', 'ARRIVED_AT_WAREHOUSE', 'IN_WAREHOUSE', 'ROUTED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STATUS_LABELS = { PENDING_PICKUP: 'Pending Pickup', PICKED_UP: 'Picked Up', ARRIVED_AT_WAREHOUSE: 'Arrived at Hub', IN_WAREHOUSE: 'In Warehouse', ROUTED: 'Routed', IN_TRANSIT: 'In Transit', OUT_FOR_DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered', FAILED_DELIVERY: 'Failed' };

const ShipmentsPage = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeForm, setRouteForm] = useState({ next_stop_warehouse_id: '', is_final_delivery: false });
  const [dispatchDriverId, setDispatchDriverId] = useState('');
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

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

  const handleReceive = async (shipmentId) => {
    try { await shipmentService.receiveAtWarehouse(shipmentId); fetchShipments(); if (selectedShipment) await viewShipmentDetail(selectedShipment); }
    catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  const handleRoute = async (e) => {
    e.preventDefault();
    try {
      await shipmentService.routeShipment(selectedShipment.shipment_id, {
        next_stop_warehouse_id: routeForm.is_final_delivery ? null : parseInt(routeForm.next_stop_warehouse_id, 10),
        is_final_delivery: routeForm.is_final_delivery,
      });
      setShowRouteModal(false); await viewShipmentDetail(selectedShipment); fetchShipments();
    } catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    try {
      await shipmentService.dispatchShipment(selectedShipment.shipment_id, {
        driver_id: parseInt(dispatchDriverId, 10), is_final_delivery: selectedShipment.is_final_delivery,
      });
      setShowDispatchModal(false); await viewShipmentDetail(selectedShipment); fetchShipments();
    } catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  const getDriverStatusButtons = () => {
    if (!selectedShipment) return [];
    const s = selectedShipment.status;
    const buttons = [];
    if (s === 'PENDING_PICKUP') buttons.push({ label: 'Pick Up', status: 'PICKED_UP', color: 'blue' });
    if (s === 'PICKED_UP') buttons.push({ label: 'Arrived at Hub', status: 'ARRIVED_AT_WAREHOUSE', color: 'green' });
    if (s === 'IN_TRANSIT') buttons.push({ label: 'Arrived at Hub', status: 'ARRIVED_AT_WAREHOUSE', color: 'green' });
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
            {s.driver && <div className="detail-row"><span className="detail-label">Driver</span><span>{s.driver.name} ({s.driver.phone})</span></div>}
          </div>
          <div className="detail-card">
            <h3>Warehouse Status</h3>
            <div className="detail-row"><span className="detail-label">Current Hub</span><span>{s.current_warehouse?.name || 'In Transit / At Location'}</span></div>
            <div className="detail-row"><span className="detail-label">Next Stop</span><span>{s.is_final_delivery ? 'Final Delivery' : (s.next_stop_warehouse?.name || 'Not routed yet')}</span></div>
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
              {(s.status === 'ARRIVED_AT_WAREHOUSE' || s.status === 'PICKED_UP') && <button className="btn-primary btn-green" onClick={() => handleReceive(s.shipment_id)}>Receive Package</button>}
              {s.status === 'ROUTED' && <button className="btn-primary btn-blue" onClick={() => { setDispatchDriverId(''); setShowDispatchModal(true); }}>Assign Driver &amp; Dispatch</button>}
            </div>
          </div>
        )}

        {/* Manager Actions */}
        {isManager && (
          <div className="action-bar"><h3>Manager Actions</h3>
            <div className="action-buttons">
              {s.status === 'IN_WAREHOUSE' && <button className="btn-primary btn-orange" onClick={() => { setRouteForm({ next_stop_warehouse_id: '', is_final_delivery: false }); setShowRouteModal(true); }}>Route Package</button>}
              {s.status === 'ROUTED' && <button className="btn-primary btn-blue" onClick={() => { setDispatchDriverId(''); setShowDispatchModal(true); }}>Assign Driver &amp; Dispatch</button>}
              {s.status === 'PENDING_PICKUP' && !s.driver && <button className="btn-primary btn-green" onClick={() => { setDispatchDriverId(''); setShowDispatchModal(true); }}>Assign Pickup Driver</button>}
            </div>
          </div>
        )}

        {s.deliveryProofs?.length > 0 && (
          <div className="section-card"><h3>Delivery Proofs</h3>
            {s.deliveryProofs.map(p => (
              <div key={p.proof_id} className="linked-item"><span>{p.proof_type}</span><span className={`status-badge status-${p.verification_status?.toLowerCase()}`}>{p.verification_status}</span></div>
            ))}
          </div>
        )}

        {s.statusHistory?.length > 0 && (
          <div className="section-card"><h3>Status History</h3>
            {s.statusHistory.map((h, i) => (
              <div key={i} className="history-item"><span className="history-time">{new Date(h.changed_at).toLocaleString()}</span><span>{STATUS_LABELS[h.old_status] || h.old_status} &rarr; {STATUS_LABELS[h.new_status] || h.new_status}</span></div>
            ))}
          </div>
        )}

        {showRouteModal && (
          <div className="modal-overlay" onClick={() => setShowRouteModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Route Package</h2><p className="modal-subtitle">Decide where this package goes next</p>
              <form onSubmit={handleRoute}>
                <div className="form-group"><label><input type="checkbox" checked={routeForm.is_final_delivery} onChange={e => setRouteForm({...routeForm, is_final_delivery: e.target.checked, next_stop_warehouse_id: ''})} /> Send directly to receiver (final delivery)</label></div>
                {!routeForm.is_final_delivery && (
                  <div className="form-group"><label>Next Warehouse Hub *</label>
                    <select value={routeForm.next_stop_warehouse_id} onChange={e => setRouteForm({...routeForm, next_stop_warehouse_id: e.target.value})} required>
                      <option value="">-- Select Warehouse --</option>
                      {warehouses.filter(w => w.warehouse_id !== user?.warehouse_id).map(w => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name} ({w.city})</option>)}
                    </select>
                  </div>
                )}
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowRouteModal(false)}>Cancel</button><button type="submit" className="btn-primary">Set Route</button></div>
              </form>
            </div>
          </div>
        )}

        {showDispatchModal && (
          <div className="modal-overlay" onClick={() => setShowDispatchModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Assign Driver</h2><p className="modal-subtitle">Select a driver from this warehouse</p>
              <form onSubmit={handleDispatch}>
                <div className="form-group"><label>Available Drivers</label>
                  <select value={dispatchDriverId} onChange={e => setDispatchDriverId(e.target.value)} required>
                    <option value="">-- Select Driver --</option>
                    {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.name} ({d.phone})</option>)}
                  </select>
                </div>
                <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowDispatchModal(false)}>Cancel</button><button type="submit" className="btn-primary">Assign &amp; Dispatch</button></div>
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
            <thead><tr><th>Shipment #</th><th>{isDriver ? 'Sender' : 'Sender / Receiver'}</th><th>{isDriver ? 'Instructions' : 'Route'}</th><th>Status</th>{!isCustomer && <th>Driver</th>}<th>Est. Delivery</th><th>Actions</th></tr></thead>
            <tbody>
              {shipments.map(ship => (
                <tr key={ship.shipment_id}>
                  <td className="order-number">{ship.shipment_number}</td>
                  <td>{isDriver ? ship.order?.sender_name : `${ship.order?.sender_name || '—'} / ${ship.order?.receiver_name || '—'}`}</td>
                  <td>{isDriver ? getDriverInstructions(ship) : `${ship.order?.pickup_city || '—'} → ${ship.order?.delivery_city || '—'}`}</td>
                  <td><span className={`status-badge status-${ship.status?.toLowerCase().replace(/_/g,'-')}`}>{STATUS_LABELS[ship.status] || ship.status}</span></td>
                  {!isCustomer && <td>{ship.driver?.name || '—'}</td>}
                  <td>{ship.estimated_delivery_date ? new Date(ship.estimated_delivery_date).toLocaleDateString() : '—'}</td>
                  <td className="actions-cell">
                    <button className="btn-sm" onClick={() => viewShipmentDetail(ship)}>{isCustomer ? 'Track' : 'View'}</button>
                    {isStaff && (ship.status === 'ARRIVED_AT_WAREHOUSE' || ship.status === 'PICKED_UP') && <button className="btn-sm btn-confirm" onClick={() => handleReceive(ship.shipment_id)}>Receive</button>}
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

const getDriverInstructions = (ship) => {
  const s = ship.status;
  if (s === 'PENDING_PICKUP') return `Pick up from ${ship.order?.pickup_city || '—'}`;
  if (s === 'PICKED_UP') return `Deliver to hub`;
  if (s === 'IN_TRANSIT') return `Transit to ${ship.next_stop_warehouse?.city || 'hub'}`;
  if (s === 'OUT_FOR_DELIVERY') return `Deliver to ${ship.order?.delivery_city || 'receiver'}`;
  return ship.current_location || '—';
};

export default ShipmentsPage;
