import React from "react";

export default function HomeContent({ onLogin, onSignup }) {
  return (
    <div className="auth-home" style={{ textAlign: 'center', color: '#fff', padding: '2.5rem 1.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.10)', boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '1.2rem', textShadow: '0 2px 8px rgba(76,51,133,0.18)' }}>Welcome to DeployEase</h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#f3f3f3' }}>Effortless deployment, modern UI, and seamless experience. Get started now!</p>
      <button className="auth-btn" style={{ marginRight: '1rem', minWidth: 110 }} onClick={onLogin}>Login</button>
      <button className="auth-btn" style={{ minWidth: 110 }} onClick={onSignup}>Sign Up</button>
    </div>
  );
}
