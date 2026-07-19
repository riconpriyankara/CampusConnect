import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { MagnifyingGlass, Plus, BookmarkSimple, X, EnvelopeSimple, Sparkle, Warning, ShieldCheck, CaretLeft, CaretRight, ShoppingBag } from '@phosphor-icons/react';
import './Books.css';

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

const CONDITIONS = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'];

const Books = () => {
  const location = useLocation();
  const { user, setUser } = useAuth();
  const { showToast } = useNotifications();

  const getBookCode = (book, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `BK·${idx}`;
  };

  // Books list state
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('available');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Upload book form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadCond, setUploadCond] = useState('Like New');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadSem, setUploadSem] = useState('1');
  const [uploadImage, setUploadImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Load books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (semester) params.append('semester', semester);
      if (condition) params.append('condition', condition);
      if (status) params.append('status', status);
      params.append('page', page);
      params.append('limit', '9');

      const res = await api.get(`/api/books?${params.toString()}`);
      if (res.data.success) {
        setBooks(res.data.books);
        setPages(res.data.pages);
        setTotalBooks(res.data.total);
      }
    } catch (error) {
      showToast('Failed to load books from marketplace.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, department, semester, condition, status, page]);

  // Handle deep link to upload modal
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'list') {
      setShowUploadModal(true);
    }
  }, [location.search]);

  const handleSaveToggle = async (e, bookId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/books/${bookId}/save`);
      if (res.data.success) {
        setUser((prev) => ({ ...prev, savedBooks: res.data.savedBooks }));
        showToast(res.data.saved ? 'Listing saved to shortcuts' : 'Listing removed from shortcuts', 'success');
      }
    } catch (error) {
      showToast('Failed to save listing.', 'error');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle || !uploadDesc || !uploadPrice || !uploadCond || !uploadDept || !uploadSem || !uploadImage) {
      return showToast('Please complete all fields and select a book image', 'error');
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('description', uploadDesc);
    formData.append('price', uploadPrice);
    formData.append('condition', uploadCond);
    formData.append('department', uploadDept);
    formData.append('semester', uploadSem);
    formData.append('image', uploadImage);

    try {
      const res = await api.post('/api/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        showToast('Textbook listed for sale successfully!', 'success');
        // Clear state
        setUploadTitle('');
        setUploadDesc('');
        setUploadPrice('');
        setUploadCond('Like New');
        setUploadDept('');
        setUploadSem('1');
        setUploadImage(null);
        setPreviewUrl('');
        setShowUploadModal(false);

        // Prepend listing to view if status filter permits
        if (status === 'available' || !status) {
          setBooks((prev) => [res.data.book, ...prev].slice(0, 9));
          setTotalBooks((prev) => prev + 1);
        }
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to list book', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleStatusToggle = async (bookId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      const res = await api.put(`/api/books/${bookId}/status`, { status: nextStatus });
      if (res.data.success) {
        showToast(`Textbook status marked as ${nextStatus.toUpperCase()}`, 'success');
        
        // Remove from list if viewing available books
        if (status === 'available' && nextStatus === 'sold') {
          setBooks((prev) => prev.filter((b) => b._id !== bookId));
        } else {
          setBooks((prev) =>
            prev.map((b) => (b._id === bookId ? { ...b, status: nextStatus } : b))
          );
        }

        if (selectedBook && selectedBook._id === bookId) {
          setSelectedBook((prev) => ({ ...prev, status: nextStatus }));
        }
      }
    } catch (error) {
      showToast('Could not modify listing status.', 'error');
    }
  };

  const handleDeleteListing = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;

    try {
      const res = await api.delete(`/api/books/${bookId}`);
      if (res.data.success) {
        showToast('Listing successfully deleted.', 'success');
        setBooks((prev) => prev.filter((b) => b._id !== bookId));
        setShowContactModal(false);
      }
    } catch (error) {
      showToast('Failed to delete book listing', 'error');
    }
  };

  const handleReport = async (itemId) => {
    const reason = prompt('Specify report reasons (e.g., prohibited items, wrong prices, scam):');
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post('/api/admin/reports', {
        itemType: 'Book',
        itemId,
        reason: reason.trim(),
      });
      if (res.data.success) {
        showToast('Report logged. Administrator moderators will review it shortly.', 'success');
      }
    } catch (error) {
      showToast('Failed to log report.', 'error');
    }
  };

  const openContactSeller = (book) => {
    setSelectedBook(book);
    setShowContactModal(true);
  };

  return (
    <div className="books-container animate-fade">
      {/* Upper header */}
      <div className="notes-header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShoppingBag size={28} weight="bold" style={{ color: 'var(--cat-books)' }} />
          <div>
            <h1>Textbook Marketplace</h1>
            <p style={{ color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
              Buy or sell textbooks with fellow students.
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} weight="regular" />
          <span>List Textbook</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="notes-filters-bar">
        <div className="filter-search-wrapper" style={{ flexGrow: 3 }}>
          <MagnifyingGlass className="filter-search-icon" size={18} weight="regular" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search textbook title, author, or content..."
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
          value={condition}
          onChange={(e) => { setCondition(e.target.value); setPage(1); }}
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((cond) => (
            <option key={cond} value={cond}>{cond}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="available">Available Listings</option>
          <option value="sold">Sold Items</option>
          <option value="">All Listings</option>
        </select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="books-grid-layout">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '320px' }}></div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📖</span>
          <h3 className="empty-title">No books listed</h3>
          <p className="empty-desc">No textbooks match your current filter conditions. Clear filters to browse active deals!</p>
          {(search || department || condition || status !== 'available') && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setDepartment(''); setCondition(''); setStatus('available'); }}>
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="books-grid-layout">
            {books.map((book, index) => {
              const isOwner = book.soldBy?._id === user?._id || book.soldBy === user?._id;
              const isSaved = user?.savedBooks?.includes(book._id);
              return (
                <div key={book._id} className="card book-card">
                  <div className="book-card-image-wrapper">
                    <img
                      src={book.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300'}
                      alt={book.title}
                      className="book-card-img"
                    />
                    {book.status === 'sold' && (
                      <span className="book-card-badge badge badge-danger">
                        Sold
                      </span>
                    )}
                    {!isOwner && (
                      <button
                        className={`book-card-bookmark-btn ${isSaved ? 'active' : ''}`}
                        onClick={(e) => handleSaveToggle(e, book._id)}
                        aria-label="Bookmark listing"
                      >
                        <BookmarkSimple size={15} weight={isSaved ? "fill" : "regular"} />
                      </button>
                    )}
                  </div>
                  
                  <div className="book-card-details">
                    <div className="book-card-info">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span className="badge badge-warning">{book.department}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sem {book.semester}</span>
                      </div>
                      <h3>{book.title}</h3>
                      <p className="book-card-desc">
                        {book.description.length > 90 ? `${book.description.substring(0, 90)}...` : book.description}
                      </p>
                      <span className="book-condition-chip">Condition: {book.condition}</span>
                    </div>

                    <div className="book-card-pricing-row">
                      <span className="book-card-price">₹{book.price}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        by {isOwner ? 'You' : book.soldBy?.name}
                      </span>
                    </div>

                    <div className="book-card-actions">
                      {isOwner ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStatusToggle(book._id, book.status)}
                          >
                            Mark as {book.status === 'available' ? 'Sold' : 'Available'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteListing(book._id)}
                          >
                            Delete Listing
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => openContactSeller(book)}>
                          Contact Seller
                        </button>
                      )}
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
              <span>Page {page} of {pages}</span>
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

      {/* Upload textbook modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-header">
                <h3>List Textbook For Sale</h3>
                <button type="button" className="nav-icon-btn" onClick={() => setShowUploadModal(false)}>
                  <X size={20} weight="regular" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Book Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Cracking the Coding Interview (6th Edition)"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="850"
                      min="0"
                      step="0.01"
                      value={uploadPrice}
                      onChange={(e) => setUploadPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condition *</label>
                    <select
                      className="form-input"
                      value={uploadCond}
                      onChange={(e) => setUploadCond(e.target.value)}
                      required
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-input"
                      value={uploadDept}
                      onChange={(e) => setUploadDept(e.target.value)}
                      required
                    >
                      <option value="">Select Dept</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select
                      className="form-input"
                      value={uploadSem}
                      onChange={(e) => setUploadSem(e.target.value)}
                      required
                    >
                      {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description & Contact notes *</label>
                  <textarea
                    className="form-input"
                    placeholder="Specify spine quality, markings, CD inclusion. Note preferred meeting spots on campus."
                    rows="3"
                    value={uploadDesc}
                    onChange={(e) => setUploadDesc(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Textbook Cover Image *</label>
                  <div className="pdf-upload-box" onClick={() => document.getElementById('uploadImgEl').click()}>
                    {previewUrl ? (
                      <div className="pdf-uploaded-success">
                        <img
                          src={previewUrl}
                          alt="Cover preview"
                          style={{ width: '100px', height: '130px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Click to select a different image
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '2rem' }}>📷</div>
                        <div className="file-upload-text">Select Image Cover (jpg, png, webp)</div>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    id="uploadImgEl"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Publishing listing...' : 'Publish listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Seller Modal */}
      {showContactModal && selectedBook && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Contact Seller</h3>
              <button className="nav-icon-btn" onClick={() => setShowContactModal(false)}>
                <X size={20} weight="regular" />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>FOR TEXTBOOK:</span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>{selectedBook.title}</h2>
                <span className="book-card-price">₹{selectedBook.price}</span>
              </div>
              
              <div className="seller-profile-card">
                <img
                  src={selectedBook.soldBy?.profilePic ? selectedBook.soldBy.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedBook.soldBy?.name || 'CC')}`}
                  alt="Seller Avatar"
                  className="seller-avatar"
                />
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{selectedBook.soldBy?.name}</h3>
                  <div className="seller-meta-row" style={{ marginTop: '0.25rem' }}>
                    <span className="badge badge-primary">{selectedBook.soldBy?.department}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      College Email: <strong style={{ color: 'var(--color-text)' }}>{selectedBook.soldBy?.email}</strong>
                    </span>
                  </div>
                </div>
                {selectedBook.soldBy?.bio && (
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '320px' }}>
                    "{selectedBook.soldBy.bio}"
                  </p>
                )}
              </div>

              <div style={{ padding: '0.875rem 1.25rem', backgroundColor: 'var(--scrollbar-track)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.25rem' }}>💡</div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Meeting safely on campus:</div>
                  <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                    <Warning size={14} weight="regular" />
                    <span>Never transfer money online to unknown sellers prior to receiving the book physically.</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                onClick={() => handleReport(selectedBook._id)}
              >
                <Warning size={14} weight="regular" />
                <span>Flag Listing</span>
              </button>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {user?.role === 'admin' && (
                  <button className="btn btn-danger" onClick={() => handleDeleteListing(selectedBook._id)}>
                    Purge listing
                  </button>
                )}
                <a
                  href={`mailto:${selectedBook.soldBy?.email}?subject=CampusConnect: Buying textbook "${selectedBook.title}"`}
                  className="btn btn-primary"
                >
                  <EnvelopeSimple size={16} weight="regular" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Books;
