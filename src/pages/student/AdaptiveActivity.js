import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  getNextAdaptiveActivity,
  submitAdaptiveActivity,
} from '../../services/adaptiveService';
import {
  HiCheckCircle, HiArrowRight,
  HiExclamationCircle,
  HiRefresh, HiSparkles,
  HiLightBulb, HiChevronLeft, HiBookOpen,
  HiCheck, HiX, HiPencilAlt, HiVideoCamera,
} from 'react-icons/hi';

import InteractiveConceptAnimator from '../../components/InteractiveConceptAnimator';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

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

// ─── Simple Step Progress Bar ────────────────────────────────────────────────
const StepProgressHeader = ({ chain, currentTopicId, onSelectTopic }) => {
  if (!chain || chain.length === 0) return null;

  const currentIdx = chain.findIndex(t => t.topicId?.toString() === currentTopicId?.toString());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const currentTitle = chain[activeIndex]?.title || 'Current Topic';
  const progressPct = Math.round(((activeIndex + 1) / chain.length) * 100);

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '1rem 1.25rem',
      marginBottom: '1.25rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--primary)',
            background: 'var(--primary-container)',
            padding: '0.2rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            <HiSparkles /> Step {activeIndex + 1} of {chain.length}
          </span>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
            {currentTitle}
          </h3>
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {progressPct}% Completed
        </span>
      </div>

      {/* Progress Track */}
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', marginBottom: '0.75rem' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'var(--primary)',
          borderRadius: 999,
          transition: 'width 0.3s ease',
        }} />
      </div>

      {/* Clickable Step Chips */}
      <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
        {chain.map((step, idx) => {
          const isCurrent = step.topicId?.toString() === currentTopicId?.toString() || (!currentTopicId && idx === 0);
          const isDone = idx < activeIndex;

          return (
            <button
              key={step.topicId || idx}
              type="button"
              onClick={() => onSelectTopic(step.topicId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: isCurrent ? 700 : 500,
                border: `1px solid ${isCurrent ? 'var(--primary)' : isDone ? 'var(--success)' : 'var(--border)'}`,
                background: isCurrent ? 'var(--primary)' : isDone ? '#f0fdf4' : '#fff',
                color: isCurrent ? '#fff' : isDone ? 'var(--success)' : 'var(--text-sub)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {isDone ? <HiCheck style={{ fontSize: '0.85rem' }} /> : <span>{idx + 1}.</span>}
              <span>{step.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Simple Adaptive Learning Page ───────────────────────────────────────
const AdaptiveActivity = () => {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();

  // Read initial topicId from URL search params ONCE on mount
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

  // In-flight guard to prevent duplicate concurrent API requests
  const inFlightRef = useRef(false);

  // ── Load Activity for a specific topic or module ────────────────────────────
  const fetchLesson = useCallback(async (targetTopicId = null, forceNew = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // If we already have content, show subtle inline transition instead of wiping screen
    if (activity) {
      setTransitioning(true);
    } else {
      setLoading(true);
    }

    setSelectedAnswer('');
    setOutcome(null);
    setErrorMsg('');
    setShowAnimation(false);
    setCompletedAll(false);

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
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Unable to load lesson. Please click retry below.');
    } finally {
      setLoading(false);
      setTransitioning(false);
      inFlightRef.current = false;
    }
  }, [moduleId]); // Depends ONLY on moduleId — stable function reference!

  // Trigger initial load once on mount
  useEffect(() => {
    fetchLesson(initialTopicRef.current, false);
  }, [fetchLesson]);

  // ── Handle Option Selection & Answer Checking ───────────────────────────────
  const handleCheckAnswer = async () => {
    if (!selectedAnswer || isChecking || outcome || !activity?._id) return;
    setIsChecking(true);
    try {
      const res = await submitAdaptiveActivity(activity._id, selectedAnswer);
      setOutcome(res);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Verification failed. Please try submitting again.');
    } finally {
      setIsChecking(false);
    }
  };

  // ── Move to Next Topic ──────────────────────────────────────────────────────
  const handleContinueNext = () => {
    const chain = activity?.plan?.topicChain || [];
    const thisTopicId = activity?.plan?.topicId?.toString();
    const currentIdx = chain.findIndex(t => t.topicId?.toString() === thisTopicId);

    if (currentIdx >= 0 && currentIdx + 1 < chain.length) {
      const nextTopic = chain[currentIdx + 1];
      setCurrentTopicId(nextTopic.topicId);
      fetchLesson(nextTopic.topicId, false);
    } else if (outcome?.nextPlan?.topicId && outcome.nextPlan.topicId !== thisTopicId) {
      setCurrentTopicId(outcome.nextPlan.topicId);
      fetchLesson(outcome.nextPlan.topicId, false);
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
        } else if (outcome) {
          handleContinueNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '3rem auto', textAlign: 'center', padding: '2rem' }}>
        <div className="card" style={{ padding: '3rem 2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.25rem' }} />
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text)' }}>
            Loading your adaptive lesson…
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.5rem' }}>
            Preparing concept explanations and tailored practice questions.
          </p>
        </div>
      </div>
    );
  }

  // ── Error Screen with Clean Retry ───────────────────────────────────────────
  if (errorMsg && !activity) {
    return (
      <div style={{ maxWidth: 560, margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <HiExclamationCircle style={{ fontSize: '2.8rem', color: 'var(--danger)', marginBottom: '0.75rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Could Not Load Lesson</h2>
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
      <div style={{ maxWidth: 600, margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4',
            color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', marginBottom: '1rem', border: '2px solid #bbf7d0',
          }}>
            <HiCheckCircle />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.5rem' }}>
            Module Practice Complete!
          </h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1.75rem', lineHeight: 1.6, fontSize: '0.94rem' }}>
            You have successfully completed all topics in this module. Your topic mastery has been updated.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                const firstTopic = activity?.plan?.topicChain?.[0]?.topicId;
                fetchLesson(firstTopic || null, true);
              }}
            >
              <HiRefresh /> Practice Again from Step 1
            </button>
            <Link to="/student/adaptive" className="btn btn-secondary">
              <HiBookOpen /> Practice Hub
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

  const currentIdx  = chain.findIndex(t => t.topicId?.toString() === plan?.topicId?.toString());
  const activeIndex = currentIdx >= 0 ? currentIdx : 0;
  const isLastTopic = currentIdx >= 0 && currentIdx === chain.length - 1;
  const nextTopic   = (currentIdx >= 0 && currentIdx + 1 < chain.length) ? chain[currentIdx + 1] : null;

  // Resolve 4 Multiple Choice Options cleanly
  let options = Array.isArray(payload.options) && payload.options.length >= 2
    ? payload.options
    : (Array.isArray(question?.options) && question.options.length >= 2 ? question.options : null);

  // Fallback options if missing from backend
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
    <div style={{ maxWidth: 760, margin: '0 auto', paddingBottom: '3.5rem' }}>
      {/* Top Header / Back Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Link
          to="/student/adaptive"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            color: 'var(--text-sub)',
            textDecoration: 'none',
          }}
        >
          <HiChevronLeft /> Back to Practice Hub
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Self-Paced Practice
        </span>
      </div>

      {/* Guided Progress Ribbon */}
      <StepProgressHeader
        chain={chain}
        currentTopicId={plan?.topicId}
        onSelectTopic={(tid) => fetchLesson(tid, false)}
      />

      {/* Inline Transition Notice */}
      {transitioning && (
        <div style={{
          textAlign: 'center',
          padding: '0.5rem',
          marginBottom: '1rem',
          background: 'var(--primary-container)',
          color: 'var(--primary)',
          borderRadius: 8,
          fontSize: '0.82rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}>
          <div className="spinner" style={{ width: 14, height: 14 }} /> Loading next topic…
        </div>
      )}

      {/* ── CARD 1: BITE-SIZED CONCEPT ────────────────────────────────────────── */}
      {content && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--primary)',
              background: 'var(--primary-container)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <HiLightBulb /> Core Concept
            </span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
            {content.headline || plan?.topicTitle || 'Concept Overview'}
          </h2>

          {/* Everyday Analogy */}
          {content.analogy && (
            <div style={{
              padding: '0.85rem 1.1rem',
              background: '#eff6ff',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0 8px 8px 0',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#1e3a8a',
              lineHeight: 1.6,
            }}>
              <strong>Intuition:</strong> {content.analogy}
            </div>
          )}

          {/* Simple Explanation */}
          {content.explanation && (
            <p style={{ fontSize: '0.94rem', color: 'var(--text-sub)', lineHeight: 1.7, marginBottom: '1rem' }}>
              {content.explanation}
            </p>
          )}

          {/* Code in Action */}
          {content.workedExample && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Code Example:
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#38bdf8',
                padding: '0.95rem 1.1rem',
                borderRadius: 8,
                fontSize: '0.88rem',
                lineHeight: 1.6,
                fontFamily: 'Consolas, Monaco, monospace',
                overflowX: 'auto',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {content.workedExample}
              </pre>
            </div>
          )}

          {/* Key Rule Pill */}
          {content.keyInsight && (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: 8,
              fontSize: '0.88rem',
              color: '#166534',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <HiCheckCircle style={{ color: '#16a34a', fontSize: '1.2rem', flexShrink: 0 }} />
              <span><strong>Key Rule:</strong> {content.keyInsight}</span>
            </div>
          )}

          {/* Optional Visual Walkthrough Expander */}
          {content.animation && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setShowAnimation(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: 0,
                }}
              >
                <HiVideoCamera style={{ fontSize: '1rem' }} />
                <span>{showAnimation ? 'Hide Visual Animation' : 'Watch Visual Animation'}</span>
              </button>
              {showAnimation && (
                <div style={{ marginTop: '0.75rem' }}>
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

      {/* ── CARD 2: TARGETED PRACTICE QUESTION ─────────────────────────────────── */}
      {question ? (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--warning)',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              padding: '0.2rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <HiPencilAlt /> Knowledge Check
            </span>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
            {parsedQuestion.prompt || question.questionText}
          </h3>

          {/* Code block in question if present */}
          {(parsedQuestion.code || payload.codeSnippet || payload.buggyCode) && (
            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '0.9rem 1rem',
              borderRadius: 8,
              fontSize: '0.86rem',
              lineHeight: 1.6,
              fontFamily: 'monospace',
              overflowX: 'auto',
              marginBottom: '1rem',
              whiteSpace: 'pre-wrap',
            }}>
              {payload.codeSnippet || payload.buggyCode || parsedQuestion.code}
            </pre>
          )}

          {/* Scenario paragraph if present */}
          {payload.scenario && (
            <div style={{
              padding: '0.8rem 1rem',
              background: '#f8fafc',
              borderLeft: '3px solid #64748b',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.88rem',
              color: 'var(--text-sub)',
              lineHeight: 1.6,
              marginBottom: '1rem',
            }}>
              {payload.scenario}
            </div>
          )}

          {/* 4 Multiple Choice Options */}
          {options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
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
                      gap: '0.85rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: 10,
                      textAlign: 'left',
                      border: borderStyle,
                      background: bgStyle,
                      cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected && !isSubmitted ? '0 2px 8px rgba(15,23,42,0.08)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
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
                    <span style={{ fontSize: '0.92rem', color: textStyle, fontWeight: isSelected || isThisCorrect ? 600 : 400, lineHeight: 1.45 }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── CARD 3: FEEDBACK & NEXT TOPIC BUTTON ──────────────────────────── */}
          {outcome ? (
            <div>
              <div style={{
                padding: '1.1rem',
                borderRadius: 8,
                marginBottom: '1.25rem',
                background: outcome.isCorrect ? '#f0fdf4' : '#fffbeb',
                border: `1.5px solid ${outcome.isCorrect ? '#86efac' : '#fde68a'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                  {outcome.isCorrect ? (
                    <HiCheckCircle style={{ color: '#16a34a', fontSize: '1.35rem' }} />
                  ) : (
                    <HiLightBulb style={{ color: '#d97706', fontSize: '1.35rem' }} />
                  )}
                  <strong style={{ fontSize: '0.96rem', color: outcome.isCorrect ? '#166534' : '#92400e' }}>
                    {outcome.isCorrect ? 'Correct! Well done.' : 'Review Concept:'}
                  </strong>
                </div>

                {!outcome.isCorrect && outcome.correctAnswer && (
                  <div style={{ paddingLeft: '1.8rem', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#78350f', fontWeight: 600 }}>
                    Correct answer: <span style={{ color: '#166534', background: '#dcfce7', padding: '0.15rem 0.45rem', borderRadius: 4 }}>{outcome.correctAnswer}</span>
                  </div>
                )}

                {outcome.explanation && (
                  <p style={{ margin: 0, fontSize: '0.88rem', color: outcome.isCorrect ? '#14532d' : '#78350f', lineHeight: 1.6, paddingLeft: '1.8rem' }}>
                    {outcome.explanation}
                  </p>
                )}
              </div>

              {/* Big, Obvious Next Button */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleContinueNext}
                  style={{
                    fontSize: '0.95rem',
                    padding: '0.7rem 1.5rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                  }}
                >
                  {isLastTopic ? (
                    <>
                      <span>Complete Module & Summary</span>
                      <HiCheckCircle style={{ fontSize: '1.05rem' }} />
                    </>
                  ) : nextTopic ? (
                    <>
                      <span>Next Topic: {nextTopic.title}</span>
                      <HiArrowRight style={{ fontSize: '1rem' }} />
                    </>
                  ) : (
                    <>
                      <span>Continue to Next Step</span>
                      <HiArrowRight style={{ fontSize: '1rem' }} />
                    </>
                  )}
                </button>

                {!outcome.isCorrect && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fetchLesson(plan?.topicId, true)}
                    style={{ fontSize: '0.85rem', padding: '0.7rem 1rem' }}
                  >
                    <HiRefresh /> Try Another Question
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Submit Button
            <div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer || isChecking}
                style={{
                  fontSize: '0.92rem',
                  padding: '0.7rem 1.5rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: 'var(--radius)',
                  cursor: selectedAnswer ? 'pointer' : 'not-allowed',
                }}
              >
                {isChecking ? 'Checking…' : selectedAnswer ? (
                  <>
                    <span>Check Answer</span>
                    <HiCheck style={{ fontSize: '1rem' }} />
                  </>
                ) : 'Select an Option Above'}
              </button>
            </div>
          )}
        </div>
      ) : (
        // If no question generated, allow student to simply continue to next topic
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
            You have reviewed this concept! Continue to the next topic in the module.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleContinueNext}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.5rem' }}
          >
            <span>{isLastTopic ? 'Complete Module' : 'Continue to Next Topic'}</span>
            <HiArrowRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdaptiveActivity;
