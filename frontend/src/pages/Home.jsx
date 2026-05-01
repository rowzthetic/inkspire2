import { Link } from 'react-router-dom';
import '../App.css';

export default function Home() {
  return (
    <div className="home-container">
      <section id="home" className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="hero-subtitle">Premium Tattoo Studio</span>
          <h1>Ink that <span className="accent-text">Inspires</span></h1>
          <p>
            Where custom designs meet timeless artistry. 
            Your vision, crafted with passion and precision.
          </p>
          
          <div className="hero-cta-group">
            <Link to="/artists" className="btn btn-primary">
              Book Appointment
            </Link>
            <Link to="/explore" className="btn btn-secondary">
              Explore Features
            </Link>
          </div>
        </div>
        
        <div className="scroll-indicator">
          
        </div>
      </section>
    </div>
  );
}