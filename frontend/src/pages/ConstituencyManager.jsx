import React, { useState, useEffect } from 'react';
import { electionAPI, candidateAPI } from '../services/api';
import { Plus, ArrowLeft, Users, MapPin } from 'lucide-react';

const ConstituencyManager = ({ electionId, onBack }) => {
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConstituency, setSelectedConstituency] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);

    // Form states
    const [newConstituency, setNewConstituency] = useState({ name: '', code: '' });
    const [newCandidate, setNewCandidate] = useState({ name: '', party: '', bio: '' });

    useEffect(() => {
        loadConstituencies();
    }, [electionId]);

    const loadConstituencies = async () => {
        try {
            setLoading(true);
            const res = await electionAPI.getConstituencies(electionId);
            setConstituencies(res.data);
            setError(null);
        } catch (err) {
            setError('Failed to load constituencies.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateConstituency = async (e) => {
        e.preventDefault();
        try {
            const data = { ...newConstituency, election_id: electionId };
            const res = await electionAPI.createConstituency(data);
            setConstituencies([...constituencies, res.data]);
            setNewConstituency({ name: '', code: '' });
        } catch (err) {
            alert('Failed to add constituency. Ensure election is not closed or active.');
        }
    };

    const loadCandidates = async (constituencyId) => {
        setSelectedConstituency(constituencyId);
        try {
            setLoadingCandidates(true);
            const res = await candidateAPI.getByConstituency(constituencyId);
            setCandidates(res.data);
        } catch (err) {
            console.error(err);
            setCandidates([]);
        } finally {
            setLoadingCandidates(false);
        }
    };

    const handleCreateCandidate = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...newCandidate,
                election_id: electionId,
                constituency_id: selectedConstituency
            };
            const res = await candidateAPI.create(data);
            setCandidates([...candidates, res.data]);
            setNewCandidate({ name: '', party: '', bio: '' });
        } catch (err) {
            alert('Failed to add candidate. Ensure election is not closed or active.');
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button className="btn-secondary" onClick={onBack} style={{ padding: '0.5rem', borderRadius: '50%' }}>
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ margin: 0 }}>Constituencies & Candidates</h2>
            </div>
            {error && <div className="error-text" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-1-1">

                {/* Constituencies Column */}
                <div>
                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={20} /> Add Constituency
                        </h3>
                        <form onSubmit={handleCreateConstituency} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Name (e.g. North District)"
                                className="input-glass"
                                style={{ flex: 2 }}
                                value={newConstituency.name}
                                onChange={e => setNewConstituency({ ...newConstituency, name: e.target.value })}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Code (e.g. ND01)"
                                className="input-glass"
                                style={{ flex: 1 }}
                                value={newConstituency.code}
                                onChange={e => setNewConstituency({ ...newConstituency, code: e.target.value })}
                                required
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
                                <Plus size={16} /> Add
                            </button>
                        </form>
                    </div>

                    <div className="glass-card">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Constituency List</h3>
                        {loading ? <p>Loading...</p> : constituencies.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No constituencies added yet.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {constituencies.map(c => (
                                    <div
                                        key={c.id}
                                        onClick={() => loadCandidates(c.id)}
                                        style={{
                                            padding: '1rem',
                                            background: selectedConstituency === c.id ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
                                            border: `1px solid ${selectedConstituency === c.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between'
                                        }}
                                    >
                                        <div>
                                            <strong>{c.name}</strong>
                                            <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>({c.code})</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Candidates Column */}
                <div>
                    {selectedConstituency ? (
                        <>
                            <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} /> Add Candidate
                                </h3>
                                <form onSubmit={handleCreateCandidate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        className="input-glass"
                                        value={newCandidate.name}
                                        onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Party (optional)"
                                        className="input-glass"
                                        value={newCandidate.party}
                                        onChange={e => setNewCandidate({ ...newCandidate, party: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Bio (optional)"
                                        className="input-glass"
                                        rows="2"
                                        value={newCandidate.bio}
                                        onChange={e => setNewCandidate({ ...newCandidate, bio: e.target.value })}
                                    />
                                    <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                                        <Plus size={16} style={{ marginRight: '0.5rem' }} /> Add Candidate
                                    </button>
                                </form>
                            </div>

                            <div className="glass-card">
                                <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Candidate List</h3>
                                {loadingCandidates ? <p>Loading candidates...</p> : candidates.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No candidates added to this constituency.</p> : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {candidates.map(cand => (
                                            <div key={cand.id} style={{ padding: '1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                                                <strong>{cand.name}</strong>
                                                {cand.party && <span style={{ marginLeft: '0.5rem', padding: '0.1rem 0.5rem', background: 'var(--primary-hover)', borderRadius: '4px', fontSize: '0.8rem' }}>{cand.party}</span>}
                                                {cand.bio && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{cand.bio}</p>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <p>Select a constituency to manage candidates.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ConstituencyManager;
