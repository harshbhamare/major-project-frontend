import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getLearnerModuleSummary } from '../../services/adaptiveService';
import {
  HiLightningBolt, HiBookOpen, HiExclamationCircle,
  HiCheckCircle, HiInformationCircle, HiSparkles, HiArrowRight,
  HiSearch, HiCode,
} from 'react-icons/hi';
import { MdBugReport, MdExtension, MdSearch } from 'react-icons/md';

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
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {module.title}
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {module.topics?.length || 0} topics · Instructor: {module.createdBy?.name || 'Faculty'}
          </div>
        </div>
        {hasData && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: allMastered ? 'var(--success)' : 'var(--primary)' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
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
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sub)'}
                >
                  <HiLightningBolt style={{ color: 'var(--primary)', fontSize: '0.85rem', flexShrink: 0 }} />
                  <span>{t.topicTitle}</span>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-sub)', padding: '0.75rem', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <HiSparkles style={{ flexShrink: 0, fontSize: '1rem', color: 'var(--primary)' }} />
          <span>New to this module? Follow the guided path step-by-step from Step 1!</span>
        </div>
      )}

      {/* Guided Path Indicator */}
      <div style={{
        padding: '0.55rem 0.8rem', background: 'var(--bg)',
        borderRadius: 8, border: '1px solid var(--border)',
        marginTop: '0.25rem', marginBottom: '0.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HiSparkles style={{ color: 'var(--primary)' }} /> Learning Mode:
        </div>
        <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-container)', border: '1px solid rgba(26,86,219,0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
          Guided Practice
        </span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
        {allMastered ? (
          <Link
            to={`/student/adaptive/${module._id}?allowAdvance=true`}
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.85rem' }}
          >
            <HiSparkles /> Review & Advance
          </Link>
        ) : (
          <Link
            to={`/student/adaptive/${module._id}`}
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.85rem' }}
          >
            <span>Start Practice</span> <HiArrowRight />
          </Link>
        )}
        <Link
          to={`/student/modules/${module._id}`}
          className="btn btn-secondary"
          title="Open Module Details"
          style={{ fontSize: '0.85rem', padding: '0 0.75rem' }}
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
          <h1 className="page-title">AI Practice Hub</h1>
          <p className="page-subtitle">
            Learn and practice concepts across your modules with step-by-step AI guidance and interactive visuals.
          </p>
        </div>
      </div>

      {/* Material Hero Card */}
      {modules.length > 0 && (
        <div className="card" style={{
          padding: '1.75rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
          borderRadius: 'var(--radius-lg)',
          color: '#fff',
          marginBottom: '1.75rem',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid #334155',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <HiSparkles /> Adaptive Learning Platform
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>
                Personalized Learning & Skill Reinforcement
              </h2>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem', fontWeight: 600, color: '#bfdbfe',
            }}>
              <HiLightningBolt style={{ color: '#60a5fa' }} /> Adaptive Practice
            </div>
          </div>
          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.35rem', lineHeight: 1.6, maxWidth: 680 }}>
            Every session provides clear explanations, animated step-by-step visualizations, and targeted practice tailored to your current mastery level.
          </p>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to={`/student/adaptive/${modules[0]._id}`}
              className="btn btn-primary"
              style={{
                background: '#ffffff', color: 'var(--primary)',
                fontWeight: 700, fontSize: '0.88rem', padding: '0.65rem 1.35rem',
                border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <span>Start Practice: {modules[0].title}</span>
              <HiArrowRight style={{ fontSize: '1rem' }} />
            </Link>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MdBugReport style={{ color: '#f87171' }} /> <strong>Debugging</strong>
              </span>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MdExtension style={{ color: '#60a5fa' }} /> <strong>Code Completion</strong>
              </span>
              <span style={{ padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <MdSearch style={{ color: '#4ade80' }} /> <strong>Code Tracing</strong>
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
