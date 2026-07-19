import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { PencilSimple, BookmarkSimple, FileText, ShoppingBag, ChatCircle, CalendarBlank, ClockCounterClockwise, FloppyDisk, X, Plus, WarningCircle } from '@phosphor-icons/react';
import './Profile.css';

const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Information Technology',
  'Business Administration',
  'Bio-Technology',
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser, updateProfile } = useAuth();
  const { showToast } = useNotifications();

  // Tab state
  const [activeTab, setActiveTab] = useState('timeline');

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editYear, setEditYear] = useState('1');
  const [editBio, setEditBio] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // User created items
  const [myNotes, setMyNotes] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [myDoubts, setMyDoubts] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Load user data including bookmarks on mount
  const loadProfile = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      if (res.data.success) {
        setUser(res.data.user);
        
        // Initialize edit states
        setEditName(res.data.user.name || '');
        setEditDept(res.data.user.department || '');
        setEditYear(res.data.user.year?.toString() || '1');
        setEditBio(res.data.user.bio || '');
      }
    } catch (error) {
      showToast('Failed to sync profile information.', 'error');
    }
  };

  // Load user created items
  const fetchMyItems = async () => {
    if (!user) return;
    try {
      setLoadingItems(true);
      const [notesRes, booksRes, doubtsRes, eventsRes] = await Promise.all([
        api.get('/api/notes?limit=100'),
        api.get('/api/books?limit=100'),
        api.get('/api/doubts?limit=100'),
        api.get('/api/events?limit=100&upcoming=false'), // Fetch all events
      ]);

      if (notesRes.data.success) {
        setMyNotes(notesRes.data.notes.filter(n => n.uploadedBy?._id === user._id || n.uploadedBy === user._id));
      }
      if (booksRes.data.success) {
        setMyBooks(booksRes.data.books.filter(b => b.soldBy?._id === user._id || b.soldBy === user._id));
      }
      if (doubtsRes.data.success) {
        setMyDoubts(doubtsRes.data.doubts.filter(d => d.author?._id === user._id || d.author === user._id));
      }
      if (eventsRes.data.success) {
        setMyEvents(eventsRes.data.events.filter(e => e.organizer?._id === user._id || e.organizer === user._id));
      }
    } catch (error) {
      console.error('Error loading my uploads:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyItems();
    }
  }, [user?._id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName || !editDept || !editYear) {
      return showToast('Name, Department, and Year are required', 'error');
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('name', editName);
    formData.append('department', editDept);
    formData.append('year', editYear);
    formData.append('bio', editBio);
    if (editFile) {
      formData.append('profilePic', editFile);
    }

    const res = await updateProfile(formData);
    setSaving(false);

    if (res.success) {
      setShowEditModal(false);
      loadProfile();
    }
  };

  const handleNoteDelete = async (noteId) => {
    if (!window.confirm('Delete this note permanently?')) return;
    try {
      const res = await api.delete(`/api/notes/${noteId}`);
      if (res.data.success) {
        showToast('Note deleted.', 'success');
        setMyNotes(prev => prev.filter(n => n._id !== noteId));
      }
    } catch (error) {
      showToast('Failed to delete note', 'error');
    }
  };

  const handleBookDelete = async (bookId) => {
    if (!window.confirm('Delete this textbook listing?')) return;
    try {
      const res = await api.delete(`/api/books/${bookId}`);
      if (res.data.success) {
        showToast('Textbook listing deleted.', 'success');
        setMyBooks(prev => prev.filter(b => b._id !== bookId));
      }
    } catch (error) {
      showToast('Failed to delete book listing', 'error');
    }
  };

  const handleEventDelete = async (eventId) => {
    if (!window.confirm('Delete this campus event?')) return;
    try {
      const res = await api.delete(`/api/events/${eventId}`);
      if (res.data.success) {
        showToast('Event deleted.', 'success');
        setMyEvents(prev => prev.filter(e => e._id !== eventId));
      }
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  return (
    <div className="profile-container animate-fade">
      {/* Profile Sidebar */}
      <section className="profile-sidebar-card">
        <img
          src={user?.profilePic ? user.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'CC')}`}
          alt={user?.name}
          className="profile-large-avatar"
        />
        <div className="profile-meta-info">
          <h2>{user?.name}</h2>
          <div className="profile-meta-info-sub">
            <div>{user?.department}</div>
            <div>Year {user?.year}</div>
          </div>
          <p className="profile-meta-info-email">{user?.email}</p>
          
          {user?.bio ? (
            <p className="profile-bio-box">
              "{user.bio}"
            </p>
          ) : (
            <p className="profile-bio-box" style={{ fontStyle: 'italic' }}>
              No bio added yet.
            </p>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setShowEditModal(true)}>
          <PencilSimple size={14} weight="regular" />
          <span>Edit Profile</span>
        </button>
      </section>

      {/* Profile Tabs & Lists */}
      <section className="profile-main-area">
        <div className="profile-tabs-header">
          <button
            className={`profile-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <ClockCounterClockwise size={16} weight="regular" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Activity Log
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'my_uploads' ? 'active' : ''}`}
            onClick={() => setActiveTab('my_uploads')}
          >
            <FileText size={16} weight="regular" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            My Uploads ({myNotes.length + myBooks.length + myDoubts.length + myEvents.length})
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'bookmarks' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            <BookmarkSimple size={16} weight="regular" style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
            Bookmarks
          </button>
        </div>

        {/* Tab 1: Activity Timeline */}
        {activeTab === 'timeline' && (
          <div className="card animate-fade">
            <h3>Recent Actions</h3>
            {user?.activityTimeline?.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                No recent activity recorded.
              </p>
            ) : (
              <div className="timeline-list">
                {[...(user?.activityTimeline || [])].reverse().map((act) => (
                  <div key={act._id} className="timeline-item">
                    <div className="timeline-item-title">{act.activityType}</div>
                    <div className="timeline-item-desc">{act.description}</div>
                    <div className="timeline-item-time">{new Date(act.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Uploads */}
        {activeTab === 'my_uploads' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Notes Section */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileText size={20} weight="regular" style={{ color: 'var(--color-primary)' }} />
                <span>Notes Handouts</span>
              </h3>
              {loadingItems ? (
                <div className="skeleton-text"></div>
              ) : myNotes.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No notes uploaded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myNotes.map((n) => (
                    <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{n.subject} • {n.downloadsCount || 0} downloads</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleNoteDelete(n._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Textbooks */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ShoppingBag size={20} weight="regular" style={{ color: 'var(--color-secondary)' }} />
                <span>Textbook Listings</span>
              </h3>
              {loadingItems ? (
                <div className="skeleton-text"></div>
              ) : myBooks.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No textbooks listed for sale.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myBooks.map((b) => (
                    <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Price: ₹{b.price} • Status: <strong style={{ color: b.status === 'available' ? 'var(--cat-events)' : 'var(--color-danger)' }}>{b.status.toUpperCase()}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleBookDelete(b._id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Doubts */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ChatCircle size={20} weight="regular" style={{ color: 'var(--color-accent)' }} />
                <span>Doubt Questions</span>
              </h3>
              {loadingItems ? (
                <div className="skeleton-text"></div>
              ) : myDoubts.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No forum queries listed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myDoubts.map((d) => (
                    <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{d.upvotes?.length || 0} upvotes • {d.viewsCount || 0} views</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/doubts?id=${d._id}`)}>View Thread</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Events */}
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CalendarBlank size={20} weight="regular" style={{ color: 'var(--color-success)' }} />
                <span>Hosted Events</span>
              </h3>
              {loadingItems ? (
                <div className="skeleton-text"></div>
              ) : myEvents.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No events hosted yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {myEvents.map((e) => (
                    <div key={e._id} className="profile-item-row">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Venue: {e.venue} • Date: {new Date(e.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>
                          Details
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleEventDelete(e._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Bookmarked Notes */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Saved Handouts ({user?.bookmarkedNotes?.length || 0})</h3>
              {!user?.bookmarkedNotes || user.bookmarkedNotes.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No bookmarked notes shortcuts.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {user.bookmarkedNotes.map((n) => (
                    <div key={n._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{n.subject} • Sem {n.semester}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/notes?id=${n._id}`)}>
                        Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Books */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Saved Books ({user?.savedBooks?.length || 0})</h3>
              {!user?.savedBooks || user.savedBooks.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No textbook listings saved.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {user.savedBooks.map((b) => (
                    <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Price: ${b.price} • Status: {b.status}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/books')}>
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bookmarked Events */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Subscribed Events ({user?.bookmarkedEvents?.length || 0})</h3>
              {!user?.bookmarkedEvents || user.bookmarkedEvents.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No bookmarked events.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {user.bookmarkedEvents.map((e) => (
                    <div key={e._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--scrollbar-track)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Date: {new Date(e.date).toLocaleDateString()} • Venue: {e.venue}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate('/events')}>
                        Show Event
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-header">
                <h3>Edit Profile Details</h3>
                <button type="button" className="nav-icon-btn" onClick={() => setShowEditModal(false)}>
                  <X size={20} weight="regular" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-input"
                      value={editDept}
                      onChange={(e) => setEditDept(e.target.value)}
                      required
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year *</label>
                    <select
                      className="form-input"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      required
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Short Bio</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    maxLength="200"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Brief bio..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Profile Avatar Cover</label>
                  <div className="pdf-upload-box" onClick={() => document.getElementById('editAvatarFile').click()}>
                    {previewUrl || user?.profilePic ? (
                      <div className="pdf-uploaded-success">
                        <img
                          src={previewUrl || user.profilePic}
                          alt="Avatar preview"
                          style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Click to select a new image file
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '1.5rem' }}>📷</div>
                        <div className="file-upload-text">Choose Image (jpg, png, webp)</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    id="editAvatarFile"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving changes...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
