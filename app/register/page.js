"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { setStoredAuth, syncProfileWithBackend } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (signUpError) throw signUpError;

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        throw new Error("Account created. Please verify your email and then login.");
      }

      const userProfile = await syncProfileWithBackend(accessToken);
      setStoredAuth({
        token: accessToken,
        user: userProfile,
      });
      router.push("/");
    } catch (err) {
      setError(err.message || "Unable to register right now");
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
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Creating account..." : "Register"}
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
