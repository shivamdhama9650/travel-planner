"use client";
import { useMemo, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DestinationCard from "../components/DestinationCard";

const FALLBACK = [
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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const REGIONS = ["All", "North India", "West India", "Northeast India"];

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState(FALLBACK);
  const [region, setRegion] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("rating");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(`${API}/api/destinations`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setDestinations(json.data || FALLBACK);
      } catch {
        setDestinations(FALLBACK);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...destinations];

    if (region !== "All") {
      result = result.filter((d) => d.region === region);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.tagline.toLowerCase().includes(q) ||
          (d.highlights || []).some((h) => h.toLowerCase().includes(q))
      );
    }

    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    else if (sort === "budget") result.sort((a, b) => a.budgetPerDay - b.budgetPerDay);
    else if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [destinations, region, search, sort]);

  return (
    <>
      <Navbar />

      <div className="page-header">
        <div className="container">
          <h1>
            Explore <span className="gradient-text">Destinations</span>
          </h1>
          <p>Discover India’s most incredible places with curated itineraries</p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          {/* Filter Bar */}
          <div className="filter-bar" id="filter-bar">
            <div className="filter-pills">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  className={`filter-pill ${region === r ? "active" : ""}`}
                  onClick={() => setRegion(r)}
                  id={`filter-${r.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {r === "All" ? "🌍 All" : r === "North India" ? "🏔️ North" : r === "West India" ? "🏖️ West" : "🌿 Northeast"}
                </button>
              ))}
            </div>

            <div className="filter-search">
              <span className="filter-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search destinations, places..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="search-input"
              />
            </div>

            <select
              className="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              id="sort-select"
            >
              <option value="rating">⭐ Top Rated</option>
              <option value="budget">💰 Budget-Friendly</option>
              <option value="name">🔤 Alphabetical</option>
            </select>
          </div>

          {/* Results */}
          {loading ? (
            <div className="destinations-grid">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="dest-card" style={{ opacity: 0.5 }}>
                  <div className="skeleton" style={{ height: 220 }} />
                  <div style={{ padding: "var(--space-lg)" }}>
                    <div className="skeleton" style={{ height: 24, width: "60%", marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 16, width: "80%", marginBottom: 16 }} />
                    <div className="skeleton" style={{ height: 32 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--space-4xl)", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--space-md)" }}>🔍</div>
              <h3>No destinations found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
          ) : (
            <>
              <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-lg)" }}>
                Showing {filtered.length} destination{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="destinations-grid">
                {filtered.map((d, i) => (
                  <DestinationCard key={d.id} destination={d} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
