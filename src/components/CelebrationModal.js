import React, { useEffect } from 'react';
import {
  HiSparkles, HiCheckCircle, HiFire, HiAcademicCap,
  HiX, HiArrowRight, HiLightningBolt, HiExclamation,
  HiExclamationCircle, HiInformationCircle, HiRefresh,
} from 'react-icons/hi';
import { MdBugReport, MdEmojiEvents, MdMilitaryTech, MdStars } from 'react-icons/md';

/**
 * CelebrationModal / AssessmentFeedbackModal
 *
 * Dynamically adapts to student performance:
 * 1. Critical / Low Score (<40% or 0% / Skipped): Colorful Red Alert Modal
 *    - Informs student why they got 0% (skipped questions, incorrect answers)
 *    - Zero celebratory confetti
 *    - Shows attempted vs skipped statistics
 *    - Encouraging remediation callouts & direct review action
 * 2. Developing (40% - 69%): Amber / Warm Gold Progress Modal
 * 3. Mastery (>= 70%): Full celebratory modal with animated confetti, XP, and badges
 */
const CelebrationModal = ({
  isOpen,
  onClose,
  gamification = {},
  title,
  subtitle,
  isBugSquash = false,
  percentage = null,
  score = null,
  totalMarks = null,
  stats = null, // { totalQuestions, attempted, skipped, correct, incorrect }
  onReviewBreakdown = null,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    // Don't auto-close critical alerts so student can read why they scored 0%
    if (percentage !== null && percentage < 40) return;

    const timer = setTimeout(() => {
      // Auto close after 8 seconds for high achievements if user doesn't dismiss
    }, 8000);
    return () => clearTimeout(timer);
  }, [isOpen, percentage]);

  if (!isOpen) return null;

  const {
    xpEarned = 0,
    totalXp = 0,
    level = 1,
    levelTitle = 'Apprentice Coder',
    streak = 1,
    newBadges = [],
  } = gamification || {};

  // Determine feedback tier
  const isScoreProvided = percentage !== null && percentage !== undefined;
  const isCriticalAlert = isScoreProvided && percentage < 40;
  const isDeveloping = isScoreProvided && percentage >= 40 && percentage < 70;
  const isCelebration = !isScoreProvided || percentage >= 70 || isBugSquash;

  const skippedCount = stats?.skipped ?? (stats?.totalQuestions && stats?.attempted !== undefined ? stats.totalQuestions - stats.attempted : 0);
  const attemptedCount = stats?.attempted ?? 0;
  const totalQuestions = stats?.totalQuestions ?? (attemptedCount + skippedCount);
  const allSkipped = totalQuestions > 0 && skippedCount === totalQuestions;

  // Determine dynamic copy
  let modalTitle = title;
  let modalSubtitle = subtitle;

  if (isCriticalAlert) {
    if (allSkipped) {
      modalTitle = modalTitle || 'Quiz Incomplete — All Questions Skipped!';
      modalSubtitle = modalSubtitle || `You submitted without answering any questions (0% scored). Skipped questions receive 0 marks.`;
    } else if (percentage === 0) {
      modalTitle = modalTitle || 'Critical Score Alert: 0% Scored';
      modalSubtitle = modalSubtitle || (skippedCount > 0
        ? `You skipped ${skippedCount} question${skippedCount > 1 ? 's' : ''}. Unanswered questions received 0 marks.`
        : `All attempted questions were incorrect. Let's review the concepts together.`);
    } else {
      modalTitle = modalTitle || `Needs Review: ${percentage}% Scored`;
      modalSubtitle = modalSubtitle || (skippedCount > 0
        ? `You answered ${attemptedCount} question${attemptedCount > 1 ? 's' : ''} and skipped ${skippedCount}. Review the material and retry.`
        : `You scored ${score ?? 0}/${totalMarks ?? totalQuestions} marks. Foundational concepts need review.`);
    }
  } else if (isDeveloping) {
    modalTitle = modalTitle || 'Good Effort — Keep Growing!';
    modalSubtitle = modalSubtitle || `You scored ${percentage}%. You have solid groundwork with a few concepts to reinforce.`;
  } else {
    modalTitle = modalTitle || (isBugSquash ? 'Code Bug Resolved!' : 'Challenge Complete!');
    modalSubtitle = modalSubtitle || `Great work! You scored ${percentage ?? 100}% and demonstrated strong mastery!`;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Confetti particles ONLY for true celebrations (>= 70%) */}
      {isCelebration && !isCriticalAlert && (
        <div className="confetti-container" style={{ position: 'absolute', pointerEvents: 'none' }}>
          {[...Array(18)].map((_, i) => (
            <span key={i} className={`confetti-particle p-${i % 6}`} />
          ))}
        </div>
      )}

      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 460,
        padding: '2.25rem 2rem',
        textAlign: 'center',
        position: 'relative',
        boxShadow: isCriticalAlert
          ? '0 20px 40px -10px rgba(239, 68, 68, 0.35), 0 0 0 1px rgba(239, 68, 68, 0.25)'
          : 'var(--shadow-xl)',
        border: `2px solid ${isCriticalAlert ? '#ef4444' : isDeveloping ? '#f59e0b' : 'var(--primary)'}`,
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: isCriticalAlert ? '#fef2f2' : 'var(--bg)',
            border: `1px solid ${isCriticalAlert ? '#fecaca' : 'var(--border)'}`,
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isCriticalAlert ? '#dc2626' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
          }}
        >
          <HiX style={{ fontSize: '1rem' }} />
        </button>

        {/* ── Top Icon Badge ───────────────────────────────────────────────── */}
        {isCriticalAlert ? (
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: '#fef2f2',
            border: '3px solid #ef4444',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.4rem',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 25px rgba(239, 68, 68, 0.35)',
            animation: 'pulse 1.8s infinite ease-in-out',
          }}>
            <HiExclamationCircle />
          </div>
        ) : isDeveloping ? (
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: '#fffbeb',
            border: '3px solid #f59e0b',
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.4rem',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
          }}>
            <HiLightningBolt />
          </div>
        ) : (
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: isBugSquash ? 'var(--danger-bg)' : 'var(--primary-container)',
            border: `3px solid ${isBugSquash ? 'var(--danger-border)' : 'var(--primary)'}`,
            color: isBugSquash ? 'var(--danger)' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.3rem',
            margin: '0 auto 1.25rem auto',
            boxShadow: `0 8px 25px ${isBugSquash ? 'rgba(239,68,68,0.25)' : 'rgba(26,86,219,0.3)'}`,
          }}>
            {isBugSquash ? <MdBugReport /> : <MdStars />}
          </div>
        )}

        {/* Status Tag */}
        {isCriticalAlert && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: 999,
            background: '#fee2e2',
            color: '#b91c1c',
            fontWeight: 800,
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.65rem',
          }}>
            <HiExclamation /> Critical Alert
          </div>
        )}

        {/* Title & Subtitle */}
        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: isCriticalAlert ? '#b91c1c' : 'var(--text)',
          marginBottom: '0.4rem',
          lineHeight: 1.25,
        }}>
          {modalTitle}
        </h2>
        <p style={{
          fontSize: '0.88rem',
          color: isCriticalAlert ? '#7f1d1d' : 'var(--text-sub)',
          marginBottom: '1.35rem',
          lineHeight: 1.55,
        }}>
          {modalSubtitle}
        </p>

        {/* ── Diagnostic / Rewards Stat Cards ──────────────────────────────── */}
        {isCriticalAlert ? (
          /* Red Critical Diagnostic Stats */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            marginBottom: '1.25rem',
          }}>
            {/* Score */}
            <div style={{
              padding: '0.75rem 0.5rem',
              background: '#fef2f2',
              border: '1.5px solid #fecaca',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                Score
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', marginTop: 2, lineHeight: 1 }}>
                {percentage ?? 0}%
              </div>
              <div style={{ fontSize: '0.68rem', color: '#991b1b', marginTop: 4 }}>
                {score ?? 0}/{totalMarks ?? totalQuestions} Marks
              </div>
            </div>

            {/* Attempted */}
            <div style={{
              padding: '0.75rem 0.5rem',
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
            }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Attempted
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text)', marginTop: 2, lineHeight: 1 }}>
                {attemptedCount}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                of {totalQuestions} Questions
              </div>
            </div>

            {/* Skipped */}
            <div style={{
              padding: '0.75rem 0.5rem',
              background: skippedCount > 0 ? '#fffbeb' : '#f8fafc',
              border: `1.5px solid ${skippedCount > 0 ? '#fde68a' : '#e2e8f0'}`,
              borderRadius: 12,
            }}>
              <div style={{ fontSize: '0.66rem', fontWeight: 700, color: skippedCount > 0 ? '#b45309' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                Skipped
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: skippedCount > 0 ? '#d97706' : 'var(--text)', marginTop: 2, lineHeight: 1 }}>
                {skippedCount}
              </div>
              <div style={{ fontSize: '0.68rem', color: skippedCount > 0 ? '#b45309' : 'var(--text-muted)', marginTop: 4 }}>
                Unanswered
              </div>
            </div>
          </div>
        ) : (
          /* Standard Rewards Cards (XP & Streak) */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}>
            {/* XP pill */}
            <div style={{
              padding: '0.85rem',
              background: xpEarned > 0 ? 'var(--success-bg)' : '#f8fafc',
              border: `1.5px solid ${xpEarned > 0 ? 'var(--success-border)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: xpEarned > 0 ? 'var(--success)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                XP Earned
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: xpEarned > 0 ? 'var(--success)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                marginTop: '0.2rem',
              }}>
                +{xpEarned} <HiLightningBolt style={{ fontSize: '1.1rem' }} />
              </div>
            </div>

            {/* Streak pill */}
            <div style={{
              padding: '0.85rem',
              background: 'var(--warning-bg)',
              border: '1.5px solid var(--warning-border)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Daily Streak
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                marginTop: '0.2rem',
              }}>
                {streak} <HiFire style={{ fontSize: '1.25rem' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Remediation / Learning Note for Critical Scores ──────────────── */}
        {isCriticalAlert && (
          <div style={{
            padding: '0.85rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            marginBottom: '1.35rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
          }}>
            <HiInformationCircle style={{ color: '#ef4444', fontSize: '1.3rem', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.5 }}>
              <strong>Learning Tip:</strong> Don't be discouraged! Skipping questions leaves marks on the table. Review the step-by-step solutions below to strengthen your understanding.
            </div>
          </div>
        )}

        {/* Level Banner for non-critical */}
        {!isCriticalAlert && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: newBadges.length > 0 ? '1rem' : '1.35rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary-container)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.15rem',
              }}>
                <MdMilitaryTech />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Current Level</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Level {level}: {levelTitle}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalXp} XP
            </div>
          </div>
        )}

        {/* New Badges if any */}
        {newBadges && newBadges.length > 0 && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--primary-container)',
            border: '1px solid rgba(26, 86, 219, 0.25)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.35rem',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HiSparkles /> Achievement Unlocked
            </div>
            {newBadges.map((badge, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#ffffff',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                }}>
                  <MdEmojiEvents />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>{badge.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            onClick={() => {
              onClose();
              if (onReviewBreakdown) onReviewBreakdown();
            }}
            className={isCriticalAlert ? 'btn btn-danger' : 'btn btn-primary'}
            style={{
              width: '100%',
              height: 46,
              fontSize: '0.94rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              borderRadius: 12,
              boxShadow: isCriticalAlert ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'var(--shadow)',
            }}
          >
            <span>{isCriticalAlert ? 'Review Skipped Questions & Solutions' : 'View Detailed Performance Overview'}</span>
            <HiArrowRight style={{ fontSize: '1.1rem' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;
