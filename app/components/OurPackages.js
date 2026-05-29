"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStoredAuth } from "../lib/auth";
import { normalizeImageUrl } from "../lib/images";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function OurPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auth, setAuth] = useState({ token: "", user: null });
  const [savingId, setSavingId] = useState("");
  const [editPrices, setEditPrices] = useState({});

  const isAdmin = auth?.user?.role === "admin";

  useEffect(() => {
    const syncAuth = () => setAuth(getStoredAuth());
    syncAuth();
    window.addEventListener("yatra-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("yatra-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API}/api/packages`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load packages");
        }
        setPackages(json.data || []);
        const nextPrices = {};
        (json.data || []).forEach((pkg) => {
          nextPrices[pkg.id] = String(pkg.packagePrice);
        });
        setEditPrices(nextPrices);
      } catch {
        setError("Could not load packages right now.");
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, []);

  const totalPackages = useMemo(() => packages.length, [packages]);

  const savePrice = async (id) => {
    if (!isAdmin || !auth?.token) return;
    setSavingId(id);
    setError("");

    try {
      const res = await fetch(`${API}/api/packages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          price: Number(editPrices[id]),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update price");
      }

      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === id ? { ...pkg, packagePrice: json.data.packagePrice } : pkg
        )
      );
      setEditPrices((prev) => ({
        ...prev,
        [id]: String(json.data.packagePrice),
      }));
    } catch (err) {
      setError(err.message || "Unable to update package price.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section className="section" id="packages-section">
      <div className="container">
        <div className="packages-header">
          <div>
            <h2 className="section-title">
              🎁 Our <span className="gradient-text">Packages</span>
            </h2>
            <p className="section-subtitle">
              Curated destination packages with flexible pricing. Total packages: {totalPackages}
            </p>
          </div>
          {isAdmin ? <span className="badge badge-success">Admin mode enabled</span> : null}
        </div>

        {error && <p className="packages-error">{error}</p>}
        {loading ? (
          <p className="packages-loading">Loading packages...</p>
        ) : (
          <div className="packages-grid">
            {packages.map((pkg) => (
              <article key={pkg.id} className="package-card">
                <div className="package-image-wrap">
                  <Image
                    src={normalizeImageUrl(pkg.heroImage)}
                    alt={pkg.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <h3>{pkg.name}</h3>
                <p className="package-tagline">{pkg.tagline}</p>
                <p className="package-meta">
                  📍 {pkg.region} · 📅 {pkg.duration}
                </p>

                {isAdmin ? (
                  <div className="package-editor">
                    <input
                      type="number"
                      min="1"
                      className="calc-input"
                      value={editPrices[pkg.id] ?? ""}
                      onChange={(e) =>
                        setEditPrices((prev) => ({
                          ...prev,
                          [pkg.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={savingId === pkg.id || !auth?.token}
                      onClick={() => savePrice(pkg.id)}
                    >
                      {savingId === pkg.id ? "Saving..." : "Save Price"}
                    </button>
                  </div>
                ) : (
                  <p className="package-price">
                    Starting at ₹{Number(pkg.packagePrice).toLocaleString("en-IN")}
                  </p>
                )}
                <Link href={`/destinations/${pkg.id}`} className="btn btn-accent package-book-btn">
                  Book Now
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
