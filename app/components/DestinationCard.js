import Link from "next/link";
import Image from "next/image";
import { normalizeImageUrl } from "../lib/images";
import RazorpayBookButton from "./RazorpayBookButton";

export default function DestinationCard({ destination, index = 0 }) {
  const d = destination;
  const heroImage = normalizeImageUrl(d.heroImage);
  return (
    <div
      className={`dest-card animate-fadeInUp stagger-${Math.min(index + 1, 8)}`}
      id={`dest-card-${d.id}`}
    >
      {/* Clickable image/header area → goes to destination detail */}
      <Link href={`/destinations/${d.id}`} className="dest-card-link-area">
        <div className="dest-card-image">
          <Image
            src={heroImage}
            alt={d.name}
            width={800}
            height={440}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
            priority={index < 3}
          />
          <div className="dest-card-image-overlay" />
          <div className="dest-card-region">
            <span className="badge badge-primary">{d.region}</span>
          </div>
        </div>

        <div className="dest-card-body">
          <h3 className="dest-card-name">{d.name}</h3>
          <p className="dest-card-tagline">{d.tagline}</p>

          <div className="dest-card-meta">
            <span className="dest-card-meta-item">📅 {d.duration}</span>
            <span className="dest-card-meta-item">🌤️ {d.bestTime}</span>
          </div>

          <div className="dest-card-highlights">
            {(d.highlights || []).slice(0, 3).map((h) => (
              <span key={h} className="badge badge-accent">{h}</span>
            ))}
          </div>

          <div className="dest-card-price">
            <span className="dest-card-price-label">Package from</span>
            <span className="dest-card-price-value">
              ₹{(d.packagePrice || d.budgetPerDay * 3 || 7500).toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </Link>

      {/* Book Now button — links to /book page with packages */}
      <div className="dest-card-actions">
        <Link
          href={`/destinations/${d.id}`}
          className="btn btn-outline dest-card-explore-btn"
          id={`explore-btn-${d.id}`}
        >
          View Details
        </Link>
        <RazorpayBookButton
          destinationId={d.id}
          destinationName={d.name}
          amountInRupees={d.packagePrice || (d.budgetPerDay || 2500) * 3}
          className="btn btn-primary dest-card-book-btn"
        >
          🎒 Book — ₹{(d.packagePrice || (d.budgetPerDay || 2500) * 3).toLocaleString("en-IN")}
        </RazorpayBookButton>
      </div>
    </div>
  );
}
