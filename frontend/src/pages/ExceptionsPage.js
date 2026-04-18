import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import exceptionService from '../services/exceptionService';
import shipmentService from '../services/shipmentService';

const ExceptionsPage = () => {
  const { user } = useAuth();
  const [exceptions, setExceptions] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [form, setForm] = useState({ shipment_id: '', exception_type: '', severity: '', description: '' });

  const role = user?.role;
  const canCreate = role === 'DRIVER' || role === 'WAREHOUSE_STAFF';
  const canResolve = role === 'ADMIN' || role === 'MANAGER';
  const pageTitle = canCreate ? 'Report Issue' : 'Exceptions';

  useEffect(() => {
    fetchExceptions();
    if (canCreate) fetchShipments();
    // eslint-disable-next-line
  }, [severityFilter]);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await exceptionService.getOpenExceptions({ severity: severityFilter || undefined });
      setExceptions(res.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  const fetchShipments = async () => {
    try {
      let res;
      if (role === 'DRIVER') res = await shipmentService.getDriverDeliveries();
      else res = await shipmentService.getActiveShipments();
      setShipments(res.data || []);
    } catch (error) { console.error('Error:', error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await exceptionService.createException({ ...form, shipment_id: parseInt(form.shipment_id, 10) });
      setShowCreateModal(false);
      setForm({ shipment_id: '', exception_type: '', severity: '', description: '' });
      fetchExceptions();
    } catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await exceptionService.resolveException(showResolveModal, { resolutionNotes });
      setShowResolveModal(null);
      setResolutionNotes('');
      fetchExceptions();
    } catch (error) { alert('Error: ' + (error.response?.data?.error || error.message)); }
  };

  if (loading && exceptions.length === 0) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <div className="header-actions">
          <select className="filter-select" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          {canCreate && <button className="btn-primary" onClick={() => setShowCreateModal(true)}>Report Issue</button>}
        </div>
      </div>

      {exceptions.length === 0 ? (
        <div className="empty-state"><h3>No exceptions</h3><p>{canCreate ? 'Everything is running smoothly.' : 'No open exceptions.'}</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead><tr><th>Shipment</th><th>Type</th><th>Severity</th><th>Description</th><th>Reported By</th><th>Date</th>{canResolve && <th>Action</th>}</tr></thead>
            <tbody>
              {exceptions.map(ex => (
                <tr key={ex.exception_id}>
                  <td className="order-number">{ex.shipment?.shipment_number || '—'}</td>
                  <td>{ex.exception_type?.replace(/_/g, ' ')}</td>
                  <td><span className={`severity-badge severity-${ex.severity?.toLowerCase()}`}>{ex.severity}</span></td>
                  <td className="description-cell">{ex.description}</td>
                  <td>{ex.reportedBy?.name || '—'}</td>
                  <td>{new Date(ex.reported_at).toLocaleDateString()}</td>
                  {canResolve && (
                    <td><button className="btn-sm btn-confirm" onClick={() => { setShowResolveModal(ex.exception_id); setResolutionNotes(''); }}>Resolve</button></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Report Issue</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label>Shipment *</label>
                <select value={form.shipment_id} onChange={e => setForm({...form, shipment_id: e.target.value})} required>
                  <option value="">-- Select Shipment --</option>
                  {shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_number}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Issue Type *</label>
                <select value={form.exception_type} onChange={e => setForm({...form, exception_type: e.target.value})} required>
                  <option value="">-- Select Type --</option>
                  <option value="DELAYED">Delayed</option><option value="DAMAGED">Damaged</option><option value="LOST">Lost</option>
                  <option value="WRONG_ADDRESS">Wrong Address</option><option value="REFUSED_DELIVERY">Refused Delivery</option>
                  <option value="WEATHER_DELAY">Weather Delay</option><option value="VEHICLE_BREAKDOWN">Vehicle Breakdown</option>
                </select>
              </div>
              <div className="form-group"><label>Severity *</label>
                <select value={form.severity} onChange={e => setForm({...form, severity: e.target.value})} required>
                  <option value="">-- Select Severity --</option>
                  <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div className="form-group"><label>Description *</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} required /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button><button type="submit" className="btn-primary">Submit Report</button></div>
            </form>
          </div>
        </div>
      )}

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Resolve Exception</h2>
            <form onSubmit={handleResolve}>
              <div className="form-group"><label>Resolution Notes *</label><textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} required /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary" onClick={() => setShowResolveModal(null)}>Cancel</button><button type="submit" className="btn-primary">Resolve</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionsPage;
