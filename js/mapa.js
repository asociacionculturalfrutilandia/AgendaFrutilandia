import { dateText, escapeHtml } from './eventos.js';

let map = null;
let markers = null;

export function initMap() {
  const element = document.getElementById('map');
  if (!window.L) {
    element.innerHTML = '<div style="padding:30px">El mapa necesita conexión a Internet. La agenda y los filtros siguen disponibles.</div>';
    return;
  }

  map = window.L.map('map', { scrollWheelZoom: false }).setView([38.05, -1.27], 8);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(map);
  markers = window.L.layerGroup().addTo(map);
  window.addEventListener('hashchange', () => setTimeout(() => map.invalidateSize(), 200));
}

export function updateMap(events, isDemo = true) {
  if (!markers) return;
  markers.clearLayers();
  events.forEach((event) => {
    const marker = window.L.marker([event.lat, event.lng], { eventId: event.id });
    marker.bindPopup(`
      <strong>${escapeHtml(event.title)}</strong><br>
      ${escapeHtml(event.city)} · ${escapeHtml(dateText(event.date))}<br>
      ${escapeHtml(event.time)}<br>
      ${isDemo ? '<small>Evento de demostración</small>' : ''}
    `);
    markers.addLayer(marker);
  });
}

export function locateEvent(event) {
  if (!event) return;
  window.location.hash = 'mapa';
  if (!map) return;
  setTimeout(() => {
    map.invalidateSize();
    map.setView([event.lat, event.lng], 11);
    markers.eachLayer((layer) => {
      if (String(layer.options.eventId) === String(event.id)) layer.openPopup();
    });
  }, 150);
}
