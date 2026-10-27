import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CelebrationModal from '../../components/CelebrationModal';
import {
  HiChevronRight, HiChevronLeft, HiCheckCircle, HiXCircle,
  HiClock, HiClipboardList, HiLightningBolt, HiAcademicCap,
  HiTrendingUp, HiArrowRight, HiSparkles, HiFire,
  HiExclamationCircle, HiExclamation, HiX,
} from 'react-icons/hi';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const scoreColor = (pct) =>
  pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';

const scoreBg = (pct) =>
  pct >= 70 ? '#f0fdf4' : pct >= 40 ? '#fffbeb' : '#fef2f2';

const scoreBorder = (pct) =>
  pct >= 70 ? '#bbf7d0' : pct >= 40 ? '#fde68a' : '#fecaca';

// ─── Timer ring ───────────────────────────────────────────────────────────────
const TimerRing = ({ timeLeft, totalTime }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = totalTime > 0 ? timeLeft / totalTime : 0;
  const isLow = timeLeft < 60;
  const color = isLow ? 'var(--danger)' : 'var(--primary)';

  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle
          cx={28} cy={28} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 800, color: isLow ? 'var(--danger)' : 'var(--text)',
        fontFamily: 'monospace',
      }}>
        {fmt(timeLeft)}
      </div>
    </div>
  );
};

// ─── Question card ────────────────────────────────────────────────────────────
const QuestionCard = ({ question, qIdx, total, selected, onSelect }) => (
  <div style={{ animation: 'slideUp 0.25s ease' }}>
    {/* Question number + marks */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem',
        }}>
          {qIdx + 1}
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Question {qIdx + 1} of {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {question.marks} mark{question.marks !== 1 ? 's' : ''}
            {question.difficulty && ` · ${question.difficulty}`}
          </div>
        </div>
      </div>
      {selected ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--green-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <HiCheckCircle /> Answered
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <HiExclamationCircle /> Not answered yet
        </div>
      )}
    </div>

    {/* Question text */}
    <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
      {question.questionText}
    </p>

    {/* Options */}
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {question.options?.map((opt, oi) => {
        const isSelected = selected === opt;
        return (
          <button
            key={oi}
            onClick={() => onSelect(opt)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.875rem 1rem',
              borderRadius: 'var(--radius)',
              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
              background: isSelected ? 'var(--primary-light)' : 'white',
              cursor: 'pointer', transition: 'all 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--text-sub)'; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem',
              background: isSelected ? 'var(--primary)' : 'var(--bg)',
              border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
              color: isSelected ? '#fff' : 'var(--text-sub)',
              transition: 'all 0.15s',
            }}>
              {OPTION_LABELS[oi]}
            </div>
            <span style={{ fontSize: '0.9rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text)', fontWeight: isSelected ? 600 : 400, lineHeight: 1.4 }}>
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Adaptation plan panel ────────────────────────────────────────────────────
const AdaptationPanel = ({ plan, moduleId }) => {
  if (!plan || !plan.hasGap) return null;

  const actionLabel = {
    remediate: 'Remediation Recommended',
    reinforce: 'Reinforcement Recommended',
    advance:   'Ready to Advance',
  }[plan.action] || 'Adaptive Recommendation';

  const actionColor = {
    remediate: '#ef4444',
    reinforce: '#f59e0b',
    advance:   'var(--success)',
  }[plan.action] || 'var(--info)';

  const strategyLabel = {
    worked_examples:          'Worked Examples',
    remedial_explanation:     'Remedial Explanation',
    misconception_correction: 'Misconception Correction',
    targeted_practice:        'Targeted Practice',
    advanced_practice:        'Advanced Practice',
  }[plan.contentStrategy] || plan.contentStrategy;

  const formatLabel = {
    mcq:            'Multiple Choice',
    short_answer:   'Short Answer',
    code_completion:'Code Completion',
    code_tracing:   'Code Tracing',
    debugging:      'Debugging',
    scenario_based: 'Scenario-Based',
  }[plan.assessmentFormat] || plan.assessmentFormat;

  return (
    <div style={{ border: `1px solid ${actionColor}`, borderLeft: `4px solid ${actionColor}`, borderRadius: 10, padding: '1.25rem', background: 'white', marginBottom: '1.25rem', animation: 'slideUp 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <HiAcademicCap style={{ color: actionColor, fontSize: '1.1rem', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{actionLabel}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.875rem' }}>
        {[
          { label: 'Topic',       value: plan.topicTitle },
          { label: 'Mastery',     value: `${Math.round(plan.mastery * 100)}%` },
          { label: 'Strategy',    value: strategyLabel },
          { label: 'Format',      value: formatLabel },
          { label: 'Bloom Level', value: plan.bloomLevel },
          { label: 'Difficulty',  value: plan.difficulty },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{value}</div>
          </div>
        ))}
      </div>

      {plan.reason && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.875rem' }}>
          {plan.reason}
        </p>
      )}

      {/* CTA — links to the actual adaptive practice page targeted to this topic */}
      {moduleId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link
            to={`/student/adaptive/${moduleId}${plan?.topicId ? `?topicId=${plan.topicId}&forceNew=true` : ''}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.6rem 1.15rem', borderRadius: 8, fontWeight: 700,
              fontSize: '0.86rem', textDecoration: 'none',
              background: actionColor, color: '#fff',
              transition: 'opacity 0.15s',
              alignSelf: 'flex-start',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <HiLightningBolt /> Start Targeted Practice on {plan.topicTitle || 'Weak Concept'} <HiArrowRight />
          </Link>

          {plan.allGaps?.length > 1 && (
            <div style={{ marginTop: '0.25rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Other Concepts Needing Practice:
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {plan.allGaps.slice(1).map((gap, i) => (
                  <Link
                    key={i}
                    to={`/student/adaptive/${moduleId}?topicId=${gap.topicId}&forceNew=true`}
                    style={{
                      fontSize: '0.76rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: 6,
                      background: '#f8fafc',
                      color: 'var(--navy)',
                      textDecoration: 'none',
                      fontWeight: 600,
                      border: '1px solid var(--border)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <HiSparkles style={{ color: 'var(--primary)', fontSize: '0.85rem' }} />
                    <span>{gap.topicTitle} ({Math.round(gap.mastery * 100)}%)</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Pre-Submission Confirmation & Overview Modal ──────────────────────────────
const SubmitOverviewModal = ({
  isOpen,
  onClose,
  total,
  answeredCount,
  questions,
  answers,
  onJumpToQuestion,
  onSubmitConfirm,
  submitting,
}) => {
  if (!isOpen) return null;

  const unansweredCount = total - answeredCount;
  const hasUnanswered = unansweredCount > 0;
  const progressPct = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9998,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 540,
        padding: '2rem',
        boxShadow: hasUnanswered
          ? '0 20px 45px -10px rgba(239, 68, 68, 0.28), 0 0 0 1px rgba(239, 68, 68, 0.2)'
          : 'var(--shadow-xl)',
        border: `2px solid ${hasUnanswered ? '#ef4444' : 'var(--primary)'}`,
        position: 'relative',
        animation: 'popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Close icon */}
        <button
          onClick={onClose}
          aria-label="Close Overview"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
        >
          <HiX />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: hasUnanswered ? '#fee2e2' : 'var(--primary-container)',
            color: hasUnanswered ? '#dc2626' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.45rem',
            flexShrink: 0,
          }}>
            {hasUnanswered ? <HiExclamationCircle /> : <HiClipboardList />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
              Quiz Submission Overview
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Review your attempted and remaining questions before final grading
            </p>
          </div>
        </div>

        {/* Progress summary bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          margin: '1.25rem 0',
        }}>
          {/* Attempted */}
          <div style={{
            padding: '0.9rem 1rem',
            borderRadius: 12,
            background: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Questions Attempted
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 900, color: '#15803d', lineHeight: 1.15, marginTop: 2 }}>
                {answeredCount} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534' }}>/ {total} ({progressPct}%)</span>
              </div>
            </div>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              <HiCheckCircle />
            </div>
          </div>

          {/* Remaining / Skipped */}
          <div style={{
            padding: '0.9rem 1rem',
            borderRadius: 12,
            background: hasUnanswered ? '#fef2f2' : '#f8fafc',
            border: `1.5px solid ${hasUnanswered ? '#fecaca' : '#e2e8f0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: hasUnanswered ? '#991b1b' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Remaining / Skipped
              </div>
              <div style={{ fontSize: '1.55rem', fontWeight: 900, color: hasUnanswered ? '#dc2626' : 'var(--text)', lineHeight: 1.15, marginTop: 2 }}>
                {unansweredCount} <span style={{ fontSize: '0.82rem', fontWeight: 600, color: hasUnanswered ? '#991b1b' : 'var(--text-muted)' }}>unanswered</span>
              </div>
            </div>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: hasUnanswered ? '#fee2e2' : '#f1f5f9',
              color: hasUnanswered ? '#dc2626' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              {hasUnanswered ? <HiExclamationCircle /> : <HiCheckCircle />}
            </div>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
        {hasUnanswered ? (
          <div style={{
            padding: '0.9rem 1.1rem',
            borderRadius: 12,
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            textAlign: 'left',
          }}>
            <HiExclamationCircle style={{ color: '#e11d48', fontSize: '1.4rem', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#9f1239', marginBottom: 3 }}>
                Incomplete Quiz Alert: {unansweredCount} Question{unansweredCount > 1 ? 's' : ''} Skipped
              </div>
              <div style={{ fontSize: '0.8rem', color: '#881337', lineHeight: 1.5 }}>
                Skipped questions receive <strong>0 marks</strong>. If you submit right now, your maximum possible score is <strong>{progressPct}%</strong>{progressPct === 0 ? ' (0% score)' : ''}. Click any question number below to answer it before submitting!
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '0.8rem 1rem',
            borderRadius: 12,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.65rem',
            alignItems: 'center',
            textAlign: 'left',
          }}>
            <HiCheckCircle style={{ color: '#16a34a', fontSize: '1.3rem', flexShrink: 0 }} />
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#166534' }}>
              All {total} questions have been answered. You are fully prepared for submission!
            </div>
          </div>
        )}

        {/* Interactive Matrix of Question Numbers */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.6rem',
          }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Question Status Grid (Click to Jump)
            </span>
            <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} /> Answered
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fee2e2', border: '1px solid #ef4444', display: 'inline-block' }} /> Skipped
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
            gap: '0.5rem',
            maxHeight: 180,
            overflowY: 'auto',
            padding: '0.35rem',
            background: 'var(--bg)',
            borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q._id];
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onJumpToQuestion(idx);
                    onClose();
                  }}
                  title={isAnswered ? `Question ${idx + 1}: Answered (Click to review)` : `Question ${idx + 1}: Skipped (Click to answer)`}
                  style={{
                    height: 44,
                    borderRadius: 10,
                    border: isAnswered ? '1.5px solid var(--success)' : '1.5px dashed #ef4444',
                    background: isAnswered ? '#f0fdf4' : '#fff5f5',
                    color: isAnswered ? '#15803d' : '#b91c1c',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>{idx + 1}</span>
                  <span style={{ fontSize: '0.62rem', marginTop: -2, fontWeight: 700 }}>
                    {isAnswered ? '✓' : 'SKIP'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (hasUnanswered) {
                const firstSkipped = questions.findIndex(q => !answers[q._id]);
                if (firstSkipped !== -1) {
                  onJumpToQuestion(firstSkipped);
                }
              }
              onClose();
            }}
            style={{ fontSize: '0.86rem', padding: '0.65rem 1.15rem' }}
          >
            {hasUnanswered ? '← Answer Skipped Questions' : '← Back to Questions'}
          </button>

          <button
            onClick={onSubmitConfirm}
            disabled={submitting}
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: '0.86rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#ffffff',
              background: hasUnanswered ? '#dc2626' : 'var(--primary)',
              boxShadow: hasUnanswered ? '0 4px 14px rgba(220, 38, 38, 0.35)' : 'var(--shadow-primary)',
              transition: 'all 0.15s ease',
            }}
          >
            {submitting ? (
              <><span className="btn-spinner" /> Submitting…</>
            ) : hasUnanswered ? (
              <>Submit Quiz Anyway (0 Marks for Skipped) <HiArrowRight /></>
            ) : (
              <>Confirm & Submit Quiz <HiCheckCircle /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Result screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ result, quiz, timeTaken, onReopenCelebration }) => {
  const { percentage = 0, recommendedDifficulty, message } = result.feedback || {};
  const adaptation = result.adaptation;
  const gamification = result.gamification;
  const stats = result.stats || {};
  const moduleId = quiz?.moduleId?._id || quiz?.moduleId || result.result?.moduleId;
  const [showBreakdown, setShowBreakdown] = useState(true);
  const navigate = useNavigate();

  const isLowScore = percentage < 40;
  const isZeroScore = percentage === 0;

  const totalQuestions = quiz.questions?.length || 0;
  const attemptedCount = stats.attempted ?? result.result?.answers?.filter(a => !!a.selectedAnswer)?.length ?? 0;
  const skippedCount = stats.skipped ?? (totalQuestions - attemptedCount);
  const correctCount = stats.correct ?? result.result?.answers?.filter(a => a.isCorrect)?.length ?? 0;
  const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

  const scoreLabel =
    percentage >= 70 ? 'Excellent!' :
    percentage >= 40 ? 'Good Effort!' :
    isZeroScore ? 'Incomplete Assessment (0%)' : 'Needs Practice';

  // Build answered question details from quiz + submitted answers
  const breakdown = quiz.questions.map((q, i) => {
    const ans = result.result?.answers?.[i];
    return {
      ...q,
      selectedAnswer: ans?.selectedAnswer,
      isCorrect: ans?.isCorrect,
      correctAnswer: ans?.correctAnswer || q.correctAnswer,
      explanation: ans?.explanation || q.explanation,
    };
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', animation: 'slideUp 0.3s ease' }}>
      {/* ── Red Alert Banner for 0% or Low Score (< 40%) ──────────────────────── */}
      {isLowScore && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '2px solid #ef4444',
          borderRadius: 16,
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)',
          animation: 'slideUp 0.3s ease',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          <div style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.65rem',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}>
            <HiExclamationCircle />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '0.2rem 0.6rem',
              borderRadius: 999,
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.35rem',
            }}>
              <HiExclamation /> Critical Alert · {isZeroScore ? '0% Scored' : 'Low Score Warning'}
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: '0 0 0.35rem 0' }}>
              {isZeroScore
                ? (skippedCount === totalQuestions
                    ? 'All Questions Were Skipped (0% Awarded)'
                    : 'Quiz Scored 0% — Unanswered or Incorrect Questions')
                : `Quiz Scored ${percentage}% — Foundational Review Recommended`}
            </h3>
            <p style={{ fontSize: '0.86rem', color: '#7f1d1d', margin: 0, lineHeight: 1.5 }}>
              {skippedCount > 0
                ? `You skipped ${skippedCount} of ${totalQuestions} question${skippedCount > 1 ? 's' : ''}. Unanswered questions receive 0 marks. Use the detailed answer review below to understand what was missed, then reinforce your knowledge in the Adaptive Skill Arena.`
                : 'All questions attempted were incorrect. Review the solutions and explanations below to master the core concepts.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Executive Overview Card ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <HiClipboardList style={{ fontSize: '1.1rem', color: 'var(--primary)' }} /> Assessment Executive Overview
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {/* Total */}
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Questions</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>{totalQuestions}</div>
          </div>
          {/* Attempted */}
          <div style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>Attempted</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#15803d', marginTop: 2 }}>{attemptedCount}</div>
          </div>
          {/* Skipped */}
          <div style={{
            padding: '0.75rem',
            background: skippedCount > 0 ? '#fef2f2' : '#f8fafc',
            border: `1.5px solid ${skippedCount > 0 ? '#fecaca' : 'var(--border)'}`,
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.66rem', color: skippedCount > 0 ? '#991b1b' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Skipped</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: skippedCount > 0 ? '#dc2626' : 'var(--text)', marginTop: 2 }}>{skippedCount}</div>
          </div>
          {/* Marks */}
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Final Score</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: scoreColor(percentage), marginTop: 2 }}>
              {result.result?.score ?? 0}/{result.result?.totalMarks ?? totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Score card */}
      <div className="card" style={{
        textAlign: 'center', marginBottom: '1.25rem',
        border: `2px solid ${scoreBorder(percentage)}`,
        background: scoreBg(percentage),
      }}>
        {/* Circular score */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 1.25rem' }}>
          <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={60} cy={60} r={50} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={8} />
            <circle
              cx={60} cy={60} r={50} fill="none"
              stroke={scoreColor(percentage)} strokeWidth={8}
              strokeDasharray={2 * Math.PI * 50}
              strokeDashoffset={2 * Math.PI * 50 * (1 - percentage / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease 0.3s' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: scoreColor(percentage), lineHeight: 1 }}>
              {percentage}%
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              score
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.3rem' }}>
          {scoreLabel}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>{message}</p>

        {/* Gamification summary pill if available */}
        {gamification && (
          <div style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            color: 'var(--text)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: (gamification.xpEarned ?? 0) > 0 ? 'var(--primary-container)' : '#f1f5f9',
                color: (gamification.xpEarned ?? 0) > 0 ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                <HiLightningBolt />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: (gamification.xpEarned ?? 0) > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                  {(gamification.xpEarned ?? 0) > 0 ? `+${gamification.xpEarned} XP Awarded!` : '0 XP Awarded (Skipped / 0% Quiz)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Level {gamification.level || 1} · {gamification.levelTitle || 'Coder'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'var(--warning-bg)',
                border: '1px solid var(--warning-border)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
              }}>
                <HiFire style={{ color: 'var(--warning)', fontSize: '1.1rem' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--warning)' }}>
                  {gamification.streak || 1}d Streak
                </span>
              </div>
              {onReopenCelebration && (
                <button
                  onClick={onReopenCelebration}
                  style={{
                    background: isLowScore ? '#fee2e2' : '#ffffff',
                    border: `1px solid ${isLowScore ? '#ef4444' : 'var(--border)'}`,
                    color: isLowScore ? '#b91c1c' : 'var(--primary)',
                    borderRadius: 8,
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="View Feedback Modal"
                >
                  {isLowScore ? <HiExclamationCircle /> : <HiSparkles />} {isLowScore ? 'Alert Overview' : 'Rewards'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { Icon: HiClipboardList, label: 'Marks',    value: `${result.result.score}/${result.result.totalMarks}` },
            { Icon: HiClock,         label: 'Time',     value: timeTaken ? `${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s` : '—' },
            { Icon: HiAcademicCap,   label: 'Level',    value: recommendedDifficulty, cap: true },
          ].map(({ Icon, label, value, cap }) => (
            <div key={label} style={{ padding: '0.75rem', background: 'white', borderRadius: 10, border: '1px solid var(--border)' }}>
              <Icon style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }} />
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{label}</div>
              <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.9rem', textTransform: cap ? 'capitalize' : 'none' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden', marginBottom: '1.25rem' }}>
          <div style={{ height: '100%', width: `${percentage}%`, background: scoreColor(percentage), borderRadius: 999, transition: 'width 1s ease 0.5s' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => setShowBreakdown(v => !v)} style={{ fontSize: '0.85rem' }}>
            {showBreakdown ? 'Hide' : 'View'} Answer Breakdown
          </button>
          {moduleId && (
            <Link
              to={`/student/adaptive/${moduleId}${adaptation?.topicId ? `?topicId=${adaptation.topicId}&forceNew=true` : ''}`}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <HiLightningBolt /> Adaptive Skill Arena
            </Link>
          )}
          <Link to="/student/modules" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Browse Modules <HiArrowRight />
          </Link>
        </div>
      </div>

      {/* Adaptation recommendation */}
      <AdaptationPanel plan={adaptation} moduleId={moduleId} />

      {/* Answer breakdown */}
      {showBreakdown && (
        <div id="answer-breakdown-section" style={{ animation: 'slideUp 0.2s ease', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
              Detailed Question & Answer Breakdown
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {correctCount} Correct · {attemptedCount - correctCount} Incorrect · {skippedCount} Skipped
            </div>
          </div>

          {breakdown.map((q, i) => {
            const isSkipped = !q.selectedAnswer || q.selectedAnswer.toString().trim() === '';
            const statusBorder = q.isCorrect ? 'var(--success)' : isSkipped ? '#f59e0b' : 'var(--danger)';

            return (
              <div key={i} className="card" style={{
                marginBottom: '0.85rem', padding: '1.15rem',
                borderLeft: `4px solid ${statusBorder}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Question {i + 1} of {totalQuestions}
                      </span>
                      {q.isCorrect ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800 }}>
                          CORRECT (+{q.marks || 1} Marks)
                        </span>
                      ) : isSkipped ? (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <HiExclamationCircle /> SKIPPED (0 Marks)
                        </span>
                      ) : (
                        <span style={{ background: '#fee2e2', color: '#dc2626', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.68rem', fontWeight: 800 }}>
                          INCORRECT (0 Marks)
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                      {q.questionText}
                    </p>
                  </div>
                  {q.isCorrect ? (
                    <HiCheckCircle style={{ color: 'var(--success)', fontSize: '1.35rem', flexShrink: 0, marginTop: 2 }} />
                  ) : isSkipped ? (
                    <HiExclamationCircle style={{ color: '#f59e0b', fontSize: '1.35rem', flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <HiXCircle style={{ color: 'var(--danger)', fontSize: '1.35rem', flexShrink: 0, marginTop: 2 }} />
                  )}
                </div>

                {/* Answer status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.6rem' }}>
                  {isSkipped ? (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#fff7ed',
                      border: '1px solid #ffedd5',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: '#c2410c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      <HiExclamation /> You skipped this question during the quiz.
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: q.isCorrect ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${q.isCorrect ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: q.isCorrect ? '#166534' : '#991b1b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      {q.isCorrect ? <HiCheckCircle /> : <HiXCircle />}
                      <span>Your Answer: <strong>{q.selectedAnswer}</strong></span>
                    </div>
                  )}

                  {/* Show correct answer if question was skipped or incorrect */}
                  {(!q.isCorrect || isSkipped) && q.correctAnswer && (
                    <div style={{
                      padding: '0.5rem 0.75rem',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      fontSize: '0.82rem',
                      color: '#15803d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}>
                      <HiCheckCircle style={{ color: '#16a34a', flexShrink: 0 }} />
                      <span>Correct Answer: <strong>{q.correctAnswer}</strong></span>
                    </div>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div style={{
                      marginTop: '0.35rem',
                      padding: '0.6rem 0.85rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      color: 'var(--text-sub)',
                      lineHeight: 1.55,
                    }}>
                      <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 2 }}>Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/student/results" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
              <HiTrendingUp /> View all my results
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const QuizAttempt = () => {
  const { id } = useParams();
  const { updateGamification } = useAuth();
  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(null);
  const [totalTime, setTotalTime] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [gamificationData, setGamificationData] = useState(null);
  const startTime = useRef(Date.now());
  const timerRef  = useRef(null);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(({ data }) => {
      setQuiz(data);
      const secs = data.timeLimit * 60;
      setTimeLeft(secs);
      setTotalTime(secs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    setShowOverviewModal(false);
    clearTimeout(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const payload = quiz.questions.map(q => ({
      questionId: q._id,
      selectedAnswer: answers[q._id] || '',
    }));
    try {
      const { data } = await api.post('/results/submit', { quizId: id, answers: payload, timeTaken });
      setResult({ ...data, timeTaken });
      setSubmitted(true);
      if (data.gamification) {
        setGamificationData(data.gamification);
        if (updateGamification) updateGamification(data.gamification);
      }
      // Always trigger feedback modal (Critical Red Alert for 0% / low score, Celebration for high score)
      setShowCelebration(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, quiz, answers, id, updateGamification]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted, handleSubmit]);

  if (loading) return <div className="loading"><div className="spinner" />Loading quiz…</div>;
  if (!quiz)   return <div className="alert alert-error">Quiz not found.</div>;

  const total    = quiz.questions.length;
  const answered = Object.keys(answers).filter(k => (answers[k] || '').toString().trim() !== '').length;

  if (submitted && result) {
    const timeTaken = result.timeTaken ?? Math.round((Date.now() - startTime.current) / 1000);
    const pct = result.feedback?.percentage ?? result.result?.percentage ?? 0;
    return (
      <div>
        <CelebrationModal
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
          gamification={gamificationData || result.gamification}
          percentage={pct}
          score={result.result?.score ?? 0}
          totalMarks={result.result?.totalMarks ?? total}
          stats={result.stats || {
            totalQuestions: total,
            attempted: answered,
            skipped: total - answered,
            correct: result.result?.answers?.filter(a => a.isCorrect)?.length || 0,
            incorrect: Math.max(0, answered - (result.result?.answers?.filter(a => a.isCorrect)?.length || 0)),
          }}
          onReviewBreakdown={() => {
            setShowCelebration(false);
            const el = document.getElementById('answer-breakdown-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
        <div className="page-header">
          <h1 className="page-title">Quiz Complete</h1>
        </div>
        <ResultScreen
          result={result}
          quiz={quiz}
          timeTaken={timeTaken}
          onReopenCelebration={() => setShowCelebration(true)}
        />
      </div>
    );
  }

  const question = quiz.questions[current];
  const isLast   = current === total - 1;
  const isFirst  = current === 0;
  const timeIsLow = timeLeft !== null && timeLeft < 60;

  return (
    <div>
      {/* ── Pre-Submission Overview Modal ────────────────────────────────────── */}
      <SubmitOverviewModal
        isOpen={showOverviewModal}
        onClose={() => setShowOverviewModal(false)}
        total={total}
        answeredCount={answered}
        questions={quiz.questions}
        answers={answers}
        onJumpToQuestion={(idx) => {
          setCurrent(idx);
          setShowOverviewModal(false);
        }}
        onSubmitConfirm={handleSubmit}
        submitting={submitting}
      />

      {/* Quiz header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.1rem' }}>{quiz.title}</h1>
          <p className="page-subtitle">
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>{answered}</span> of {total} answered · <span style={{ color: total - answered > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>{total - answered} remaining</span>
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowOverviewModal(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Overview attempted vs remaining questions"
          >
            <HiClipboardList /> Review & Submit ({answered}/{total})
          </button>
          <TimerRing timeLeft={timeLeft ?? 0} totalTime={totalTime ?? 1} />
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 999, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(answered / total) * 100}%`, background: 'var(--primary)', borderRadius: 999, transition: 'width 0.3s ease' }} />
      </div>

      {/* Question dot nav */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {quiz.questions.map((q, i) => {
          const isAns = !!answers[q._id];
          const isCur = i === current;
          return (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: 34, height: 34, borderRadius: '50%', border: 'none',
                fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                background: isCur ? 'var(--primary)' : isAns ? 'var(--success)' : 'var(--border)',
                color: (isCur || isAns) ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
                outline: isCur ? '2px solid var(--primary)' : 'none',
                outlineOffset: 2,
              }}
              title={isAns ? `Question ${i + 1}: Answered` : `Question ${i + 1}: Unanswered`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: '1rem', borderTop: `3px solid ${timeIsLow ? 'var(--danger)' : 'var(--primary)'}` }}>
          <QuestionCard
            question={question}
            qIdx={current}
            total={total}
            selected={answers[question._id]}
            onSelect={opt => setAnswers(prev => ({ ...prev, [question._id]: opt }))}
          />
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrent(p => p - 1)}
            disabled={isFirst}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <HiChevronLeft /> Previous
          </button>

          <button
            onClick={() => setShowOverviewModal(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '0.82rem',
              color: total - answered > 0 ? '#dc2626' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'underline',
            }}
          >
            {total - answered > 0 ? `${total - answered} remaining (Click for overview)` : 'All answered'}
          </button>

          {isLast ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowOverviewModal(true)}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submitting ? <><span className="btn-spinner" /> Submitting…</> : <>Review & Submit <HiCheckCircle /></>}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={() => setCurrent(p => p + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Next <HiChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
