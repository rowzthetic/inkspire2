import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      setSuccessMessage(data.message || 'OTP sent to your email.');
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          otp, 
          new_password: newPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact" style={{ minHeight: '80vh', paddingTop: '120px' }}>
      <h2>Forgot Password</h2>
      
      {errorMessage && (
        <div style={{
            color: '#721c24', 
            backgroundColor: '#f8d7da', 
            padding: '10px', 
            marginBottom: '15px',
            borderRadius: '4px',
            maxWidth: '500px',
            margin: '0 auto 15px auto'
        }}>
            {errorMessage}
        </div>
      )}

      {successMessage && (
        <div style={{
            color: '#155724', 
            backgroundColor: '#d4edda', 
            padding: '10px', 
            marginBottom: '15px',
            borderRadius: '4px',
            maxWidth: '500px',
            margin: '0 auto 15px auto'
        }}>
            {successMessage}
        </div>
      )}
      
      {step === 1 ? (
        <form className="contact-form" onSubmit={handleRequestOtp}>
          <p style={{marginBottom: '20px'}}>Enter your email address to receive a 6-digit reset code.</p>
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      ) : (
        <form className="contact-form" onSubmit={handleResetPassword}>
          <p style={{marginBottom: '20px'}}>We sent a code to <strong>{email}</strong></p>
          
          <input 
            type="text" 
            placeholder="6-digit OTP" 
            required 
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="New Password" 
            required 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}
