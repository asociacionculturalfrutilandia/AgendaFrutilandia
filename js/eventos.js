/** Eventos ficticios para demostrar la agenda. No publicar como eventos reales. */
const start = new Date();
start.setHours(12, 0, 0, 0);

export function iso(offset = 0) {
  const date = new Date(start);
  date.setDate(date.getDate() + offset);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export const events = [
  { title: 'Encuentro de música en directo', city: 'Murcia', area: 'Región de Murcia', cat: 'Música', venue: 'Centro de Murcia', lat: 37.9922, lng: -1.1307, offset: 0, time: '20:00', desc: 'Ejemplo de concierto para probar la agenda.' },
  { title: 'Muestra de teatro local', city: 'Cartagena', area: 'Región de Murcia', cat: 'Teatro', venue: 'Centro de Cartagena', lat: 37.6051, lng: -0.9862, offset: 1, time: '19:30', desc: 'Actividad teatral de demostración.' },
  { title: 'Jornada de tradiciones populares', city: 'Lorca', area: 'Región de Murcia', cat: 'Fiestas', venue: 'Centro de Lorca', lat: 37.6712, lng: -1.7017, offset: 2, time: '12:00', desc: 'Ejemplo de evento sobre cultura popular.' },
  { title: 'Ruta por el patrimonio histórico', city: 'Orihuela', area: 'Vega Baja', cat: 'Patrimonio', venue: 'Casco histórico', lat: 38.0856, lng: -0.9449, offset: 3, time: '10:30', desc: 'Recorrido patrimonial ficticio de muestra.' },
  { title: 'Festival de artes escénicas', city: 'Hellín', area: 'Sureste de Albacete', cat: 'Teatro', venue: 'Centro de Hellín', lat: 38.5105, lng: -1.7003, offset: 4, time: '18:00', desc: 'Programación escénica de demostración.' },
  { title: 'Concierto de músicas del sureste', city: 'Vera', area: 'Noreste de Almería', cat: 'Música', venue: 'Centro de Vera', lat: 37.2438, lng: -1.8591, offset: 5, time: '21:00', desc: 'Ejemplo de concierto en la comarca.' },
  { title: 'Fiesta de barrio y cultura popular', city: 'Elche', area: 'Vega Baja', cat: 'Fiestas', venue: 'Centro de Elche', lat: 38.2669, lng: -0.6984, offset: 6, time: '18:30', desc: 'Evento ficticio para mostrar los filtros.' },
  { title: 'Visita cultural a la ciudad', city: 'Yecla', area: 'Región de Murcia', cat: 'Patrimonio', venue: 'Centro de Yecla', lat: 38.6136, lng: -1.1147, offset: 7, time: '11:00', desc: 'Visita patrimonial de ejemplo.' },
].map((event, id) => ({ ...event, id, date: iso(event.offset) }));

export function dateText(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

const categoryIcons = { Música: '♫', Teatro: '◈', Fiestas: '✺', Patrimonio: '▣', Otros: '✦' };

export function renderEventCards(list, isDemo = true) {
  if (!list.length) {
    return '<div class="empty">No hay eventos con estos filtros. Prueba otra fecha o limpia los filtros.</div>';
  }

  return list.map((event) => {
    const coverClass = event.cat === 'Música' ? '' :
      ['Teatro', 'Fiestas', 'Patrimonio'].includes(event.cat) ? event.cat.toLowerCase() : 'otros';
    return `
      <article class="event">
        <div class="event-cover ${coverClass}">
          <span class="symbol" aria-hidden="true">${categoryIcons[event.cat] || categoryIcons.Otros}</span>
          <span class="type">${escapeHtml(event.cat)}</span>
        </div>
        <div class="event-body">
          <div class="meta"><strong>${escapeHtml(dateText(event.date))}</strong> · ${escapeHtml(event.time)}</div>
          <h4>${escapeHtml(event.title)}</h4>
          <div class="meta">📍 ${escapeHtml(event.city)} · ${escapeHtml(event.area)}</div>
          <div class="meta">${escapeHtml(event.venue)}</div>
          <p class="desc">${escapeHtml(event.desc || '')}</p>
          <button class="locate" data-event-id="${escapeHtml(event.id)}">Ver en el mapa ↗</button>
        </div>
      </article>`;
  }).join('');
}
