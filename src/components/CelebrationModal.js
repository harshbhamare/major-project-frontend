import React, { useEffect } from 'react';
import {
  HiSparkles, HiCheckCircle, HiFire, HiAcademicCap,
  HiX, HiArrowRight, HiLightningBolt,
} from 'react-icons/hi';
import { MdBugReport, MdEmojiEvents, MdMilitaryTech, MdStars } from 'react-icons/md';

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
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
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
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: 440,
        padding: '2.25rem 2rem',
        textAlign: 'center',
        position: 'relative',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border)',
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
            border: '1px solid var(--border)',
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
          background: isBugSquash ? 'var(--danger-bg)' : 'var(--primary-container)',
          border: `2px solid ${isBugSquash ? 'var(--danger-border)' : 'rgba(26,86,219,0.3)'}`,
          color: isBugSquash ? 'var(--danger)' : 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.2rem',
          margin: '0 auto 1.25rem auto',
          boxShadow: `0 8px 20px ${isBugSquash ? 'rgba(239,68,68,0.2)' : 'rgba(26,86,219,0.2)'}`,
        }}>
          {isBugSquash ? <MdBugReport /> : <HiLightningBolt />}
        </div>

        <h2 style={{
          fontSize: '1.45rem',
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: '0.35rem',
          lineHeight: 1.2,
        }}>
          {isBugSquash ? 'Code Bug Resolved!' : title}
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
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
            padding: '0.85rem',
            background: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              XP Earned
            </div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--success)',
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
            border: '1px solid var(--warning-border)',
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

        {/* Level Banner */}
        <div style={{
          padding: '0.75rem 1rem',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: newBadges.length > 0 ? '1rem' : '1.5rem',
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

        {/* New Badges if any */}
        {newBadges && newBadges.length > 0 && (
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--primary-container)',
            border: '1px solid rgba(26, 86, 219, 0.25)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.5rem',
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

        {/* Action Button */}
        <button
          onClick={onClose}
          className="btn btn-primary"
          style={{
            width: '100%',
            height: 44,
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        >
          <span>Continue Learning</span>
          <HiArrowRight style={{ fontSize: '1.05rem' }} />
        </button>
      </div>
    </div>
  );
};

export default CelebrationModal;
