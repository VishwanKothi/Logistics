import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const roleLabels = { ADMIN: 'System Administrator', MANAGER: 'Warehouse Manager', DRIVER: 'Delivery Driver', WAREHOUSE_STAFF: 'Warehouse Staff', CUSTOMER: 'Customer' };
  const roleColors = { ADMIN: 'violet', MANAGER: 'blue', DRIVER: 'green', WAREHOUSE_STAFF: 'orange', CUSTOMER: 'emerald' };

  useEffect(() => { fetchProfile(); }, []); // eslint-disable-line

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/profile');
      setProfile(res.data);
      setForm({ name: res.data.name || '', phone: res.data.phone || '', email: res.data.email || '' });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/users/profile', { name: form.name, phone: form.phone });
      setProfile(res.data.user);
      const updatedUser = { ...user, name: form.name, phone: form.phone };
      login(updatedUser, localStorage.getItem('token'));
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update' });
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' }); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' }); return;
    }
    try {
      setSaving(true);
      await api.put('/users/profile', { password: passwordForm.newPassword });
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
    } finally { setSaving(false); }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  const p = profile || user;
  const color = roleColors[p?.role] || 'blue';

  return (
    <div className="page-container">
      <div className="page-header"><h1>My Profile</h1></div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <span className="alert-close" onClick={() => setMessage(null)}>&times;</span>
        </div>
      )}

      <div className="profile-layout">
        {/* Profile Card */}
        <div className="profile-card">
          <div className={`profile-avatar profile-avatar-${color}`}>
            {getInitials(p?.name)}
          </div>
          <h2 className="profile-name">{p?.name}</h2>
          <span className={`role-badge role-badge-${color}`}>{roleLabels[p?.role] || p?.role}</span>
          {p?.warehouse && (
            <div className="profile-warehouse">
              <span className="detail-label">Warehouse</span>
              <span>{p.warehouse.name}</span>
              <span className="profile-city">{p.warehouse.city}, {p.warehouse.state}</span>
            </div>
          )}
          <div className="profile-meta">
            <div className="profile-meta-item">
              <span className="detail-label">Member Since</span>
              <span>{p?.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</span>
            </div>
          </div>
        </div>

        {/* Details Card */}
        <div className="profile-details">
          <div className="profile-details-header">
            <h3>Account Details</h3>
            {!editing && <button className="btn-sm" onClick={() => setEditing(true)}>Edit</button>}
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input value={form.email} readOnly className="input-readonly" />
                <span className="form-hint">Email cannot be changed</span>
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="profile-actions">
                <button type="button" className="btn-secondary" onClick={() => { setEditing(false); setForm({ name: p?.name || '', phone: p?.phone || '', email: p?.email || '' }); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div className="profile-info-list">
              <div className="detail-row"><span className="detail-label">Full Name</span><span>{p?.name}</span></div>
              <div className="detail-row"><span className="detail-label">Email</span><span>{p?.email}</span></div>
              <div className="detail-row"><span className="detail-label">Phone</span><span>{p?.phone}</span></div>
              <div className="detail-row"><span className="detail-label">Role</span><span className={`role-badge role-badge-${color}`}>{roleLabels[p?.role]}</span></div>
              {p?.warehouse && <div className="detail-row"><span className="detail-label">Warehouse</span><span>{p.warehouse.name} — {p.warehouse.city}</span></div>}
            </div>
          )}

          <div className="profile-security">
            <h3>Security</h3>
            <div className="detail-row">
              <span className="detail-label">Password</span>
              <button className="btn-sm" onClick={() => setShowPasswordModal(true)}>Change Password</button>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group"><label>New Password</label><input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={6} /></div>
              <div className="form-group"><label>Confirm Password</label><input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required /></div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Change Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
