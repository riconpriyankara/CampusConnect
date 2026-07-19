import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { ShieldCheck, Users, FileText, ShoppingBag, ChatCircle, CalendarBlank, Warning, Eye, Check, Trash } from '@phosphor-icons/react';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, reportsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/reports'),
        api.get('/api/admin/users'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (reportsRes.data.success) setReports(reportsRes.data.reports);
      if (usersRes.data.success) setUsers(usersRes.data.users);
    } catch (error) {
      showToast('Could not load administrative details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleResolveReport = async (reportId) => {
    try {
      const res = await api.put(`/api/admin/reports/${reportId}/resolve`);
      if (res.data.success) {
        showToast('Report marked resolved & dismissed.', 'success');
        setReports((prev) => prev.filter((rep) => rep._id !== reportId));
        // decrement reports counter locally
        if (stats) setStats((prev) => ({ ...prev, reports: Math.max(prev.reports - 1, 0) }));
      }
    } catch (error) {
      showToast('Failed to resolve report.', 'error');
    }
  };

  const handleDeleteContent = async (reportId, itemType) => {
    if (!window.confirm(`Delete this reported ${itemType} permanently?`)) return;

    try {
      const res = await api.delete(`/api/admin/reports/${reportId}/content`);
      if (res.data.success) {
        showToast(`Reported ${itemType} removed.`, 'success');
        setReports((prev) => prev.filter((rep) => rep._id !== reportId));
        // reload stats to update counts
        const statsRes = await api.get('/api/admin/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);
      }
    } catch (error) {
      showToast('Failed to purge content.', 'error');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently ban and delete user "${name}" along with all their uploads?`)) return;

    try {
      const res = await api.delete(`/api/admin/users/${userId}`);
      if (res.data.success) {
        showToast(`User ${name} successfully deleted.`, 'success');
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        // reload stats to update counts
        const statsRes = await api.get('/api/admin/stats');
        if (statsRes.data.success) setStats(statsRes.data.stats);
      }
    } catch (error) {
      showToast('Failed to ban user.', 'error');
    }
  };

  const viewReportedItem = (rep) => {
    if (rep.itemType === 'Note') {
      navigate(`/notes?id=${rep.itemId?._id || rep.itemId}`);
    } else if (rep.itemType === 'Book') {
      navigate('/books');
    } else if (rep.itemType === 'Doubt' || rep.itemType === 'Answer') {
      const doubtId = rep.itemId?.doubt || rep.itemId?._id || rep.itemId;
      navigate(`/doubts?id=${doubtId}`);
    } else if (rep.itemType === 'Event') {
      navigate('/events');
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="skeleton-title"></div>
        <div className="stats-summary-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '80px' }}></div>
          ))}
        </div>
        <div className="skeleton" style={{ height: '300px', marginTop: '2rem' }}></div>
      </div>
    );
  }

  return (
    <div className="admin-container animate-fade">
      {/* Upper header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldCheck size={28} weight="regular" style={{ color: 'var(--color-primary)' }} />
        <div>
          <h2>Admin Moderation Dashboard</h2>
          <p className="subtitle">System overview, content reports, and user access moderation.</p>
        </div>
      </div>

      {/* Overview Stats Widgets */}
      <section className="stat-widgets-grid">
        <div className="card stat-widget">
          <div>
            <span className="stat-widget-label">Students</span>
            <span className="stat-widget-number">{stats?.users}</span>
          </div>
          <Users size={24} weight="regular" style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
        </div>
        <div className="card stat-widget">
          <div>
            <span className="stat-widget-label">Notes</span>
            <span className="stat-widget-number">{stats?.notes}</span>
          </div>
          <FileText size={24} weight="regular" style={{ color: 'var(--color-secondary)', opacity: 0.7 }} />
        </div>
        <div className="card stat-widget">
          <div>
            <span className="stat-widget-label">Books</span>
            <span className="stat-widget-number">{stats?.books}</span>
          </div>
          <ShoppingBag size={24} weight="regular" style={{ color: 'var(--color-success)', opacity: 0.7 }} />
        </div>
        <div className="card stat-widget">
          <div>
            <span className="stat-widget-label">Questions</span>
            <span className="stat-widget-number">{stats?.doubts}</span>
          </div>
          <ChatCircle size={24} weight="regular" style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
        </div>
        <div className="card stat-widget">
          <div>
            <span className="stat-widget-label">Pending Reports</span>
            <span className="stat-widget-number">{stats?.reports}</span>
          </div>
          <Warning size={24} weight="regular" style={{ color: 'var(--color-danger)', opacity: 0.7 }} />
        </div>
      </section>

      {/* Admin details grid splits */}
      <div className="admin-main-section">
        {/* Reports Panel */}
        <section className="admin-list-panel">
          <h3>Flags and Reports Inbox ({reports.length})</h3>
          <div className="admin-table-wrapper">
            {reports.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No active complaints. Platform is clean!
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Flagged Content</th>
                    <th>Filer</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep) => (
                    <tr key={rep._id}>
                      <td>
                        <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', marginBottom: '0.25rem', display: 'inline-block' }}>
                          {rep.itemType}
                        </span>
                        <div style={{ fontWeight: 600 }}>
                          {rep.itemId?.title || rep.itemId?.content?.substring(0, 30) || 'Deleted item'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{rep.reportedBy?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rep.reportedBy?.email}</div>
                      </td>
                      <td className="reported-reason-text">"{rep.reason}"</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <button
                            className="admin-stamp-btn btn-secondary"
                            title="Inspect Item"
                            onClick={() => viewReportedItem(rep)}
                          >
                            <Eye size={12} weight="regular" /> View
                          </button>
                          <button
                            className="admin-stamp-btn admin-stamp-btn-resolve"
                            title="Dismiss Complaint"
                            onClick={() => handleResolveReport(rep._id)}
                          >
                            <Check size={12} weight="regular" /> Resolve
                          </button>
                          <button
                            className="admin-stamp-btn admin-stamp-btn-danger"
                            title="Purge content"
                            onClick={() => handleDeleteContent(rep._id, rep.itemType)}
                          >
                            <Trash size={12} weight="regular" /> Void
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Users Moderation Panel */}
        <section className="admin-list-panel">
          <h3>Registered Student Directory ({users.length})</h3>
          <div className="admin-table-wrapper">
            {users.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No students registered.
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student Info</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <img
                          src={u.profilePic ? u.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name || 'CC')}`}
                          alt={u.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                            {u.department} • Year {u.year}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="admin-stamp-btn admin-stamp-btn-danger"
                          title="Purge user and files"
                          onClick={() => handleDeleteUser(u._id, u.name)}
                        >
                          <Trash size={12} weight="regular" />
                          <span>Ban Student</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
