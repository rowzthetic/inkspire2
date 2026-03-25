import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import './Appointment.css'; 

const API_BASE_URL = 'http://localhost:8000';

const Appointment = () => {
    const { artistId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Grab pre-filled data
    const passedDate = location.state?.preFilledDate || '';
    let passedTime = location.state?.preFilledTime || '';
    if (passedTime.length > 5) passedTime = passedTime.slice(0, 5);

    // 2. State
    const [formData, setFormData] = useState({
        date: passedDate,
        time: passedTime,
        placement: 'arm',
        size_description: '',
        description: '',
        image: null
    });
    
    const [availableSlots, setAvailableSlots] = useState([]); // Store slots here
    const [loadingSlots, setLoadingSlots] = useState(false);

    // 3. FETCH SLOTS whenever the Date changes
    useEffect(() => {
        if (!formData.date) return;

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/appointments/slots/${artistId}/?date=${formData.date}`);
                const data = await res.json();
                setAvailableSlots(data.slots || []);
            } catch (error) {
                console.error("Error loading slots:", error);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [formData.date, artistId]);


    // Handlers
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, image: e.target.files[0] });
    };

    // Quick Select Handler for the Slots
    const handleSlotClick = (timeValue) => {
        // timeValue is "14:00:00", slice to "14:00" for the input
        const time = timeValue.slice(0, 5);
        setFormData({ ...formData, time: time });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('access');
        
        if (!token) {
            alert("You must be logged in!");
            navigate('/login');
            return;
        }

        const data = new FormData();
        data.append('artist', artistId);
        data.append('date', formData.date);
        data.append('time', formData.time);
        data.append('placement', formData.placement);
        data.append('size_description', formData.size_description);
        data.append('description', formData.description);
        if (formData.image) data.append('reference_image', formData.image);

        try {
            const res = await fetch(`${API_BASE_URL}/api/appointments/book/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: data
            });
            
            if (res.status === 401) {
                alert("Session expired. Please log in.");
                localStorage.removeItem('access');
                navigate('/login');
                return;
            }

            const result = await res.json();
            if (res.ok) {
                alert("Appointment Request Sent!");
                navigate('/dashboard'); 
            } else {
                alert(JSON.stringify(result) || "Booking failed");
            }
        } catch (err) {
            console.error(err);
            alert("Connection Error");
        }
    };

    return (
        <div className="appointment-container">
            <h2>Book Appointment</h2>
            
            <form onSubmit={handleSubmit} className="appointment-form">
                
                {/* DATE INPUT */}
                <label>Date:</label>
                <input 
                    type="date" 
                    name="date" 
                    required 
                    value={formData.date} 
                    onChange={handleChange} 
                />

                {/* 👇 NEW: SLOT SELECTOR */}
                {formData.date && (
                    <div className="slots-section">
                        <label>Available Slots for {formData.date}:</label>
                        {loadingSlots ? (
                            <p className="loading-text">Loading availability...</p>
                        ) : (
                            <div className="mini-slots-grid">
                                {availableSlots.length > 0 ? availableSlots.map((slot, index) => (
                                    <button
                                        type="button" // Important: Prevents submitting the form
                                        key={index}
                                        disabled={!slot.available}
                                        onClick={() => handleSlotClick(slot.value)}
                                        className={`mini-slot-btn ${slot.available ? 'open' : 'taken'} ${formData.time === slot.value.slice(0,5) ? 'selected' : ''}`}
                                    >
                                        {slot.time}
                                    </button>
                                )) : <p className="no-slots-text">No slots available.</p>}
                            </div>
                        )}
                    </div>
                )}

                {/* TIME INPUT (Updates automatically when slot is clicked) */}
                <label>Time:</label>
                <input 
                    type="time" 
                    name="time" 
                    required 
                    value={formData.time} 
                    onChange={handleChange} 
                />

                <label>Placement:</label>
                <select name="placement" onChange={handleChange} value={formData.placement}>
                    <option value="arm">Arm</option>
                    <option value="leg">Leg</option>
                    <option value="back">Back</option>
                    <option value="chest">Chest</option>
                    <option value="stomach">Stomach</option>
                    <option value="neck">Neck</option>
                    <option value="ribs">Ribs</option>
                    <option value="other">Other</option>
                </select>

                <label>Size (e.g. 5x5 inches):</label>
                <input type="text" name="size_description" required onChange={handleChange} />

                <label>Description (Idea):</label>
                <textarea name="description" required onChange={handleChange}></textarea>

                <label>Reference Image (Optional):</label>
                <input type="file" onChange={handleFileChange} />

                <button type="submit" className="submit-btn">Submit Request</button>
            </form>
        </div>
    );
};

export default Appointment;