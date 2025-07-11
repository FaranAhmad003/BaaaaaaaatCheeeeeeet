'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('accessToken', data.accessToken);
      router.push('/chats');
    } else {
      setMessage(data.message || 'Login failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(120deg, #ede9fe, #a78bfa, #6366f1)',
        animation: 'bgTransition 10s ease-in-out infinite alternate',
      }}
    >
      {/* Animated background blobs */}
      <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: 320, height: 320, background: 'radial-gradient(circle at 60% 40%, #a78bfa 0%, #ede9fe 100%)', borderRadius: '50%', filter: 'blur(32px)', opacity: 0.6, zIndex: 0, animation: 'float1 8s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: 260, height: 260, background: 'radial-gradient(circle at 40% 60%, #6366f1 0%, #ede9fe 100%)', borderRadius: '50%', filter: 'blur(32px)', opacity: 0.5, zIndex: 0, animation: 'float2 10s ease-in-out infinite alternate' }} />
      <div className="auth-card" style={{ zIndex: 2, animation: 'fadeInUp 1s cubic-bezier(0.23, 1, 0.32, 1)' }}>
        <h1 className="auth-title">Login</h1>
        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin} className="auth-btn">
          Login
        </button>
        {message && <p className="auth-message">{message}</p>}
        <button
          className="auth-btn"
          style={{ marginTop: '1.5rem', background: '#f3f4f6', color: '#22223b', border: '1px solid #d1d5db', boxShadow: 'none' }}
          onClick={() => router.push('/signup')}
        >
          Don't have an account? Sign Up
        </button>
      </div>
      <style>{`
        @keyframes bgTransition {
          0% { background: linear-gradient(120deg, #ede9fe, #a78bfa, #6366f1); }
          50% { background: linear-gradient(120deg, #6366f1, #ede9fe, #a78bfa); }
          100% { background: linear-gradient(120deg, #a78bfa, #6366f1, #ede9fe); }
        }
        @keyframes float1 {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(40px) scale(1.08); }
        }
        @keyframes float2 {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

