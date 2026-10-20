import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

/** Cliente REST mínimo, sin dependencias; nunca uses aquí service_role/secret keys. */
const storageKey = 'frutilandia-auth';
let session = null;
try { session = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { session = null; }
const api = (path) => `${SUPABASE_URL.replace(/\/$/, '')}${path}`;

export async function request(path, { method = 'GET', body, auth = false, prefer } = {}) {
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
  return request('/rest/v1/events?select=*&status=eq.published&order=date.asc,time.asc&limit=1000', { auth: true });
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

// Área de usuarios y socios. El control de acceso real se aplica en PostgreSQL (RLS).
export async function signUp(email, password, fullName) {
  return request('/auth/v1/signup', { method: 'POST', body: { email, password, data: { full_name: fullName, privacy_notice_version: '2026-10-v1', privacy_notice_acknowledged: true } } });
}
export async function sendRecovery(email) {
  return request('/auth/v1/recover', { method: 'POST', body: { email } });
}
export async function myProfile() {
  const rows = await request('/rest/v1/member_profiles?select=*', { auth: true });
  return rows[0] || null;
}
export async function updateMyProfile(fullName) {
  return request('/rest/v1/member_profiles', { method: 'PATCH', auth: true,
    body: { full_name: fullName }, prefer: 'return=representation' });
}
export async function requestMembership() {
  return request('/rest/v1/membership_requests', { method: 'POST', auth: true,
    body: {}, prefer: 'return=representation' });
}
export async function myMembershipRequests() {
  return request('/rest/v1/membership_requests?select=*&order=created_at.desc', { auth: true });
}
export async function pendingMembershipRequests() {
  return request('/rest/v1/membership_requests?select=id,user_id,status,created_at,member_profiles(full_name)&status=eq.pending&order=created_at.asc', { auth: true });
}
export async function decideMembership(id, status) {
  if (!['approved', 'rejected'].includes(status)) throw new Error('Estado inválido');
  return request(`/rest/v1/membership_requests?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH', auth: true, body: { status }, prefer: 'return=representation'
  });
}

export async function getMyUserId(){const token=await accessToken();return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).sub;}
export async function getMembershipStatus(){return request('/rest/v1/member_entitlements?select=*', {auth:true});}
export async function getMyPayments(){return request('/rest/v1/member_payments?select=*&order=created_at.desc',{auth:true});}
export async function requestPayment(method,kind='fee',amount=10){return request('/rest/v1/member_payments',{method:'POST',auth:true,body:{method,kind,amount},prefer:'return=representation'});}
export async function getAdminPayments(){return request('/rest/v1/member_payments?select=*&status=eq.pending&order=created_at.asc',{auth:true});}
export async function getAdminEntitlements(){return request('/rest/v1/member_entitlements?select=*&order=created_at.desc',{auth:true});}
export async function confirmPayment(id){return request('/rest/v1/rpc/confirm_member_payment',{method:'POST',auth:true,body:{p_payment_id:id}});}
export async function savePrivacyConsent(whatsapp,phone,news=false){return request('/rest/v1/rpc/save_member_preferences',{method:'POST',auth:true,body:{p_phone:phone||null,p_whatsapp:whatsapp,p_news:news,p_version:'2026-10-v1'}});}
export async function getMyPreferences(){return request('/rest/v1/member_preferences?select=*',{auth:true});}
export async function getPublicSlides(){return request('/rest/v1/portal_slides?select=*&order=slot.asc');}
export async function saveSlide(slot,data){return request('/rest/v1/portal_slides?slot=eq.'+slot,{method:'PATCH',auth:true,body:data,prefer:'return=representation'});}
