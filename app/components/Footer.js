import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-brand-name">
              🌏 <span className="gradient-text">Travel Threads</span>
            </div>
            <p className="footer-brand-desc">
              Your ultimate travel companion for exploring the incredible
              diversity of India. From snow-capped Himalayas to sun-kissed
              beaches, we help you plan the perfect trip.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Destinations</h4>
            <div className="footer-links">
              <Link href="/destinations?region=north" className="footer-link">North India</Link>
              <Link href="/destinations?region=west" className="footer-link">West India</Link>
              <Link href="/destinations?region=northeast" className="footer-link">Northeast India</Link>
              <Link href="/destinations" className="footer-link">All Destinations</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Plan</h4>
            <div className="footer-links">
              <Link href="/calculator" className="footer-link">Expense Calculator</Link>
              <Link href="/destinations" className="footer-link">Itineraries</Link>
              <Link href="/destinations" className="footer-link">Travel Tips</Link>
            </div>
          </div>

          <div>
            <h4 className="footer-col-title">Popular</h4>
            <div className="footer-links">
              <Link href="/destinations/manali" className="footer-link">Manali</Link>
              <Link href="/destinations/goa" className="footer-link">Goa</Link>
              <Link href="/destinations/meghalaya" className="footer-link">Meghalaya</Link>
              <Link href="/destinations/ladakh" className="footer-link">Leh-Ladakh</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Travel Threads. Made with ❤️ for Indian Travelers.</p>
          <p> shivamdhama9650@gmail.com   || +91 9650121086</p>
          <div className="footer-socials">
            <a href="#" className="footer-social" aria-label="Instagram" id="social-instagram">📷</a>
            <a href="#" className="footer-social" aria-label="Twitter" id="social-twitter">🐦</a>
            <a href="#" className="footer-social" aria-label="YouTube" id="social-youtube">🎬</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
