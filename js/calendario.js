import { selectDate } from './filtros.js';

/** Vincula el selector de fecha del mapa con la agenda y sus filtros. */
export function initCalendar(onChange) {
  document.getElementById('map-date-button').addEventListener('click', () => {
    selectDate(document.getElementById('map-date').value, onChange);
    window.location.hash = 'agenda';
  });
}
