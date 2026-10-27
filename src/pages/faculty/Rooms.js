import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import {
  HiPlus, HiQrcode, HiClipboardCopy, HiTrash, HiUsers,
  HiBookOpen, HiX, HiCheckCircle, HiPencil,
  HiEye, HiLockClosed, HiLockOpen, HiShare, HiCollection,
  HiDownload, HiSearch, HiChevronLeft, HiPrinter, HiSparkles,
  HiAcademicCap, HiExternalLink, HiRefresh,
} from 'react-icons/hi';

const COLORS = ['#4ade80','#60a5fa','#f59e0b','#f87171','#a78bfa','#34d399','#fb923c','#e879f9'];

// ─── Helper: Export Room Roster to Excel / CSV ────────────────────────────────
function exportRoomToExcel(room) {
  if (!room) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  const filename = `${(room.name || 'Classroom').replace(/[^a-zA-Z0-9_-]/g, '_')}_${room.code}_Roster_${now.toISOString().slice(0, 10)}.csv`;

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = str.toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  const moduleNames = (room.modules || []).map(m => m.title).join('; ') || 'None';

  let csvContent = '';
  // Metadata Header Block for Faculty Documentation
  csvContent += `CLASSROOM STUDENT ROSTER & ATTENDANCE REPORT\r\n`;
  csvContent += `Classroom Name,${escapeCsv(room.name)}\r\n`;
  csvContent += `Classroom Code,${escapeCsv(room.code)}\r\n`;
  csvContent += `Instructor,${escapeCsv(room.createdBy?.name || 'Faculty')}\r\n`;
  csvContent += `Assigned Modules,${escapeCsv(moduleNames)}\r\n`;
  csvContent += `Total Enrolled Students,${room.members?.length || 0}\r\n`;
  csvContent += `Export Timestamp,${escapeCsv(`${dateStr} ${timeStr}`)}\r\n`;
  csvContent += `\r\n`;

  // Column Headers
  csvContent += `#,Student Name,Email Address,Role,Level,Total XP,Daily Streak,Account Created Date,Enrolled Status\r\n`;

  // Student Rows
  (room.members || []).forEach((student, index) => {
    const createdDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A';
    csvContent += `${index + 1},`;
    csvContent += `${escapeCsv(student.name || 'Unnamed Student')},`;
    csvContent += `${escapeCsv(student.email || 'N/A')},`;
    csvContent += `${escapeCsv(student.role || 'student')},`;
    csvContent += `${escapeCsv(`Level ${student.level || 1}`)},`;
    csvContent += `${student.xp || 0},`;
    csvContent += `${escapeCsv(`${student.streak || 1} day(s)`)},`;
    csvContent += `${escapeCsv(createdDate)},`;
    csvContent += `${escapeCsv('Enrolled')}\r\n`;
  });

  // Prepend UTF-8 BOM so Microsoft Excel opens special characters and commas cleanly
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

// ─── Helper: Export All Classrooms to Excel / CSV ─────────────────────────────
function exportAllRoomsToExcel(rooms) {
  if (!rooms || rooms.length === 0) return;

  const now = new Date();
  const filename = `All_Classrooms_Master_Roster_${now.toISOString().slice(0, 10)}.csv`;

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = str.toString().replace(/"/g, '""');
    return `"${s}"`;
  };

  let csvContent = '';
  csvContent += `INSTITUTIONAL MASTER CLASSROOM ROSTER\r\n`;
  csvContent += `Total Classrooms,${rooms.length}\r\n`;
  csvContent += `Export Date,${escapeCsv(now.toLocaleString())}\r\n`;
  csvContent += `\r\n`;

  csvContent += `Classroom Name,Room Code,Status,Student Name,Student Email,Student Level,Total XP,Student Account Created\r\n`;

  rooms.forEach(room => {
    const roomName = room.name;
    const roomCode = room.code;
    const status = room.isActive ? 'Active' : 'Inactive';

    if (!room.members || room.members.length === 0) {
      csvContent += `${escapeCsv(roomName)},${escapeCsv(roomCode)},${escapeCsv(status)},"No students enrolled yet","N/A","N/A","0","N/A"\r\n`;
    } else {
      room.members.forEach(student => {
        const createdDate = student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A';
        csvContent += `${escapeCsv(roomName)},`;
        csvContent += `${escapeCsv(roomCode)},`;
        csvContent += `${escapeCsv(status)},`;
        csvContent += `${escapeCsv(student.name || 'Unnamed Student')},`;
        csvContent += `${escapeCsv(student.email || 'N/A')},`;
        csvContent += `${escapeCsv(`Level ${student.level || 1}`)},`;
        csvContent += `${student.xp || 0},`;
        csvContent += `${escapeCsv(createdDate)}\r\n`;
      });
    }
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

// ─── Helper: Copy Tab-Separated Data for Immediate Excel Paste ────────────────
function copyRoomRosterToClipboard(room) {
  if (!room || !room.members) return false;

  let text = `#\tStudent Name\tEmail Address\tRole\tLevel\tTotal XP\tStatus\n`;
  room.members.forEach((s, idx) => {
    text += `${idx + 1}\t${s.name || ''}\t${s.email || ''}\t${s.role || 'student'}\tLevel ${s.level || 1}\t${s.xp || 0}\tEnrolled\n`;
  });

  return navigator.clipboard.writeText(text);
}

// ─── QR Code Projection Modal ────────────────────────────────────────────────
const QRModal = ({ room, onClose }) => {
  const [copied, setCopied] = useState('');
  const joinUrl = `${window.location.origin}/join/${room.code}`;

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
    a.href = url;
    a.download = `room-${room.code}-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ fontSize: '1.25rem' }}>Share Classroom</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: 2 }}>{room.name}</p>
          </div>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>

        {/* QR Code Presentation */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem 0' }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 20,
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border)',
            marginBottom: '1rem',
          }}>
            <QRCodeSVG
              id="room-qr-svg"
              value={joinUrl}
              size={210}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              includeMargin={false}
            />
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>
            Project this screen in class. Students can scan the QR code to join immediately.
          </p>
          <button className="btn btn-sm btn-secondary" onClick={downloadQR} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <HiDownload /> Download QR Code (SVG)
          </button>
        </div>

        {/* Room Code */}
        <div className="share-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Classroom Code
            </div>
            <div className="room-code-display">{room.code}</div>
          </div>
          <button
            className={`btn btn-sm ${copied === 'code' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => copy(room.code, 'code')}
          >
            {copied === 'code' ? <><HiCheckCircle /> Copied!</> : <><HiClipboardCopy /> Copy Code</>}
          </button>
        </div>

        {/* Direct Link */}
        <div className="share-row" style={{ marginTop: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Direct Link
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {joinUrl}
            </div>
          </div>
          <button
            className={`btn btn-sm ${copied === 'link' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => copy(joinUrl, 'link')}
          >
            {copied === 'link' ? <><HiCheckCircle /> Copied!</> : <><HiClipboardCopy /> Copy Link</>}
          </button>
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
    if (!form.name.trim()) { setError('Classroom name is required.'); return; }
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
          <h2 className="modal-title">{editRoom ? 'Edit Classroom' : 'Create New Classroom'}</h2>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <div className="form-group">
          <label className="form-label">Classroom Name *</label>
          <input
            className="form-control no-icon"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., CS301 – Data Structures & Algorithms"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control no-icon"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description shown to enrolled students"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Accent Colour</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, color: c })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: c,
                  border: form.color === c ? '3px solid var(--text)' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'border 0.15s',
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editRoom ? 'Save Changes' : 'Create Classroom'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dedicated On-Screen Classroom Workspace ─────────────────────────────────
const ClassroomWorkspace = ({
  room,
  allModules,
  onBack,
  onRefresh,
  onOpenQR,
  onEdit,
  toast,
}) => {
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'modules'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [savingModule, setSavingModule] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedExcel, setCopiedExcel] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast('Room code copied to clipboard!');
    });
  };

  const handleCopyForExcel = () => {
    copyRoomRosterToClipboard(room);
    setCopiedExcel(true);
    setTimeout(() => setCopiedExcel(false), 2500);
    toast('Roster copied in Excel format! Paste into any spreadsheet (Ctrl+V).');
  };

  const addModule = async () => {
    if (!selectedModule) return;
    setSavingModule(true);
    try {
      await api.post(`/rooms/${room._id}/modules`, { moduleId: selectedModule });
      setSelectedModule('');
      toast('Module assigned to classroom.');
      onRefresh();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to assign module.');
    } finally {
      setSavingModule(false);
    }
  };

  const removeModule = async (moduleId) => {
    if (!window.confirm('Remove this module from the classroom?')) return;
    try {
      await api.delete(`/rooms/${room._id}/modules/${moduleId}`);
      toast('Module removed.');
      onRefresh();
    } catch (err) {
      toast('Could not remove module.');
    }
  };

  const kickMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName || 'this student'} from the classroom?`)) return;
    try {
      await api.delete(`/rooms/${room._id}/members/${memberId}`);
      toast('Student removed from classroom.');
      onRefresh();
    } catch (err) {
      toast('Could not remove member.');
    }
  };

  // Filter students by search term
  const filteredStudents = useMemo(() => {
    const list = room.members || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  }, [room.members, searchQuery]);

  const roomModuleIds = (room.modules || []).map(m => m._id);
  const availableModules = allModules.filter(m => !roomModuleIds.includes(m._id) && m.status === 'published');

  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      {/* Back Button & Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
        >
          <HiChevronLeft /> Back to All Classrooms
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={onOpenQR}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <HiQrcode /> Show QR Code
          </button>
          <button
            className="btn btn-primary"
            onClick={() => exportRoomToExcel(room)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            title="Download formatted CSV/Excel student roster"
          >
            <HiDownload /> Export to Excel (.csv)
          </button>
          <button
            className={`btn ${copiedExcel ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleCopyForExcel}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            title="Copy tab-separated student data for pasting into spreadsheets"
          >
            {copiedExcel ? <><HiCheckCircle /> Copied Roster!</> : <><HiClipboardCopy /> Copy for Excel</>}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => window.print()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
            title="Print classroom roster"
          >
            <HiPrinter /> Print
          </button>
        </div>
      </div>

      {/* Classroom Hero Header Card */}
      <div className="card" style={{
        padding: '1.75rem',
        marginBottom: '1.5rem',
        borderLeft: `6px solid ${room.color || 'var(--primary)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                {room.name}
              </h1>
              {!room.isActive && (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Inactive</span>
              )}
            </div>
            {room.description && (
              <p style={{ color: 'var(--text-sub)', fontSize: '0.92rem', marginBottom: '0.75rem', maxWidth: 720, lineHeight: 1.5 }}>
                {room.description}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Created: {new Date(room.createdAt).toLocaleDateString()}</span>
              <span>Instructor: <strong>{room.createdBy?.name || 'You'}</strong></span>
            </div>
          </div>

          {/* Large Room Code Display with 1-Click Copy */}
          <div style={{
            background: 'var(--bg)',
            border: '1.5px solid var(--border)',
            borderRadius: 12,
            padding: '0.75rem 1.25rem',
            textAlign: 'center',
            minWidth: 160,
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
              Join Code
            </div>
            <div style={{
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '1.65rem',
              fontWeight: 900,
              color: room.color || 'var(--primary)',
              letterSpacing: '0.2em',
              marginBottom: '0.35rem',
            }}>
              {room.code}
            </div>
            <button
              onClick={copyCode}
              style={{
                background: 'transparent',
                border: 'none',
                color: copiedCode ? 'var(--success)' : 'var(--primary)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {copiedCode ? <><HiCheckCircle /> Copied</> : <><HiClipboardCopy /> Copy Code</>}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <HiUsers />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
              {room.members?.length || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Enrolled Students</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <HiBookOpen />
          </div>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
              {room.modules?.length || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Modules</div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fffbeb', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
            <HiSparkles />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
              Self-Paced
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Learning Mode</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', marginBottom: '1.25rem', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'students' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'students' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <HiUsers /> Enrolled Students ({room.members?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('modules')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'modules' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'modules' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'modules' ? 700 : 500,
            fontSize: '0.94rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
          }}
        >
          <HiBookOpen /> Course Modules ({room.modules?.length || 0})
        </button>
      </div>

      {/* ── TAB 1: ENROLLED STUDENTS FULL ROSTER ON SCREEN ───────────────────── */}
      {activeTab === 'students' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Table Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 360 }}>
              <HiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search students by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.88rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Showing {filteredStudents.length} of {room.members?.length || 0} enrolled
              </span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => exportRoomToExcel(room)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}
              >
                <HiDownload /> Export Excel
              </button>
            </div>
          </div>

          {/* Students Roster Table */}
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--border)' }}>
              <HiUsers style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.25rem' }}>
                {searchQuery ? 'No matching students found' : 'No students have joined yet'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 440, margin: '0 auto 1.25rem' }}>
                {searchQuery
                  ? 'Try checking for typos or searching by email address.'
                  : `Share the classroom code "${room.code}" or QR code with your students to automatically enroll them.`}
              </p>
              {!searchQuery && (
                <button className="btn btn-primary" onClick={onOpenQR} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <HiQrcode /> Show QR Code
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40, textAlign: 'center' }}>#</th>
                    <th>Student Name & Email</th>
                    <th>Level & XP</th>
                    <th>Streak</th>
                    <th>Account Created</th>
                    <th>Status</th>
                    <th style={{ width: 80, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, idx) => {
                    const initials = (student.name || 'S')
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={student._id || idx}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: 'var(--primary-container)',
                              color: 'var(--primary)',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                                {student.name || 'Unnamed Student'}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text)' }}>
                            Level {student.level || 1}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {student.xp || 0} total XP
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                            {student.streak || 1} day(s)
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td>
                          <span className="badge badge-success" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <HiCheckCircle /> Enrolled
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => kickMember(student._id, student.name)}
                            title="Remove student from classroom"
                            style={{ padding: '0.3rem 0.6rem' }}
                          >
                            <HiTrash />
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

      {/* ── TAB 2: COURSE MODULES ON SCREEN ──────────────────────────────────── */}
      {activeTab === 'modules' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Add Module Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
              Assign Module to Classroom
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Students in this classroom will immediately see these modules on their dashboard and adaptive practice hub.
            </p>

            <div className="form-group">
              <label className="form-label">Select Published Module</label>
              <select
                className="form-control no-icon"
                value={selectedModule}
                onChange={e => setSelectedModule(e.target.value)}
                style={{ fontSize: '0.88rem' }}
              >
                <option value="">Choose a module to assign…</option>
                {availableModules.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.difficulty || 'normal'})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={addModule}
              disabled={!selectedModule || savingModule}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
            >
              {savingModule ? 'Assigning…' : <><HiPlus /> Assign to Classroom</>}
            </button>
          </div>

          {/* Assigned Modules List Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HiBookOpen style={{ color: 'var(--primary)' }} />
              Assigned Modules ({room.modules?.length || 0})
            </h3>

            {(!room.modules || room.modules.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--bg)', borderRadius: 10, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No modules assigned yet. Choose a module on the left to assign it.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {room.modules.map(mod => (
                  <div
                    key={mod._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
                        {mod.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                          {mod.difficulty || 'normal'}
                        </span>
                        <span>{mod.topics?.length || 0} topics</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Link
                        to={`/faculty/modules/${mod._id}/edit`}
                        className="btn btn-sm btn-secondary"
                        title="View / Edit Module"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <HiExternalLink />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeModule(mod._id)}
                        title="Remove module from this classroom"
                        style={{ padding: '0.35rem 0.65rem' }}
                      >
                        <HiTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Classrooms Page ─────────────────────────────────────────────────────
const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active workspace: null shows all classrooms; when populated, shows dedicated on-screen view
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const [qrRoom, setQrRoom] = useState(null);
  const [formRoom, setFormRoom] = useState(null); // null=closed, false=new, obj=edit
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const toast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const fetchData = async () => {
    try {
      const [roomsRes, modulesRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/modules'),
      ]);
      setRooms(roomsRes.data || []);
      setAllModules(modulesRes.data || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (roomId) => {
    try {
      await api.delete(`/rooms/${roomId}`);
      toast('Classroom deleted.');
      setConfirmDelete(null);
      if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
      }
      fetchData();
    } catch (err) {
      toast('Failed to delete classroom.');
    }
  };

  const handleToggleActive = async (room) => {
    try {
      await api.put(`/rooms/${room._id}`, { isActive: !room.isActive });
      toast(`Classroom ${room.isActive ? 'deactivated' : 'activated'}.`);
      fetchData();
    } catch (err) {
      toast('Could not update status.');
    }
  };

  // Currently active room object if in dedicated workspace view
  const activeRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    return rooms.find(r => r._id === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> Loading classrooms…
      </div>
    );
  }

  // ── IF A SPECIFIC CLASSROOM IS SELECTED: RENDER DEDICATED WORKSPACE ─────────
  if (activeRoom) {
    return (
      <div>
        {/* Toast */}
        {toastMsg && (
          <div style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'var(--navy)',
            color: '#fff',
            padding: '0.85rem 1.35rem',
            borderRadius: 10,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <HiCheckCircle style={{ color: 'var(--success)' }} /> {toastMsg}
          </div>
        )}

        <ClassroomWorkspace
          room={activeRoom}
          allModules={allModules}
          onBack={() => setSelectedRoomId(null)}
          onRefresh={fetchData}
          onOpenQR={() => setQrRoom(activeRoom)}
          onEdit={() => setFormRoom(activeRoom)}
          toast={toast}
        />

        {/* Share QR Modal */}
        {qrRoom && <QRModal room={qrRoom} onClose={() => setQrRoom(null)} />}

        {/* Edit Modal */}
        {formRoom !== null && (
          <RoomFormModal
            editRoom={formRoom || null}
            onClose={() => setFormRoom(null)}
            onSaved={() => {
              setFormRoom(null);
              fetchData();
              toast(formRoom ? 'Classroom updated.' : 'Classroom created!');
            }}
          />
        )}
      </div>
    );
  }

  // ── DEFAULT VIEW: ALL CLASSROOMS OVERVIEW ───────────────────────────────────
  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          background: 'var(--navy)',
          color: '#fff',
          padding: '0.85rem 1.35rem',
          borderRadius: 10,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-xl)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <HiCheckCircle style={{ color: 'var(--success)' }} /> {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Classrooms & Rosters</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Manage student enrollments, course modules, and export documentation reports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          {rooms.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => exportAllRoomsToExcel(rooms)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Export all classrooms and students into an Excel master file"
            >
              <HiDownload /> Export All (Excel)
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setFormRoom(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <HiPlus /> New Classroom
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <HiCollection className="empty-state-icon" />
          <h3>No classrooms created yet</h3>
          <p>Create your first classroom room and share the 6-character code with your students.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setFormRoom(false)}>
            <HiPlus /> Create First Classroom
          </button>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map(room => (
            <div key={room._id} className="room-card" style={{ '--room-color': room.color }}>
              {/* Color Bar */}
              <div className="room-card-bar" style={{ background: room.color }} />

              <div className="room-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <div>
                    <h3 className="room-card-title">{room.name}</h3>
                    {room.description && <p className="room-card-desc">{room.description}</p>}
                  </div>
                  {!room.isActive && (
                    <span className="badge badge-warning" style={{ flexShrink: 0, marginLeft: 8 }}>Inactive</span>
                  )}
                </div>

                {/* Code Pill */}
                <div className="room-code-pill" style={{ borderColor: (room.color || '#4ade80') + '66', color: room.color || '#4ade80' }}>
                  {room.code}
                </div>

                {/* Stats */}
                <div className="room-stats">
                  <span><HiUsers style={{ verticalAlign: 'middle' }} /> {room.members?.length || 0} students</span>
                  <span><HiBookOpen style={{ verticalAlign: 'middle' }} /> {room.modules?.length || 0} modules</span>
                </div>

                {/* Actions */}
                <div className="room-actions">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => setSelectedRoomId(room._id)}
                    title="Open on-screen classroom workspace"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <HiEye /> View Roster & Modules
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => exportRoomToExcel(room)}
                    title="Export student list to Excel (.csv)"
                  >
                    <HiDownload />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setQrRoom(room)}
                    title="Share / Project QR"
                  >
                    <HiShare />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setFormRoom(room)}
                    title="Edit Classroom Details"
                  >
                    <HiPencil />
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleToggleActive(room)}
                    title={room.isActive ? 'Deactivate Classroom' : 'Activate Classroom'}
                  >
                    {room.isActive ? <HiLockOpen /> : <HiLockClosed />}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => setConfirmDelete(room)}
                    title="Delete Classroom"
                  >
                    <HiTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share / QR Modal */}
      {qrRoom && <QRModal room={qrRoom} onClose={() => setQrRoom(null)} />}

      {/* Form Modal (Create / Edit) */}
      {formRoom !== null && (
        <RoomFormModal
          editRoom={formRoom || null}
          onClose={() => setFormRoom(null)}
          onSaved={() => {
            setFormRoom(null);
            fetchData();
            toast(formRoom ? 'Classroom updated.' : 'Classroom created!');
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title" style={{ marginBottom: '0.75rem' }}>Delete Classroom?</h2>
            <p style={{ color: 'var(--text-sub)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? Enrolled students will lose access to its course modules.
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
