/**
 * radius-thumbnails.js
 *
 * Script one-shot: scarica i thumbnail per tutte le creatives radius.video
 * che hanno creative_preview vuoto, e li salva nel DB come base64.
 *
 * Uso:
 *   node scripts/radius-thumbnails.js
 *
 * Prerequisiti:
 *   npm install (assicurati che puppeteer e dotenv siano in devDependencies)
 */

require('dotenv').config({ path: '.env.local' });
const puppeteer = require('puppeteer');
const { neon }  = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL non trovato in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Dimensioni thumbnail (16:9, leggero)
const THUMB_WIDTH  = 320;
const THUMB_HEIGHT = 180;

// Tempo max di attesa per il caricamento del player (ms)
const PLAYER_TIMEOUT = 12000;

// Pausa tra un video e l'altro per non stressare il server
const DELAY_BETWEEN_MS = 1500;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshotRadius(browser, url) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: THUMB_WIDTH, height: THUMB_HEIGHT });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

    // Aspetta il tag <video> oppure un timeout di fallback
    try {
      await page.waitForSelector('video', { timeout: PLAYER_TIMEOUT });
      // Lascia ancora un attimo al player per caricare il poster frame
      await sleep(2000);
    } catch (_) {
      // Se non trova <video>, fa lo screenshot comunque
    }

    const buffer = await page.screenshot({
      type:    'jpeg',
      quality: 70,
      clip:    { x: 0, y: 0, width: THUMB_WIDTH, height: THUMB_HEIGHT },
    });

    return 'data:image/jpeg;base64,' + buffer.toString('base64');
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('🔍  Carico creatives radius con preview mancante...');

  const rows = await sql`
    SELECT creative_id, creative_name, creative_asset_link
    FROM creatives
    WHERE creative_asset_type = 'radius'
      AND (creative_preview IS NULL OR creative_preview = '')
    ORDER BY creative_id
  `;

  if (!rows.length) {
    console.log('✅  Nessuna creative radius senza thumbnail. Già tutto a posto!');
    return;
  }

  console.log(`📋  Trovate ${rows.length} creatives da processare.\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let ok = 0, fail = 0;

  for (let i = 0; i < rows.length; i++) {
    const { creative_id, creative_name, creative_asset_link } = rows[i];
    const label = `[${i + 1}/${rows.length}] ID ${creative_id} — ${creative_name}`;

    if (!creative_asset_link) {
      console.log(`⚠️   ${label} — asset_link vuoto, skip`);
      fail++;
      continue;
    }

    process.stdout.write(`⏳  ${label} ... `);

    try {
      const base64 = await screenshotRadius(browser, creative_asset_link);
      await sql`
        UPDATE creatives
        SET creative_preview = ${base64}
        WHERE creative_id = ${creative_id}
      `;
      console.log('✅  salvato');
      ok++;
    } catch (err) {
      console.log(`❌  errore: ${err.message}`);
      fail++;
    }

    if (i < rows.length - 1) await sleep(DELAY_BETWEEN_MS);
  }

  await browser.close();

  console.log(`\n🏁  Completato: ${ok} ok, ${fail} falliti su ${rows.length} totali.`);
}

main().catch(err => {
  console.error('Errore fatale:', err);
  process.exit(1);
});
