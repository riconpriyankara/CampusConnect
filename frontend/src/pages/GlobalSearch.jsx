import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { BookOpen, ShoppingBag, ChatCircle, CalendarBlank, MagnifyingGlass, ArrowRight, Eye, ThumbsUp, MapPin, Clock } from '@phosphor-icons/react';
import { getDeptCode } from '../utils/deptHelper';

const GlobalSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const getNoteCode = (note, index) => {
    const dept = getDeptCode(note.department);
    const sem = note.semester || '1';
    const idx = String(index + 1).padStart(2, '0');
    return `N·${dept}·${sem}${idx}`;
  };

  const getBookCode = (book, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `BK·${idx}`;
  };

  const getDoubtCode = (doubt, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `Q·${idx}`;
  };

  const getEventCode = (event, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `EVT·${idx}`;
  };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ notes: [], books: [], doubts: [], events: [] });
  const [loading, setLoading] = useState(true);

  // Read URL query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('q') || '';
    setQuery(q);

    if (q.trim()) {
      fetchSearchResults(q.trim());
    } else {
      setResults({ notes: [], books: [], doubts: [], events: [] });
      setLoading(false);
    }
  }, [location.search]);

  const fetchSearchResults = async (searchQuery) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.data.success) {
        setResults(res.data.results);
      }
    } catch (error) {
      showToast('Global search lookup failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const totalResults =
    results.notes.length +
    results.books.length +
    results.doubts.length +
    results.events.length;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <h2>Searching for "{query}"...</h2>
        <div className="skeleton" style={{ height: '120px' }}></div>
        <div className="skeleton" style={{ height: '120px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }} className="animate-fade">
      {/* Search Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
          <MagnifyingGlass size={16} />
          <span>Global Search Results</span>
        </div>
        <h1>
          Found {totalResults} matches for "{query}"
        </h1>
      </div>

      {totalResults === 0 ? (
        <div className="empty-state" style={{ margin: '0 auto' }}>
          <span className="empty-icon">🔍</span>
          <h3 className="empty-title">No matches found</h3>
          <p className="empty-desc">We couldn't find any lecture notes, book listings, doubt forum queries, or campus events matching "{query}".</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          
          {/* Notes Results */}
          {results.notes.length > 0 && (
            <div>
              <div className="section-title-row">
                <h2>
                  <BookOpen size={18} weight="regular" style={{ color: 'var(--cat-notes)' }} />
                  <span>Notes ({results.notes.length})</span>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {results.notes.map((n) => (
                  <div key={n._id} className="card" onClick={() => navigate(`/notes?id=${n._id}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span className="badge badge-notes">{n.subject || n.department}</span>
                      </div>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>{n.title}</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
                        {n.description.length > 80 ? `${n.description.substring(0, 80)}...` : n.description}
                      </p>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>Sem {n.semester} • {n.subject}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Books Results */}
          {results.books.length > 0 && (
            <div>
              <div className="section-title-row">
                <h2>
                  <ShoppingBag size={18} weight="regular" style={{ color: 'var(--cat-books)' }} />
                  <span>Textbooks ({results.books.length})</span>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {results.books.map((b) => (
                  <div key={b._id} className="card" onClick={() => navigate('/books')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span className="badge badge-warning">{b.department}</span>
                      </div>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>{b.title}</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
                        {b.description.length > 80 ? `${b.description.substring(0, 80)}...` : b.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                      <span style={{ fontWeight: '700', color: 'var(--cat-books)' }}>₹{b.price}</span>
                      <span style={{ color: 'var(--ink-muted)' }}>Condition: {b.condition}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doubt Discussions */}
          {results.doubts.length > 0 && (
            <div>
              <div className="section-title-row">
                <h2>
                  <ChatCircle size={18} weight="regular" style={{ color: 'var(--cat-doubts)' }} />
                  <span>Questions ({results.doubts.length})</span>
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.doubts.map((d) => (
                  <div key={d._id} className="card" onClick={() => navigate(`/doubts?id=${d._id}`)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{d.title}</h3>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                        {d.tags?.map((t) => (
                          <span key={t} className="doubt-row-tag">#{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--ink-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ThumbsUp size={12} weight="regular" />
                        {d.upvotes?.length || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Eye size={12} weight="regular" />
                        {d.viewsCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Results */}
          {results.events.length > 0 && (
            <div>
              <div className="section-title-row">
                <h2>
                  <CalendarBlank size={18} weight="regular" style={{ color: 'var(--cat-events)' }} />
                  <span>Events ({results.events.length})</span>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {results.events.map((e) => (
                  <div key={e._id} className="card" onClick={() => navigate('/events')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span className="badge badge-success">{e.department || 'Campus Event'}</span>
                      </div>
                      <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: '0.5rem', fontFamily: 'var(--font-display)' }}>{e.title}</h3>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', marginBottom: '1rem', fontFamily: 'var(--font-body)' }}>
                        {e.description.length > 80 ? `${e.description.substring(0, 80)}...` : e.description}
                      </p>
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} />
                        {e.venue}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {e.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
