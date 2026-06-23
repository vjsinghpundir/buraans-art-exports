import React, { useState } from 'react';

const API_URL = 'http://localhost:8000/api/admin/login';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token to sessionStorage
      sessionStorage.setItem('bae_admin_token', data.token);
      sessionStorage.setItem('bae_admin_user', JSON.stringify(data.admin));

      onLoginSuccess(data.token, data.admin);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Decorative background panels */}
      <div className="login-bg-panel left-panel">
        <div className="login-brand-showcase">
          <div className="brand-logo-mark">B</div>
          <h1>Buraans Art Exports</h1>
          <p>Premium Handcrafted Furniture</p>
          <div className="login-feature-list">
            <div className="login-feature-item">
              <span className="feature-icon">🪑</span>
              <span>Manage Furniture Inventory</span>
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">📦</span>
              <span>Track Bookings & Orders</span>
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">📊</span>
              <span>View Sales Analytics</span>
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">➕</span>
              <span>Add & Delete Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div className="login-form-header">
            <div className="login-logo-small">BAE</div>
            <h2>Admin Portal</h2>
            <p>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className="login-error-alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field-group">
              <label htmlFor="admin-username">Admin Username</label>
              <div className="login-input-wrapper">
                <span className="input-prefix-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  id="admin-username"
                  type="text"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field-group">
              <label htmlFor="admin-password">Password</label>
              <div className="login-input-wrapper">
                <span className="input-prefix-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`login-submit-btn ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="btn-spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In to Admin Panel'
              )}
            </button>
          </form>

          <div className="login-footer-note">
            <p>🔒 Secured with JWT Authentication</p>
            <p>Buraans Art Exports &copy; 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
