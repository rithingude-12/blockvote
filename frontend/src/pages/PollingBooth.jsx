import React, { useState } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { votingAPI, candidateAPI } from '../services/api';
import { Fingerprint, CheckCircle2, ShieldAlert } from 'lucide-react';

const PollingBooth = () => {
    const [step, setStep] = useState(1); // 1: Welcome, 2: Face Scan, 3: Confirm Identity, 4: Vote, 5: Success
    const [authMethod, setAuthMethod] = useState('face'); // 'face' or 'fingerprint'
    const [isScanning, setIsScanning] = useState(false);
    const [authData, setAuthData] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [fingerprintBase64, setFingerprintBase64] = useState(null);
    const [manualVoterId, setManualVoterId] = useState('');

    const handleFaceCapture = async (imageSrc) => {
        setIsScanning(true);
        setError(null);
        try {
            // 1:N search, voter_id is optional
            const res = await votingAPI.authenticateFace({
                face_image_base64: imageSrc,
                polling_station: "Web Client"
            });
            setAuthData(res.data);
            setStep(3);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || "Authentication failed. Face not recognized.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleFingerprintAuth = async () => {
        if (!manualVoterId || !fingerprintBase64) {
            setError("Both Voter ID and fingerprint image are required for fallback auth.");
            return;
        }
        setIsScanning(true);
        setError(null);
        try {
            const res = await votingAPI.authenticateFingerprint({
                voter_id: manualVoterId,
                fingerprint_image_base64: fingerprintBase64,
                polling_station: "Web Client"
            });
            setAuthData(res.data);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.detail || "Authentication failed. Fingerprint not matched or bad ID.");
        } finally {
            setIsScanning(false);
        }
    };

    const handleFingerprintUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFingerprintBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmIdentity = async () => {
        try {
            const res = await candidateAPI.getByConstituency(authData.voter_details.constituency_id);
            setCandidates(res.data);
            setStep(4);
        } catch (err) {
            setError("Failed to load candidates for your constituency.");
        }
    };

    const castVote = async () => {
        if (!selectedCandidate) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await votingAPI.castVote({
                voter_id: authData.voter_details.id,
                election_id: selectedCandidate.election_id,
                candidate_id: selectedCandidate.id,
                constituency_id: authData.voter_details.constituency_id,
                session_id: authData.session_id
            });
            setReceipt(res.data.transaction_hash);
            setStep(5);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to cast vote.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>

            {step === 1 && (
                <div className="animate-fade-in">
                    <Fingerprint size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome to BlockVote System</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Secure, anonymous, and immutable blockchain voting tied to biometric identity.
                    </p>
                    <button className="btn-primary" onClick={() => setStep(2)}>
                        Begin Facial Authentication
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <button className={`btn-secondary ${authMethod === 'face' ? 'active-tab' : ''}`} style={{ borderColor: authMethod === 'face' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }} onClick={() => { setAuthMethod('face'); setError(null); }}>
                            1:N Facial Scan
                        </button>
                        <button className={`btn-secondary ${authMethod === 'fingerprint' ? 'active-tab' : ''}`} style={{ borderColor: authMethod === 'fingerprint' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }} onClick={() => { setAuthMethod('fingerprint'); setError(null); }}>
                            2FA Fingerprint (Fallback)
                        </button>
                    </div>

                    <h3 style={{ marginBottom: '1.5rem' }}>{authMethod === 'face' ? 'Scan Face to Proceed' : 'Submit Fallback Fingerprint'}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {authMethod === 'face'
                            ? 'Please position your face in the center of the camera. The system will automatically identify you.'
                            : 'Provide your unique National Voter ID and a high-resolution fingerprint file.'
                        }
                    </p>

                    {authMethod === 'face' ? (
                        <WebcamCapture onCapture={handleFaceCapture} isScanning={isScanning} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                            <input
                                type="text"
                                placeholder="Enter National Voter ID"
                                className="input-glass"
                                value={manualVoterId}
                                onChange={e => setManualVoterId(e.target.value)}
                            />
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fingerprint Scanner Stream (.jpg / .png)</label>
                                <input type="file" accept="image/*" className="input-glass" onChange={handleFingerprintUpload} />
                                {fingerprintBase64 && <div style={{ color: 'var(--success)', marginTop: '0.5rem', fontSize: '0.85rem' }}>✓ Biometric template loaded into memory.</div>}
                            </div>
                            <button className="btn-primary" onClick={handleFingerprintAuth} disabled={isScanning || !fingerprintBase64 || !manualVoterId}>
                                {isScanning ? 'Verifying Neural Match...' : 'Authenticate Blockchain Voter ID'}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <ShieldAlert size={20} />
                            {error}
                        </div>
                    )}
                </div>
            )}

            {step === 3 && authData && (
                <div className="animate-fade-in">
                    <CheckCircle2 size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
                    <h3 style={{ marginBottom: '1.5rem' }}>Identity Verified</h3>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', marginBottom: '2rem' }}>
                        <p style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> {authData.voter_details.full_name}</p>
                        <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}><strong>Blockchain ID:</strong> {authData.voter_details.blockchain_voter_id.substring(0, 16)}...</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button className="btn-secondary" onClick={() => setStep(1)}>Not You?</button>
                        <button className="btn-primary" onClick={confirmIdentity}>Confirm & Proceed to Ballot</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="animate-fade-in">
                    <h3 style={{ marginBottom: '1.5rem' }}>Official Ballot</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Select one candidate. Once a vote is cast on the blockchain, it cannot be changed.
                    </p>

                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                        {candidates.map(c => (
                            <div
                                key={c.id}
                                onClick={() => setSelectedCandidate(c)}
                                style={{
                                    padding: '1.5rem',
                                    border: `2px solid ${selectedCandidate?.id === c.id ? 'var(--primary)' : 'var(--glass-border)'}`,
                                    borderRadius: '12px',
                                    background: selectedCandidate?.id === c.id ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'left'
                                }}
                            >
                                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{c.name}</div>
                                <div style={{ color: 'var(--text-muted)' }}>{c.party}</div>
                                {c.bio && <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#CBD5E1' }}>{c.bio}</div>}
                            </div>
                        ))}
                        {candidates.length === 0 && <p>No candidates available for this constituency.</p>}
                    </div>

                    <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                        onClick={castVote}
                        disabled={!selectedCandidate || isSubmitting}
                    >
                        {isSubmitting ? 'Recording on Blockchain...' : 'Securely Cast Vote'}
                    </button>
                </div>
            )
            }

            {
                step === 5 && (
                    <div className="animate-fade-in">
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <CheckCircle2 size={48} color="var(--success)" />
                        </div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--success)' }}>Vote Successfully Recorded</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Your anonymous vote has been immutably written to the Ethereum network.
                        </p>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderLeft: '4px solid var(--primary)', borderRadius: '0 8px 8px 0', textAlign: 'left', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Transaction Hash:</span><br />
                            {receipt}
                        </div>

                        <button className="btn-secondary" style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>
                            Finish
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default PollingBooth;
