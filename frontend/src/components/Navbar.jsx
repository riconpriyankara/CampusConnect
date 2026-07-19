import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { MagnifyingGlass, Bell, SignOut, User, List, ShieldWarning, SquaresFour } from '@phosphor-icons/react';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotifications();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef(null);
  const notifyRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotificationsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll for notifications every 60 seconds
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleNotificationClick = (item) => {
    setShowNotificationsMenu(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleNotificationsTrigger = () => {
    setShowNotificationsMenu(!showNotificationsMenu);
    if (!showNotificationsMenu && unreadCount > 0) {
      markAsRead();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-toggle nav-icon-btn" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
          <List size={20} weight="regular" />
        </button>
        
        <div className="navbar-logo" onClick={() => navigate('/dashboard')}>
          <span>Campus</span>
          <span className="logo-accent">Connect</span>
        </div>
      </div>

      <form className="navbar-search" onSubmit={handleSearchSubmit}>
        <MagnifyingGlass className="navbar-search-icon" size={16} weight="regular" />
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search notes, books, questions, events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="navbar-right">
        {/* Notifications */}
        <div className="nav-profile" ref={notifyRef}>
          <button className="nav-icon-btn" onClick={handleNotificationsTrigger} aria-label="Notifications Inbox">
            <Bell size={20} weight="regular" />
            {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
          </button>

          {showNotificationsMenu && (
            <div className="dropdown-panel">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <span className="dropdown-clear-btn" onClick={markAsRead}>
                    Mark all read
                  </span>
                )}
              </div>
              <div className="dropdown-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    No recent notifications
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      className={`dropdown-item ${!item.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="dropdown-item-content">
                        <p>{item.message}</p>
                        <span className="dropdown-item-time">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="dropdown-footer" onClick={() => { setShowNotificationsMenu(false); navigate('/profile'); }}>
                View activity timeline
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="nav-profile" ref={profileRef}>
          <div className="nav-profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <img
              src={user?.profilePic ? user.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'CC')}`}
              alt={user?.name}
              className="nav-avatar"
            />
            <div className="nav-profile-info">
              <span className="nav-profile-name">{user?.name}</span>
              <span className="nav-profile-dept">{user?.department}</span>
            </div>
          </div>

          {showProfileMenu && (
            <div className="dropdown-panel profile-panel">
              <div className="profile-panel-item" onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}>
                <User size={16} weight="regular" />
                <span>My Profile</span>
              </div>
              
              {isAdmin && (
                <div className="profile-panel-item" onClick={() => { setShowProfileMenu(false); navigate('/admin'); }}>
                  <ShieldWarning size={16} weight="regular" />
                  <span>Admin Panel</span>
                </div>
              )}

              <div className="profile-panel-item" onClick={() => { setShowProfileMenu(false); navigate('/dashboard'); }}>
                <SquaresFour size={16} weight="regular" />
                <span>Dashboard</span>
              </div>

              <div
                className="profile-panel-item"
                style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-danger)' }}
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate('/login');
                }}
              >
                <SignOut size={16} weight="regular" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
