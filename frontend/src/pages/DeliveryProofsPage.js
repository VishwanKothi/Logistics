import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import deliveryProofService from '../services/deliveryProofService';
import shipmentService from '../services/shipmentService';

const DeliveryProofsPage = () => {
  const { user } = useAuth();
  const role = user?.role || 'CUSTOMER';
  const isAdmin = role === 'ADMIN' || role === 'MANAGER';
  const canUpload = role === 'DRIVER' || role === 'WAREHOUSE_STAFF';

  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [verifying, setVerifying] = useState(null);

  const fetchProofs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await deliveryProofService.getUnverifiedProofs();
      setProofs(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch delivery proofs');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProofs(); }, [fetchProofs]);

  const handleVerify = async (proofId) => {
    try {
      setVerifying(proofId);
      await deliveryProofService.verifyProof(proofId);
      fetchProofs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify proof');
    } finally { setVerifying(null); }
  };

  const pageTitle = canUpload ? 'Upload Proof' : 'Verify Proofs';
  const pageDesc = canUpload ? 'Upload delivery proof for your shipments' : 'Review and verify delivery proofs submitted by drivers';

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>{pageTitle}</h1><p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>{pageDesc}</p></div>
        {canUpload && <button className="btn-primary" onClick={() => setShowUploadModal(true)}>Upload Proof</button>}
      </div>

      {error && <div className="alert alert-error">{error}<span className="alert-close" onClick={() => setError(null)}>×</span></div>}

      {loading ? (
        <div className="page-loading"><div className="spinner" /></div>
      ) : proofs.length === 0 ? (
        <div className="empty-state"><h3>No delivery proofs</h3><p>{canUpload ? 'Upload your first delivery proof' : 'No proofs to review'}</p></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Shipment</th><th>Proof Type</th><th>Uploaded By</th><th>Status</th><th>Uploaded</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {proofs.map(p => (
                <tr key={p.proof_id}>
                  <td style={{ fontWeight: 600 }}>{p.shipment?.shipment_number || `Shipment #${p.shipment_id}`}</td>
                  <td>{p.proof_type}</td>
                  <td>{p.uploadedBy?.name || '—'}</td>
                  <td><span className={`status-badge status-${(p.verification_status || 'pending').toLowerCase()}`}>{p.verification_status}</span></td>
                  <td style={{ color: 'var(--gray-500)', fontSize: 13 }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>
                  {isAdmin && (
                    <td className="actions-cell">
                      {p.verification_status === 'PENDING' ? (
                        <>
                          <button className="btn-sm btn-confirm" onClick={() => handleVerify(p.proof_id)} disabled={verifying === p.proof_id}>
                            {verifying === p.proof_id ? 'Verifying...' : 'Verify'}
                          </button>
                          <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="btn-sm">View</a>
                        </>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: 13 }}>
                          {p.verification_status === 'VERIFIED' ? 'Verified' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showUploadModal && <UploadProofModal onClose={() => setShowUploadModal(false)} onUploaded={fetchProofs} userRole={role} />}
    </div>
  );
};

const UploadProofModal = ({ onClose, onUploaded, userRole }) => {
  const [shipments, setShipments] = useState([]);
  const [form, setForm] = useState({ shipment_id: '', proof_type: 'PHOTO', file: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        let res;
        if (userRole === 'DRIVER') res = await shipmentService.getDriverDeliveries();
        else res = await shipmentService.getActiveShipments();
        setShipments(res.data || []);
      } catch (err) { console.error('Error fetching shipments:', err); }
    };
    fetchShipments();
  }, [userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.shipment_id || !form.file) { setFormError('Please select a shipment and upload a file'); return; }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('shipment_id', form.shipment_id);
      formData.append('proof_type', form.proof_type);
      formData.append('proof', form.file);
      await deliveryProofService.uploadProof(formData);
      onClose();
      onUploaded();
    } catch (err) { setFormError(err.response?.data?.error || 'Failed to upload proof'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Upload Delivery Proof</h2>
        <form onSubmit={handleSubmit}>
          {formError && <div className="alert alert-error">{formError}</div>}

          <div className="form-group">
            <label>Shipment *</label>
            <select value={form.shipment_id} onChange={e => setForm(prev => ({ ...prev, shipment_id: e.target.value }))} required>
              <option value="">-- Select Shipment --</option>
              {shipments.map(s => <option key={s.shipment_id} value={s.shipment_id}>{s.shipment_number} — {s.order?.sender_name || 'Unknown'}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Proof Type</label>
            <select value={form.proof_type} onChange={e => setForm(prev => ({ ...prev, proof_type: e.target.value }))}>
              <option value="PHOTO">Photo</option>
              <option value="SIGNATURE">Signature</option>
              <option value="VIDEO">Video</option>
              <option value="GEOLOCATION">Geolocation</option>
            </select>
          </div>

          <div className="form-group">
            <label>Upload File *</label>
            <div style={{ border: '2px dashed var(--gray-300)', borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer', background: form.file ? 'rgba(99,102,241,0.04)' : 'rgba(0,0,0,0.02)' }}
              onClick={() => document.getElementById('proof-file-input').click()}>
              {form.file ? (
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{form.file.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>{(form.file.size / 1024).toFixed(1)} KB — Click to change</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--gray-500)' }}>Click to select a file</p>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>JPG, PNG, PDF up to 10MB</p>
                </div>
              )}
              <input id="proof-file-input" type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                onChange={e => { setForm(prev => ({ ...prev, file: e.target.files[0] })); setFormError(''); }} />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Uploading...' : 'Upload Proof'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryProofsPage;
