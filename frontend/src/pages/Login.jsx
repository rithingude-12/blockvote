import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Shield, Lock } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await authAPI.login({ username, password });
            localStorage.setItem('token', res.data.access_token);
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
            <Shield size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ marginBottom: '2rem' }}>Admin Portal Login</h2>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                    type="text"
                    placeholder="Username"
                    className="input-glass"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="input-glass"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    <Lock size={18} />
                    {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;
