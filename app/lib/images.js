const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80";

/** Next/Image only allows certain hosts; plus.unsplash premium URLs often fail. */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return FALLBACK_IMAGE;

  let normalized = url.trim();

  if (normalized.includes("plus.unsplash.com")) {
    normalized = normalized.replace(
      /https?:\/\/plus\.unsplash\.com\//,
      "https://images.unsplash.com/"
    );
  }

  if (!normalized.startsWith("https://images.unsplash.com/")) {
    return FALLBACK_IMAGE;
  }

  return normalized;
}
