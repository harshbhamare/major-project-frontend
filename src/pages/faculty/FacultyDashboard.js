import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  HiUpload, HiBookOpen, HiCollection, HiUsers,
  HiDocumentText, HiLightningBolt, HiExclamationCircle,
  HiChartBar, HiTrendingUp, HiCheckCircle,
} from 'react-icons/hi';

// ─── API Usage Widget ─────────────────────────────────────────────────────────
const UsageWidget = () => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/content/usage/stats')
      .then(({ data }) => { setUsage(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Loading API usage…
    </div>
  );
  if (!usage) return null;

  const { todayCount, dailyLimit, todayPercent, weekCount, totalCount, dailyBreakdown } = usage;
  const isCritical = todayPercent >= 90;
  const isWarning  = todayPercent >= 70;
  const barColor   = isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--green)';
  const remaining  = Math.max(0, dailyLimit - todayCount);

  return (
    <div className="card" style={{ marginBottom: '1.5rem', borderLeft: `3px solid ${barColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `${barColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isCritical
              ? <HiExclamationCircle style={{ color: barColor, fontSize: '1.1rem' }} />
              : <HiLightningBolt style={{ color: barColor, fontSize: '1.1rem' }} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>Gemini API — Today</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free tier · {dailyLimit} calls/day</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: barColor, lineHeight: 1 }}>
            {todayCount}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/{dailyLimit}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{remaining} remaining</div>
        </div>
      </div>

      <div style={{ background: 'var(--border)', borderRadius: 999, height: 6, overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div style={{ width: `${todayPercent}%`, height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
      </div>

      {(isCritical || isWarning) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: barColor, marginBottom: '0.75rem', fontWeight: 600 }}>
          <HiExclamationCircle />
          {isCritical ? 'Near daily limit — AI processing may fail soon.' : 'Over 70% of daily quota used.'}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Week</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{weekCount}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Time</div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{totalCount}</div>
        </div>
        {dailyBreakdown?.length > 0 && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>7-Day Activity</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const today = new Date();
                const d = new Date(today); d.setDate(today.getDate() - (6 - i));
                const key = d.toISOString().split('T')[0];
                const entry = dailyBreakdown.find(x => x._id === key);
                const val = entry?.count || 0;
                const maxVal = Math.max(1, ...dailyBreakdown.map(x => x.count));
                const h = Math.max(3, Math.round((val / maxVal) * 24));
                const isToday = key === today.toISOString().split('T')[0];
                return <div key={i} title={`${val} calls`} style={{ flex: 1, height: h, background: isToday ? barColor : `${barColor}50`, borderRadius: 2, alignSelf: 'flex-end' }} />;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, Icon, color }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ color, fontSize: '1rem' }} />
      </div>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
  </div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const FacultyDashboard = () => {
  const { user } = useAuth();
  const [content, setContent]   = useState([]);
  const [modules, setModules]   = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.get('/content'), api.get('/modules'), api.get('/rooms')])
      .then(([c, m, r]) => {
        setContent(c.data); setModules(m.data); setRooms(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  const published      = modules.filter(m => m.status === 'published').length;
  const totalStudents  = rooms.reduce((acc, r) => acc + (r.members?.length || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
        <Link to="/faculty/upload" className="btn btn-primary">
          <HiUpload /> Upload Content
        </Link>
      </div>

      <UsageWidget />

      <div className="stats-grid">
        <StatCard label="Content"   value={content.length}  Icon={HiDocumentText} color="#3b82f6" />
        <StatCard label="Modules"   value={modules.length}  Icon={HiBookOpen}     color="#8b5cf6" />
        <StatCard label="Published" value={published}       Icon={HiCheckCircle}  color="#22c55e" />
        <StatCard label="Rooms"     value={rooms.length}    Icon={HiCollection}   color="#f59e0b" />
        <StatCard label="Students"  value={totalStudents}   Icon={HiUsers}        color="#ef4444" />
      </div>

      <div className="grid-2">
        {/* Rooms */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Rooms</h2>
            <Link to="/faculty/rooms" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {rooms.length === 0 ? (
            <div className="card-empty">
              <HiCollection className="card-empty-icon" />
              <p>No rooms yet.</p>
              <Link to="/faculty/rooms" className="btn btn-sm btn-primary" style={{ marginTop: '0.75rem' }}>Create Room</Link>
            </div>
          ) : rooms.slice(0, 5).map(r => (
            <div key={r._id} className="list-row">
              <div className="list-row-accent" style={{ background: r.color }} />
              <div className="list-row-body">
                <div className="list-row-title">{r.name}</div>
                <div className="list-row-meta">{r.members?.length || 0} students · {r.modules?.length || 0} modules</div>
              </div>
              <code className="room-code-inline" style={{ color: r.color }}>{r.code}</code>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><h2 className="card-title">Quick Actions</h2></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              { to: '/faculty/upload',      Icon: HiUpload,      label: 'Upload content',  desc: 'PDF, PPT, or paste text' },
              { to: '/faculty/rooms',       Icon: HiCollection,  label: 'Create a room',   desc: 'Get a shareable join code + QR' },
              { to: '/faculty/modules/new', Icon: HiBookOpen,    label: 'Build a module',  desc: 'Group topics into a lesson' },
              { to: '/faculty/results',     Icon: HiTrendingUp,  label: 'View results',    desc: 'Student quiz performance' },
            ].map(({ to, Icon, label, desc }) => (
              <Link key={to} to={to} className="quick-action-row">
                <div className="quick-action-icon"><Icon /></div>
                <div>
                  <div className="quick-action-label">{label}</div>
                  <div className="quick-action-desc">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Content */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Content</h2>
            <Link to="/faculty/content" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {content.length === 0
            ? <p className="text-muted">No content uploaded yet.</p>
            : content.slice(0, 5).map(c => (
              <div key={c._id} className="list-row">
                <div className="list-row-body">
                  <div className="list-row-title">{c.title}</div>
                  <div className="list-row-meta">{c.fileType?.toUpperCase()}</div>
                </div>
                <span className={`badge badge-${c.status === 'processed' ? 'success' : c.status === 'failed' ? 'danger' : c.status === 'processing' ? 'warning' : 'info'}`}>
                  {c.status}
                </span>
              </div>
            ))}
        </div>

        {/* Recent Modules */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Modules</h2>
            <Link to="/faculty/modules" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {modules.length === 0
            ? <p className="text-muted">No modules created yet.</p>
            : modules.slice(0, 5).map(m => (
              <div key={m._id} className="list-row">
                <div className="list-row-body">
                  <div className="list-row-title">{m.title}</div>
                  <div className="list-row-meta">{m.topics?.length || 0} topics</div>
                </div>
                <span className={`badge badge-${m.status === 'published' ? 'success' : 'warning'}`}>{m.status}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
