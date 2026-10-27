import React, { useEffect, useState, useMemo } from 'react';
import api from '../../services/api';
import {
  getModuleResearchAnalytics,
  getModuleResearchTrace,
} from '../../services/adaptiveService';
import {
  HiChartBar, HiUsers, HiTrendingUp, HiTrendingDown,
  HiMinusSm, HiExclamationCircle, HiCheckCircle, HiInformationCircle,
  HiDownload, HiLightningBolt, HiSearch, HiEye, HiX,
  HiFilter, HiPrinter, HiAcademicCap, HiSparkles, HiArrowRight,
} from 'react-icons/hi';
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

// ─── Mastery Bar ─────────────────────────────────────────────────────────────
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

// ─── Export: Student Status Analytics to Excel / CSV ─────────────────────────
function exportStudentAnalyticsToExcel(students, moduleTitle, classAvg) {
  if (!students || students.length === 0) return;
  const now = new Date();
  const filename = `${(moduleTitle || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_')}_Student_Analytics_${now.toISOString().slice(0, 10)}.csv`;

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = str.toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = '';
  csvContent += `STUDENT STATUS & LEARNING PERFORMANCE REPORT\r\n`;
  csvContent += `Module,${escapeCsv(moduleTitle || 'All Modules')}\r\n`;
  csvContent += `Class Average Score,${escapeCsv(`${classAvg || 0}%`)}\r\n`;
  csvContent += `Total Students Tracked,${students.length}\r\n`;
  csvContent += `Export Timestamp,${escapeCsv(now.toLocaleString())}\r\n`;
  csvContent += `\r\n`;

  csvContent += `#,Student Name,Email Address,Status,Average Score,Latest Score,Highest Score,Learning Trend,Total Attempts,Identified Weak Topics,Last Active\r\n`;

  students.forEach((s, idx) => {
    const weakTopicsList = (s.weakTopics || []).map(wt => wt.title).join('; ') || 'None';
    const lastActiveStr = s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'N/A';
    csvContent += `${idx + 1},`;
    csvContent += `${escapeCsv(s.student?.name || 'Unnamed Student')},`;
    csvContent += `${escapeCsv(s.student?.email || 'N/A')},`;
    csvContent += `${escapeCsv(s.status === 'needs_intervention' ? 'Needs Intervention' : s.status === 'developing' ? 'Developing' : 'Mastered')},`;
    csvContent += `${s.averageScore}%,`;
    csvContent += `${s.latestScore}%,`;
    csvContent += `${s.highestScore}%,`;
    csvContent += `${escapeCsv(s.trend)},`;
    csvContent += `${s.totalAttempts},`;
    csvContent += `${escapeCsv(weakTopicsList)},`;
    csvContent += `${escapeCsv(lastActiveStr)}\r\n`;
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Export: Raw Quiz Submissions to Excel / CSV ─────────────────────────────
function exportQuizResultsToExcel(resultsData, moduleTitle) {
  if (!resultsData || !resultsData.results || resultsData.results.length === 0) return;
  const now = new Date();
  const filename = `${(moduleTitle || 'Quiz_Results').replace(/[^a-zA-Z0-9_-]/g, '_')}_Results_${now.toISOString().slice(0, 10)}.csv`;

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = str.toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = '';
  csvContent += `STUDENT ASSESSMENT & QUIZ RESULTS REPORT\r\n`;
  csvContent += `Module,${escapeCsv(moduleTitle || 'Module')}\r\n`;
  csvContent += `Total Submissions,${resultsData.results.length}\r\n`;
  csvContent += `Class Average Score,${escapeCsv(`${resultsData.avgScore}%`)}\r\n`;
  csvContent += `Export Timestamp,${escapeCsv(now.toLocaleString())}\r\n`;
  csvContent += `\r\n`;
  csvContent += `#,Student Name,Email Address,Quiz Title,Score,Total Marks,Percentage,Recommended Difficulty,Submission Date\r\n`;

  resultsData.results.forEach((r, idx) => {
    csvContent += `${idx + 1},`;
    csvContent += `${escapeCsv(r.studentId?.name || 'Unnamed Student')},`;
    csvContent += `${escapeCsv(r.studentId?.email || 'N/A')},`;
    csvContent += `${escapeCsv(r.quizId?.title || 'Quiz')},`;
    csvContent += `${r.score},`;
    csvContent += `${r.totalMarks},`;
    csvContent += `${r.percentage}%,`;
    csvContent += `${escapeCsv(r.recommendedDifficulty || 'normal')},`;
    csvContent += `${escapeCsv(new Date(r.createdAt).toLocaleDateString())}\r\n`;
  });

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Knowledge Insights Panel (EMA per topic) ────────────────────────────────
const InsightsPanel = ({ moduleId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    api.get(`/adaptation/module/${moduleId}/insights`)
      .then(({ data }) => { setInsights(data); setLoading(false); })
      .catch(() => { setError('Could not load knowledge insights.'); setLoading(false); });
  }, [moduleId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Loading topic knowledge state…
    </div>
  );

  if (error) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>{error}</div>
  );

  if (!insights || !insights.topicInsights?.length) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center', background: 'var(--bg)', borderRadius: 10 }}>
      No mastery data yet. Students need at least 3 assessed interactions per topic before knowledge state is computed.
    </div>
  );

  const { topicInsights, totalRecords } = insights;
  const sorted = [...topicInsights].sort((a, b) => a.avgMastery - b.avgMastery);

  return (
    <div>
      {/* Summary KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Topics Tracked', value: topicInsights.length, Icon: HiChartBar, color: '#3b82f6' },
          { label: 'Interactions Evaluated', value: totalRecords, Icon: HiUsers, color: '#8b5cf6' },
          { label: 'Topics Needing Review', value: topicInsights.filter(t => t.avgMastery < 0.60).length, Icon: HiExclamationCircle, color: 'var(--danger)' },
          { label: 'Topics Mastered (Avg)', value: topicInsights.filter(t => t.avgMastery >= 0.80).length, Icon: HiCheckCircle, color: 'var(--success)' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ padding: '0.9rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <Icon style={{ color, fontSize: '0.95rem', flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Per-topic breakdown */}
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
        Topic Knowledge Trajectories (Weakest First)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sorted.map(topic => {
          const state = topic.avgMastery >= 0.80 ? 'mastered'
            : topic.avgMastery >= 0.60 ? 'developing' : 'needs_intervention';
          const stateMeta = {
            mastered: { label: 'Mastered', color: 'var(--success)' },
            developing: { label: 'Developing', color: 'var(--warning)' },
            needs_intervention: { label: 'Needs Review', color: 'var(--danger)' },
          }[state];

          const interventionPct = topic.studentCount > 0
            ? Math.round((topic.needsIntervention / topic.studentCount) * 100)
            : 0;

          return (
            <div key={topic.topicId} style={{ padding: '0.85rem 1rem', background: 'white', borderRadius: 8, border: '1px solid var(--border)', borderLeft: `4px solid ${stateMeta.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                    {topic.topicTitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {topic.studentCount} student{topic.studentCount !== 1 ? 's' : ''} assessed
                    {topic.needsIntervention > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: '0.5rem', fontWeight: 600 }}>
                        · {topic.needsIntervention} ({interventionPct}%) require intervention
                      </span>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.55rem',
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
    </div>
  );
};

// ─── Research Analytics Panel (Spec §26) ──────────────────────────────────────
const ResearchAnalyticsPanel = ({ moduleId }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!moduleId) return;
    setLoading(true);
    getModuleResearchAnalytics(moduleId)
      .then(data => { setAnalytics(data); setLoading(false); })
      .catch(() => { setError('Could not load research analytics.'); setLoading(false); });
  }, [moduleId]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await getModuleResearchTrace(moduleId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-trace-module-${moduleId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Trace export failed.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem 0' }}>
      <div className="spinner" style={{ width: 16, height: 16 }} /> Compiling empirical analytics…
    </div>
  );

  if (error || !analytics) return (
    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '1rem 0' }}>{error || 'No research data.'}</div>
  );

  const {
    participantCount,
    totalInteractions,
    adaptiveAccuracy,
    baselineAccuracy,
    effectSize,
    avgMasteryGain,
    formatDistribution = {},
    bloomDistribution = {},
  } = analytics;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Participants', value: participantCount, Icon: HiUsers, color: '#3b82f6' },
          { label: 'Total Events', value: totalInteractions, Icon: HiChartBar, color: '#8b5cf6' },
          { label: 'Adaptive Acc.', value: adaptiveAccuracy !== null ? `${adaptiveAccuracy}%` : 'N/A', Icon: HiTrendingUp, color: 'var(--success)' },
          { label: "Cohen's d Effect", value: effectSize !== null ? effectSize : '0.00', Icon: HiSparkles, color: '#f59e0b' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ padding: '0.9rem 1rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              <Icon style={{ color, fontSize: '0.95rem' }} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#eff6ff', borderRadius: 10, border: '1px solid #bfdbfe', marginTop: '1rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e40af' }}>Download Research Trace Sequence</div>
          <div style={{ fontSize: '0.78rem', color: '#3b82f6' }}>
            Pseudonymized event-by-event data file for external statistical validation (R, Python, SPSS).
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
          <HiDownload /> {exporting ? 'Exporting…' : 'Export JSON Trace'}
        </button>
      </div>
    </div>
  );
};

// ─── Modal: Single Student Deep-Dive Profile ──────────────────────────────────
const StudentDetailModal = ({ studentData, onClose }) => {
  if (!studentData) return null;
  const { student, status, averageScore, latestScore, highestScore, trend, weakTopics = [], recentAttempts = [] } = studentData;

  const initials = (student?.name || 'S')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const statusBadge = {
    needs_intervention: { label: 'Needs Intervention', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    developing: { label: 'Developing', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    mastered: { label: 'Mastered', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  }[status] || { label: 'Active', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--primary-container)', color: 'var(--primary)',
              fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initials}
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: '1.2rem', marginBottom: 2 }}>{student?.name || 'Student Profile'}</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student?.email}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        {/* Status & KPI banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '0.75rem' }}>
          <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Current Status</div>
            <span style={{
              display: 'inline-block', marginTop: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: 999,
              fontSize: '0.74rem', fontWeight: 700, background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}`,
            }}>
              {statusBadge.label}
            </span>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Average Score</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: averageScore < 60 ? 'var(--danger)' : averageScore >= 80 ? 'var(--success)' : 'var(--primary)' }}>
              {averageScore}%
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Latest Score</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
              {latestScore}%
            </div>
          </div>

          <div style={{ padding: '0.85rem', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Highest Score</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>
              {highestScore}%
            </div>
          </div>
        </div>

        {/* Identified Weak Topics */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            Concepts Requiring Remediation
          </div>
          {weakTopics.length === 0 ? (
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, color: '#166534', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HiCheckCircle /> No significant knowledge gaps detected! Student has demonstrated consistent mastery.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {weakTopics.map((wt, i) => (
                <span key={i} style={{
                  padding: '0.3rem 0.65rem', borderRadius: 6,
                  background: 'var(--danger-bg)', color: 'var(--danger)',
                  border: '1px solid var(--danger-border)', fontSize: '0.8rem', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                }}>
                  <HiExclamationCircle /> {wt.title} {wt.count > 1 ? `(${wt.count} misses)` : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attempts History Table */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.45rem' }}>
            Recent Quiz Submissions ({recentAttempts.length})
          </div>
          <div className="table-wrapper" style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAttempts.map((att, i) => (
                  <tr key={att._id || i}>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{att.quizTitle}</td>
                    <td style={{ fontSize: '0.85rem' }}>{att.score}/{att.totalMarks}</td>
                    <td>
                      <span style={{
                        fontSize: '0.82rem', fontWeight: 700,
                        color: att.percentage < 60 ? 'var(--danger)' : att.percentage >= 80 ? 'var(--success)' : 'var(--primary)',
                      }}>
                        {att.percentage}%
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(att.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Student Analytics Page ──────────────────────────────────────────────
const FacultyResults = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tabs: 'overview' (visual charts & student status) | 'quizzes' (raw attempts) | 'insights' (EMA topic knowledge) | 'research' (SPSS/Cohen)
  const [activeTab, setActiveTab] = useState('overview');

  // Filter & Search states for the student roster
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_intervention' | 'developing' | 'mastered'
  const [sortBy, setSortBy] = useState('lowest'); // 'lowest' | 'highest' | 'attempts' | 'name'

  // Single student inspection drawer/modal
  const [inspectStudent, setInspectStudent] = useState(null);

  // Load modules on mount
  // Load modules on mount
  useEffect(() => {
    api.get('/modules')
      .then(({ data }) => {
        const published = data || [];
        setModules(published);
        // Auto-load cross-curriculum overview by default for maximum faculty productivity
        fetchResults('all');
      })
      .catch(err => {
        console.error('Failed to load modules:', err);
        setLoading(false);
      });
  }, []);

  const fetchResults = async (moduleId) => {
    setSelectedModule(moduleId);
    setResultsData(null);
    if (!moduleId) return;
    setLoading(true);
    try {
      if (moduleId === 'all') {
        const { data } = await api.get('/results/faculty-overview');
        setResultsData(data);
      } else {
        const { data } = await api.get(`/results/module/${moduleId}`);
        setResultsData(data);
      }
    } catch (_) { }
    setLoading(false);
  };

  const currentModule = useMemo(() => {
    if (selectedModule === 'all') {
      return { _id: 'all', title: 'Curriculum-Wide Overview (All Modules)', difficulty: 'aggregate', topics: [] };
    }
    return modules.find(m => m._id === selectedModule) || null;
  }, [modules, selectedModule]);

  // Filtered and sorted students list
  const filteredStudents = useMemo(() => {
    if (!resultsData?.students) return [];
    let list = [...resultsData.students];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(s => s.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.student?.name || '').toLowerCase().includes(q) ||
        (s.student?.email || '').toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortBy === 'lowest') {
      list.sort((a, b) => a.averageScore - b.averageScore);
    } else if (sortBy === 'highest') {
      list.sort((a, b) => b.averageScore - a.averageScore);
    } else if (sortBy === 'attempts') {
      list.sort((a, b) => b.totalAttempts - a.totalAttempts);
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.student?.name || '').localeCompare(b.student?.name || ''));
    }

    return list;
  }, [resultsData?.students, statusFilter, searchQuery, sortBy]);

  const tabStyle = (tab) => ({
    padding: '0.55rem 1.15rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.84rem',
    cursor: 'pointer',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-sub)',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  });

  return (
    <div>
      {/* Page Header with Action Bar */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Student Performance Analytics</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Comprehensive diagnostic insights into class mastery, at-risk students, and curriculum learning gaps.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {resultsData?.students?.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={() => exportStudentAnalyticsToExcel(resultsData.students, currentModule?.title, resultsData.avgScore)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              title="Download Excel spreadsheet of student status and weaknesses"
            >
              <HiDownload /> Export Analytics (Excel)
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <HiPrinter /> Print Report
          </button>
        </div>
      </div>

      {/* Module Selector Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>
            Analytics Scope:
          </label>
          <select
            className="form-control no-icon"
            value={selectedModule}
            onChange={(e) => fetchResults(e.target.value)}
            style={{ maxWidth: 380, fontSize: '0.88rem', fontWeight: 600 }}
          >
            <option value="all">All Modules (Curriculum-Wide Overview)</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>Module: {m.title}</option>
            ))}
          </select>
        </div>

        {currentModule && selectedModule !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-info">{currentModule.difficulty || 'normal'}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{currentModule.topics?.length || 0} topics</span>
          </div>
        )}
        {selectedModule === 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-success">Holistic View</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{modules.length} active modules</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading" style={{ minHeight: 280 }}>
          <div className="spinner" /> Compiling live student analytics…
        </div>
      )}

      {resultsData && resultsData.totalStudents === 0 && !loading && (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <HiUsers style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.35rem' }}>
            No Assessment Activity Recorded Yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 520, margin: '0 auto' }}>
            Students have not taken quizzes or completed assessments for this module yet. As soon as students participate, real-time performance analytics, at-risk alerts, and weak concept diagnoses will appear here automatically.
          </p>
        </div>
      )}

      {resultsData && resultsData.totalStudents > 0 && !loading && (
        <>
          {/* ── SECTION 1: EXECUTIVE KPI SUMMARY ROW ────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Total Students */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Students Tracked
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiUsers style={{ fontSize: '1.1rem' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
                {resultsData.totalStudents}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Across {resultsData.results.length} total quiz attempts
              </div>
            </div>

            {/* Class Average Score */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Class Avg Performance
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiTrendingUp style={{ fontSize: '1.1rem' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: resultsData.avgScore < 60 ? 'var(--danger)' : 'var(--primary)' }}>
                {resultsData.avgScore}%
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 999, overflow: 'hidden', marginTop: 8 }}>
                <div style={{
                  height: '100%',
                  width: `${resultsData.avgScore}%`,
                  background: resultsData.avgScore < 60 ? 'var(--danger)' : resultsData.avgScore >= 80 ? 'var(--success)' : 'var(--primary)',
                  borderRadius: 999,
                }} />
              </div>
            </div>

            {/* At-Risk / Intervention Required */}
            <div
              className="card"
              onClick={() => { setActiveTab('overview'); setStatusFilter('needs_intervention'); }}
              style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--danger)', transition: 'transform 0.15s' }}
              title="Click to filter students requiring intervention"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>
                  At-Risk (Needs Help)
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef2f2', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiExclamationCircle style={{ fontSize: '1.15rem' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)' }}>
                {resultsData.atRiskCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 2, fontWeight: 600 }}>
                Scoring &lt;60% or persistent gaps
              </div>
            </div>

            {/* Mastered Students */}
            <div
              className="card"
              onClick={() => { setActiveTab('overview'); setStatusFilter('mastered'); }}
              style={{ padding: '1.25rem', cursor: 'pointer', borderLeft: '4px solid var(--success)', transition: 'transform 0.15s' }}
              title="Click to filter mastered students"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase' }}>
                  Mastered (&ge;80%)
                </span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiCheckCircle style={{ fontSize: '1.15rem' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
                {resultsData.masteredCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: 2, fontWeight: 600 }}>
                Ready for advanced challenges
              </div>
            </div>
          </div>

          {/* Critical Knowledge Gap Notice if students are struggling */}
          {resultsData.weakTopicsRanking?.length > 0 && resultsData.weakTopicsRanking[0].count >= 2 && (
            <div style={{
              padding: '0.85rem 1.15rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 10,
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <HiExclamationCircle style={{ color: '#dc2626', fontSize: '1.35rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '0.88rem' }}>High Failure Rate Detected:</strong>
                  <span style={{ color: '#7f1d1d', fontSize: '0.88rem', marginLeft: '0.35rem' }}>
                    <strong>{resultsData.weakTopicsRanking[0].count} students</strong> struggled with topic:
                    &nbsp;<span style={{ background: '#fee2e2', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>{resultsData.weakTopicsRanking[0].title}</span>
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: 600 }}>
                Recommendation: Revisit in upcoming lecture
              </span>
            </div>
          )}

          {/* ── SECTION 2: INTERACTIVE VISUALIZATIONS ──────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {/* Chart A: Score Distribution */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    Class Score Distribution
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Number of students across mastery performance tiers
                  </p>
                </div>
              </div>

              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resultsData.distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div style={{ background: '#0f172a', color: '#fff', padding: '0.5rem 0.75rem', borderRadius: 6, fontSize: '0.75rem' }}>
                              <div style={{ fontWeight: 700 }}>{data.label}</div>
                              <div>{data.count} student(s)</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {(resultsData.distribution || []).map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Top Weak Topics Ranking */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                    Struggling Concepts (Weak Points)
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                    Topics with the highest student error count
                  </p>
                </div>
              </div>

              {(!resultsData.weakTopicsRanking || resultsData.weakTopicsRanking.length === 0) ? (
                <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No significant student errors recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 210, overflowY: 'auto' }}>
                  {resultsData.weakTopicsRanking.slice(0, 5).map((wt, idx) => {
                    const pctOfClass = resultsData.totalStudents > 0
                      ? Math.round((wt.count / resultsData.totalStudents) * 100)
                      : 0;

                    return (
                      <div key={wt.topicId || idx} style={{ padding: '0.65rem 0.85rem', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {wt.title}
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)' }}>
                            {wt.count} students ({pctOfClass}%)
                          </span>
                        </div>
                        <div style={{ height: 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctOfClass}%`, background: '#ef4444', borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3: TAB NAVIGATION ───────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: '0.35rem',
            marginBottom: '1.25rem',
            background: 'var(--bg)',
            padding: '0.35rem',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            width: 'fit-content',
            flexWrap: 'wrap',
          }}>
            <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
              <HiUsers /> Student Status Directory ({resultsData.students?.length || 0})
            </button>
            <button style={tabStyle('quizzes')} onClick={() => setActiveTab('quizzes')}>
              <HiChartBar /> Quiz Submissions ({resultsData.results?.length || 0})
            </button>
            <button style={tabStyle('insights')} onClick={() => setActiveTab('insights')}>
              <HiSparkles /> Topic Knowledge State
            </button>
            <button style={tabStyle('research')} onClick={() => setActiveTab('research')}>
              <HiAcademicCap /> Research Analytics
            </button>
          </div>

          {/* ── TAB CONTENT 1: COMPREHENSIVE STUDENT DIRECTORY ──────────────── */}
          {activeTab === 'overview' && (
            <div className="card" style={{ padding: '1.5rem' }}>
              {/* Filter and Search Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
                  <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by student name or email…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.25rem', fontSize: '0.86rem' }}
                  />
                </div>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'all', label: `All (${resultsData.students?.length || 0})` },
                    { id: 'needs_intervention', label: `At-Risk (${resultsData.atRiskCount || 0})`, color: 'var(--danger)' },
                    { id: 'developing', label: `Developing (${resultsData.students?.filter(s => s.status === 'developing').length || 0})`, color: 'var(--warning)' },
                    { id: 'mastered', label: `Mastered (${resultsData.masteredCount || 0})`, color: 'var(--success)' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: statusFilter === tab.id ? 700 : 500,
                        border: `1px solid ${statusFilter === tab.id ? (tab.color || 'var(--primary)') : 'var(--border)'}`,
                        background: statusFilter === tab.id ? (tab.color ? `${tab.color}18` : 'var(--primary)') : '#fff',
                        color: statusFilter === tab.id ? (tab.color || '#fff') : 'var(--text-sub)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sort:</span>
                  <select
                    className="form-control no-icon"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                  >
                    <option value="lowest">Lowest Score (Needs Attention)</option>
                    <option value="highest">Highest Score First</option>
                    <option value="attempts">Most Attempts</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Student Directory Table */}
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg)', borderRadius: 10 }}>
                  <HiUsers style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                    No students match the selected filter
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Try clearing the search query or selecting "All" to view the complete class.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>#</th>
                        <th>Student Name & Email</th>
                        <th>Status</th>
                        <th>Avg Score</th>
                        <th>Trend</th>
                        <th>Concepts Needing Attention</th>
                        <th>Quizzes Taken</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((item, idx) => {
                        const s = item.student;
                        const initials = (s?.name || 'S')
                          .split(' ')
                          .map(p => p[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        const statusConfig = {
                          needs_intervention: { label: 'Needs Help', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                          developing: { label: 'Developing', bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
                          mastered: { label: 'Mastered', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
                        }[item.status] || { label: 'Active', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };

                        return (
                          <tr key={s?._id || idx}>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                              {idx + 1}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                <div style={{
                                  width: 34, height: 34, borderRadius: '50%',
                                  background: 'var(--primary-container)', color: 'var(--primary)',
                                  fontWeight: 700, fontSize: '0.8rem',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {initials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                                    {s?.name || 'Student'}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {s?.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.72rem', fontWeight: 700,
                                padding: '0.2rem 0.55rem', borderRadius: 999,
                                background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}`,
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              }}>
                                {item.status === 'needs_intervention' ? <HiExclamationCircle /> : item.status === 'mastered' ? <HiCheckCircle /> : <HiInformationCircle />}
                                {statusConfig.label}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 55, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${item.averageScore}%`,
                                    background: item.averageScore < 60 ? 'var(--danger)' : item.averageScore >= 80 ? 'var(--success)' : 'var(--primary)',
                                    borderRadius: 999,
                                  }} />
                                </div>
                                <span style={{
                                  fontSize: '0.84rem', fontWeight: 800,
                                  color: item.averageScore < 60 ? 'var(--danger)' : item.averageScore >= 80 ? 'var(--success)' : 'var(--text)',
                                }}>
                                  {item.averageScore}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '0.76rem', fontWeight: 600,
                                color: item.trend === 'improving' ? 'var(--success)' : item.trend === 'declining' ? 'var(--danger)' : 'var(--text-muted)',
                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              }}>
                                {item.trend === 'improving' ? <HiTrendingUp /> : item.trend === 'declining' ? <HiTrendingDown /> : <HiMinusSm />}
                                {item.trend}
                              </span>
                            </td>
                            <td>
                              {item.weakTopics?.length === 0 ? (
                                <span style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: 600 }}>
                                  No gaps detected
                                </span>
                              ) : (
                                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                  {item.weakTopics.slice(0, 2).map((wt, i) => (
                                    <span key={i} style={{
                                      fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b',
                                      padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 600,
                                      maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }} title={wt.title}>
                                      {wt.title}
                                    </span>
                                  ))}
                                  {item.weakTopics.length > 2 && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                      +{item.weakTopics.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                              {item.totalAttempts} quiz(zes)
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setInspectStudent(item)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}
                                title="View full history and diagnostic record"
                              >
                                <HiEye /> Profile
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CONTENT 2: RAW QUIZ SUBMISSIONS ─────────────────────────── */}
          {activeTab === 'quizzes' && (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 className="card-title">Chronological Quiz Submissions</h2>
                {resultsData.results?.length > 0 && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => exportQuizResultsToExcel(resultsData, currentModule?.title)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <HiDownload /> Export Results (Excel)
                  </button>
                )}
              </div>
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
                    {resultsData.results.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.studentId?.name}</div>
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
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{r.percentage}%</span>
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
                    {resultsData.results.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                          No quiz results recorded for this module yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB CONTENT 3: KNOWLEDGE INSIGHTS ───────────────────────────── */}
          {activeTab === 'insights' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Topic Mastery Trajectories</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Class knowledge states & EMA analysis</span>
              </div>
              {selectedModule === 'all' ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Please select a specific course module from the <strong>Analytics Scope</strong> selector above to view per-topic EMA knowledge state trajectories.
                </div>
              ) : (
                <InsightsPanel moduleId={selectedModule} />
              )}
            </div>
          )}

          {/* ── TAB CONTENT 4: RESEARCH ANALYTICS ───────────────────────────── */}
          {activeTab === 'research' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Empirical Research Analytics & Effect Sizes</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Research experimental evaluation data</span>
              </div>
              {selectedModule === 'all' ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Please select a specific course module from the <strong>Analytics Scope</strong> selector above to inspect Cohen's d effect sizes, Bloom taxonomy distribution, and research traces.
                </div>
              ) : (
                <ResearchAnalyticsPanel moduleId={selectedModule} />
              )}
            </div>
          )}
        </>
      )}

      {/* Student Deep-Dive Profile Modal */}
      {inspectStudent && (
        <StudentDetailModal
          studentData={inspectStudent}
          onClose={() => setInspectStudent(null)}
        />
      )}
    </div>
  );
};

export default FacultyResults;
