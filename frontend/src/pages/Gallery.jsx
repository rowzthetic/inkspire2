import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/gallery/');
        if (!response.ok) throw new Error('Failed to fetch gallery');
        const data = await response.json();
        setImages(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  if (loading) {
      return (
          <section className="gallery">
              <h2>Our Work</h2>
              <p style={{textAlign: 'center'}}>Loading artists' work...</p>
          </section>
      );
  }

  return (
    <section className="gallery">
        <h2>Our Work</h2>
        
        {images.length === 0 ? (
            <p style={{textAlign: 'center'}}>No tattoos found.</p>
        ) : (
            <div className="grid">
                {images.map(item => (
                    <div 
                        key={item.id} 
                        className="gallery-card"
                        onClick={() => item.artist_id && navigate(`/profile/${item.artist_id}`)}
                        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '8px' }}
                    >
                        <img 
                            src={item.image} 
                            alt={`Tattoo by ${item.artist_name || 'Artist'}`} 
                            style={{ width: '100%', display: 'block', transition: 'all 0.3s ease', border: '2px solid transparent' }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.border = '2px solid #D4AF37';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.border = '2px solid transparent';
                            }}
                        />
                        {item.artist_name && (
                            <div style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '0',
                                width: '100%',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#D4AF37', // Antique Gold
                                padding: '10px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                By {item.artist_name}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
    </section>
  );
}