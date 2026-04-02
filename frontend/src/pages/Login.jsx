import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { loginAction, user } = useAuth(); 
  const navigate = useNavigate(); // 2. Initialize the hook
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect already logged-in users to dashboard
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to appropriate dashboard
      if (user.is_artist) {
        navigate('/artist-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  // --- STANDARD LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
            throw new Error('Invalid email or password');
        }
        // Handle custom artist pending message
        if (data.detail) throw new Error(data.detail);
        throw new Error('Login failed');
      }

      await loginAction(data); 

      // ✅ 3. REDIRECT LOGIC (Standard)
      if (data.is_artist) {
        navigate('/artist-dashboard');
      } else {
        navigate('/dashboard'); // Regular users go to Client Dashboard
      }

    } catch (error) {
      console.error('Error:', error.message);
      setErrorMessage(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  // --- GOOGLE LOGIN HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
      try {
          const token = credentialResponse.credential;
          
          const res = await fetch('http://localhost:8000/api/auth/google/', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: token })
          });

          const data = await res.json();

          if (!res.ok) {
              throw new Error(data.error || "Google Login Failed");
          }

          await loginAction(data); 

          // ✅ 4. REDIRECT LOGIC (Google)
          if (data.is_artist) {
              navigate('/artist-dashboard');
          } else {
              navigate('/dashboard'); // Regular users go to Client Dashboard
          }

      } catch (error) {
          console.error("Google Login Error:", error);
          setErrorMessage(error.message || "Google Login Failed");
      }
  };

  return (
    <div className="contact" style={{ minHeight: '80vh', paddingTop: '120px' }}>
      <h2>Login to Inkspire</h2>
      
      <form className="contact-form" onSubmit={handleLogin}>
        
        <input 
          type="email" 
          placeholder="Email" 
          required 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        {errorMessage && (
            <div style={{
                color: '#721c24', 
                backgroundColor: '#f8d7da', 
                padding: '10px', 
                marginBottom: '15px',
                borderRadius: '4px'
            }}>
                {errorMessage}
            </div>
        )}

        <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div style={{ marginTop: '15px', textAlign: 'center' }}>
          <Link to="/forgot-password" style={{ color: '#D4AF37', textDecoration: 'none', fontSize: '0.95rem' }}>
              Forgot Password?
          </Link>
      </div>

      {/* --- GOOGLE BUTTON UI --- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
          <p style={{color: '#888', marginBottom: '15px'}}>— Or login with —</p>
          
          <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setErrorMessage("Google Login Failed")}
              theme="filled_black"
              shape="pill"
              text="signin_with"
          />
      </div>

      <p style={{marginTop: '20px'}}>
        Don't have an account? <Link to="/signup" style={{color: '#e63946'}}>Sign up here</Link>
      </p>
    </div>
  );
}