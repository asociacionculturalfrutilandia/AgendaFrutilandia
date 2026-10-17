import { isConfigured } from './config.js';
import { signIn, signOut, signedIn, getMyRole, getManagedEvents, createEvent, updateEvent, deleteEvent } from './supabase.js';
import { escapeHtml } from './eventos.js';

const byId = (id) => document.getElementById(id);
const form = byId('event-form');
let events = [];
let role = null;
const message = (text) => { byId('message').textContent = text; };

function resetForm() {
  form.reset();
  form.elements.id.value = '';
  byId('form-title').textContent = 'Nuevo evento';
  form.elements.status.value = 'draft';
}
function eventData() {
  const data = Object.fromEntries(new FormData(form));
  delete data.id;
  data.lat = Number(data.lat);
  data.lng = Number(data.lng);
  data.source_url = data.source_url.trim() || null;
  data.description = data.description.trim();
  if (!Number.isFinite(data.lat) || !Number.isFinite(data.lng)) throw new Error('Coordenadas inválidas.');
  if (role !== 'admin' && data.status === 'published') throw new Error('Solo los administradores pueden publicar eventos.');
  return data;
}
function listEvents() {
  const container = byId('event-list');
  container.innerHTML = events.length ? events.map((item) => `
    <div class="admin-row">
      <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.city)} · ${escapeHtml(item.date)} · ${escapeHtml(item.status)}</p></div>
      <div class="admin-actions"><button type="button" class="btn light" data-edit="${escapeHtml(item.id)}">Editar</button><button type="button" class="btn light" data-delete="${escapeHtml(item.id)}">Eliminar</button></div>
    </div>`).join('') : '<p>No hay eventos guardados.</p>';
}
async function refresh() {
  events = await getManagedEvents();
  listEvents();
}
async function showEditor() {
  role = await getMyRole();
  if (!['admin', 'editor'].includes(role)) {
    message('Esta cuenta no tiene permisos editoriales. Solicita acceso al administrador.');
    return;
  }
  byId('login-panel').hidden = true;
  byId('editor-panel').hidden = false;
  if (role !== 'admin') {
    form.elements.status.querySelector('[value="published"]').disabled = true;
    message('Acceso de editor: puedes preparar borradores. Solo un administrador puede publicarlos.');
  } else message('Sesión iniciada. Puedes gestionar eventos.');
  await refresh();
}
byId('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    await signIn(event.currentTarget.elements.email.value, event.currentTarget.elements.password.value);
    await showEditor();
  } catch (error) { message(error.message); }
  finally { button.disabled = false; }
});
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    const data = eventData();
    if (form.elements.id.value) await updateEvent(form.elements.id.value, data);
    else await createEvent(data);
    resetForm();
    await refresh();
    message('Evento guardado correctamente.');
  } catch (error) { message(`No se pudo guardar: ${error.message}`); }
  finally { button.disabled = false; }
});
byId('event-list').addEventListener('click', async (event) => {
  const edit = event.target.closest('[data-edit]');
  const remove = event.target.closest('[data-delete]');
  if (edit) {
    const item = events.find((row) => row.id === edit.dataset.edit);
    if (!item) return;
    for (const field of Array.from(form.elements)) {
      if (field.name && field.name in item) field.value = item[field.name] ?? '';
    }
    form.elements.id.value = item.id;
    if (role !== 'admin') form.elements.status.value = 'draft';
    byId('form-title').textContent = 'Editar evento';
    form.scrollIntoView({ behavior: 'smooth' });
  }
  if (remove) {
    if (!window.confirm('¿Eliminar este evento definitivamente?')) return;
    try { await deleteEvent(remove.dataset.delete); await refresh(); message('Evento eliminado.'); }
    catch (error) { message(`No se pudo eliminar: ${error.message}`); }
  }
});
byId('reset-form').addEventListener('click', resetForm);
byId('logout').addEventListener('click', async () => {
  try { await signOut(); } catch (error) { message(error.message); }
  byId('editor-panel').hidden = true;
  byId('login-panel').hidden = false;
  resetForm();
});
if (!isConfigured) {
  message('Modo demostración: configura js/config.js y ejecuta el SQL de supabase/schema.sql para activar el panel.');
  byId('login-form').querySelector('button').disabled = true;
} else if (signedIn()) {
  try { await showEditor(); } catch (error) { message(error.message); }
}
