import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  HiDocumentText, HiUpload, HiVideoCamera, HiMusicNote,
  HiLightningBolt, HiCheckCircle, HiX, HiExclamationCircle,
  HiInformationCircle, HiRefresh,
} from 'react-icons/hi';

// ─── Step indicator ────────────────────────────────────────────────────────────
const steps = [
  { key: 'upload',     label: 'Upload' },
  { key: 'processing', label: 'AI Processing' },
  { key: 'complete',   label: 'Done' },
];

const StepBar = ({ current }) => {
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem' }}>
      {steps.map((s, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const pending = i > idx;
        return (
          <React.Fragment key={s.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? 'var(--green)' : active ? '#3b82f6' : 'var(--border)',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700,
                transition: 'background 0.3s',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <div style={{
                fontSize: '0.72rem', marginTop: '0.3rem', fontWeight: active ? 700 : 500,
                color: done ? 'var(--green)' : active ? '#3b82f6' : 'var(--text-muted)',
              }}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                height: 2, flex: 2, marginBottom: 20,
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

// ─── Main component ────────────────────────────────────────────────────────────
const ContentUpload = () => {
  const [mode, setMode]                 = useState('text');
  const [title, setTitle]               = useState('');
  const [textContent, setTextContent]   = useState('');
  const [file, setFile]                 = useState(null);
  const [loading, setLoading]           = useState(false);
  const [processing, setProcessing]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]               = useState('');
  const [processError, setProcessError] = useState('');
  const [currentStep, setCurrentStep]   = useState('upload');
  const [topicCount, setTopicCount]     = useState(0);
  const [uploadedId, setUploadedId]     = useState(null);
  const navigate = useNavigate();

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    setError('');
  };

  const isMediaMode = mode === 'video' || mode === 'audio';

  const getFileAccept = () => {
    switch (mode) {
      case 'file':  return '.pdf,.ppt,.pptx';
      case 'video': return '.mp4,.avi,.mov,.webm';
      case 'audio': return '.mp3,.wav,.m4a';
      default:      return '';
    }
  };

  const getFileSize = () => {
    if (!file) return '';
    const mb = (file.size / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  // ── AI processing (also called from "Retry" button) ─────────────────────────
  const runProcessing = async (contentId) => {
    setProcessing(true);
    setProcessError('');
    setCurrentStep('processing');

    try {
      const { data } = await api.post(`/content/${contentId}/process`);
      const count = data.topics?.length ?? 0;
      setTopicCount(count);
      setProcessing(false);
      setCurrentStep('complete');

      setTimeout(() => {
        navigate(`/faculty/content/${contentId}/topics`);
      }, 2000);
    } catch (err) {
      setProcessing(false);
      const msg = err.response?.data?.message || 'AI processing failed. Please try again.';
      setProcessError(msg);
      setCurrentStep('upload'); // go back so user can retry or navigate away
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setProcessError('');
    setLoading(true);
    setUploadProgress(0);
    setCurrentStep('upload');

    try {
      const formData = new FormData();
      formData.append('title', title);

      if (mode === 'text') {
        if (!textContent.trim()) {
          setError('Please enter some content.');
          setLoading(false);
          return;
        }
        formData.append('textContent', textContent);
      } else if (file) {
        formData.append('file', file);
      } else {
        setError('Please select a file.');
        setLoading(false);
        return;
      }

      const { data: uploaded } = await api.post('/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      setLoading(false);
      setUploadedId(uploaded._id);

      // Media files can't be AI-processed (no transcription yet)
      if (isMediaMode) {
        setCurrentStep('complete');
        setTopicCount(0);
        setTimeout(() => navigate('/faculty/content'), 2500);
        return;
      }

      await runProcessing(uploaded._id);
    } catch (err) {
      setLoading(false);
      setProcessing(false);
      setUploadProgress(0);
      setCurrentStep('upload');
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    }
  };

  const modes = [
    { value: 'text',  label: 'Text Input', icon: HiDocumentText, color: '#3b82f6', desc: 'Paste or type content' },
    { value: 'file',  label: 'Document',   icon: HiUpload,       color: '#8b5cf6', desc: 'PDF or PowerPoint' },
    { value: 'video', label: 'Video',      icon: HiVideoCamera,  color: '#ef4444', desc: 'MP4, AVI, MOV' },
    { value: 'audio', label: 'Audio',      icon: HiMusicNote,    color: '#f59e0b', desc: 'MP3, WAV, M4A' },
  ];

  // ── Overlay: processing / complete / media complete ──────────────────────────
  if (processing || currentStep === 'complete') {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(26,29,46,0.95)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: 'white', padding: '3rem', borderRadius: 16,
          textAlign: 'center', maxWidth: 480, width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}>
          {processing ? (
            <>
              <div style={{ width: 80, height: 80, margin: '0 auto 1.5rem', position: 'relative' }}>
                <div className="spinner" style={{ width: 80, height: 80, borderWidth: 4, borderTopColor: 'var(--green)' }} />
                <HiLightningBolt style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  fontSize: '2rem', color: 'var(--green)',
                }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                AI is Extracting Topics
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Analysing your content and building topic summaries…
              </p>
              <div style={{
                background: 'var(--bg)', padding: '0.875rem 1rem',
                borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-sub)',
              }}>
                Usually takes 10–30 seconds · Please don't close this tab
              </div>
            </>
          ) : (
            /* complete */
            <>
              <HiCheckCircle style={{ fontSize: '4.5rem', color: 'var(--green)', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {isMediaMode ? 'File Uploaded!' : 'Processing Complete!'}
              </h2>
              {!isMediaMode && topicCount > 0 && (
                <div style={{
                  display: 'inline-block',
                  background: 'var(--green-glow)', border: '1px solid rgba(74,222,128,0.4)',
                  borderRadius: 20, padding: '0.35rem 1rem',
                  fontSize: '0.95rem', fontWeight: 600, color: 'var(--green-dark)',
                  marginBottom: '0.75rem',
                }}>
                  {topicCount} topic{topicCount !== 1 ? 's' : ''} extracted
                </div>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isMediaMode
                  ? 'Redirecting to content list…'
                  : 'Redirecting to topic editor…'}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload Study Material</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Upload content and AI will automatically extract topics
          </p>
        </div>
        <div style={{
          background: 'var(--green-glow)', padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(74,222,128,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <HiLightningBolt style={{ color: 'var(--green-dark)', fontSize: '1.2rem' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--green-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AI Powered
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--green-dark)' }}>
              Auto-extraction
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <StepBar current={currentStep} />

        {/* Upload error */}
        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
            <HiExclamationCircle style={{ flexShrink: 0, fontSize: '1.2rem', marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Processing error with retry */}
        {processError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem',
          }}>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <HiExclamationCircle style={{ color: '#ef4444', flexShrink: 0, fontSize: '1.2rem', marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, color: '#b91c1c', marginBottom: '0.2rem', fontSize: '0.9rem' }}>
                  AI Processing Failed
                </div>
                <div style={{ color: '#7f1d1d', fontSize: '0.85rem' }}>{processError}</div>
              </div>
            </div>
            {uploadedId && (
              <button
                type="button"
                onClick={() => runProcessing(uploadedId)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 0.9rem', borderRadius: 6,
                  background: '#ef4444', color: 'white', border: 'none',
                  fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                }}
              >
                <HiRefresh /> Retry AI
              </button>
            )}
          </div>
        )}

        {/* Mode tabs */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block', fontSize: '0.8rem', fontWeight: 600,
            color: 'var(--text-sub)', marginBottom: '1rem',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            Content Type
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {modes.map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setMode(m.value); setFile(null); setError(''); setProcessError(''); }}
                  style={{
                    padding: '1.25rem 1rem',
                    border: `2px solid ${isActive ? m.color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? `${m.color}15` : 'white',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.5rem', textAlign: 'center',
                  }}
                >
                  <Icon style={{ fontSize: '2rem', color: isActive ? m.color : 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isActive ? m.color : 'var(--text)' }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {m.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Media warning banner */}
        {isMediaMode && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d',
            borderRadius: 8, padding: '0.875rem 1.1rem',
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
            marginBottom: '1.5rem',
          }}>
            <HiInformationCircle style={{ color: '#d97706', flexShrink: 0, fontSize: '1.2rem', marginTop: 1 }} />
            <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Transcription not yet supported.</strong> The file will be stored but AI topic extraction
              won't run automatically. To generate topics, paste a transcript or speaker notes as a separate
              Text Input upload.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-control no-icon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Introduction to Machine Learning"
            />
          </div>

          {/* Text area */}
          {mode === 'text' && (
            <div className="form-group">
              <label className="form-label">Study Material Content</label>
              <textarea
                className="form-control no-icon"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required
                placeholder="Paste or type your study material here…"
                style={{ minHeight: 250, fontFamily: 'inherit' }}
              />
              <div style={{
                fontSize: '0.75rem', marginTop: '0.3rem',
                color: textContent.length < 200 ? '#d97706' : 'var(--text-muted)',
              }}>
                {textContent.length} characters
                {textContent.length < 200 && textContent.length > 0 && ' · Add more text for better topic extraction'}
                {textContent.length === 0 && ' · Recommended: 500+ characters for best results'}
              </div>
            </div>
          )}

          {/* File picker */}
          {mode !== 'text' && (
            <div className="form-group">
              <label className="form-label">
                Upload {mode === 'file' ? 'Document' : mode === 'video' ? 'Video' : 'Audio'} File
              </label>

              {!file ? (
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '3rem 2rem',
                  border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg)', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <input
                    type="file"
                    accept={getFileAccept()}
                    onChange={handleFileChange}
                    required
                    style={{ display: 'none' }}
                  />
                  <HiUpload style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                    Click to upload or drag and drop
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {mode === 'file'  && 'PDF or PowerPoint — text will be extracted automatically (max 100 MB)'}
                    {mode === 'video' && 'MP4, AVI, MOV, WEBM (max 100 MB)'}
                    {mode === 'audio' && 'MP3, WAV, M4A (max 100 MB)'}
                  </div>
                </label>
              ) : (
                <div style={{
                  padding: '1.5rem',
                  border: '2px solid var(--green)', borderRadius: 'var(--radius-sm)',
                  background: 'var(--green-glow)',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-sm)',
                    background: 'var(--green)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', flexShrink: 0,
                  }}>
                    {mode === 'video' ? <HiVideoCamera /> : mode === 'audio' ? <HiMusicNote /> : <HiDocumentText />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600, color: 'var(--text)', marginBottom: '0.15rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {file.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {getFileSize()} · {file.type || 'Unknown type'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: 'none', background: 'rgba(239,68,68,0.1)',
                      color: 'var(--danger)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >
                    <HiX />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Info box — only for text / document mode */}
          {!isMediaMode && (
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.5rem',
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <HiLightningBolt style={{ color: '#3b82f6', fontSize: '1.25rem', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.85rem', color: '#1e40af', lineHeight: 1.6 }}>
                  <strong>How it works:</strong> After upload the AI reads your content, extracts 5–10
                  micro-topics with summaries, and tags each with a difficulty level. You can review and
                  edit every topic before building modules.
                </div>
              </div>
            </div>
          )}

          {/* Upload progress bar */}
          {loading && uploadProgress > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Uploading…</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--green)' }}>
                  {uploadProgress}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill green" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || processing}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', justifyContent: 'center' }}
          >
            {loading ? (
              <><span className="btn-spinner" /> Uploading…</>
            ) : (
              <><HiLightningBolt /> {isMediaMode ? 'Upload File' : 'Upload & Process with AI'}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContentUpload;
