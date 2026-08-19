import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { HiBookOpen, HiSearch, HiCollection } from 'react-icons/hi';

const DIFF_BADGE = { easy: 'success', normal: 'info', advanced: 'danger' };

const StudentModules = () => {
  const [modules, setModules]   = useState([]);
  const [rooms, setRooms]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    Promise.all([api.get('/modules'), api.get('/rooms/mine')])
      .then(([m, r]) => { setModules(m.data); setRooms(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading modules…</div>;

  // Map module → room (first match)
  const moduleRoomMap = {};
  rooms.forEach(r => (r.modules || []).forEach(m => { if (!moduleRoomMap[m._id]) moduleRoomMap[m._id] = r; }));

  const filtered = modules.filter(m => {
    const matchDiff   = filter === 'all' || m.difficulty === filter;
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.description || '').toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Modules</h1>
          <p className="page-subtitle">{modules.length} module{modules.length !== 1 ? 's' : ''} available</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-wrap">
          <HiSearch className="search-icon" />
          <input
            className="form-control search-input"
            placeholder="Search modules…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'easy', 'normal', 'advanced'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <HiBookOpen className="empty-state-icon" />
          <h3>{modules.length === 0 ? 'No modules yet' : 'No results'}</h3>
          <p>
            {modules.length === 0
              ? 'Join a room to access your instructor\'s modules.'
              : 'Try adjusting your search or filter.'}
          </p>
        </div>
      )}

      <div className="module-grid">
        {filtered.map(m => {
          const room = moduleRoomMap[m._id];
          return (
            <div key={m._id} className="module-card card">
              {room && (
                <div className="module-room-tag">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: room.color, flexShrink: 0 }} />
                  <span>{room.name}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span className={`badge badge-${DIFF_BADGE[m.difficulty] || 'info'}`}>{m.difficulty}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.topics?.length || 0} topics</span>
              </div>
              <h3 className="module-title">{m.title}</h3>
              <p className="module-desc">{m.description || 'No description provided.'}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>By {m.createdBy?.name}</p>
              <Link to={`/student/modules/${m._id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Start Learning
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentModules;
