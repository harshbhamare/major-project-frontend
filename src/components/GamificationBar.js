import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  HiSparkles, HiFire, HiAcademicCap, HiLightningBolt,
  HiX,
} from 'react-icons/hi';
import { MdEmojiEvents, MdWorkspacePremium, MdMilitaryTech, MdStars } from 'react-icons/md';

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
        padding: '0.65rem 1.5rem',
        background: '#ffffff',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text)',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Level and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--primary-container)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            border: '1px solid rgba(26, 86, 219, 0.2)',
          }}>
            <MdMilitaryTech />
          </div>
          <div>
            <div style={{
              fontSize: '0.86rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              letterSpacing: '-0.01em',
              color: 'var(--text)',
            }}>
              <span>Level {levelInfo.level}</span>
              <span style={{ color: 'var(--border)', fontWeight: 400 }}>·</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{levelInfo.title}</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {xp} total XP earned
            </div>
          </div>
        </div>

        {/* XP Progress Bar to next level */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flex: 1,
          maxWidth: 340,
          minWidth: 200,
        }}>
          <div style={{
            flex: 1,
            height: 8,
            background: 'var(--border)',
            borderRadius: 999,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${levelInfo.pct}%`,
              background: 'var(--primary)',
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }} />
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-sub)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {levelInfo.pct}% to Lvl {levelInfo.level + 1}
          </span>
        </div>

        {/* Right Badges: Streak & Badges Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Streak pill */}
          <div
            title={`${streak}-day learning streak! Practice daily to keep your streak going.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.8rem',
              background: 'var(--warning-bg)',
              border: '1px solid var(--warning-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'var(--warning)',
              cursor: 'default',
            }}
          >
            <HiFire style={{ fontSize: '1.05rem', color: 'var(--warning)' }} />
            <span>{streak} Day{streak !== 1 ? 's' : ''} Streak</span>
          </div>

          {/* Badges / Achievements button */}
          <button
            onClick={() => setShowBadgesModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              background: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-sub)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-sub)';
            }}
          >
            <MdEmojiEvents style={{ color: 'var(--primary)', fontSize: '1rem' }} />
            <span>Achievements ({badges.length})</span>
          </button>
        </div>
      </div>

      {/* Badges Modal */}
      {showBadgesModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: 480,
            padding: '1.75rem',
            position: 'relative',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--primary-container)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                }}>
                  <MdEmojiEvents />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    Your Achievements
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Badges unlocked through quizzes and adaptive practice
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBadgesModal(false)}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <HiX />
              </button>
            </div>

            {badges.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  fontSize: '2rem',
                  color: 'var(--text-muted)',
                }}>
                  <MdWorkspacePremium />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>No Badges Unlocked Yet</div>
                <p style={{ fontSize: '0.82rem', marginTop: '0.35rem', maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
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
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--primary-container)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.35rem',
                      flexShrink: 0,
                    }}>
                      <MdStars />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                        {b.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                        {b.description}
                      </div>
                    </div>
                    {b.unlockedAt && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
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
