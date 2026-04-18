import React, { useState, useEffect } from 'react';
import billingService from '../services/billingService';

const BillingPage = () => {
  const [report, setReport] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportRes, invoicesRes] = await Promise.all([
        billingService.getWeeklyReport(),
        billingService.getInvoicesByStatus(statusFilter),
      ]);
      setReport(reportRes.data);
      setInvoices(invoicesRes.data || []);
    } catch (error) { console.error('Error:', error); } finally { setLoading(false); }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-header"><h1>Billing &amp; Invoices</h1></div>

      {report && (
        <div className="stat-cards">
          <div className="stat-card stat-card-blue"><div className="stat-value">{report.total_shipments}</div><div className="stat-label">Total Shipments</div></div>
          <div className="stat-card stat-card-green"><div className="stat-value">{report.delivered_count}</div><div className="stat-label">Delivered</div></div>
          <div className="stat-card stat-card-red"><div className="stat-value">{report.failed_count}</div><div className="stat-label">Failed</div></div>
          <div className="stat-card stat-card-emerald"><div className="stat-value">₹{Math.round(report.total_billing_amount).toLocaleString()}</div><div className="stat-label">Total Billing</div></div>
        </div>
      )}

      <div className="section-header" style={{ marginTop: '2rem' }}>
        <h2>Invoices</h2>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="SENT">Sent</option>
          <option value="PAID">Paid</option><option value="OVERDUE">Overdue</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead><tr><th>Invoice #</th><th>Sender</th><th>Amount</th><th>Tax</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.invoice_id}>
                <td className="order-number">{inv.invoice_number}</td>
                <td>{inv.sender_name}</td>
                <td>₹{inv.amount?.toFixed(2)}</td>
                <td>₹{inv.tax_amount?.toFixed(2)}</td>
                <td className="amount-cell">₹{inv.total_amount?.toFixed(2)}</td>
                <td><span className={`status-badge status-${inv.status?.toLowerCase()}`}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillingPage;
