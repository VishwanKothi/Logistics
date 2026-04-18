import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import shipmentService from '../services/shipmentService';
import exceptionService from '../services/exceptionService';
import billingService from '../services/billingService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role;

  useEffect(() => {
    if (user) fetchDashboardData();
    // eslint-disable-next-line
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (role === 'ADMIN') {
        const [ordersRes, shipmentsRes, exceptionsRes, reportRes] = await Promise.allSettled([
          orderService.getAllOrders({ limit: 200 }),
          shipmentService.getActiveShipments(),
          exceptionService.getOpenExceptions({}),
          billingService.getWeeklyReport(),
        ]);
        const allOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
        setStats({
          totalOrders: allOrders.length,
          activeShipments: shipmentsRes.status === 'fulfilled' ? (shipmentsRes.value?.data?.length || 0) : 0,
          openExceptions: exceptionsRes.status === 'fulfilled' ? (exceptionsRes.value?.data?.length || 0) : 0,
          revenue: reportRes.status === 'fulfilled' ? (reportRes.value?.data?.total_billing_amount || 0) : 0,
        });
        setRecentOrders(allOrders.slice(0, 5));
      } else if (role === 'MANAGER') {
        const [ordersRes, shipmentsRes, exceptionsRes] = await Promise.allSettled([
          orderService.getAllOrders({ limit: 200 }),
          shipmentService.getActiveShipments(),
          exceptionService.getOpenExceptions({}),
        ]);
        const allOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
        const allShipments = shipmentsRes.status === 'fulfilled' ? (shipmentsRes.value?.data || []) : [];
        setStats({
          pendingOrders: allOrders.filter(o => o.status === 'PLACED').length,
          activeShipments: allShipments.length,
          needRouting: allShipments.filter(s => s.status === 'IN_WAREHOUSE').length,
          openExceptions: exceptionsRes.status === 'fulfilled' ? (exceptionsRes.value?.data?.length || 0) : 0,
        });
        setRecentOrders(allOrders.slice(0, 5));
      } else if (role === 'WAREHOUSE_STAFF') {
        const [shipmentsRes, exceptionsRes] = await Promise.allSettled([
          shipmentService.getActiveShipments(),
          exceptionService.getOpenExceptions({}),
        ]);
        const shipments = shipmentsRes.status === 'fulfilled' ? (shipmentsRes.value?.data || []) : [];
        setStats({
          arrived: shipments.filter(s => s.status === 'ARRIVED_AT_WAREHOUSE').length,
          inWarehouse: shipments.filter(s => s.status === 'IN_WAREHOUSE').length,
          readyToDispatch: shipments.filter(s => s.status === 'ROUTED').length,
          exceptions: exceptionsRes.status === 'fulfilled' ? (exceptionsRes.value?.data?.length || 0) : 0,
        });
      } else if (role === 'DRIVER') {
        const [deliveriesRes, exceptionsRes] = await Promise.allSettled([
          shipmentService.getDriverDeliveries(),
          exceptionService.getOpenExceptions({}),
        ]);
        const deliveries = deliveriesRes.status === 'fulfilled' ? (deliveriesRes.value?.data || []) : [];
        setStats({
          totalAssigned: deliveries.length,
          pendingPickups: deliveries.filter(s => s.status === 'PENDING_PICKUP').length,
          inTransit: deliveries.filter(s => ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
          issuesReported: exceptionsRes.status === 'fulfilled' ? (exceptionsRes.value?.data?.length || 0) : 0,
        });
      } else if (role === 'CUSTOMER') {
        const [ordersRes] = await Promise.allSettled([orderService.getAllOrders({ limit: 200 })]);
        const allOrders = ordersRes.status === 'fulfilled' ? (ordersRes.value?.data || []) : [];
        setStats({
          totalOrders: allOrders.length,
          activeOrders: allOrders.filter(o => !['COMPLETED', 'CANCELLED', 'FAILED'].includes(o.status)).length,
          completed: allOrders.filter(o => o.status === 'COMPLETED').length,
          pending: allOrders.filter(o => o.status === 'PLACED').length,
        });
        setRecentOrders(allOrders.slice(0, 5));
      }
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatCards = () => {
    if (role === 'ADMIN') return [
      { label: 'Total Orders', value: stats.totalOrders || 0, color: 'blue' },
      { label: 'Active Shipments', value: stats.activeShipments || 0, color: 'green' },
      { label: 'Open Exceptions', value: stats.openExceptions || 0, color: 'red' },
      { label: 'Revenue (30d)', value: `₹${Math.round(stats.revenue || 0).toLocaleString()}`, color: 'emerald' },
    ];
    if (role === 'MANAGER') return [
      { label: 'Pending Orders', value: stats.pendingOrders || 0, color: 'blue' },
      { label: 'Active Shipments', value: stats.activeShipments || 0, color: 'green' },
      { label: 'Need Routing', value: stats.needRouting || 0, color: 'orange' },
      { label: 'Exceptions', value: stats.openExceptions || 0, color: 'red' },
    ];
    if (role === 'WAREHOUSE_STAFF') return [
      { label: 'Arrived', value: stats.arrived || 0, color: 'blue' },
      { label: 'In Warehouse', value: stats.inWarehouse || 0, color: 'green' },
      { label: 'Ready to Dispatch', value: stats.readyToDispatch || 0, color: 'orange' },
      { label: 'Exceptions', value: stats.exceptions || 0, color: 'red' },
    ];
    if (role === 'DRIVER') return [
      { label: 'Assigned', value: stats.totalAssigned || 0, color: 'blue' },
      { label: 'Pending Pickup', value: stats.pendingPickups || 0, color: 'orange' },
      { label: 'In Transit', value: stats.inTransit || 0, color: 'green' },
      { label: 'Issues Reported', value: stats.issuesReported || 0, color: 'red' },
    ];
    if (role === 'CUSTOMER') return [
      { label: 'My Orders', value: stats.totalOrders || 0, color: 'blue' },
      { label: 'Active', value: stats.activeOrders || 0, color: 'green' },
      { label: 'Completed', value: stats.completed || 0, color: 'emerald' },
      { label: 'Pending', value: stats.pending || 0, color: 'orange' },
    ];
    return [];
  };

  const getQuickActions = () => {
    if (role === 'ADMIN') return [
      { label: 'All Orders', subtitle: 'System-wide overview', path: '/orders' },
      { label: 'All Shipments', subtitle: 'Track everything', path: '/shipments' },
      { label: 'Exceptions', subtitle: 'Resolve issues', path: '/exceptions' },
      { label: 'Billing', subtitle: 'Invoices & reports', path: '/billing' },
    ];
    if (role === 'MANAGER') return [
      { label: 'Manage Orders', subtitle: 'Confirm & create shipments', path: '/orders' },
      { label: 'Shipments', subtitle: 'Route & monitor', path: '/shipments' },
      { label: 'Verify Proofs', subtitle: 'Check deliveries', path: '/delivery-proofs' },
      { label: 'Exceptions', subtitle: 'Resolve issues', path: '/exceptions' },
    ];
    if (role === 'WAREHOUSE_STAFF') return [
      { label: 'Warehouse', subtitle: 'Receive & dispatch', path: '/shipments' },
      { label: 'Upload Proof', subtitle: 'Receipt photos', path: '/delivery-proofs' },
      { label: 'Report Issue', subtitle: 'Flag problems', path: '/exceptions' },
    ];
    if (role === 'DRIVER') return [
      { label: 'My Deliveries', subtitle: 'View assignments', path: '/shipments' },
      { label: 'Upload Proof', subtitle: 'Delivery evidence', path: '/delivery-proofs' },
      { label: 'Report Issue', subtitle: 'Flag problems', path: '/exceptions' },
    ];
    if (role === 'CUSTOMER') return [
      { label: 'My Orders', subtitle: 'View & create orders', path: '/orders' },
      { label: 'Track Shipment', subtitle: 'Live tracking', path: '/shipments' },
    ];
    return [];
  };

  const roleLabels = { ADMIN: 'Admin', MANAGER: 'Manager', DRIVER: 'Driver', WAREHOUSE_STAFF: 'Staff', CUSTOMER: 'Customer' };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-greeting">{getGreeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="dashboard-meta">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            <span className="role-badge">{roleLabels[role]}</span>
            {user?.warehouse && <span className="warehouse-badge">{user.warehouse.name}</span>}
          </p>
        </div>
      </div>

      <div className="stat-cards">
        {getStatCards().map((card, i) => (
          <div key={i} className={`stat-card stat-card-${card.color}`}>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        {getQuickActions().map((action, i) => (
          <div key={i} className="quick-action-card" onClick={() => navigate(action.path)}>
            <div>
              <div className="qa-label">{action.label}</div>
              <div className="qa-subtitle">{action.subtitle}</div>
            </div>
            <span className="qa-arrow">&rarr;</span>
          </div>
        ))}
      </div>

      {recentOrders.length > 0 && (
        <div className="recent-orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <span className="view-all" onClick={() => navigate('/orders')}>View All &rarr;</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.order_id}>
                    <td className="order-number">{order.order_number}</td>
                    <td>{order.sender_name}</td>
                    <td>{order.receiver_name}</td>
                    <td>{order.pickup_city} &rarr; {order.delivery_city}</td>
                    <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
