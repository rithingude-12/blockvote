import React, { useState, useEffect } from 'react';
import { electionAPI, candidateAPI } from '../services/api';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AuditViewer = ({ electionId, onBack }) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                // Fetch both results and candidates in parallel
                const [resultsRes, candidatesRes] = await Promise.all([
                    electionAPI.getResults(electionId),
                    candidateAPI.getByElection(electionId)
                ]);

                // Create a map of candidate IDs to names for O(1) lookup
                const candidateMap = {};
                candidatesRes.data.forEach(c => {
                    candidateMap[c.id] = c.name;
                });

                // Map the results to include the candidate's real name instead of their ID
                const mappedResults = resultsRes.data.map(r => ({
                    ...r,
                    candidate_name: candidateMap[r.candidate_id] || r.candidate_id // Fallback to ID if name not found
                }));

                setResults(mappedResults);
                setError(null);
            } catch (err) {
                setError('Failed to securely fetch election tallies.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [electionId]);

    // Calculate total for percentages
    const totalVotes = results.reduce((sum, item) => sum + item.vote_count, 0);

    return (
        <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
            <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowLeft size={18} /> Return to Control Matrix
            </button>

            <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <BarChart2 size={32} color="var(--primary)" />
                    <h2 style={{ margin: 0 }}>Decentralized Tally Analytics</h2>
                </div>

                {error && <div className="error-text" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Decrypting network ledgers...</div>
                ) : results.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No immutable votes have been registered yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Total Verified Participants</h4>
                            <p style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{totalVotes}</p>
                        </div>

                        <div style={{ width: '100%', height: 400, marginTop: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem 1rem 1rem 0', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={results.map(r => ({ name: r.candidate_name, votes: r.vote_count })).sort((a, b) => b.votes - a.votes)}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} />
                                    <YAxis dataKey="name" type="category" width={100} stroke="var(--text-muted)" tick={{ fill: 'var(--text-main)', fontFamily: 'Outfit', fontSize: '0.85rem' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-main)' }}
                                        itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        formatter={(value) => [`${value} votes`, 'Tally']}
                                    />
                                    <Bar dataKey="votes" radius={[0, 4, 4, 0]} animationDuration={1500}>
                                        {results.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--secondary)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditViewer;
