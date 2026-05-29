"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { completeSignIn, setStoredAuth } from "../lib/auth";
import { formatAuthError, signInWithGoogle } from "../lib/auth-oauth";
import { createClient } from "../lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const paramError = searchParams.get("error");
    if (paramError) {
      setError(formatAuthError({ message: decodeURIComponent(paramError) }));
    }
  }, [searchParams]);

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

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      const accessToken = data?.session?.access_token;
      if (!accessToken) throw new Error("No access token from Supabase");

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
    <form className="auth-card" onSubmit={handleSubmit}>
      <h1 className="auth-title">
        Login to <span className="gradient-text">Travel Threads</span>
      </h1>
      <p className="auth-subtitle">Access your trips, budgets, and package preferences.</p>

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
        Email login is limited on the free plan (~2 emails/hour). Google sign-in does not use email quota.
      </p>

      <div className="calc-field">
        <label className="calc-label" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          className="calc-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="calc-field">
        <label className="calc-label" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          className="calc-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary"
        style={{ width: "100%", justifyContent: "center" }}
        disabled={loading || googleLoading}
      >
        {loading ? "Signing in..." : "Login with email"}
      </button>
      {error ? <p className="auth-error">{error}</p> : null}

      <p className="auth-switch">
        New here? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="auth-page">
        <Suspense fallback={<div className="auth-card">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
