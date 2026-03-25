import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// 👇 1. Import the Provider
import { GoogleOAuthProvider } from '@react-oauth/google';

// 👇 2. Define your Client ID (I pasted yours below)
const CLIENT_ID = "62630033234-cpvj1b5in4vkohk7bceeud7o7g01q55c.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 👇 3. Wrap your App component */}
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)