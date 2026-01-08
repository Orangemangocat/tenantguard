const isBrowser = typeof window !== "undefined";
const currentOrigin = isBrowser ? window.location.origin : "";
const defaultBaseUrl =
  currentOrigin && !currentOrigin.includes("localhost") && !currentOrigin.includes("127.0.0.1")
    ? currentOrigin
    : "http://localhost:5000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || defaultBaseUrl
).replace(/\/+$/, "");
