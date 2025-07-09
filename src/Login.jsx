import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const Login = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: 400,
      background: 'rgba(36, 37, 46, 0.95)',
      borderRadius: '18px',
      boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
      padding: '2.5rem 2rem',
      margin: '2rem auto',
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: 700,
        margin: '0 0 1.5rem 0',
        textAlign: 'center',
        color: '#f3f4f6'
      }}>
        Welcome Back
      </h2>
      
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '1rem',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: '#f3f4f6'
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              background: 'rgba(17, 24, 39, 0.8)',
              color: '#f3f4f6',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="Enter your email"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            marginBottom: '0.5rem',
            color: '#f3f4f6'
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(156, 163, 175, 0.3)',
              background: 'rgba(17, 24, 39, 0.8)',
              color: '#f3f4f6',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, #6366f1 0%, #818cf8 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div style={{
        textAlign: 'center',
        marginTop: '1.5rem',
        color: '#9ca3af'
      }}>
        Don't have an account?{' '}
        <button
          onClick={onSwitchToRegister}
          style={{
            background: 'none',
            border: 'none',
            color: '#818cf8',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontWeight: 600
          }}
        >
          Sign up
        </button>
      </div>
    </div>
  );
};

export default Login; 