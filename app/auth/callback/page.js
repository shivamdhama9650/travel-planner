"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { completeSignIn, setStoredAuth } from "../../lib/auth";
import { formatAuthError } from "../../lib/auth-oauth";
import { supabase } from "../../lib/supabase";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign-in…");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const wakeTimer = setTimeout(() => {
      setMessage("Waking up server… this can take up to a minute on first visit.");
    }, 4000);

    const completeAuth = async () => {
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      const oauthError = searchParams.get("error_description") || searchParams.get("error");
      if (oauthError) {
        setError(decodeURIComponent(oauthError));
        return;
      }

      try {
        const code = searchParams.get("code");
        let session = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          session = data.session;
        } else {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          session = data.session;
        }

        if (!session?.access_token) {
          throw new Error("Sign-in session not found. Please try Google sign-in again.");
        }

        setMessage("Syncing your profile…");
        const result = await completeSignIn(session);

        setStoredAuth({
          token: result.token,
          user: result.user,
        });

        clearTimeout(wakeTimer);

        if (result.backendSyncFailed) {
          setMessage("Signed in! Opening app… (profile will fully sync when server is ready)");
        } else {
          setMessage("Success! Opening app…");
        }

        // Hard redirect — more reliable than router.replace on mobile browsers
        window.location.replace("/");
      } catch (err) {
        clearTimeout(wakeTimer);
        const text = formatAuthError(err);
        setError(text);
        setMessage("");
      }
    };

    completeAuth();

    return () => clearTimeout(wakeTimer);
  }, [searchParams]);

  return (
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
  );
}

export default function AuthCallbackPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <main className="auth-page">
            <p className="auth-subtitle" style={{ textAlign: "center" }}>
              Finishing sign-in…
            </p>
          </main>
        }
      >
        <AuthCallbackContent />
      </Suspense>
      <Footer />
    </>
  );
}
