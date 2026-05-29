export const AUTH_STORAGE_KEY = "yatra_auth";

export function getStoredAuth() {
  if (typeof window === "undefined") return { token: "", user: null };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { token: "", user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || "",
      user: parsed?.user || null,
    };
  } catch {
    return { token: "", user: null };
  }
}

export function setStoredAuth(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("yatra-auth-changed"));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event("yatra-auth-changed"));
}

/** Build a minimal profile from Supabase session when backend is slow/unavailable */
export function buildUserFromSupabaseSession(session) {
  const u = session?.user;
  const email = String(u?.email || "").toLowerCase();
  const meta = u?.user_metadata || {};
  const rawName = meta.full_name || meta.name || "";
  const name =
    String(rawName).trim() ||
    email
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());

  return {
    id: String(u?.id || ""),
    name: name || "Traveler",
    email,
    role: "user",
  };
}

export async function syncProfileWithBackend(token, { timeoutMs = 60000 } = {}) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${api}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    let json = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    if (!res.ok || !json.success) {
      throw new Error(json.message || `Backend error (${res.status})`);
    }

    return json.data.user;
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(
        "Server is waking up (this can take up to a minute on free hosting). Please wait or try again."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Sync with backend; fall back to Supabase profile so login still completes */
export async function completeSignIn(session) {
  const token = session?.access_token;
  if (!token) throw new Error("No access token in session");

  try {
    const user = await syncProfileWithBackend(token);
    return { token, user };
  } catch (err) {
    const fallbackUser = buildUserFromSupabaseSession(session);
    return {
      token,
      user: fallbackUser,
      backendSyncFailed: true,
      syncError: err?.message || "Backend sync failed",
    };
  }
}
