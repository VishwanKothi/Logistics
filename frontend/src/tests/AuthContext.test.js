import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

// Helper component to access context
const TestConsumer = () => {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.name : 'none'}</span>
      <span data-testid="token">{token || 'none'}</span>
      <button onClick={() => login({ name: 'Test', role: 'ADMIN' }, 'tok123')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initially has no user or token', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
  });

  test('login sets user and token', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => {
      screen.getByText('Login').click();
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Test');
    expect(screen.getByTestId('token')).toHaveTextContent('tok123');
  });

  test('login persists to localStorage', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => {
      screen.getByText('Login').click();
    });
    expect(localStorage.getItem('token')).toBe('tok123');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Test');
  });

  test('logout clears user and token', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    act(() => {
      screen.getByText('Login').click();
    });
    act(() => {
      screen.getByText('Logout').click();
    });
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('restores user from localStorage on mount', () => {
    localStorage.setItem('token', 'restored-tok');
    localStorage.setItem('user', JSON.stringify({ name: 'Restored', role: 'CUSTOMER' }));

    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user')).toHaveTextContent('Restored');
    expect(screen.getByTestId('token')).toHaveTextContent('restored-tok');
  });

  test('throws error when useAuth is used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
