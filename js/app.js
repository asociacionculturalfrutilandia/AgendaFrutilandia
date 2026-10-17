/** Entrada principal: en modo sin configurar, mantiene la demostración original. */
import { events as sampleEvents, renderEventCards } from './eventos.js';
import { filterEvents, initFilters } from './filtros.js';
import { initMap, locateEvent, updateMap } from './mapa.js';
import { initCalendar } from './calendario.js';
import { isConfigured } from './config.js';
import { getPublishedEvents } from './supabase.js';

let events = sampleEvents;
let isDemo = true;
function render() {
  const visible = filterEvents(events);
  document.getElementById('count').textContent = `${visible.length} evento${visible.length === 1 ? '' : 's'}${isDemo ? ' de muestra' : ''}`;
  document.getElementById('map-count').textContent = visible.length;
  document.getElementById('cards').innerHTML = renderEventCards(visible, isDemo);
  updateMap(visible, isDemo);
}
document.getElementById('cards').addEventListener('click', (event) => {
  const button = event.target.closest('[data-event-id]');
  if (!button) return;
  locateEvent(events.find((item) => String(item.id) === button.dataset.eventId));
});
initMap();
initFilters(render);
initCalendar(render);
render();
if (isConfigured) {
  const note = document.getElementById('agenda-note');
  try {
    const rows = await getPublishedEvents();
    events = rows.map((row) => ({ ...row, cat: row.category, desc: row.description, lat: Number(row.lat), lng: Number(row.lng) }));
    isDemo = false;
    note.textContent = 'Agenda publicada por Frutilandia. Confirma los detalles con la entidad organizadora.';
    document.getElementById('agenda-label').textContent = 'Eventos publicados';
  } catch (error) {
    // No se presentan datos ficticios como reales si falla la conexión.
    events = [];
    isDemo = false;
    note.textContent = `No se pudo cargar la agenda: ${error.message}`;
    document.getElementById('agenda-label').textContent = 'Error de conexión';
  }
  render();
}
