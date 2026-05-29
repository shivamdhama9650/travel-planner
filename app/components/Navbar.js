"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { clearStoredAuth, getStoredAuth, setStoredAuth, syncProfileWithBackend } from "../lib/auth";
import { createClient } from "../lib/supabase/client";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const syncAuth = async () => {
      const { user: currentUser } = getStoredAuth();
      if (currentUser) {
        setUser(currentUser);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setUser(null);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const syncedUser = await syncProfileWithBackend(token);
        setStoredAuth({ token, user: syncedUser });
        setUser(syncedUser);
      } catch {
        setUser(null);
      }
    };

    syncAuth();
    window.addEventListener("yatra-auth-changed", syncAuth);
    window.addEventListener("storage", syncAuth);
    return () => {
      window.removeEventListener("yatra-auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    clearStoredAuth();
  };

  const links = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/destinations", label: "Destinations", icon: "📍" },
    { href: "/calculator", label: "Calculator", icon: "🧮" },
    { href: "/splitwise", label: "Splitwise", icon: "💸" },
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="main-navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo" id="logo-link">
            <span className="logo-icon">🌏</span>
            <span className="logo-text logo-wordmark">Travel Threads</span>
          </Link>

          <div className="navbar-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="navbar-link"
                id={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
              >
                <span className="navbar-link-icon" aria-hidden="true">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
            {user ? (
              <>
                <span className="navbar-user">
                  {user.name} {user.role === "admin" ? "• Admin" : ""}
                </span>
                <button
                  type="button"
                  className="navbar-link navbar-auth-link"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login" className="navbar-link navbar-auth-link" id="nav-login">
                Login / Register
              </Link>
            )}
            <Link href="/book" className="btn btn-primary navbar-cta" id="nav-cta">
              🎒 Book Now
            </Link>
          </div>

          <button
            type="button"
            className={`navbar-toggle ${mobileOpen ? "open" : ""}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            id="navbar-toggle"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div
        className={`navbar-mobile-backdrop ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden={!mobileOpen}
      />

      <div className={`navbar-mobile ${mobileOpen ? "open" : ""}`} id="navbar-mobile-menu">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="navbar-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="navbar-link-icon" aria-hidden="true">{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
        {user ? (
          <button
            type="button"
            className="navbar-link"
            onClick={() => {
              handleLogout();
              setMobileOpen(false);
            }}
          >
            Logout ({user.role})
          </button>
        ) : (
          <Link href="/login" className="navbar-link" onClick={() => setMobileOpen(false)}>
            Login / Register
          </Link>
        )}
        <Link
          href="/book"
          className="btn btn-primary"
          onClick={() => setMobileOpen(false)}
        >
          🎒 Book Now
        </Link>
      </div>
    </>
  );
}
