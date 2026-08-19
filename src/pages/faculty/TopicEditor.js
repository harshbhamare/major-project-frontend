import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HiPencil, HiTrash, HiCheckCircle, HiArrowRight,
  HiInformationCircle, HiLightningBolt, HiExclamationCircle,
} from 'react-icons/hi';

// ─── Parse the rich JSON summary, or fall back to plain string ────────────────
const parseSummary = (raw) => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && p.summary) return p;
  } catch (_) {}
  return { summary: raw, explanation: '', realWorldExample: '', keyPoints: [], watchOut: '' };
};

// ─── Extract the plain human-readable summary for display ────────────────────
const plainSummary = (raw) => parseSummary(raw)?.summary || raw || '';

// ─── Difficulty colours ───────────────────────────────────────────────────────
const DIFF_BADGE = { easy: 'success', normal: 'info', advanced: 'danger' };

// ─── Expanded topic view ──────────────────────────────────────────────────────
const TopicPreview = ({ topic }) => {
  const content = parseSummary(topic.summary);
  if (!content) return null;
  return (
    <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {content.summary && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', lineHeight: 1.7, margin: 0 }}>
          {content.summary}
        </p>
      )}
      {content.explanation && (
        <div style={{ padding: '0.75rem 0.875rem', background: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: '0 8px 8px 0', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.65 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
            <HiInformationCircle style={{ color: '#3b82f6', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How it works</span>
          </div>
          {content.explanation}
        </div>
      )}
      {content.realWorldExample && (
        <div style={{ padding: '0.75rem 0.875rem', background: '#fffbeb', borderLeft: '3px solid #f59e0b', borderRadius: '0 8px 8px 0', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.65 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
            <HiLightningBolt style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: '#92400e', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-world example</span>
          </div>
          {content.realWorldExample}
        </div>
      )}
      {content.keyPoints?.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {content.keyPoints.map((kp, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.55 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: '0.45rem' }} />
              {kp}
            </li>
          ))}
        </ul>
      )}
      {content.watchOut && (
        <div style={{ padding: '0.6rem 0.875rem', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '0 8px 8px 0', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <HiExclamationCircle style={{ color: '#ef4444', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Common mistake</span>
          </div>
          {content.watchOut}
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const TopicEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [expanded, setExpanded]   = useState(new Set());

  const fetchTopics = () => {
    api.get(`/content/${id}/topics`).then(({ data }) => {
      setTopics(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchTopics(); }, [id]);

  const toggleExpand = (topicId) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(topicId) ? next.delete(topicId) : next.add(topicId);
      return next;
    });

  const startEdit = (topic) => {
    setEditingId(topic._id);
    // Always edit the plain summary string, not the raw JSON
    setEditForm({
      title: topic.title,
      summary: plainSummary(topic.summary),
      difficulty: topic.difficulty,
    });
  };

  const saveEdit = async (topicId) => {
    setSaving(true);
    // Save just the plain summary — keep it human-editable
    await api.put(`/topics/${topicId}`, editForm);
    setEditingId(null);
    fetchTopics();
    setSaving(false);
  };

  const deleteTopic = async (topicId) => {
    if (!window.confirm('Delete this topic?')) return;
    await api.delete(`/topics/${topicId}`);
    fetchTopics();
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading topics…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Review Topics</h1>
          <p className="page-subtitle">{topics.length} topic{topics.length !== 1 ? 's' : ''} extracted</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/faculty/modules/new')}>
          Build Module <HiArrowRight />
        </button>
      </div>

      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.875rem 1.1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6 }}>
        Review and optionally edit the AI-generated topics below. Click a topic to expand its full content. When ready, click <strong>Build Module</strong> to group these topics into a lesson.
      </div>

      {topics.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p className="text-muted">No topics found. Make sure AI processing completed successfully.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {topics.map((topic, idx) => (
          <div className="card" key={topic._id} style={{ padding: '1rem 1.25rem' }}>
            {editingId === topic._id ? (
              /* ── Edit form ─────────────────────────────────────────── */
              <div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-control no-icon"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Summary</label>
                  <textarea
                    className="form-control no-icon"
                    value={editForm.summary}
                    onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                    rows={4}
                    placeholder="Write a concise description of this topic…"
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Editing saves a plain-text summary. AI-generated sections (examples, key points) will be removed.
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-control no-icon"
                    value={editForm.difficulty}
                    onChange={e => setEditForm({ ...editForm, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy — Foundational</option>
                    <option value="normal">Normal — Intermediate</option>
                    <option value="advanced">Advanced — Complex</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => saveEdit(topic._id)} disabled={saving}>
                    {saving ? 'Saving…' : <><HiCheckCircle /> Save</>}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              /* ── View row ──────────────────────────────────────────── */
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <button
                    onClick={() => toggleExpand(topic._id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, textAlign: 'left' }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--border)', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700, marginTop: 1,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{topic.title}</span>
                        <span className={`badge badge-${DIFF_BADGE[topic.difficulty] || 'info'}`}>{topic.difficulty}</span>
                      </div>
                      {!expanded.has(topic._id) && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                          {plainSummary(topic.summary).substring(0, 140)}{plainSummary(topic.summary).length > 140 ? '…' : ''}
                        </p>
                      )}
                    </div>
                  </button>

                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => startEdit(topic)} title="Edit">
                      <HiPencil />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteTopic(topic._id)} title="Delete">
                      <HiTrash />
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded.has(topic._id) && <TopicPreview topic={topic} />}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicEditor;
