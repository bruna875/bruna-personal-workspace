// migrate-rename-analysis-table.mjs
// 1. Rename creatives_analysis → moments_match
// 2. Add client_org_id INT
// 3. Add analysis_name TEXT
// 4. Add media_plan_name TEXT
// 5. Add media_plan_moments_id JSONB
// 6. Add media_plan_moments_details JSONB
// 7. Add media_plan_moments_taxonomies JSONB

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_KMCBm9Opyl2R@ep-rapid-bread-apo83i3o-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';
const sql = neon(DATABASE_URL);

async function run() {
  console.log('Starting migration…');

  // 1 — Rename table (safe: IF NOT EXISTS guard via pg_tables check)
  const tableExists = await sql`
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'creatives_analysis'
  `;
  if (tableExists.length > 0) {
    await sql`ALTER TABLE creatives_analysis RENAME TO moments_match`;
    console.log('✓ Renamed creatives_analysis → moments_match');
  } else {
    const alreadyRenamed = await sql`
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'moments_match'
    `;
    if (alreadyRenamed.length > 0) {
      console.log('  Table already named moments_match, skipping rename');
    } else {
      console.error('✗ Neither creatives_analysis nor moments_match found — check DB');
      process.exit(1);
    }
  }

  // Helper: add column only if it doesn't exist yet
  async function addColumnIfMissing(column, definition) {
    const exists = await sql`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'moments_match' AND column_name = ${column}
    `;
    if (exists.length === 0) {
      await sql.unsafe(`ALTER TABLE moments_match ADD COLUMN ${column} ${definition}`);
      console.log(`✓ Added column: ${column} ${definition}`);
    } else {
      console.log(`  Column already exists, skipping: ${column}`);
    }
  }

  // 2-7 — Add new columns
  await addColumnIfMissing('client_org_id',               'INT');
  await addColumnIfMissing('analysis_name',               'TEXT');
  await addColumnIfMissing('media_plan_name',             'TEXT');
  await addColumnIfMissing('media_plan_moments_id',       'JSONB');
  await addColumnIfMissing('media_plan_moments_details',  'JSONB');
  await addColumnIfMissing('media_plan_moments_taxonomies', 'JSONB');

  console.log('\nDone. Final columns in moments_match:');
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'moments_match'
    ORDER BY ordinal_position
  `;
  cols.forEach(c => console.log(`  ${c.column_name.padEnd(35)} ${c.data_type.padEnd(20)} nullable:${c.is_nullable}`));
}

run().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
