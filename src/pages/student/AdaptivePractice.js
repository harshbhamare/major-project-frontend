import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getLearnerModuleSummary } from '../../services/adaptiveService';
import {
  HiLightningBolt, HiBookOpen, HiExclamationCircle,
  HiCheckCircle, HiInformationCircle, HiSparkles,
} from 'react-icons/hi';

// ─── Mastery state config ─────────────────────────────────────────────────────
const STATE_META = {
  mastered:           { label: 'Mastered',     color: 'var(--success)', bg: '#f0fdf4' },
  developing:         { label: 'Developing',   color: 'var(--warning)', bg: '#fffbeb' },
  needs_intervention: { label: 'Needs Review', color: 'var(--danger)',  bg: '#fef2f2' },
  not_assessed:       { label: 'Not assessed', color: 'var(--text-muted)', bg: 'var(--bg)' },
};

// ─── Per-module mastery summary card ─────────────────────────────────────────
const ModuleCard = ({ module }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLearnerModuleSummary(module._id)
      .then((data) => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [module._id]);

  const gapsCount = summary?.topicSummaries?.filter(
    t => t.state === 'needs_intervention' || t.state === 'developing'
  ).length ?? 0;

  const assessedTopics = summary?.topicSummaries?.filter(t => t.mastery !== null && t.attempts > 0) || [];
  const allMastered = assessedTopics.length > 0 &&
    assessedTopics.length === (summary?.topicSummaries?.length || 0) &&
    assessedTopics.every(t => t.mastery >= 0.80);

  const hasData = summary?.avgMastery !== null && summary?.avgMastery !== undefined;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      {/* Module header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {module.title}
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {module.topics?.length || 0} topics · Instructor: {module.createdBy?.name || 'Faculty'}
          </div>
        </div>
        {hasData && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: allMastered ? 'var(--success)' : 'var(--navy)' }}>
              {Math.round(summary.avgMastery * 100)}%
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>avg mastery</div>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ width: 14, height: 14 }} /> Loading learner model state…
        </div>
      )}

      {/* Topic breakdown */}
      {!loading && hasData && summary.topicSummaries?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {summary.topicSummaries.slice(0, 4).map(t => {
            const meta = STATE_META[t.state] || STATE_META.not_assessed;
            return (
              <div key={t.topicId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  to={`/student/adaptive/${module._id}?topicId=${t.topicId}&forceNew=true`}
                  title={`Practice ${t.topicTitle}`}
                  style={{
                    flex: 1, fontSize: '0.8rem', color: 'var(--text-sub)', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none',
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>🎯</span> {t.topicTitle}
                </Link>
                {t.mastery !== null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    <div style={{ width: 50, height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(t.mastery * 100)}%`, background: meta.color, borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, minWidth: 32, textAlign: 'right' }}>
                      {Math.round(t.mastery * 100)}%
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>unassessed</span>
                )}
              </div>
            );
          })}
          {summary.topicSummaries.length > 4 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              +{summary.topicSummaries.length - 4} more topics
            </div>
          )}
        </div>
      )}

      {/* No data yet */}
      {!loading && !hasData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
          <HiInformationCircle style={{ flexShrink: 0, fontSize: '1rem', color: 'var(--navy)' }} />
          <span>Complete at least 3 quiz questions per topic to build initial evidence.</span>
        </div>
      )}

      {/* Automated Mode Indicator */}
      <div style={{
        padding: '0.55rem 0.8rem', background: '#f8fafc',
        borderRadius: 8, border: '1px solid var(--border)',
        marginTop: '0.25rem', marginBottom: '0.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HiSparkles style={{ color: '#22c55e' }} /> Question Format:
        </div>
        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.15rem 0.5rem', borderRadius: 6 }}>
          ⚡ Auto-Selected by Module
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        {allMastered ? (
          <Link
            to={`/student/adaptive/${module._id}?allowAdvance=true`}
            className="btn btn-primary"
            style={{
              flex: 1, justifyContent: 'center', fontSize: '0.85rem',
              background: 'var(--green)', color: 'var(--navy)', fontWeight: 800,
            }}
          >
            <HiSparkles /> Mastery Challenge (Advance)
          </Link>
        ) : gapsCount > 0 ? (
          <Link
            to={`/student/adaptive/${module._id}`}
            className="btn btn-primary"
            style={{
              flex: 1, justifyContent: 'center', fontSize: '0.85rem',
              background: 'var(--green)', color: 'var(--navy)', fontWeight: 800,
            }}
          >
            <HiLightningBolt /> Start Practice ({gapsCount} gap{gapsCount !== 1 ? 's' : ''})
          </Link>
        ) : (
          <Link
            to={`/student/adaptive/${module._id}`}
            className="btn btn-primary"
            style={{
              flex: 1, justifyContent: 'center', fontSize: '0.85rem',
              background: 'var(--green)', color: 'var(--navy)', fontWeight: 800,
            }}
          >
            <HiLightningBolt /> Start Automated Practice
          </Link>
        )}
        <Link
          to={`/student/modules/${module._id}`}
          className="btn btn-secondary"
          title="Open Module Details"
          style={{ fontSize: '0.85rem' }}
        >
          <HiBookOpen />
        </Link>
      </div>
    </div>
  );
};

// ─── Main AdaptivePractice Page ───────────────────────────────────────────────
const AdaptivePractice = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/modules')
      .then(({ data }) => {
        setModules(data.filter(m => m.status === 'published'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" />Loading adaptive modules…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Adaptive Skill Arena</h1>
          <p className="page-subtitle">
            Target your weak concepts, squash code bugs, and earn bonus XP to level up!
          </p>
        </div>
      </div>

      {/* Student-Friendly Arena Hero */}
      {modules.length > 0 && (
        <div style={{
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          color: '#fff',
          marginBottom: '1.75rem',
          boxShadow: '0 8px 24px rgba(15,23,42,0.18)',
          border: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <HiSparkles /> Personalized Challenge Engine
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Level Up Your Coding Mastery
              </h2>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.3rem 0.75rem', borderRadius: 20,
              background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.3)',
              fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)',
            }}>
              <HiLightningBolt /> Adaptive Missions Active
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.25rem', lineHeight: 1.6, maxWidth: 680 }}>
            Every challenge is tailored to where you need practice the most. Directly edit buggy code, fill in code snippets, trace program outputs, and conquer realistic scenarios to master each topic.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to={`/student/adaptive/${modules[0]._id}`}
              className="btn btn-primary"
              style={{
                background: 'var(--green)', color: 'var(--navy)',
                fontWeight: 800, fontSize: '0.88rem', padding: '0.6rem 1.25rem',
                border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(74,222,128,0.3)',
              }}
            >
              <HiLightningBolt /> Jump Into Practice ({modules[0].title})
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.35rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                🐞 <strong>Debugging</strong> (+75 XP)
              </span>
              <span style={{ padding: '0.35rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                🧩 <strong>Code Completion</strong> (+50 XP)
              </span>
              <span style={{ padding: '0.35rem 0.65rem', borderRadius: 8, background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                🔍 <strong>Code Tracing</strong> (+50 XP)
              </span>
            </div>
          </div>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="empty-state">
          <HiBookOpen className="empty-state-icon" />
          <h3>No modules available</h3>
          <p>Join a room or ask your instructor to publish modules for you.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {modules.map(m => <ModuleCard key={m._id} module={m} />)}
        </div>
      )}
    </div>
  );
};

export default AdaptivePractice;
