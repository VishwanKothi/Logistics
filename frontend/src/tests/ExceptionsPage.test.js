import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ExceptionsPage from '../pages/ExceptionsPage';

jest.mock('../services/exceptionService', () => ({ __esModule: true, default: { getOpenExceptions: jest.fn(), resolveException: jest.fn(), createException: jest.fn() } }));
jest.mock('../services/shipmentService', () => ({ __esModule: true, default: { getActiveShipments: jest.fn() } }));

const renderExceptions = () => {
  localStorage.setItem('token', 'tk');
  localStorage.setItem('user', JSON.stringify({ user_id: 1, name: 'Admin', email: 'a@t.com', role: 'ADMIN', warehouse_id: null }));
  return render(<BrowserRouter><AuthProvider><ExceptionsPage /></AuthProvider></BrowserRouter>);
};

describe('ExceptionsPage', () => {
  const exceptionSvc = require('../services/exceptionService').default;
  const shipmentSvc = require('../services/shipmentService').default;

  beforeEach(() => {
    localStorage.clear();
    exceptionSvc.getOpenExceptions.mockResolvedValue({ data: [] });
    shipmentSvc.getActiveShipments.mockResolvedValue({ data: [] });
  });

  test('renders page heading', async () => { const { container } = renderExceptions(); await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exceptions')); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
  test('calls service on mount', async () => { const { container } = renderExceptions(); await waitFor(() => expect(exceptionSvc.getOpenExceptions).toHaveBeenCalled()); await waitFor(() => expect(container.querySelector('.spinner')).not.toBeInTheDocument()); });
});
