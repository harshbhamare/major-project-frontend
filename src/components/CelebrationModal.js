import React, { useEffect } from 'react';
import {
  HiSparkles, HiCheckCircle, HiFire, HiAcademicCap,
  HiX, HiArrowRight,
} from 'react-icons/hi';

/**
 * CelebrationModal
 *
 * Celebrates student achievements (XP earned, Bug squashed, Level up, Badges unlocked)
 * with animated feedback, confetti, and motivating progress.
 */
const CelebrationModal = ({
  isOpen,
  onClose,
  gamification = {},
  title = 'Challenge Complete!',
  subtitle = 'Great work on this learning activity!',
  isBugSquash = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      // Auto close after 7 seconds if user doesn't dismiss
    }, 7000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    xpEarned = 0,
    totalXp = 0,
    level = 1,
    levelTitle = 'Apprentice Coder',
    streak = 1,
    newBadges = [],
  } = gamification || {};

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      {/* Confetti particles */}
      <div className="confetti-container" style={{ position: 'absolute', pointerEvents: 'none' }}>
        {[...Array(18)].map((_, i) => (
          <span key={i} className={`confetti-particle p-${i % 6}`} />
        ))}
      </div>

      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 440,
        padding: '2rem 1.75rem',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
        border: '2px solid rgba(74, 222, 128, 0.4)',
        animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'var(--bg)',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
        >
          <HiX />
        </button>

        {/* Big Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: isBugSquash ? '#fef2f2' : 'var(--green-glow)',
          border: `3px solid ${isBugSquash ? '#ef4444' : 'var(--green)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.5rem',
          margin: '0 auto 1.25rem auto',
          boxShadow: `0 0 25px ${isBugSquash ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.4)'}`,
          animation: 'bounce 1s infinite alternate',
        }}>
          {isBugSquash ? '🐞' : '⚡'}
        </div>

        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: '0.35rem',
          lineHeight: 1.2,
        }}>
          {isBugSquash ? 'Bug Squashed!' : title}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
          {subtitle}
        </p>

        {/* Rewards Pills */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}>
          {/* XP pill */}
          <div style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1.5px solid #86efac',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
              XP Earned
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}>
              +{xpEarned} <span style={{ fontSize: '1rem' }}>⚡</span>
            </div>
          </div>

          {/* Streak pill */}
          <div style={{
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
              Daily Streak
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
            }}>
              {streak} <span style={{ fontSize: '1.1rem' }}>🔥</span>
            </div>
          </div>
        </div>

        {/* Level Banner */}
        <div style={{
          padding: '0.65rem 1rem',
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: newBadges.length > 0 ? '1rem' : '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
            <span style={{ fontSize: '1.2rem' }}>🎖️</span>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Current Level</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Level {level}: {levelTitle}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>
            {totalXp} XP
          </div>
        </div>

        {/* New Badges if any */}
        {newBadges && newBadges.length > 0 && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#eff6ff',
            border: '1.5px solid #93c5fd',
            borderRadius: 12,
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <HiSparkles /> New Achievement Unlocked!
            </div>
            {newBadges.map((badge, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{badge.icon || '🏆'}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1e3a8a' }}>{badge.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.95rem',
            padding: '0.75rem',
            background: 'var(--navy)',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          Continue Quest <HiArrowRight />
        </button>
      </div>
    </div>
  );
};

export default CelebrationModal;
