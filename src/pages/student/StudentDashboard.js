import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HiBookOpen, HiCollection, HiChartBar, HiAcademicCap,
  HiClipboardList, HiExclamationCircle, HiCheckCircle, HiInformationCircle,
} from 'react-icons/hi';

const StudentDashboard = () => {
  const { user }    = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rooms, setRooms]         = useState([]);
  const [joinCode, setJoinCode]   = useState('');
  const [joining, setJoining]     = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinMsg, setJoinMsg]     = useState('');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingRoomCode');
    if (pending) {
      sessionStorage.removeItem('pendingRoomCode');
      api.post('/rooms/join', { code: pending })
        .then(({ data }) => setJoinMsg(`Joined "${data.room.name}" successfully.`))
        .catch(() => {});
    }
    Promise.all([api.get('/results/dashboard'), api.get('/rooms/mine')])
      .then(([d, r]) => { setDashboard(d.data); setRooms(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true); setJoinError(''); setJoinMsg('');
    try {
      const { data } = await api.post('/rooms/join', { code: joinCode.trim() });
      setJoinMsg(`${data.alreadyMember ? 'Already a member of' : 'Joined'} "${data.room.name}".`);
      setJoinCode('');
      const { data: updated } = await api.get('/rooms/mine');
      setRooms(updated);
    } catch (err) {
      setJoinError(err.response?.data?.message || 'Invalid room code.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  const diffBorder = { advanced: 'var(--success)', easy: 'var(--info)', normal: 'var(--warning)' };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
        <Link to="/student/modules" className="btn btn-primary">
          <HiBookOpen /> Browse Modules
        </Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Quizzes Taken',       value: dashboard?.totalQuizzes || 0,        Icon: HiClipboardList },
          { label: 'Average Score',        value: `${dashboard?.avgScore || 0}%`,      Icon: HiChartBar },
          { label: 'Recommended Level',    value: dashboard?.recommendedDifficulty || 'normal', Icon: HiAcademicCap },
          { label: 'Joined Rooms',         value: rooms.length,                        Icon: HiCollection },
        ].map(({ label, value, Icon }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ color: 'var(--text-sub)', fontSize: '1rem' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1, textTransform: 'capitalize' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Join banner */}
      <div className="join-banner">
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginBottom: '0.2rem' }}>Join a Classroom</div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', margin: 0 }}>Enter the 6-character code from your instructor to access their modules.</p>
        </div>
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            className="form-control no-icon"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="Room Code"
            maxLength={6}
            style={{ width: 130, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.2em', fontSize: '1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
          />
          <button type="submit" className="btn btn-primary" disabled={joining || joinCode.length < 6} style={{ whiteSpace: 'nowrap', background: 'var(--green)', color: 'var(--navy)' }}>
            {joining ? 'Joining…' : 'Join'}
          </button>
        </form>
      </div>
      {joinError && (
        <div className="inline-msg inline-msg-error">
          <HiExclamationCircle /> {joinError}
        </div>
      )}
      {joinMsg && (
        <div className="inline-msg inline-msg-success">
          <HiCheckCircle /> {joinMsg}
        </div>
      )}

      <div className="grid-2">
        {/* My Rooms */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">My Rooms</h2>
            {rooms.length > 0 && <Link to="/student/modules" className="btn btn-sm btn-secondary">View Modules</Link>}
          </div>
          {rooms.length === 0 ? (
            <div className="card-empty">
              <HiCollection className="card-empty-icon" />
              <p>Not enrolled in any rooms yet. Enter a code above.</p>
            </div>
          ) : rooms.map(r => (
            <div key={r._id} className="list-row">
              <div className="list-row-accent" style={{ background: r.color }} />
              <div className="list-row-body">
                <div className="list-row-title">{r.name}</div>
                <div className="list-row-meta">by {r.createdBy?.name} · {r.modules?.length || 0} modules</div>
              </div>
              <Link to="/student/modules" className="btn btn-sm btn-secondary">Open</Link>
            </div>
          ))}
        </div>

        {/* Recent Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Results</h2>
            <Link to="/student/results" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {!dashboard?.recentResults?.length ? (
            <div className="card-empty">
              <HiClipboardList className="card-empty-icon" />
              <p>No quiz attempts yet.</p>
              <Link to="/student/modules" className="btn btn-sm btn-primary" style={{ marginTop: '0.75rem' }}>Start Learning</Link>
            </div>
          ) : dashboard.recentResults.map(r => (
            <div key={r._id} className="list-row">
              <div className="list-row-body">
                <div className="list-row-title">{r.moduleId?.title || 'Quiz'}</div>
                <div className="list-row-meta">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="progress-bar" style={{ width: 60 }}>
                  <div className={`progress-fill ${r.percentage < 40 ? 'danger' : r.percentage <= 70 ? 'warning' : 'success'}`} style={{ width: `${r.percentage}%` }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: 36, textAlign: 'right' }}>{r.percentage}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Weak Topics */}
        {dashboard?.weakTopics?.length > 0 && (
          <div className="card">
            <div className="card-header"><h2 className="card-title">Topics to Review</h2></div>
            {dashboard.weakTopics.map((t, i) => (
              <div key={i} className="list-row">
                <HiExclamationCircle style={{ color: 'var(--warning)', flexShrink: 0, fontSize: '1rem' }} />
                <div className="list-row-body"><div className="list-row-title">{t}</div></div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendation */}
        {dashboard?.recommendedDifficulty && (
          <div className="card" style={{ borderLeft: `3px solid ${diffBorder[dashboard.recommendedDifficulty]}` }}>
            <div className="card-header">
              <h2 className="card-title">Recommendation</h2>
              <HiInformationCircle style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }} />
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', lineHeight: 1.65 }}>
              {dashboard.recommendedDifficulty === 'easy'     && 'Focus on foundational content to build a strong base before progressing to harder topics.'}
              {dashboard.recommendedDifficulty === 'normal'   && "You're progressing well. Keep practising at the current difficulty level."}
              {dashboard.recommendedDifficulty === 'advanced' && 'Excellent performance. Challenge yourself with advanced topics and modules.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
