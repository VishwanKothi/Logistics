import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ExceptionsPage from './pages/ExceptionsPage';
import BillingPage from './pages/BillingPage';
import DeliveryProofsPage from './pages/DeliveryProofsPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-fullpage"><div className="loader-spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="app-content">{children}</main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><RoleRoute allowedRoles={['ADMIN','MANAGER','CUSTOMER']}><AppLayout><OrdersPage /></AppLayout></RoleRoute></ProtectedRoute>
          } />
          <Route path="/shipments" element={
            <ProtectedRoute><AppLayout><ShipmentsPage /></AppLayout></ProtectedRoute>
          } />
          <Route path="/exceptions" element={
            <ProtectedRoute><RoleRoute allowedRoles={['ADMIN','MANAGER','DRIVER','WAREHOUSE_STAFF']}><AppLayout><ExceptionsPage /></AppLayout></RoleRoute></ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AppLayout><BillingPage /></AppLayout></RoleRoute></ProtectedRoute>
          } />
          <Route path="/delivery-proofs" element={
            <ProtectedRoute><RoleRoute allowedRoles={['ADMIN','MANAGER','DRIVER','WAREHOUSE_STAFF']}><AppLayout><DeliveryProofsPage /></AppLayout></RoleRoute></ProtectedRoute>
          } />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
