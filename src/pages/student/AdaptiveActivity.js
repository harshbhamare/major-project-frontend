import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  getNextAdaptiveActivity,
  submitAdaptiveActivity,
} from '../../services/adaptiveService';
import {
  HiCheckCircle, HiArrowRight, HiExclamationCircle,
  HiRefresh, HiSparkles, HiLightBulb, HiChevronLeft,
  HiBookOpen, HiCheck, HiX, HiPencilAlt, HiVideoCamera,
  HiFire, HiAcademicCap, HiLightningBolt,
} from 'react-icons/hi';
import InteractiveConceptAnimator from '../../components/InteractiveConceptAnimator';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const SET_TARGET = 3; // 3 questions per topic practice set

// Helper to separate prompt and code blocks from raw question text
function formatQuestionText(rawText) {
  if (!rawText) return { prompt: '', code: '' };
  const text = rawText.toString().trim();
  const fenceMatch = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
  if (fenceMatch) {
    return {
      prompt: text.replace(fenceMatch[0], '').trim(),
      code: fenceMatch[1].trim(),
    };
  }
  const lines = text.split('\n');
  const codeIdx = lines.findIndex(l => /^(function|const|let|var|class|def|for|while|if|import|\/\/|\/\*)/.test(l.trim()));
  if (codeIdx > 0) {
    return {
      prompt: lines.slice(0, codeIdx).join('\n').trim(),
      code: lines.slice(codeIdx).join('\n').trim(),
    };
  }
  return { prompt: text, code: '' };
}

// ─── Compact Step Progress Header ─────────────────────────────────────────────
const StepProgressHeader = ({ chain, currentTopicId, onSelectTopic }) => {
  if (!chain || chain.length === 0) return null;

  const currentIdx = chain.findIndex(t => t.topicId?.toString() === currentTopicId?.toString());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.4rem',
      overflowX: 'auto',
      paddingBottom: '0.25rem',
      scrollbarWidth: 'none',
    }}>
      {chain.map((step, idx) => {
        const isCurrent = step.topicId?.toString() === currentTopicId?.toString() || (!currentTopicId && idx === 0);
        const isMastered = step.isMastered || (step.mastery && step.mastery >= 0.80);
        const isDone = idx < activeIndex || isMastered;

        return (
          <button
            key={step.topicId || idx}
            type="button"
            onClick={() => onSelectTopic(step.topicId)}
            title={`Step ${idx + 1}: ${step.title} (${Math.round((step.mastery || 0) * 100)}% Mastery)`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.28rem 0.65rem',
              borderRadius: 999,
              fontSize: '0.74rem',
              fontWeight: isCurrent ? 800 : 600,
              border: `1.5px solid ${isCurrent ? 'var(--primary)' : isMastered ? 'var(--success)' : 'var(--border)'}`,
              background: isCurrent ? 'var(--primary)' : isMastered ? '#f0fdf4' : '#fff',
              color: isCurrent ? '#fff' : isMastered ? '#166534' : 'var(--text-sub)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            {isMastered ? (
              <HiCheck style={{ fontSize: '0.85rem', color: isCurrent ? '#fff' : 'var(--success)' }} />
            ) : (
              <span>{idx + 1}.</span>
            )}
            <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {step.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Adaptive Learning Component ─────────────────────────────────────────
const AdaptiveActivity = () => {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();

  const initialTopicRef = useRef(searchParams.get('topicId') || null);

  const [loading, setLoading]               = useState(true);
  const [transitioning, setTransitioning]   = useState(false);
  const [activity, setActivity]             = useState(null);
  const [currentTopicId, setCurrentTopicId] = useState(initialTopicRef.current);
  const [errorMsg, setErrorMsg]             = useState('');

  // Practice state
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isChecking, setIsChecking]         = useState(false);
  const [outcome, setOutcome]               = useState(null);
  const [showAnimation, setShowAnimation]   = useState(false);
  const [completedAll, setCompletedAll]     = useState(false);

  // Set-based progress state
  const [setQuestionIndex, setSetQuestionIndex] = useState(0); // 0, 1, 2
  const [setCorrectCount, setSetCorrectCount]   = useState(0);
  const [topicMastered, setTopicMastered]       = useState(false);
  const [liveMastery, setLiveMastery]           = useState(null);

  const inFlightRef = useRef(false);

  // ── Load Activity ───────────────────────────────────────────────────────────
  const fetchLesson = useCallback(async (targetTopicId = null, forceNew = true) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (activity) {
      setTransitioning(true);
    } else {
      setLoading(true);
    }

    setSelectedAnswer('');
    setOutcome(null);
    setErrorMsg('');

    try {
      const data = await getNextAdaptiveActivity(moduleId, {
        topicId: targetTopicId || undefined,
        forceNew,
      });

      if (!data.hasGap && !data.isAdvancement && !targetTopicId) {
        setCompletedAll(true);
        setActivity(data);
        return;
      }

      setActivity(data);
      if (data.plan?.topicId) {
        setCurrentTopicId(data.plan.topicId);
      }
      if (data.plan?.mastery !== undefined && data.plan?.mastery !== null) {
        setLiveMastery(data.plan.mastery);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to load question. Please try again.');
    } finally {
      setLoading(false);
      setTransitioning(false);
      inFlightRef.current = false;
    }
  }, [moduleId, activity]);

  useEffect(() => {
    fetchLesson(initialTopicRef.current, true);
  }, []); // Initial mount load

  // ── Handle Check Answer ─────────────────────────────────────────────────────
  const handleCheckAnswer = async () => {
    if (!selectedAnswer || isChecking || outcome || !activity?._id) return;
    setIsChecking(true);
    try {
      const res = await submitAdaptiveActivity(activity._id, selectedAnswer);
      setOutcome(res);

      if (res.isCorrect) {
        setSetCorrectCount(c => c + 1);
      }

      const updatedMastery = res.masteryAfter !== null && res.masteryAfter !== undefined
        ? res.masteryAfter
        : (activity.plan?.mastery ?? 0.75);

      setLiveMastery(updatedMastery);

      // Check if topic mastery threshold achieved or set finished
      if (setQuestionIndex >= SET_TARGET - 1 || updatedMastery >= 0.80) {
        setTopicMastered(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // ── Move to Next Question in Set ────────────────────────────────────────────
  const handleNextQuestionInSet = () => {
    if (setQuestionIndex + 1 < SET_TARGET && !topicMastered) {
      setSetQuestionIndex(i => i + 1);
      fetchLesson(currentTopicId, true);
    } else {
      setTopicMastered(true);
    }
  };

  // ── Advance to Next Topic ───────────────────────────────────────────────────
  const handleAdvanceToNextTopic = (targetNextId = null) => {
    const chain = activity?.plan?.topicChain || [];
    const thisTopicId = (currentTopicId || activity?.plan?.topicId)?.toString();
    const currentIdx = chain.findIndex(t => t.topicId?.toString() === thisTopicId);

    let nextTopic = null;
    if (targetNextId) {
      nextTopic = chain.find(t => t.topicId?.toString() === targetNextId.toString());
    } else if (currentIdx >= 0 && currentIdx + 1 < chain.length) {
      nextTopic = chain[currentIdx + 1];
    } else if (outcome?.nextPlan?.topicId && outcome.nextPlan.topicId !== thisTopicId) {
      nextTopic = chain.find(t => t.topicId?.toString() === outcome.nextPlan.topicId.toString());
    }

    if (nextTopic) {
      // Reset practice set counters for the new topic
      setSetQuestionIndex(0);
      setSetCorrectCount(0);
      setTopicMastered(false);
      setCurrentTopicId(nextTopic.topicId);
      fetchLesson(nextTopic.topicId, true);
    } else {
      setCompletedAll(true);
    }
  };

  // ── Keyboard shortcut: Enter to submit or continue ──────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'Enter') {
        if (!outcome && selectedAnswer && !isChecking) {
          handleCheckAnswer();
        } else if (outcome && !topicMastered) {
          handleNextQuestionInSet();
        } else if (outcome && topicMastered) {
          handleAdvanceToNextTopic();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <div className="card" style={{ padding: '2.5rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
            Loading adaptive practice session…
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Preparing concept guide and targeted practice question.
          </p>
        </div>
      </div>
    );
  }

  // ── Error Screen with Clean Retry ───────────────────────────────────────────
  if (errorMsg && !activity) {
    return (
      <div style={{ maxWidth: 540, margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <HiExclamationCircle style={{ fontSize: '2.6rem', color: 'var(--danger)', marginBottom: '0.75rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Session Interrupted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => fetchLesson(currentTopicId, true)}>
              <HiRefresh /> Try Again
            </button>
            <Link to="/student/adaptive" className="btn btn-secondary">
              Back to Practice Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Completed All Topics Screen ─────────────────────────────────────────────
  if (completedAll) {
    return (
      <div style={{ maxWidth: 620, margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.75rem 2rem' }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%', background: '#f0fdf4',
            color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.4rem', marginBottom: '1.25rem', border: '3px solid #bbf7d0',
          }}>
            <HiCheckCircle />
          </div>
          <h2 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
            Module Completely Mastered!
          </h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1.75rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
            Outstanding work! You have finished all topic sets and demonstrated strong proficiency across the entire module.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const firstTopic = activity?.plan?.topicChain?.[0]?.topicId;
                setSetQuestionIndex(0);
                setSetCorrectCount(0);
                setTopicMastered(false);
                fetchLesson(firstTopic || null, true);
              }}
            >
              <HiRefresh /> Review from Topic 1
            </button>
            <Link to="/student/adaptive" className="btn btn-primary">
              <HiBookOpen /> Back to Practice Hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const plan     = activity?.plan;
  const content  = activity?.content;
  const question = activity?.question;
  const payload  = question?.payload || {};
  const chain    = plan?.topicChain || [];

  const currentIdx  = chain.findIndex(t => t.topicId?.toString() === (currentTopicId || plan?.topicId)?.toString());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const isLastTopic = currentIdx >= 0 && currentIdx === chain.length - 1;
  const nextTopic   = (currentIdx >= 0 && currentIdx + 1 < chain.length) ? chain[currentIdx + 1] : null;

  // Active mastery calculation
  const rawMastery = liveMastery !== null ? liveMastery : (plan?.mastery ?? 0.7);
  const masteryPct = Math.min(100, Math.round(rawMastery * 100));

  // Set Progress Calculation (smooth: 33%, 66%, 100%)
  const setProgressPct = topicMastered
    ? 100
    : Math.round(((setQuestionIndex + (outcome ? 1 : 0.4)) / SET_TARGET) * 100);

  // Resolve 4 Multiple Choice Options cleanly
  let options = Array.isArray(payload.options) && payload.options.length >= 2
    ? payload.options
    : (Array.isArray(question?.options) && question.options.length >= 2 ? question.options : null);

  if (!options && question) {
    const correctVal = question.correctAnswer || payload.placeholder || 'Correct Implementation';
    options = [
      correctVal,
      'Alternative approach with different syntax',
      'Leave value uninitialized',
      'None of the above',
    ];
  }

  const parsedQuestion = question ? formatQuestionText(question.questionText) : { prompt: '', code: '' };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* ── TOP NAV BAR ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.85rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link
            to="/student/adaptive"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-sub)',
              textDecoration: 'none',
              padding: '0.3rem 0.6rem',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--border)',
            }}
          >
            <HiChevronLeft /> Hub
          </Link>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Topic {activeIndex + 1} of {chain.length || 1}
          </span>
        </div>

        {/* Step dots ribbon */}
        <div style={{ flex: 1, maxWidth: 520, margin: '0 0.5rem' }}>
          <StepProgressHeader
            chain={chain}
            currentTopicId={currentTopicId || plan?.topicId}
            onSelectTopic={(tid) => {
              setSetQuestionIndex(0);
              setSetCorrectCount(0);
              setTopicMastered(false);
              fetchLesson(tid, true);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            padding: '0.25rem 0.65rem',
            borderRadius: 999,
            background: masteryPct >= 80 ? '#f0fdf4' : masteryPct >= 50 ? '#fffbeb' : '#fef2f2',
            color: masteryPct >= 80 ? '#166534' : masteryPct >= 50 ? '#b45309' : '#991b1b',
            border: `1px solid ${masteryPct >= 80 ? '#bbf7d0' : masteryPct >= 50 ? '#fde68a' : '#fecaca'}`,
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <HiSparkles /> {masteryPct}% Mastery
          </span>
        </div>
      </div>

      {/* ── TOPIC & SET PROGRESS STRIP ───────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid var(--border)',
        borderRadius: 14,
        padding: '0.75rem 1.25rem',
        marginBottom: '1rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'var(--primary-container)', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '0.9rem',
          }}>
            {activeIndex + 1}
          </div>
          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
              {plan?.topicTitle || 'Target Concept'}
            </h1>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Target: 3-Question Mastery Set · Step-by-Step Learning
            </div>
          </div>
        </div>

        {/* Dynamic Set Progress Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 260 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-sub)', marginBottom: 3 }}>
              <span>Question {Math.min(SET_TARGET, setQuestionIndex + 1)} of {SET_TARGET}</span>
              <span style={{ color: setProgressPct === 100 ? 'var(--success)' : 'var(--primary)' }}>{setProgressPct}% Set Complete</span>
            </div>
            <div style={{ height: 7, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${setProgressPct}%`,
                background: setProgressPct === 100 ? 'var(--success)' : 'var(--primary)',
                borderRadius: 999,
                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO-COLUMN WORKSPACE: CONCEPT GUIDE (LEFT) & PRACTICE ARENA (RIGHT) ─ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 39%) minmax(360px, 61%)',
        gap: '1rem',
        alignItems: 'start',
      }}>
        {/* ── LEFT: COMPACT CONCEPT GUIDE ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {content && (
            <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  background: 'var(--primary-container)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  <HiLightBulb /> Concept Guide
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.6rem', lineHeight: 1.35 }}>
                {content.headline || plan?.topicTitle}
              </h3>

              {/* Concise Analogy */}
              {content.analogy && (
                <div style={{
                  padding: '0.65rem 0.85rem',
                  background: '#f0f9ff',
                  borderLeft: '3px solid #0284c7',
                  borderRadius: '0 8px 8px 0',
                  marginBottom: '0.75rem',
                  fontSize: '0.82rem',
                  color: '#0369a1',
                  lineHeight: 1.5,
                }}>
                  <strong>Intuition:</strong> {content.analogy}
                </div>
              )}

              {/* Explanation */}
              {content.explanation && (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {content.explanation}
                </p>
              )}

              {/* Code Example (compact) */}
              {content.workedExample && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                    Syntax Example:
                  </div>
                  <pre style={{
                    background: '#0f172a',
                    color: '#38bdf8',
                    padding: '0.75rem 0.9rem',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                    fontFamily: 'monospace',
                    overflowX: 'auto',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    maxHeight: 220,
                  }}>
                    {content.workedExample}
                  </pre>
                </div>
              )}

              {/* Key Rule */}
              {content.keyInsight && (
                <div style={{
                  padding: '0.55rem 0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  color: '#166534',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  <HiCheckCircle style={{ color: '#16a34a', fontSize: '1.1rem', flexShrink: 0 }} />
                  <span><strong>Rule:</strong> {content.keyInsight}</span>
                </div>
              )}

              {/* Visual Walkthrough Toggle */}
              {content.animation && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setShowAnimation(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: 0,
                    }}
                  >
                    <HiVideoCamera style={{ fontSize: '1rem' }} />
                    <span>{showAnimation ? 'Hide Visual Animation' : 'Watch Visual Walkthrough'}</span>
                  </button>
                  {showAnimation && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <InteractiveConceptAnimator
                        animation={content.animation}
                        topicTitle={plan?.topicTitle}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: ACTIVE PRACTICE ARENA ───────────────────────────────────── */}
        <div>
          {/* Transition spinner */}
          {transitioning && (
            <div style={{
              textAlign: 'center',
              padding: '0.5rem',
              marginBottom: '0.75rem',
              background: 'var(--primary-container)',
              color: 'var(--primary)',
              borderRadius: 8,
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}>
              <div className="spinner" style={{ width: 12, height: 12 }} /> Preparing next problem…
            </div>
          )}

          {/* TOPIC MASTERED VIEW (when 3 questions are done or mastery achieved) */}
          {topicMastered ? (
            <div className="card" style={{
              padding: '2rem 1.75rem',
              textAlign: 'center',
              border: '2px solid #22c55e',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
              boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.25)',
              animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: '#dcfce7',
                color: '#15803d', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', marginBottom: '0.85rem', border: '2px solid #86efac',
              }}>
                <HiAcademicCap />
              </div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.2rem 0.65rem', borderRadius: 999, background: '#dcfce7',
                color: '#166534', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}>
                <HiCheckCircle /> Topic Mastered!
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text)', margin: '0 0 0.4rem 0' }}>
                You've Mastered {plan?.topicTitle}!
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                Great performance! You scored <strong>{setCorrectCount} of {SET_TARGET}</strong> in this set and your current mastery is <strong>{masteryPct}%</strong>.
              </p>

              {/* Next topic call to action */}
              <div style={{
                padding: '1rem',
                borderRadius: 12,
                background: '#ffffff',
                border: '1px solid var(--border)',
                marginBottom: '1.25rem',
                textAlign: 'left',
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Next Curriculum Step:
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text)' }}>
                  {nextTopic ? nextTopic.title : 'Module Complete! All topics finished.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {nextTopic ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleAdvanceToNextTopic()}
                    style={{
                      fontSize: '0.92rem',
                      padding: '0.7rem 1.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      borderRadius: 10,
                      fontWeight: 800,
                    }}
                  >
                    <span>Start Next Topic: {nextTopic.title}</span>
                    <HiArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCompletedAll(true)}
                    style={{ fontSize: '0.92rem', padding: '0.7rem 1.6rem', fontWeight: 800 }}
                  >
                    <span>Complete Module Summary</span>
                    <HiCheckCircle />
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSetQuestionIndex(0);
                    setSetCorrectCount(0);
                    setTopicMastered(false);
                    fetchLesson(currentTopicId, true);
                  }}
                  style={{ fontSize: '0.84rem' }}
                >
                  <HiRefresh /> Practice 3 More Questions
                </button>
              </div>
            </div>
          ) : question ? (
            /* ACTIVE QUESTION CARD */
            <div className="card" style={{ padding: '1.35rem', borderTop: '3px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--primary)',
                  background: 'var(--primary-container)',
                  padding: '0.15rem 0.55rem',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  <HiPencilAlt /> Question {setQuestionIndex + 1} of {SET_TARGET}
                </span>

                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {question.assessmentFormat?.replace('_', ' ')} · {question.difficulty || 'normal'}
                </span>
              </div>

              {/* Question prompt */}
              <h2 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
                {parsedQuestion.prompt || question.questionText}
              </h2>

              {/* Code snippet if present */}
              {(parsedQuestion.code || payload.codeSnippet || payload.buggyCode) && (
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  marginBottom: '1rem',
                  whiteSpace: 'pre-wrap',
                }}>
                  {payload.codeSnippet || payload.buggyCode || parsedQuestion.code}
                </pre>
              )}

              {/* Scenario if present */}
              {payload.scenario && (
                <div style={{
                  padding: '0.75rem 0.9rem',
                  background: '#f8fafc',
                  borderLeft: '3px solid #64748b',
                  borderRadius: '0 6px 6px 0',
                  fontSize: '0.84rem',
                  color: 'var(--text-sub)',
                  lineHeight: 1.55,
                  marginBottom: '1rem',
                }}>
                  {payload.scenario}
                </div>
              )}

              {/* 4 Multiple Choice Options */}
              {options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.15rem' }}>
                  {options.map((opt, i) => {
                    const isSelected = selectedAnswer === opt;
                    const isSubmitted = outcome !== null;

                    const isThisCorrect = isSubmitted && (() => {
                      if (!outcome?.correctAnswer) return false;
                      const ans = outcome.correctAnswer.toString().trim().toLowerCase();
                      const curOpt = (opt || '').toString().trim().toLowerCase();
                      const curLetter = OPTION_LABELS[i].toLowerCase();
                      return ans === curOpt ||
                             ans === curLetter ||
                             ans.startsWith(curLetter + ')') ||
                             ans.startsWith(curLetter + ':') ||
                             ans.startsWith(curLetter + '.') ||
                             (ans.length > 4 && curOpt.includes(ans)) ||
                             (curOpt.length > 4 && ans.includes(curOpt));
                    })();

                    const isThisWrong = isSubmitted && isSelected && !outcome.isCorrect;

                    let borderStyle = `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`;
                    let bgStyle = isSelected ? 'var(--primary-light)' : '#fff';
                    let textStyle = isSelected ? 'var(--primary-dark)' : 'var(--text)';

                    if (isSubmitted) {
                      if (isThisCorrect) {
                        borderStyle = '2px solid #22c55e';
                        bgStyle = '#f0fdf4';
                        textStyle = '#166534';
                      } else if (isThisWrong) {
                        borderStyle = '2px solid #ef4444';
                        bgStyle = '#fef2f2';
                        textStyle = '#991b1b';
                      } else {
                        bgStyle = '#f8fafc';
                        textStyle = '#64748b';
                      }
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => !isSubmitted && setSelectedAnswer(opt)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: 9,
                          textAlign: 'left',
                          border: borderStyle,
                          background: bgStyle,
                          cursor: isSubmitted ? 'default' : 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{
                          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: '0.76rem',
                          background: isSelected && !isSubmitted ? 'var(--primary)' : 'var(--bg)',
                          border: `1.5px solid ${isSelected && !isSubmitted ? 'var(--primary)' : 'var(--border)'}`,
                          color: isSelected && !isSubmitted ? '#fff' : 'var(--text-sub)',
                        }}>
                          {isThisCorrect ? (
                            <HiCheck style={{ fontSize: '0.95rem' }} />
                          ) : isThisWrong ? (
                            <HiX style={{ fontSize: '0.95rem' }} />
                          ) : (
                            OPTION_LABELS[i]
                          )}
                        </div>
                        <span style={{ fontSize: '0.88rem', color: textStyle, fontWeight: isSelected || isThisCorrect ? 600 : 400, lineHeight: 1.4 }}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Action & Feedback Bar */}
              {outcome ? (
                <div>
                  <div style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    marginBottom: '1rem',
                    background: outcome.isCorrect ? '#f0fdf4' : '#fffbeb',
                    border: `1.5px solid ${outcome.isCorrect ? '#86efac' : '#fde68a'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      {outcome.isCorrect ? (
                        <HiCheckCircle style={{ color: '#16a34a', fontSize: '1.25rem' }} />
                      ) : (
                        <HiLightBulb style={{ color: '#d97706', fontSize: '1.25rem' }} />
                      )}
                      <strong style={{ fontSize: '0.92rem', color: outcome.isCorrect ? '#166534' : '#92400e' }}>
                        {outcome.isCorrect ? 'Correct! +25 XP' : 'Concept Insight:'}
                      </strong>
                    </div>

                    {!outcome.isCorrect && outcome.correctAnswer && (
                      <div style={{ fontSize: '0.84rem', color: '#78350f', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Correct answer: <span style={{ color: '#166534', background: '#dcfce7', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{outcome.correctAnswer}</span>
                      </div>
                    )}

                    {outcome.explanation && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: outcome.isCorrect ? '#14532d' : '#78350f', lineHeight: 1.55 }}>
                        {outcome.explanation}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleNextQuestionInSet}
                      style={{
                        fontSize: '0.88rem',
                        padding: '0.65rem 1.35rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: 9,
                        fontWeight: 700,
                      }}
                    >
                      {setQuestionIndex + 1 < SET_TARGET ? (
                        <>
                          <span>Next Question ({setQuestionIndex + 2}/{SET_TARGET})</span>
                          <HiArrowRight />
                        </>
                      ) : (
                        <>
                          <span>Complete Topic & View Mastery</span>
                          <HiCheckCircle />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer || isChecking}
                    style={{
                      fontSize: '0.88rem',
                      padding: '0.65rem 1.35rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      borderRadius: 9,
                      fontWeight: 700,
                      cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isChecking ? 'Checking…' : selectedAnswer ? (
                      <>
                        <span>Check Answer</span>
                        <HiCheck />
                      </>
                    ) : 'Select an Option Above'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.88rem', marginBottom: '1rem' }}>
                You have reviewed this concept! Continue to the next topic in the module.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAdvanceToNextTopic()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
              >
                <span>{isLastTopic ? 'Complete Module' : 'Continue to Next Topic'}</span>
                <HiArrowRight />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveActivity;
