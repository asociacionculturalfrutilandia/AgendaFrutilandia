import { isConfigured } from './config.js';
import { signedIn, signIn, signOut, getMyRole, pendingMembershipRequests, decideMembership, getAdminPayments, confirmPayment } from './supabase.js';
const el=id=>document.getElementById(id);
const msg=s=>el('review-message').textContent=s;
let rows=[];
async function refresh() {
  if (!signedIn()) { el('review-login').hidden=false; el('review-private').hidden=true; return; }
  if (await getMyRole() !== 'admin') { msg('Acceso reservado a administradores.'); el('review-private').hidden=true; return; }
  el('review-login').hidden=true; el('review-private').hidden=false;
  rows=await pendingMembershipRequests();
  const payments=await getAdminPayments();const paymentList=el('payments-list');paymentList.replaceChildren();for(const pay of payments){const line=document.createElement('div');line.className='admin-row';const label=document.createElement('span');label.textContent=`${pay.user_id} · ${pay.kind==='fee'?'Cuota':'Donación'} · ${pay.amount} € · ${pay.method} · Pendiente`;const btn=document.createElement('button');btn.className='btn light';btn.textContent='Confirmar recepción';btn.onclick=async()=>{if(!confirm('¿Has verificado realmente la recepción de esta aportación?'))return;btn.disabled=true;try{await confirmPayment(pay.id);await refresh();msg('Pago confirmado.')}catch(e){msg(e.message);btn.disabled=false}};line.append(label,btn);paymentList.append(line)}if(!payments.length)paymentList.textContent='Sin aportaciones pendientes.';
  const list=el('review-list'); list.replaceChildren();
  if (!rows.length) { list.textContent='No hay solicitudes pendientes.'; return; }
  for (const row of rows) {
    const div=document.createElement('div'); div.className='admin-row';
    const title=document.createElement('span'); title.textContent=`${row.member_profiles?.full_name || 'Usuario'} · ${new Date(row.created_at).toLocaleDateString('es-ES')} · ${row.user_id}`;
    const buttons=document.createElement('div'); buttons.className='admin-actions';
    for (const [value,label] of [['approved','Aprobar'],['rejected','Rechazar']]) {
      const button=document.createElement('button'); button.className='btn light'; button.textContent=label;
      button.addEventListener('click',async()=>{ button.disabled=true; try { await decideMembership(row.id,value); msg(`Solicitud ${label.toLowerCase()}ada.`); await refresh(); } catch(e) { msg(e.message); button.disabled=false; } });
      buttons.append(button);
    }
    div.append(title,buttons); list.append(div);
  }
}
el('review-login-form').addEventListener('submit',async e=>{e.preventDefault(); const f=e.currentTarget; try {await signIn(f.elements.email.value,f.elements.password.value); await refresh();}catch(err){msg(err.message);}});
el('review-logout').addEventListener('click',async()=>{await signOut(); await refresh();});
if (!isConfigured) msg('Configura Supabase antes de usar este panel.'); else refresh().catch(e=>msg(e.message));
