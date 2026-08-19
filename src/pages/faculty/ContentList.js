import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { HiUpload, HiLightningBolt, HiRefresh, HiEye } from 'react-icons/hi';

const STATUS_BADGE = {
  processed:  'success',
  processing: 'warning',
  failed:     'danger',
  uploaded:   'info',
};

const ContentList = () => {
  const [content, setContent]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState({});
  const [processError, setProcessError] = useState({});

  const fetchContent = () =>
    api.get('/content').then(({ data }) => { setContent(data); setLoading(false); });

  useEffect(() => { fetchContent(); }, []);

  const handleProcess = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    setProcessError(e => ({ ...e, [id]: '' }));
    try {
      await api.post(`/content/${id}/process`);
      await fetchContent();
    } catch (err) {
      setProcessError(e => ({ ...e, [id]: err.response?.data?.message || 'Processing failed.' }));
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Content</h1>
          <p className="page-subtitle">{content.length} upload{content.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/faculty/upload" className="btn btn-primary">
          <HiUpload /> Upload New
        </Link>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.map(c => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.title}</div>
                    {processError[c._id] && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 2 }}>
                        {processError[c._id]}
                      </div>
                    )}
                  </td>
                  <td><span className="badge badge-info">{c.fileType.toUpperCase()}</span></td>
                  <td>
                    <span className={`badge badge-${STATUS_BADGE[c.status] || 'info'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      {(c.status === 'uploaded' || c.status === 'failed') && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleProcess(c._id)}
                          disabled={processing[c._id]}
                        >
                          {processing[c._id]
                            ? <><span className="btn-spinner" /> Processing…</>
                            : <><HiLightningBolt /> Process with AI</>}
                        </button>
                      )}
                      {c.status === 'processed' && (
                        <>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleProcess(c._id)}
                            disabled={processing[c._id]}
                            title="Re-process"
                          >
                            <HiRefresh />
                          </button>
                          <Link to={`/faculty/content/${c._id}/topics`} className="btn btn-sm btn-secondary">
                            <HiEye /> Topics
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {content.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No content uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContentList;
