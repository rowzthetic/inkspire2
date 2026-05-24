import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, User, CheckCircle, XCircle, Image as ImageIcon,
    DollarSign, FileText, Eye, TrendingUp, Briefcase, AlertCircle,
    Filter, ChevronDown, BarChart3, RefreshCcw, Activity
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import './ArtistAppointments.css';

const API_BASE_URL = 'http://localhost:8000';

const ArtistAppointments = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showStats, setShowStats] = useState(true);
    // NEW: Completion amount modal state
    const [completionModal, setCompletionModal] = useState({
        isOpen: false,
        appointment: null,
        receivedAmount: '',
    });

    const listRef = useRef(null);

    const handleStatClick = (statusFilter) => {
        if (statusFilter) {
            setFilterStatus(statusFilter);
        }
        if (listRef.current) {
            listRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Existing Quote Modal State
    const [quoteModal, setQuoteModal] = useState({
        isOpen: false,
        appointment: null,
        priceQuote: '',
        depositAmount: '',
        artistNotes: '',
        action: 'accept'
    });

    // NEW: Status Update Modal State
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        appointment: null,
        newStatus: ''
    });

    const [refundModal, setRefundModal] = useState({
        isOpen: false,
        appointment: null
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

    // --- Helpers ---
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const isUpcoming = (isoString) => {
        const apptDate = new Date(isoString);
        return apptDate > new Date();
    };

    const filteredAppointments = appointments.filter(appt => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'upcoming') return appt.status === 'confirmed' && isUpcoming(appt.appointment_datetime);
        return appt.status === filterStatus;
    });

    // --- Modal Handlers ---
    const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
    const closeImageModal = () => setSelectedImage(null);

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

    const closeQuoteModal = () => {
        setQuoteModal({ isOpen: false, appointment: null, priceQuote: '', depositAmount: '', artistNotes: '', action: 'accept' });
    };

    const openStatusModal = (appointment) => {
        setStatusModal({
            isOpen: true,
            appointment,
            newStatus: appointment.status
        });
    };

    const closeStatusModal = () => {
        setStatusModal({ isOpen: false, appointment: null, newStatus: '' });
    };

    // --- API Actions ---
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
                    toast.error('Please enter a price quote');
                    setActionLoading(null);
                    return;
                }
                const quote = parseFloat(quoteModal.priceQuote);
                if (quote < 0) {
                    toast.error('Price quote cannot be negative');
                    setActionLoading(null);
                    return;
                }
                payload.price_quote = quote;
                if (quoteModal.depositAmount) {
                    const deposit = parseFloat(quoteModal.depositAmount);
                    if (deposit < 0) {
                        toast.error('Deposit amount cannot be negative');
                        setActionLoading(null);
                        return;
                    }
                    if (deposit >= quote) {
                        toast.error('Deposit must be less than the price quote');
                        setActionLoading(null);
                        return;
                    }
                    payload.deposit_amount = deposit;
                }
            }

            const toastId = toast.loading("Processing...");
            const res = await fetch(`${API_BASE_URL}/api/appointments/manage/${quoteModal.appointment.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                await fetchAppointments();
                toast.success(quoteModal.action === 'accept' ? 'Appointment accepted!' : 'Appointment declined.', { id: toastId });
                closeQuoteModal();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update appointment', { id: toastId });
            }
        } catch (error) {
            console.error("Error managing appointment:", error);
            toast.error('Connection error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateStatus = async () => {
        if (!statusModal.appointment) return;
        // Prevent completing before appointment time
        if (statusModal.newStatus === 'completed' && isUpcoming(statusModal.appointment.appointment_datetime)) {
            toast.error('Cannot mark as completed before the appointment time.');
            return;
        }
        // Intercept cancelled status if deposit is paid to trigger refund
        if (statusModal.newStatus === 'cancelled' && statusModal.appointment.is_deposit_paid && !statusModal.appointment.is_refunded) {
            setRefundModal({ isOpen: true, appointment: statusModal.appointment });
            closeStatusModal();
            return;
        }
        // If completing, open completion modal to capture received amount
        if (statusModal.newStatus === 'completed') {
            const remaining = parseFloat(statusModal.appointment.price_quote || 0) - parseFloat(statusModal.appointment.deposit_amount || 0);
            setCompletionModal({
                isOpen: true,
                appointment: statusModal.appointment,
                receivedAmount: remaining > 0 ? remaining.toFixed(2) : '',
            });
            closeStatusModal();
            return;
        }
        // Otherwise, proceed with normal status update
        setActionLoading(statusModal.appointment.id);
        const toastId = toast.loading("Updating status...");
        try {
            const token = localStorage.getItem('access');
            const res = await fetch(`${API_BASE_URL}/api/appointments/manage/${statusModal.appointment.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: statusModal.newStatus,
                    action: 'update_status'
                })
            });
            if (res.ok) {
                await fetchAppointments();
                toast.success('Status updated successfully.', { id: toastId });
                closeStatusModal();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update status', { id: toastId });
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Connection error', { id: toastId });
        } finally {
            setActionLoading(null);
        }
    };

    // Handler for completing appointment with received amount
    const handleCompleteAppointment = async () => {
        if (!completionModal.appointment) return;
        setActionLoading(completionModal.appointment.id);
        try {
            const token = localStorage.getItem('access');
            const amount = parseFloat(completionModal.receivedAmount) || 0;
            if (amount < 0) {
                toast.error('Received amount cannot be negative');
                setActionLoading(null);
                return;
            }
            const toastId = toast.loading("Completing appointment...");
            const res = await fetch(`${API_BASE_URL}/api/appointments/manage/${completionModal.appointment.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    received_amount: amount,
                    action: 'update_status'
                })
            });
            if (res.ok) {
                await fetchAppointments();
                toast.success("Appointment marked as completed!", { id: toastId });
                setCompletionModal({ isOpen: false, appointment: null, receivedAmount: '' });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to complete appointment', { id: toastId });
            }
        } catch (error) {
            console.error('Error completing appointment:', error);
            toast.error('Connection error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRefundAppointment = async () => {
        if (!refundModal.appointment) return;
        setActionLoading(refundModal.appointment.id);
        const toastId = toast.loading("Processing refund...");
        try {
            const token = localStorage.getItem('access');
            const res = await fetch(`${API_BASE_URL}/api/appointments/cancel/${refundModal.appointment.id}/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchAppointments();
                toast.success("Appointment cancelled and refunded.", { id: toastId });
                setRefundModal({ isOpen: false, appointment: null });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to refund appointment', { id: toastId });
            }
        } catch (error) {
            console.error("Error refunding:", error);
            toast.error('Connection error', { id: toastId });
        } finally {
            setActionLoading(null);
        }
    };

    const StatCard = ({ icon, label, value, color, subtext, onClick, clickable = false }) => (
        <div 
            className="stat-card" 
            style={{ borderLeftColor: color, cursor: clickable ? 'pointer' : 'inherit' }}
            onClick={onClick}
        >
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
            <Toaster position="bottom-right" />
            {/* Statistics Dashboard */}
            {statistics && showStats && (
                <div className="statistics-section">
                    <div className="stats-header">
                        <h3><BarChart3 size={20} /> Dashboard Overview</h3>
                        <button className="toggle-stats-btn" onClick={() => setShowStats(!showStats)}>
                            <ChevronDown size={16} className={showStats ? 'rotated' : ''} />
                        </button>
                    </div>
                    <div className="stats-grid">
                        <StatCard icon={<Briefcase size={20} />} label="Total Requests" value={statistics.total} color="#6366f1" clickable={true} onClick={() => handleStatClick('all')} />
                        <StatCard icon={<AlertCircle size={20} />} label="Pending" value={statistics.pending} color="#f59e0b" subtext="Awaiting your response" clickable={true} onClick={() => handleStatClick('pending')} />
                        <StatCard icon={<CheckCircle size={20} />} label="Confirmed" value={statistics.confirmed} color="#10b981" subtext={`${statistics.upcoming} upcoming`} clickable={true} onClick={() => handleStatClick('confirmed')} />
                        <StatCard icon={<XCircle size={20} />} label="Declined" value={statistics.cancelled} color="#ef4444" clickable={true} onClick={() => handleStatClick('cancelled')} />
                        <StatCard icon={<TrendingUp size={20} />} label="Completed" value={statistics.completed} color="#3b82f6" clickable={true} onClick={() => handleStatClick('completed')} />
                        <StatCard icon={<DollarSign size={20} />} label="Revenue" value={`$${parseFloat(statistics.total_revenue || 0).toFixed(2)}`} color="#8b5cf6" subtext={`$${parseFloat(statistics.pending_revenue || 0).toFixed(2)} pending`} />
                        <StatCard icon={<AlertCircle size={20} />} label="Refunded" value={`$${parseFloat(statistics.refunded_revenue || 0).toFixed(2)}`} color="#ef4444" />
                    </div>
                </div>
            )}

            {/* Filter Section */}
            <div className="filter-section" ref={listRef}>
                <div className="filter-header">
                    <h2><Briefcase size={20} /> Appointment Requests</h2>
                    <div className="filter-controls">
                        <Filter size={16} />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
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
                                <span className={`status-badge ${appt.status}`}>{appt.status.toUpperCase()}</span>
                                <div className="appt-meta">
                                    {appt.status === 'confirmed' && isUpcoming(appt.appointment_datetime) && <span className="upcoming-badge">UPCOMING</span>}
                                    <span className="appt-date"><Calendar size={14} /> {formatDate(appt.appointment_datetime)}</span>
                                </div>
                            </div>

                            <div className="appt-body">
                                <div className="client-info">
                                    <h3>{appt.session_type || "Tattoo Session"}</h3>
                                    <p className="client-name"><User size={14} /> {appt.customer_name || `Client ID: ${appt.customer}`}</p>
                                    <p className="time-slot"><Clock size={14} /> {formatTime(appt.appointment_datetime)}</p>
                                    <p className="duration">Duration: {appt.estimated_duration_hours} hour(s)</p>
                                </div>
                                <div className="appt-details">
                                    <p><strong>Placement:</strong> {appt.placement}</p>
                                    <p><strong>Style:</strong> {appt.tattoo_style || 'Not specified'}</p>
                                    <p><strong>Size:</strong> {appt.size_description || 'Not specified'}</p>
                                    <p className="description"><strong>Idea:</strong> {appt.description}</p>
                                    {appt.price_quote && (
                                        <p className="price-display">
                                            <DollarSign size={14} /> <strong>Quote:</strong> ${appt.price_quote}
                                            {appt.deposit_amount && <span className="deposit"> (Deposit: ${appt.deposit_amount})</span>}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {appt.reference_image_url && (
                                <div className="reference-image-section">
                                    <p className="section-label"><ImageIcon size={14} /> Reference Image</p>
                                    <div className="reference-image-container">
                                        <img src={appt.reference_image_url} alt="Reference" className="reference-image-thumbnail" onClick={() => openImageModal(appt.reference_image_url)} />
                                        <button className="view-image-btn" onClick={() => openImageModal(appt.reference_image_url)}><Eye size={16} /> View Full Size</button>
                                    </div>
                                </div>
                            )}

                            <div className="appt-actions">
                                {appt.status === 'pending' && (
                                    <>
                                        <button className="btn-accept" onClick={() => openAcceptModal(appt)} disabled={actionLoading === appt.id}>
                                            <CheckCircle size={16} /> {actionLoading === appt.id ? '...' : 'Accept & Quote'}
                                        </button>
                                        <button className="btn-decline" onClick={() => openDeclineModal(appt)} disabled={actionLoading === appt.id}>
                                            <XCircle size={16} /> {actionLoading === appt.id ? '...' : 'Decline'}
                                        </button>
                                    </>
                                )}

                                {appt.status === 'completed' && (
                                    <button 
                                        className="btn-track-healing" 
                                        onClick={() => navigate(`/explore/healing?appt=${appt.id}`)}
                                        title="Track tattoo healing progress"
                                    >
                                        <Activity size={16} /> Track Healing
                                    </button>
                                )}

                                {/* Status change button available for all except cancelled/completed perhaps? Or just all */}
                                <button className="btn-status-change" onClick={() => openStatusModal(appt)}>
                                    <RefreshCcw size={16} /> Status
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-data">
                        <Briefcase size={48} />
                        <p>No {filterStatus !== 'all' ? filterStatus : ''} appointments found.</p>
                        {filterStatus !== 'all' && (
                            <button className="clear-filter-btn" onClick={() => setFilterStatus('all')}>Show All</button>
                        )}
                        {filterStatus === 'upcoming' && (
                            <button className="clear-filter-btn" onClick={() => navigate('/artists')}>Browse Artists</button>
                        )}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="image-modal-overlay" onClick={closeImageModal}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={closeImageModal}>×</button>
                        <img src={selectedImage} alt="Reference Full Size" className="image-modal-img" />
                    </div>
                </div>
            )}

            {/* Quote/Accept Modal */}
            {quoteModal.isOpen && (
                <div className="quote-modal-overlay" onClick={closeQuoteModal}>
                    <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>{quoteModal.action === 'accept' ? 'Accept Appointment & Set Price' : 'Decline Appointment'}</h3>
                        {quoteModal.action === 'accept' && (
                            <div className="quote-form">
                                <div className="form-group">
                                    <label><DollarSign size={14} /> Price Quote *</label>
                                    <input type="number" min="0" value={quoteModal.priceQuote} onChange={(e) => setQuoteModal({ ...quoteModal, priceQuote: e.target.value })} className="price-input" />
                                </div>
                                <div className="form-group">
                                    <label><DollarSign size={14} /> Deposit Amount (Optional)</label>
                                    <input type="number" min="0" value={quoteModal.depositAmount} onChange={(e) => setQuoteModal({ ...quoteModal, depositAmount: e.target.value })} className="price-input" />
                                </div>
                            </div>
                        )}
                        <div className="form-group">
                            <label><FileText size={14} /> Notes</label>
                            <textarea value={quoteModal.artistNotes} onChange={(e) => setQuoteModal({ ...quoteModal, artistNotes: e.target.value })} rows="3" className="notes-input" />
                        </div>
                        <div className="quote-modal-actions">
                            <button className="btn-cancel" onClick={closeQuoteModal}>Cancel</button>
                            <button className={quoteModal.action === 'accept' ? 'btn-confirm-accept' : 'btn-confirm-decline'} onClick={handleManageAppointment} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusModal.isOpen && (
                <div className="quote-modal-overlay" onClick={closeStatusModal}>
                    <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Update Appointment Status</h3>
                        <div className="form-group">
                            <label>Current Status: <span className={`status-badge ${statusModal.appointment.status}`}>{statusModal.appointment.status}</span></label>
                            <select
                                className="filter-select"
                                style={{ width: '100%', marginTop: '10px' }}
                                value={statusModal.newStatus}
                                onChange={(e) => setStatusModal({ ...statusModal, newStatus: e.target.value })}
                            >
                                <option value="pending">Pending Approval</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="reschedule">Reschedule Requested</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="quote-modal-actions">
                            <button className="btn-cancel" onClick={closeStatusModal}>Cancel</button>
                            <button className="btn-confirm-accept" onClick={handleUpdateStatus} disabled={actionLoading}>
                                {actionLoading ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Completion Modal */}
            {completionModal.isOpen && (
                <div className="quote-modal-overlay" onClick={() => setCompletionModal({ isOpen: false, appointment: null, receivedAmount: '' })}>
                    <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Complete Appointment - Received Amount</h3>
                        <div className="form-group">
                            <label><DollarSign size={14} /> Received Amount (Remaining)</label>
                            <input
                                type="number"
                                min="0"
                                value={completionModal.receivedAmount}
                                onChange={e => setCompletionModal({ ...completionModal, receivedAmount: e.target.value })}
                                className="price-input"
                            />
                        </div>
                        <div className="quote-modal-actions">
                            <button className="btn-cancel" onClick={() => setCompletionModal({ isOpen: false, appointment: null, receivedAmount: '' })}>Cancel</button>
                            <button className="btn-confirm-accept" onClick={handleCompleteAppointment} disabled={actionLoading}>
                                {actionLoading ? 'Updating...' : 'Confirm Completion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Refund Modal */}
            {refundModal.isOpen && (
                <div className="quote-modal-overlay" onClick={() => setRefundModal({ isOpen: false, appointment: null })}>
                    <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Cancel & Refund Appointment</h3>
                        <div className="form-group">
                            <p style={{ color: '#e4e4e7', fontSize: '14px', lineHeight: '1.5' }}>
                                Are you sure you want to cancel this appointment? <br /><br />
                                The client's deposit of <strong>${parseFloat(refundModal.appointment.deposit_amount || 0).toFixed(2)}</strong> will be fully refunded to their original payment method.
                            </p>
                        </div>
                        <div className="quote-modal-actions">
                            <button className="btn-cancel" onClick={() => setRefundModal({ isOpen: false, appointment: null })}>Close</button>
                            <button className="btn-confirm-decline" onClick={handleRefundAppointment} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : 'Confirm Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArtistAppointments;