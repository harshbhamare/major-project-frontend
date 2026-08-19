import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiChartBar, HiUsers, HiUpload, HiFolder, HiBookOpen,
  HiTrendingUp, HiHome, HiAcademicCap, HiLogout, HiCollection,
} from 'react-icons/hi';

const navConfig = {
  admin: [
    { to: '/admin',       icon: HiChartBar,    label: 'Dashboard', end: true },
    { to: '/admin/users', icon: HiUsers,        label: 'Users' },
  ],
  faculty: [
    { to: '/faculty',         icon: HiChartBar,    label: 'Dashboard',     end: true },
    { to: '/faculty/upload',  icon: HiUpload,      label: 'Upload Content' },
    { to: '/faculty/content', icon: HiFolder,      label: 'My Content' },
    { to: '/faculty/modules', icon: HiBookOpen,    label: 'Modules' },
    { to: '/faculty/rooms',   icon: HiCollection,  label: 'Rooms' },
    { to: '/faculty/results', icon: HiTrendingUp,  label: 'Results' },
  ],
  student: [
    { to: '/student',         icon: HiHome,        label: 'Dashboard', end: true },
    { to: '/student/modules', icon: HiBookOpen,    label: 'Modules' },
    { to: '/student/results', icon: HiChartBar,    label: 'My Results' },
  ],
};

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = navConfig[user?.role] || [];
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><HiAcademicCap /></div>
          <div className="sidebar-logo-text">
            AI Learning
            <span>Platform</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
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
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <HiLogout style={{ marginRight: '0.25rem' }} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
