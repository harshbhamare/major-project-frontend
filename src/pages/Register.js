import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiAcademicCap, HiSparkles, HiUser, HiUserGroup } from 'react-icons/hi';

const ROLES = [
  { value: 'student', label: 'Student', icon: HiAcademicCap },
  { value: 'faculty', label: 'Faculty', icon: HiUserGroup },
  // Admin accounts can only be created by an existing admin via the admin panel
];

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'faculty') navigate('/faculty');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find((r) => r.value === form.role);

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
            <HiSparkles /> Join Today — It's Free
          </div>
          <h1>
            Start Your<br />
            <span>Adaptive</span> Learning<br />
            Journey
          </h1>
          <p>
            Create your account and get instant access to AI-powered study materials,
            personalised quizzes, and progress tracking tailored to your role.
          </p>
          <div className="auth-features">
            {[
              { role: 'Student', desc: 'Access modules, attempt quizzes, track your growth' },
              { role: 'Faculty', desc: 'Upload content, let AI extract topics & generate quizzes' },
              { role: 'Admin',   desc: 'Manage users, monitor platform analytics' },
            ].map((item) => (
              <div className="auth-feature-item" key={item.role}>
                <div className="auth-feature-dot" />
                <span>
                  <strong style={{ color: 'var(--green)' }}>{item.role}</strong> — {item.desc}
                </span>
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
            <h2>Create account</h2>
            <p>Fill in your details to get started</p>
          </div>

          {/* Role selector */}
          <div className="role-tabs" role="group" aria-label="Select role">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  type="button"
                  className={`role-tab${form.role === r.value ? ' active' : ''}`}
                  onClick={() => setForm({ ...form, role: r.value })}
                >
                  <Icon /> {r.label}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="auth-alert error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <div className="input-wrap">
                <HiUser className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div style={{ marginTop: '0.4rem' }}>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${
                        form.password.length < 6 ? 'danger' :
                        form.password.length < 10 ? 'warning' : 'success'
                      }`}
                      style={{
                        width: `${Math.min(100, (form.password.length / 12) * 100)}%`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    {form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}
            </div>

            {/* Selected role summary */}
            <div
              style={{
                background: 'var(--green-glow)',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.875rem',
                fontSize: '0.82rem',
                color: 'var(--text-sub)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {selectedRole && <selectedRole.icon style={{ color: 'var(--green-dark)', fontSize: '1.1rem' }} />}
              Registering as{' '}
              <strong style={{ color: 'var(--navy)' }}>
                {selectedRole?.label}
              </strong>
            </div>

            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? (
                <>
                  <span className="btn-spinner" />
                  Creating account...
                </>
              ) : (
                'Create Account →'
              )}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
