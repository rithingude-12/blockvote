import React, { useState, useEffect } from 'react';
import { voterAPI } from '../services/api';
import VoterRegistration from './VoterRegistration';
import { Trash2, Edit, Plus, X } from 'lucide-react';

const VoterManager = () => {
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRegistration, setShowRegistration] = useState(false);
    const [editingVoter, setEditingVoter] = useState(null);
    const [editFormData, setEditFormData] = useState({ full_name: '', address: '', age: '', constituency_id: '' });

    const loadVoters = async () => {
        try {
            setLoading(true);
            const res = await voterAPI.getAll();
            setVoters(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load voters. Please ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVoters();
    }, [showRegistration]); // Reload when closing registration

    const handleDelete = async (id, name) => {
        if (window.confirm(`Are you sure you want to completely erase voter: ${name}?`)) {
            try {
                await voterAPI.delete(id);
                setVoters(voters.filter(v => v.id !== id));
            } catch (err) {
                alert('Failed to delete voter: ' + (err.response?.data?.detail || err.message));
            }
        }
    };

    const startEdit = (voter) => {
        setEditingVoter(voter);
        setEditFormData({
            full_name: voter.full_name,
            address: voter.address || '',
            age: voter.age,
            constituency_id: voter.constituency_id
        });
    };

    const handleEditChange = (e) => {
        setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await voterAPI.update(editingVoter.id, editFormData);
            setVoters(voters.map(v => v.id === editingVoter.id ? res.data : v));
            setEditingVoter(null);
        } catch (err) {
            alert('Failed to update voter: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (showRegistration) {
        return (
            <div className="animate-fade-in">
                <button
                    className="btn-secondary"
                    onClick={() => setShowRegistration(false)}
                    style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <X size={18} /> Back to Directory
                </button>
                <VoterRegistration />
            </div>
        );
    }

    return (
        <div className="glass-card animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>Voter Directory</h2>
                <button className="btn-primary" onClick={() => setShowRegistration(true)}>
                    <Plus size={18} /> Register Voter
                </button>
            </div>

            {error && <div className="error-text" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading records...</div>
            ) : Object.keys(voters).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No voters found.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '1rem' }}>Voter ID</th>
                                <th style={{ padding: '1rem' }}>Full Name</th>
                                <th style={{ padding: '1rem' }}>Age</th>
                                <th style={{ padding: '1rem' }}>Constituency</th>
                                <th style={{ padding: '1rem' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {voters.map(voter => (
                                <tr key={voter.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--primary)' }}>{voter.voter_id}</td>
                                    <td style={{ padding: '1rem' }}>{voter.full_name}</td>
                                    <td style={{ padding: '1rem' }}>{voter.age}</td>
                                    <td style={{ padding: '1rem' }}>{voter.constituency_id}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {voter.has_voted ? (
                                            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--secondary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>Voted</span>
                                        ) : (
                                            <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => startEdit(voter)} title="Edit Record">
                                            <Edit size={16} />
                                        </button>
                                        <button className="btn-secondary" style={{ padding: '0.5rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleDelete(voter.id, voter.full_name)} title="Remove Record">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editingVoter && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Edit Voter</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>ID: {editingVoter.voter_id}</p>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                                <input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditChange} className="input-glass" required />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Age</label>
                                    <input type="number" name="age" value={editFormData.age} onChange={handleEditChange} className="input-glass" required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Constituency ID</label>
                                    <input type="text" name="constituency_id" value={editFormData.constituency_id} onChange={handleEditChange} className="input-glass" required />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Mailing Address</label>
                                <input type="text" name="address" value={editFormData.address} onChange={handleEditChange} className="input-glass" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditingVoter(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoterManager;
