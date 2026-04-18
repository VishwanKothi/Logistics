import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const renderSidebar = (role = 'ADMIN') => {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Test User', email: 'test@test.com', role, warehouse: null }));
  return render(<BrowserRouter><AuthProvider><Sidebar /></AuthProvider></BrowserRouter>);
};

describe('Sidebar', () => {
  beforeEach(() => localStorage.clear());

  test('renders brand logo', () => {
    renderSidebar();
    expect(screen.getByText('Logistics')).toBeInTheDocument();
  });

  test('renders Dashboard link', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders admin nav items', () => {
    renderSidebar('ADMIN');
    expect(screen.getByText('All Orders')).toBeInTheDocument();
    expect(screen.getByText('Billing')).toBeInTheDocument();
  });

  test('renders customer nav items without Billing', () => {
    renderSidebar('CUSTOMER');
    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.queryByText('Billing')).not.toBeInTheDocument();
  });

  test('renders driver nav items', () => {
    renderSidebar('DRIVER');
    expect(screen.getByText('My Deliveries')).toBeInTheDocument();
  });

  test('renders user initials', () => {
    renderSidebar();
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  test('renders user name', () => {
    renderSidebar();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  test('does not render when not logged in', () => {
    localStorage.clear();
    const { container } = render(<BrowserRouter><AuthProvider><Sidebar /></AuthProvider></BrowserRouter>);
    expect(container.querySelector('.sidebar')).not.toBeInTheDocument();
  });
});
