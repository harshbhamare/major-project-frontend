import React, { useState, useEffect, useRef } from 'react';
import {
  HiPlay, HiPause, HiRefresh, HiChevronRight,
  HiChevronLeft, HiSparkles, HiLightBulb, HiCheckCircle,
  HiTerminal, HiCursorClick, HiTag, HiCheck, HiX,
  HiLightningBolt, HiArrowRight, HiVideoCamera,
} from 'react-icons/hi';

// ─── Default fallback animation builder if backend did not supply animation ──
function getFallbackAnimation(title = '') {
  const t = title.toLowerCase();

  if (/loop|range|iteration|for\b|while\b/i.test(t)) {
    return {
      type: 'iteration_loop',
      conceptTitle: `How Loops Repeat Steps in ${title}`,
      description: 'See the counter step forward and repeat the code automatically!',
      steps: [
        {
          step: 1,
          title: 'Initialize Counter (i = 0)',
          description: 'The computer creates a counter variable "i" starting at 0. It checks: is 0 < 3? Yes (TRUE)!',
          codeLine: 'for (let i = 0; i < 3; i++) {',
          visualState: { counter: 0, condition: '0 < 3 -> TRUE', activeIndex: 0, items: ['Step 1: Start', 'Step 2: Continue', 'Step 3: Finish'] },
        },
        {
          step: 2,
          title: 'Process First Item & Increment (i = 1)',
          description: 'It runs the code inside the loop. Then i goes up to 1. 1 < 3 is still TRUE!',
          codeLine: '  console.log("Processed step " + i);',
          visualState: { counter: 1, condition: '1 < 3 -> TRUE', activeIndex: 1, items: ['Step 1: Done', 'Step 2: Running...', 'Step 3: Waiting'] },
        },
        {
          step: 3,
          title: 'Process Second Item & Increment (i = 2)',
          description: 'It repeats the work for item 2. Then i increments to 3.',
          codeLine: '  console.log("Processed step " + i);',
          visualState: { counter: 2, condition: '2 < 3 -> TRUE', activeIndex: 2, items: ['Step 1: Done', 'Step 2: Done', 'Step 3: Running...'] },
        },
        {
          step: 4,
          title: 'Condition Fails (i = 3) -> Loop Exits!',
          description: 'Now i = 3. Is 3 < 3? No (FALSE)! The loop finishes cleanly and program moves on.',
          codeLine: '} // Loop finished!',
          visualState: { counter: 3, condition: '3 < 3 -> FALSE', activeIndex: -1, items: ['Step 1: Done', 'Step 2: Done', 'Step 3: Done'] },
        },
      ],
    };
  }

  if (/if|else|condition|when|switch|logic|branch/i.test(t)) {
    return {
      type: 'flow_diagram',
      conceptTitle: `How Decisions Branch in ${title}`,
      description: 'See how the computer tests a condition and chooses which path to take.',
      steps: [
        {
          step: 1,
          title: 'Inspect the Score',
          description: 'The program holds a value: let score = 80. It approaches the decision gate.',
          codeLine: 'let score = 80;',
          visualState: { score: 80, condition: 'Testing condition...', path: 'evaluating' },
        },
        {
          step: 2,
          title: 'Check the Question: score >= 50?',
          description: 'Computer evaluates: is 80 greater than or equal to 50? Yes (TRUE)!',
          codeLine: 'if (score >= 50) {',
          visualState: { score: 80, condition: '80 >= 50 -> TRUE', path: 'true_branch' },
        },
        {
          step: 3,
          title: 'Take the TRUE Road!',
          description: 'The green path lights up. It runs the code inside the if-block and skips the else-block entirely!',
          codeLine: '  console.log("Pass!");\n}',
          visualState: { score: 80, condition: 'TRUE branch active', path: 'true_branch', output: '"Pass!"' },
        },
      ],
    };
  }

  if (/function|method|call|structure|entry/i.test(t)) {
    return {
      type: 'code_execution',
      conceptTitle: `How Functions Receive Data & Return Results: ${title}`,
      description: 'Watch how inputs flow into a function and return an output.',
      steps: [
        {
          step: 1,
          title: 'Define the Recipe (Function)',
          description: 'The function is declared with an input slot named "name". It is ready to run anytime.',
          codeLine: 'function greet(name) {',
          visualState: { functionName: 'greet', inputParam: 'name', status: 'Ready to call' },
        },
        {
          step: 2,
          title: 'Call greet("Sam") with Data',
          description: 'We call greet("Sam"). The word "Sam" flows into the function as the argument.',
          codeLine: 'let message = greet("Sam");',
          visualState: { functionName: 'greet', inputParam: 'name = "Sam"', status: 'Executing with "Sam"' },
        },
        {
          step: 3,
          title: 'Return the Output Message',
          description: 'The function produces "Hello, Sam!" and hands it back to the caller.',
          codeLine: '  return "Hello, " + name + "!";\n}',
          visualState: { functionName: 'greet', inputParam: 'name = "Sam"', status: 'Completed', output: '"Hello, Sam!"' },
        },
      ],
    };
  }

  // Default: Memory & Storage Box Animation
  return {
    type: 'box_memory',
    conceptTitle: `How Memory Storage Works: ${title}`,
    description: 'Think of memory like a labeled storage box on your desk.',
    steps: [
      {
        step: 1,
        title: 'Create the Storage Box',
        description: 'The computer reserves memory and pastes a label on the box with our variable name.',
        codeLine: 'let playerPoints;',
        visualState: { boxLabel: 'playerPoints', boxValue: 'empty', status: 'Box Created' },
      },
      {
        step: 2,
        title: 'Drop Value Inside (= Assignment)',
        description: 'The "=" sign puts the number 50 inside the box. Now the box holds 50!',
        codeLine: 'playerPoints = 50;',
        visualState: { boxLabel: 'playerPoints', boxValue: '50', status: 'Value Assigned' },
      },
      {
        step: 3,
        title: 'Read or Update the Box',
        description: 'Whenever we need playerPoints, the computer looks inside the box and retrieves 50.',
        codeLine: 'console.log(playerPoints + 10); // 60',
        visualState: { boxLabel: 'playerPoints', boxValue: '50', status: 'Value Read: 50 + 10 = 60' },
      },
    ],
  };
}

export default function InteractiveConceptAnimator({
  animation,
  topicTitle = 'Foundational Concept',
  onReadyToPractice,
}) {
  const animData = (animation && Array.isArray(animation.steps) && animation.steps.length > 0)
    ? animation
    : getFallbackAnimation(topicTitle);

  const steps = animData.steps || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1 = 2800ms
  const [interactiveVal, setInteractiveVal] = useState('');

  const timerRef = useRef(null);

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const delay = Math.round(3000 / speed);
      timerRef.current = setTimeout(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const activeStepData = steps[currentStep] || steps[0] || {};
  const visualState = activeStepData.visualState || {};

  const handleNext = () => {
    setIsPlaying(false);
    if (currentStep < steps.length - 1) setCurrentStep((p) => p + 1);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  // ─── Render Specialized Visual Scenes ───────────────────────────────────────

  // 1. Box Memory Scene (Variables, Types, Storage)
  const renderBoxMemoryScene = () => {
    const boxVal = interactiveVal || visualState.boxValue || 'empty';
    const isAssigned = boxVal !== 'empty';

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1rem', minHeight: 220, position: 'relative',
      }}>
        {/* Memory Grid Shelf */}
        <div style={{
          position: 'absolute', bottom: 20, width: '80%', height: 8,
          background: 'linear-gradient(90deg, #334155, #64748b, #334155)',
          borderRadius: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }} />

        {/* Incoming Value Animation */}
        <div style={{
          marginBottom: '1rem',
          transform: isAssigned ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.9)',
          opacity: isAssigned ? 1 : 0.4,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Value incoming via =</span>
          <div style={{
            background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
            color: '#fff', fontWeight: 800, padding: '0.45rem 1rem',
            borderRadius: 8, fontSize: '1.05rem', boxShadow: '0 4px 14px rgba(56,189,248,0.4)',
            letterSpacing: '0.02em',
          }}>
            {isAssigned ? boxVal : '...'}
          </div>
        </div>

        {/* The 3D Memory Box */}
        <div style={{
          width: 170, height: 110,
          background: 'linear-gradient(180deg, #1e293b, #0f172a)',
          border: '2px solid #38bdf8',
          borderRadius: 14,
          boxShadow: '0 10px 25px -5px rgba(56, 189, 248, 0.25), inset 0 2px 6px rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 2,
          transition: 'border-color 0.3s ease',
        }}>
          {/* Box Label Tag */}
          <div style={{
            position: 'absolute', top: -14,
            background: '#22c55e', color: '#0f172a',
            fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase',
            letterSpacing: '0.05em', padding: '0.2rem 0.65rem', borderRadius: 999,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.3rem',
          }}>
            <HiTag style={{ fontSize: '0.85rem' }} /> {visualState.boxLabel || 'variable'}
          </div>

          {/* Current Box Content */}
          <div style={{
            fontSize: '1.35rem', fontWeight: 800,
            color: isAssigned ? '#4ade80' : '#64748b',
            textShadow: isAssigned ? '0 0 12px rgba(74,222,128,0.4)' : 'none',
          }}>
            {isAssigned ? boxVal : '(empty)'}
          </div>

          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
            Memory Slot #0x4A
          </div>
        </div>

        {/* Interactive Sandbox Buttons */}
        <div style={{
          marginTop: '1.75rem', zIndex: 5,
          display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <HiCursorClick style={{ color: '#38bdf8' }} /> Try Changing Value:
          </span>
          {['10', '42', '"Alex"', '99.5'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setInteractiveVal(sample)}
              style={{
                background: interactiveVal === sample ? '#38bdf8' : '#1e293b',
                color: interactiveVal === sample ? '#0f172a' : '#f8fafc',
                border: '1px solid #334155', borderRadius: 6,
                padding: '0.2rem 0.55rem', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {sample}
            </button>
          ))}
          {interactiveVal && (
            <button
              type="button"
              onClick={() => setInteractiveVal('')}
              style={{
                background: 'transparent', color: '#f87171', border: 'none',
                fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  // 2. Flow Diagram Scene (Conditions, If-Else, Branching)
  const renderFlowDiagramScene = () => {
    const isTrue = visualState.path === 'true_branch';
    const isEvaluating = visualState.path === 'evaluating';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', minHeight: 220 }}>
        {/* Decision Diamond Node */}
        <div style={{
          width: 150, height: 60,
          background: isEvaluating ? '#334155' : isTrue ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `2px solid ${isTrue ? '#22c55e' : '#f59e0b'}`,
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '0.85rem',
          boxShadow: isTrue ? '0 0 20px rgba(34,197,94,0.3)' : 'none',
          position: 'relative',
        }}>
          {visualState.condition || 'score >= 50 ?'}
        </div>

        {/* Branch Lines */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '75%', marginTop: '0.75rem' }}>
          {/* TRUE Path */}
          <div style={{
            flex: 1, padding: '0.75rem', margin: '0 0.5rem',
            background: isTrue ? 'linear-gradient(135deg, rgba(34,197,94,0.2), #064e3b)' : '#1e293b',
            border: `1.5px solid ${isTrue ? '#22c55e' : '#334155'}`,
            borderRadius: 10, textAlign: 'center',
            boxShadow: isTrue ? '0 4px 16px rgba(34,197,94,0.3)' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <HiCheck style={{ fontSize: '0.85rem' }} /> TRUE PATH
            </div>
            <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700 }}>
              Run If-Block ({visualState.output || 'Passed!'})
            </div>
          </div>

          {/* FALSE Path */}
          <div style={{
            flex: 1, padding: '0.75rem', margin: '0 0.5rem',
            background: !isTrue && !isEvaluating ? 'linear-gradient(135deg, rgba(239,68,68,0.2), #450a0a)' : '#1e293b',
            border: `1.5px solid ${!isTrue && !isEvaluating ? '#ef4444' : '#334155'}`,
            borderRadius: 10, textAlign: 'center',
            opacity: isTrue ? 0.4 : 1,
            transition: 'all 0.3s ease',
          }}>
            <div style={{ color: '#f87171', fontSize: '0.72rem', fontWeight: 800, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              <HiX style={{ fontSize: '0.85rem' }} /> FALSE PATH
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
              Else Block (Skip)
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. Iteration Loop Scene (Loops, Repeating)
  const renderIterationLoopScene = () => {
    const activeIdx = visualState.activeIndex ?? 0;
    const items = visualState.items || ['Step 0', 'Step 1', 'Step 2'];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1rem', minHeight: 220 }}>
        {/* Counter Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: '#1e293b', padding: '0.35rem 0.85rem', borderRadius: 999,
          border: '1px solid #38bdf8', marginBottom: '1.25rem',
        }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Live Counter:</span>
          <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>
            i = {visualState.counter ?? 0}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700 }}>
            {visualState.condition || ''}
          </span>
        </div>

        {/* Carousel of Iteration Steps */}
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          {items.map((item, idx) => {
            const isActive = idx === activeIdx;
            const isDone = idx < (visualState.counter ?? 0);

            return (
              <div
                key={idx}
                style={{
                  width: 110, padding: '0.85rem 0.5rem', borderRadius: 10,
                  background: isActive ? 'linear-gradient(135deg, #0284c7, #0369a1)' : isDone ? '#1e293b' : '#0f172a',
                  border: `2px solid ${isActive ? '#38bdf8' : isDone ? '#22c55e' : '#334155'}`,
                  textAlign: 'center',
                  boxShadow: isActive ? '0 0 16px rgba(56,189,248,0.4)' : 'none',
                  transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: isActive ? '#fff' : isDone ? '#4ade80' : '#64748b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                  {isDone ? <><HiCheck /> DONE</> : isActive ? <><HiLightningBolt /> ACTIVE</> : 'WAITING'}
                </div>
                <div style={{ color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 4. Code Execution Scene (Functions, Calls, Program Structure)
  const renderCodeExecutionScene = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: 220 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          {/* Left: Code with Execution Pointer */}
          <div style={{
            background: '#0a0f1d', borderRadius: 10, padding: '1rem',
            border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.82rem',
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Line Execution Pointer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', marginBottom: '0.35rem' }}>
              <span style={{ color: '#f59e0b' }}>▶</span>
              <span style={{ background: '#1e293b', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                {activeStepData.codeLine || 'let result = run();'}
              </span>
            </div>
          </div>

          {/* Right: State Inspector */}
          <div style={{
            background: '#0a0f1d', borderRadius: 10, padding: '1rem',
            border: '1px solid #1e293b', fontSize: '0.82rem',
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Live Call State
            </div>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.25rem' }}>
              Status: <span style={{ color: '#4ade80' }}>{visualState.status || 'Active'}</span>
            </div>
            {visualState.inputParam && (
              <div style={{ color: '#94a3b8', fontSize: '0.76rem' }}>
                Slot: <code style={{ color: '#38bdf8' }}>{visualState.inputParam}</code>
              </div>
            )}
            {visualState.output && (
              <div style={{ marginTop: '0.5rem', color: '#4ade80', fontWeight: 700 }}>
                Output: {visualState.output}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Select visual scene
  const renderVisualStage = () => {
    switch (animData.type) {
      case 'iteration_loop':
        return renderIterationLoopScene();
      case 'flow_diagram':
        return renderFlowDiagramScene();
      case 'code_execution':
        return renderCodeExecutionScene();
      case 'box_memory':
      default:
        return renderBoxMemoryScene();
    }
  };

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
      borderRadius: 16,
      border: '1px solid #1e293b',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      marginBottom: '1.75rem',
      color: '#f8fafc',
    }}>
      {/* Top Header Bar */}
      <div style={{
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
            background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '0.25rem 0.65rem',
            borderRadius: 6, border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          }}>
            <HiVideoCamera style={{ fontSize: '0.85rem' }} /> Interactive Visual Walkthrough
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
            {animData.conceptTitle || topicTitle}
          </span>
        </div>

        {/* Step Counter Pill */}
        <div style={{
          fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8',
          background: '#1e293b', padding: '0.25rem 0.65rem', borderRadius: 999,
        }}>
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Progress Dots */}
      <div style={{ display: 'flex', height: 4, background: '#1e293b' }}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: i <= currentStep ? '#38bdf8' : 'transparent',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Animated Visual Canvas */}
      {renderVisualStage()}

      {/* Active Code / Explanation Subtitle Strip */}
      <div style={{
        background: '#0b1120',
        padding: '1rem 1.25rem',
        borderTop: '1px solid #1e293b',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(74,222,128,0.15)', color: '#4ade80',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 800, flexShrink: 0, marginTop: 2,
          }}>
            {currentStep + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc', marginBottom: '0.2rem' }}>
              {activeStepData.title}
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.55 }}>
              {activeStepData.description}
            </p>
            {activeStepData.codeLine && (
              <div style={{
                marginTop: '0.5rem',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '0.82rem',
                color: '#38bdf8',
                background: '#020617',
                padding: '0.35rem 0.65rem',
                borderRadius: 6,
                display: 'inline-block',
                border: '1px solid #1e293b',
              }}>
                <code>{activeStepData.codeLine}</code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls & Action Footer */}
      <div style={{
        padding: '0.85rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        background: '#090d16',
      }}>
        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={togglePlay}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              background: isPlaying ? '#f59e0b' : '#38bdf8',
              color: '#0f172a', fontWeight: 800, fontSize: '0.8rem',
              border: 'none', borderRadius: 8, padding: '0.4rem 0.85rem',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            {isPlaying ? <><HiPause /> Pause</> : <><HiPlay /> {currentStep >= steps.length - 1 ? 'Replay' : 'Play'}</>}
          </button>

          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            style={{
              background: '#1e293b', color: currentStep === 0 ? '#475569' : '#f8fafc',
              border: '1px solid #334155', borderRadius: 8, padding: '0.4rem 0.6rem',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
            }}
            title="Previous Step"
          >
            <HiChevronLeft />
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentStep >= steps.length - 1}
            style={{
              background: '#1e293b', color: currentStep >= steps.length - 1 ? '#475569' : '#f8fafc',
              border: '1px solid #334155', borderRadius: 8, padding: '0.4rem 0.6rem',
              cursor: currentStep >= steps.length - 1 ? 'not-allowed' : 'pointer', fontSize: '0.85rem',
            }}
            title="Next Step"
          >
            <HiChevronRight />
          </button>

          <button
            type="button"
            onClick={handleRestart}
            style={{
              background: 'transparent', color: '#94a3b8',
              border: 'none', padding: '0.4rem', cursor: 'pointer',
              fontSize: '0.9rem',
            }}
            title="Restart to Step 1"
          >
            <HiRefresh />
          </button>
        </div>

        {/* Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Speed:</span>
          {[0.75, 1, 1.5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              style={{
                background: speed === s ? '#38bdf8' : '#1e293b',
                color: speed === s ? '#0f172a' : '#94a3b8',
                border: 'none', borderRadius: 4, padding: '0.15rem 0.4rem',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Ready to Practice CTA */}
        {onReadyToPractice && (
          <button
            type="button"
            onClick={onReadyToPractice}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', fontWeight: 800, fontSize: '0.84rem',
              border: 'none', borderRadius: 8, padding: '0.45rem 1rem',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
              marginLeft: 'auto',
            }}
          >
            <HiSparkles /> <span>I Understand This! Let's Practice</span> <HiArrowRight />
          </button>
        )}
      </div>
    </div>
  );
}
