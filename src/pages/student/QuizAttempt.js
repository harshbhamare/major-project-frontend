import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  HiChevronRight, HiChevronLeft, HiCheckCircle, HiXCircle,
  HiClock, HiClipboardList, HiLightningBolt, HiAcademicCap,
  HiTrendingUp, HiArrowRight,
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
  const color = isLow ? 'var(--danger)' : 'var(--green)';

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
          background: 'var(--navy)', color: '#fff',
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
      {selected && (
        <div style={{ fontSize: '0.75rem', color: 'var(--green-dark)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <HiCheckCircle /> Answered
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
              borderRadius: 10,
              border: `2px solid ${isSelected ? 'var(--navy)' : 'var(--border)'}`,
              background: isSelected ? 'var(--navy)' : 'white',
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
              background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
              border: `1.5px solid ${isSelected ? 'rgba(255,255,255,0.4)' : 'var(--border)'}`,
              color: isSelected ? '#fff' : 'var(--text-sub)',
              transition: 'all 0.15s',
            }}>
              {OPTION_LABELS[oi]}
            </div>
            <span style={{ fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text)', fontWeight: isSelected ? 600 : 400, lineHeight: 1.4 }}>
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Result screen ────────────────────────────────────────────────────────────
const ResultScreen = ({ result, quiz, timeTaken, onRetry }) => {
  const { percentage, recommendedDifficulty, message } = result.feedback;
  const [showBreakdown, setShowBreakdown] = useState(false);
  const navigate = useNavigate();

  const scoreLabel =
    percentage >= 70 ? 'Excellent' :
    percentage >= 40 ? 'Good Effort' : 'Keep Practising';

  // Build answered question details from quiz + submitted answers
  const breakdown = quiz.questions.map((q, i) => {
    const ans = result.result?.answers?.[i];
    return { ...q, selectedAnswer: ans?.selectedAnswer, isCorrect: ans?.isCorrect };
  });

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', animation: 'slideUp 0.3s ease' }}>
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
          <Link to="/student/modules" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            Browse Modules <HiArrowRight />
          </Link>
        </div>
      </div>

      {/* Answer breakdown */}
      {showBreakdown && (
        <div style={{ animation: 'slideUp 0.2s ease' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.875rem', color: 'var(--text)' }}>
            Answer Breakdown
          </div>
          {breakdown.map((q, i) => (
            <div key={i} className="card" style={{
              marginBottom: '0.75rem', padding: '1rem',
              borderLeft: `3px solid ${q.isCorrect ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.6rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginRight: '0.4rem' }}>Q{i + 1}.</span>
                  {q.questionText}
                </p>
                {q.isCorrect
                  ? <HiCheckCircle style={{ color: 'var(--success)', fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }} />
                  : <HiXCircle    style={{ color: 'var(--danger)',  fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }} />
                }
              </div>

              {/* Answers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: q.explanation ? '0.6rem' : 0 }}>
                {q.selectedAnswer && !q.isCorrect && (
                  <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <HiXCircle style={{ color: 'var(--danger)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--danger)' }}>Your answer: <strong>{q.selectedAnswer}</strong></span>
                  </div>
                )}
                {!q.selectedAnswer && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not answered</div>
                )}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 7, fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.55 }}>
                  <HiLightningBolt style={{ color: '#f59e0b', marginRight: '0.3rem', verticalAlign: 'middle' }} />
                  {q.explanation}
                </div>
              )}
            </div>
          ))}

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
  const [quiz, setQuiz]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [current, setCurrent]     = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft]   = useState(null);
  const [totalTime, setTotalTime] = useState(null);
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
    } catch (err) {
      alert(err.response?.data?.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, quiz, answers, id]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted, handleSubmit]);

  if (loading) return <div className="loading"><div className="spinner" />Loading quiz…</div>;
  if (!quiz)   return <div className="alert alert-error">Quiz not found.</div>;

  if (submitted && result) {
    const timeTaken = result.timeTaken ?? Math.round((Date.now() - startTime.current) / 1000);
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Quiz Complete</h1>
        </div>
        <ResultScreen result={result} quiz={quiz} timeTaken={timeTaken} />
      </div>
    );
  }

  const total    = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const question = quiz.questions[current];
  const isLast   = current === total - 1;
  const isFirst  = current === 0;
  const timeIsLow = timeLeft !== null && timeLeft < 60;

  return (
    <div>
      {/* Quiz header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.1rem' }}>{quiz.title}</h1>
          <p className="page-subtitle">{answered} of {total} answered</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TimerRing timeLeft={timeLeft ?? 0} totalTime={totalTime ?? 1} />
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(answered / total) * 100}%`, background: 'var(--green)', borderRadius: 999, transition: 'width 0.3s ease' }} />
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
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                background: isCur ? 'var(--navy)' : isAns ? 'var(--green)' : 'var(--border)',
                color: (isCur || isAns) ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
                outline: isCur ? '2px solid var(--navy)' : 'none',
                outlineOffset: 2,
              }}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Question card */}
      <div style={{ maxWidth: 720 }}>
        <div className="card" style={{ marginBottom: '1rem', borderTop: `3px solid ${timeIsLow ? 'var(--danger)' : 'var(--navy)'}` }}>
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

          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {total - answered} unanswered
          </span>

          {isLast ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: answered === total ? 'var(--green)' : undefined, color: answered === total ? 'var(--navy)' : undefined }}
            >
              {submitting ? <><span className="btn-spinner" /> Submitting…</> : <>Submit Quiz <HiCheckCircle /></>}
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
