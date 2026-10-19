/** Configuración pública. Nunca pongas claves privadas ni datos personales aquí. */
export const DONATIONS = {
  associationName: 'Asociación Cultural Frutilandia',
  iban: '', // IBAN de la asociación: publicar solo si autorizáis mostrarlo
  accountHolder: 'Asociación Cultural Frutilandia',
  transferReference: 'DONACION FRUTILANDIA',
  // La función de Supabase procesa pagos con tarjeta o Bizum cuando está desplegada.
  checkoutEnabled: false,
};
