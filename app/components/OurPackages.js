"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import RazorpayBookButton from "./RazorpayBookButton";
import { getStoredAuth } from "../lib/auth";
import { normalizeImageUrl } from "../lib/images";
import localDestinations from "../../backend/data/destinations.json";
import localPackagePrices from "../../backend/data/packages.json";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const fallbackPackages = localDestinations.map((destination) => ({
  id: destination.id,
  name: destination.name,
  region: destination.region,
  duration: destination.duration,
  packagePrice: Number(localPackagePrices[destination.id] || 7500),
  heroImage: destination.heroImage,
  tagline: destination.tagline,
}));

const getEditablePrices = (items) =>
  items.reduce((acc, pkg) => {
    acc[pkg.id] = String(pkg.packagePrice);
    return acc;
  }, {});

export default function OurPackages() {
  const [packages, setPackages] = useState(fallbackPackages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auth, setAuth] = useState({ token: "", user: null });
  const [savingId, setSavingId] = useState("");
  const [editPrices, setEditPrices] = useState(() => getEditablePrices(fallbackPackages));

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
      setError("");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      try {
        const res = await fetch(`${API}/api/packages`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load packages");
        }
        const nextPackages = json.data?.length ? json.data : fallbackPackages;
        setPackages(nextPackages);
        setEditPrices(getEditablePrices(nextPackages));
      } catch {
        setPackages(fallbackPackages);
        setEditPrices(getEditablePrices(fallbackPackages));
      } finally {
        clearTimeout(timeout);
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

                <p className="package-price">
                  Starting at ₹{Number(pkg.packagePrice).toLocaleString("en-IN")}
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
                      aria-label={`Package price for ${pkg.name}`}
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
                <RazorpayBookButton
                  destinationId={pkg.id}
                  destinationName={pkg.name}
                  amountInRupees={pkg.packagePrice}
                  className="btn btn-accent package-book-btn"
                >
                  Book Now - ₹{Number(pkg.packagePrice).toLocaleString("en-IN")}
                </RazorpayBookButton>
                )}

              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
