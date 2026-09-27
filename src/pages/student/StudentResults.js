import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { HiClipboardList, HiClock, HiBookOpen, HiLightningBolt } from 'react-icons/hi';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results/my')
      .then(({ data }) => { setResults(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Results</h1>
          <p className="page-subtitle">{results.length} quiz attempt{results.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/student/modules" className="btn btn-primary">
          <HiBookOpen /> Browse Modules
        </Link>
      </div>

      {results.length === 0 && (
        <div className="empty-state">
          <HiClipboardList className="empty-state-icon" />
          <h3>No results yet</h3>
          <p>Attempt a quiz to see your results here.</p>
          <Link to="/student/modules" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Start Learning
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {results.map(r => {
          const scoreColor = r.percentage < 40 ? 'var(--danger)' : r.percentage <= 70 ? 'var(--warning)' : 'var(--success)';
          const fillClass  = r.percentage < 40 ? 'danger' : r.percentage <= 70 ? 'warning' : 'success';
          const mins = r.timeTaken ? Math.floor(r.timeTaken / 60) : null;
          const secs = r.timeTaken ? r.timeTaken % 60 : null;

          return (
            <div className="card" key={r._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.15rem' }}>
                    {r.quizId?.title || 'Quiz'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {r.moduleId?.title} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                    {r.percentage}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {r.score}/{r.totalMarks} marks
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <div className="progress-bar">
                  <div className={`progress-fill ${fillClass}`} style={{ width: `${r.percentage}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {r.timeTaken > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <HiClock style={{ fontSize: '0.9rem' }} />
                    {mins}m {String(secs).padStart(2, '0')}s
                  </div>
                )}
                <div style={{ fontSize: '0.78rem' }}>
                  Recommended:{' '}
                  <span className={`badge badge-${r.recommendedDifficulty === 'easy' ? 'success' : r.recommendedDifficulty === 'advanced' ? 'danger' : 'info'}`}>
                    {r.recommendedDifficulty}
                  </span>
                </div>
                {r.weakTopics?.length > 0 && (
                  <div style={{ width: '100%', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                      Needs Practice:
                    </span>
                    {r.weakTopics.map((t, idx) => {
                      const modId = r.moduleId?._id || r.moduleId;
                      return (
                        <Link
                          key={idx}
                          to={modId ? `/student/adaptive/${modId}?topicId=${t._id}&forceNew=true` : `/student/adaptive`}
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 6,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <HiLightningBolt style={{ fontSize: '0.8rem' }} /> {t.title} ➔
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentResults;
