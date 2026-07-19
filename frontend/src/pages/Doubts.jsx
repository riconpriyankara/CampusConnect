import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import { MagnifyingGlass, Plus, ThumbsUp, Eye, Check, X, ArrowLeft, PaperPlaneTilt, Sparkle, ChatCircle, Warning, ShieldCheck, CaretLeft, CaretRight } from '@phosphor-icons/react';
import './Doubts.css';

const Doubts = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const getDoubtCode = (doubt, index) => {
    const idx = String(index + 1).padStart(3, '0');
    return `Q·${idx}`;
  };

  // Forum list state
  const [doubts, setDoubts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalDoubts, setTotalDoubts] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState('latest');

  // Modal toggler
  const [showAskModal, setShowAskModal] = useState(false);

  // Ask Question form state
  const [askTitle, setAskTitle] = useState('');
  const [askDesc, setAskDesc] = useState('');
  const [askTags, setAskTags] = useState('');
  const [submittingAsk, setSubmittingAsk] = useState(false);

  // Thread Detailed view state
  const [threadDoubtId, setThreadDoubtId] = useState(null);
  const [threadDoubt, setThreadDoubt] = useState(null);
  const [threadAnswers, setThreadAnswers] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  
  // Post answer editor state
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Load doubt questions list
  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (tag) params.append('tag', tag);
      if (sort) params.append('sort', sort);
      params.append('page', page);
      params.append('limit', '10');

      const res = await api.get(`/api/doubts?${params.toString()}`);
      if (res.data.success) {
        setDoubts(res.data.doubts);
        setPages(res.data.pages);
        setTotalDoubts(res.data.total);
      }
    } catch (error) {
      showToast('Failed to load questions.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch list if not currently focusing on a thread
    if (!threadDoubtId) {
      fetchDoubts();
    }
  }, [search, tag, sort, page, threadDoubtId]);

  // Load details thread or ask modal if query in URL changes
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('action') === 'ask') {
      setShowAskModal(true);
    }
    const id = query.get('id');
    if (id) {
      setThreadDoubtId(id);
      loadDoubtThread(id);
    } else {
      setThreadDoubtId(null);
      setThreadDoubt(null);
      setThreadAnswers([]);
    }
  }, [location.search]);

  const loadDoubtThread = async (id) => {
    try {
      setThreadLoading(true);
      const res = await api.get(`/api/doubts/${id}`);
      if (res.data.success) {
        setThreadDoubt(res.data.doubt);
        setThreadAnswers(res.data.answers);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load thread details', 'error');
      navigate('/doubts');
    } finally {
      setThreadLoading(false);
    }
  };

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!askTitle || !askDesc) {
      return showToast('Title and Description are required', 'error');
    }

    setSubmittingAsk(true);
    try {
      const res = await api.post('/api/doubts', {
        title: askTitle,
        description: askDesc,
        tags: askTags,
      });

      if (res.data.success) {
        showToast('Question posted successfully!', 'success');
        setAskTitle('');
        setAskDesc('');
        setAskTags('');
        setShowAskModal(false);
        fetchDoubts();
      }
    } catch (error) {
      showToast('Failed to post question.', 'error');
    } finally {
      setSubmittingAsk(false);
    }
  };

  const handleDoubtUpvote = async (id) => {
    try {
      const res = await api.post(`/api/doubts/${id}/upvote`);
      if (res.data.success) {
        showToast(res.data.upvoted ? 'Question upvoted' : 'Upvote removed', 'success');
        
        // Update list state if available
        setDoubts((prev) =>
          prev.map((d) => (d._id === id ? { ...d, upvotes: res.data.upvotes, upvotesCount: res.data.upvotesCount } : d))
        );

        // Update active thread state if matches
        if (threadDoubt && threadDoubt._id === id) {
          setThreadDoubt((prev) => ({ ...prev, upvotes: res.data.upvotes }));
        }
      }
    } catch (error) {
      showToast('Could not perform vote action.', 'error');
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    setSubmittingAnswer(true);
    try {
      const res = await api.post(`/api/doubts/${threadDoubtId}/answers`, {
        content: answerContent.trim(),
      });

      if (res.data.success) {
        showToast('Answer posted successfully!', 'success');
        setAnswerContent('');
        
        // Prepend new answer to list with user populated
        const fullNewAnswer = {
          ...res.data.answer,
          author: {
            _id: user._id,
            name: user.name,
            department: user.department,
            profilePic: user.profilePic,
          },
        };
        
        setThreadAnswers((prev) => [...prev, fullNewAnswer]);
      }
    } catch (error) {
      showToast('Failed to send answer.', 'error');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleAnswerUpvote = async (answerId) => {
    try {
      const res = await api.post(`/api/doubts/answers/${answerId}/upvote`);
      if (res.data.success) {
        setThreadAnswers((prev) =>
          prev.map((ans) =>
            ans._id === answerId
              ? { ...ans, upvotes: res.data.upvotes }
              : ans
          )
        );
        showToast(res.data.upvoted ? 'Answer liked' : 'Like removed', 'success');
      }
    } catch (error) {
      showToast('Failed to toggle upvote.', 'error');
    }
  };

  const handleAcceptToggle = async (answerId) => {
    try {
      const res = await api.put(`/api/doubts/answers/${answerId}/accept`);
      if (res.data.success) {
        showToast(res.data.isAccepted ? 'Answer marked as accepted' : 'Answer unmarked', 'success');
        
        setThreadAnswers((prev) =>
          prev.map((ans) => ({
            ...ans,
            isAccepted: ans._id === answerId ? res.data.isAccepted : false,
          }))
        );

        setThreadDoubt((prev) => ({
          ...prev,
          acceptedAnswer: res.data.isAccepted ? answerId : null,
        }));
      }
    } catch (error) {
      showToast('Failed to update accepted status.', 'error');
    }
  };

  const handleDeleteDoubt = async (id) => {
    if (!window.confirm('Delete this doubt and all associated answers permanently?')) return;

    try {
      const res = await api.delete(`/api/doubts/${id}`);
      if (res.data.success) {
        showToast('Doubt discussion successfully deleted.', 'success');
        navigate('/doubts');
      }
    } catch (error) {
      showToast('Failed to delete doubt.', 'error');
    }
  };

  const handleReport = async (itemType, itemId) => {
    const reason = prompt(`Provide moderation reasons to report this ${itemType}:`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await api.post('/api/admin/reports', {
        itemType,
        itemId,
        reason: reason.trim(),
      });
      if (res.data.success) {
        showToast(`${itemType} flagged for moderation.`, 'success');
      }
    } catch (error) {
      showToast('Failed to file moderation request.', 'error');
    }
  };

  // Render Detailed Thread View
  if (threadDoubtId) {
    if (threadLoading) {
      return (
        <div className="doubts-container">
          <div className="discussion-back-btn" onClick={() => navigate('/doubts')}>
            <ArrowLeft size={16} weight="regular" /> Back to discussions
          </div>
          <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }}></div>
          <div className="skeleton-title" style={{ marginTop: '2rem' }}></div>
          <div className="skeleton" style={{ height: '100px' }}></div>
        </div>
      );
    }

    if (!threadDoubt) return null;

    const isQuestionOwner = threadDoubt.author?._id === user?._id || threadDoubt.author === user?._id;
    const isQuestionUpvoted = threadDoubt.upvotes?.includes(user?._id);

    return (
      <div className="doubts-container discussion-thread">
        {/* Back Link */}
        <div className="discussion-back-btn" onClick={() => navigate('/doubts')}>
          <ArrowLeft size={16} />
          <span>Back to Doubts</span>
        </div>

        {/* Core Question Card */}
        <section className="doubt-main-post">
          <div className="vote-widget">
            <button
              className={`vote-btn ${isQuestionUpvoted ? 'active' : ''}`}
              onClick={() => handleDoubtUpvote(threadDoubt._id)}
              aria-label="Upvote question"
            >
              <ThumbsUp size={18} />
            </button>
            <span className="vote-count">{threadDoubt.upvotes?.length || 0}</span>
          </div>

          <div className="doubt-content-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <img
                  src={threadDoubt.author?.profilePic ? threadDoubt.author.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(threadDoubt.author?.name || 'CC')}`}
                  alt="Author Avatar"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600 }}>{threadDoubt.author?.name}</div>
                  <div style={{ color: 'var(--color-text-muted)' }}>{threadDoubt.author?.department}</div>
                </div>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Asked {new Date(threadDoubt.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', marginTop: '0.5rem' }}>{threadDoubt.title}</h1>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
              {threadDoubt.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div className="doubt-row-tags">
                {threadDoubt.tags?.map((t) => (
                  <span
                    key={t}
                    className="doubt-row-tag"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setTag(t); navigate('/doubts'); }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                  onClick={() => handleReport('Doubt', threadDoubt._id)}
                >
                  <Warning size={14} weight="regular" />
                  <span>Report</span>
                </button>
                {(isQuestionOwner || user?.role === 'admin') && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteDoubt(threadDoubt._id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Answers List */}
        <section className="answers-section">
          <h2 className="answers-header">
            {threadAnswers.length} {threadAnswers.length === 1 ? 'Answer' : 'Answers'}
          </h2>
          
          {threadAnswers.map((ans) => {
            const isAnswerOwner = ans.author?._id === user?._id || ans.author === user?._id;
            const hasLiked = ans.upvotes?.includes(user?._id);
            return (
              <div key={ans._id} className={`answer-card ${ans.isAccepted ? 'accepted' : ''}`}>
                {ans.isAccepted && (
                  <span className="accepted-badge-indicator">
                    <Check size={12} weight="regular" />
                    <span>Accepted Answer</span>
                  </span>
                )}

                <div className="vote-widget" style={{ minWidth: '40px' }}>
                  <button
                    className={`vote-btn ${hasLiked ? 'active' : ''}`}
                    style={{ width: '32px', height: '32px' }}
                    onClick={() => handleAnswerUpvote(ans._id)}
                    aria-label="Upvote answer"
                  >
                    <ThumbsUp size={14} weight="regular" />
                  </button>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>{ans.upvotes?.length || 0}</span>
                </div>

                <div className="doubt-content-wrapper">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <img
                        src={ans.author?.profilePic ? ans.author.profilePic : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(ans.author?.name || 'CC')}`}
                        alt="Author Avatar"
                        style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{ans.author?.name}</span>
                      <span>({ans.author?.department})</span>
                    </div>
                    <span>{new Date(ans.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginTop: '0.5rem' }}>
                    {ans.content}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                    {isQuestionOwner && (
                      <button
                        className={`btn ${ans.isAccepted ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                        onClick={() => handleAcceptToggle(ans._id)}
                      >
                        <Check size={14} weight="regular" />
                        <span>{ans.isAccepted ? 'Unaccept' : 'Accept Answer'}</span>
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.1)' }}
                      onClick={() => handleReport('Answer', ans._id)}
                    >
                      <Warning size={12} weight="regular" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Add Answer Editor */}
        <section className="answer-editor-box">
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>Your Answer</h3>
          <form onSubmit={handleAnswerSubmit}>
            <textarea
              className="form-input"
              placeholder="Provide context, links, or code solutions to help..."
              rows="5"
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: '1rem', alignSelf: 'flex-end' }}
              disabled={submittingAnswer || !answerContent.trim()}
            >
              <PaperPlaneTilt size={16} weight="regular" />
              <span>{submittingAnswer ? 'Posting Answer...' : 'Post Answer'}</span>
            </button>
          </form>
        </section>
      </div>
    );
  }

  // Render Discussions List View
  return (
    <div className="doubts-container animate-fade">
      {/* Header */}
      <div className="notes-header-row">
        <div>
          <h1>Doubt Discussions</h1>
          <p style={{ color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
            Ask questions, tag courses, and share academic knowledge.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAskModal(true)}>
          <Plus size={18} weight="regular" />
          <span>Ask Question</span>
        </button>
      </div>

      {/* Filters & Sorting */}
      <div className="forum-tabs-bar">
        <div className="forum-tabs-row">
          <span
            className={`forum-tab ${sort === 'latest' ? 'active' : ''}`}
            onClick={() => { setSort('latest'); setPage(1); }}
          >
            Latest
          </span>
          <span
            className={`forum-tab ${sort === 'trending' ? 'active' : ''}`}
            onClick={() => { setSort('trending'); setPage(1); }}
          >
            Trending
          </span>
          <span
            className={`forum-tab ${sort === 'most_answered' ? 'active' : ''}`}
            onClick={() => { setSort('most_answered'); setPage(1); }}
          >
            Most Answered
          </span>
        </div>

        {/* Search */}
        <div className="filter-search-wrapper" style={{ width: '280px', flexGrow: 0 }}>
          <MagnifyingGlass className="filter-search-icon" size={16} weight="regular" />
          <input
            type="text"
            className="filter-search-input"
            style={{ padding: '0.4rem 1rem 0.4rem 2.2rem', fontSize: '0.85rem' }}
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Active tag banner */}
      {tag && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--scrollbar-track)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', width: 'fit-content' }}>
          <span>Filtering tag: <strong>#{tag}</strong></span>
          <button className="nav-icon-btn" onClick={() => { setTag(''); setPage(1); }} style={{ padding: '0.15rem' }}>
            <X size={14} weight="regular" />
          </button>
        </div>
      )}

      {/* Doubts Grid */}
      {loading ? (
        <div className="doubts-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-card" style={{ height: '90px' }}></div>
          ))}
        </div>
      ) : doubts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <h3 className="empty-title">No questions found</h3>
          <p className="empty-desc">No queries match your keyword or active tags. Post a new question to start discussions!</p>
          {(search || tag) && (
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setTag(''); }}>
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="doubts-list">
            {doubts.map((d) => (
              <div
                key={d._id}
                className="doubt-row-card"
                onClick={() => navigate(`/doubts?id=${d._id}`)}
              >
                <div className="doubt-row-left">
                  <h3 className="doubt-row-title">{d.title}</h3>
                  <div className="doubt-row-meta">
                    {d.tags?.map((t) => (
                      <span
                        key={t}
                        className="doubt-row-tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTag(t);
                          setPage(1);
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    {d.author?.name && (
                      <>
                        <span className="meta-dot">•</span>
                        <span className="doubt-author-text">Asked by {d.author.name}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="doubt-row-right">
                  <div className="doubt-stats-group">
                    <span className="doubt-row-stat" title="Upvotes">
                      <ThumbsUp size={14} weight="regular" />
                      {d.upvotesCount || d.upvotes?.length || 0}
                    </span>
                    <span className="doubt-row-stat" title="Views">
                      <Eye size={14} weight="regular" />
                      {d.viewsCount}
                    </span>
                  </div>
                  <div className="doubt-badges-group">
                    <span className="badge badge-primary">
                      {d.answersCount || 0} {d.answersCount === 1 ? 'Answer' : 'Answers'}
                    </span>
                    {d.acceptedAnswer && (
                      <span className="badge badge-success">✓ Solved</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

      {/* Ask Question Modal */}
      {showAskModal && (
        <div className="modal-overlay" onClick={() => setShowAskModal(false)}>
          <div className="modal-card animate-fade" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAskSubmit} style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
              <div className="modal-header">
                <h3>Ask Syllabus Doubt</h3>
                <button type="button" className="nav-icon-btn" onClick={() => setShowAskModal(false)}>
                  <X size={20} weight="regular" />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="E.g., Why does Dijkstra fail on negative edge weights?"
                    value={askTitle}
                    onChange={(e) => setAskTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description & code snippets *</label>
                  <textarea
                    className="form-input"
                    placeholder="Provide details about equations, course codes, or pseudocode snippets."
                    rows="5"
                    value={askDesc}
                    onChange={(e) => setAskDesc(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Algorithms, Graphs, CS301"
                    value={askTags}
                    onChange={(e) => setAskTags(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Press comma to separate tags. Max 5 tags recommended.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAskModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingAsk}>
                  {submittingAsk ? 'Posting...' : 'Post Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doubts;
