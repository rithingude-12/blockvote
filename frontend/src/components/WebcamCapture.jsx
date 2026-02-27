import React, { useRef, useState, useCallback } from 'react';

const WebcamCapture = ({ onCapture, isScanning }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    frameRate: { ideal: 60, min: 30 }
                }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Camera access denied or unavailabe");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageSrc = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(imageSrc);
        }
    }, [onCapture]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    return (
        <div className="webcam-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {error && <div className="error-text" style={{ color: 'var(--danger)' }}>{error}</div>}

            <div
                className={`video-wrapper ${isScanning ? 'scanning-active' : ''}`}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '300px',
                    backgroundColor: '#000',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '2px solid var(--glass-border)',
                    position: 'relative'
                }}
            >
                {!stream && !error && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>
                        Camera off
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: stream ? 'block' : 'none' }}
                />
                {isScanning && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: 'var(--secondary)',
                        boxShadow: '0 0 10px var(--secondary)',
                        animation: 'scan-line 2s linear infinite',
                        willChange: 'transform'
                    }} />
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: '1rem' }}>
                {!stream ? (
                    <button type="button" className="btn-secondary" onClick={startCamera}>Start Camera</button>
                ) : (
                    <>
                        <button type="button" className="btn-primary" onClick={capture} disabled={isScanning}>
                            {isScanning ? 'Scanning...' : 'Capture Image'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={stopCamera}>Turn Off</button>
                    </>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes scan-line {
          0% { transform: translateY(0); }
          50% { transform: translateY(300px); }
          100% { transform: translateY(0); }
        }
      `}} />
        </div>
    );
};

export default WebcamCapture;
