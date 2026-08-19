import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import {
  HiCheckCircle, HiLightningBolt, HiStar,
  HiAcademicCap, HiChip, HiBookOpen, HiChevronDown, HiChevronRight,
} from 'react-icons/hi';

// ─── Parse rich JSON summary → plain string ───────────────────────────────────
const plainSummary = (raw) => {
  if (!raw) return '';
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && p.summary) return p.summary;
  } catch (_) {}
  return raw;
};

// ─── Difficulty config ────────────────────────────────────────────────────────
const DIFF = {
  easy:     { bg: '#dcfce7', text: '#15803d', Icon: HiAcademicCap },
  normal:   { bg: '#dbeafe', text: '#1d4ed8', Icon: HiChip },
  advanced: { bg: '#fef3c7', text: '#a16207', Icon: HiLightningBolt },
};

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ step }) => {
  const steps = [
    { num: 1, label: 'Details' },
    { num: 2, label: 'Topics' },
    { num: 3, label: 'Review' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
      {steps.map((s, i) => {
        const done   = step > s.num;
        const active = step === s.num;
        return (
          <React.Fragment key={s.num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: done ? 'var(--green)' : active ? 'var(--navy)' : 'var(--border)',
                color: (done || active) ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.2s',
              }}>
                {done ? <HiCheckCircle /> : s.num}
              </div>
              <div style={{
                fontSize: '0.72rem', fontWeight: active ? 700 : 500,
                color: done ? 'var(--green-dark)' : active ? 'var(--navy)' : 'var(--text-muted)',
              }}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 18, mx: 4,
                background: done ? 'var(--green)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const ModuleBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm]                     = useState({ title: '', description: '', difficulty: 'normal' });
  // contentGroups: [{ content: {_id,title,fileType}, topics: [...] }, ...]
  const [contentGroups, setContentGroups]   = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState('');
  const [step, setStep]                     = useState(1);
  const [success, setSuccess]               = useState(false);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      // Fetch all processed content
      const { data: contents } = await api.get('/content');
      const processed = contents.filter(c => c.status === 'processed');

      // Fetch topics for each content separately — keeps them grouped
      const groups = await Promise.all(
        processed.map(async (c) => {
          const { data: topics } = await api.get(`/content/${c._id}/topics`);
          return { content: c, topics };
        })
      );

      // Only include groups that actually have topics
      setContentGroups(groups.filter(g => g.topics.length > 0));

      // Expand all groups by default so faculty can see everything
      setExpandedGroups(new Set(processed.map(c => c._id)));

      // If editing, pre-fill form and pre-select topics
      if (id) {
        const { data: mod } = await api.get(`/modules/${id}`);
        setForm({ title: mod.title, description: mod.description || '', difficulty: mod.difficulty });
        setSelectedTopics(mod.topics.map(t => t._id || t));
        setStep(2);
      }

      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggleGroup = (contentId) =>
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(contentId) ? next.delete(contentId) : next.add(contentId);
      return next;
    });

  const toggleTopic = (topicId) =>
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(t => t !== topicId) : [...prev, topicId]
    );

  const selectAllFromGroup = (topics) => {
    const ids = topics.map(t => t._id);
    setSelectedTopics(prev => {
      const existing = new Set(prev);
      ids.forEach(id => existing.add(id));
      return [...existing];
    });
  };

  const deselectAllFromGroup = (topics) => {
    const ids = new Set(topics.map(t => t._id));
    setSelectedTopics(prev => prev.filter(id => !ids.has(id)));
  };

  // All topics flat (for review step)
  const allTopicsFlat = contentGroups.flatMap(g => g.topics);

  const handleSubmit = async () => {
    if (!form.title.trim() || selectedTopics.length === 0) {
      setError('Please provide a title and select at least one topic.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, topicIds: selectedTopics };
      if (id) {
        await api.put(`/modules/${id}`, payload);
      } else {
        await api.post('/modules', payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/faculty/modules'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save module.');
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !form.title.trim()) { setError('Please enter a module title.'); return; }
    if (step === 2 && selectedTopics.length === 0) { setError('Select at least one topic.'); return; }
    setError('');
    setStep(s => s + 1);
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  // ── Success overlay ──────────────────────────────────────────────────────────
  if (success) return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,29,46,0.85)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ background: 'white', padding: '3rem', borderRadius: 16, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <HiCheckCircle style={{ fontSize: '3.5rem', color: 'var(--green)', marginBottom: '0.75rem' }} />
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', marginBottom: '0.4rem' }}>
          Module {id ? 'Updated' : 'Created'}!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Redirecting to modules…</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{id ? 'Edit Module' : 'Create Module'}</h1>
          <p className="page-subtitle">Step {step} of 3</p>
        </div>
        {selectedTopics.length > 0 && (
          <div style={{ background: 'var(--green-glow)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--green-dark)' }}>
            {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </div>

      <StepBar step={step} />

      {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

      {/* ── Step 1: Details ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <HiStar style={{ color: 'var(--green)', fontSize: '1.1rem' }} />
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Module Details</h2>
          </div>

          <div className="form-group">
            <label className="form-label">Module Title *</label>
            <input
              className="form-control no-icon"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Introduction to Machine Learning"
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{form.title.length}/100</div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control no-icon"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of what students will learn…"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
              {Object.entries(DIFF).map(([level, d]) => {
                const isActive = form.difficulty === level;
                return (
                  <button
                    key={level} type="button"
                    onClick={() => setForm({ ...form, difficulty: level })}
                    style={{
                      padding: '0.875rem 0.5rem',
                      border: `2px solid ${isActive ? d.text : 'var(--border)'}`,
                      borderRadius: 10,
                      background: isActive ? d.bg : 'white',
                      color: isActive ? d.text : 'var(--text-sub)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    <d.Icon style={{ fontSize: '1.3rem' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', textTransform: 'capitalize' }}>{level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" onClick={nextStep}>
              Next: Select Topics <HiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Topics ────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          {contentGroups.length === 0 ? (
            <div className="empty-state">
              <HiBookOpen className="empty-state-icon" />
              <h3>No processed content yet</h3>
              <p>Upload and process content first to extract topics.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {contentGroups.map(({ content, topics }) => {
                const isExpanded = expandedGroups.has(content._id);
                const selectedCount = topics.filter(t => selectedTopics.includes(t._id)).length;
                const allSelected   = selectedCount === topics.length;

                return (
                  <div key={content._id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {/* Group header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.875rem 1.25rem',
                        borderBottom: isExpanded ? '1px solid var(--border)' : 'none',
                        background: 'var(--bg)', cursor: 'pointer',
                      }}
                      onClick={() => toggleGroup(content._id)}
                    >
                      {isExpanded
                        ? <HiChevronDown style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        : <HiChevronRight style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                      <HiBookOpen style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {content.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {content.fileType?.toUpperCase()} · {topics.length} topics
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                        {selectedCount > 0 && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--green-dark)', background: 'var(--green-glow)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                            {selectedCount}/{topics.length}
                          </span>
                        )}
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => allSelected ? deselectAllFromGroup(topics) : selectAllFromGroup(topics)}
                        >
                          {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                      </div>
                    </div>

                    {/* Topics list */}
                    {isExpanded && (
                      <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {topics.map((topic) => {
                          const isSelected = selectedTopics.includes(topic._id);
                          const diff = DIFF[topic.difficulty] || DIFF.normal;
                          const summary = plainSummary(topic.summary);

                          return (
                            <div
                              key={topic._id}
                              onClick={() => toggleTopic(topic._id)}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                padding: '0.75rem 0.875rem',
                                borderRadius: 8, cursor: 'pointer',
                                border: `1.5px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`,
                                background: isSelected ? 'var(--green-glow)' : 'white',
                                transition: 'all 0.15s',
                              }}
                            >
                              {/* Checkbox */}
                              <div style={{
                                width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                                border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`,
                                background: isSelected ? 'var(--green)' : 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s',
                              }}>
                                {isSelected && <HiCheckCircle style={{ color: 'white', fontSize: '0.85rem' }} />}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{topic.title}</span>
                                  <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                                    borderRadius: 999, background: diff.bg, color: diff.text,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                  }}>
                                    {topic.difficulty}
                                  </span>
                                </div>
                                {summary && (
                                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                                    {summary.length > 130 ? summary.substring(0, 127) + '…' : summary}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={nextStep} disabled={selectedTopics.length === 0}>
              Review {selectedTopics.length > 0 ? `(${selectedTopics.length})` : ''} <HiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div className="card" style={{ maxWidth: 680, margin: '0 auto', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <HiCheckCircle style={{ color: 'var(--green)', fontSize: '1.1rem' }} />
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Review & Confirm</h2>
            </div>

            {/* Summary block */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ marginBottom: '0.875rem' }}>
                <div className="section-label">Module Title</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)' }}>{form.title}</div>
              </div>
              {form.description && (
                <div style={{ marginBottom: '0.875rem' }}>
                  <div className="section-label">Description</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-sub)' }}>{form.description}</div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div>
                  <div className="section-label">Difficulty</div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    padding: '0.25rem 0.75rem', borderRadius: 999,
                    background: DIFF[form.difficulty]?.bg,
                    color: DIFF[form.difficulty]?.text,
                    fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize',
                  }}>
                    {form.difficulty}
                  </div>
                </div>
                <div>
                  <div className="section-label">Topics</div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--green-dark)' }}>
                    {selectedTopics.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Selected topics list */}
            <div className="section-label" style={{ marginBottom: '0.6rem' }}>Selected Topics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {allTopicsFlat.filter(t => selectedTopics.includes(t._id)).map((topic, idx) => {
                const diff = DIFF[topic.difficulty] || DIFF.normal;
                return (
                  <div key={topic._id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem 0.875rem', background: 'var(--bg)', borderRadius: 8,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--navy)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {topic.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {plainSummary(topic.summary).substring(0, 90)}{plainSummary(topic.summary).length > 90 ? '…' : ''}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem',
                      borderRadius: 999, background: diff.bg, color: diff.text,
                      textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                    }}>
                      {topic.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
              style={{ padding: '0.75rem 2rem', background: 'var(--green)', color: 'var(--navy)', minWidth: 160, justifyContent: 'center' }}
            >
              {saving
                ? <><span className="btn-spinner" style={{ borderColor: 'rgba(0,0,0,0.15)', borderTopColor: 'var(--navy)' }} /> Saving…</>
                : <><HiCheckCircle /> {id ? 'Update Module' : 'Create Module'}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleBuilder;
