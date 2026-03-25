import React, { useEffect, useState } from 'react';
import { 
    Calendar, Clock, User, CheckCircle, XCircle, Image as ImageIcon, 
    DollarSign, FileText, Eye, TrendingUp, Briefcase, AlertCircle,
    Filter, ChevronDown, BarChart3
} from 'lucide-react';
import './ArtistAppointments.css';

const API_BASE_URL = 'http://localhost:8000';

const ArtistAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showStats, setShowStats] = useState(true);
    
    // State for price quote modal
    const [quoteModal, setQuoteModal] = useState({
        isOpen: false,
        appointment: null,
        priceQuote: '',
        depositAmount: '',
        artistNotes: '',
        action: 'accept'
    });

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('access');
            const res = await fetch(`${API_BASE_URL}/api/appointments/artist/list/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAppointments(data.appointments || []);
                setStatistics(data.statistics || null);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // Helper to format date
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Helper to format time
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Check if appointment is upcoming
    const isUpcoming = (isoString) => {
        const apptDate = new Date(isoString);
        return apptDate > new Date();
    };

    // Filter appointments
    const filteredAppointments = appointments.filter(appt => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'upcoming') return appt.status === 'confirmed' && isUpcoming(appt.appointment_datetime);
        return appt.status === filterStatus;
    });

    // Open image modal
    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
    };

    // Close image modal
    const closeImageModal = () => {
        setSelectedImage(null);
    };

    // Open quote modal for accept
    const openAcceptModal = (appointment) => {
        setQuoteModal({
            isOpen: true,
            appointment,
            priceQuote: appointment.price_quote || '',
            depositAmount: appointment.deposit_amount || '',
            artistNotes: '',
            action: 'accept'
        });
    };

    // Open quote modal for decline
    const openDeclineModal = (appointment) => {
        setQuoteModal({
            isOpen: true,
            appointment,
            priceQuote: '',
            depositAmount: '',
            artistNotes: '',
            action: 'decline'
        });
    };

    // Close quote modal
    const closeQuoteModal = () => {
        setQuoteModal({
            isOpen: false,
            appointment: null,
            priceQuote: '',
            depositAmount: '',
            artistNotes: '',
            action: 'accept'
        });
    };

    // Handle accept/decline with API
    const handleManageAppointment = async () => {
        if (!quoteModal.appointment) return;

        setActionLoading(quoteModal.appointment.id);
        
        try {
            const token = localStorage.getItem('access');
            const payload = {
                action: quoteModal.action,
                artist_notes: quoteModal.artistNotes
            };

            if (quoteModal.action === 'accept') {
                if (!quoteModal.priceQuote) {
                    alert('Please enter a price quote');
                    setActionLoading(null);
                    return;
                }
                payload.price_quote = parseFloat(quoteModal.priceQuote);
                if (quoteModal.depositAmount) {
                    payload.deposit_amount = parseFloat(quoteModal.depositAmount);
                }
            }

            const res = await fetch(`${API_BASE_URL}/api/appointments/manage/${quoteModal.appointment.id}/`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (res.ok) {
                // Refresh data to get updated statistics
                await fetchAppointments();
                closeQuoteModal();
            } else {
                alert(data.error || 'Failed to update appointment');
            }
        } catch (error) {
            console.error("Error managing appointment:", error);
            alert('Connection error');
        } finally {
            setActionLoading(null);
        }
    };

    // Statistics Card Component
    const StatCard = ({ icon, label, value, color, subtext }) => (
        <div className="stat-card" style={{ borderLeftColor: color }}>
            <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="stat-info">
                <span className="stat-label">{label}</span>
                <span className="stat-value" style={{ color: color }}>{value}</span>
                {subtext && <span className="stat-subtext">{subtext}</span>}
            </div>
        </div>
    );

    if (loading) return <div className="loading-text">Loading appointments...</div>;

    return (
        <div className="appointments-wrapper">
            {/* Statistics Dashboard */}
            {statistics && showStats && (
                <div className="statistics-section">
                    <div className="stats-header">
                        <h3><BarChart3 size={20} /> Dashboard Overview</h3>
                        <button 
                            className="toggle-stats-btn"
                            onClick={() => setShowStats(!showStats)}
                        >
                            <ChevronDown size={16} className={showStats ? 'rotated' : ''} />
                        </button>
                    </div>
                    <div className="stats-grid">
                        <StatCard 
                            icon={<Briefcase size={20} />}
                            label="Total Requests"
                            value={statistics.total}
                            color="#6366f1"
                        />
                        <StatCard 
                            icon={<AlertCircle size={20} />}
                            label="Pending"
                            value={statistics.pending}
                            color="#f59e0b"
                            subtext="Awaiting your response"
                        />
                        <StatCard 
                            icon={<CheckCircle size={20} />}
                            label="Confirmed"
                            value={statistics.confirmed}
                            color="#10b981"
                            subtext={`${statistics.upcoming} upcoming`}
                        />
                        <StatCard 
                            icon={<XCircle size={20} />}
                            label="Declined"
                            value={statistics.cancelled}
                            color="#ef4444"
                        />
                        <StatCard 
                            icon={<TrendingUp size={20} />}
                            label="Completed"
                            value={statistics.completed}
                            color="#3b82f6"
                        />
                        <StatCard 
                            icon={<DollarSign size={20} />}
                            label="Revenue"
                            value={`$${parseFloat(statistics.total_revenue || 0).toFixed(2)}`}
                            color="#8b5cf6"
                            subtext={`$${parseFloat(statistics.pending_revenue || 0).toFixed(2)} pending`}
                        />
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className="filter-section">
                <div className="filter-header">
                    <h2><Briefcase size={20} /> Appointment Requests</h2>
                    <div className="filter-controls">
                        <Filter size={16} />
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Appointments ({appointments.length})</option>
                            <option value="pending">Pending ({statistics?.pending || 0})</option>
                            <option value="confirmed">Confirmed ({statistics?.confirmed || 0})</option>
                            <option value="upcoming">Upcoming ({statistics?.upcoming || 0})</option>
                            <option value="completed">Completed ({statistics?.completed || 0})</option>
                            <option value="cancelled">Declined ({statistics?.cancelled || 0})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="appointments-list">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appt) => (
                        <div key={appt.id} className={`appt-card ${appt.status}`}>
                            <div className="appt-header">
                                <span className={`status-badge ${appt.status}`}>
                                    {appt.status.toUpperCase()}
                                </span>
                                <div className="appt-meta">
                                    {appt.status === 'confirmed' && isUpcoming(appt.appointment_datetime) && (
                                        <span className="upcoming-badge">UPCOMING</span>
                                    )}
                                    <span className="appt-date">
                                        <Calendar size={14} /> {formatDate(appt.appointment_datetime)}
                                    </span>
                                </div>
                            </div>

                            <div className="appt-body">
                                <div className="client-info">
                                    <h3>{appt.session_type || "Tattoo Session"}</h3>
                                    <p className="client-name">
                                        <User size={14} /> {appt.customer_name || `Client ID: ${appt.customer}`}
                                    </p>
                                    <p className="time-slot">
                                        <Clock size={14} /> {formatTime(appt.appointment_datetime)}
                                    </p>
                                    <p className="duration">Duration: {appt.estimated_duration_hours} hour(s)</p>
                                </div>
                                <div className="appt-details">
                                    <p><strong>Placement:</strong> {appt.placement}</p>
                                    <p><strong>Style:</strong> {appt.tattoo_style || 'Not specified'}</p>
                                    <p><strong>Size:</strong> {appt.size_description || 'Not specified'}</p>
                                    <p className="description"><strong>Idea:</strong> {appt.description}</p>
                                    
                                    {/* Price Quote Display */}
                                    {appt.price_quote && (
                                        <p className="price-display">
                                            <DollarSign size={14} /> 
                                            <strong>Quote:</strong> ${appt.price_quote}
                                            {appt.deposit_amount && (
                                                <span className="deposit"> (Deposit: ${appt.deposit_amount})</span>
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Reference Image Section */}
                            {appt.reference_image_url && (
                                <div className="reference-image-section">
                                    <p className="section-label"><ImageIcon size={14} /> Reference Image</p>
                                    <div className="reference-image-container">
                                        <img 
                                            src={appt.reference_image_url} 
                                            alt="Reference" 
                                            className="reference-image-thumbnail"
                                            onClick={() => openImageModal(appt.reference_image_url)}
                                        />
                                        <button 
                                            className="view-image-btn"
                                            onClick={() => openImageModal(appt.reference_image_url)}
                                        >
                                            <Eye size={16} /> View Full Size
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Artist Notes (if any) */}
                            {appt.artist_notes && (
                                <div className="artist-notes">
                                    <p className="section-label"><FileText size={14} /> Your Notes</p>
                                    <p className="notes-text">{appt.artist_notes}</p>
                                </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="appt-actions">
                                {appt.status === 'pending' && (
                                    <>
                                        <button 
                                            className="btn-accept" 
                                            onClick={() => openAcceptModal(appt)}
                                            disabled={actionLoading === appt.id}
                                        >
                                            <CheckCircle size={16}/> 
                                            {actionLoading === appt.id ? 'Processing...' : 'Accept & Quote'}
                                        </button>
                                        <button 
                                            className="btn-decline" 
                                            onClick={() => openDeclineModal(appt)}
                                            disabled={actionLoading === appt.id}
                                        >
                                            <XCircle size={16}/> 
                                            {actionLoading === appt.id ? 'Processing...' : 'Decline'}
                                        </button>
                                    </>
                                )}
                                {appt.status === 'confirmed' && (
                                    <button 
                                        className="btn-update"
                                        onClick={() => openAcceptModal(appt)}
                                    >
                                        <DollarSign size={16}/> Update Quote
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">
                        <Briefcase size={48} />
                        <p>No {filterStatus !== 'all' ? filterStatus : ''} appointments found.</p>
                        {filterStatus !== 'all' && (
                            <button 
                                className="clear-filter-btn"
                                onClick={() => setFilterStatus('all')}
                            >
                                Show All
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div className="image-modal-overlay" onClick={closeImageModal}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={closeImageModal}>×</button>
                        <img src={selectedImage} alt="Reference Full Size" className="image-modal-img" />
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {quoteModal.isOpen && (
                <div className="quote-modal-overlay" onClick={closeQuoteModal}>
                    <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>
                            {quoteModal.action === 'accept' 
                                ? 'Accept Appointment & Set Price' 
                                : 'Decline Appointment'}
                        </h3>
                        
                        {quoteModal.action === 'accept' && (
                            <div className="quote-form">
                                <div className="form-group">
                                    <label>
                                        <DollarSign size={14} /> Price Quote *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={quoteModal.priceQuote}
                                        onChange={(e) => setQuoteModal({...quoteModal, priceQuote: e.target.value})}
                                        placeholder="Enter total price"
                                        className="price-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <DollarSign size={14} /> Deposit Amount (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={quoteModal.depositAmount}
                                        onChange={(e) => setQuoteModal({...quoteModal, depositAmount: e.target.value})}
                                        placeholder="Required deposit amount"
                                        className="price-input"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>
                                <FileText size={14} /> Notes (Optional)
                            </label>
                            <textarea
                                value={quoteModal.artistNotes}
                                onChange={(e) => setQuoteModal({...quoteModal, artistNotes: e.target.value})}
                                placeholder={quoteModal.action === 'accept' 
                                    ? "Add any notes about the design, materials needed, etc." 
                                    : "Reason for declining (optional)"}
                                rows="3"
                                className="notes-input"
                            />
                        </div>

                        <div className="quote-modal-actions">
                            <button 
                                className="btn-cancel" 
                                onClick={closeQuoteModal}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                className={quoteModal.action === 'accept' ? 'btn-confirm-accept' : 'btn-confirm-decline'}
                                onClick={handleManageAppointment}
                                disabled={actionLoading}
                            >
                                {actionLoading 
                                    ? 'Processing...' 
                                    : quoteModal.action === 'accept' 
                                        ? 'Accept & Send Quote' 
                                        : 'Decline Appointment'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistAppointments;