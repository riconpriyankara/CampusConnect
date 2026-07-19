import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { MagnifyingGlass, Plus, BookmarkSimple, X, MapPin, CalendarBlank, Clock, Sparkle, Warning, ShieldCheck, CaretLeft, CaretRight } from '@phosphor-icons/react';
import './Events.css';

const Events = () => {
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { showToast } = useNotifications();

  const getEventCode = (event, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `EVT·${idx}`;
  };

  // Events list state
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState('true');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload event form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadVenue, setUploadVenue] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadTime, setUploadTime] = useState('');
  const [uploadBanner, setUploadBanner] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (upcomingOnly) params.append('upcoming', upcomingOnly);
      params.append('page', page);
      params.append('limit', '9');

      const res = await api.get(`/api/events?${params.toString()}`);
      if (res.data.success) {
        setEvents(res.data.events);
        setPages(res.data.pages);
        setTotalEvents(res.data.total);
      }
    } catch (error) {
      showToast('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, upcomingOnly, page]);

  // Handle deep link to create event modal
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'create') {
      setShowUploadModal(true);
    }
  }, [location.search]);

  const handleBookmarkToggle = async (e, eventId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/events/${eventId}/bookmark`);
      if (res.data.success) {
        setUser((prev) => ({ ...prev, bookmarkedEvents: res.data.bookmarkedEvents }));
        
        // Toggle flag on card locally in state
        setEvents((prev) =>
          prev.map((ev) => {
            if (ev._id === eventId) {
              const hasBookmark = ev.bookmarkedBy?.includes(user._id);
              const updatedBookmarkedBy = hasBookmark
                ? ev.bookmarkedBy.filter((id) => id.toString() !== user._id.toString())
                : [...(ev.bookmarkedBy || []), user._id];
              return { ...ev, bookmarkedBy: updatedBookmarkedBy };
            }
            return ev;
          })
        );
        
        showToast(res.data.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'success');
      }
    } catch (error) {
      showToast('Failed to bookmark event', 'error');
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadBanner(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle || !uploadDesc || !uploadVenue || !uploadDate || !uploadTime || !uploadBanner) {
      return showToast('Please complete all required fields and upload a banner image', 'error');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('venue', uploadVenue);
    formData.append('date', uploadDate);
    formData.append('time', uploadTime);
    formData.append('banner', uploadBanner);

    try {
      const res = await api.post('/api/events', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Campus event created successfully!', 'success');
        // Clear state
        setUploadTitle('');
        setUploadDesc('');
        setUploadVenue('');
        setUploadDate('');
        setUploadTime('');
        setUploadBanner(null);
        setPreviewUrl('');
        setShowUploadModal(false);

        // Prepend listing to views
        setEvents((prev) => [res.data.event, ...prev].slice(0, 9));
        setTotalEvents((prev) => prev + 1);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this campus event listing permanently?')) return;

    try {
      const res = await api.delete(`/api/events/${eventId}`);
      if (res.data.success) {
        showToast('Event successfully deleted.', 'success');
        setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
      }
    } catch (error) {
      showToast('Failed to delete event', 'error');
    }
  };

  const handleReport = async (itemId) => {
    const reason = prompt('State violations (e.g., spam, malicious, unauthorized event):');
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post('/api/admin/reports', {
        itemType: 'Event',
        itemId,
        reason: reason.trim(),
      });
      if (res.data.success) {
        showToast('Event successfully reported for moderation.', 'success');
      }
    } catch (error) {
      showToast('Failed to file report.', 'error');
    }
  };

  return (
    <div className="events-container animate-fade">
      {/* Upper header */}
      <div className="notes-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarBlank size={28} weight="bold" style={{ color: 'var(--cat-events)' }} />
          <div>
            <h1>Campus Events</h1>
            <p style={{ color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              College hackathons, networking dinners, and campus socials.
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} weight="regular" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="notes-filters-bar">
        <div className="filter-search-wrapper" style={{ flexGrow: 3 }}>
          <MagnifyingGlass className="filter-search-icon" size={18} weight="regular" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search event name, venue, or keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="filter-select"
          value={upcomingOnly}
          onChange={(e) => { setUpcomingOnly(e.target.value); setPage(1); }}
        >
          <option value="true">Upcoming Events</option>
          <option value="">All Events</option>
        </select>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="events-grid-layout">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '300px' }}></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3 className="empty-title">No events found</h3>
          <p className="empty-desc">No campus activities match your criteria. Create a listing to inform others!</p>
          {(search || upcomingOnly !== 'true') && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setUpcomingOnly('true'); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="events-grid-layout">
            {events.map((event, index) => {
              const isOrganizer = event.organizer?._id === user?._id || event.organizer === user?._id;
              const isBookmarked = user?.bookmarkedEvents?.includes(event._id);
              const eventDateObj = new Date(event.date);
              const day = eventDateObj.getDate();
              const month = eventDateObj.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
              const weekday = eventDateObj.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
              return (
                <div key={event._id} className="card event-card">
                  <div className="event-card-banner-wrapper">
                    <img
                      src={event.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                      alt={event.title}
                      className="event-card-banner-img"
                    />
                    <div className="event-date-block">
                      <span className="event-date-day">{day}</span>
                      <span className="event-date-meta">{month} • {weekday}</span>
                    </div>
                    {!isOrganizer && (
                      <button
                        className={`event-card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        onClick={(e) => handleBookmarkToggle(e, event._id)}
                        aria-label="Bookmark event"
                      >
                        <BookmarkSimple size={15} weight={isBookmarked ? 'fill' : 'regular'} />
                      </button>
                    )}
                  </div>

                  <div className="event-card-details">
                    <div className="event-card-info">
                      <div className="event-card-header-row" style={{ marginBottom: '0.35rem' }}>
                        <span className="badge badge-success">{event.department || 'Campus Event'}</span>
                      </div>
                      <h3>{event.title}</h3>
                      <p className="event-card-desc">{event.description}</p>
                      
                      <div className="event-card-meta">
                        <span>
                          <MapPin size={14} weight="regular" />
                          {event.venue}
                        </span>
                        <span>
                          <Clock size={14} weight="regular" />
                          {event.time}
                        </span>
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <div className="event-card-organizer">
                        <img
                          src={event.organizer?.profilePic ? event.organizer.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(event.organizer?.name || 'CC')}`}
                          alt="Organizer avatar"
                          className="event-card-organizer-avatar"
                        />
                        <span>by {isOrganizer ? 'You' : event.organizer?.name}</span>
                      </div>

                      <div className="event-card-btn-row">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleReport(event._id)}
                        >
                          <Warning size={12} weight="regular" />
                        </button>
                        {(isOrganizer || user?.role === 'admin') && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(event._id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="pagination-row">
              <button
                className="pagination-btn"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
              >
                <CaretLeft size={16} weight="regular" />
              </button>
              <span className="pagination-info">Page {page} of {pages}</span>
              <button
                className="pagination-btn"
                onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                disabled={page === pages}
              >
                <CaretRight size={16} weight="regular" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Event Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-header">
                <h3>Create Campus Event</h3>
                <button type="button" className="nav-icon-btn" onClick={() => setShowUploadModal(false)}>
                  <X size={20} weight="regular" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Annual Technical Hackathon 2026"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Main Library Seminar Hall or Zoom link"
                    value={uploadVenue}
                    onChange={(e) => setUploadVenue(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Time *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="09:00 AM"
                      value={uploadTime}
                      onChange={(e) => setUploadTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    placeholder="Provide outlines, themes, prizes, sponsorship details, registration links."
                    rows="3"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Banner Cover *</label>
                  <div className="pdf-upload-box" onClick={() => document.getElementById('uploadBannerEl').click()}>
                    {previewUrl ? (
                      <div className="pdf-uploaded-success">
                        <img
                          src={previewUrl}
                          alt="Banner preview"
                          style={{ width: '150px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Click to select a different image
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem' }}>📷</div>
                        <div className="file-upload-text">Choose Banner Image (jpg, png, webp)</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    id="uploadBannerEl"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleBannerChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Publishing Event...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
