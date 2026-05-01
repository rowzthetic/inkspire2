import { Link } from 'react-router-dom';
import '../App.css';

export default function Explore() {
  return (
    <section className="explore" style={{ paddingTop: '50px' }}>
      <h2>Explore Inkspire</h2>
      <p className="explore-intro">
          Discover our tools and features designed to make your tattoo journey easier, smarter, and more creative.
      </p>

      <div className="explore-grid">
          {/* Feature 1 */}
          <div className="explore-card">
              <img src="images/heat map.png" alt="Pain Heat Map" />
              <h3>Pain Heat Map</h3>
              <p>See which body areas hurt the most before getting inked.</p>
              <Link to="/pain-map" className="btn">Explore</Link>
          </div>

          {/* Feature 2 - UPDATED LINK HERE */}
          <div className="explore-card">
              <img src="images/lib2.jpg" alt="Tattoo Meaning Library" />
              <h3>Tattoo Meaning Library</h3>
              <p>Discover the stories and symbolism behind popular tattoo designs.</p>
              {/* Changed from "#" to "/library" to connect your new page */}
              <Link to="/library" className="btn">Explore</Link>
          </div>

          {/* Feature 3 */}
          <div className="explore-card">
              <img src="images/prevonskin.webp" alt="Preview on Skin" />
              <h3>Preview on Skin</h3>
              <p>Upload a photo to see how your tattoo will look on your skin.</p>
              <Link to="/ai-suite" className="btn">Try It</Link>
          </div>


          {/* Feature 5 */}
          <div className="explore-card">
              <img src="images/AI1.png" alt="Image Generator" />
              <h3>Image Generator</h3>
              <p>Generate tattoo designs based on your ideas and inspirations.</p>
              <Link to="/ai-suite" className="btn">Try It</Link>
          </div>

          {/* Feature 6 */}
          <div className="explore-card">
              <img src="images/calc.jpg" alt="Price Estimator" />
              <h3>Price Estimator</h3>
              <p>Estimate the cost of your next tattoo based on size and detail.</p>
              <Link to="/estimator" className="btn">Estimate</Link>
          </div>

          {/* Feature 7 */}
          <div className="explore-card">
              <img src="images/artistavv.jpg" alt="Available Artists" />
              <h3>Available Artists</h3>
              <p>Find and book your preferred artist for your next session.</p>
              <Link to="/artists" className="btn">View</Link>
          </div>
      </div>
    </section>
  );
}