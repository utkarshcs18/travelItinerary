export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (res.status === 401 && auth) {
    const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) {
      const { accessToken: newToken } = await refreshed.json();
      setAccessToken(newToken);
      return request(path, { method, body, auth });
    }
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 200) || `Request failed (${res.status})` };
    }
  }
  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/me', { auth: true }),
  updateMe: (payload) => request('/me', { method: 'PUT', body: payload, auth: true }),
  weather: ({ lat, lon }) => request(`/integrations/weather?lat=${lat}&lon=${lon}`, { auth: true }),
  geocode: ({ q }) => request(`/integrations/geocode?q=${encodeURIComponent(q)}`, { auth: true }),
  reverseGeocode: ({ lat, lon }) =>
    request(`/integrations/reverse-geocode?lat=${lat}&lon=${lon}`, { auth: true }),
  image: ({ query, w = 1200, h = 800, sig = 0 }) =>
    `${API_BASE}/images/unsplash?query=${encodeURIComponent(query)}&w=${w}&h=${h}&sig=${sig}`,
  chat: ({ messages }) => request('/chat', { method: 'POST', body: { messages }, auth: true }),
  recommendations: ({ lat, lon }) =>
    request(`/recommendations?lat=${lat}&lon=${lon}`, { auth: true }),
  generateItinerary: (payload) =>
    request('/itineraries/generate', { method: 'POST', body: payload, auth: true }),
  listItineraries: () => request('/itineraries', { auth: true }),
  getItinerary: (id) => request(`/itineraries/${id}`, { auth: true }),
};