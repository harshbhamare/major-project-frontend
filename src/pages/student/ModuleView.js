import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HiBookOpen, HiLightningBolt, HiChevronRight, HiChevronLeft,
  HiCheckCircle, HiExclamationCircle, HiInformationCircle,
  HiClipboardList, HiArrowRight, HiAcademicCap,
} from 'react-icons/hi';

// ─── Parse topic summary — handles both rich JSON and plain string ────────────
const parseSummary = (raw) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.summary) return parsed;
  } catch (_) {}
  // Legacy plain-text summary
  return { summary: raw, explanation: '', realWorldExample: '', keyPoints: [], watchOut: '' };
};

// ─── Mastery mini-bar ─────────────────────────────────────────────────────────
const MasteryMini = ({ mastery, state }) => {
  const color = state === 'mastered' ? 'var(--success)' : state === 'developing' ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
      <div style={{ width: 40, height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(mastery * 100)}%`, background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: '0.65rem', color, fontWeight: 700 }}>{Math.round(mastery * 100)}%</span>
    </div>
  );
};

// ─── Adaptive content panel ───────────────────────────────────────────────────
const AdaptiveContentPanel = ({ plan, moduleId }) => {
  if (!plan) return null;

  if (plan.hasGap) {
    const actionColor = plan.action === 'remediate' ? '#ef4444' : plan.action === 'reinforce' ? '#f59e0b' : 'var(--success)';
    const actionLabel = plan.action === 'remediate' ? '🐞 Bug/Gap Detected (+75 XP)' : plan.action === 'reinforce' ? '⚡ Skill Level-Up (+50 XP)' : '🌟 Mastery Advance (+75 XP)';

    return (
      <div style={{ border: `1px solid ${actionColor}33`, borderLeft: `4px solid ${actionColor}`, borderRadius: 10, padding: '1rem', background: '#fff', marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: actionColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          {actionLabel}
        </div>
        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
          {plan.topicTitle}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Mastery: <strong>{Math.round(plan.mastery * 100)}%</strong> · Trend: {plan.trend} · Level: {plan.difficulty}
        </div>
        <Link
          to={`/student/adaptive/${moduleId}?topicId=${plan.topicId}&forceNew=true`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.5rem 0.95rem', borderRadius: 7,
            background: actionColor, color: '#fff',
            fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <HiLightningBolt /> Launch Targeted Practice
        </Link>
      </div>
    );
  }

  if (plan.noActionReason === 'all_mastered') {
    return (
      <div style={{ border: '1px solid rgba(34,197,94,0.3)', borderLeft: '4px solid var(--success)', borderRadius: 10, padding: '1rem', background: '#f0fdf4', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          All Mastered
        </div>
        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
          Topics Mastered (≥80%)
        </div>
        <Link
          to={`/student/adaptive/${moduleId}?allowAdvance=true`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.45rem 0.9rem', borderRadius: 7,
            background: 'var(--green)', color: 'var(--navy)',
            fontWeight: 800, fontSize: '0.78rem', textDecoration: 'none',
          }}
        >
          <HiLightningBolt /> Mastery Challenge
        </Link>
      </div>
    );
  }

  if (plan.noActionReason === 'insufficient_data') {
    return (
      <div style={{ border: '1px solid var(--border)', borderLeft: '4px solid var(--navy)', borderRadius: 10, padding: '1rem', background: '#fff', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
          Adaptive Learning
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Take quizzes on this module (3+ attempts per topic) to unlock personalized adaptive practice.
        </div>
      </div>
    );
  }

  return null;
};

// ─── Difficulty colour map ────────────────────────────────────────────────────
const DIFF = {
  easy:     { badge: 'success', label: 'Foundational' },
  normal:   { badge: 'info',    label: 'Intermediate' },
  advanced: { badge: 'danger',  label: 'Advanced'     },
};

// ─── Topic sidebar item ───────────────────────────────────────────────────────
const TopicItem = ({ topic, idx, active, completed, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '0.65rem',
      width: '100%', textAlign: 'left',
      padding: '0.65rem 0.75rem',
      borderRadius: 8, border: 'none',
      background: active ? 'var(--green-glow)' : 'transparent',
      borderLeft: `3px solid ${active ? 'var(--green)' : 'transparent'}`,
      cursor: 'pointer', transition: 'all 0.15s',
      marginBottom: 2,
    }}
  >
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 700,
      background: completed ? 'var(--green)' : active ? 'var(--navy)' : 'var(--border)',
      color: completed || active ? '#fff' : 'var(--text-muted)',
      transition: 'all 0.2s',
    }}>
      {completed ? <HiCheckCircle style={{ fontSize: '0.9rem' }} /> : idx + 1}
    </div>
    <span style={{
      fontSize: '0.82rem', fontWeight: active ? 600 : 400,
      color: active ? 'var(--green-dark)' : 'var(--text-sub)',
      lineHeight: 1.35, flex: 1,
    }}>
      {topic.title}
    </span>
  </button>
);

// ─── Rich topic content ───────────────────────────────────────────────────────
const TopicContent = ({ topic, idx, total, onPrev, onNext, moduleId }) => {
  const content = parseSummary(topic.summary);
  const diff = DIFF[topic.difficulty] || DIFF.normal;

  return (
    <div className="card" style={{ minHeight: 480 }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>
              Topic {idx + 1} of {total}
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}>
              {topic.title}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {moduleId && topic._id && (
              <Link
                to={`/student/adaptive/${moduleId}?topicId=${topic._id}&forceNew=true`}
                className="btn btn-sm btn-secondary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.78rem', fontWeight: 700, borderColor: 'rgba(15,23,42,0.25)',
                  color: 'var(--navy)', background: '#fff',
                }}
              >
                <HiLightningBolt style={{ color: '#f59e0b' }} /> Practice Topic
              </Link>
            )}
            <span className={`badge badge-${diff.badge}`} style={{ marginTop: 2 }}>
              {diff.label}
            </span>
          </div>
        </div>

        {/* Topic progress strip */}
        <div style={{ marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((idx + 1) / total) * 100}%`, background: 'var(--green)', borderRadius: 999, transition: 'width 0.4s ease' }} />
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {idx + 1}/{total}
          </span>
        </div>
      </div>

      {/* Core summary */}
      {content?.summary && (
        <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--text)', marginBottom: '1.5rem', fontWeight: 500 }}>
          {content.summary}
        </p>
      )}

      {/* Explanation */}
      {content?.explanation && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <HiInformationCircle style={{ color: '#3b82f6', fontSize: '1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How it works
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-sub)', padding: '0.875rem 1rem', background: '#eff6ff', borderRadius: 8, borderLeft: '3px solid #3b82f6' }}>
            {content.explanation}
          </p>
        </div>
      )}

      {/* Real-world example */}
      {content?.realWorldExample && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <HiLightningBolt style={{ color: '#f59e0b', fontSize: '1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Real-world example
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-sub)', padding: '0.875rem 1rem', background: '#fffbeb', borderRadius: 8, borderLeft: '3px solid #f59e0b' }}>
            {content.realWorldExample}
          </p>
        </div>
      )}

      {/* Key points */}
      {content?.keyPoints?.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <HiCheckCircle style={{ color: 'var(--green)', fontSize: '1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Key takeaways
            </span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {content.keyPoints.map((point, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.875rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: '0.45rem' }} />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watch out */}
      {content?.watchOut && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.875rem 1rem', background: '#fef2f2', borderRadius: 8, borderLeft: '3px solid #ef4444' }}>
            <HiExclamationCircle style={{ color: '#ef4444', fontSize: '1rem', flexShrink: 0, marginTop: '0.1rem' }} />
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                Common mistake
              </div>
              <p style={{ fontSize: '0.875rem', color: '#7f1d1d', lineHeight: 1.6 }}>
                {content.watchOut}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
        <button
          className="btn btn-secondary"
          onClick={onPrev}
          disabled={idx === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <HiChevronLeft /> Previous
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {idx + 1} of {total}
        </span>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={idx === total - 1}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          Next <HiChevronRight />
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ModuleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module, setModule]             = useState(null);
  const [quizzes, setQuizzes]           = useState([]);
  const [learnerState, setLearnerState] = useState(null);
  const [adaptivePlan, setAdaptivePlan] = useState(null);
  const [activeTopic, setActiveTopic]   = useState(0);
  const [completed, setCompleted]       = useState(new Set());
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/modules/${id}`),
      api.get(`/quizzes/module/${id}`),
      api.get(`/adaptation/summary/${id}`).catch(() => null),
      api.get(`/adaptation/next/${id}`).catch(() => null),
    ]).then(([mod, qz, ls, plan]) => {
      setModule(mod.data);
      setQuizzes(qz.data.filter(q => q.status === 'published'));
      setLearnerState(ls?.data || null);
      setAdaptivePlan(plan?.data || null);
      setLoading(false);
    }).catch(err => {
      setError(err.response?.data?.message || 'Could not load module.');
      setLoading(false);
    });
  }, [id]);

  const markDone = (idx) => setCompleted(prev => new Set([...prev, idx]));

  const goNext = () => {
    markDone(activeTopic);
    setActiveTopic(p => Math.min(topics.length - 1, p + 1));
  };
  const goPrev = () => {
    markDone(activeTopic);
    setActiveTopic(p => Math.max(0, p - 1));
  };

  // Mark the active topic done after a short delay (user has seen it).
  // Use module?.topics?.length — 'topics' const is declared further down.
  useEffect(() => {
    if (!module?.topics?.length) return;
    const timer = setTimeout(() => markDone(activeTopic), 2000);
    return () => clearTimeout(timer);
  }, [activeTopic, module]);

  if (loading) return <div className="loading"><div className="spinner" />Loading module…</div>;
  if (error)   return (
    <div style={{ maxWidth: 480, margin: '3rem auto', textAlign: 'center' }}>
      <div className="card">
        <HiExclamationCircle style={{ fontSize: '2.5rem', color: 'var(--danger)', marginBottom: '0.75rem' }} />
        <h2 style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{error}</p>
        <Link to="/student/modules" className="btn btn-primary" style={{ justifyContent: 'center' }}>Back to Modules</Link>
      </div>
    </div>
  );
  if (!module) return null;

  const topics = module.topics || [];
  const completedCount = completed.size;
  const allDone = completedCount >= topics.length && topics.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Link to="/student/modules" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              Modules
            </Link>
            <HiChevronRight style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{module.title}</span>
          </div>
          <h1 className="page-title">{module.title}</h1>
          {module.description && <p className="page-subtitle">{module.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge badge-${DIFF[module.difficulty]?.badge || 'info'}`}>
            {DIFF[module.difficulty]?.label || module.difficulty}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {completedCount}/{topics.length} read
          </span>
        </div>
      </div>

      {/* Module progress bar */}
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 999, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${topics.length ? (completedCount / topics.length) * 100 : 0}%`, background: 'var(--green)', borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Adaptive panel — shown when a knowledge gap is detected */}
          <AdaptiveContentPanel
            plan={adaptivePlan}
            moduleId={id}
          />

          {/* Topics nav */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
              <HiBookOpen style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Topics ({topics.length})
              </span>
            </div>
            {topics.length === 0
              ? <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No topics in this module.</p>
              : topics.map((t, i) => {
                const masteryRecord = learnerState?.topicSummaries?.find(s => s.topicId?.toString() === t._id?.toString());
                return (
                  <div key={t._id}>
                    <TopicItem
                      topic={t} idx={i}
                      active={activeTopic === i}
                      completed={completed.has(i)}
                      onClick={() => { markDone(activeTopic); setActiveTopic(i); }}
                    />
                    {masteryRecord && masteryRecord.mastery !== null && (
                      <div style={{ paddingLeft: '2.35rem', paddingBottom: '0.25rem' }}>
                        <MasteryMini mastery={masteryRecord.mastery} state={masteryRecord.state} />
                      </div>
                    )}
                  </div>
                );
              })
            }
          </div>

          {/* Quizzes */}
          {quizzes.length > 0 && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)' }}>
                <HiClipboardList style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Quizzes
                </span>
              </div>
              {quizzes.map(quiz => (
                <div key={quiz._id} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '0.2rem' }}>{quiz.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {quiz.questions?.length || 0} questions · {quiz.timeLimit} min
                  </div>
                  <Link
                    to={`/student/quiz/${quiz._id}`}
                    className="btn btn-sm btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}
                  >
                    Start Quiz <HiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* All done CTA */}
          {allDone && quizzes.length > 0 && (
            <div style={{ padding: '1rem', background: 'var(--green-glow)', borderRadius: 10, border: '1px solid rgba(74,222,128,0.3)', textAlign: 'center' }}>
              <HiAcademicCap style={{ fontSize: '1.5rem', color: 'var(--green-dark)', marginBottom: '0.4rem' }} />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--green-dark)', marginBottom: '0.4rem' }}>All topics read!</div>
              <Link to={`/student/quiz/${quizzes[0]._id}`} className="btn btn-sm btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'var(--green)', color: 'var(--navy)' }}>
                Take Quiz Now
              </Link>
            </div>
          )}
        </div>

        {/* ── Topic content ──────────────────────────────────────────────── */}
        {topics.length > 0
          ? <TopicContent
              topic={topics[activeTopic]}
              idx={activeTopic}
              total={topics.length}
              onPrev={goPrev}
              onNext={goNext}
              moduleId={id}
            />
          : <div className="card">
              <p style={{ color: 'var(--text-muted)' }}>No topics have been added to this module yet.</p>
            </div>
        }
      </div>
    </div>
  );
};

export default ModuleView;
