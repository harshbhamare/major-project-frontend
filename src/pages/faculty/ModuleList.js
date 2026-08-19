import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = () => {
    api.get('/modules').then(({ data }) => { setModules(data); setLoading(false); });
  };

  useEffect(() => { fetchModules(); }, []);

  const togglePublish = async (id) => {
    await api.put(`/modules/${id}/publish`);
    fetchModules();
  };

  const deleteModule = async (id) => {
    if (!window.confirm('Delete this module?')) return;
    await api.delete(`/modules/${id}`);
    fetchModules();
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Modules</h1>
        <Link to="/faculty/modules/new" className="btn btn-primary">+ Create Module</Link>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Title</th><th>Topics</th><th>Difficulty</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{m.title}</div>
                    <div className="text-muted">{m.description}</div>
                  </td>
                  <td>{m.topics?.length || 0}</td>
                  <td>
                    <span className={`badge badge-${m.difficulty === 'easy' ? 'success' : m.difficulty === 'advanced' ? 'danger' : 'info'}`}>
                      {m.difficulty}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${m.status === 'published' ? 'success' : 'warning'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/faculty/modules/${m._id}/edit`} className="btn btn-sm btn-secondary">Edit</Link>
                      <Link to={`/faculty/modules/${m._id}/quiz`} className="btn btn-sm btn-secondary">Quiz</Link>
                      <button
                        className={`btn btn-sm btn-${m.status === 'published' ? 'warning' : 'success'}`}
                        onClick={() => togglePublish(m._id)}
                      >
                        {m.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteModule(m._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {modules.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No modules yet. Create one from your processed content.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModuleList;
