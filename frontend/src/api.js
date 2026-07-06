// Central place for all backend communication.
// Override the backend URL at build/deploy time with VITE_API_URL.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

export const fetchZones = () => getJSON("/api/zones");
export const fetchHistory = (zone, hours = 48) =>
  getJSON(`/api/history?zone=${encodeURIComponent(zone)}&hours=${hours}`);
export const fetchSummary = () => getJSON("/api/summary");
export const fetchAnomalies = () => getJSON("/api/anomalies");
export const fetchForecast = () => getJSON("/api/forecast");
export const fetchRecommendations = () => getJSON("/api/recommendations");

// Opens the live WebSocket. Returns the socket so the caller can close it.
export function connectLive(onReading) {
  const wsBase = API_BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/ws/live`);
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "reading") onReading(msg);
    } catch {
      /* ignore malformed frames */
    }
  };
  return ws;
}
