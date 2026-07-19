import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { MagnifyingGlass, Plus, DownloadSimple, Eye, BookmarkSimple, X, FileText, CaretLeft, CaretRight, Warning, BookOpen } from '@phosphor-icons/react';
import { getDeptCode } from '../utils/deptHelper';
import './Notes.css';

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

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const Notes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showToast } = useNotifications();

  const getNoteCode = (note, index) => {
    const dept = getDeptCode(note.department);
    const sem = note.semester || '1';
    const idx = String(index + 1).padStart(2, '0');
    return `N·${dept}·${sem}${idx}`;
  };

  // Notes list state
  const [notes, setNotes] = useState([]);
  const [totalNotes, setTotalNotes] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadSem, setUploadSem] = useState('1');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Profile timeline of recently viewed
  const [recentViews, setRecentViews] = useState([]);

  // Load notes on filters/page change
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (department) params.append('department', department);
        if (semester) params.append('semester', semester);
        params.append('page', page);
        params.append('limit', '9');

        const res = await api.get(`/api/notes?${params.toString()}`);
        if (res.data.success) {
          setNotes(res.data.notes);
          setPages(res.data.pages);
          setTotalNotes(res.data.total);
        }
      } catch (error) {
        showToast('Failed to fetch notes', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [search, department, semester, page, showToast]);

  // Load recently viewed notes from profile
  const fetchRecentViews = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      if (res.data.success) {
        // filter valid references
        const filtered = (res.data.user.recentlyViewedNotes || []).filter(item => item.note);
        setRecentViews(filtered);
        setUser(res.data.user);
      }
    } catch (error) {
      console.error('Error fetching recently viewed notes:', error);
    }
  };

  useEffect(() => {
    fetchRecentViews();
  }, []);

  // Handle deep link to details or upload modal
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'upload') {
      setShowUploadModal(true);
    }
    const noteId = query.get('id');
    if (noteId) {
      openNoteDetails(noteId);
    }
  }, [location.search]);

  const openNoteDetails = async (noteId) => {
    try {
      setDetailLoading(true);
      setShowDetailModal(true);
      const res = await api.get(`/api/notes/${noteId}`);
      if (res.data.success) {
        setSelectedNote(res.data.note);
        // Refresh recently viewed listing
        fetchRecentViews();
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Could not load note details', 'error');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeNoteDetails = () => {
    setShowDetailModal(false);
    setSelectedNote(null);
    // Clear query param
    navigate('/notes', { replace: true });
  };

  const handleBookmarkToggle = async (e, noteId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/notes/${noteId}/bookmark`);
      if (res.data.success) {
        // Update user state bookmarks
        setUser((prev) => ({ ...prev, bookmarkedNotes: res.data.bookmarkedNotes }));
        
        // If in detail modal, update counts or status
        if (selectedNote && selectedNote._id === noteId) {
          // just toggled
        }
        
        showToast(res.data.bookmarked ? 'Note saved to bookmarks' : 'Note removed from bookmarks', 'success');
      }
    } catch (error) {
      showToast('Could not bookmark note', 'error');
    }
  };

  const handleDownload = async (e, note) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/notes/${note._id}/download`);
      if (res.data.success) {
        // Update counts in list and selected details
        setNotes((prev) =>
          prev.map((n) => (n._id === note._id ? { ...n, downloadsCount: res.data.downloadsCount } : n))
        );
        if (selectedNote && selectedNote._id === note._id) {
          setSelectedNote((prev) => ({ ...prev, downloadsCount: res.data.downloadsCount }));
        }

        // Trigger actual download
        const link = document.createElement('a');
        link.href = note.fileUrl;
        link.setAttribute('download', note.title + '.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('PDF download started', 'success');
      }
    } catch (error) {
      showToast('Download failed', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Only PDF files are allowed', 'error');
        return;
      }
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle || !uploadSubject || !uploadDesc || !uploadDept || !uploadSem || !uploadFile) {
      return showToast('Please fill out all fields and select a PDF file', 'error');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('subject', uploadSubject);
    formData.append('description', uploadDesc);
    formData.append('department', uploadDept);
    formData.append('semester', uploadSem);
    formData.append('file', uploadFile);

    try {
      const res = await api.post('/api/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Note uploaded successfully!', 'success');
        // Reset state
        setUploadTitle('');
        setUploadSubject('');
        setUploadDesc('');
        setUploadDept('');
        setUploadSem('1');
        setUploadFile(null);
        setShowUploadModal(false);

        // Prepend new note to list
        setNotes((prev) => [res.data.note, ...prev].slice(0, 9));
        setTotalNotes((prev) => prev + 1);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to upload note', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleReport = async (itemId) => {
    const reason = prompt('Please specify the reason for flagging this note:');
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post('/api/admin/reports', {
        itemType: 'Note',
        itemId,
        reason: reason.trim(),
      });
      if (res.data.success) {
        showToast('Note successfully flagged for administrator review.', 'success');
      }
    } catch (error) {
      showToast('Failed to file report', 'error');
    }
  };

  return (
    <div className="notes-container animate-fade">
      {/* Upper header */}
      <div className="notes-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BookOpen size={28} weight="bold" style={{ color: 'var(--cat-notes)' }} />
          <div>
            <h1>Notes Library</h1>
            <p className="notes-header-meta">
              Access peer-reviewed lecture handouts and study guides.
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} weight="regular" />
          <span>Upload PDF</span>
        </button>
      </div>

      {/* Filters */}
      <div className="notes-filters-bar">
        <div className="filter-search-wrapper">
          <MagnifyingGlass className="filter-search-icon" size={18} weight="regular" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search title, subject, or keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="filter-select"
          value={department}
          onChange={(e) => { setDepartment(e.target.value); setPage(1); }}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={semester}
          onChange={(e) => { setSemester(e.target.value); setPage(1); }}
        >
          <option value="">All Semesters</option>
          {SEMESTERS.map((sem) => (
            <option key={sem} value={sem}>Semester {sem}</option>
          ))}
        </select>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="notes-main-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📂</span>
          <h3 className="empty-title">No notes found</h3>
          <p className="empty-desc">Try clearing your filters or search keywords, or upload your own notes to share!</p>
          {(department || semester || search) && (
            <button className="btn btn-secondary" onClick={() => { setDepartment(''); setSemester(''); setSearch(''); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="notes-main-grid">
            {notes.map((note, index) => {
              const isBookmarked = user?.bookmarkedNotes?.includes(note._id);
              return (
                <div
                  key={note._id}
                  className="card note-grid-card"
                  onClick={() => navigate(`/notes?id=${note._id}`)}
                >
                  <div>
                    <div className="note-card-header">
                      <div className="note-card-badges">
                        <span className="badge badge-notes">{note.subject || note.department}</span>
                      </div>
                      <button
                        className={`note-card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Note'}
                        onClick={(e) => handleBookmarkToggle(e, note._id)}
                      >
                        <BookmarkSimple size={15} weight={isBookmarked ? "fill" : "regular"} />
                      </button>
                    </div>
                    <div className="note-card-body" onClick={() => handleViewNote(note)}>
                      <span className="note-card-dept">{note.department}</span>
                      <h3 className="note-card-title">{note.title}</h3>
                      <p className="note-card-desc">
                        {note.description.length > 100 ? `${note.description.substring(0, 100)}...` : note.description}
                      </p>
                    </div>
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
                      onClick={(e) => handleDownload(e, note)}
                      title="Download PDF"
                    >
                      <DownloadSimple size={13} weight="regular" />
                      <span>{note.downloadsCount || 0}</span>
                    </button>
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
                className="btn btn-secondary btn-sm"
                onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
                disabled={page === pages}
              >
                <CaretRight size={16} weight="regular" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-header">
                <h3>Upload Lecture Note</h3>
                <button type="button" className="nav-icon-btn" onClick={() => setShowUploadModal(false)}>
                  <X size={20} weight="regular" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Note Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Algorithms Lecture notes: Graph Traversals"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Subject *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Data Structures"
                      value={uploadSubject}
                      onChange={(e) => setUploadSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-input"
                      value={uploadSem}
                      onChange={(e) => setUploadSem(e.target.value)}
                      required
                    >
                      {SEMESTERS.map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-input"
                    value={uploadDept}
                    onChange={(e) => setUploadDept(e.target.value)}
                    required
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    className="form-input"
                    placeholder="Details about lectures covered, textbook references, or cheatsheets."
                    rows="3"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">PDF Document File *</label>
                  <div className="pdf-upload-box" onClick={() => document.getElementById('uploadFileEl').click()}>
                    {uploadFile ? (
                      <div className="pdf-uploaded-success">
                        <FileText size={40} weight="regular" style={{ color: 'var(--color-primary)' }} />
                        <span>{uploadFile.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Click to select a different PDF
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem' }}>📄</div>
                        <div className="file-upload-text">Choose PDF Note (Max 15MB)</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    id="uploadFileEl"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading PDF...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailModal && (
        <div className="modal-overlay" onClick={closeNoteDetails}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Note Information</h3>
              <button className="nav-icon-btn" onClick={closeNoteDetails}>
                <X size={20} weight="regular" />
              </button>
            </div>
            {detailLoading ? (
              <div className="modal-body" style={{ alignItems: 'center', padding: '3rem' }}>
                <div className="skeleton skeleton-circle" style={{ width: '48px', height: '48px' }}></div>
              </div>
            ) : selectedNote ? (
              <>
                <div className="modal-body">
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">{selectedNote.department}</span>
                    <span className="badge badge-warning">Semester {selectedNote.semester}</span>
                    <span className="badge badge-success">{selectedNote.subject}</span>
                  </div>

                  <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)' }}>{selectedNote.title}</h2>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-bg)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <img
                      src={selectedNote.uploadedBy?.profilePic ? selectedNote.uploadedBy.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedNote.uploadedBy?.name || 'CC')}`}
                      alt="Uploader Avatar"
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>Uploaded by {selectedNote.uploadedBy?.name}</div>
                      <div style={{ color: 'var(--color-text-muted)' }}>{selectedNote.uploadedBy?.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Eye size={16} weight="regular" />
                      {selectedNote.viewsCount} Views
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <DownloadSimple size={16} weight="regular" />
                      {selectedNote.downloadsCount} Downloads
                    </span>
                  </div>

                  {selectedNote.description && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>Description</h4>
                      <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{selectedNote.description}</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                    onClick={() => handleReport(selectedNote._id)}
                  >
                    <Warning size={14} weight="regular" />
                    <span>Report</span>
                  </button>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={(e) => handleBookmarkToggle(e, selectedNote._id)}
                    >
                      <BookmarkSimple size={16} weight={user?.bookmarkedNotes?.includes(selectedNote._id) ? "fill" : "regular"} />
                      <span>{user?.bookmarkedNotes?.includes(selectedNote._id) ? 'Saved' : 'Save'}</span>
                    </button>
                    <button className="btn btn-primary" onClick={(e) => handleDownload(e, selectedNote)}>
                      <DownloadSimple size={16} weight="regular" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="modal-body" style={{ textAlign: 'center', padding: '3rem' }}>
                <p>Note details could not be parsed.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recently Viewed Notes */}
      {recentViews.length > 0 && (
        <section className="recently-viewed-section animate-fade">
          <h2>Recently Viewed Notes</h2>
          <div className="recently-viewed-grid">
            {recentViews.map((item) => (
              <div
                key={item.note._id}
                className="recent-view-card"
                onClick={() => navigate(`/notes?id=${item.note._id}`)}
              >
                <div className="recent-view-title">{item.note.title}</div>
                <div className="recent-view-subject">
                  {item.note.subject}
                </div>
                <div className="recent-view-time">
                  Viewed {new Date(item.viewedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Notes;
