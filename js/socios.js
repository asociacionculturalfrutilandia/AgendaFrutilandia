import { isConfigured } from './config.js';
import { signedIn, signUp, signIn, signOut, sendRecovery, myProfile, updateMyProfile, requestMembership, myMembershipRequests } from './supabase.js';
const el = id => document.getElementById(id);
const msg = text => { el('member-message').textContent = text; };
async function refresh() {
  el('member-guest').hidden = signedIn();
  el('member-private').hidden = !signedIn();
  if (!signedIn()) return;
  const [profile, requests] = await Promise.all([myProfile(), myMembershipRequests()]);
  el('profile-form').elements.full_name.value = profile?.full_name || '';
  const latest = requests[0];
  const labels = { pending: 'Pendiente de aprobación', approved: 'Socio aprobado', rejected: 'Solicitud rechazada' };
  el('membership-status').textContent = latest ? labels[latest.status] : 'Todavía no has solicitado el alta.';
  el('membership-apply').hidden = Boolean(latest && ['pending','approved'].includes(latest.status));
}
async function run(fn) { try { await fn(); } catch(e) { msg(e.message); } }
el('signup-form').addEventListener('submit', e => { e.preventDefault(); const f=e.currentTarget; run(async()=> { await signUp(f.elements.email.value.trim(),f.elements.password.value,f.elements.full_name.value.trim()); f.reset(); msg('Registro solicitado. Comprueba tu correo para confirmar la cuenta antes de entrar.'); }); });
el('member-login').addEventListener('submit', e => { e.preventDefault(); const f=e.currentTarget; run(async()=> { await signIn(f.elements.email.value.trim(),f.elements.password.value); await refresh(); msg('Sesión iniciada.'); }); });
el('recover-form').addEventListener('submit', e => { e.preventDefault(); const f=e.currentTarget; run(async()=> { await sendRecovery(f.elements.email.value.trim()); msg('Si la cuenta existe, recibirás instrucciones por correo.'); }); });
el('profile-form').addEventListener('submit', e => { e.preventDefault(); run(async()=> { await updateMyProfile(e.currentTarget.elements.full_name.value.trim()); await refresh(); msg('Perfil actualizado.'); }); });
el('membership-apply').addEventListener('click', () => run(async()=> { await requestMembership(); await refresh(); msg('Solicitud enviada para revisión.'); }));
el('member-logout').addEventListener('click', () => run(async()=> { await signOut(); await refresh(); msg('Sesión cerrada.'); }));
if (!isConfigured) msg('Configura Supabase en js/config.js para habilitar el registro.');
else run(refresh);
