import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`DROP TABLE IF EXISTS kervone_team_member CASCADE`;
    await sql`DROP TABLE IF EXISTS kervone_team CASCADE`;
    await sql`DROP TABLE IF EXISTS kervone_domain CASCADE`;
    return res.status(200).json({ ok: true, message: 'Tables dropped' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
