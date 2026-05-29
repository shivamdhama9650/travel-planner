import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OurPackages from "../components/OurPackages";
import Link from "next/link";

export const metadata = {
  title: "Book Your Trip | Travel Threads",
  description:
    "Browse and book curated travel packages across India's most stunning destinations — Manali, Ladakh, Goa, Meghalaya, and more.",
};

export default function BookPage() {
  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────── */}
      <section
        style={{
          paddingTop: "calc(var(--navbar-h) + var(--space-3xl))",
          paddingBottom: "var(--space-3xl)",
          textAlign: "center",
          background:
            "linear-gradient(160deg, hsla(220,80%,8%,1) 0%, hsla(260,60%,12%,1) 50%, hsla(220,80%,8%,1) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background:
              "radial-gradient(ellipse 60% 40% at 20% 50%, hsla(260,80%,55%,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 80% 50%, hsla(35,100%,55%,0.10) 0%, transparent 70%)",
          }}
        />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <span
            className="hero-badge animate-fadeInUp"
            style={{ display: "inline-block", marginBottom: "var(--space-md)" }}
          >
            🎒 Curated Travel Packages
          </span>
          <h1
            className="animate-fadeInUp stagger-1"
            style={{ fontSize: "var(--text-4xl)", marginBottom: "var(--space-md)" }}
          >
            Book Your Next{" "}
            <span className="gradient-text">Adventure</span>
          </h1>
          <p
            className="animate-fadeInUp stagger-2"
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--text-lg)",
              maxWidth: 560,
              margin: "0 auto var(--space-xl)",
            }}
          >
            Choose from our hand-curated packages across India's most iconic destinations.
            Flexible budgets, detailed itineraries, and smart expense planning included.
          </p>
          <div
            className="animate-fadeInUp stagger-3"
            style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link href="/destinations" className="btn btn-outline btn-lg">
              📍 Browse All Destinations
            </Link>
            <Link href="/calculator" className="btn btn-accent btn-lg">
              🧮 Estimate Cost
            </Link>
          </div>
        </div>
      </section>

      {/* ── OUR PACKAGES (shown first) ───────── */}
      <OurPackages />

      {/* ── HOW IT WORKS ─────────────────────── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <h2 className="section-title">
              How <span className="gradient-text">Booking Works</span>
            </h2>
            <p className="section-subtitle">Three simple steps to your dream trip</p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "var(--space-xl)",
            }}
          >
            {[
              { step: "01", icon: "🗺️", title: "Pick a Package", desc: "Browse our curated destinations above and select the one that inspires you." },
              { step: "02", icon: "🧮", title: "Estimate Budget", desc: "Use our smart calculator to plan expenses for your group size and travel style." },
              { step: "03", icon: "💸", title: "Split & Go", desc: "Use Split-Yatra to divide costs among friends and settle up before you leave." },
            ].map((item) => (
              <div key={item.step} className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-sm)" }}>{item.icon}</div>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 700,
                    color: "var(--accent)",
                    letterSpacing: "0.1em",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  STEP {item.step}
                </div>
                <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-xs)" }}>
                  {item.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────── */}
      <section className="section" id="book-cta">
        <div className="container">
          <div
            className="glass"
            style={{
              padding: "var(--space-3xl)",
              borderRadius: "var(--radius-xl)",
              textAlign: "center",
              background: "linear-gradient(135deg, hsla(260,80%,55%,0.1), hsla(35,100%,55%,0.1))",
            }}
          >
            <h2 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-md)" }}>
              Need a Custom <span className="gradient-text">Itinerary?</span>
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-lg)",
                maxWidth: 500,
                margin: "0 auto var(--space-xl)",
              }}
            >
              Build a custom budget with our expense calculator, then split costs with your group using Split-Yatra.
            </p>
            <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/calculator" className="btn btn-accent btn-lg" id="book-calc-btn">
                🧮 Calculate Expenses
              </Link>
              <Link href="/splitwise" className="btn btn-outline btn-lg" id="book-split-btn">
                💸 Split with Friends
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
