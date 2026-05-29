"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { setStoredAuth, syncProfileWithBackend } from "../../lib/auth";
import { formatAuthError } from "../../lib/auth-oauth";
import { supabase } from "../../lib/supabase";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Finishing sign-in…");

  useEffect(() => {
    const completeAuth = async () => {
      if (!supabase) {
        router.replace("/login?error=supabase_not_configured");
        return;
      }

      const oauthError = searchParams.get("error_description") || searchParams.get("error");
      if (oauthError) {
        router.replace(`/login?error=${encodeURIComponent(oauthError)}`);
        return;
      }

      try {
        const code = searchParams.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!data.session?.access_token) {
            throw new Error("No session returned after Google sign-in.");
          }

          const userProfile = await syncProfileWithBackend(data.session.access_token);
          setStoredAuth({
            token: data.session.access_token,
            user: userProfile,
          });
          router.replace("/");
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session?.access_token) {
          throw new Error("Sign-in session not found. Please try again.");
        }

        const userProfile = await syncProfileWithBackend(data.session.access_token);
        setStoredAuth({
          token: data.session.access_token,
          user: userProfile,
        });
        router.replace("/");
      } catch (err) {
        const text = formatAuthError(err);
        setMessage(text);
        router.replace(`/login?error=${encodeURIComponent(text)}`);
      }
    };

    completeAuth();
  }, [router, searchParams]);

  return (
    <main className="auth-page">
      <p className="auth-subtitle" style={{ textAlign: "center" }}>
        {message}
      </p>
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
