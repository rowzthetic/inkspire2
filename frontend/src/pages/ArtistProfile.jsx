import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Instagram, Calendar, Clock, User, X, Info, ChevronLeft, Check, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ArtistProfile.css';

const API_BASE_URL = 'http://localhost:8000';

// Placement options matching backend
const PLACEMENT_OPTIONS = [
  { value: 'arm_outer', label: 'Outer Arm / Shoulder' },
  { value: 'forearm', label: 'Inner Forearm' },
  { value: 'thigh', label: 'Thigh' },
  { value: 'calf', label: 'Calf' },
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'neck', label: 'Neck' },
  { value: 'ribs', label: 'Ribs / Side' },
  { value: 'stomach', label: 'Stomach' },
  { value: 'hands', label: 'Hands / Fingers' },
  { value: 'feet', label: 'Feet / Ankle' },
  { value: 'spine', label: 'Spine' },
];

const SESSION_TYPES = [
  { value: 'consultation', label: 'Consultation (15-30 mins)' },
  { value: 'tattoo', label: 'Tattoo Session' },
  { value: 'touchup', label: 'Touch-up' },
];

const ArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal & Booking State
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [bookingDate, setBookingDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Multi-step modal state
  const [modalStep, setModalStep] = useState('slots'); // 'slots', 'form', 'success', 'error'
  const [selectedTime, setSelectedTime] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    session_type: 'tattoo',
    tattoo_style: '',
    placement: '',
    size_description: '',
    description: '',
    reference_image: null,
    estimated_duration_hours: 1,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchArtistDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/artists/${id}/`);
        if (!res.ok) throw new Error("Artist not found");
        const data = await res.json();
        setArtist(data);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchArtistDetails();
  }, [id]);

  // Handle clicking a day card
  const handleDayClick = async (dayName, dayIndex) => {
    setSelectedDay(dayName);
    setShowModal(true);
    setModalStep('slots');
    setLoadingSlots(true);
    setSelectedTime(null);
    setSubmitError(null);

    const targetDate = getNextDayDate(dayIndex);
    setBookingDate(targetDate);

    try {
      const res = await fetch(`${API_BASE_URL}/api/appointments/slots/${id}/?date=${targetDate}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error("Error fetching slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSlots([]);
    setModalStep('slots');
    setSelectedTime(null);
    setFormErrors({});
    setSubmitError(null);
    // Reset form
    setFormData({
      session_type: 'tattoo',
      tattoo_style: '',
      placement: '',
      size_description: '',
      description: '',
      reference_image: null,
      estimated_duration_hours: 1,
    });
  };

  const handleBookSlot = (time) => {
    if (!user) {
      alert("Please login to book an appointment.");
      return;
    }
    setSelectedTime(time);
    setModalStep('form');
  };

  const handleBackToSlots = () => {
    setModalStep('slots');
    setSelectedTime(null);
    setFormErrors({});
    setSubmitError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, reference_image: 'File size must be less than 5MB' }));
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFormErrors(prev => ({ ...prev, reference_image: 'Please upload an image file' }));
        return;
      }
      setFormData(prev => ({ ...prev, reference_image: file }));
      setFormErrors(prev => ({ ...prev, reference_image: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.session_type) errors.session_type = 'Session type is required';
    if (!formData.placement) errors.placement = 'Placement is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.estimated_duration_hours || formData.estimated_duration_hours < 1) {
      errors.estimated_duration_hours = 'Duration must be at least 1 hour';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const submitData = new FormData();
    submitData.append('artist', id);
    submitData.append('date', bookingDate);
    submitData.append('time', selectedTime);
    submitData.append('session_type', formData.session_type);
    submitData.append('placement', formData.placement);
    submitData.append('description', formData.description);
    submitData.append('estimated_duration_hours', formData.estimated_duration_hours);

    if (formData.tattoo_style) submitData.append('tattoo_style', formData.tattoo_style);
    if (formData.size_description) submitData.append('size_description', formData.size_description);
    if (formData.reference_image) submitData.append('reference_image', formData.reference_image);

    try {
      const token = localStorage.getItem('access');
      const res = await fetch(`${API_BASE_URL}/api/appointments/book/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await res.json();

      if (res.ok) {
        setModalStep('success');
      } else {
        setSubmitError(data.error || data.message || 'Failed to book appointment. Please try again.');
        setModalStep('error');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      setSubmitError('Network error. Please check your connection and try again.');
      setModalStep('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    closeModal();
    navigate('/dashboard');
  };

  const handleRetry = () => {
    setModalStep('form');
    setSubmitError(null);
  };

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (!artist) return <div className="error-screen">Artist not found.</div>;

  return (
    <div className="profile-container">
      {/* HERO SECTION */}
      <div className="profile-hero">
        <div className="hero-content">
          <div className="profile-image-large">
            {artist.profile_picture ? (
              <img src={artist.profile_picture.startsWith('http') ? artist.profile_picture : `${API_BASE_URL}${artist.profile_picture}`} alt={artist.username} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={60} color="#666" /></div>
            )}
          </div>
          <div className="hero-text">
            <h1>{artist.username}</h1>
            <p className="artist-tagline">{artist.styles || "Professional Tattoo Artist"}</p>
            <div className="meta-info">
              {artist.city && <span><MapPin size={16} /> {artist.city}</span>}
              {artist.shop_name && <span>• {artist.shop_name}</span>}
            </div>
            <p className="artist-bio">{artist.bio || "No bio available."}</p>

            <div className="profile-actions">
              {artist.instagram_link && (
                <a href={artist.instagram_link} target="_blank" rel="noreferrer" className="insta-link">
                  <Instagram size={20} /> Follow on Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-body">
        {/* SCHEDULE SECTION */}
        <div className="section-block">
          <h2><Clock size={24} /> Availability</h2>

          <div className="booking-instruction">
            <Info size={18} color="#dc2626" />
            <span>Select a <strong>Day</strong> below to see available slots and <strong>Book</strong> your session.</span>
          </div>

          <div className="schedule-grid">
            {artist.schedule && artist.schedule.map((day) => (
              <div
                key={day.id}
                className={`schedule-card ${day.is_active ? 'open clickable' : 'closed'}`}
                onClick={() => day.is_active && handleDayClick(day.day_name, day.day_of_week)}
                style={{ cursor: day.is_active ? 'pointer' : 'default' }}
              >
                <div className="day-name">{day.day_name}</div>
                <div className="hours">
                  {day.is_active ? (
                    <>
                      <span>{formatTime(day.start_time)} - {formatTime(day.end_time)}</span>
                      {day.break_start && <small style={{ display: 'block', fontSize: '0.7rem', color: '#666' }}>Lunch: {formatTime(day.break_start)}</small>}
                    </>
                  ) : <span className="closed-badge">Closed</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PORTFOLIO SECTION */}
        <div className="section-block">
          <h2><Calendar size={24} /> Portfolio</h2>
          <div className="portfolio-grid">
            {artist.portfolio && artist.portfolio.length > 0 ? (
              artist.portfolio.map((img) => (
                <div key={img.id} className="gallery-item">
                  <img src={`${img.image}`} alt="Tattoo work" />
                </div>
              ))
            ) : (
              <p style={{ color: '#666' }}>No portfolio images uploaded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* POP-UP MODAL - Multi-step */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                {modalStep === 'form' && (
                  <button className="back-btn" onClick={handleBackToSlots} aria-label="Go back">
                    <ChevronLeft size={22} />
                  </button>
                )}
                <span className="modal-day-badge">{selectedDay}</span>
                <div className="modal-date-info">
                  <h3>
                    {modalStep === 'slots' && 'Select Time'}
                    {modalStep === 'form' && 'Booking Details'}
                    {modalStep === 'success' && 'Booking Confirmed!'}
                    {modalStep === 'error' && 'Booking Failed'}
                  </h3>
                  <span className="modal-subtitle">
                    {modalStep === 'slots' && formatDisplayDate(bookingDate)}
                    {modalStep === 'form' && `${formatDisplayDate(bookingDate)} at ${formatTime12Hour(selectedTime)}`}
                    {modalStep === 'success' && 'Your appointment request has been sent'}
                    {modalStep === 'error' && 'Something went wrong'}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={closeModal} aria-label="Close modal">
                <X size={22} />
              </button>
            </div>

            {/* Step Indicator */}
            {(modalStep === 'slots' || modalStep === 'form') && (
              <div className="step-indicator">
                <div className={`step ${modalStep === 'slots' || modalStep === 'form' ? 'active' : ''}`}>
                  <div className="step-number">1</div>
                  <span className="step-label">Select Time</span>
                </div>
                <div className="step-connector"></div>
                <div className={`step ${modalStep === 'form' ? 'active' : ''}`}>
                  <div className="step-number">2</div>
                  <span className="step-label">Booking Details</span>
                </div>
              </div>
            )}

            <div className="modal-body">
              {/* STEP 1: Time Slots */}
              {modalStep === 'slots' && (
                <>
                  {loadingSlots ? (
                    <div className="loading-state">
                      <div className="loading-spinner"></div>
                      <p>Loading available slots...</p>
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Calendar size={48} />
                      </div>
                      <h4>No slots available</h4>
                      <p>There are no available time slots for this day.</p>
                      <button className="empty-action-btn" onClick={closeModal}>
                        Choose another day
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="slots-legend">
                        <div className="legend-item">
                          <span className="legend-dot available"></span>
                          <span>Available</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-dot occupied"></span>
                          <span>Booked</span>
                        </div>
                      </div>

                      <div className="slots-grid-popup">
                        {slots.map((slot, index) => (
                          <button
                            key={index}
                            disabled={!slot.available}
                            onClick={() => handleBookSlot(slot.value)}
                            className={`slot-popup-btn ${slot.available ? 'available' : 'occupied'}`}
                          >
                            <span className="slot-time">{slot.time}</span>
                            {slot.available ? (
                              <span className="slot-action">Book</span>
                            ) : (
                              <span className="slot-status">Booked</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <p className="modal-footer-text">
                        Click on an available slot to proceed with booking
                      </p>
                    </>
                  )}
                </>
              )}

              {/* STEP 2: Booking Form */}
              {modalStep === 'form' && (
                <form onSubmit={handleSubmit} className="booking-form">
                  <div className="form-group">
                    <label htmlFor="session_type">Session Type *</label>
                    <select
                      id="session_type"
                      name="session_type"
                      value={formData.session_type}
                      onChange={handleInputChange}
                      className={formErrors.session_type ? 'error' : ''}
                    >
                      {SESSION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {formErrors.session_type && <span className="error-message">{formErrors.session_type}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="tattoo_style">Tattoo Style</label>
                      <input
                        type="text"
                        id="tattoo_style"
                        name="tattoo_style"
                        value={formData.tattoo_style}
                        onChange={handleInputChange}
                        placeholder="e.g., Traditional, Realism, Fine Line"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="placement">Placement *</label>
                      <select
                        id="placement"
                        name="placement"
                        value={formData.placement}
                        onChange={handleInputChange}
                        className={formErrors.placement ? 'error' : ''}
                      >
                        <option value="">Select placement</option>
                        {PLACEMENT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {formErrors.placement && <span className="error-message">{formErrors.placement}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="size_description">Size Description</label>
                      <input
                        type="text"
                        id="size_description"
                        name="size_description"
                        value={formData.size_description}
                        onChange={handleInputChange}
                        placeholder="e.g., Palm-size, Full Sleeve"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="estimated_duration_hours">Duration (hours) *</label>
                      <input
                        type="number"
                        id="estimated_duration_hours"
                        name="estimated_duration_hours"
                        min="1"
                        max="8"
                        value={formData.estimated_duration_hours}
                        onChange={handleInputChange}
                        className={formErrors.estimated_duration_hours ? 'error' : ''}
                      />
                      {formErrors.estimated_duration_hours && <span className="error-message">{formErrors.estimated_duration_hours}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Design Description *</label>
                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your tattoo idea in detail..."
                      className={formErrors.description ? 'error' : ''}
                    />
                    {formErrors.description && <span className="error-message">{formErrors.description}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="reference_image">Reference Image</label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        id="reference_image"
                        name="reference_image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      <label htmlFor="reference_image" className="file-upload-label">
                        <Upload size={18} />
                        <span>{formData.reference_image ? formData.reference_image.name : 'Choose an image (max 5MB)'}</span>
                      </label>
                    </div>
                    {formErrors.reference_image && <span className="error-message">{formErrors.reference_image}</span>}
                    {formData.reference_image && (
                      <div className="file-preview">
                        <img
                          src={URL.createObjectURL(formData.reference_image)}
                          alt="Preview"
                          className="image-preview"
                        />
                        <button
                          type="button"
                          className="remove-file-btn"
                          onClick={() => setFormData(prev => ({ ...prev, reference_image: null }))}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleBackToSlots}
                      disabled={isSubmitting}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="spin" />
                          Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: Success */}
              {modalStep === 'success' && (
                <div className="success-state">
                  <div className="success-icon">
                    <Check size={48} />
                  </div>
                  <h4>Booking Request Sent!</h4>
                  <p>Your appointment request has been sent to {artist.username}. You'll receive an email once they confirm your booking.</p>
                  <div className="success-actions">
                    <button className="btn-primary" onClick={handleGoToDashboard}>
                      View My Bookings
                    </button>
                    <button className="btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Error */}
              {modalStep === 'error' && (
                <div className="error-state">
                  <div className="error-icon">
                    <X size={48} />
                  </div>
                  <h4>Booking Failed</h4>
                  <p>{submitError}</p>
                  <div className="error-actions">
                    <button className="btn-primary" onClick={handleRetry}>
                      Try Again
                    </button>
                    <button className="btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Utils
function formatTime(time) {
  if (!time) return "";
  const [hour, minute] = time.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

function formatTime12Hour(timeString) {
  if (!timeString) return '';
  const [hour, minute] = timeString.split(':');
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minute} ${ampm}`;
}

function getNextDayDate(pythonDayIndex) {
  const jsDayMap = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 0 };
  const targetDay = jsDayMap[pythonDayIndex];
  const date = new Date();
  const currentDay = date.getDay();
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) daysUntil += 7;
  date.setDate(date.getDate() + daysUntil);
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

export default ArtistProfile;
