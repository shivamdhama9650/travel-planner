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

export async function syncProfileWithBackend(token) {
  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const res = await fetch(`${api}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to sync profile");
  }
  return json.data.user;
}
