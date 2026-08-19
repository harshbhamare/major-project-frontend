import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import {
  HiPlus, HiQrcode, HiClipboardCopy, HiTrash, HiUsers,
  HiBookOpen, HiX, HiCheckCircle, HiExternalLink, HiPencil,
  HiEye, HiLockClosed, HiLockOpen, HiShare, HiCollection,
} from 'react-icons/hi';

const COLORS = ['#4ade80','#60a5fa','#f59e0b','#f87171','#a78bfa','#34d399','#fb923c','#e879f9'];

// ─── QR Modal ────────────────────────────────────────────────────────────────
const QRModal = ({ room, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [copied, setCopied] = useState('');
  const joinUrl = `${window.location.origin}/join/${room.code}`;

  useEffect(() => {
    api.get(`/rooms/${room._id}/qr`).then(({ data }) => setQrData(data));
  }, [room._id]);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const downloadQR = () => {
    const svg = document.getElementById('room-qr-svg');
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `room-${room.code}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Share Room</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 2 }}>{room.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0' }}>
          <div style={{
            background: 'white', borderRadius: 16, padding: 20,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)', marginBottom: '1.25rem',
          }}>
            <QRCodeSVG
              id="room-qr-svg"
              value={joinUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#1a1d2e"
              level="M"
              includeMargin={false}
            />
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Scan to join instantly — no login required to see the join page
          </p>
          <button className="btn btn-sm btn-secondary" onClick={downloadQR}>
            Download QR (SVG)
          </button>
        </div>

        {/* Room code */}
        <div className="share-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Room Code</div>
            <div className="room-code-display">{room.code}</div>
          </div>
          <button
            className={`btn btn-sm ${copied === 'code' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => copy(room.code, 'code')}
          >
            {copied === 'code' ? <><HiCheckCircle /> Copied!</> : <><HiClipboardCopy /> Copy Code</>}
          </button>
        </div>

        {/* Join link */}
        <div className="share-row" style={{ marginTop: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Join Link</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{joinUrl}</div>
          </div>
          <button
            className={`btn btn-sm ${copied === 'link' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => copy(joinUrl, 'link')}
          >
            {copied === 'link' ? <><HiCheckCircle /> Copied!</> : <><HiClipboardCopy /> Copy Link</>}
          </button>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
          <strong>How students join:</strong> Share the code or link. Students go to <em>/join</em>, enter the code, and are instantly enrolled in this room — no division or class setup needed.
        </div>
      </div>
    </div>
  );
};

// ─── Room Detail Modal (members + modules) ────────────────────────────────────
const RoomDetailModal = ({ room, allModules, onClose, onRefresh }) => {
  const [adding, setAdding] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [saving, setSaving] = useState(false);

  const addModule = async () => {
    if (!selectedModule) return;
    setSaving(true);
    await api.post(`/rooms/${room._id}/modules`, { moduleId: selectedModule });
    setSaving(false);
    setSelectedModule('');
    onRefresh();
  };

  const removeModule = async (moduleId) => {
    await api.delete(`/rooms/${room._id}/modules/${moduleId}`);
    onRefresh();
  };

  const kickMember = async (memberId) => {
    if (!window.confirm('Remove this student from the room?')) return;
    await api.delete(`/rooms/${room._id}/members/${memberId}`);
    onRefresh();
  };

  const roomModuleIds = room.modules?.map(m => m._id) || [];
  const availableModules = allModules.filter(m => !roomModuleIds.includes(m._id) && m.status === 'published');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{room.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
              Code: <strong style={{ color: 'var(--text)', letterSpacing: '0.1em' }}>{room.code}</strong>
              &nbsp;·&nbsp;{room.members?.length || 0} members
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
          {/* Modules */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HiBookOpen style={{ color: 'var(--green)' }} /> Modules ({room.modules?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: 220, overflowY: 'auto' }}>
              {room.modules?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No modules assigned yet.</p>}
              {room.modules?.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 8, fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 500 }}>{m.title}</span>
                  <button onClick={() => removeModule(m._id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', display: 'flex' }}><HiTrash /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select
                className="form-control no-icon"
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                style={{ flex: 1, fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
              >
                <option value="">Add a module…</option>
                {availableModules.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
              <button className="btn btn-sm btn-primary" onClick={addModule} disabled={!selectedModule || saving}>
                {saving ? '…' : 'Add'}
              </button>
            </div>
          </div>

          {/* Members */}
          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HiUsers style={{ color: '#60a5fa' }} /> Members ({room.members?.length || 0})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 260, overflowY: 'auto' }}>
              {room.members?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students joined yet. Share the room code!</p>}
              {room.members?.map(m => (
                <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.email}</div>
                  </div>
                  <button onClick={() => kickMember(m._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', display: 'flex' }} title="Remove member"><HiX /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Create / Edit Room Modal ─────────────────────────────────────────────────
const RoomFormModal = ({ editRoom, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: editRoom?.name || '',
    description: editRoom?.description || '',
    color: editRoom?.color || COLORS[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Room name is required.'); return; }
    setSaving(true);
    try {
      if (editRoom) {
        await api.put(`/rooms/${editRoom._id}`, form);
      } else {
        await api.post('/rooms', form);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{editRoom ? 'Edit Room' : 'Create New Room'}</h2>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Room Name *</label>
          <input className="form-control no-icon" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., CS301 – Data Structures" autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-control no-icon" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description shown to students" rows={3} />
        </div>
        <div className="form-group">
          <label className="form-label">Room Colour</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editRoom ? 'Save Changes' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Rooms Page ──────────────────────────────────────────────────────────
const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrRoom, setQrRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [formRoom, setFormRoom] = useState(null); // null=closed, false=new, obj=edit
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2500); };

  const fetchData = async () => {
    const [roomsRes, modulesRes] = await Promise.all([
      api.get('/rooms'),
      api.get('/modules'),
    ]);
    setRooms(roomsRes.data);
    setAllModules(modulesRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData().catch(() => setLoading(false)); }, []);

  const handleDelete = async (roomId) => {
    await api.delete(`/rooms/${roomId}`);
    toast('Room deleted.');
    setConfirmDelete(null);
    fetchData();
  };

  const handleToggleActive = async (room) => {
    await api.put(`/rooms/${room._id}`, { isActive: !room.isActive });
    toast(`Room ${room.isActive ? 'deactivated' : 'activated'}.`);
    fetchData();
  };

  const refreshDetail = async () => {
    if (!detailRoom) return;
    const { data } = await api.get(`/rooms/${detailRoom._id}`);
    setDetailRoom(data);
    fetchData();
  };

  if (loading) return <div className="loading"><div className="spinner" />Loading rooms…</div>;

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: 'var(--navy)', color: '#fff', padding: '0.75rem 1.25rem', borderRadius: 10, zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', animation: 'fadeIn 0.2s ease' }}>
          <HiCheckCircle style={{ color: 'var(--green)' }} /> {toastMsg}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Classrooms</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Create rooms, share a code or QR — students join instantly</p>
        </div>
        <button className="btn btn-primary" onClick={() => setFormRoom(false)}>
          <HiPlus /> New Room
        </button>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <HiCollection className="empty-state-icon" />
          <h3>No rooms yet</h3>
          <p>Create your first classroom room and share the code with students.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setFormRoom(false)}>
            <HiPlus /> Create First Room
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room._id} className="room-card" style={{ '--room-color': room.color }}>
              {/* Colour header bar */}
              <div className="room-card-bar" style={{ background: room.color }} />

              <div className="room-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 className="room-card-title">{room.name}</h3>
                    {room.description && <p className="room-card-desc">{room.description}</p>}
                  </div>
                  {!room.isActive && <span className="badge badge-warning" style={{ flexShrink: 0, marginLeft: 8 }}>Inactive</span>}
                </div>

                {/* Code pill */}
                <div className="room-code-pill" style={{ borderColor: room.color + '66', color: room.color }}>
                  {room.code}
                </div>

                {/* Stats */}
                <div className="room-stats">
                  <span><HiUsers style={{ verticalAlign: 'middle' }} /> {room.members?.length || 0} students</span>
                  <span><HiBookOpen style={{ verticalAlign: 'middle' }} /> {room.modules?.length || 0} modules</span>
                </div>

                {/* Actions */}
                <div className="room-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => setQrRoom(room)} title="Share / QR">
                    <HiShare /> Share
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setDetailRoom(room)} title="Manage">
                    <HiEye /> Manage
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setFormRoom(room)} title="Edit">
                    <HiPencil />
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleToggleActive(room)} title={room.isActive ? 'Deactivate' : 'Activate'}>
                    {room.isActive ? <HiLockOpen /> : <HiLockClosed />}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(room)} title="Delete">
                    <HiTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {qrRoom && <QRModal room={qrRoom} onClose={() => setQrRoom(null)} />}
      {detailRoom && <RoomDetailModal room={detailRoom} allModules={allModules} onClose={() => setDetailRoom(null)} onRefresh={refreshDetail} />}
      {formRoom !== null && (
        <RoomFormModal
          editRoom={formRoom || null}
          onClose={() => setFormRoom(null)}
          onSaved={() => { setFormRoom(null); fetchData(); toast(formRoom ? 'Room updated.' : 'Room created!'); }}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom: '0.75rem' }}>Delete Room?</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem' }}>
              <strong>{confirmDelete.name}</strong> will be permanently deleted. Students will lose access to its modules.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
