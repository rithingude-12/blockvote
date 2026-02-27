import React, { useState, useEffect } from 'react';
import WebcamCapture from '../components/WebcamCapture';
import { voterAPI, electionAPI } from '../services/api';
import { UserPlus, Save, CheckCircle } from 'lucide-react';

const VoterRegistration = () => {
    const [method, setMethod] = useState('face'); // face or manual (for test)
    const [voterData, setVoterData] = useState({
        voter_id: '',
        full_name: '',
        address: '',
        age: '',
        constituency_id: ''
    });
    const [faceImage, setFaceImage] = useState(null);
    const [fingerprintImage, setFingerprintImage] = useState(null);
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Fetch elections and their constituencies on load
    useEffect(() => {
        const fetchConstituencies = async () => {
            try {
                // First get all elections
                const electionsRes = await electionAPI.getAll();
                const allConstituencies = [];

                // For each election, fetch its constituencies mapping
                for (const election of electionsRes.data) {
                    try {
                        const constRes = await electionAPI.getConstituencies(election.id);
                        // Add context to know which election it belongs to
                        const mapped = constRes.data.map(c => ({
                            ...c,
                            electionName: election.name
                        }));
                        allConstituencies.push(...mapped);
                    } catch (err) {
                        console.error(`Failed to load constituencies for ${election.id}`, err);
                    }
                }
                setConstituencies(allConstituencies);
            } catch (err) {
                console.error('Failed to load elections', err);
            }
        };

        fetchConstituencies();
    }, []);

    const handleCapture = (imgSrc) => {
        setFaceImage(imgSrc);
    };

    const handleFingerprintUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFingerprintImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!faceImage) {
            setError('Please capture a face image first.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await voterAPI.register({
                ...voterData,
                face_image_base64: faceImage,
                fingerprint_image_base64: fingerprintImage || null // Optional Fallback
            });
            setSuccess(`Voter ${voterData.full_name} successfully registered with biometric signature.`);
            // Reset
            setVoterData({ voter_id: '', full_name: '', address: '', age: '', constituency_id: '' });
            setFaceImage(null);
            setFingerprintImage(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to register voter.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <UserPlus size={32} color="var(--primary)" />
                <h2>Voter Registration Portal</h2>
            </div>

            {success && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} /> {success}</div>}
            {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</div>}

            <div className="responsive-grid responsive-grid-1-1">
                <div>
                    <h3 style={{ marginBottom: '1rem' }}>1. Biometric Capture</h3>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                        {faceImage ? (
                            <div>
                                <img src={faceImage} alt="Captured Face" style={{ width: '100%', borderRadius: '8px', marginBottom: '1rem' }} />
                                <button className="btn-secondary" onClick={() => setFaceImage(null)}>Recapture</button>
                            </div>
                        ) : (
                            <WebcamCapture onCapture={handleCapture} isScanning={false} />
                        )}

                        <div style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '10px' }}>Fingerprint Fallback (Optional)</h4>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                                Upload a simulated fingerprint image for 2FA fallback casting.
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFingerprintUpload}
                                className="input-glass"
                                style={{ fontSize: '0.9rem' }}
                            />
                            {fingerprintImage && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '10px' }}>
                                    ✓ Fingerprint securely loaded
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ marginBottom: '1rem' }}>2. Voter Details</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="Unique Voter ID (e.g. V-12345)"
                            value={voterData.voter_id}
                            onChange={e => setVoterData({ ...voterData, voter_id: e.target.value })}
                            required
                        />
                        <input
                            type="text"
                            className="input-glass"
                            placeholder="Full Legal Name"
                            value={voterData.full_name}
                            onChange={e => setVoterData({ ...voterData, full_name: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            className="input-glass"
                            placeholder="Age"
                            min="18"
                            value={voterData.age}
                            onChange={e => setVoterData({ ...voterData, age: e.target.value })}
                            required
                        />
                        <textarea
                            className="input-glass"
                            placeholder="Registered Address"
                            rows="3"
                            value={voterData.address}
                            onChange={e => setVoterData({ ...voterData, address: e.target.value })}
                            required
                        ></textarea>

                        <select
                            className="input-glass"
                            value={voterData.constituency_id}
                            onChange={e => setVoterData({ ...voterData, constituency_id: e.target.value })}
                            required
                        >
                            <option value="">Select Constituency...</option>
                            {constituencies.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.code}) - {c.electionName}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="btn-primary" disabled={loading || !faceImage} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Save size={18} />
                            {loading ? 'Registering on Blockchain...' : 'Securely Register Voter'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VoterRegistration;
