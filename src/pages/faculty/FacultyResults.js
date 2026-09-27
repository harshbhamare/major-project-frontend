import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  getModuleResearchAnalytics,
  getModuleResearchTrace,
} from '../../services/adaptiveService';
import {
  HiChartBar, HiUsers, HiTrendingUp, HiTrendingDown,
  HiMinusSm, HiExclamationCircle, HiCheckCircle, HiInformationCircle,
  HiDownload, HiLightningBolt,
} from 'react-icons/hi';

// ─── Mastery bar ──────────────────────────────────────────────────────────────
const MasteryBar = ({ value }) => {
  const color = value >= 0.80 ? 'var(--success)' : value >= 0.60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round(value * 100)}%`, background: color, borderRadius: 999, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
};

// ─── State badge ──────────────────────────────────────────────────────────────
const StateBadge = ({ count, label, color, Icon }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color }}>
    <Icon style={{ flexShrink: 0 }} />
    <span><strong>{count}</strong> {label}</span>
  </div>
);

// ─── Knowledge Insights Panel ─────────────────────────────────────────────────
const InsightsPanel = ({ moduleId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    api.get(`/adaptation/module/${moduleId}/insights`)
      .then(({ data }) => { setInsights(data); setLoading(false); })
      .catch(() => { setError('Could not load knowledge insights.'); setLoading(false); });
  }, [moduleId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Loading knowledge insights…
    </div>
  );

  if (error) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '0.5rem 0' }}>{error}</div>
  );

  if (!insights || !insights.topicInsights?.length) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '0.5rem 0' }}>
      No mastery data yet. Students need at least 3 assessed interactions per topic before knowledge state is computed.
    </div>
  );

  const { topicInsights, totalRecords } = insights;

  // Sort by average mastery ascending (weakest topics first)
  const sorted = [...topicInsights].sort((a, b) => a.avgMastery - b.avgMastery);

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          {
            label: 'Topics tracked',
            value: topicInsights.length,
            Icon: HiChartBar,
            color: '#3b82f6',
          },
          {
            label: 'Student records',
            value: totalRecords,
            Icon: HiUsers,
            color: '#8b5cf6',
          },
          {
            label: 'Topics needing intervention',
            value: topicInsights.filter(t => t.avgMastery < 0.60).length,
            Icon: HiExclamationCircle,
            color: 'var(--danger)',
          },
          {
            label: 'Topics mastered (avg)',
            value: topicInsights.filter(t => t.avgMastery >= 0.80).length,
            Icon: HiCheckCircle,
            color: 'var(--success)',
          },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <Icon style={{ color, fontSize: '0.9rem', flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Per-topic breakdown */}
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
        Class Mastery by Topic — weakest first
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sorted.map(topic => {
          const state = topic.avgMastery >= 0.80 ? 'mastered'
            : topic.avgMastery >= 0.60 ? 'developing' : 'needs_intervention';
          const stateMeta = {
            mastered:           { label: 'Mastered',     color: 'var(--success)', Icon: HiCheckCircle },
            developing:         { label: 'Developing',   color: 'var(--warning)', Icon: HiInformationCircle },
            needs_intervention: { label: 'Needs Review', color: 'var(--danger)',  Icon: HiExclamationCircle },
          }[state];

          const interventionPct = topic.studentCount > 0
            ? Math.round((topic.needsIntervention / topic.studentCount) * 100)
            : 0;

          return (
            <div key={topic.topicId} style={{ padding: '0.75rem 1rem', background: 'white', borderRadius: 8, border: '1px solid var(--border)', borderLeft: `3px solid ${stateMeta.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {topic.topicTitle}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {topic.studentCount} student{topic.studentCount !== 1 ? 's' : ''} assessed
                    {topic.needsIntervention > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: '0.5rem' }}>
                        · {topic.needsIntervention} ({interventionPct}%) need intervention
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                  borderRadius: 999, background: `${stateMeta.color}18`, color: stateMeta.color,
                  border: `1px solid ${stateMeta.color}33`, flexShrink: 0,
                }}>
                  {stateMeta.label}
                </span>
              </div>
              <MasteryBar value={topic.avgMastery} />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '0.875rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <HiInformationCircle style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
        Mastery is computed using an exponential moving average (α=0.3) from quiz answers, grouped per topic.
        Thresholds (≥0.80 mastered, 0.60–0.79 developing, &lt;0.60 needs intervention) are operational design
        choices and have not been independently validated.
      </div>
    </div>
  );
};

// ─── Research Analytics Panel (Spec §26) ──────────────────────────────────────
const ResearchAnalyticsPanel = ({ moduleId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    getModuleResearchAnalytics(moduleId)
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => { setError('Could not load research analytics.'); setLoading(false); });
  }, [moduleId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await getModuleResearchTrace(moduleId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_trace_${moduleId}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export research trace: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Computing experimental research metrics…
    </div>
  );

  if (error) return <div style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0.5rem 0' }}>{error}</div>;
  if (!analytics) return null;

  const {
    totalInteractions,
    adaptiveCount,
    baselineCount,
    adaptiveAccuracy,
    baselineAccuracy,
    formatDistribution = {},
    strategyDistribution = {},
    bloomDistribution = {},
    avgMasteryGain,
    adaptiveInterventionsCount,
    adaptiveCompletionRate,
  } = analytics;

  return (
    <div>
      {/* Research Objective Banner (Spec §2) */}
      <div style={{
        padding: '0.875rem 1.1rem', background: '#f8fafc', border: '1px solid var(--border)',
        borderRadius: 10, marginBottom: '1.5rem', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--navy)' }}>Experimental Design Note:</strong> This system logs fine-grained interactions
        to evaluate whether learner-aware adaptation improves outcomes versus non-adaptive baselines.
        Performance differences reflect empirical observations and are not presumed in advance.
      </div>

      {/* Top research summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Total Interactions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>{totalInteractions}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {baselineCount} standard · {adaptiveCount} adaptive
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Adaptive vs Baseline Acc.
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>
            {adaptiveAccuracy != null ? `${adaptiveAccuracy}%` : 'N/A'}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}> vs {baselineAccuracy != null ? `${baselineAccuracy}%` : 'N/A'}</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Observed correctness
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Avg. Mastery Delta
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: avgMasteryGain >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {avgMasteryGain > 0 ? `+${(avgMasteryGain * 100).toFixed(1)}pp` : `${(avgMasteryGain * 100).toFixed(1)}pp`}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Per adaptive intervention
          </div>
        </div>

        <div style={{ padding: '0.875rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Intervention Completion
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
            {adaptiveCompletionRate}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {adaptiveInterventionsCount} generated
          </div>
        </div>
      </div>

      {/* Distributions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Strategy Breakdown */}
        <div style={{ padding: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--navy)', marginBottom: '0.75rem' }}>
            Pedagogical Strategies
          </div>
          {Object.keys(strategyDistribution).length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No strategy data logged yet.</p>
          ) : (
            Object.entries(strategyDistribution).map(([strat, cnt]) => (
              <div key={strat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'capitalize', color: 'var(--text)' }}>{strat.replace('_', ' ')}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>{cnt}</span>
              </div>
            ))
          )}
        </div>

        {/* Assessment Format Mix */}
        <div style={{ padding: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--navy)', marginBottom: '0.75rem' }}>
            Assessment Formats
          </div>
          {Object.keys(formatDistribution).length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No format data logged yet.</p>
          ) : (
            Object.entries(formatDistribution).map(([fmt, cnt]) => (
              <div key={fmt} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'capitalize', color: 'var(--text)' }}>{fmt.replace('_', ' ')}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>{cnt}</span>
              </div>
            ))
          )}
        </div>

        {/* Cognitive Bloom Progression */}
        <div style={{ padding: '1rem', background: '#fff', border: '1px solid var(--border)', borderRadius: 10 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--navy)', marginBottom: '0.75rem' }}>
            Cognitive Bloom Levels
          </div>
          {Object.keys(bloomDistribution).length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No Bloom level data logged yet.</p>
          ) : (
            Object.entries(bloomDistribution).map(([bloom, cnt]) => (
              <div key={bloom} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.82rem', textTransform: 'capitalize', color: 'var(--text)' }}>{bloom}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>{cnt}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Export Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>Traceable Research Sequence Log</div>
          <div style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
            Download complete chronological events with pseudonymized participant IDs for R/Python/SPSS analysis.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
        >
          <HiDownload /> {exporting ? 'Exporting…' : 'Export Trace (JSON)'}
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const FacultyResults = () => {
  const [modules, setModules]           = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [results, setResults]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [activeTab, setActiveTab]       = useState('results'); // 'results' | 'insights'

  useEffect(() => {
    api.get('/modules').then(({ data }) => setModules(data));
  }, []);

  const fetchResults = async (moduleId) => {
    setSelectedModule(moduleId);
    setResults(null);
    setActiveTab('results');
    if (!moduleId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/results/module/${moduleId}`);
      setResults(data);
    } catch (_) {}
    setLoading(false);
  };

  const tabStyle = (tab) => ({
    padding: '0.5rem 1.1rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
    background: activeTab === tab ? 'var(--navy)' : 'transparent',
    color:      activeTab === tab ? '#fff' : 'var(--text-sub)',
    transition: 'all 0.15s',
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Class Performance</h1>
      </div>

      {/* Module selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Module</label>
          <select
            className="form-control no-icon"
            value={selectedModule}
            onChange={(e) => fetchResults(e.target.value)}
            style={{ maxWidth: 420 }}
          >
            <option value="">— Choose a module —</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" />Loading…</div>}

      {results && !loading && (
        <>
          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Attempts',  value: results.results.length,  Icon: HiChartBar },
              { label: 'Unique Students', value: results.totalStudents,   Icon: HiUsers },
              { label: 'Class Avg Score', value: `${results.avgScore}%`,  Icon: HiTrendingUp },
            ].map(({ label, value, Icon }) => (
              <div className="stat-card" key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ color: 'var(--text-sub)', fontSize: '0.95rem' }} />
                  </div>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', width: 'fit-content' }}>
            <button style={tabStyle('results')} onClick={() => setActiveTab('results')}>
              Quiz Results
            </button>
            <button style={tabStyle('insights')} onClick={() => setActiveTab('insights')}>
              Knowledge Insights
            </button>
            <button style={tabStyle('research')} onClick={() => setActiveTab('research')}>
              Research Analytics
            </button>
          </div>

          {/* ── Tab: Quiz Results ─────────────────────────────────────── */}
          {activeTab === 'results' && (
            <div className="card">
              <div className="card-header"><h2 className="card-title">Student Results</h2></div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Quiz</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Rec. Level</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{r.studentId?.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.studentId?.email}</div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{r.quizId?.title}</td>
                        <td style={{ fontSize: '0.875rem' }}>{r.score}/{r.totalMarks}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="progress-bar" style={{ width: 72 }}>
                              <div
                                className={`progress-fill ${r.percentage < 40 ? 'danger' : r.percentage <= 70 ? 'warning' : 'success'}`}
                                style={{ width: `${r.percentage}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.percentage}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${r.recommendedDifficulty === 'easy' ? 'success' : r.recommendedDifficulty === 'advanced' ? 'danger' : 'info'}`}>
                            {r.recommendedDifficulty}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: '0.78rem' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {results.results.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No results yet for this module.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Tab: Knowledge Insights ───────────────────────────────── */}
          {activeTab === 'insights' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Knowledge State by Topic</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adaptive learner model data</span>
              </div>
              <InsightsPanel moduleId={selectedModule} />
            </div>
          )}

          {/* ── Tab: Research Analytics ───────────────────────────────── */}
          {activeTab === 'research' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Empirical Research Analytics & Traces</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Experimental evaluation data</span>
              </div>
              <ResearchAnalyticsPanel moduleId={selectedModule} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FacultyResults;
