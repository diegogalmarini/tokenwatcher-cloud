/* script/triggerTestEvent.js
 * Este script dispara un evento de prueba contra tu API TokenWatcher
 * Ajusta WATCHER_ID y API_URL según tu configuración.
 */

const fetch = require('node-fetch'); // npm install node-fetch@2

// ID de un watcher existente en tu dashboard
const WATCHER_ID = 7;

// URL base de tu API (añadir /events/ al final)
const API_URL = process.env.API_URL || 'http://localhost:3000/events/';

async function trigger() {
  const payload = {
    watcher_id: WATCHER_ID,
    contract: '0x0000000000000000000000000000000000000000',
    volume: 0.001,      // valor de prueba
    tx_hash: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    block_number: 0     // bloque de prueba
  };

  console.log('Enviando evento de prueba:', payload);
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Error ${res.status}: ${data.error || JSON.stringify(data)}`);
    console.log('Evento creado con éxito:', data);
  } catch (err) {
    console.error('Fallo al disparar el evento:', err);
    process.exit(1);
  }
}

trigger();
