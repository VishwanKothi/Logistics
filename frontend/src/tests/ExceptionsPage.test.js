import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ExceptionsPage from '../pages/ExceptionsPage';

jest.mock('../services/exceptionService', () => ({ __esModule: true, default: { getOpenExceptions: jest.fn().mockResolvedValue({ data: [] }), resolveException: jest.fn(), createException: jest.fn() } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getActiveShipments: jest.fn().mockResolvedValue({ data: [] }) } }));

const renderExceptions = () => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'a@t.com', role: 'ADMIN', warehouse_id: null }));
  return render(<BrowserRouter><AuthProvider><ExceptionsPage /></AuthProvider></BrowserRouter>);
};

describe('ExceptionsPage', () => {
  beforeEach(() => localStorage.clear());
  test('renders page heading', async () => { renderExceptions(); await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exceptions')); });
  test('calls service on mount', async () => { const svc = require('../services/exceptionService').default; renderExceptions(); await waitFor(() => expect(svc.getOpenExceptions).toHaveBeenCalled()); });
});
