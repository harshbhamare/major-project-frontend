import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GamificationBar from './GamificationBar';
import {
  HiChartBar, HiUsers, HiUpload, HiFolder, HiBookOpen,
  HiTrendingUp, HiHome, HiAcademicCap, HiLogout, HiCollection,
  HiLightningBolt, HiShieldCheck,
} from 'react-icons/hi';
import { MdOutlineSchool } from 'react-icons/md';

const navConfig = {
  admin: [
    { to: '/admin',       icon: HiChartBar,    label: 'Dashboard', end: true },
    { to: '/admin/users', icon: HiUsers,        label: 'User Management' },
  ],
  faculty: [
    { to: '/faculty',         icon: HiChartBar,    label: 'Dashboard',     end: true },
    { to: '/faculty/upload',  icon: HiUpload,      label: 'Upload Content' },
    { to: '/faculty/content', icon: HiFolder,      label: 'Content Repository' },
    { to: '/faculty/modules', icon: HiBookOpen,    label: 'Modules' },
    { to: '/faculty/rooms',   icon: HiCollection,  label: 'Classrooms' },
    { to: '/faculty/results', icon: HiTrendingUp,  label: 'Student Analytics' },
  ],
  student: [
    { to: '/student',          icon: HiHome,          label: 'Overview',          end: true },
    { to: '/student/modules',  icon: HiBookOpen,       label: 'My Modules' },
    { to: '/student/adaptive', icon: HiLightningBolt,  label: 'Adaptive Practice' },
    { to: '/student/results',  icon: HiChartBar,       label: 'Assessment Results' },
  ],
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = navConfig[user?.role] || [];
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const roleLabel =
    user?.role === 'admin' ? 'Administrator' :
    user?.role === 'faculty' ? 'Faculty Instructor' : 'Student Learner';

  const roleBadgeCls =
    user?.role === 'admin' ? 'badge-purple' :
    user?.role === 'faculty' ? 'badge-info' : 'badge-success';

  return (
    <div className="layout">
      {/* Material Navigation Drawer */}
      <aside className="sidebar">
        {/* Brand Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <MdOutlineSchool />
          </div>
          <div className="sidebar-logo-text">
            Adaptive Learning
            <span>Enterprise Education</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Navigation</div>
          {links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon className="nav-icon" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Account Card */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={user?.name}>{user?.name}</div>
              <div className="sidebar-user-role">{roleLabel}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout} title="Sign out of your account">
            <HiLogout style={{ marginRight: '0.35rem', fontSize: '0.95rem' }} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top App Bar */}
        <header style={{
          height: 'var(--topbar-h)',
          background: '#ffffff',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-sub)' }}>
              Portal Workspace
            </span>
            <span style={{ color: 'var(--border)' }}>/</span>
            <span className={`badge ${roleBadgeCls}`} style={{ textTransform: 'capitalize' }}>
              {user?.role}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Logged in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
            </div>
          </div>
        </header>

        {/* Optional Student Progress Strip */}
        {user?.role === 'student' && <GamificationBar />}

        {/* Main Content Area */}
        <main className="main-content" style={{ marginLeft: 0, flex: 1, padding: '2rem 2.25rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
