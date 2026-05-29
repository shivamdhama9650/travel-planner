"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getStoredAuth } from "../lib/auth";
import { normalizeImageUrl } from "../lib/images";
import localDestinations from "../../backend/data/destinations.json";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const FALLBACK_PRICES = {
  manali: 12500,
  goa: 14500,
  meghalaya: 16800,
  jaipur: 8900,
  ladakh: 24500,
  rishikesh: 6500,
  varanasi: 5900,
  shimla: 9800,
  kedarnath: 15500,
  madhyamaheshwar: 11000,
  dharamshala: 7800,
  ujjain: 4900,
};

const COUPONS = {
  INDIA50: { discount: 50, type: "percent", label: "50% Off India Splendor" },
  WANDERLUST: { discount: 2000, type: "flat", label: "₹2,000 Off Wanderlust Special" },
  FIRSTTRIP: { discount: 10, type: "percent", label: "10% Off First Adventure" },
};

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutForm() {
  const searchParams = useSearchParams();
  const destId = searchParams.get("destination") || "manali";

  const [auth, setAuth] = useState({ token: "", user: null });
  const [destination, setDestination] = useState(null);
  const [packagePrice, setPackagePrice] = useState(15000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form Fields
  const [numTravelers, setNumTravelers] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Coupon Fields
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Payment states
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Sync authentication and load data
  useEffect(() => {
    const currentAuth = getStoredAuth();
    setAuth(currentAuth);
    if (currentAuth.user) {
      setContactName(currentAuth.user.name || "");
      setContactEmail(currentAuth.user.email || "");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch Destination
        let dest = null;
        try {
          const res = await fetch(`${API}/api/destinations/${destId}`);
          const json = await res.json();
          if (res.ok && json.success) {
            dest = json.data;
          }
        } catch (err) {
          console.warn("Backend not reachable, loading local fallback destination");
        }

        if (!dest) {
          dest = localDestinations.find((d) => d.id === destId);
        }

        if (!dest) {
          throw new Error("Destination not found");
        }

        setDestination(dest);

        // Fetch Package Price
        let price = FALLBACK_PRICES[destId] || 15000;
        try {
          const res = await fetch(`${API}/api/packages`);
          const json = await res.json();
          if (res.ok && json.success) {
            const pkg = json.data.find((p) => p.id === destId);
            if (pkg) price = pkg.packagePrice;
          }
        } catch (err) {
          console.warn("Backend packages API not reachable, using fallback price");
        }

        setPackagePrice(price);
      } catch (err) {
        setError(err.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destId]);

  // Price Calculations
  const basePrice = packagePrice * numTravelers;
  
  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const rule = COUPONS[appliedCoupon];
    if (!rule) return 0;
    if (rule.type === "percent") {
      return Math.round(basePrice * (rule.discount / 100));
    }
    return Math.min(rule.discount, basePrice);
  }, [appliedCoupon, basePrice]);

  const subtotal = basePrice - discount;
  const gstAmount = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + gstAmount;

  // Handlers
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    const code = String(couponInput).trim().toUpperCase();
    if (!code) return;

    if (COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponInput("");
    } else {
      setCouponError("Invalid coupon code.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handlePayment = async () => {
    setPaymentError("");
    if (!auth.token) {
      setPaymentError("You must be logged in to book a trip.");
      return;
    }
    if (!startDate) {
      setPaymentError("Please select a start date.");
      return;
    }
    if (!contactPhone.trim()) {
      setPaymentError("Please enter a contact phone number.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay Payment Gateway. Please check your internet connection.");
      }

      // 2. Create Order on Backend
      const orderRes = await fetch(`${API}/api/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          amount: totalAmount * 100, // paise
          currency: "INR",
          receipt: `rcpt_${destId}_${Date.now()}`,
          notes: {
            destinationId: destId,
            destinationName: destination?.name || destId,
            numTravelers: String(numTravelers),
            startDate,
          },
        }),
      });

      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) {
        throw new Error(orderJson.message || "Failed to initiate payment.");
      }

      const orderData = orderJson.data;

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_Sv9nZiXDEaTXWM",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Travel Threads",
        description: `Trip booking to ${destination.name}`,
        image: destination.heroImage ? normalizeImageUrl(destination.heroImage) : "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&q=80",
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            setSubmitting(true);
            setPaymentError("");

            // 4. Verify Payment Signature on Backend
            const verifyRes = await fetch(`${API}/api/verify-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth.token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                destinationId: destId,
                destinationName: destination.name,
                amount: orderData.amount,
                currency: orderData.currency,
              }),
            });

            const verifyJson = await verifyRes.json();
            if (!verifyRes.ok || !verifyJson.success) {
              throw new Error(verifyJson.message || "Payment verification failed.");
            }

            setBookingData({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: totalAmount,
              date: startDate,
              travelers: numTravelers,
            });
            setBookingSuccess(true);
          } catch (err) {
            setPaymentError(err.message || "Unable to verify signature. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: contactName,
          email: contactEmail,
          contact: contactPhone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setPaymentError("Payment process cancelled by user.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setPaymentError(`Payment Failed: ${response.error.description}`);
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.message || "Failed to process booking checkout.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading checkout details...</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
        <h2 style={{ color: "var(--danger)" }}>Checkout Error</h2>
        <p style={{ color: "var(--text-secondary)", margin: "1rem 0 2rem" }}>{error || "Destination could not be loaded."}</p>
        <Link href="/destinations" className="btn btn-outline">
          Back to Destinations
        </Link>
      </div>
    );
  }

  if (bookingSuccess && bookingData) {
    return (
      <div className="glass-strong animate-scaleIn" style={{
        maxWidth: 600,
        margin: "4rem auto",
        padding: "var(--space-3xl)",
        borderRadius: "var(--radius-xl)",
        textAlign: "center",
        border: "1px solid var(--success)",
        boxShadow: "0 0 40px hsla(150, 70%, 45%, 0.15)",
      }}>
        <div style={{ fontSize: "4.5rem", marginBottom: "var(--space-md)", animation: "float 3s ease-in-out infinite" }}>🎉</div>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-sm)" }}>
          Booking <span style={{ color: "var(--success)" }}>Confirmed!</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)" }}>
          Your trip to **{destination.name}** is secure. A confirmation receipt has been sent to your email.
        </p>

        <div className="glass" style={{
          padding: "var(--space-lg)",
          borderRadius: "var(--radius-md)",
          textAlign: "left",
          fontSize: "var(--text-sm)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-xl)",
          border: "1px solid var(--border)",
        }}>
          <div>📍 Destination: <strong>{destination.name}</strong></div>
          <div>📅 Start Date: <strong>{bookingData.date}</strong></div>
          <div>👥 Travelers: <strong>{bookingData.travelers} Pax</strong></div>
          <div>💳 Amount Paid: <strong>₹{bookingData.amount.toLocaleString("en-IN")}</strong></div>
          <div>🆔 Order ID: <code style={{ color: "var(--primary-light)", fontSize: "0.85em" }}>{bookingData.orderId}</code></div>
          <div>💳 Payment ID: <code style={{ color: "var(--accent-light)", fontSize: "0.85em" }}>{bookingData.paymentId}</code></div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            🏠 Back to Home
          </Link>
          <Link href="/splitwise" className="btn btn-outline">
            💸 Split Expenses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: "var(--space-4xl)" }}>
      <div style={{ marginBottom: "var(--space-2xl)" }}>
        <span className="badge badge-accent" style={{ marginBottom: "var(--space-sm)" }}>🔒 Secure Checkout</span>
        <h1 style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-xs)" }}>
          Confirm Your <span className="gradient-text">Booking</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
          Review itinerary details, complete travelers information, and process standard payment.
        </p>
      </div>

      {!auth.token ? (
        <div className="glass-strong" style={{
          padding: "var(--space-2xl)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--warning)",
          textAlign: "center",
          marginBottom: "var(--space-2xl)",
        }}>
          <h3 style={{ marginBottom: "var(--space-sm)" }}>⚠️ Authentication Required</h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-lg)", fontSize: "var(--text-sm)" }}>
            You need to be signed in to verify booking credentials and sync itineraries with your profile.
          </p>
          <Link href="/login" className="btn btn-accent">
            🔑 Login to Continue
          </Link>
        </div>
      ) : null}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1.4fr 1fr",
        gap: "var(--space-2xl)",
      }} className="checkout-responsive-grid">
        
        {/* Left Column: Form Details */}
        <div className="glass" style={{
          padding: "var(--space-2xl)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-lg)",
        }}>
          <h2 style={{ fontSize: "var(--text-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-sm)" }}>
            📝 Traveler Contact Details
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
            <div className="calc-field">
              <label className="calc-label">Full Name</label>
              <input
                type="text"
                className="calc-input"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={!auth.token || submitting}
                required
              />
            </div>
            <div className="calc-field">
              <label className="calc-label">Email Address</label>
              <input
                type="email"
                className="calc-input"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!auth.token || submitting}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "var(--space-md)" }}>
            <div className="calc-field">
              <label className="calc-label">Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. +91 9988776655"
                className="calc-input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!auth.token || submitting}
                required
              />
            </div>
            <div className="calc-field">
              <label className="calc-label">Number of Travelers</label>
              <input
                type="number"
                min="1"
                max="20"
                className="calc-input"
                value={numTravelers}
                onChange={(e) => setNumTravelers(Math.max(1, Number(e.target.value)))}
                disabled={!auth.token || submitting}
                required
              />
            </div>
          </div>

          <div className="calc-field" style={{ maxWidth: "50%" }}>
            <label className="calc-label">Trip Start Date</label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className="calc-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!auth.token || submitting}
              required
            />
          </div>

          <div style={{ marginTop: "var(--space-md)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              🔒 Your contact credentials are secure. Payments are verified in real-time through Razorpay Standard Checkout.
            </p>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          {/* Destination Brief */}
          <div className="package-card" style={{ display: "flex", gap: "var(--space-md)", alignItems: "center", padding: "var(--space-md)" }}>
            {destination.heroImage && (
              <div style={{ position: "relative", width: 80, height: 80, borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                <Image
                  src={normalizeImageUrl(destination.heroImage)}
                  alt={destination.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <div>
              <h3 style={{ fontSize: "var(--text-base)" }}>{destination.name}</h3>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: "4px" }}>
                📍 {destination.state} · 📅 {destination.duration}
              </p>
              <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                ₹{packagePrice.toLocaleString("en-IN")} / traveler
              </span>
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="glass" style={{
            padding: "var(--space-xl)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
          }}>
            <h2 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-md)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-sm)" }}>
              📊 Payment Details
            </h2>

            {/* Coupons */}
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
              <input
                type="text"
                placeholder="PROMO CODE (e.g. INDIA50)"
                className="calc-input"
                style={{ fontSize: "var(--text-xs)" }}
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                disabled={!auth.token || submitting}
              />
              <button
                type="submit"
                className="btn btn-outline"
                style={{ fontSize: "var(--text-xs)", padding: "0 1rem" }}
                disabled={!auth.token || submitting || !couponInput.trim()}
              >
                Apply
              </button>
            </form>

            {couponError && <p style={{ color: "var(--danger)", fontSize: "var(--text-xs)", marginBottom: "var(--space-sm)" }}>{couponError}</p>}

            {appliedCoupon && (
              <div className="badge badge-success" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-sm)",
                marginBottom: "var(--space-md)",
                fontSize: "var(--text-xs)",
              }}>
                <span>🏷️ Applied: <strong>{appliedCoupon}</strong> ({COUPONS[appliedCoupon].label})</span>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{ background: "transparent", border: "none", color: "var(--danger)", fontWeight: "bold", marginLeft: "10px" }}
                  disabled={submitting}
                >
                  ✕
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Base Price ({numTravelers} traveler{numTravelers > 1 ? "s" : ""})</span>
                <span>₹{basePrice.toLocaleString("en-IN")}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                  <span>Promo Discount ({appliedCoupon})</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>GST & Local Fees (5%)</span>
                <span>₹{gstAmount.toLocaleString("en-IN")}</span>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                borderTop: "1px dashed var(--border)",
                paddingTop: "0.75rem",
                marginTop: "0.5rem",
                fontSize: "var(--text-lg)",
                fontWeight: "700",
              }}>
                <span>Total Payable</span>
                <span className="gradient-text">₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="btn btn-accent btn-lg"
              style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-xl)", fontWeight: "800" }}
              disabled={submitting || !auth.token}
            >
              {submitting ? "Initiating Secure Session..." : `💳 Pay ₹${totalAmount.toLocaleString("en-IN")} Now`}
            </button>

            {paymentError && (
              <p style={{
                color: "var(--danger)",
                fontSize: "var(--text-xs)",
                marginTop: "var(--space-md)",
                textAlign: "center",
                lineHeight: "1.4",
              }}>
                ❌ {paymentError}
              </p>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media (max-width: 820px) {
          .checkout-responsive-grid {
            grid-template-columns: 1fr !/!* stack on mobile *!/ !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "calc(var(--nav-height) + var(--space-xl))", minHeight: "85vh" }}>
        <Suspense fallback={
          <div style={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
            <p style={{ color: "var(--text-secondary)" }}>Loading checkout session...</p>
          </div>
        }>
          <CheckoutForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
