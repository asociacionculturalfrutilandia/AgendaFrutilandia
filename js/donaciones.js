import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';
import { DONATIONS } from './donaciones-config.js';

const form = document.querySelector('#donation-form');
if (form) {
  const details = document.querySelector('#transfer-details');
  const message = document.querySelector('#donation-message');
  const submit = document.querySelector('#donation-submit');
  const selectedMethod = () => form.querySelector('input[name="donation-method"]:checked').value;

  function refresh() {
    const method = selectedMethod();
    details.hidden = method !== 'transfer';
    if (method === 'transfer') {
      details.textContent = DONATIONS.iban
        ? `Titular: ${DONATIONS.accountHolder}\nIBAN: ${DONATIONS.iban}\nConcepto: ${DONATIONS.transferReference}\nIndica tu nombre o referencia acordada con la asociación. La donación se confirma cuando la asociación verifique el ingreso.`
        : 'La transferencia todavía no está activada: falta configurar el IBAN de la asociación en js/donaciones-config.js.';
      submit.textContent = 'Ver instrucciones de transferencia';
    } else {
      submit.textContent = method === 'card' ? 'Pagar con tarjeta' : 'Pagar con Bizum';
    }
    message.textContent = '';
  }
  form.addEventListener('change', refresh);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const method = selectedMethod();
    if (method === 'transfer') {
      message.textContent = DONATIONS.iban ? 'Realiza la transferencia desde tu banco. No se ha realizado ningún cobro desde esta página.' : 'Falta configurar la cuenta bancaria.';
      return;
    }
    if (!DONATIONS.checkoutEnabled || !isConfigured) {
      message.textContent = 'El pago online aún no está activado. Configura Supabase y Stripe siguiendo DONACIONES.md.';
      return;
    }
    submit.disabled = true;
    message.textContent = 'Preparando la página segura de pago…';
    try {
      const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/create-donation-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ amount: Number(form.querySelector('#donation-amount').value), method }),
      });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'No se pudo iniciar el pago');
      // Solo aceptar URLs HTTPS de Stripe Checkout.
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('URL de pago no válida');
      window.location.assign(url.href);
    } catch (error) { message.textContent = `Error: ${error.message}`; submit.disabled = false; }
  });
  const result = new URLSearchParams(location.search).get('donation');
  if (result === 'success') message.textContent = 'Stripe ha terminado el proceso. La confirmación del pago puede tardar; consulta con la asociación si necesitas justificante.';
  if (result === 'cancel') message.textContent = 'Has cancelado el pago. No se ha registrado una donación.';
  refresh();
}
