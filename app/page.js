import Link from "next/link";
import Image from "next/image";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DestinationCard from "./components/DestinationCard";
import TravelBot from "./components/TravelBot";
import localDestinations from "../backend/data/destinations.json";
import localPackagePrices from "../backend/data/packages.json";

async function getDestinations() {
  return localDestinations.map((destination) => ({
    id: destination.id,
    name: destination.name,
    tagline: destination.tagline,
    region: destination.region,
    heroImage: destination.heroImage,
    rating: destination.rating,
    bestTime: destination.bestTime,
    duration: destination.duration,
    highlights: (destination.highlights || []).slice(0, 3),
    budgetPerDay:
      (destination.expenses?.budget?.accommodation || 0) +
      (destination.expenses?.budget?.food || 0) +
      (destination.expenses?.budget?.transport || 0) +
      (destination.expenses?.budget?.activities || 0) +
      (destination.expenses?.budget?.misc || 0),
    packagePrice: Number(localPackagePrices[destination.id] || 7500),
  }));
}

function getFallbackDestinations() {
  return [
    {
      id: "manali", name: "Manali", tagline: "Gateway to the Himalayas", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      rating: 4.7, bestTime: "Oct – Jun", duration: "4-5 Days",
      highlights: ["Rohtang Pass", "Solang Valley", "Old Manali"], budgetPerDay: 2500,
    },
    {
      id: "shimla", name: "Shimla", tagline: "Queen of Hill Stations", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&q=80",
      rating: 4.5, bestTime: "Mar – Jun", duration: "3-4 Days",
      highlights: ["Mall Road", "Jakhoo Temple", "Toy Train"], budgetPerDay: 2000,
    },
    {
      id: "jaipur", name: "Jaipur", tagline: "The Pink City", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80",
      rating: 4.8, bestTime: "Oct – Mar", duration: "3-4 Days",
      highlights: ["Amber Fort", "Hawa Mahal", "City Palace"], budgetPerDay: 2000,
    },
    {
      id: "rishikesh", name: "Rishikesh", tagline: "Yoga Capital of the World", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1572453800999-e8d2d1589b7c?w=800&q=80",
      rating: 4.6, bestTime: "Sep – Nov", duration: "3-4 Days",
      highlights: ["Laxman Jhula", "Rafting", "Beatles Ashram"], budgetPerDay: 2150,
    },
    {
      id: "varanasi", name: "Varanasi", tagline: "The Eternal City", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=800&q=80",
      rating: 4.6, bestTime: "Oct – Mar", duration: "3-4 Days",
      highlights: ["Ghats", "Ganga Aarti", "Sarnath"], budgetPerDay: 1600,
    },
    {
      id: "goa", name: "Goa", tagline: "Beach Paradise of India", region: "West India",
      heroImage: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
      rating: 4.7, bestTime: "Nov – Feb", duration: "4-5 Days",
      highlights: ["Baga Beach", "Fort Aguada", "Dudhsagar"], budgetPerDay: 2300,
    },
    {
      id: "meghalaya", name: "Meghalaya", tagline: "Abode of Clouds", region: "Northeast India",
      heroImage: "https://images.unsplash.com/photo-1592639296346-560c37a0f711?w=800&q=80",
      rating: 4.9, bestTime: "Oct – May", duration: "5-6 Days",
      highlights: ["Root Bridges", "Dawki River", "Caves"], budgetPerDay: 2000,
    },
    {
      id: "ladakh", name: "Leh-Ladakh", tagline: "Land of High Passes", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&q=80",
      rating: 4.9, bestTime: "Jun – Sep", duration: "6-7 Days",
      highlights: ["Pangong Lake", "Khardung La", "Monasteries"], budgetPerDay: 3100,
    },
    {
      id: "kedarnath", name: "Kedarnath", tagline: "The Sacred Abode of Shiva", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=800&q=80",
      rating: 4.9, bestTime: "May – Jun, Sep – Oct", duration: "3-4 Days",
      highlights: ["Kedarnath Temple", "Gauri Kund", "Vasuki Tal"], budgetPerDay: 2000,
    },
    {
      id: "madhyamaheshwar", name: "Madhya Maheshwar", tagline: "The Mystical Fourth Kedar", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
      rating: 4.8, bestTime: "May – Oct", duration: "3-4 Days",
      highlights: ["Madmaheshwar Temple", "Budha Madmaheshwar", "Chaukhamba Peak"], budgetPerDay: 1500,
    },
    {
      id: "dharamshala", name: "Dharamshala", tagline: "Home of the Dalai Lama", region: "North India",
      heroImage: "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=800&q=80",
      rating: 4.7, bestTime: "Mar – Jun, Sep – Dec", duration: "3-4 Days",
      highlights: ["McLeod Ganj", "Dalai Lama Temple", "Triund Trek"], budgetPerDay: 2000,
    },
    {
      id: "ujjain", name: "Ujjain", tagline: "The Eternal City of Mahakal", region: "Central India",
      heroImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
      rating: 4.8, bestTime: "Oct – Mar", duration: "2-3 Days",
      highlights: ["Mahakaleshwar Temple", "Ram Ghat Shipra Aarti", "Harsiddhi Temple"], budgetPerDay: 1500,
    }
  ];
}

function uniqueDestinations(list) {
  const seen = new Set();
  return list.filter((d) => {
    const key = (d.id || d.name || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default async function Home() {
  const destinations = uniqueDestinations(await getDestinations());
  const featured = destinations.slice(0, 4);

  return (
    <>
      <Navbar />

      {/* ── HERO ─────────────────────────────── */}
      <section className="hero" id="hero-section">
        <div className="hero-bg">
          <Image
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
            alt="Breathtaking mountain landscape"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
        <div className="hero-overlay" />

        <span className="hero-float">🏔️</span>
        <span className="hero-float">✈️</span>
        <span className="hero-float">🌊</span>

        <div className="hero-content">
          <div className="hero-badge">
            ✨ Your Ultimate India Travel Companion
          </div>
          <h1>
            Discover the <span className="gradient-text">Magic of India</span>
          </h1>
          <p>
            Curated itineraries, breathtaking destinations, and smart expense
            planning — everything you need for your next unforgettable
            adventure across incredible India.
          </p>
          <div className="hero-actions">
            <Link href="/destinations" className="btn btn-primary btn-lg" id="hero-explore-btn">
              🗺️ Explore Destinations
            </Link>
            <Link href="/calculator" className="btn btn-outline btn-lg" id="hero-calc-btn">
              🧮 Plan Your Budget
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">12+</div>
              <div className="hero-stat-label">Destinations</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">30+</div>
              <div className="hero-stat-label">Day Itineraries</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">₹0</div>
              <div className="hero-stat-label">Planning Cost</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED DESTINATIONS ────────────── */}
      <section className="section" id="featured-section">
        <div className="container">
          <div style={{ marginBottom: "var(--space-2xl)" }}>
            <h2 className="section-title">
              🔥 <span className="gradient-text">Featured</span> Destinations
            </h2>
            <p className="section-subtitle">
              Hand-picked destinations with curated day-by-day itineraries
            </p>
          </div>
          <div className="destinations-grid">
            {featured.map((d, i) => (
              <DestinationCard key={d.id} destination={d} index={i} />
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "var(--space-2xl)" }}>
            <Link href="/destinations" className="btn btn-outline btn-lg" id="view-all-btn">
              View All Destinations →
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────── */}
      <section className="section" id="features-section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
            <h2 className="section-title">
              Why Travelers <span className="gradient-text">Love Travel Threads</span>
            </h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              Everything you need to plan the perfect Indian adventure
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🗓️</div>
              <h3 className="feature-title">Day-by-Day Itineraries</h3>
              <p className="feature-desc">
                Detailed plans for every day of your trip — from morning
                activities to evening experiences. No more guesswork.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3 className="feature-title">Smart Expense Calculator</h3>
              <p className="feature-desc">
                Plan your budget with our intelligent calculator. Choose your
                travel style and get instant cost breakdowns.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Local Insider Tips</h3>
              <p className="feature-desc">
                Insider tips from experienced travelers — the best food,
                hidden gems, and things only locals know about.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3 className="feature-title">Stunning Visuals</h3>
              <p className="feature-desc">
                Beautiful photography of every destination to inspire your
                wanderlust and help you choose your next adventure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOK NOW BANNER ───────────────────── */}
      <section className="section" id="book-banner-section">
        <div className="container">
          <div
            className="glass"
            style={{
              padding: "var(--space-3xl)",
              borderRadius: "var(--radius-xl)",
              textAlign: "center",
              background:
                "linear-gradient(135deg, hsla(260, 80%, 55%, 0.12), hsla(35, 100%, 55%, 0.12))",
              border: "1px solid hsla(260, 80%, 55%, 0.2)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>🎒</div>
            <h2
              style={{
                fontSize: "var(--text-3xl)",
                marginBottom: "var(--space-md)",
              }}
            >
              Ready to{" "}
              <span className="gradient-text">Book Your Trip?</span>
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-lg)",
                maxWidth: 520,
                margin: "0 auto var(--space-xl)",
              }}
            >
              Browse our curated packages across India’s most iconic destinations.
              Flexible budgets, smart itineraries, and group expense splitting.
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-md)",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/book" className="btn btn-primary btn-lg" id="home-book-btn">
                🎒 Book Now
              </Link>
              <Link href="/calculator" className="btn btn-outline btn-lg" id="home-calc-btn">
                🧮 Estimate Cost
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────── */}
      <section className="section" id="cta-section">
        <div className="container">
          <div
            className="glass"
            style={{
              padding: "var(--space-3xl)",
              borderRadius: "var(--radius-xl)",
              textAlign: "center",
              background:
                "linear-gradient(135deg, hsla(210, 100%, 50%, 0.1), hsla(35, 100%, 50%, 0.1))",
            }}
          >
            <h2
              style={{
                fontSize: "var(--text-3xl)",
                marginBottom: "var(--space-md)",
              }}
            >
              Ready to Start Your{" "}
              <span className="gradient-text">Adventure?</span>
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-lg)",
                maxWidth: 500,
                margin: "0 auto var(--space-xl)",
              }}
            >
              Calculate your trip expenses and start planning the journey of a
              lifetime.
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--space-md)",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/calculator" className="btn btn-accent btn-lg" id="cta-calc-btn">
                🧮 Calculate Expenses
              </Link>
              <Link href="/destinations" className="btn btn-outline btn-lg" id="cta-explore-btn">
                🗺️ Browse Destinations
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <TravelBot />
    </>
  );
}
