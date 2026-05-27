import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        c.ordinal_position,
        CASE WHEN kcu.column_name IS NOT NULL THEN true ELSE false END AS is_pk
      FROM information_schema.columns c
      LEFT JOIN information_schema.table_constraints tc
        ON tc.table_name = c.table_name
        AND tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      LEFT JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.column_name = c.column_name
        AND kcu.table_schema = 'public'
      WHERE c.table_schema = 'public'
        AND c.table_name NOT IN (
          'kervone_domain','kervone_team','kervone_team_member','kervone_teammember'
        )
      ORDER BY c.table_name, c.ordinal_position
    `;

    const tables = {};
    for (const r of rows) {
      if (!tables[r.table_name]) tables[r.table_name] = [];
      tables[r.table_name].push({
        column_name:    r.column_name,
        data_type:      r.udt_name || r.data_type,
        is_nullable:    r.is_nullable === 'YES',
        column_default: r.column_default,
        is_pk:          r.is_pk,
      });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ tables });
  } catch (err) {
    console.error('dev-specs-schema error:', err);
    return res.status(500).json({ error: err.message });
  }
}
