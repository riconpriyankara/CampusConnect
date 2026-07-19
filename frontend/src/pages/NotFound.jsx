import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        color: 'var(--ink)',
      }}
      className="animate-fade"
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--signal)', letterSpacing: '0.05em', marginBottom: '1.5rem' }}>
        — 404 —
      </div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.015em' }}>
        Registry Index Unresolved
      </h2>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '2.5rem', maxWidth: '340px' }}>
        THE SYSTEM REQUESTED PATH WAS NOT DETECTED IN THE DIRECTORY SYSTEM. PLEASE RE-ROUTE.
      </p>
      
      <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={16} weight="regular" />
        <span>Return to Main Directory</span>
      </button>
    </div>
  );
};

export default NotFound;
