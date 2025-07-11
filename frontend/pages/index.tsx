import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  'Real-time Messaging',
  'Secure & Private',
  'Modern UI/UX',
  'Group Chats',
  'Media Sharing',
  'Fast & Reliable',
];

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);

  // Animated feature cycling
  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => {
        setFeatureIdx((idx) => (idx + 1) % FEATURES.length);
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // Check login and extract email from JWT
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setEmail(payload.email);
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setEditMode(false);
    setTimeout(() => setSuccess(false), 2000);
    // TODO: Call backend to update profile when endpoint is ready
  };

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #ede9fe 0%, #f3f4f6 100%)' }}>
        {/* Animated background blobs */}
        <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: 320, height: 320, background: 'radial-gradient(circle at 60% 40%, #a78bfa 0%, #ede9fe 100%)', borderRadius: '50%', filter: 'blur(32px)', opacity: 0.6, zIndex: 0, animation: 'float1 8s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: 260, height: 260, background: 'radial-gradient(circle at 40% 60%, #6366f1 0%, #ede9fe 100%)', borderRadius: '50%', filter: 'blur(32px)', opacity: 0.5, zIndex: 0, animation: 'float2 10s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', zIndex: 2, width: '100%', maxWidth: 480 }}>
          {/* Animated Logo/Title */}
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            letterSpacing: 2,
            textAlign: 'center',
            color: '#7c3aed',
            textShadow: '0 4px 32px #a78bfa44',
            marginBottom: 16,
            animation: 'popIn 1.2s cubic-bezier(0.23, 1, 0.32, 1)',
          }}>
            Baat<span style={{ color: '#4f46e5', textShadow: '0 2px 16px #6366f144' }}>Cheet</span>
          </h1>
          {/* Animated Tagline */}
          <div style={{
            fontSize: '1.35rem',
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 32,
            fontWeight: 500,
            letterSpacing: 1,
            animation: 'fadeInUp 1.2s 0.3s both',
          }}>
            Where conversations come alive.
          </div>
          {/* Animated Features */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 4px 24px 0 rgba(124,60,237,0.08)',
              padding: '0.85rem 2.2rem',
              fontSize: 20,
              color: '#7c3aed',
              fontWeight: 700,
              minHeight: 48,
              minWidth: 220,
              textAlign: 'center',
              marginBottom: 8,
              transition: 'all 0.5s',
              animation: 'featureFade 1s',
            }}>
              {FEATURES[featureIdx]}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {FEATURES.map((_, idx) => (
                <span key={idx} style={{
                  width: 10, height: 10, borderRadius: '50%', background: idx === featureIdx ? '#7c3aed' : '#e5e7eb', display: 'inline-block', transition: 'background 0.3s' }} />
              ))}
            </div>
          </div>
          {/* Animated Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
            <button
              className="auth-btn"
              style={{ fontSize: 20, padding: '0.9rem 2.2rem', boxShadow: '0 2px 16px 0 #a78bfa33', transition: 'transform 0.2s', fontWeight: 700 }}
              onClick={() => router.push('/login')}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.07)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Login
            </button>
            <button
              className="auth-btn"
              style={{ background: '#f3f4f6', color: '#7c3aed', border: '1px solid #d1d5db', boxShadow: '0 2px 16px 0 #6366f133', fontSize: 20, padding: '0.9rem 2.2rem', fontWeight: 700, transition: 'transform 0.2s' }}
              onClick={() => router.push('/signup')}
              onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.07)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Sign Up
            </button>
          </div>
        </div>
        {/* Keyframes for background blobs and popIn */}
        <style>{`
          @keyframes float1 {
            0% { transform: translateY(0) scale(1); }
            100% { transform: translateY(40px) scale(1.08); }
          }
          @keyframes float2 {
            0% { transform: translateY(0) scale(1); }
            100% { transform: translateY(-30px) scale(1.05); }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.7) translateY(40px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes featureFade {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  // Profile card for logged-in users (unchanged)
  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ minHeight: 340, width: '100%', maxWidth: 400, position: 'relative' }}>
        <h1 className="auth-title" style={{ marginBottom: '1.5rem' }}>Your Profile</h1>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>Email</label>
          <input
            className="auth-input"
            type="email"
            value={email}
            disabled={!editMode}
            onChange={e => setEmail(e.target.value)}
            style={{ background: editMode ? '#f8fafc' : '#e5e7eb', color: '#22223b' }}
          />
          <label style={{ fontWeight: 600, color: '#7c3aed', marginBottom: 4 }}>Password</label>
          <input
            className="auth-input"
            type="password"
            value={password}
            disabled={!editMode}
            onChange={e => setPassword(e.target.value)}
            placeholder={editMode ? 'Enter new password' : '••••••••'}
            style={{ background: editMode ? '#f8fafc' : '#e5e7eb', color: '#22223b' }}
          />
          {!editMode ? (
            <button type="button" className="auth-btn" style={{ marginTop: 12, fontSize: 18 }} onClick={() => setEditMode(true)}>
              Edit Profile
            </button>
          ) : (
            <button type="submit" className="auth-btn" style={{ marginTop: 12, fontSize: 18 }}>
              Save
            </button>
          )}
          {success && <div style={{ color: '#22c55e', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>Profile updated!</div>}
        </form>
        <button
          className="auth-btn"
          style={{ marginTop: 24, background: '#f3f4f6', color: '#7c3aed', border: '1px solid #d1d5db', boxShadow: 'none', fontSize: 16 }}
          onClick={() => {
            localStorage.removeItem('accessToken');
            window.location.reload();
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}
