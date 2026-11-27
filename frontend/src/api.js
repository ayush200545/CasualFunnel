/**
 * Enhanced API client to communicate with backend analytics endpoints
 */
const BASE_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text();
    let errorJson;
    try {
      errorJson = JSON.parse(errorText);
    } catch (e) {
      errorJson = { error: errorText || res.statusText };
    }
    throw new Error(errorJson.error || errorJson.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Fetch overview stats
  getStats: async () => {
    const res = await fetch(`${BASE_URL}/api/stats`);
    return handleResponse(res);
  },

  // Fetch e-commerce conversion funnel
  getFunnel: async () => {
    const res = await fetch(`${BASE_URL}/api/funnel`);
    return handleResponse(res);
  },

  // Fetch list of sessions
  getSessions: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    if (params.limit) query.append('limit', params.limit);

    const res = await fetch(`${BASE_URL}/api/sessions?${query.toString()}`);
    return handleResponse(res);
  },

  // Fetch all events for a specific session (User Journey)
  getSessionEvents: async (sessionId) => {
    const res = await fetch(`${BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/events`);
    return handleResponse(res);
  },

  // Export session URL
  getSessionExportUrl: (sessionId, format = 'csv') => {
    return `${BASE_URL}/api/sessions/${encodeURIComponent(sessionId)}/export?format=${format}`;
  },

  // Fetch pages list for heatmap selector
  getHeatmapPages: async () => {
    const res = await fetch(`${BASE_URL}/api/heatmap/pages`);
    return handleResponse(res);
  },

  // Fetch click data for a specific page URL
  getHeatmapClicks: async (pageUrl) => {
    const res = await fetch(`${BASE_URL}/api/heatmap?url=${encodeURIComponent(pageUrl)}`);
    return handleResponse(res);
  },

  // Ingest event manually (used by demo store)
  sendEvent: async (eventData) => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    return handleResponse(res);
  },

  // Health check
  checkHealth: async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    return handleResponse(res);
  }
};
