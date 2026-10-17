import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

/** Cliente REST mínimo, sin dependencias; nunca uses aquí service_role/secret keys. */
const storageKey = 'frutilandia-auth';
let session = null;
try { session = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { session = null; }
const api = (path) => `${SUPABASE_URL.replace(/\/$/, '')}${path}`;

async function request(path, { method = 'GET', body, auth = false, prefer } = {}) {
  if (!isConfigured) throw new Error('Configura Supabase en js/config.js.');
  const token = auth ? await accessToken() : SUPABASE_ANON_KEY;
  const response = await fetch(api(path), {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const raw = await response.text();
  let result;
  try { result = raw ? JSON.parse(raw) : null; } catch { result = raw; }
  if (!response.ok) throw new Error(result?.message || result?.error_description || result?.msg || `Error HTTP ${response.status}`);
  return result;
}

async function accessToken() {
  if (!session?.access_token) throw new Error('Inicia sesión para continuar.');
  if (session.expires_at && Date.now() >= (session.expires_at - 60) * 1000) {
    if (!session.refresh_token) throw new Error('Sesión caducada. Vuelve a iniciar sesión.');
    const next = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: { refresh_token: session.refresh_token },
    });
    saveSession(next);
  }
  return session.access_token;
}
function saveSession(data) {
  session = { ...data, expires_at: Math.floor(Date.now() / 1000) + data.expires_in };
  sessionStorage.setItem(storageKey, JSON.stringify(session));
}
export function signedIn() { return Boolean(session?.access_token); }
export async function signIn(email, password) {
  const result = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
  saveSession(result);
}
export async function signOut() {
  try { if (signedIn()) await request('/auth/v1/logout', { method: 'POST', auth: true }); }
  finally { session = null; sessionStorage.removeItem(storageKey); }
}
export async function getPublishedEvents() {
  return request('/rest/v1/events?select=*&status=eq.published&order=date.asc,time.asc&limit=1000');
}
export async function getManagedEvents() {
  return request('/rest/v1/events?select=*&order=created_at.desc&limit=1000', { auth: true });
}
export async function getMyRole() {
  const token = await accessToken();
  const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  const rows = await request(`/rest/v1/editor_roles?select=role&user_id=eq.${encodeURIComponent(payload.sub)}`, { auth: true });
  return rows[0]?.role || null;
}
export async function createEvent(event) {
  return request('/rest/v1/events', { method: 'POST', body: event, auth: true, prefer: 'return=representation' });
}
export async function updateEvent(id, event) {
  return request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: event, auth: true, prefer: 'return=representation' });
}
export async function deleteEvent(id) {
  return request(`/rest/v1/events?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', auth: true });
}
