import '../App.css';

export default function About() {
  return (
    <section style={{ 
        minHeight: '80vh', 
        backgroundColor: '#0a0a0b', 
        color: '#f0ebe0', 
        padding: '80px 20px',
        fontFamily: "'Inter', sans-serif"
    }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ 
                fontSize: '3rem', 
                color: '#D4AF37', 
                marginBottom: '20px',
                letterSpacing: '2px',
                textTransform: 'uppercase'
            }}>Our Studio, Your Story</h1>
            
            <div style={{ width: '60px', height: '2px', backgroundColor: '#D4AF37', margin: '0 auto 40px' }}></div>
            
            <article style={{ fontSize: '1.2rem', lineHeight: '1.8', textAlign: 'left', color: '#ccc' }}>
                <p style={{ marginBottom: '25px', fontSize: '1.4rem', color: '#f0ebe0', fontStyle: 'italic' }}>
                    Welcome to Inkspire, where the ancient art of tattooing meets the modern digital sanctuary.
                </p>
                
                <p style={{ marginBottom: '25px' }}>
                    Established with a singular vision, our platform transcends the conventional tattoo parlor experience. We believe that every individual holds a canvas of untold stories, and our curated network of master artists is the conduit to bringing those narratives to life in perfect clarity. 
                </p>

                <p style={{ marginBottom: '25px' }}>
                    At Inkspire, our architecture is steeped in deep aesthetic luxury and uncompromised hygiene. From our immersive global galleries right down to our aftercare store, our Deep Charcoal and Antique Gold atmosphere isn’t just a simple design choice; it is exactly reflective of our premium standard of care. Here, the hum of the needle is a meditative ritual. Every virtual consultation is an exploration of your deepest inspirations, ensuring that the final legacy you wear on your skin is distinctly yours.
                </p>
                
                <blockquote style={{ 
                    borderLeft: '4px solid rgba(212, 175, 55, 0.5)', 
                    paddingLeft: '20px', 
                    margin: '40px 0', 
                    fontStyle: 'italic',
                    color: '#D4AF37',
                    fontSize: '1.35rem',
                    background: 'rgba(212, 175, 55, 0.05)',
                    padding: '20px',
                    borderRadius: '0 8px 8px 0'
                }}>
                    "A tattoo is more than ink; it is a permanent echo of an impermanent moment."
                </blockquote>

                <p style={{ marginBottom: '25px' }}>
                    Whether you are embarking on your very first tattoo journey, managing daily insights as a professional studio owner, or searching for the final grand piece to complete your aesthetic collection, our ecosystem simplifies everything. Artists can seamlessly sync their portfolios directly to you, while you can track healing processes via our dedicated dashboard arrays or preview new designs using our cutting-edge AI skin suite.
                </p>

                <p style={{ fontWeight: 'bold', color: '#f0ebe0', marginTop: '40px', textAlign: 'center', fontSize: '1.3rem', letterSpacing: '1px' }}>
                    Embrace the needle. Find your master.
                </p>
            </article>
        </div>
    </section>
  );
}