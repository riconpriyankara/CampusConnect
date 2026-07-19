import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SquaresFour,
  BookOpen,
  ShoppingBag,
  ChatCircle,
  CalendarBlank,
  User,
  ShieldWarning,
  SignOut
} from '@phosphor-icons/react';
import './Sidebar.css';

const Sidebar = ({ isOpen, onCloseMobileSidebar }) => {
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: SquaresFour },
    { path: '/notes', label: 'Notes Sharing', icon: BookOpen },
    { path: '/books', label: 'Marketplace', icon: ShoppingBag },
    { path: '/doubts', label: 'Doubt Forum', icon: ChatCircle },
    { path: '/events', label: 'Campus Events', icon: CalendarBlank },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const handleLogoutClick = () => {
    if (onCloseMobileSidebar) onCloseMobileSidebar();
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (onCloseMobileSidebar) {
      onCloseMobileSidebar();
    }
  };

  return (
    <>
      {/* Overlay for mobile view when sidebar is slid out */}
      {isOpen && <div className="sidebar-overlay" onClick={onCloseMobileSidebar} />}

      <aside className="sidebar">
        <div className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={handleLinkClick}
              >
                <Icon size={20} weight="regular" />
                <span className="sidebar-link-text">{item.label}</span>
              </NavLink>
            );
          })}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={handleLinkClick}
              style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.5rem', paddingTop: '1rem' }}
            >
              <ShieldWarning size={20} weight="regular" />
              <span className="sidebar-link-text">Admin Panel</span>
            </NavLink>
          )}
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={handleLogoutClick} style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}>
            <SignOut size={20} weight="regular" />
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
