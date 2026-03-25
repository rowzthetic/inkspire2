import { useEffect, useState, useRef } from 'react'; // 1. Import useRef
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../App.css'; 

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  // 2. Create a ref to track if we have fired the request
  const effectCalled = useRef(false);

  const [status, setStatus] = useState('loading'); 
  const [message, setMessage] = useState('Verifying your email...');

  const verifyAccount = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid activation link.');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch(`http://localhost:8000/api/auth/activate/${token}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now log in.');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // Only show error if status isn't already success (prevents race condition UI glitches)
        if (status !== 'success') {
            const errorMsg = data.detail || data.error || 'Activation link is invalid or expired.';
            setStatus('error');
            setMessage(errorMsg);
        }
      }
    } catch (error) {
      console.error("Verification Error:", error);
      setStatus('error');
      setMessage('Network error. Is the backend server running?');
    }
  };

  useEffect(() => {
    // 3. Check if we already ran this effect
    if (effectCalled.current) return; 

    // 4. Mark as called immediately
    effectCalled.current = true;

    verifyAccount();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // removed navigate from dependency to be safe, though not strictly necessary

  return (
    <div className="contact" style={{ minHeight: '60vh', paddingTop: '150px', textAlign: 'center' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
        
        {/* LOADING */}
        {status === 'loading' && (
          <div>
            <h2>Verifying...</h2>
            <div className="loader" style={{ margin: '20px auto' }}></div> 
            <p>Please wait while we activate your account.</p>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '20px', borderRadius: '8px' }}>
            <h2>Success!</h2>
            <p>{message}</p>
            <p style={{fontSize: '0.9rem', marginTop: '10px'}}>Redirecting...</p>
            <Link to="/login" className="btn" style={{ marginTop: '15px', display: 'inline-block' }}>
              Login Now
            </Link>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '20px', borderRadius: '8px' }}>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            
            <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center'}}>
                {/* Removed the retry button logic slightly because retry wont work if token is deleted */}
                <Link to="/" className="btn" style={{ backgroundColor: '#555' }}>
                  Go Home
                </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}