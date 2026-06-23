import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import LoginPage from './LoginPage.jsx';
import AdminPanel from './AdminPanel.jsx';
import BillingPanel from './BillingPanel.jsx';
import Create_bill from './Create_bill.jsx';
import Show_all from './Show_all.jsx';
import Edit_bill from './Edit_bill.jsx';

function AdminRoute() {
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'loggedIn' | 'loggedOut'
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('bae_admin_token');
    const savedAdmin = sessionStorage.getItem('bae_admin_user');

    if (token && savedAdmin) {
      // Verify token with backend
      fetch('http://localhost:8000/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) {
            setAdmin(JSON.parse(savedAdmin));
            setAuthState('loggedIn');
          } else {
            sessionStorage.removeItem('bae_admin_token');
            sessionStorage.removeItem('bae_admin_user');
            setAuthState('loggedOut');
          }
        })
        .catch(() => {
          // If backend is unreachable, use stored token
          setAdmin(JSON.parse(savedAdmin));
          setAuthState('loggedIn');
        });
    } else {
      setAuthState('loggedOut');
    }
  }, []);

  const handleLoginSuccess = (token, adminData) => {
    setAdmin(adminData);
    setAuthState('loggedIn');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bae_admin_token');
    sessionStorage.removeItem('bae_admin_user');
    setAdmin(null);
    setAuthState('loggedOut');
  };

  if (authState === 'checking') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0f0e0d',
        flexDirection: 'column',
        gap: '1rem',
        fontFamily: 'Outfit, sans-serif',
        color: '#a5a198',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #2c2825',
          borderTop: '3px solid #d4a373',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p>Verifying session...</p>
      </div>
    );
  }

  if (authState === 'loggedOut') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminPanel admin={admin} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Furniture Store */}
        <Route path="/" element={<App />} />
        {/* Admin: Login + Panel */}
        <Route path="/admin" element={<AdminRoute />} />
        {/* Billing Routes */}
        <Route path="/BillingPanel" element={<BillingPanel />} />
        <Route path="/Create_bill" element={<Create_bill />} />
        <Route path="/Show_all" element={<Show_all />} />
        <Route path="/Edit_bill/:id" element={<Edit_bill />} />
        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
