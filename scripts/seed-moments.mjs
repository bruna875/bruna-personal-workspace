// seed-moments.mjs — creates and seeds the moments table

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_0b2cePsmAXFk@ep-curly-tree-apk37mv4-pooler.c-7.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(DATABASE_URL);

const MOMENTS = [
  { id: 'MOM001', name: 'Sports Comeback Moment' },
  { id: 'MOM002', name: 'Morning Coffee Ritual' },
  { id: 'MOM003', name: 'Family Movie Night' },
  { id: 'MOM004', name: 'Holiday Shopping Rush' },
  { id: 'MOM005', name: 'Outdoor Adventure Escape' },
  { id: 'MOM006', name: 'Tech Unboxing Reveal' },
  { id: 'MOM007', name: 'Cooking Competition Finals' },
  { id: 'MOM008', name: 'Late Night Comedy Punchline' },
  { id: 'MOM009', name: 'Pet Rescue Heartwarming' },
  { id: 'MOM010', name: 'Thriller Chase Scene' },
  { id: 'MOM011', name: 'Fitness & Workout Grind' },
  { id: 'MOM012', name: 'Breaking News Alert' },
  { id: 'MOM013', name: 'Kids Birthday Celebration' },
  { id: 'MOM014', name: 'Luxury Car Commercial' },
  { id: 'MOM015', name: 'Nature Documentary Sunrise' },
];

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS moments (
      moment_id   VARCHAR(10) PRIMARY KEY,
      moment_name TEXT NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `;
  await sql`TRUNCATE moments`;

  await sql.transaction(
    MOMENTS.map(m => sql`INSERT INTO moments VALUES (${m.id}, ${m.name}, NOW())`)
  );

  const rows = await sql`SELECT moment_id, moment_name FROM moments ORDER BY moment_id`;
  rows.forEach(r => console.log(`  ${r.moment_id}  ${r.moment_name}`));
  console.log(`\n✅ ${rows.length} moments inserted.`);
}

main().catch(e => { console.error(e); process.exit(1); });
