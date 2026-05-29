import Link from "next/link";
import Image from "next/image";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ItineraryTimeline from "../../components/ItineraryTimeline";
import ExpenseCalculator from "../../components/ExpenseCalculator";
import localDestinations from "../../../backend/data/destinations.json";
import { normalizeImageUrl } from "../../lib/images";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// SEO Metadata
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const d = localDestinations.find((dest) => dest.id === id);
  
  if (!d) {
    return {
      title: "Destination Not Found | Travel Threads",
      description: "The requested destination could not be found.",
    };
  }

  return {
    title: `${d.name} Travel Guide & Day-by-Day Itinerary | Travel Threads`,
    description: `Plan your perfect trip to ${d.name}, ${d.state}. Explore a customized ${d.duration} day-by-day itinerary, view approximate costs, best time to visit, and expert travel tips.`,
  };
}

async function getDestination(id) {
  try {
    const res = await fetch(`${API}/api/destinations/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("API error");
    const json = await res.json();
    return json.data;
  } catch (err) {
    // Fallback to local import if backend is not running during build
    return localDestinations.find((d) => d.id === id) || null;
  }
}

export default async function DestinationDetailPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const d = await getDestination(id);

  if (d) {
    d.heroImage = normalizeImageUrl(d.heroImage);
    d.images = (d.images || []).map((img) => normalizeImageUrl(img));
  }

  if (!d) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: "center", padding: "10rem 2rem", minHeight: "60vh" }}>
          <h2>📍 Destination Not Found</h2>
          <p style={{ color: "var(--text-muted)", margin: "1rem 0 2rem" }}>
            The destination you are looking for does not exist or has been removed.
          </p>
          <Link href="/destinations" className="btn btn-primary">
            Back to Destinations
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ── HERO BANNER ────────────────────── */}
      <section className="detail-hero" id="detail-hero-section">
        <div className="hero-bg">
          <Image
            src={d.heroImage}
            alt={`${d.name} - ${d.tagline}`}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <div className="container">
            <span className="badge badge-primary" style={{ alignSelf: "flex-start" }}>
              📍 {d.region} &nbsp;·&nbsp; {d.state}
            </span>
            <h1 className="detail-title gradient-text">{d.name}</h1>
            <p className="detail-tagline">{d.tagline}</p>
            
            <div className="detail-meta">
              <div className="detail-meta-item">
                📅 Duration: <strong>{d.duration}</strong>
              </div>
              <div className="detail-meta-item">
                🌤️ Best Time: <strong>{d.bestTime}</strong>
              </div>
              {d.altitude && (
                <div className="detail-meta-item">
                  🏔️ Altitude: <strong>{d.altitude}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── DETAIL CONTENT Grid ───────────── */}
      <section className="detail-content" id="detail-content-section">
        <div className="container">
          <div className="detail-grid">
            
            {/* Left Column: Itinerary & Gallery */}
            <div>
              <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-md)" }}>
                ✨ About {d.name}
              </h2>
              <p className="detail-description">{d.description}</p>

              <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-md)", marginTop: "var(--space-2xl)" }}>
                📸 Visual Gallery
              </h2>
              <div className="detail-gallery">
                {(d.images || []).map((img, index) => (
                  <div key={index} className="detail-gallery-item">
                    <Image
                      src={img}
                      alt={`${d.name} scene ${index + 1}`}
                      width={400}
                      height={250}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    />
                  </div>
                ))}
              </div>

              <h2 style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-xl)", marginTop: "var(--space-3xl)" }}>
                🗓️ Curated Day-by-Day Itinerary
              </h2>
              <ItineraryTimeline itinerary={d.itinerary} />
            </div>

            {/* Right Column: Sidebar (Tips, Highlights) */}
            <div className="detail-sidebar">
              
              {/* Highlights */}
              <div className="detail-card">
                <h3 className="detail-card-title">🎯 Key Highlights</h3>
                <div className="detail-highlights">
                  {(d.highlights || []).map((h) => (
                    <span key={h} className="badge badge-accent" style={{ fontSize: "var(--text-sm)", marginBottom: "4px", marginRight: "4px" }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Local Tips */}
              <div className="detail-card">
                <h3 className="detail-card-title">💡 Local Expert Tips</h3>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(d.travelTips || []).map((tip, index) => (
                    <div key={index} className="detail-tip">
                      <span className="detail-tip-icon">✦</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation / Action */}
              <div className="detail-card" style={{
                background: "linear-gradient(135deg, hsla(210, 100%, 50%, 0.08), hsla(35, 100%, 50%, 0.08))",
                border: "1px solid var(--primary-light)",
                textAlign: "center"
              }}>
                <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-sm)" }}>
                  Need a custom plan?
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-md)" }}>
                  Use our interactive budget tool to tailor expenses for your travel party and style!
                </p>
                <Link href="#expense-planner-section" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  🧮 Go to Calculator
                </Link>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── EXPENSE CALCULATOR SECTION ────── */}
      <section className="section" id="expense-planner-section" style={{
        borderTop: "1px solid var(--border-light)",
        background: "hsla(220, 25%, 8%, 0.5)"
      }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <h2 className="section-title">
              💰 Plan Your <span className="gradient-text">Budget for {d.name}</span>
            </h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Calculate lodging, food, activities, and transport for your exact group size and trip length.
            </p>
          </div>
          
          <ExpenseCalculator defaultDestination={d.id} />
        </div>
      </section>

      <Footer />
    </>
  );
}
