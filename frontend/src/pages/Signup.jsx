// import { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import '../App.css';

// export default function Signup() {
//   const navigate = useNavigate();

//   // Step state: 'form' = Details, 'otp' = Verification
//   const [step, setStep] = useState('form');
  
//   const [formData, setFormData] = useState({
//     username: '',
//     email: '',
//     phone_number: '',
//     is_artist: false,
//     shop_name: '',
//     city: '',
//     instagram_link: ''
//   });

//   const [otp, setOtp] = useState('');
//   const [status, setStatus] = useState({ type: '', message: '' });
//   const [isLoading, setIsLoading] = useState(false);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   // --- STEP 1: REGISTER ---
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setStatus({ type: '', message: '' });
//     setIsLoading(true);

//     try {
//       // Build Payload
//       const payload = {
//         username: formData.username,
//         email: formData.email,
//         phone_number: formData.phone_number,
//         is_artist: formData.is_artist,
//         shop_name: formData.is_artist ? formData.shop_name : "",
//         city: formData.is_artist ? formData.city : "",
//         instagram_link: formData.is_artist ? formData.instagram_link : ""
//       };

//       // 1. Send Registration Data
//       // Matches Backend: path("register/", ...) -> /api/auth/register/
//       const response = await fetch('http://localhost:8000/api/auth/register/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(payload)
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         const errorMsg = typeof data === 'object' 
//           ? Object.values(data).flat().join(' ') 
//           : 'Registration failed';
//         throw new Error(errorMsg);
//       }

//       // Success! Move to OTP step
//       setStatus({ type: 'success', message: 'OTP sent to your email.' });
//       setStep('otp');

//     } catch (error) {
//       console.error("Signup Error:", error);
//       setStatus({ type: 'error', message: error.message });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- STEP 2: VERIFY OTP ---
//   const handleVerifyOtp = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setStatus({ type: '', message: '' });

//     try {
//       // 2. Send OTP for Verification
//       // Matches Backend: path("verify-otp/", ...) -> /api/auth/verify-otp/
//       const response = await fetch('http://localhost:8000/api/auth/verify-otp/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           email: formData.email,
//           otp: otp
//         })
//       });

//       // Check if response is JSON before parsing
//       const contentType = response.headers.get("content-type");
//       if (!contentType || !contentType.includes("application/json")) {
//          throw new Error("Server returned HTML instead of JSON. Check your URL paths!");
//       }

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.error || 'Verification failed');
//       }

//       // Success!
//       alert("Account verified! You are now logged in.");
//       navigate('/'); // Redirect to Home

//     } catch (error) {
//       console.error("OTP Error:", error);
//       setStatus({ type: 'error', message: error.message });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="contact" style={{ minHeight: '80vh', paddingTop: '120px' }}>
      
//       {/* --- FORM HEADER --- */}
//       <h2>{step === 'form' ? 'Create an Account' : 'Verify Email'}</h2>
      
//       {status.message && (
//         <div style={{
//           padding: '10px', margin: '0 auto 15px auto', borderRadius: '4px',
//           backgroundColor: status.type === 'error' ? '#f8d7da' : '#d4edda',
//           color: status.type === 'error' ? '#721c24' : '#155724',
//           width: '90%', maxWidth: '400px'
//         }}>
//           {status.message}
//         </div>
//       )}

//       {/* --- STEP 1: REGISTRATION FORM --- */}
//       {step === 'form' && (
//         <form className="contact-form" onSubmit={handleRegister}>
//           <input 
//             type="text" name="username" placeholder="Username" required 
//             value={formData.username} onChange={handleChange}
//           />
//           <input 
//             type="email" name="email" placeholder="Email" required 
//             value={formData.email} onChange={handleChange}
//           />
//           <input 
//             type="tel" name="phone_number" placeholder="Phone Number" required 
//             value={formData.phone_number} onChange={handleChange}
//           />
          
//           {/* Artist Toggle */}
//           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0', color: '#fff', width: '100%' }}>
//             <input 
//               type="checkbox" name="is_artist" id="artist-check"
//               checked={formData.is_artist} onChange={handleChange}
//               style={{ width: '20px', height: '20px', margin: 0 }} 
//             />
//             <label htmlFor="artist-check" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
//               I am a Tattoo Artist
//             </label>
//           </div>

//           {/* Conditional Artist Fields */}
//           {formData.is_artist && (
//             <div className="artist-fields" style={{ borderLeft: '3px solid #e63946', paddingLeft: '15px', width: '100%', marginBottom: '15px' }}>
//               <input 
//                 type="text" name="shop_name" placeholder="Shop Name" 
//                 required={formData.is_artist} value={formData.shop_name} onChange={handleChange}
//               />
//               <input 
//                 type="text" name="city" placeholder="City" 
//                 required={formData.is_artist} value={formData.city} onChange={handleChange}
//               />
//               <input 
//                 type="url" name="instagram_link" placeholder="Instagram Portfolio Link" 
//                 required={formData.is_artist} value={formData.instagram_link} onChange={handleChange}
//               />
//             </div>
//           )}

//           <button type="submit" className="btn" disabled={isLoading}>
//             {isLoading ? 'Sending OTP...' : 'Next'}
//           </button>
//         </form>
//       )}

//       {/* --- STEP 2: OTP FORM --- */}
//       {step === 'otp' && (
//         <form className="contact-form" onSubmit={handleVerifyOtp}>
//           <p style={{color: 'white'}}>Enter the 6-digit code sent to {formData.email}</p>
          
//           <input 
//             type="text" name="otp" placeholder="XXXXXX" 
//             required maxLength="6"
//             value={otp} onChange={(e) => setOtp(e.target.value)}
//             style={{textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem'}}
//           />

//           <button type="submit" className="btn" disabled={isLoading}>
//             {isLoading ? 'Verifying...' : 'Verify & Login'}
//           </button>

//           <button 
//             type="button" 
//             onClick={() => setStep('form')}
//             style={{background: 'transparent', border: 'none', color: '#ccc', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline'}}
//           >
//             Wrong email? Go Back
//           </button>
//         </form>
//       )}

//       {step === 'form' && (
//         <p style={{marginTop: '20px'}}>
//           Already have an account? <Link to="/login" style={{color: '#e63946'}}>Login here</Link>
//         </p>
//       )}
//     </div>
//   );
// }


import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

export default function Signup() {
  const navigate = useNavigate();

  // Step state: 'form' = Details, 'otp' = Verification
  const [step, setStep] = useState('form');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
    is_artist: false,
    shop_name: '',
    city: '',
    instagram_link: '',
    password: ''
  });

  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- STEP 1: REGISTER ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      // No password field sent to backend
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password, //  THIS WAS MISSING!
        phone_number: formData.phone_number,
        is_artist: formData.is_artist,
        shop_name: formData.is_artist ? formData.shop_name : "",
        city: formData.is_artist ? formData.city : "",
        instagram_link: formData.is_artist ? formData.instagram_link : ""
      };

      const response = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from Django
        const errorMsg = typeof data === 'object' 
          ? Object.values(data).flat().join(' ') 
          : 'Registration failed';
        throw new Error(errorMsg);
      }

      // Success! Move to OTP step
      setStatus({ type: 'success', message: 'OTP sent to your email.' });
      setStep('otp');

    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await fetch('http://localhost:8000/api/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: otp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Success!
      alert("Account verified! You are now logged in.");
      navigate('/'); // Redirect to Home or Dashboard

    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="contact" style={{ minHeight: '80vh', paddingTop: '120px' }}>
      
      {/* --- FORM HEADER --- */}
      <h2>{step === 'form' ? 'Create an Account' : 'Verify Email'}</h2>
      
      {status.message && (
        <div style={{
          padding: '10px', margin: '0 auto 15px auto', borderRadius: '4px',
          backgroundColor: status.type === 'error' ? '#f8d7da' : '#d4edda',
          color: status.type === 'error' ? '#721c24' : '#155724',
          width: '90%', maxWidth: '400px'
        }}>
          {status.message}
        </div>
      )}

      {/* --- STEP 1: REGISTRATION FORM --- */}
      {step === 'form' && (
        <form className="contact-form" onSubmit={handleRegister}>
          <input 
            type="text" name="username" placeholder="Username" required 
            value={formData.username} onChange={handleChange}
          />
          <input 
            type="email" name="email" placeholder="Email" required 
            value={formData.email} onChange={handleChange}
          />
          <input 
            type="tel" name="phone_number" placeholder="Phone Number" required 
            value={formData.phone_number} onChange={handleChange}
          />
          

{/* Password Field */}
<div className="mb-4"> {/* Add spacing wrapper */}
  <input
    type="password"
    name="password"       // ✅ Must match the state name
    value={formData.password} // ✅ Binds to state
    onChange={handleChange}   // ✅ Updates state on typing
    placeholder="Password"
    className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-red-500" 
    required
  />
</div>
          {/* Artist Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0', color: '#fff', width: '100%' }}>
            <input 
              type="checkbox" name="is_artist" id="artist-check"
              checked={formData.is_artist} onChange={handleChange}
              style={{ width: '20px', height: '20px', margin: 0 }} 
            />
            <label htmlFor="artist-check" style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              I am a Tattoo Artist
            </label>
          </div>

          {/* Conditional Artist Fields */}
          {formData.is_artist && (
            <div className="artist-fields" style={{ borderLeft: '3px solid #e63946', paddingLeft: '15px', width: '100%', marginBottom: '15px' }}>
              <input 
                type="text" name="shop_name" placeholder="Shop Name" 
                required={formData.is_artist} value={formData.shop_name} onChange={handleChange}
              />
              <input 
                type="text" name="city" placeholder="City" 
                required={formData.is_artist} value={formData.city} onChange={handleChange}
              />
              <input 
                type="url" name="instagram_link" placeholder="Instagram Portfolio Link" 
                required={formData.is_artist} value={formData.instagram_link} onChange={handleChange}
              />
            </div>
          )}

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Next'}
          </button>
        </form>
      )}

      {/* --- STEP 2: OTP FORM --- */}
      {step === 'otp' && (
        <form className="contact-form" onSubmit={handleVerifyOtp}>
          <p style={{color: 'white'}}>Enter the 6-digit code sent to {formData.email}</p>
          
          <input 
            type="text" name="otp" placeholder="XXXXXX" 
            required maxLength="6"
            value={otp} onChange={(e) => setOtp(e.target.value)}
            style={{textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem'}}
          />

          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify & Login'}
          </button>

          <button 
            type="button" 
            onClick={() => setStep('form')}
            style={{background: 'transparent', border: 'none', color: '#ccc', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline'}}
          >
            Wrong email? Go Back
          </button>
        </form>
      )}

      {step === 'form' && (
        <p style={{marginTop: '20px'}}>
          Already have an account? <Link to="/login" style={{color: '#e63946'}}>Login here</Link>
        </p>
      )}
    </div>
  );
  
}