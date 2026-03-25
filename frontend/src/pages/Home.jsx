import { Link } from 'react-router-dom';
import '../App.css';

export default function Home() {
  return (
    <>
      <section id="home" className="hero">
        <div className="hero-content">
            <h1>Ink that Inspires</h1>
            <p>Custom designs. Timeless artistry. Crafted with passion.</p>
            <Link to="/artists" className="btn">View Artists & Book Appointment</Link>
            {/* Added a button to go to Explore from Home */}
            <div style={{marginTop: '20px'}}>
              <Link to="/explore" style={{color: '#fff', textDecoration: 'underline'}}>or Explore Features</Link>
            </div>
        </div>
      </section>
    </>
  );
}