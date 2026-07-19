import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import './Auth.css';

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

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('1');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !department || !year) {
      return showToast('Please fill out all required fields', 'error');
    }

    if (password.length < 6) {
      return showToast('Password must be at least 6 characters long', 'error');
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('department', department);
    formData.append('year', year);
    formData.append('bio', bio);
    if (profilePic) {
      formData.append('profilePic', profilePic);
    }

    const res = await register(formData);
    setSubmitting(false);

    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card" style={{ maxWidth: '540px' }}>
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the ultimate hub for student collaboration</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Tony Stark"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">College Email *</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="tony@campusconnect.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="department">Department *</label>
              <select
                id="department"
                className="form-input form-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Dept</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="year">Year *</label>
              <select
                id="year"
                className="form-input"
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
            <label className="form-label" htmlFor="bio">Short Bio</label>
            <textarea
              id="bio"
              className="form-input"
              placeholder="Tell other students about yourself..."
              rows="2"
              maxLength="200"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Profile Picture</label>
            <div className="file-upload-input" onClick={() => document.getElementById('profilePicFile').click()}>
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }}
                />
              ) : (
                <>
                  <div style={{ fontSize: '1.5rem' }}>📷</div>
                  <div className="file-upload-text">Click to choose image or drag & drop</div>
                </>
              )}
            </div>
            <input
              type="file"
              id="profilePicFile"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="auth-redirect">
          <span>Already registered? </span>
          <span className="auth-redirect-link" onClick={() => navigate('/login')}>
            Sign in
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
