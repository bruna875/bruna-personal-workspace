// scripts/create-vod-content.mjs
// Creates the vod_content table and seeds one demo row.
// Run: node scripts/create-vod-content.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load DATABASE_URL from .env.local
const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const m = line.match(/^([^=]+)=(.+)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Creating vod_content table…');

  // ── 1. Create table ─────────────────────────────────────────────────────────
  // Drop old schema if it exists (table was empty)
  await sql`DROP TABLE IF EXISTS vod_content`;
  console.log('✓ Dropped old vod_content table');

  await sql`
    CREATE TABLE vod_content (
      vod_content_id   SERIAL PRIMARY KEY,
      vod_content_name TEXT        NOT NULL,
      vod_content_category TEXT,
      client_org_id    INT         REFERENCES client_organizations(client_org_id) ON DELETE SET NULL,
      content_s3_link  TEXT,
      content_yt_link  TEXT,
      tier_0_analysis  JSONB,
      tier_1_analysis  JSONB,
      tier_2_analysis  JSONB,
      tier_3_analysis  JSONB,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓ Table vod_content created (or already exists)');

  // ── 2. Indexes ──────────────────────────────────────────────────────────────
  await sql`CREATE INDEX IF NOT EXISTS idx_vod_content_client_org ON vod_content(client_org_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_vod_content_category   ON vod_content(vod_content_category)`;
  console.log('✓ Indexes created');

  // ── 3. updated_at trigger ───────────────────────────────────────────────────
  await sql`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$
  `;
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_vod_content_updated_at'
      ) THEN
        CREATE TRIGGER trg_vod_content_updated_at
        BEFORE UPDATE ON vod_content
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
      END IF;
    END $$
  `;
  console.log('✓ updated_at trigger set');

  // ── 4. Print final schema ───────────────────────────────────────────────────
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'vod_content'
    ORDER BY ordinal_position
  `;
  console.log('\nFinal schema — vod_content:');
  cols.forEach(c =>
    console.log(`  ${c.column_name.padEnd(25)} ${c.data_type.padEnd(20)} nullable:${c.is_nullable}`)
  );

  console.log('\nDone.');
}

run().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
