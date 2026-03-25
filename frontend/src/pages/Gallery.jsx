import '../App.css';

export default function Gallery() {
  return (
    <section className="gallery">
        <h2>Our Work</h2>
        <div className="grid">
            <img src="images/tattoo1.png" alt="Tattoo sample 1" />
            <img src="images/tattoo2.jpg" alt="Tattoo sample 2" />
            <img src="images/tattoo3.jpg" alt="Tattoo sample 3" />
            <img src="images/tattoo4.jpg" alt="Tattoo sample 4" />
            <img src="images/tattoo5.jpg" alt="Tattoo sample 5" />
            <img src="images/tattoo6.jpg" alt="Tattoo sample 6" />
        </div>
    </section>
  );
}