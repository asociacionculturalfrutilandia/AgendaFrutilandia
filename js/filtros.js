import { iso } from './eventos.js';

const byId = (id) => document.getElementById(id);
let when = 'all';

export function filterEvents(events) {
  const query = byId('q').value.toLocaleLowerCase('es').trim();
  const area = byId('area').value;
  const category = byId('category').value;
  const date = byId('date').value;

  return events.filter((event) => {
    const searchable = `${event.title} ${event.city} ${event.venue} ${event.desc}`.toLocaleLowerCase('es');
    if (query && !searchable.includes(query)) return false;
    if (area && event.area !== area) return false;
    if (category && event.cat !== category) return false;
    if (date && event.date !== date) return false;
    if (!date && when === 'today' && event.date !== iso(0)) return false;
    if (!date && when === 'tomorrow' && event.date !== iso(1)) return false;
    if (!date && when === 'weekend') {
      const day = new Date(`${event.date}T12:00:00`).getDay();
      if (day !== 6 && day !== 0) return false;
    }
    return true;
  });
}

function setWhen(value) {
  when = value;
  document.querySelectorAll('[data-when]').forEach((button) => {
    button.classList.toggle('active', button.dataset.when === value);
  });
}

export function initFilters(onChange) {
  ['q', 'area', 'category', 'date'].forEach((id) => {
    byId(id).addEventListener(id === 'q' ? 'input' : 'change', () => {
      if (id === 'date') setWhen('all');
      onChange();
    });
  });

  document.querySelectorAll('[data-when]').forEach((button) => {
    button.addEventListener('click', () => {
      setWhen(button.dataset.when);
      byId('date').value = '';
      onChange();
    });
  });

  byId('clear').addEventListener('click', () => {
    ['q', 'area', 'category', 'date'].forEach((id) => { byId(id).value = ''; });
    setWhen('all');
    onChange();
  });
}

export function selectDate(value, onChange) {
  byId('date').value = value;
  setWhen('all');
  onChange();
}
