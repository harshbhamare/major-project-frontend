import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const FacultyResults = () => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/modules').then(({ data }) => setModules(data));
  }, []);

  const fetchResults = async (moduleId) => {
    setSelectedModule(moduleId);
    if (!moduleId) return;
    setLoading(true);
    const { data } = await api.get(`/results/module/${moduleId}`);
    setResults(data);
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Class Performance</h1>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Module</label>
          <select className="form-control" value={selectedModule} onChange={(e) => fetchResults(e.target.value)}>
            <option value="">-- Choose a module --</option>
            {modules.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="loading"><div className="spinner" />Loading...</div>}

      {results && !loading && (
        <>
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card">
              <div className="stat-label">Total Attempts</div>
              <div className="stat-value">{results.results.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Unique Students</div>
              <div className="stat-value">{results.totalStudents}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Class Avg Score</div>
              <div className="stat-value">{results.avgScore}%</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h2 className="card-title">Student Results</h2></div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Student</th><th>Quiz</th><th>Score</th><th>Percentage</th><th>Difficulty Rec.</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {results.results.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.studentId?.name}</div>
                        <div className="text-muted">{r.studentId?.email}</div>
                      </td>
                      <td>{r.quizId?.title}</td>
                      <td>{r.score}/{r.totalMarks}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div
                              className={`progress-fill ${r.percentage < 40 ? 'danger' : r.percentage <= 70 ? 'warning' : 'success'}`}
                              style={{ width: `${r.percentage}%` }}
                            />
                          </div>
                          <span>{r.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${r.recommendedDifficulty === 'easy' ? 'success' : r.recommendedDifficulty === 'advanced' ? 'danger' : 'info'}`}>
                          {r.recommendedDifficulty}
                        </span>
                      </td>
                      <td className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {results.results.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No results yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacultyResults;
