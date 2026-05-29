"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredAuth } from "../lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function formatRupeesFromPaise(paise) {
  const rupees = Math.round(Number(paise || 0) / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export default function BookingsPage() {
  const [auth] = useState(() => getStoredAuth());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminBookings, setAdminBookings] = useState([]);
  const isAdmin = auth?.user?.role === "admin";

  useEffect(() => {
    const load = async () => {
      if (!auth?.token) {
        setError("Please login to view your bookings.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/bookings`, {
          headers: { Authorization: `Bearer ${auth.token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load bookings");
        }
        setBookings(json.data || []);
      } catch (err) {
        setError(err.message || "Could not load bookings right now.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auth?.token]);

  useEffect(() => {
    const loadAdmin = async () => {
      if (!auth?.token || !isAdmin) return;
      setAdminLoading(true);
      setAdminError("");
      try {
        const res = await fetch(`${API}/api/admin/bookings`, {
          headers: { Authorization: `Bearer ${auth.token}` },
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load admin bookings");
        }
        setAdminBookings(json.data || []);
      } catch (err) {
        setAdminError(err.message || "Could not load admin bookings right now.");
      } finally {
        setAdminLoading(false);
      }
    };

    loadAdmin();
  }, [auth?.token, isAdmin]);

  return (
    <>
      <Navbar />
      <main className="section" style={{ paddingTop: "calc(var(--nav-height) + var(--space-3xl))" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-md)", flexWrap: "wrap" }}>
            <div>
              <h1 className="section-title">
                ✅ <span className="gradient-text">My Bookings</span>
              </h1>
              <p className="section-subtitle">Your confirmed package payments (Razorpay verified).</p>
            </div>
            <Link href="/book" className="btn btn-outline">
              🎒 Book another trip
            </Link>
          </div>

          {loading ? <p className="packages-loading">Loading bookings...</p> : null}
          {error ? <p className="packages-error">{error}</p> : null}

          {!loading && !error && bookings.length === 0 ? (
            <div className="glass" style={{ padding: "var(--space-xl)", borderRadius: "var(--radius-xl)" }}>
              <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                No bookings yet. Go to <Link href="/book">Book</Link> and complete a payment to see it here.
              </p>
            </div>
          ) : null}

          {!loading && !error && bookings.length > 0 ? (
            <div className="packages-grid" style={{ marginTop: "var(--space-xl)" }}>
              {bookings.map((b) => (
                <article key={b.id} className="package-card">
                  <h3 style={{ marginTop: 0 }}>{b.destinationName}</h3>
                  <p className="package-meta">💳 Paid {formatRupeesFromPaise(b.amount)} · {b.currency}</p>
                  <p className="package-tagline" style={{ wordBreak: "break-word" }}>
                    Order: {b.razorpayOrderId}
                    <br />
                    Payment: {b.razorpayPaymentId}
                  </p>
                  <Link href={`/destinations/${b.destinationId}`} className="btn btn-primary">
                    View Destination
                  </Link>
                </article>
              ))}
            </div>
          ) : null}

          {isAdmin ? (
            <section style={{ marginTop: "var(--space-3xl)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "var(--space-md)", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-xs)" }}>
                    🛡️ <span className="gradient-text">All Users Bookings</span>
                  </h2>
                  <p className="section-subtitle" style={{ marginBottom: 0 }}>
                    Admin view of all confirmed package payments.
                  </p>
                </div>
              </div>

              {adminLoading ? <p className="packages-loading">Loading all bookings...</p> : null}
              {adminError ? <p className="packages-error">{adminError}</p> : null}

              {!adminLoading && !adminError && adminBookings.length === 0 ? (
                <div className="glass" style={{ padding: "var(--space-xl)", borderRadius: "var(--radius-xl)", marginTop: "var(--space-xl)" }}>
                  <p style={{ margin: 0, color: "var(--text-secondary)" }}>
                    No bookings found yet.
                  </p>
                </div>
              ) : null}

              {!adminLoading && !adminError && adminBookings.length > 0 ? (
                <div className="packages-grid" style={{ marginTop: "var(--space-xl)" }}>
                  {adminBookings.map((b) => (
                    <article key={b.id} className="package-card">
                      <h3 style={{ marginTop: 0 }}>{b.destinationName}</h3>
                      <p className="package-meta">
                        👤 {b.userName}{b.userEmail ? ` · ${b.userEmail}` : ""}
                      </p>
                      <p className="package-meta">💳 Paid {formatRupeesFromPaise(b.amount)} · {b.currency}</p>
                      <p className="package-tagline" style={{ wordBreak: "break-word" }}>
                        Order: {b.razorpayOrderId}
                        <br />
                        Payment: {b.razorpayPaymentId}
                      </p>
                      <Link href={`/destinations/${b.destinationId}`} className="btn btn-primary">
                        View Destination
                      </Link>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}

