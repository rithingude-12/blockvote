import React, { useState, useEffect } from 'react';
import { electionAPI } from '../services/api';
import { Vote, Plus, Settings, PlayCircle, StopCircle, Edit, Trash2, PieChart } from 'lucide-react';
import AuditViewer from './AuditViewer';
import ConstituencyManager from './ConstituencyManager';

const ElectionManager = () => {
    const [elections, setElections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newElection, setNewElection] = useState({ name: '', description: '' });

    // Modals
    const [editingElection, setEditingElection] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', description: '' });
    const [viewingResults, setViewingResults] = useState(null); // stores election ID to view results
    const [managingElection, setManagingElection] = useState(null); // stores election ID to manage constituencies

    const loadElections = async () => {
        try {
            setLoading(true);
            const res = await electionAPI.getAll();
            setElections(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load elections.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadElections();
    }, []);

    const handleCreateElection = async (e) => {
        e.preventDefault();
        try {
            const res = await electionAPI.create(newElection);
            setElections([...elections, res.data]);
            setNewElection({ name: '', description: '' });
        } catch (err) {
            alert('Failed to construct election: ' + (err.response?.data?.detail || err.message));
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            if (currentStatus === 'draft' || currentStatus === 'configured') {
                // For demo, we might need it to be configured first, but let's assume direct start or error
                await electionAPI.start(id);
                setElections(elections.map(e => e.id === id ? { ...e, status: 'active' } : e));
            } else if (currentStatus === 'active') {
                await electionAPI.close(id);
                setElections(elections.map(e => e.id === id ? { ...e, status: 'ended' } : e));
            }
        } catch (err) {
            alert('Status update failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`WARNING: Are you sure you want to permanently delete election "${name}"? All associated data will be lost.`)) {
            try {
                await electionAPI.delete(id);
                setElections(elections.filter(e => e.id !== id));
            } catch (err) {
                alert('Deletion failed: ' + (err.response?.data?.detail || err.message));
            }
        }
    };

    const startEdit = (election) => {
        setEditingElection(election);
        setEditFormData({
            name: election.name,
            description: election.description || ''
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await electionAPI.update(editingElection.id, editFormData);
            setElections(elections.map(el => el.id === editingElection.id ? res.data : el));
            setEditingElection(null);
        } catch (err) {
            alert('Update failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    if (viewingResults) {
        return <AuditViewer electionId={viewingResults} onBack={() => setViewingResults(null)} />
    }

    if (managingElection) {
        return <ConstituencyManager electionId={managingElection} onBack={() => setManagingElection(null)} />
    }

    return (
        <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Vote size={32} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Election Management</h2>
                </div>
            </div>

            {error && <div className="error-text" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-2-1">

                {/* Create Form */}
                <div className="glass-card" style={{ height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Create Election</h3>
                    <form onSubmit={handleCreateElection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Election Name (e.g. 2026 Presidential)"
                            className="input-glass"
                            value={newElection.name}
                            onChange={e => setNewElection({ ...newElection, name: e.target.value })}
                            required
                        />
                        <textarea
                            placeholder="Description"
                            className="input-glass"
                            rows="4"
                            value={newElection.description}
                            onChange={e => setNewElection({ ...newElection, description: e.target.value })}
                        />
                        <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', gap: '0.5rem' }}>
                            <Plus size={18} /> Create Election
                        </button>
                    </form>
                </div>

                {/* List View */}
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Elections List</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading elections...</div>
                        ) : elections.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No elections found.</p>
                            </div>
                        ) : elections.map(election => (
                            <div key={election.id} className="glass-card" style={{ padding: '1.5rem', transition: 'all 0.2s', position: 'relative' }}>

                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none' }} onClick={() => startEdit(election)} title="Edit Election">
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger)' }} onClick={() => handleDelete(election.id, election.name)} title="Delete Election">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div style={{ marginBottom: '1.5rem', paddingRight: '4rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h4 style={{ fontSize: '1.3rem', margin: 0 }}>{election.name}</h4>
                                        <span style={{
                                            padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                                            background: election.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : election.status === 'ended' ? 'rgba(79, 70, 229, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                            color: election.status === 'active' ? 'var(--success)' : election.status === 'ended' ? 'var(--primary-hover)' : 'var(--warning)',
                                            border: `1px solid ${election.status === 'active' ? 'var(--success)' : election.status === 'ended' ? 'var(--primary-hover)' : 'var(--warning)'}40`
                                        }}>
                                            {election.status}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>{election.description}</p>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>

                                    {(election.status === 'draft' || election.status === 'configured') && (
                                        <button className="btn-primary" onClick={() => toggleStatus(election.id, election.status)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', background: 'var(--success)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
                                            <PlayCircle size={16} /> Start Election
                                        </button>
                                    )}

                                    {election.status === 'active' && (
                                        <button className="btn-secondary" onClick={() => toggleStatus(election.id, election.status)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                            <StopCircle size={16} /> Close Election
                                        </button>
                                    )}

                                    <button className="btn-secondary" onClick={() => setViewingResults(election.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem' }}>
                                        <PieChart size={16} /> View Results
                                    </button>

                                    <button className="btn-secondary" onClick={() => setManagingElection(election.id)} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '0.5rem' }}>
                                        <Settings size={16} /> Constituencies & Candidates
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingElection && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Edit Election</h3>

                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Name</label>
                                <input type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="input-glass" required />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Description</label>
                                <textarea rows="4" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} className="input-glass" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditingElection(null)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElectionManager;
