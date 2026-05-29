"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { setStoredAuth, syncProfileWithBackend } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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

      const userProfile = await syncProfileWithBackend(accessToken);
      setStoredAuth({
        token: accessToken,
        user: userProfile,
      });
      router.push("/");
    } catch (err) {
      setError(err.message || "Unable to login right now");
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
            Login to <span className="gradient-text">Travel Threads</span>
          </h1>
          <p className="auth-subtitle">Access your trips, budgets, and package preferences.</p>

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

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in..." : "Login"}
          </button>
          {error ? <p className="auth-error">{error}</p> : null}

          <p className="auth-switch">
            New here? <Link href="/register">Create an account</Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
