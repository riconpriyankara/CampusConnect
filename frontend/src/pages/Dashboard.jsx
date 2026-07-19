import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import {
  BookOpen,
  ChatsCircle,
  CalendarBlank,
  ShoppingBag,
  ArrowRight,
  DownloadSimple,
  Eye,
  ThumbsUp,
  MapPin,
  Clock,
  FileText,
  GraduationCap
} from '@phosphor-icons/react';
import { getDeptCode } from '../utils/deptHelper';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [notes, setNotes] = useState([]);
  const [doubts, setDoubts] = useState([]);
  const [events, setEvents] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time-of-day greeting calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [notesRes, doubtsRes, eventsRes, booksRes] = await Promise.all([
          api.get('/api/notes?limit=3'),
          api.get('/api/doubts?limit=3'),
          api.get('/api/events?limit=2&upcoming=true'),
          api.get('/api/books?limit=4&status=available'),
        ]);

        if (notesRes.data.success) setNotes(notesRes.data.notes);
        if (doubtsRes.data.success) setDoubts(doubtsRes.data.doubts);
        if (eventsRes.data.success) setEvents(eventsRes.data.events);
        if (booksRes.data.success) setBooks(booksRes.data.books);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load some dashboard sections.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [showToast]);

  const handleDownload = async (e, noteId, fileUrl) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/notes/${noteId}/download`);
      if (res.data.success) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', fileUrl.split('/').pop());
        document.body.appendChild(link);
        link.click();
        link.remove();
        setNotes((prev) =>
          prev.map((n) => (n._id === noteId ? { ...n, downloadsCount: res.data.downloadsCount } : n))
        );
        showToast('Downloading note PDF...', 'success');
      }
    } catch (error) {
      showToast('Could not download note.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }}></div>
        <div className="dashboard-grid">
          <div className="dashboard-main-col">
            <div className="skeleton-title"></div>
            <div className="skeleton skeleton-card" style={{ height: '140px' }}></div>
            <div className="skeleton-title" style={{ marginTop: '2rem' }}></div>
            <div className="notes-grid">
              <div className="skeleton skeleton-card"></div>
              <div className="skeleton skeleton-card"></div>
            </div>
          </div>
          <div className="dashboard-side-col">
            <div className="skeleton-title"></div>
            <div className="skeleton skeleton-card" style={{ height: '280px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-fade">
      <div className="dashboard-welcome-banner">
        <div className="welcome-banner-main">

          <h1>
            {getGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Student'} 👋
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening across your campus directory today.
          </p>
        </div>
        <div className="welcome-banner-side">
          <div className="welcome-date-chip">
            <CalendarBlank size={14} weight="bold" />
            <span>{formattedDate}</span>
          </div>
          <div className="welcome-dept-chip">
            <GraduationCap size={14} weight="bold" />
            <span>{getDeptCode(user?.department)} • Year {user?.year || 1}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <button className="quick-action-btn-primary" onClick={() => navigate('/notes?action=upload')}>
          <FileText size={18} weight="bold" />
          <span>Upload Notes</span>
        </button>

        <button className="quick-action-btn-primary" onClick={() => navigate('/books?action=list')}>
          <ShoppingBag size={18} weight="bold" />
          <span>List Textbook</span>
        </button>

        <button className="quick-action-btn-primary" onClick={() => navigate('/doubts?action=ask')}>
          <ChatsCircle size={18} weight="bold" />
          <span>Ask Question</span>
        </button>

        <button className="quick-action-btn-primary" onClick={() => navigate('/events?action=create')}>
          <CalendarBlank size={18} weight="bold" />
          <span>Create Event</span>
        </button>
      </div>
      <div className="dashboard-grid">
        {/* Main Column */}
        <div className="dashboard-main-col">
          {/* Upcoming Campus Events */}
          <section className="section-card">
            <div className="section-title-row">
              <h2>
                <CalendarBlank size={18} weight="regular" style={{ color: 'var(--cat-events)' }} />
                <span>Upcoming Events</span>
              </h2>
              <Link to="/events" className="view-all-link">
                <span>All Events</span>
                <ArrowRight size={14} weight="regular" />
              </Link>
            </div>
            <div className="dashboard-events-track">
              {events.length === 0 ? (
                <div className="dashboard-empty-card">
                  <p className="empty-msg">No upcoming events scheduled right now.</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="event-banner-card" onClick={() => navigate('/events')}>
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300'}
                      alt={event.title}
                      className="event-banner-img"
                    />
                    <div className="event-banner-details">
                      <div>
                        <div className="event-card-header-tags">
                          <span className="badge badge-success">{event.department || 'Campus Event'}</span>
                        </div>
                        <h3 className="card-title">{event.title}</h3>
                        <p className="card-desc">
                          {event.description.length > 90 ? `${event.description.substring(0, 90)}...` : event.description}
                        </p>
                      </div>
                      <div className="event-banner-meta">
                        <span>
                          <Clock size={13} weight="regular" />
                          {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} at {event.time}
                        </span>
                        {event.venue && (
                          <span className="event-meta-venue">
                            <MapPin size={13} weight="regular" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Latest Notes */}
          <section className="section-card">
            <div className="section-title-row">
              <h2>
                <BookOpen size={18} weight="regular" style={{ color: 'var(--cat-notes)' }} />
                <span>Latest Notes & Handouts</span>
              </h2>
              <Link to="/notes" className="view-all-link">
                <span>View Library</span>
                <ArrowRight size={14} weight="regular" />
              </Link>
            </div>
            {notes.length === 0 ? (
              <div className="dashboard-empty-card">
                <p className="empty-msg">No course notes uploaded yet.</p>
              </div>
            ) : (
              <div className="notes-grid">
                {notes.map((note) => (
                  <div key={note._id} className="card note-card" onClick={() => navigate(`/notes?id=${note._id}`)}>
                    <div>
                      <div className="note-card-header">
                        <span className="badge badge-notes">{note.subject || 'Material'}</span>
                        <span className="file-format-chip">PDF</span>
                      </div>
                      <h3 className="note-card-title">{note.title}</h3>
                      <p className="note-card-desc">
                        {note.description.length > 75 ? `${note.description.substring(0, 75)}...` : note.description}
                      </p>
                    </div>
                    <div className="note-card-footer">
                      <div className="note-uploader-info">
                        <img
                          src={note.uploadedBy?.profilePic ? note.uploadedBy.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(note.uploadedBy?.name || 'CC')}`}
                          alt={note.uploadedBy?.name}
                          className="note-uploader-avatar"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(note.uploadedBy?.name || 'CC')}`;
                          }}
                        />
                        <span className="note-card-author">{note.uploadedBy?.name || 'Student'}</span>
                      </div>
                      <button
                        className="btn btn-primary btn-sm note-download-btn"
                        onClick={(e) => handleDownload(e, note._id, note.fileUrl)}
                        title="Download PDF"
                      >
                        <DownloadSimple size={13} weight="regular" />
                        <span>{note.downloadsCount || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Doubts */}
          <section className="section-card">
            <div className="section-title-row">
              <h2>
                <ChatsCircle size={18} weight="regular" style={{ color: 'var(--cat-doubts)' }} />
                <span>Academic Doubts & Discussions</span>
              </h2>
              <Link to="/doubts" className="view-all-link">
                <span>Discussion Forum</span>
                <ArrowRight size={14} weight="regular" />
              </Link>
            </div>
            <div className="doubts-list">
              {doubts.length === 0 ? (
                <div className="dashboard-empty-card">
                  <p className="empty-msg">No doubt discussions posted yet.</p>
                </div>
              ) : (
                doubts.map((doubt) => (
                  <div key={doubt._id} className="doubt-row-card" onClick={() => navigate(`/doubts?id=${doubt._id}`)}>
                    <div className="doubt-author-avatar-col">
                      <img
                        src={doubt.author?.profilePic ? doubt.author.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doubt.author?.name || 'CC')}`}
                        alt={doubt.author?.name}
                        className="doubt-author-avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(doubt.author?.name || 'CC')}`;
                        }}
                      />
                    </div>
                    <div className="doubt-row-left">
                      <h3 className="doubt-row-title">{doubt.title}</h3>
                      <div className="doubt-row-meta">
                        {doubt.tags?.map((tag) => (
                          <span key={tag} className="doubt-row-tag">{tag}</span>
                        ))}
                        <span className="doubt-author-name">by {doubt.author?.name || 'Student'}</span>
                      </div>
                    </div>
                    <div className="doubt-row-right">
                      <div className="doubt-stats-group">
                        <span className="doubt-row-stat" title="Upvotes">
                          <ThumbsUp size={14} weight="regular" />
                          {doubt.upvotesCount || doubt.upvotes?.length || 0}
                        </span>
                        <span className="doubt-row-stat" title="Views">
                          <Eye size={14} weight="regular" />
                          {doubt.viewsCount || 0}
                        </span>
                      </div>
                      <div className="doubt-badges-group">
                        {doubt.acceptedAnswer ? (
                          <span className="badge badge-success">✓ Solved</span>
                        ) : (
                          <span className="badge badge-primary">
                            {doubt.answersCount || 0} {doubt.answersCount === 1 ? 'Answer' : 'Answers'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Side Column */}
        <div className="dashboard-side-col">
          {/* Books Marketplace */}
          <section className="section-card">
            <div className="section-title-row">
              <h2>
                <ShoppingBag size={18} weight="regular" style={{ color: 'var(--cat-books)' }} />
                <span>Marketplace Listings</span>
              </h2>
              <Link to="/books" className="view-all-link">
                <span>View All</span>
                <ArrowRight size={14} weight="regular" />
              </Link>
            </div>
            <div className="books-vertical-list">
              {books.length === 0 ? (
                <div className="dashboard-empty-card">
                  <p className="empty-msg">No textbooks listed for sale yet.</p>
                </div>
              ) : (
                books.map((book) => (
                  <div key={book._id} className="book-mini-card" onClick={() => navigate('/books')}>
                    <img
                      src={book.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150'}
                      alt={book.title}
                      className="book-mini-img"
                    />
                    <div className="book-mini-details">
                      <div>
                        <h3 className="book-mini-title">{book.title}</h3>
                        <div className="book-mini-meta-row">
                          <span className="book-mini-condition">{book.condition}</span>
                          <span className="book-mini-seller">by {book.soldBy?.name ? book.soldBy.name.split(' ')[0] : 'Student'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                        <span className="book-mini-price">₹{book.price}</span>
                        <span className="badge badge-warning">
                          {getDeptCode(book.department)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
