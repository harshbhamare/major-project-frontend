import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HiBookOpen, HiCollection, HiChartBar, HiAcademicCap,
  HiClipboardList, HiExclamationCircle, HiCheckCircle,
  HiInformationCircle, HiTrendingUp, HiTrendingDown,
  HiArrowRight, HiSparkles, HiFire, HiLightningBolt,
} from 'react-icons/hi';

// ─── Mastery bar ──────────────────────────────────────────────────────────────
const MasteryBar = ({ mastery, state }) => {
  const color =
    state === 'mastered'           ? 'var(--success)' :
    state === 'developing'         ? 'var(--warning)'  : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(mastery * 100)}%`, background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, minWidth: 30 }}>
        {Math.round(mastery * 100)}%
      </span>
    </div>
  );
};

// ─── State badge ──────────────────────────────────────────────────────────────
const StateBadge = ({ state }) => {
  const map = {
    mastered:           { label: 'Mastered',      cls: 'success' },
    developing:         { label: 'Developing',    cls: 'info' },
    needs_intervention: { label: 'Needs Review',  cls: 'danger' },
    not_assessed:       { label: 'Not Assessed',  cls: 'info' },
  };
  const { label, cls } = map[state] || map.not_assessed;
  return <span className={`badge badge-${cls}`}>{label}</span>;
};

// ─── Difficulty border colors ────────────────────────────────────────────────
const diffBorder = {
  easy: 'var(--info)',
  normal: 'var(--success)',
  advanced: '#a855f7',
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const StudentDashboard = () => {
  const { user, updateGamification } = useAuth();
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
      .then(([d, r]) => {
        setDashboard(d.data);
        if (d.data?.gamification) {
          updateGamification?.(d.data.gamification);
        }
        setRooms(r.data);
        setLoading(false);
      })
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

  if (loading) return <div className="loading"><div className="spinner" />Loading your learning quest…</div>;

  const topicMastery       = dashboard?.topicMastery || [];
  const needsReview        = topicMastery.filter(t => t.state === 'needs_intervention');
  const developing         = topicMastery.filter(t => t.state === 'developing');
  const mastered           = topicMastery.filter(t => t.state === 'mastered');
  const userXp             = user?.xp ?? dashboard?.gamification?.xp ?? 0;
  const userStreak         = user?.streak ?? dashboard?.gamification?.streak ?? 1;
  const userLevel          = user?.level ?? dashboard?.gamification?.level ?? 1;
  const levelTitle         = dashboard?.gamification?.levelTitle || 'Code Explorer';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Quest Central</h1>
          <p className="page-subtitle">Welcome back, {user?.name}! Ready to conquer today's coding challenges?</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link to="/student/adaptive" className="btn btn-primary" style={{ background: 'var(--green)', color: 'var(--navy)', fontWeight: 800 }}>
            <HiLightningBolt /> Adaptive Arena
          </Link>
          <Link to="/student/modules" className="btn btn-secondary">
            <HiBookOpen /> Browse Modules
          </Link>
        </div>
      </div>

      {/* Hero Quest Card */}
      <div style={{
        padding: '1.5rem',
        borderRadius: 16,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#fff',
        marginBottom: '1.5rem',
        boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
        border: '1px solid #334155',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase',
              color: 'var(--green)', background: 'rgba(74, 222, 128, 0.12)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
              padding: '0.2rem 0.65rem', borderRadius: 999, marginBottom: '0.4rem',
            }}>
              <HiSparkles /> Active Daily Mission
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {needsReview.length > 0
                ? `Squash Defect: Reinforce "${needsReview[0].topicTitle}"`
                : developing.length > 0
                ? `Level-Up Bounty: Master "${developing[0].topicTitle}"`
                : 'Conquer Your Next Module Challenge'}
            </h2>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            background: 'rgba(255,255,255,0.06)', padding: '0.4rem 0.85rem', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <span style={{ fontSize: '1.4rem' }}>🔥</span>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Streak</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f59e0b' }}>{userStreak} Day{userStreak !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: 650 }}>
          {needsReview.length > 0
            ? `Your current mastery in "${needsReview[0].topicTitle}" is ${Math.round(needsReview[0].mastery * 100)}%. Jump into the Adaptive Arena to squash defects and boost your skill.`
            : developing.length > 0
            ? `Mastery is developing at ${Math.round(developing[0].mastery * 100)}%. One quick practice round will earn bonus XP and push you across the finish line!`
            : 'You are in great shape across all assessed concepts! Complete new module quizzes to unlock higher-tier badges.'}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/student/adaptive"
            className="btn btn-primary"
            style={{
              background: 'var(--green)', color: 'var(--navy)',
              fontWeight: 800, fontSize: '0.88rem', padding: '0.55rem 1.25rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <HiLightningBolt /> Launch Daily Mission ({needsReview.length > 0 ? '+75 XP' : '+50 XP'}) <HiArrowRight />
          </Link>
          <Link
            to="/student/modules"
            style={{ color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'underline', marginLeft: '0.25rem' }}
          >
            Explore all topics
          </Link>
        </div>
      </div>

      {/* Gamified Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Total XP',           value: `${userXp} ⚡`,                          Icon: HiLightningBolt, color: '#eab308' },
          { label: 'Coder Level',        value: `Lvl ${userLevel}`,                      Icon: HiAcademicCap,   color: '#38bdf8' },
          { label: 'Daily Streak',       value: `${userStreak} 🔥`,                      Icon: HiFire,          color: '#f97316' },
          { label: 'Skills Mastered',    value: mastered.length,                         Icon: HiCheckCircle,   color: '#22c55e' },
          { label: 'Quizzes Conquered',  value: dashboard?.totalQuizzes || 0,            Icon: HiClipboardList, color: '#a855f7' },
          { label: 'Average Accuracy',   value: `${dashboard?.avgScore || 0}%`,          Icon: HiChartBar,      color: '#06b6d4' },
        ].map(({ label, value, Icon, color }) => (
          <div className="stat-card" key={label} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ color, fontSize: '1rem' }} />
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Classroom Join Banner */}
      <div className="join-banner" style={{ marginBottom: '1.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '0.2rem' }}>
            Join an Instructor Classroom
          </div>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            Enter your instructor's 6-character room code to unlock their course modules and assignments.
          </p>
        </div>
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            className="form-control no-icon"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="Room Code"
            maxLength={6}
            style={{ width: 130, textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.18em', fontSize: '1rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
          />
          <button type="submit" className="btn btn-primary" disabled={joining || joinCode.length < 6} style={{ whiteSpace: 'nowrap', background: 'var(--green)', color: 'var(--navy)', fontWeight: 800 }}>
            {joining ? 'Joining…' : 'Join Room'}
          </button>
        </form>
      </div>
      {joinError && <div className="inline-msg inline-msg-error" style={{ marginBottom: '1rem' }}><HiExclamationCircle /> {joinError}</div>}
      {joinMsg   && <div className="inline-msg inline-msg-success" style={{ marginBottom: '1rem' }}><HiCheckCircle /> {joinMsg}</div>}

      <div className="grid-2">
        {/* Topic Mastery — the core adaptive learning widget */}
        {topicMastery.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Knowledge State</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {topicMastery.length} topic{topicMastery.length !== 1 ? 's' : ''} assessed
                </span>
              </div>
              <Link to="/student/adaptive" className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                Adaptive Practice <HiArrowRight />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topicMastery.slice(0, 8).map(t => (
                <div key={t.topicId} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                      {t.trend === 'improving' && <HiTrendingUp style={{ color: 'var(--success)', fontSize: '0.85rem', flexShrink: 0 }} />}
                      {t.trend === 'declining' && <HiTrendingDown style={{ color: 'var(--danger)', fontSize: '0.85rem', flexShrink: 0 }} />}
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.topicTitle}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <StateBadge state={t.state} />
                      <Link
                        to={`/student/adaptive?topicId=${t.topicId}&forceNew=true`}
                        className="btn btn-sm btn-secondary"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                        title={`Practice ${t.topicTitle}`}
                      >
                        <HiLightningBolt style={{ color: '#f59e0b' }} /> Practice
                      </Link>
                    </div>
                  </div>
                  <MasteryBar mastery={t.mastery} state={t.state} />
                </div>
              ))}
              {topicMastery.length > 8 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '0.25rem' }}>
                  +{topicMastery.length - 8} more topics
                </p>
              )}
            </div>
          </div>
        )}

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

        {/* Needs Review list */}
        {needsReview.length > 0 && (
          <div className="card" style={{ borderLeft: '3px solid var(--danger)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title">Priority Review</h2>
              <Link to="/student/adaptive" className="btn btn-sm btn-primary" style={{ background: 'var(--green)', color: 'var(--navy)', fontWeight: 700 }}>
                Practice Now
              </Link>
            </div>
            {needsReview.slice(0, 6).map(t => (
              <div key={t.topicId} className="list-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                  <HiExclamationCircle style={{ color: 'var(--danger)', flexShrink: 0, fontSize: '1.1rem' }} />
                  <div className="list-row-body" style={{ minWidth: 0 }}>
                    <div className="list-row-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.topicTitle}</div>
                    <div className="list-row-meta">Mastery: {Math.round(t.mastery * 100)}% · {t.attempts} attempt{t.attempts !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <Link
                  to={`/student/adaptive?topicId=${t.topicId}&forceNew=true`}
                  className="btn btn-sm btn-primary"
                  style={{ background: '#ef4444', color: '#fff', fontSize: '0.74rem', padding: '0.25rem 0.65rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                >
                  Fix Defect 🐞
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Rooms */}
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

        {/* Recommendation */}
        {dashboard?.recommendedDifficulty && (
          <div className="card" style={{ borderLeft: `3px solid ${diffBorder[dashboard.recommendedDifficulty] || 'var(--info)'}` }}>
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
