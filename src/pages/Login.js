import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiAcademicCap, HiSparkles, HiCheckCircle } from 'react-icons/hi';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      // If student scanned a QR code before logging in, redirect to join page
      const pendingCode = sessionStorage.getItem('pendingRoomCode');
      if (pendingCode && user.role === 'student') {
        navigate(`/join/${pendingCode}`);
        return;
      }
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      {/* Left brand panel */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <HiAcademicCap />
          </div>
          <span className="auth-brand-name">AI Learning Platform</span>
        </div>

        <div className="auth-hero">
          <div className="auth-hero-tag">
            <HiSparkles /> AI-Powered Education
          </div>
          <h1>
            Learn Smarter,<br />
            Not <span>Harder</span>
          </h1>
          <p>
            An adaptive learning platform that personalises your study path using AI —
            extracting topics, generating quizzes, and tracking your progress in real time.
          </p>
          <div className="auth-features">
            {[
              'AI-generated topic summaries from your content',
              'Adaptive quizzes that match your skill level',
              'Real-time performance tracking & weak topic alerts',
              'Role-based dashboards for Admin, Faculty & Students',
            ].map((f) => (
              <div className="auth-feature-item" key={f}>
                <HiCheckCircle className="auth-feature-icon" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          © 2024 AI Learning Platform. All rights reserved.
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {error && (
            <div className="auth-alert error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className="input-wrap">
                <HiMail className="input-icon" />
                <input
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="auth-divider">or</div>

          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.875rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-sub)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--text)', display: 'block', marginBottom: '0.3rem' }}>
              Demo accounts
            </strong>
            Register as <strong>Admin</strong>, <strong>Faculty</strong>, or <strong>Student</strong> to explore role-specific dashboards.
          </div>

          <div className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
