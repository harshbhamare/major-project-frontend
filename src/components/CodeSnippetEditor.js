import React, { useState, useEffect } from 'react';
import {
  HiCode, HiRefresh, HiLightBulb, HiCheck, HiPencilAlt,
  HiLightningBolt,
} from 'react-icons/hi';

const BLANK_REGEX = /___|\/\*\s*COMPLETE\s*HERE\s*\*\/|\/\/\s*COMPLETE\s*HERE|\[BLANK\]|<blank>/i;

/**
 * CodeSnippetEditor
 *
 * Clean, student-friendly code editor and fill-in-the-blank component.
 * For beginners, provides a guided fill-in-the-blank interface with live preview.
 * For debugging, provides line-targeting and in-place code editing.
 */
const CodeSnippetEditor = ({
  initialCode = '',
  language = 'javascript',
  errorDescription = '',
  hint = '',
  value = '',
  onChange,
  mode = 'debugging', // 'debugging' | 'code_completion'
  placeholder = '',
}) => {
  const [code, setCode] = useState(value || initialCode || '');
  const [blankInput, setBlankInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [viewMode, setViewMode] = useState(mode === 'code_completion' ? 'blank' : 'editor'); // 'blank' | 'editor' | 'line_fix'
  const [selectedLineIdx, setSelectedLineIdx] = useState(null);
  const [lineInput, setLineInput] = useState('');

  // Find the line containing the blank marker
  const initialLines = (initialCode || '').split('\n');
  const blankLineIdx = initialLines.findIndex(l => BLANK_REGEX.test(l));
  const hasBlank = blankLineIdx !== -1;

  // Sync state when initialCode or value changes
  useEffect(() => {
    const startCode = initialCode || '';
    setCode(startCode);

    if (mode === 'code_completion') {
      setViewMode('blank');
      // If student had a previous answer, keep it; otherwise start clean
      setBlankInput(value && value !== startCode ? value : '');
      if (!value) {
        onChange?.('');
      }
    } else {
      setViewMode('editor');
      if (!value && startCode) {
        onChange?.(startCode);
      }
    }
  }, [initialCode, mode]);

  const handleFullCodeChange = (newCode) => {
    setCode(newCode);
    onChange?.(newCode);
  };

  const handleBlankChange = (newVal) => {
    setBlankInput(newVal);
    onChange?.(newVal);
  };

  const handleReset = () => {
    setCode(initialCode);
    setBlankInput('');
    setSelectedLineIdx(null);
    setLineInput('');
    if (mode === 'code_completion') {
      onChange?.('');
    } else {
      onChange?.(initialCode);
    }
  };

  // Line replacement helper for debugging line-fix mode
  const applyLineFix = (lineIdx, replacement) => {
    const lines = (code || '').split('\n');
    lines[lineIdx] = replacement;
    const combined = lines.join('\n');
    handleFullCodeChange(combined);
    setSelectedLineIdx(null);
    setLineInput('');
  };

  const currentLines = (code || '').split('\n');
  const isModified = mode === 'code_completion'
    ? blankInput.trim().length > 0
    : code.trim() !== (initialCode || '').trim();

  // Extract prefix and suffix around the blank marker for live preview
  let blankPrefix = '';
  let blankSuffix = '';
  if (hasBlank) {
    const targetLine = initialLines[blankLineIdx];
    const match = targetLine.match(BLANK_REGEX);
    if (match) {
      blankPrefix = targetLine.slice(0, match.index);
      blankSuffix = targetLine.slice(match.index + match[0].length);
    }
  }

  return (
    <div style={{
      borderRadius: 12,
      border: '1.5px solid #334155',
      background: '#0b1120',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      overflow: 'hidden',
      marginBottom: '1.25rem',
    }}>
      {/* Editor Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 1rem',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        {/* Left: Language & Mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HiCode style={{ color: '#38bdf8', fontSize: '1.1rem' }} />
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#e2e8f0',
          }}>
            {language}
          </span>
          <span style={{
            background: mode === 'code_completion' ? '#1e3a8a' : '#7f1d1d',
            color: mode === 'code_completion' ? '#bfdbfe' : '#fecaca',
            padding: '0.15rem 0.55rem',
            borderRadius: 6,
            fontSize: '0.72rem',
            fontWeight: 700,
          }}>
            {mode === 'code_completion' ? '✍️ Fill in the Blank' : '🔍 Code Fix'}
          </span>
        </div>

        {/* Right: Actions & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {mode === 'debugging' && (
            <div style={{
              display: 'flex',
              background: '#1e293b',
              padding: '0.15rem',
              borderRadius: 6,
              fontSize: '0.72rem',
            }}>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 4,
                  border: 'none',
                  background: viewMode === 'editor' ? '#38bdf8' : 'transparent',
                  color: viewMode === 'editor' ? '#0f172a' : '#94a3b8',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <HiPencilAlt /> Edit In-Place
              </button>
              <button
                type="button"
                onClick={() => setViewMode('line_fix')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 4,
                  border: 'none',
                  background: viewMode === 'line_fix' ? '#38bdf8' : 'transparent',
                  color: viewMode === 'line_fix' ? '#0f172a' : '#94a3b8',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                Line-by-Line
              </button>
            </div>
          )}

          {isModified && (
            <span style={{
              fontSize: '0.72rem',
              color: '#4ade80',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}>
              <HiCheck /> Answer Entered
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            title="Reset code to original"
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: 6,
              border: '1px solid #334155',
              background: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <HiRefresh /> Reset
          </button>

          {hint && (
            <button
              type="button"
              onClick={() => setShowHint(h => !h)}
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: 6,
                border: '1px solid #ca8a04',
                background: showHint ? '#854d0e' : '#713f12',
                color: '#fef08a',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <HiLightBulb /> {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
        </div>
      </div>

      {/* Reported issue banner (debugging) */}
      {errorDescription && (
        <div style={{
          padding: '0.65rem 1rem',
          background: '#450a0a',
          borderBottom: '1px solid #7f1d1d',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          color: '#fca5a5',
        }}>
          <span>⚠️ <strong>Reported Issue:</strong> {errorDescription}</span>
        </div>
      )}

      {/* Helpful Hint Banner */}
      {showHint && hint && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#422006',
          borderBottom: '1px solid #854d0e',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          fontSize: '0.85rem',
          color: '#fde047',
        }}>
          <HiLightBulb style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1, color: '#facc15' }} />
          <div>
            <strong>Helpful Hint:</strong> {hint}
          </div>
        </div>
      )}

      {/* ── Mode 1: Guided Fill-In-The-Blank (Default for Code Completion) ───────── */}
      {mode === 'code_completion' && viewMode === 'blank' && (
        <div>
          {/* Read-only formatted code card */}
          <div style={{
            padding: '1rem 1.25rem',
            background: '#070d18',
            borderBottom: '1px solid #1e293b',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.92rem',
            lineHeight: 1.8,
            overflowX: 'auto',
          }}>
            {initialLines.map((line, idx) => {
              const isBlankLine = idx === blankLineIdx;
              if (isBlankLine && hasBlank) {
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#475569', minWidth: 24, userSelect: 'none', fontSize: '0.8rem' }}>{idx + 1}</span>
                    <span style={{ color: '#e2e8f0' }}>{blankPrefix}</span>
                    <span style={{
                      padding: '0.15rem 0.65rem',
                      background: blankInput ? '#14532d' : '#1e3a8a',
                      color: blankInput ? '#4ade80' : '#93c5fd',
                      border: `1.5px ${blankInput ? 'solid #22c55e' : 'dashed #38bdf8'}`,
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    }}>
                      {blankInput || '___ (type below)'}
                    </span>
                    <span style={{ color: '#e2e8f0' }}>{blankSuffix}</span>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#475569', minWidth: 24, userSelect: 'none', fontSize: '0.8rem' }}>{idx + 1}</span>
                  <span style={{ color: '#94a3b8' }}>{line || ' '}</span>
                </div>
              );
            })}
          </div>

          {/* Guided Blank Input Box */}
          <div style={{ padding: '1.25rem', background: '#0b1120' }}>
            <label style={{
              display: 'block',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#f8fafc',
              marginBottom: '0.5rem',
            }}>
              ✏️ Type the missing code to complete the statement:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={blankInput}
                onChange={e => handleBlankChange(e.target.value)}
                placeholder={placeholder || 'Type the missing value (e.g. 10 or "Alice")'}
                autoFocus
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: '#111827',
                  border: '1.5px solid #38bdf8',
                  borderRadius: 8,
                  color: '#fff',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '1rem',
                  outline: 'none',
                  boxShadow: '0 0 0 3px rgba(56, 189, 248, 0.15)',
                }}
              />
              {blankInput && (
                <button
                  type="button"
                  onClick={() => handleBlankChange('')}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#334155',
                    color: '#e2e8f0',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Live Result Preview */}
            {blankInput.trim() && hasBlank && (
              <div style={{
                marginTop: '0.85rem',
                padding: '0.65rem 0.9rem',
                background: '#07162c',
                borderRadius: 8,
                border: '1px solid #1e3a8a',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.5rem',
                fontSize: '0.86rem',
                color: '#93c5fd',
              }}>
                <span style={{ fontWeight: 700, color: '#38bdf8', flexShrink: 0 }}>Preview:</span>
                <code style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  {blankPrefix}
                  <span style={{ color: '#4ade80', fontWeight: 800, textDecoration: 'underline' }}>{blankInput}</span>
                  {blankSuffix}
                </code>
              </div>
            )}

            {/* Bottom Student Guidance */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.85rem',
              fontSize: '0.78rem',
              color: '#64748b',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <span>💡 Tip: Only type the missing value that fills the blank.</span>
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.78rem',
                  padding: 0,
                }}
              >
                Switch to full code editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mode 2: In-Place Full Code Editor ─────────────────────────────────── */}
      {(viewMode === 'editor' || (mode === 'code_completion' && viewMode === 'editor')) && (
        <div>
          {mode === 'code_completion' && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#070d18',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.76rem',
              color: '#94a3b8',
            }}>
              <span>Full Code Editor Mode: Edit the code directly below</span>
              <button
                type="button"
                onClick={() => setViewMode('blank')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.76rem',
                }}
              >
                Back to guided blank view
              </button>
            </div>
          )}

          <div style={{
            position: 'relative',
            display: 'flex',
            background: '#0b1120',
            minHeight: '140px',
          }}>
            {/* Line Numbers Gutter */}
            <div style={{
              padding: '0.9rem 0.6rem 0.9rem 0.8rem',
              background: '#070d18',
              borderRight: '1px solid #1e293b',
              color: '#475569',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.88rem',
              lineHeight: 1.6,
              textAlign: 'right',
              userSelect: 'none',
              minWidth: 40,
            }}>
              {currentLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable Codearea */}
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={code}
                onChange={e => handleFullCodeChange(e.target.value)}
                placeholder={placeholder || 'Complete the code here...'}
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                rows={Math.max(5, currentLines.length + 1)}
                style={{
                  width: '100%',
                  height: '100%',
                  padding: '0.9rem 1rem',
                  background: 'transparent',
                  color: '#38bdf8',
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  whiteSpace: 'pre',
                  tabSize: 2,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Mode 3: Target Line / Click to Fix (Debugging) ────────────────────── */}
      {viewMode === 'line_fix' && mode === 'debugging' && (
        <div style={{ padding: '0.85rem', background: '#070d18' }}>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.6rem' }}>
            Click the line that contains the bug to fix it:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {currentLines.map((line, idx) => {
              const isSelected = selectedLineIdx === idx;
              const isChanged = line !== (initialLines[idx] || '');

              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: 6,
                    border: isSelected ? '1.5px solid #38bdf8' : '1px solid transparent',
                    background: isSelected ? '#1e293b' : isChanged ? '#064e3b' : '#0f172a',
                    padding: '0.45rem 0.75rem',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    onClick={() => {
                      setSelectedLineIdx(isSelected ? null : idx);
                      setLineInput(line);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '0.86rem',
                    }}
                  >
                    <span style={{ color: '#64748b', minWidth: 24, userSelect: 'none', fontSize: '0.8rem' }}>
                      {idx + 1}
                    </span>
                    <span style={{ flex: 1, color: isChanged ? '#4ade80' : '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                      {line || ' '}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: isChanged ? '#22c55e' : '#94a3b8', fontWeight: 600 }}>
                      {isChanged ? '✓ Fixed' : isSelected ? 'Editing' : 'Click to Fix'}
                    </span>
                  </div>

                  {isSelected && (
                    <div style={{
                      marginTop: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid #334155',
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                    }}>
                      <input
                        type="text"
                        value={lineInput}
                        onChange={e => setLineInput(e.target.value)}
                        placeholder="Type corrected code for this line..."
                        style={{
                          flex: 1,
                          padding: '0.45rem 0.8rem',
                          background: '#0b1120',
                          border: '1px solid #38bdf8',
                          borderRadius: 6,
                          color: '#fff',
                          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                          fontSize: '0.88rem',
                        }}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') applyLineFix(idx, lineInput);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => applyLineFix(idx, lineInput)}
                        style={{
                          padding: '0.45rem 0.9rem',
                          background: '#22c55e',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Apply Fix
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Editor Footer Guidance */}
      <div style={{
        padding: '0.55rem 1rem',
        background: '#070d18',
        borderTop: '1px solid #1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.76rem',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <HiLightningBolt style={{ color: '#38bdf8' }} />
          <span>
            {mode === 'code_completion'
              ? 'Complete the missing value above and click Submit Answer.'
              : 'Fix the code above and click Submit Answer.'}
          </span>
        </div>
        <div>
          {initialLines.length} line{initialLines.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetEditor;
