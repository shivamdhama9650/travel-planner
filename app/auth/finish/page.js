"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { completeSignIn, setStoredAuth } from "../../lib/auth";
import { formatAuthError } from "../../lib/auth-oauth";
import { createClient } from "../../lib/supabase/client";

export default function AuthFinishPage() {
  const [message, setMessage] = useState("Finishing sign-in…");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const wakeTimer = setTimeout(() => {
      setMessage("Waking up server… this can take up to a minute on first visit.");
    }, 4000);

    const finish = async () => {
      const supabase = createClient();
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session?.access_token) {
          throw new Error("No active session. Please sign in with Google again.");
        }

        setMessage("Syncing your profile…");
        const result = await completeSignIn(data.session);

        setStoredAuth({
          token: result.token,
          user: result.user,
        });

        clearTimeout(wakeTimer);
        window.location.replace("/");
      } catch (err) {
        clearTimeout(wakeTimer);
        setError(formatAuthError(err));
        setMessage("");
      }
    };

    finish();

    return () => clearTimeout(wakeTimer);
  }, []);

  return (
    <>
      <Navbar />
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          {error ? (
            <>
              <p className="auth-error">{error}</p>
              <Link href="/login" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                Back to login
              </Link>
            </>
          ) : (
            <>
              <p className="auth-subtitle">{message}</p>
              <div className="auth-spinner" aria-hidden="true" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
