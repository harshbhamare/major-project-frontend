import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { HiAcademicCap, HiCheckCircle, HiExclamationCircle, HiLogin, HiBookOpen, HiUsers, HiCollection } from 'react-icons/hi';

const JoinRoom = () => {
  const { code: urlCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState((urlCode || '').toUpperCase());
  const [loading, setLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(!!urlCode);
  const [result, setResult] = useState(null); // { room, alreadyMember }
  const [error, setError] = useState('');

  // Auto-join if code is in URL and user is logged in
  useEffect(() => {
    if (urlCode && user) {
      joinWithCode(urlCode.toUpperCase());
    } else {
      setAutoJoining(false);
    }
  }, [urlCode, user]);

  const joinWithCode = async (joinCode) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/rooms/join', { code: joinCode });
      setResult(data);
      setLoading(false);
      setAutoJoining(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not join room. Check the code and try again.');
      setLoading(false);
      setAutoJoining(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!user) {
      // Save code and redirect to login
      sessionStorage.setItem('pendingRoomCode', code.trim());
      navigate('/login');
      return;
    }
    joinWithCode(code.trim());
  };

  // Loading / auto-joining state
  if (autoJoining) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 48, height: 48, margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-sub)' }}>Joining room <strong>{urlCode}</strong>…</p>
        </div>
      </div>
    );
  }

  // Success state
  if (result) {
    const { room, alreadyMember } = result;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '2.2rem' }}>
            <HiCheckCircle style={{ color: 'var(--green)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            {alreadyMember ? 'Already a member!' : "You're in!"}
          </h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
            {alreadyMember
              ? `You already joined "${room.name}". Head to your modules to continue.`
              : `Welcome to "${room.name}". You now have access to all its modules.`}
          </p>

          {/* Room preview */}
          <div style={{ background: 'var(--bg)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: room.color || 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem' }}>
                <HiCollection />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{room.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>by {room.createdBy?.name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <HiBookOpen /> {room.modules?.length || 0} modules
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <HiUsers /> {room.members?.length || 0} students
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/student/modules" className="btn btn-primary" style={{ justifyContent: 'center', width: '100%' }}>
              Browse Modules →
            </Link>
            <Link to="/student" className="btn btn-secondary" style={{ justifyContent: 'center', width: '100%' }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 440, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, background: 'var(--navy)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--green)' }}>
            <HiAcademicCap />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>AI Learning Platform</span>
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>Join a Classroom</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
          Enter the 6-character room code given by your instructor.
        </p>

        {error && (
          <div className="auth-alert error" style={{ marginBottom: '1rem' }}>
            <HiExclamationCircle /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Room Code</label>
            <input
              className="form-control no-icon"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              placeholder="e.g. AB3X7K"
              style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '0.25em', padding: '0.9rem' }}
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-auth"
            disabled={loading || code.length < 6}
            style={{ marginTop: '0.5rem' }}
          >
            {loading ? <><span className="btn-spinner" /> Joining…</> : !user ? <><HiLogin /> Sign in & Join</> : 'Join Room →'}
          </button>
        </form>

        {!user && (
          <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, fontSize: '0.82rem', color: 'var(--text-sub)', textAlign: 'center' }}>
            You'll be asked to sign in or create a free account before joining.
          </div>
        )}

        {user && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Signed in as <strong>{user.name}</strong> · <Link to="/student" style={{ color: 'var(--navy)', fontWeight: 600 }}>Back to Dashboard</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinRoom;
