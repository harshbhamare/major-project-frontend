import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  getNextAdaptiveActivity,
  submitAdaptiveActivity,
} from '../../services/adaptiveService';
import {
  HiLightningBolt, HiCheckCircle, HiXCircle, HiArrowRight,
  HiAcademicCap, HiInformationCircle, HiExclamationCircle,
  HiRefresh, HiChevronRight, HiCode, HiEye, HiSparkles,
} from 'react-icons/hi';

import { useAuth } from '../../context/AuthContext';
import CodeSnippetEditor from '../../components/CodeSnippetEditor';
import CelebrationModal from '../../components/CelebrationModal';

// ─── Constants & Metadata ─────────────────────────────────────────────────────
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const ACTION_LABEL = {
  remediate: { text: 'Foundation Review', color: '#2563eb', bg: '#eff6ff' },
  reinforce: { text: 'Skill Practice', color: '#d97706', bg: '#fffbeb' },
  advance:   { text: 'Mastery Challenge', color: 'var(--success)', bg: '#f0fdf4' },
};

const STRATEGY_LABEL = {
  worked_examples:          'Step-by-Step Examples',
  remedial_explanation:     'Core Concept Guide',
  misconception_correction: 'Common Mistakes & Fixes',
  targeted_practice:        'Guided Practice',
  advanced_practice:        'In-Depth Mastery',
};

const FORMAT_LABEL = {
  mcq:             'Multiple Choice',
  short_answer:    'Short Answer',
  code_completion: 'Code Completion',
  code_tracing:    'Code Tracing',
  debugging:       'Debugging',
  scenario_based:  'Scenario-Based',
};

const OBJECTIVE_FORMATS = ['mcq', 'scenario_based'];

// ─── Helper: Format code snippets into instructions vs code ───────────────────
function formatCodePrompt(rawText) {
  if (!rawText) return { prompt: '', code: '' };
  const text = rawText.toString().trim();
  const fenceMatch = text.match(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/);
  if (fenceMatch) {
    const prompt = text.replace(fenceMatch[0], '').trim();
    const code = fenceMatch[1].trim();
    return { prompt, code };
  }
  // Check for lines starting with code indicators (function, let, const, def, class, etc.)
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

// ─── Plan Badges ──────────────────────────────────────────────────────────────
const PlanBadges = ({ plan }) => {
  const ac = ACTION_LABEL[plan.action] || { text: plan.action || 'Practice', color: 'var(--info)' };
  const difficultyText = plan.difficulty === 'easy' ? 'Beginner' : plan.difficulty === 'advanced' ? 'Advanced' : 'Intermediate';
  const badges = [
    { label: ac.text,                                                     color: ac.color   },
    { label: FORMAT_LABEL[plan.assessmentFormat] || plan.assessmentFormat, color: '#6d28d9' },
    { label: difficultyText,                                              color: plan.difficulty === 'easy' ? '#16a34a' : '#475569' },
  ];
  return (
    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
      {badges.map(({ label, color }) => label ? (
        <span key={label} style={{
          fontSize: '0.74rem', fontWeight: 700, padding: '0.22rem 0.65rem',
          borderRadius: 999, background: `${color}14`, color,
          border: `1px solid ${color}33`, textTransform: 'capitalize',
        }}>
          {label}
        </span>
      ) : null)}
    </div>
  );
};

// ─── Adaptive Content Panel ───────────────────────────────────────────────────
const ContentPanel = ({ content, plan }) => {
  if (!content) return null;
  const ac = ACTION_LABEL[plan?.action] || { color: '#2563eb', text: 'Learning Guide' };

  return (
    <div style={{
      border: '1px solid var(--border)', borderLeft: `4px solid ${ac.color}`,
      borderRadius: 12, padding: '1.5rem', background: '#fff', marginBottom: '1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: ac.color, background: `${ac.color}15`, padding: '0.25rem 0.65rem', borderRadius: 6,
        }}>
          📖 {STRATEGY_LABEL[plan?.contentStrategy] || 'Learning Guide'}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Review the core concept below before trying the question
        </span>
      </div>

      {content.headline && (
        <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.3 }}>
          {content.headline}
        </h3>
      )}

      {content.explanation && (
        <p style={{ fontSize: '0.94rem', color: 'var(--text-sub)', lineHeight: 1.75, marginBottom: '1rem' }}>
          {content.explanation}
        </p>
      )}

      {content.workedExample && (
        <div style={{
          padding: '1.1rem 1.25rem', background: '#f8fafc',
          borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0',
          fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.65, marginBottom: '1rem',
          border: '1px solid var(--border)', borderLeftWidth: 4,
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
            💡 Step-by-Step Example
          </div>
          <pre style={{
            whiteSpace: 'pre-wrap', fontFamily: 'Consolas, Monaco, "Courier New", monospace', margin: 0,
            fontSize: '0.88rem', background: '#0f172a', color: '#38bdf8', padding: '0.85rem 1rem', borderRadius: 8,
          }}>{content.workedExample}</pre>
        </div>
      )}

      {content.misconceptionAddressed && (
        <div style={{
          padding: '0.875rem 1.1rem', background: '#fffbeb',
          borderLeft: '4px solid #f59e0b', borderRadius: '0 8px 8px 0',
          fontSize: '0.88rem', color: '#92400e', lineHeight: 1.6, marginBottom: '1rem',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            ⚠️ Common Mistake to Avoid
          </div>
          {content.misconceptionAddressed}
        </div>
      )}

      {content.keyInsight && (
        <div style={{
          padding: '0.75rem 1rem', background: '#f0fdf4',
          borderRadius: 8, fontSize: '0.88rem', color: '#166534', fontWeight: 600, lineHeight: 1.55,
          border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <HiSparkles style={{ fontSize: '1.1rem', flexShrink: 0, color: '#16a34a' }} />
          <span><strong>Key Rule:</strong> {content.keyInsight}</span>
        </div>
      )}
    </div>
  );
};

// ─── MCQ Options Selector ─────────────────────────────────────────────────────
const McqOptions = ({ options, answer, onSelect }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
    {options?.map((opt, i) => {
      const sel = answer === opt;
      return (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(opt)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.9rem 1.1rem', borderRadius: 10, textAlign: 'left',
            border: `2px solid ${sel ? 'var(--navy)' : 'var(--border)'}`,
            background: sel ? 'var(--navy)' : '#fff',
            cursor: 'pointer', transition: 'all 0.15s ease',
            boxShadow: sel ? '0 4px 12px rgba(15,23,42,0.15)' : 'none',
          }}
          onMouseEnter={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--text-sub)'; }}
          onMouseLeave={e => { if (!sel) e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.8rem',
            background: sel ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
            border: `1.5px solid ${sel ? 'rgba(255,255,255,0.5)' : 'var(--border)'}`,
            color: sel ? '#fff' : 'var(--text-sub)',
          }}>
            {OPTION_LABELS[i]}
          </div>
          <span style={{ fontSize: '0.92rem', color: sel ? '#fff' : 'var(--text)', fontWeight: sel ? 600 : 400, lineHeight: 1.45 }}>
            {opt}
          </span>
        </button>
      );
    })}
  </div>
);

// ─── Dynamic Question Renderer ────────────────────────────────────────────────
const QuestionRenderer = ({ question, answer, onSelect }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [question]);

  const format = question.assessmentFormat || 'mcq';
  const payload = question.payload || {};
  const parsed = formatCodePrompt(question.questionText);

  const questionHeader = (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <span className="badge badge-purple">{FORMAT_LABEL[format] || format}</span>
        {question.difficulty && (
          <span className={`badge badge-${question.difficulty === 'easy' ? 'success' : question.difficulty === 'advanced' ? 'danger' : 'info'}`}>
            {question.difficulty === 'easy' ? 'Beginner' : question.difficulty === 'advanced' ? 'Advanced' : 'Intermediate'}
          </span>
        )}
      </div>
      {question.learningObjective && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
          <HiInformationCircle style={{ flexShrink: 0, marginTop: 2, color: 'var(--navy)' }} />
          <span><strong>Objective:</strong> {question.learningObjective}</span>
        </div>
      )}
      {payload.hint && (
        <div style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setShowHint(prev => !prev)}
            style={{
              background: showHint ? '#fef3c7' : '#fffbeb',
              border: '1.5px dashed #f59e0b',
              color: '#b45309',
              borderRadius: 8,
              padding: '0.3rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            💡 {showHint ? 'Hide Hint' : 'Need a Hint?'}
          </button>
          {showHint && (
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem 1rem',
              background: '#fffbeb',
              borderLeft: '3px solid #f59e0b',
              borderRadius: '0 8px 8px 0',
              fontSize: '0.86rem',
              color: '#92400e',
              lineHeight: 1.55,
            }}>
              <strong>💡 Hint:</strong> {payload.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // 1. MCQ
  if (format === 'mcq') {
    const options = payload.options || question.options || [];
    return (
      <div>
        {questionHeader}
        <p style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          {question.questionText}
        </p>
        <McqOptions options={options} answer={answer} onSelect={onSelect} />
      </div>
    );
  }

  // 2. Code Tracing
  if (format === 'code_tracing') {
    const code = payload.codeSnippet || parsed.code || question.questionText;
    const options = payload.options || question.options || [];
    const language = payload.language || 'JavaScript';

    return (
      <div>
        {questionHeader}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {parsed.prompt || question.questionText || 'Trace the execution and predict the output:'}
          </p>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: '#0f172a', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'monospace' }}>
            {language}
          </span>
        </div>
        <pre style={{
          background: '#0f172a', color: '#38bdf8',
          padding: '1.1rem 1.25rem', borderRadius: 10,
          fontSize: '0.88rem', lineHeight: 1.65, fontFamily: 'monospace',
          overflow: 'auto', marginBottom: '1.25rem', whiteSpace: 'pre-wrap',
          border: '1px solid #1e293b',
        }}>
          {code}
        </pre>
        {payload.variableToTrace && (
          <div style={{ fontSize: '0.8rem', color: 'var(--navy)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Target: Trace value of <code>{payload.variableToTrace}</code>
          </div>
        )}
        {options.length >= 2 ? (
          <McqOptions options={options} answer={answer} onSelect={onSelect} />
        ) : (
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Predicted Output:</label>
            <input
              type="text"
              className="form-control no-icon"
              value={answer}
              onChange={e => onSelect(e.target.value)}
              placeholder="e.g. 15 or [1, 2, 3]"
              style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
            />
          </div>
        )}
      </div>
    );
  }

  // 3. Code Completion
  if (format === 'code_completion') {
    const code = payload.codeSnippet || parsed.code || question.questionText;
    const language = payload.language || 'JavaScript';

    return (
      <div>
        {questionHeader}
        <p style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          {parsed.prompt || question.questionText || 'Complete the code to finish the statement:'}
        </p>
        <CodeSnippetEditor
          initialCode={code}
          language={language}
          hint={payload.hint}
          value={answer}
          onChange={onSelect}
          mode="code_completion"
          placeholder={payload.placeholder || 'Type the missing value (e.g. 10 or "Alice")'}
        />
      </div>
    );
  }

  // 4. Debugging
  if (format === 'debugging') {
    const code = payload.buggyCode || parsed.code || question.questionText;
    const language = payload.language || 'JavaScript';

    return (
      <div>
        {questionHeader}
        <p style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          {parsed.prompt || question.questionText || 'Find and fix the error in the code:'}
        </p>
        <CodeSnippetEditor
          initialCode={code}
          language={language}
          errorDescription={payload.errorDescription}
          hint={payload.hint}
          value={answer}
          onChange={onSelect}
          mode="debugging"
          placeholder="Fix the code directly or select the line to fix..."
        />
      </div>
    );
  }

  // 5. Scenario-Based
  if (format === 'scenario_based') {
    const scenario = payload.scenario || question.questionText;
    const options = payload.options || question.options || [];

    return (
      <div>
        {questionHeader}
        <div style={{
          padding: '1rem 1.25rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6',
          borderRadius: '0 8px 8px 0', marginBottom: '1.25rem', fontSize: '0.95rem',
          lineHeight: 1.7, color: 'var(--text)', fontWeight: 500,
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
            Realistic Scenario
          </div>
          {scenario}
        </div>
        {options.length >= 2 ? (
          <McqOptions options={options} answer={answer} onSelect={onSelect} />
        ) : (
          <div>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Your Recommended Approach:</label>
            <textarea
              className="form-control no-icon"
              value={answer}
              onChange={e => onSelect(e.target.value)}
              placeholder="State your decision and brief rationale..."
              rows={4}
              style={{ fontFamily: 'inherit', fontSize: '0.9rem', lineHeight: 1.6 }}
            />
          </div>
        )}
      </div>
    );
  }

  // 6. Short Answer
  return (
    <div>
      {questionHeader}
      {payload.context && (
        <div style={{
          padding: '0.75rem 1rem', background: '#f8fafc', borderLeft: '3px solid #64748b',
          borderRadius: '0 6px 6px 0', marginBottom: '0.75rem', fontSize: '0.84rem', color: 'var(--text-sub)',
        }}>
          <strong>Context:</strong> {payload.context}
        </div>
      )}
      <p style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.6, marginBottom: '1rem' }}>
        {question.questionText}
      </p>
      <textarea
        className="form-control no-icon"
        value={answer}
        onChange={e => onSelect(e.target.value)}
        placeholder={payload.placeholder || "Write a clear, concise answer (1–3 sentences)..."}
        rows={5}
        style={{ fontFamily: 'inherit', fontSize: '0.92rem', lineHeight: 1.65 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
        <span>Suggested length: {payload.suggestedLength || "1–3 sentences"}</span>
        <span>{answer.trim().length} character{answer.trim().length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

// ─── Formative Explanation View ───────────────────────────────────────────────
const ExplanationView = ({ explanation }) => {
  if (!explanation) return null;

  const hasSections = /Core Reasoning:|Misconception Avoided:|Student Pro-Tip:/i.test(explanation);

  if (!hasSections) {
    return (
      <div style={{
        padding: '1rem 1.25rem', background: 'var(--bg)', borderRadius: 10,
        fontSize: '0.88rem', color: 'var(--text-sub)', lineHeight: 1.65,
        marginBottom: '1.5rem', border: '1px solid var(--border)',
      }}>
        <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HiLightningBolt style={{ color: '#f59e0b' }} /> Explanation & Key Insight
        </div>
        {explanation}
      </div>
    );
  }

  const lines = explanation.split('\n').filter(l => l.trim().length > 0);
  return (
    <div style={{
      padding: '1.15rem 1.25rem', background: '#fff', borderRadius: 12,
      marginBottom: '1.5rem', border: '1px solid var(--border)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    }}>
      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <HiAcademicCap style={{ color: 'var(--navy)', fontSize: '1.2rem' }} /> Conceptual Breakdown & Student Notes
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {lines.map((line, idx) => {
          if (/^Core Reasoning:/i.test(line)) {
            return (
              <div key={idx} style={{ padding: '0.65rem 0.9rem', background: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '0 6px 6px 0', fontSize: '0.86rem', color: '#1e3a8a', lineHeight: 1.55 }}>
                <strong>🧠 Core Reasoning:</strong> {line.replace(/^Core Reasoning:\s*/i, '')}
              </div>
            );
          }
          if (/^Misconception Avoided:/i.test(line)) {
            return (
              <div key={idx} style={{ padding: '0.65rem 0.9rem', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '0 6px 6px 0', fontSize: '0.86rem', color: '#991b1b', lineHeight: 1.55 }}>
                <strong>⚠️ Misconception Avoided:</strong> {line.replace(/^Misconception Avoided:\s*/i, '')}
              </div>
            );
          }
          if (/^Student Pro-Tip:/i.test(line)) {
            return (
              <div key={idx} style={{ padding: '0.65rem 0.9rem', background: '#fffbeb', borderLeft: '3px solid #f59e0b', borderRadius: '0 6px 6px 0', fontSize: '0.86rem', color: '#92400e', lineHeight: 1.55 }}>
                <strong>💡 Student Pro-Tip:</strong> {line.replace(/^Student Pro-Tip:\s*/i, '')}
              </div>
            );
          }
          return (
            <p key={idx} style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
};

// ─── Result Feedback Panel ────────────────────────────────────────────────────
const ResultPanel = ({ outcome, question, nextPlan, moduleId, onNext }) => {
  const {
    isCorrect,
    correctAnswer,
    explanation,
    modelAnswer,
    masteryBefore,
    masteryAfter,
    evaluator,
    evalFeedback,
    criteriaResults,
  } = outcome;
  const format = question?.assessmentFormat || 'mcq';
  const hasOptions = Array.isArray(question?.payload?.options || question?.options) && (question?.payload?.options || question?.options).length >= 2;
  const isObjective = format === 'mcq' || (format === 'scenario_based' && hasOptions);
  const masteryDelta = (masteryAfter != null && masteryBefore != null)
    ? Math.round((masteryAfter - masteryBefore) * 100)
    : null;

  return (
    <div style={{ animation: 'slideUp 0.25s ease' }}>
      {/* Outcome banner */}
      <div style={{
        padding: '1.5rem', borderRadius: 14, marginBottom: '1.5rem', textAlign: 'center',
        background: isCorrect ? '#f0fdf4' : '#fef2f2',
        border: `2px solid ${isCorrect ? '#bbf7d0' : '#fecaca'}`,
      }}>
        {isCorrect
          ? <HiCheckCircle style={{ fontSize: '2.5rem', color: 'var(--success)', marginBottom: '0.35rem' }} />
          : <HiXCircle     style={{ fontSize: '2.5rem', color: 'var(--danger)',  marginBottom: '0.35rem' }} />
        }
        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: isCorrect ? '#15803d' : '#b91c1c', marginBottom: '0.35rem' }}>
          {isCorrect ? 'Correct!' : 'Keep Going — Learning in Progress'}
        </div>
        {masteryDelta !== null && (
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.35rem 0.85rem', background: '#fff', borderRadius: 999,
              border: '1px solid var(--border)', fontSize: '0.82rem', color: 'var(--text)',
              marginTop: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <span>Topic Mastery: <strong>{Math.round((masteryBefore ?? 0) * 100)}%</strong></span>
              <HiArrowRight style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} />
              <span style={{ fontWeight: 800, color: masteryDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {Math.round((masteryAfter ?? 0) * 100)}%
                {masteryDelta !== 0 && ` (${masteryDelta > 0 ? '+' : ''}${masteryDelta}pp)`}
              </span>
            </div>
            {masteryAfter != null && (
              <div style={{ maxWidth: 260, margin: '0.75rem auto 0 auto' }}>
                <div style={{
                  height: 8, background: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, Math.round(masteryAfter * 100)))}%`,
                    background: isCorrect ? 'var(--success)' : '#f59e0b',
                    borderRadius: 999,
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evaluator Feedback & Criteria Assessment (Spec §13) */}
      {(evalFeedback || (criteriaResults && criteriaResults.length > 0)) && (
        <div style={{
          padding: '1.1rem 1.25rem', background: '#fff', border: '1px solid var(--border)',
          borderRadius: 10, marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pedagogical Evaluation
            </div>
            {evaluator && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                {evaluator}
              </span>
            )}
          </div>
          {evalFeedback && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-sub)', margin: '0 0 0.75rem 0', lineHeight: 1.55 }}>
              {evalFeedback}
            </p>
          )}
          {criteriaResults && criteriaResults.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
              {criteriaResults.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                  {c.passed
                    ? <HiCheckCircle style={{ color: 'var(--success)', flexShrink: 0 }} />
                    : <HiXCircle     style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                  <span style={{ color: c.passed ? 'var(--text)' : 'var(--text-muted)' }}>{c.criterion}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Correct answer display */}
      {!isCorrect && isObjective && correctAnswer && (
        <div style={{ padding: '1rem 1.25rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Correct Answer
          </div>
          <div style={{ fontSize: '0.92rem', color: 'var(--text)', fontWeight: 600 }}>{correctAnswer}</div>
        </div>
      )}

      {/* Model answer for code or open-ended */}
      {!isObjective && (modelAnswer || correctAnswer) && (
        <div style={{ padding: '1rem 1.25rem', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '0 8px 8px 0', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
            Model Reference Solution
          </div>
          <pre style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
            {modelAnswer || correctAnswer}
          </pre>
        </div>
      )}

      {/* Formative Explanation View */}
      {explanation && <ExplanationView explanation={explanation} />}

      {/* Next Recommendation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {nextPlan?.hasGap && (
          <div style={{ padding: '1.1rem', background: '#fff', borderRadius: 10, border: '1px solid var(--border)', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
              Adaptive Recommendation Next
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
              {nextPlan.topicTitle}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Strategy: <strong>{STRATEGY_LABEL[nextPlan.contentStrategy] || nextPlan.contentStrategy}</strong>
              {' · '}Difficulty: <strong>{nextPlan.difficulty}</strong>
              {' · '}Format: <strong>{FORMAT_LABEL[nextPlan.assessmentFormat] || nextPlan.assessmentFormat}</strong>
            </div>
          </div>
        )}

        {nextPlan?.noActionReason === 'all_mastered' && (
          <div style={{ padding: '1.25rem', background: 'var(--green-glow)', borderRadius: 10, border: '1px solid rgba(74,222,128,0.4)', textAlign: 'center' }}>
            <HiCheckCircle style={{ fontSize: '1.75rem', color: 'var(--green-dark)', marginBottom: '0.3rem' }} />
            <div style={{ fontWeight: 800, color: 'var(--green-dark)', fontSize: '1rem', marginBottom: '0.2rem' }}>
              All Module Topics Mastered!
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', margin: 0 }}>
              You've demonstrated solid mastery across all topics in this module. You can continue with advanced evaluation challenges anytime.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          {(nextPlan?.hasGap || nextPlan?.canAdvance) && (
            <button
              className="btn btn-primary"
              onClick={() => onNext(Boolean(nextPlan?.canAdvance))}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--green)', color: 'var(--navy)' }}
            >
              <HiRefresh /> {nextPlan?.canAdvance ? 'Take Mastery Challenge' : 'Next Adaptive Question'}
            </button>
          )}
          <Link to="/student/adaptive" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            All Modules
          </Link>
          <Link to={`/student/modules/${moduleId}`} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Back to Module
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Automated Question Format Indicator ──────────────────────────────────────
const FORMAT_ICONS = {
  debugging: '🐞',
  code_tracing: '🔍',
  code_completion: '🧩',
  scenario_based: '🏛️',
  short_answer: '✍️',
  mcq: '🔘',
};

const AutomatedFormatBadge = ({ format }) => {
  const label = FORMAT_LABEL[format] || format || 'Practice Exercise';
  const icon = FORMAT_ICONS[format] || '📝';

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.4rem 0.85rem', background: '#f8fafc',
      border: '1px solid var(--border)', borderRadius: 8,
      marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-sub)',
    }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontWeight: 700, color: 'var(--text)' }}>{label}</span>
      <span style={{ color: 'var(--text-muted)' }}>· Hands-on Learning</span>
    </div>
  );
};

// ─── Main AdaptiveActivity Component ──────────────────────────────────────────
const AdaptiveActivity = () => {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const initialTopicId = searchParams.get('topicId') || '';

  const { updateGamification } = useAuth();
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  const [phase, setPhase]             = useState('loading');
  const [activity, setActivity]       = useState(null);
  const [answer, setAnswer]           = useState('');
  const [outcome, setOutcome]         = useState(null);
  const [errorMsg, setErrorMsg]       = useState('');
  const [activeTopicId]               = useState(initialTopicId);

  // Guard to prevent duplicate requests on mount in React 18 Strict Mode
  const loadingRef = useRef(false);

  const load = useCallback(async (allowAdvance = false, forceNew = false, requestedTopicId = null) => {
    setPhase('loading');
    setActivity(null);
    setAnswer('');
    setOutcome(null);
    setErrorMsg('');
    loadingRef.current = true;

    const topicToUse = requestedTopicId !== null ? requestedTopicId : activeTopicId;

    try {
      const data = await getNextAdaptiveActivity(moduleId, {
        allowAdvance,
        topicId: topicToUse || undefined,
        forceNew,
      });
      if (!data.hasGap && !data.isAdvancement && !topicToUse) {
        setActivity(data);
        setPhase('no_gap');
        return;
      }

      setActivity(data);
      if (data.noQuestion) {
        setPhase(data.content ? 'content_only' : 'no_gap');
        return;
      }
      setPhase(data.content ? 'content' : 'question');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to generate adaptive activity.');
      setPhase('error');
    } finally {
      loadingRef.current = false;
    }
  }, [moduleId, activeTopicId]);

  useEffect(() => {
    load(false, false, initialTopicId);
  }, [load, initialTopicId]);

  const handleSubmit = async () => {
    if (!answer || answer.toString().trim() === '' || !activity?._id) return;
    setPhase('submitting');
    try {
      const data = await submitAdaptiveActivity(activity._id, answer);
      setOutcome(data);
      if (data.gamification) {
        updateGamification?.(data.gamification);
        setCelebrationData(data.gamification);
        setShowCelebration(true);
      }
      setPhase('result');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Submission failed. Please try again.');
      setPhase('error');
    }
  };

  const canSubmit = answer && answer.toString().trim().length > 0;
  const plan      = activity?.plan;
  const content   = activity?.content;
  const question  = activity?.question;
  const ac        = ACTION_LABEL[plan?.action] || { text: plan?.action || 'Adaptive', color: 'var(--info)' };

  // ── 1. Loading Phase ────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="loading" style={{ minHeight: 360 }}>
        <div className="spinner" />
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Personalising your adaptive learning activity…</span>
      </div>
    );
  }

  // ── 2. Error Phase ──────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{ maxWidth: 500, margin: '3rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <HiExclamationCircle style={{ fontSize: '2.75rem', color: 'var(--danger)', marginBottom: '0.75rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.4rem' }}>Something Went Wrong</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => load()}><HiRefresh /> Try Again</button>
            <Link to="/student/adaptive" className="btn btn-secondary">All Modules</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. No Gap / Insufficient Data / Mastered Phase ───────────────────────────
  if (phase === 'no_gap') {
    const isMastered = activity?.noActionReason === 'all_mastered' || activity?.canAdvance;
    return (
      <div style={{ maxWidth: 640, margin: '2rem auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2.25rem' }}>
          <HiCheckCircle style={{ fontSize: '3rem', color: isMastered ? 'var(--green)' : 'var(--navy)', marginBottom: '0.75rem' }} />
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>
            {isMastered ? 'All Module Topics Mastered!' : 'Unlock Adaptive Practice'}
          </h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem', lineHeight: 1.65, fontSize: '0.92rem' }}>
            {activity?.reason || 'Complete at least 3 quiz questions per topic to build initial evidence and unlock adaptive practice.'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
            {isMastered ? (
              <button
                className="btn btn-primary"
                onClick={() => load(true)}
                style={{ background: 'var(--green)', color: 'var(--navy)', fontWeight: 800 }}
              >
                <HiSparkles /> Take Mastery Challenge
              </button>
            ) : (
              <Link to={`/student/modules/${moduleId}`} className="btn btn-primary">
                Take Module Quizzes <HiArrowRight />
              </Link>
            )}
            <Link to="/student/adaptive" className="btn btn-secondary">All Modules</Link>
          </div>

          {/* Direct automated practice CTA */}
          <div style={{
            padding: '1.25rem', background: '#f8fafc', borderRadius: 12,
            border: '1px solid var(--border)', textAlign: 'center',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <HiLightningBolt style={{ color: '#f59e0b' }} /> Automated Practice Ready
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', maxWidth: 460, margin: '0 auto 1rem auto' }}>
              The adaptation engine will automatically choose the optimal question format (Debugging, Code Tracing, Code Completion, etc.) according to this module.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => load(false, true)}
              style={{ background: 'var(--green)', color: 'var(--navy)', fontWeight: 800, padding: '0.5rem 1.25rem' }}
            >
              <HiLightningBolt /> Start Automated Practice Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Main Activity Workspace ──────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header breadcrumbs */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <Link to="/student/adaptive" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Adaptive Practice
            </Link>
            <HiChevronRight style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
              {plan?.topicTitle || 'Targeted Intervention'}
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{plan?.topicTitle || 'Adaptive Practice'}</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {plan?.learningObjective || 'Personalised exercise targeted to your current knowledge state'}
          </p>
        </div>
        <div style={{
          padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.82rem', fontWeight: 800,
          background: `${ac.color}15`, color: ac.color, border: `1px solid ${ac.color}33`,
        }}>
          {ac.text}
        </div>
      </div>

      {/* Automated Format Indicator */}
      <AutomatedFormatBadge
        format={question?.assessmentFormat || plan?.assessmentFormat}
        isAdvancement={plan?.isAdvancement}
      />

      {/* Plan badges strip */}
      {plan && <PlanBadges plan={plan} />}

      {/* Learning Goal */}
      {plan?.learningObjective && phase !== 'result' && (
        <div style={{
          padding: '0.75rem 1rem', background: '#f8fafc',
          borderRadius: 10, border: '1px solid var(--border)',
          marginBottom: '1.25rem', fontSize: '0.84rem', color: 'var(--text-sub)', lineHeight: 1.55,
          display: 'flex', alignItems: 'center', gap: '0.45rem',
        }}>
          <HiInformationCircle style={{ color: 'var(--navy)', fontSize: '1.1rem', flexShrink: 0 }} />
          <span><strong>Goal:</strong> {plan.learningObjective}</span>
        </div>
      )}

      {/* ── Phase: Content Review ────────────────────────────────────────────── */}
      {phase === 'content' && (
        <>
          <ContentPanel content={content} plan={plan} />
          <div style={{ textAlign: 'right' }}>
            {question ? (
              <button
                className="btn btn-primary"
                onClick={() => setPhase('question')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--green)', color: 'var(--navy)', fontWeight: 800 }}
              >
                Continue to Assessment <HiArrowRight />
              </button>
            ) : (
              <Link to="/student/adaptive" className="btn btn-secondary">Back</Link>
            )}
          </div>
        </>
      )}

      {/* ── Phase: Content Only (when no question was generated) ─────────────── */}
      {phase === 'content_only' && (
        <>
          <div style={{ padding: '0.875rem 1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.85rem', color: '#92400e', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <HiExclamationCircle style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              You have unlocked targeted learning material. Review the lesson below at your own pace.
            </span>
          </div>
          <ContentPanel content={content} plan={plan} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-primary" onClick={() => load()} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HiRefresh /> Generate Next Question
            </button>
            <Link to="/student/adaptive" className="btn btn-secondary">All Modules</Link>
          </div>
        </>
      )}

      {/* ── Phase: Question Assessment ───────────────────────────────────────── */}
      {phase === 'question' && question && (
        <div className="card" style={{ padding: '1.75rem' }}>
          <QuestionRenderer
            question={question}
            answer={answer}
            onSelect={setAnswer}
          />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)',
          }}>
            {content ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setPhase('content')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                ← Review Content
              </button>
            ) : <div />}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: canSubmit ? (question?.assessmentFormat === 'debugging' ? '#ef4444' : 'var(--green)') : undefined,
                color: canSubmit ? (question?.assessmentFormat === 'debugging' ? '#fff' : 'var(--navy)') : undefined,
                fontWeight: 800,
                fontSize: '0.92rem',
                padding: '0.65rem 1.4rem',
                boxShadow: canSubmit ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {question?.assessmentFormat === 'debugging' ? (
                <>🐞 Squash Bug & Test Fix (+75 XP)</>
              ) : question?.assessmentFormat === 'code_completion' ? (
                <>✍️ Test Code Completion (+50 XP)</>
              ) : (
                <>Submit Answer <HiCheckCircle /></>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Phase: Submitting ────────────────────────────────────────────────── */}
      {phase === 'submitting' && (
        <div className="loading" style={{ minHeight: 260 }}>
          <div className="spinner" />
          <span style={{ fontWeight: 600 }}>Testing your code fix & awarding XP…</span>
        </div>
      )}

      {/* ── Phase: Result & Updated State ────────────────────────────────────── */}
      {phase === 'result' && outcome && (
        <ResultPanel
          outcome={outcome}
          question={question}
          nextPlan={outcome.nextPlan}
          moduleId={moduleId}
          onNext={(allowAdv) => load(allowAdv, true)}
        />
      )}

      {/* ── Celebratory Reward Modal ────────────────────────────────────────── */}
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        gamification={celebrationData}
        isBugSquash={question?.assessmentFormat === 'debugging' && outcome?.isCorrect}
        title={outcome?.isCorrect ? (question?.assessmentFormat === 'debugging' ? 'Bug Squashed!' : 'Challenge Conquered!') : 'Good Effort!'}
        subtitle={outcome?.isCorrect ? 'You earned XP and made progress on your learning quest.' : 'Keep going! Check the reference solution below to level up.'}
      />
    </div>
  );
};

export default AdaptiveActivity;
