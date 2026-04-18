import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-page">
      <div>
        <div className="not-found-code">404</div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--gray-800)', marginBottom: 12 }}>Page Not Found</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 32, fontSize: 16 }}>The page you're looking for doesn't exist.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
