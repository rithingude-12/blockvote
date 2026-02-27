import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import PollingBooth from './pages/PollingBooth';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

const Navbar = () => (
    <nav className="navbar">
        <Link to="/" className="nav-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            BlockVote
        </Link>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}>Admin Access</Link>
        </div>
    </nav>
);

const App = () => {
    return (
        <BrowserRouter>
            <div className="app-container">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<PollingBooth />} />
                        <Route path="/admin/login" element={<Login />} />
                        <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
                <footer style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)' }}>
                    &copy; 2026 BlockVote Inc. Ethereum Blockchain Network. Security Level: Maximum.
                </footer>
            </div>
        </BrowserRouter>
    );
};

export default App;
