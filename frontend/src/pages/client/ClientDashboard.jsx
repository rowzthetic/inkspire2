// import { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom'; // 👈 Added router hooks
// import { useAuth } from '../../context/AuthContext';
// import { 
//     Calendar, Clock, User, MapPin, DollarSign, CheckCircle, XCircle, 
//     Clock3, Image as ImageIcon, AlertCircle, ChevronRight, Briefcase,
//     Filter, Eye, FileText, CreditCard // 👈 Added CreditCard icon
// } from 'lucide-react';
// import './ClientDashboard.css';

// const API_BASE_URL = 'https://inkspire2.onrender.com';

// const ClientDashboard = () => {
//     const { user } = useAuth();
//     const location = useLocation(); // 👈 To read the URL params
//     const navigate = useNavigate(); // 👈 To clear the URL params after payment

//     const [appointments, setAppointments] = useState([]);
//     const [statistics, setStatistics] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [activeTab, setActiveTab] = useState('upcoming');
//     const [selectedImage, setSelectedImage] = useState(null);

//     // 1. Initial Fetch
//     useEffect(() => {
//         fetchAppointments();
//     }, []);

//     // 2. Stripe Payment Verification Checker
//     useEffect(() => {
//         const queryParams = new URLSearchParams(location.search);
//         const paymentStatus = queryParams.get('payment');
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Calendar, Clock, User, MapPin, DollarSign, CheckCircle, XCircle,
    Clock3, Image as ImageIcon, AlertCircle, ChevronRight, Briefcase,
    Filter, Eye, FileText, CreditCard, Activity
} from 'lucide-react';
import './ClientDashboard.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'https://inkspire2.onrender.com';

const ClientDashboard = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [selectedImage, setSelectedImage] = useState(null);

    // 1. Initial Fetch
    useEffect(() => {
        fetchAppointments();
    }, []);

    // 2. Stripe Payment Verification Checker
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const paymentStatus = queryParams.get('payment');
        const sessionId = queryParams.get('session_id');
        const apptId = queryParams.get('appt_id');

        if (paymentStatus === 'success' && sessionId && apptId) {
            verifyPayment(sessionId, apptId);
        } else if (paymentStatus === 'cancelled') {
            toast.error("Payment was cancelled. You can try again when you are ready.");
            navigate(location.pathname, { replace: true });
        }
    }, [location]);

    const verifyPayment = async (sessionId, apptId) => {
        try {
            const token = localStorage.getItem('access');
            const res = await fetch(`${API_BASE_URL}/api/appointments/payment-success/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: sessionId, appt_id: apptId })
            });

            if (res.ok) {
                toast.success("Payment successful! Your deposit has been securely paid.");
                fetchAppointments();
            } else {
                toast.error("There was an issue verifying your payment. Please contact support.");
            }
        } catch (err) {
            console.error("Payment verification error:", err);
            toast.error("Payment verification failed.");
        } finally {
            navigate(location.pathname, { replace: true });
        }
    };

    const fetchAppointments = async () => {
        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`${API_BASE_URL}/api/appointments/client/list/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            setAppointments(data.appointments || []);
            setStatistics(data.statistics || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 👇 UPDATED: Cancellation logic now checks for deposit and refunds
    const handleCancelAppointment = async (appointment) => {
        // Dynamic Warning Message
        let confirmMessage = 'Are you sure you want to cancel this appointment?';

        if (appointment.is_deposit_paid) {
            confirmMessage = 'Are you sure you want to cancel?\n\nYour deposit will be fully refunded to your original payment method.';
        }

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const token = localStorage.getItem('access');
            const response = await fetch(`${API_BASE_URL}/api/appointments/cancel/${appointment.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to cancel appointment');
            }

            if (appointment.is_deposit_paid) {
                toast.success("Appointment cancelled. A full refund has been initiated by Stripe.");
            }
            fetchAppointments();
        } catch (err) {
            toast.error('Error cancelling appointment: ' + err.message);
        }
    };

    const handlePayment = async (appointmentId) => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API_BASE_URL}/api/appointments/checkout/${appointmentId}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok && data.url) {
                window.location.href = data.url;
            } else {
                toast.error("Failed to initiate payment: " + (data.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Connection error while starting payment.");
        }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'pending': { icon: <Clock3 size={16} />, class: 'badge-pending', label: 'Pending Approval', color: '#f59e0b' },
            'confirmed': { icon: <CheckCircle size={16} />, class: 'badge-confirmed', label: 'Confirmed', color: '#10b981' },
            'completed': { icon: <CheckCircle size={16} />, class: 'badge-completed', label: 'Completed', color: '#3b82f6' },
            'cancelled': { icon: <XCircle size={16} />, class: 'badge-cancelled', label: 'Cancelled', color: '#ef4444' },
            'reschedule': { icon: <AlertCircle size={16} />, class: 'badge-reschedule', label: 'Reschedule Requested', color: '#8b5cf6' }
        };
        return configs[status] || { icon: null, class: 'badge-default', label: status, color: '#6b7280' };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getSessionTypeLabel = (type) => {
        const labels = { 'consultation': 'Consultation (15-30 mins)', 'tattoo': 'Tattoo Session', 'touchup': 'Touch-up Session' };
        return labels[type] || type;
    };

    const getPlacementLabel = (placement) => {
        const labels = { 'arm': 'Arm', 'leg': 'Leg', 'back': 'Back', 'chest': 'Chest', 'neck': 'Neck', 'stomach': 'Stomach', 'ribs': 'Ribs', 'other': 'Other' };
        return labels[placement] || placement;
    };

    const filterAppointments = () => {
        const now = new Date();
        if (activeTab === 'upcoming') {
            return appointments.filter(apt => new Date(apt.appointment_datetime) >= now && apt.status !== 'cancelled' && apt.status !== 'completed');
        } else if (activeTab === 'past') {
            return appointments.filter(apt => (new Date(apt.appointment_datetime) < now && apt.status !== 'cancelled') || apt.status === 'completed');
        } else if (activeTab === 'cancelled') {
            return appointments.filter(apt => apt.status === 'cancelled');
        } else if (activeTab === 'pending') {
            return appointments.filter(apt => apt.status === 'pending');
        } else if (activeTab === 'confirmed') {
            return appointments.filter(apt => apt.status === 'confirmed');
        } else if (activeTab === 'completed') {
            return appointments.filter(apt => apt.status === 'completed');
        }
        return appointments;
    };

    const StatCard = ({ icon, label, value, color, subtext, onClick }) => (
        <div
            className={`client-stat-card ${onClick ? 'interactive' : ''}`}
            style={{ borderLeftColor: color, cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="client-stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                {icon}
            </div>
            <div className="client-stat-info">
                <span className="client-stat-value" style={{ color: color }}>{value}</span>
                <span className="client-stat-label">{label}</span>
                {subtext && <span className="client-stat-subtext">{subtext}</span>}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="client-dashboard">
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your appointments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="client-dashboard">
                <div className="dashboard-error">
                    <AlertCircle size={48} />
                    <p>Error: {error}</p>
                    <button onClick={fetchAppointments}>Try Again</button>
                </div>
            </div>
        );
    }

    const filteredAppointments = filterAppointments();
    const statusConfig = getStatusConfig;

    return (
        <div className="client-dashboard">
            {/* Toast notifications */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            {/* Header */}
            <div className="client-dashboard-header">
                <div className="header-content">
                    <h1>Welcome back, {user?.username || 'Client'}!</h1>
                    <p>Manage your tattoo appointments and track your bookings</p>
                </div>
                <a href="/artists" className="book-new-btn">
                    <Briefcase size={18} />
                    Book New Appointment
                </a>
            </div>

            {/* Statistics */}
            {statistics && (
                <div className="client-statistics">
                    <h3><Filter size={18} /> Overview</h3>
                    <div className="client-stats-grid">
                        <StatCard
                            icon={<Clock3 size={20} />} label="Pending"
                            value={statistics.pending ?? appointments.filter(a => a.status === 'pending').length}
                            color="#f59e0b" subtext="Awaiting artist approval"
                            onClick={() => setActiveTab('pending')}
                        />
                        <StatCard
                            icon={<CheckCircle size={20} />} label="Confirmed"
                            value={statistics.confirmed ?? appointments.filter(a => a.status === 'confirmed').length}
                            color="#10b981" subtext={`${statistics?.upcoming ?? 0} upcoming`}
                            onClick={() => setActiveTab('confirmed')}
                        />
                        <StatCard
                            icon={<CheckCircle size={20} />} label="Completed"
                            value={statistics.completed ?? appointments.filter(a => a.status === 'completed').length}
                            color="#3b82f6"
                            onClick={() => setActiveTab('completed')}
                        />
                        <StatCard
                            icon={<XCircle size={20} />} label="Cancelled"
                            value={statistics.cancelled ?? appointments.filter(a => a.status === 'cancelled').length}
                            color="#ef4444"
                            onClick={() => setActiveTab('cancelled')}
                        />
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="client-tabs-container">
                <div className="client-tabs">
                    <button className={`client-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
                        <Calendar size={16} /> All Upcoming
                    </button>
                    <button className={`client-tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                        Pending
                    </button>
                    <button className={`client-tab ${activeTab === 'confirmed' ? 'active' : ''}`} onClick={() => setActiveTab('confirmed')}>
                        Confirmed
                    </button>
                    <button className={`client-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
                        <CheckCircle size={16} /> Completed
                    </button>
                    <button className={`client-tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
                        <Clock size={16} /> Past
                    </button>
                    <button className={`client-tab ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
                        <XCircle size={16} /> Cancelled
                    </button>
                </div>
            </div>

            {/* Appointments List */}
            <div className="client-appointments-list">
                {filteredAppointments.length === 0 ? (
                    <div className="client-no-appointments">
                        <Briefcase size={64} />
                        <h3>No {activeTab} appointments</h3>
                        <p>{activeTab === 'upcoming' ? "You don't have any upcoming appointments. Book your next tattoo session!" : `No ${activeTab} appointments found.`}</p>
                        {activeTab === 'upcoming' && (
                            <a href="/artists" className="book-now-btn">
                                Browse Artists & Book <ChevronRight size={16} />
                            </a>
                        )}
                    </div>
                ) : (
                    filteredAppointments.map(appointment => {
                        const status = statusConfig(appointment.status);
                        return (
                            <div key={appointment.id} className={`client-appointment-card ${appointment.status}`}>
                                {/* Card Header */}
                                <div className="client-card-header">
                                    <div className="client-status-badge" style={{ backgroundColor: `${status.color}20`, color: status.color, borderColor: `${status.color}40` }}>
                                        {status.icon} <span>{status.label}</span>
                                    </div>
                                    <span className="client-session-type">{getSessionTypeLabel(appointment.session_type)}</span>
                                </div>

                                {/* Card Body */}
                                <div className="client-card-body">
                                    {/* Date & Time */}
                                    <div className="client-datetime-section">
                                        <div className="client-datetime-item">
                                            <Calendar size={18} />
                                            <div><span className="datetime-label">Date</span><span className="datetime-value">{formatDate(appointment.appointment_datetime)}</span></div>
                                        </div>
                                        <div className="client-datetime-item">
                                            <Clock size={18} />
                                            <div><span className="datetime-label">Time</span><span className="datetime-value">{formatTime(appointment.appointment_datetime)}</span></div>
                                        </div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="client-details-grid">
                                        <div className="client-detail-item">
                                            <User size={16} />
                                            <div><span className="detail-label">Artist</span><span className="detail-value">{appointment.artist_name || 'Artist'}</span></div>
                                        </div>
                                        <div className="client-detail-item">
                                            <MapPin size={16} />
                                            <div><span className="detail-label">Placement</span><span className="detail-value">{getPlacementLabel(appointment.placement)}</span></div>
                                        </div>
                                        <div className="client-detail-item">
                                            <Clock3 size={16} />
                                            <div><span className="detail-label">Duration</span><span className="detail-value">{appointment.estimated_duration_hours} hour(s)</span></div>
                                        </div>
                                        {appointment.tattoo_style && (
                                            <div className="client-detail-item">
                                                <Briefcase size={16} />
                                                <div><span className="detail-label">Style</span><span className="detail-value">{appointment.tattoo_style}</span></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Information */}
                                    {appointment.price_quote && (
                                        <div className="client-price-section">
                                            <div className="price-item total">
                                                <DollarSign size={18} />
                                                <div><span className="price-label">Total Quote</span><span className="price-value">${appointment.price_quote}</span></div>
                                            </div>
                                            {appointment.deposit_amount && (
                                                <div className="price-item deposit">
                                                    <div>
                                                        <span className="price-label">Deposit Required</span>
                                                        <span className="price-value">
                                                            ${appointment.deposit_amount}
                                                            {appointment.is_deposit_paid ? (
                                                                <span className="paid-badge" style={{ color: '#10b981', marginLeft: '10px', fontSize: '0.8rem' }}>✓ Paid</span>
                                                            ) : appointment.is_refunded ? (
                                                                <span className="refunded-badge" style={{ color: '#f59e0b', marginLeft: '10px', fontSize: '0.8rem' }}>↺ Refunded</span>
                                                            ) : (
                                                                <span className="pending-badge" style={{ color: '#f59e0b', marginLeft: '10px', fontSize: '0.8rem' }}>Pending</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Description */}
                                    {appointment.description && (
                                        <div className="client-description">
                                            <h4><FileText size={16} /> Design Description</h4>
                                            <p>{appointment.description}</p>
                                        </div>
                                    )}

                                    {/* Reference Image */}
                                    {appointment.reference_image_url && (
                                        <div className="client-reference-section">
                                            <h4><ImageIcon size={16} /> Reference Image</h4>
                                            <div className="client-reference-image-wrapper">
                                                <img
                                                    src={appointment.reference_image_url} alt="Reference" className="client-reference-image"
                                                    onClick={() => setSelectedImage(appointment.reference_image_url)}
                                                />
                                                <button className="view-full-btn" onClick={() => setSelectedImage(appointment.reference_image_url)}>
                                                    <Eye size={16} /> View Full Size
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Actions */}
                                {(appointment.status === 'pending' || appointment.status === 'confirmed' || appointment.status === 'completed') && (
                                    <div className="client-card-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>

                                        {/* Track Healing Button */}
                                        {appointment.status === 'completed' && (
                                            <button
                                                className="client-track-btn"
                                                onClick={() => navigate(`/explore/healing?appt=${appointment.id}`)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    backgroundColor: '#1D9E75', color: 'white',
                                                    padding: '8px 16px', borderRadius: '6px',
                                                    border: 'none', cursor: 'pointer',
                                                    fontWeight: 'bold', fontSize: '0.9rem'
                                                }}
                                            >
                                                <Activity size={18} /> Track Healing Progress
                                            </button>
                                        )}

                                        {/* Stripe Payment Button */}
                                        {appointment.status === 'confirmed' && !appointment.is_deposit_paid && appointment.deposit_amount && (
                                            <button
                                                className="client-pay-btn"
                                                onClick={() => handlePayment(appointment.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    backgroundColor: '#6366f1', color: 'white',
                                                    padding: '8px 16px', borderRadius: '6px',
                                                    border: 'none', cursor: 'pointer',
                                                    fontWeight: 'bold', fontSize: '0.9rem'
                                                }}
                                            >
                                                <CreditCard size={18} /> Pay Deposit to Secure Booking
                                            </button>
                                        )}

                                        {/* 👇 UPDATED: Now passes the full appointment object */}
                                        <button
                                            className="client-cancel-btn"
                                            onClick={() => handleCancelAppointment(appointment)}
                                        >
                                            <XCircle size={16} />
                                            Cancel Appointment
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Image Lightbox */}
            {selectedImage && (
                <div className="client-image-modal" onClick={() => setSelectedImage(null)}>
                    <div className="client-image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setSelectedImage(null)}>×</button>
                        <img src={selectedImage} alt="Reference Full Size" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
