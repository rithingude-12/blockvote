import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import ElectionManager from './ElectionManager';
import VoterManager from './VoterManager';
import { Users, Vote, LogOut } from 'lucide-react';

const AdminDashboard = () => {
    const [admin, setAdmin] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const res = await authAPI.getMe();
                setAdmin(res.data);
            } catch (err) {
                localStorage.removeItem('token');
                navigate('/admin/login');
            }
        };
        fetchAdmin();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    if (!admin) return <div>Loading Admin Dashboard...</div>;

    return (
        <div style={{ display: 'flex', gap: '2rem' }}>
            <aside className="glass-card" style={{ width: '250px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
                <h3 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Admin Menu</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Logged in as: {admin.username}</p>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <Link to="/admin/dashboard/elections" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Vote size={18} /> Elections
                    </Link>
                    <Link to="/admin/dashboard/voters" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Users size={18} /> Voters
                    </Link>
                </nav>

                <button className="btn-secondary" onClick={handleLogout} style={{ border: '1px solid var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            <main style={{ flex: 1 }}>
                <Routes>
                    <Route path="elections" element={<ElectionManager />} />
                    <Route path="voters" element={<VoterManager />} />
                    <Route path="*" element={<ElectionManager />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminDashboard;
