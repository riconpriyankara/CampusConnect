import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, ShoppingBag, ChatCircle, CalendarBlank } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/notes');
    }
  };

  return (
    <div className="home-container animate-fade">
      {/* Home Header */}
      <header className="home-nav">
        <div className="home-logo" onClick={() => navigate('/')}>
          <span>Campus</span>
          <span className="logo-accent">Connect</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-text">
          <h1 className="home-hero-tagline">
            The campus hub for notes, textbooks, and course doubts.
          </h1>
          <p className="home-hero-desc">
            Find lecture notes from students who took the course last semester, buy second-hand textbooks directly on campus, and get answers when you're stuck at 2 AM.
          </p>
          <div className="home-hero-actions">
            <button className="btn btn-primary" onClick={handleStartClick}>
              <span>Browse Campus Library</span>
              <ArrowRight size={16} weight="regular" />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/register')}>
              Join Your Campus
            </button>
          </div>
        </div>

        <div className="home-hero-image">
          <div className="hero-ledger-stack">
            <div className="ledger-card index-card-1">
              <div className="ledger-card-header">
                <span className="badge badge-notes">Computer Science</span>
                <span className="badge badge-primary">Notes</span>
              </div>
              <h3 className="ledger-card-title">CS204 Algorithms Midterm Sheet</h3>
              <div className="ledger-card-meta">By Tony Stark • 42 Downloads • PDF</div>
            </div>
            <div className="ledger-card index-card-2">
              <div className="ledger-card-header">
                <span className="badge badge-notes">Computer Science</span>
                <span className="badge badge-warning">Textbook</span>
              </div>
              <h3 className="ledger-card-title">CLRS Algorithms (3rd Ed)</h3>
              <div className="ledger-card-meta">Like New • ₹1,200 • North Campus</div>
            </div>
            <div className="ledger-card index-card-3">
              <div className="ledger-card-header">
                <span className="badge badge-notes">Electrical Eng</span>
                <span className="badge badge-success">Forum</span>
              </div>
              <h3 className="ledger-card-title">Bellman-Ford negative cycle pass</h3>
              <div className="ledger-card-meta">1 accepted answer • 1 day ago</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="home-features">
        <div className="home-features-header">
          <h2>Built for the stuff WhatsApp groups keep losing</h2>
          <p>No buried PDFs, no expired drive links, no spamming class chats.</p>
        </div>

        <div className="home-directory-tiles">
          <div className="directory-tile notes-tile featured-tile" onClick={() => navigate('/notes')}>
            <div className="tile-header">
              <div className="tile-icon-wrap" style={{ color: 'var(--cat-notes)' }}>
                <BookOpen size={22} weight="regular" />
              </div>
              <span className="tile-tag">Popular</span>
            </div>
            <h3>Course Notes & Revision Sheets</h3>
            <p className="tile-desc">
              Grab lecture PDFs and handwritten formula sheets shared by students who already cleared the course. Sorted by department and semester so you don't have to scroll through WhatsApp history.
            </p>
            <span className="tile-arrow">Browse Notes →</span>
          </div>

          <div className="directory-tile books-tile featured-tile" onClick={() => navigate('/books')}>
            <div className="tile-header">
              <div className="tile-icon-wrap" style={{ color: 'var(--cat-books)' }}>
                <ShoppingBag size={22} weight="regular" />
              </div>
              <span className="tile-tag">Marketplace</span>
            </div>
            <h3>Textbook Marketplace</h3>
            <p className="tile-desc">
              List your old engineering books in under a minute or buy second-hand copies directly from seniors on campus. No shipping fees or waiting—just meet near the canteen.
            </p>
            <span className="tile-arrow">Explore Books →</span>
          </div>

          <div className="directory-tile doubts-tile" onClick={() => navigate('/doubts')}>
            <div className="tile-icon-wrap" style={{ color: 'var(--cat-doubts)' }}>
              <ChatCircle size={22} weight="regular" />
            </div>
            <h3>Peer Doubt Forum</h3>
            <p className="tile-desc">
              Stuck on a problem set? Ask questions tagged by topic and get step-by-step answers from seniors who already cleared the course.
            </p>
            <span className="tile-arrow">View Doubts →</span>
          </div>

          <div className="directory-tile events-tile" onClick={() => navigate('/events')}>
            <div className="tile-icon-wrap" style={{ color: 'var(--cat-events)' }}>
              <CalendarBlank size={22} weight="regular" />
            </div>
            <h3>Events & Hackathons</h3>
            <p className="tile-desc">
              Stay looped in on upcoming hackathons, guest lectures, and student club workshops happening around your building.
            </p>
            <span className="tile-arrow">See Schedule →</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; {new Date().getFullYear()} Campus Connect. Built for students.</p>
      </footer>
    </div>
  );
};

export default Home;
