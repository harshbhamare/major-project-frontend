import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiSparkles, HiFire, HiAcademicCap, HiLightningBolt,
  HiTrophy, HiX,
} from 'react-icons/hi';

const LEVEL_CONFIG = [
  { level: 1, minXp: 0,    title: 'Novice Explorer' },
  { level: 2, minXp: 150,  title: 'Code Apprentice' },
  { level: 3, minXp: 400,  title: 'Bug Hunter' },
  { level: 4, minXp: 800,  title: 'Code Sleuth' },
  { level: 5, minXp: 1400, title: 'Algorithm Crafter' },
  { level: 6, minXp: 2200, title: 'Master Architect' },
];

function getLevelDetails(xp = 0) {
  let currentLevel = LEVEL_CONFIG[0];
  let nextLevel = LEVEL_CONFIG[1];

  for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_CONFIG[i].minXp) {
      currentLevel = LEVEL_CONFIG[i];
      nextLevel = LEVEL_CONFIG[i + 1] || null;
      break;
    }
  }

  const nextXp = nextLevel ? nextLevel.minXp : currentLevel.minXp + 1000;
  const baseXp = currentLevel.minXp;
  const progressInLevel = Math.max(0, xp - baseXp);
  const neededInLevel = Math.max(1, nextXp - baseXp);
  const pct = Math.min(100, Math.round((progressInLevel / neededInLevel) * 100));

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    nextXp,
    baseXp,
    pct,
  };
}

const GamificationBar = () => {
  const { user } = useAuth();
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  if (!user || user.role !== 'student') return null;

  const xp = user.xp || 0;
  const streak = user.streak || 1;
  const badges = user.badges || [];
  const levelInfo = getLevelDetails(xp);

  return (
    <>
      <div className="gamification-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1.25rem',
        background: 'linear-gradient(90deg, #111827 0%, #1e293b 100%)',
        borderBottom: '1px solid #334155',
        color: '#fff',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}>
        {/* Level and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            boxShadow: '0 0 10px rgba(56,189,248,0.4)',
            fontWeight: 800,
          }}>
            🎖️
          </div>
          <div>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              letterSpacing: '-0.01em',
            }}>
              <span>Level {levelInfo.level}</span>
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>·</span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{levelInfo.title}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {xp} total XP earned
            </div>
          </div>
        </div>

        {/* XP Progress Bar to next level */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flex: 1,
          maxWidth: 320,
          minWidth: 180,
        }}>
          <div style={{
            flex: 1,
            height: 8,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${levelInfo.pct}%`,
              background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)',
              borderRadius: 999,
              transition: 'width 0.6s ease',
              boxShadow: '0 0 8px rgba(74,222,128,0.5)',
            }} />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {levelInfo.pct}% to Lvl {levelInfo.level + 1}
          </span>
        </div>

        {/* Right Badges: Streak & Badges Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Streak pill */}
          <div
            title={`${streak}-day learning streak! Practice daily to keep your flame burning.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.7rem',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#fbbf24',
              cursor: 'default',
            }}
          >
            <span style={{ animation: 'pulse 1.5s infinite alternate' }}>🔥</span>
            <span>{streak} Day{streak !== 1 ? 's' : ''}</span>
          </div>

          {/* Badges / Achievements button */}
          <button
            onClick={() => setShowBadgesModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.3rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            <span>🏆</span>
            <span>Badges ({badges.length})</span>
          </button>
        </div>
      </div>

      {/* Badges Modal */}
      {showBadgesModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            padding: '1.75rem',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🏆</span>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  Your Achievements
                </h3>
              </div>
              <button
                onClick={() => setShowBadgesModal(false)}
                style={{
                  background: 'var(--bg)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HiX />
              </button>
            </div>

            {badges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                <div style={{ fontWeight: 700, color: 'var(--text)' }}>No Badges Unlocked Yet</div>
                <p style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>
                  Complete quizzes, squash bugs in adaptive practice, and keep your daily streak alive to earn rewards!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 340, overflowY: 'auto' }}>
                {badges.map((b, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                  }}>
                    <span style={{ fontSize: '1.75rem' }}>{b.icon || '🏅'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                        {b.description}
                      </div>
                    </div>
                    {b.unlockedAt && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {new Date(b.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GamificationBar;
