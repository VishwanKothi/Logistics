import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '◉', roles: ['ADMIN', 'MANAGER', 'DRIVER', 'WAREHOUSE_STAFF', 'CUSTOMER'] },
  { path: '/orders', label: 'All Orders', icon: '▤', roles: ['ADMIN'] },
  { path: '/orders', label: 'Manage Orders', icon: '▤', roles: ['MANAGER'] },
  { path: '/orders', label: 'My Orders', icon: '▤', roles: ['CUSTOMER'] },
  { path: '/shipments', label: 'All Shipments', icon: '⇄', roles: ['ADMIN'] },
  { path: '/shipments', label: 'Shipments', icon: '⇄', roles: ['MANAGER'] },
  { path: '/shipments', label: 'My Deliveries', icon: '⇄', roles: ['DRIVER'] },
  { path: '/shipments', label: 'Warehouse', icon: '⇄', roles: ['WAREHOUSE_STAFF'] },
  { path: '/shipments', label: 'Track Shipment', icon: '⇄', roles: ['CUSTOMER'] },
  { path: '/exceptions', label: 'Exceptions', icon: '⚑', roles: ['ADMIN', 'MANAGER'] },
  { path: '/exceptions', label: 'Report Issue', icon: '⚑', roles: ['DRIVER', 'WAREHOUSE_STAFF'] },
  { path: '/billing', label: 'Billing', icon: '◈', roles: ['ADMIN'] },
  { path: '/delivery-proofs', label: 'Delivery Proofs', icon: '▣', roles: ['ADMIN'] },
  { path: '/delivery-proofs', label: 'Verify Proofs', icon: '▣', roles: ['MANAGER'] },
  { path: '/delivery-proofs', label: 'Upload Proof', icon: '▣', roles: ['DRIVER'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  if (!user) return null;

  const role = user.role;
  const navItems = allNavItems.filter(item => item.roles.includes(role));
  const seen = new Set();
  const uniqueNavItems = navItems.filter(item => {
    if (seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });

  const handleLogout = () => { logout(); navigate('/'); };
  const closeMobile = () => setMobileOpen(false);
  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const roleLabels = { ADMIN: 'Administrator', MANAGER: 'Warehouse Manager', DRIVER: 'Delivery Driver', WAREHOUSE_STAFF: 'Warehouse Staff', CUSTOMER: 'Customer' };

  return (
    <>
      {/* Mobile hamburger */}
      <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay visible" onClick={closeMobile} />}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">L</div>
          <div className="sidebar-brand-text">
            <h2>Logistics</h2>
            <span>OPERATIONS</span>
          </div>
        </div>

        {/* Warehouse indicator */}
        {user.warehouse && (
          <div className="sidebar-wh-tag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span className="sidebar-wh-text">{user.warehouse.city}</span>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Menu</div>
          {uniqueNavItems.map((item) => (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-user-card" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
            <div className="sidebar-user-avatar">{getInitials(user.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{role?.toLowerCase().replace('_', ' ')}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Profile dropdown rendered outside sidebar entirely */}
      {profileOpen && (
        <div className="sidebar-profile-dropdown" ref={dropdownRef}>
          <div className="profile-dropdown-header">
            <div className="profile-dd-avatar">{getInitials(user.name)}</div>
            <div>
              <div className="profile-dd-name">{user.name}</div>
              <div className="profile-dd-email">{user.email}</div>
              <div className="profile-dd-role">{roleLabels[role]}</div>
            </div>
          </div>
          {user.warehouse && (
            <div className="profile-dd-warehouse">
              <span className="profile-dd-wh-label">Warehouse</span>
              <span>{user.warehouse.name}</span>
              <span className="profile-dd-wh-city">{user.warehouse.city}, {user.warehouse.state || ''}</span>
            </div>
          )}
          <div className="profile-dd-meta">
            <div className="profile-dd-item"><span>Phone</span><span>{user.phone || '—'}</span></div>
            <div className="profile-dd-item"><span>Email</span><span>{user.email}</span></div>
          </div>
          <button className="profile-dd-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </>
  );
};

export default Sidebar;
