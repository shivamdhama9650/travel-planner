import { supabase } from "./supabase";

/** OAuth return URL — must match Supabase → Authentication → Redirect URLs */
export function getAuthRedirectUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return site ? `${site}/auth/callback` : undefined;
}

export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const redirectTo = getAuthRedirectUrl();
  if (!redirectTo) {
    throw new Error("Could not determine redirect URL for Google sign-in.");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
}

export function formatAuthError(err) {
  const message = err?.message || String(err || "Something went wrong");

  if (/rate limit|too many requests|email.*limit|2 emails|per hour/i.test(message)) {
    return "Email limit reached (Supabase free tier allows about 2 emails per hour). Use Continue with Google instead, or wait and try again.";
  }

  if (/email not confirmed|confirm your email/i.test(message)) {
    return "Please confirm your email first, or sign in with Google to skip email verification.";
  }

  if (/invalid login credentials|invalid email or password/i.test(message)) {
    return "Incorrect email or password. Try again or use Continue with Google.";
  }

  return message;
}
