import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  HiUsers, HiDocumentText, HiBookOpen, HiCollection,
  HiQuestionMarkCircle, HiClipboardList, HiLightningBolt,
  HiExclamationCircle,
} from 'react-icons/hi';

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

// ─── API Usage Panel ──────────────────────────────────────────────────────────
const ApiUsagePanel = () => {
  const [usage, setUsage]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/api-usage')
      .then(({ data }) => { setUsage(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Loading API usage…
    </div>
  );
  if (!usage) return null;

  const { todayTotal, weekTotal, monthTotal, totalAll, dailyLimit, todayUsagePercent, byOperation, byUser, errors, dailyBreakdown } = usage;
  const isCritical = todayUsagePercent >= 90;
  const isWarning  = todayUsagePercent >= 70;
  const barColor   = isCritical ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--green)';

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiLightningBolt style={{ color: 'var(--green)', fontSize: '0.95rem' }} />
          </div>
          <h2 className="card-title">Gemini API Usage</h2>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Free tier · {dailyLimit} calls/day</span>
      </div>

      {/* Today bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)' }}>Today</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: barColor }}>{todayTotal} / {dailyLimit}</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
          <div style={{ width: `${todayUsagePercent}%`, height: '100%', background: barColor, borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
        {(isCritical || isWarning) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: barColor, marginTop: 6, fontWeight: 600 }}>
            <HiExclamationCircle />
            {isCritical ? 'Critical — near daily limit.' : 'Over 70% of quota used today.'}
          </div>
        )}
      </div>

      {/* Mini stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Today', val: todayTotal },
          { label: 'Week',  val: weekTotal },
          { label: 'Month', val: monthTotal },
          { label: 'Total', val: totalAll },
          { label: 'Errors', val: errors, warn: errors > 0 },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '0.5rem 0.25rem', background: 'var(--bg)', borderRadius: 8 }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: s.warn ? 'var(--danger)' : 'var(--text)' }}>{s.val}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* By operation */}
        <div>
          <div className="section-label">By Operation</div>
          {byOperation?.map(op => (
            <div key={op._id} className="list-row" style={{ paddingTop: '0.3rem', paddingBottom: '0.3rem' }}>
              <div className="list-row-body">
                <div className="list-row-title" style={{ textTransform: 'capitalize', fontSize: '0.82rem' }}>
                  {op._id?.replace('_', ' ')}
                </div>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {op.count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({op.successCount} ok)</span>
              </span>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        <div>
          <div className="section-label">Last 7 Days</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }}>
            {Array.from({ length: 7 }, (_, i) => {
              const today = new Date();
              const d = new Date(today); d.setDate(today.getDate() - (6 - i));
              const key = d.toISOString().split('T')[0];
              const entry = dailyBreakdown?.find(x => x._id === key);
              const val = entry?.count || 0;
              const maxVal = Math.max(1, ...(dailyBreakdown || []).map(x => x.count));
              const h = Math.max(3, Math.round((val / maxVal) * 48));
              const isToday = key === today.toISOString().split('T')[0];
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, alignSelf: 'flex-end' }}>
                  <div title={`${key}: ${val}`} style={{ width: '100%', height: h, background: isToday ? barColor : `${barColor}55`, borderRadius: 3 }} />
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    {['M','T','W','T','F','S','S'][d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top users */}
      {byUser?.length > 0 && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div className="section-label">Top Users This Week</div>
          {byUser.slice(0, 5).map((u, i) => (
            <div key={i} className="list-row" style={{ paddingTop: '0.3rem', paddingBottom: '0.3rem' }}>
              <div className="list-row-body">
                <div className="list-row-title" style={{ fontSize: '0.82rem' }}>{u.user?.name || 'Unknown'}</div>
                {u.user?.email && <div className="list-row-meta">{u.user.email}</div>}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{u.count} calls</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => { setAnalytics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <Link to="/admin/users" className="btn btn-primary">
          <HiUsers /> Manage Users
        </Link>
      </div>

      <div className="stats-grid">
        <StatCard label="Users"         value={analytics?.totalUsers   || 0} Icon={HiUsers}            color="#3b82f6" />
        <StatCard label="Content"       value={analytics?.totalContent || 0} Icon={HiDocumentText}     color="#8b5cf6" />
        <StatCard label="Modules"       value={analytics?.totalModules || 0} Icon={HiBookOpen}         color="#22c55e" />
        <StatCard label="Rooms"         value={analytics?.totalRooms   || 0} Icon={HiCollection}       color="#f59e0b" />
        <StatCard label="Quizzes"       value={analytics?.totalQuizzes || 0} Icon={HiQuestionMarkCircle} color="#ef4444" />
        <StatCard label="Quiz Attempts" value={analytics?.totalResults || 0} Icon={HiClipboardList}    color="#06b6d4" />
      </div>

      <ApiUsagePanel />

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><h2 className="card-title">Users by Role</h2></div>
          {analytics?.usersByRole?.map(r => (
            <div key={r._id} className="list-row">
              <div className="list-row-body">
                <div className="list-row-title" style={{ textTransform: 'capitalize' }}>{r._id}</div>
              </div>
              <span className={`badge badge-${r._id === 'admin' ? 'danger' : r._id === 'faculty' ? 'warning' : 'success'}`}>{r.count}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Users</h2>
            <Link to="/admin/users" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {analytics?.recentUsers?.map(u => (
            <div key={u._id} className="list-row">
              <div className="list-row-body">
                <div className="list-row-title">{u.name}</div>
                <div className="list-row-meta">{u.email}</div>
              </div>
              <span className={`badge badge-${u.role === 'admin' ? 'danger' : u.role === 'faculty' ? 'warning' : 'success'}`}>{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
