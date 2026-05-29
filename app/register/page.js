"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { completeSignIn, setStoredAuth } from "../lib/auth";
import { formatAuthError, signInWithGoogle } from "../lib/auth-oauth";
import { createClient } from "../lib/supabase/client";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(formatAuthError(err));
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (signUpError) throw signUpError;

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        throw new Error(
          "Account created. Check your email to confirm, or use Continue with Google next time to avoid email limits."
        );
      }

      const result = await completeSignIn(data.session);
      setStoredAuth({
        token: result.token,
        user: result.user,
      });
      window.location.href = "/";
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <form className="auth-card" onSubmit={handleSubmit}>
          <h1 className="auth-title">
            Create your <span className="gradient-text">Travel Threads</span> account
          </h1>
          <p className="auth-subtitle">Register once and plan all your trips from one place.</p>

          <button
            type="button"
            className="btn btn-google"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleGoogle}
            disabled={googleLoading || loading}
          >
            {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          <p className="auth-hint">
            Email sign-up sends confirmation mail (free Supabase: ~2/hour). Google is recommended.
          </p>

          <div className="calc-field">
            <label className="calc-label" htmlFor="register-name">Full Name</label>
            <input
              id="register-name"
              type="text"
              className="calc-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="calc-field">
            <label className="calc-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              className="calc-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="calc-field">
            <label className="calc-label" htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              className="calc-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            disabled={loading || googleLoading}
          >
            {loading ? "Creating account..." : "Register with email"}
          </button>
          {error ? <p className="auth-error">{error}</p> : null}

          <p className="auth-switch">
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
