import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { HiLightningBolt, HiCheckCircle, HiTrash, HiPencil, HiPlus } from 'react-icons/hi';

const emptyQuestion = {
  questionText: '', options: ['', '', '', ''],
  correctAnswer: '', marks: 1, difficulty: 'normal',
};

const QuizManager = () => {
  const { id: moduleId } = useParams();
  const [module, setModule]       = useState(null);
  const [quizzes, setQuizzes]     = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [editingQ, setEditingQ]   = useState(null);
  const [newQuestion, setNewQuestion] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);

  const fetchData = async () => {
    const [mod, qz] = await Promise.all([
      api.get(`/modules/${moduleId}`),
      api.get(`/quizzes/module/${moduleId}`),
    ]);
    setModule(mod.data);
    setQuizzes(qz.data);
    if (qz.data.length > 0) setActiveQuiz(qz.data[0]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [moduleId]);

  const generateQuiz = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data } = await api.post(`/quizzes/generate/${moduleId}`);
      setQuizzes(prev => [...prev, data]);
      setActiveQuiz(data);
    } catch (err) {
      setError(err.response?.data?.message || 'AI generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const publishQuiz = async (quizId) => {
    const { data } = await api.put(`/quizzes/${quizId}/publish`);
    setQuizzes(prev => prev.map(q => q._id === quizId ? data : q));
    setActiveQuiz(data);
  };

  const saveQuestion = async (questionIdx) => {
    setSaving(true);
    const updated = [...activeQuiz.questions];
    updated[questionIdx] = { ...editingQ };
    delete updated[questionIdx]._idx;
    const { data } = await api.put(`/quizzes/${activeQuiz._id}`, { questions: updated });
    setActiveQuiz(data);
    setQuizzes(prev => prev.map(q => q._id === data._id ? data : q));
    setEditingQ(null);
    setSaving(false);
  };

  const addQuestion = async () => {
    if (!newQuestion.questionText.trim() || !newQuestion.correctAnswer) {
      setError('Question text and correct answer are required.');
      return;
    }
    setSaving(true);
    setError('');
    const updated = [...(activeQuiz.questions || []), newQuestion];
    const { data } = await api.put(`/quizzes/${activeQuiz._id}`, { questions: updated });
    setActiveQuiz(data);
    setQuizzes(prev => prev.map(q => q._id === data._id ? data : q));
    setNewQuestion(null);
    setSaving(false);
  };

  const deleteQuestion = async (idx) => {
    if (!window.confirm('Delete this question?')) return;
    const updated = activeQuiz.questions.filter((_, i) => i !== idx);
    const { data } = await api.put(`/quizzes/${activeQuiz._id}`, { questions: updated });
    setActiveQuiz(data);
    setQuizzes(prev => prev.map(q => q._id === data._id ? data : q));
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz Manager</h1>
          <p className="page-subtitle">{module?.title}</p>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-primary" onClick={generateQuiz} disabled={generating}>
            {generating
              ? <><span className="btn-spinner" /> Generating…</>
              : <><HiLightningBolt /> Generate with AI</>}
          </button>
          {activeQuiz && (
            <button
              className={`btn btn-${activeQuiz.status === 'published' ? 'warning' : 'success'}`}
              onClick={() => publishQuiz(activeQuiz._id)}
            >
              {activeQuiz.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Quiz tabs */}
      {quizzes.length > 1 && (
        <div className="flex gap-1" style={{ marginBottom: '1rem' }}>
          {quizzes.map(q => (
            <button
              key={q._id}
              className={`btn btn-sm ${activeQuiz?._id === q._id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveQuiz(q)}
            >
              {q.title}
            </button>
          ))}
        </div>
      )}

      {!activeQuiz && (
        <div className="card">
          <div className="card-empty">
            <HiLightningBolt className="card-empty-icon" />
            <h3>No quiz yet</h3>
            <p>Click "Generate with AI" to auto-create questions from module topics.</p>
          </div>
        </div>
      )}

      {activeQuiz && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{activeQuiz.title}</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {activeQuiz.questions?.length || 0} questions · {activeQuiz.timeLimit} min
              </p>
            </div>
            <span className={`badge badge-${activeQuiz.status === 'published' ? 'success' : 'warning'}`}>
              {activeQuiz.status}
            </span>
          </div>

          {activeQuiz.questions?.map((q, idx) => (
            <div key={idx} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, marginBottom: '0.75rem' }}>
              {editingQ?._idx === idx ? (
                /* Edit form */
                <div>
                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <textarea
                      className="form-control no-icon" rows={3}
                      value={editingQ.questionText}
                      onChange={e => setEditingQ({ ...editingQ, questionText: e.target.value })}
                    />
                  </div>
                  {editingQ.options.map((opt, oi) => (
                    <div className="form-group" key={oi}>
                      <label className="form-label">Option {oi + 1}</label>
                      <input className="form-control no-icon" value={opt}
                        onChange={e => {
                          const opts = [...editingQ.options];
                          opts[oi] = e.target.value;
                          setEditingQ({ ...editingQ, options: opts });
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Correct Answer</label>
                      <select className="form-control no-icon" value={editingQ.correctAnswer}
                        onChange={e => setEditingQ({ ...editingQ, correctAnswer: e.target.value })}>
                        <option value="">Select correct answer</option>
                        {editingQ.options.filter(Boolean).map((o, i) => <option key={i} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Marks</label>
                      <input type="number" className="form-control no-icon" min={1}
                        value={editingQ.marks}
                        onChange={e => setEditingQ({ ...editingQ, marks: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-sm btn-primary" onClick={() => saveQuestion(idx)} disabled={saving}>
                      {saving ? 'Saving…' : <><HiCheckCircle /> Save</>}
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingQ(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                /* View */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Q{idx + 1}: {q.questionText}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {q.options?.map((opt, oi) => (
                          <span key={oi} className={`badge ${opt === q.correctAnswer ? 'badge-success' : 'badge-info'}`}>
                            {opt === q.correctAnswer && <HiCheckCircle style={{ marginRight: 2, verticalAlign: 'middle' }} />}
                            {opt}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        {q.marks} mark{q.marks !== 1 ? 's' : ''} · {q.difficulty}
                      </div>
                    </div>
                    <div className="flex gap-1" style={{ flexShrink: 0 }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditingQ({ ...q, _idx: idx })}>
                        <HiPencil />
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteQuestion(idx)}>
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add question form */}
          {newQuestion ? (
            <div style={{ padding: '1rem', border: '2px dashed var(--border)', borderRadius: 8, marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>New Question</div>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea className="form-control no-icon" rows={3}
                  value={newQuestion.questionText}
                  onChange={e => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                />
              </div>
              {newQuestion.options.map((opt, oi) => (
                <div className="form-group" key={oi}>
                  <label className="form-label">Option {oi + 1}</label>
                  <input className="form-control no-icon" value={opt}
                    onChange={e => {
                      const opts = [...newQuestion.options];
                      opts[oi] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: opts });
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Correct Answer</label>
                  <select className="form-control no-icon" value={newQuestion.correctAnswer}
                    onChange={e => setNewQuestion({ ...newQuestion, correctAnswer: e.target.value })}>
                    <option value="">Select correct answer</option>
                    {newQuestion.options.filter(Boolean).map((o, i) => <option key={i} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Marks</label>
                  <input type="number" className="form-control no-icon" min={1}
                    value={newQuestion.marks}
                    onChange={e => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-sm btn-primary" onClick={addQuestion} disabled={saving}>
                  {saving ? 'Adding…' : 'Add Question'}
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setNewQuestion(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => setNewQuestion({ ...emptyQuestion })}>
              <HiPlus /> Add Question Manually
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizManager;
