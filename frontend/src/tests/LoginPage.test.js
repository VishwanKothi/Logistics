import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';

// Mock the API module
jest.mock('../services/api', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return { __esModule: true, default: mockAxios };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form with email and password fields', () => {
    renderLoginPage();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('renders demo account buttons', () => {
    renderLoginPage();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getAllByText(/Manager/).length).toBeGreaterThan(0);
  });

  test('demo account button fills email and password', () => {
    renderLoginPage();
    fireEvent.click(screen.getByText('Admin'));
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue('admin@example.com');
    expect(screen.getByPlaceholderText(/enter password/i)).toHaveValue('password123');
  });

  test('shows error on failed login', async () => {
    const api = require('../services/api').default;
    api.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid password' } },
    });

    renderLoginPage();
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/enter password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid password')).toBeInTheDocument();
    });
  });

  test('successful login calls navigate to dashboard', async () => {
    const api = require('../services/api').default;
    api.post.mockResolvedValueOnce({
      data: {
        token: 'test-token-123',
        user: { user_id: 1, name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
      },
    });

    renderLoginPage();
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/enter password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('renders brand logo and title', () => {
    renderLoginPage();
    expect(screen.getByText('Logistics Hub')).toBeInTheDocument();
    expect(screen.getByText(/sign in to manage operations/i)).toBeInTheDocument();
  });
});
