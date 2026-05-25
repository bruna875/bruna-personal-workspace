import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const {
      creative_name,
      creative_asset_type,
      creative_asset_link,
      creative_preview,
    } = req.body || {};

    const nameVal  = creative_name        ? String(creative_name).trim()  : null;
    const typeVal  = creative_asset_type  ? String(creative_asset_type)    : null;
    const linkVal  = creative_asset_link  ? String(creative_asset_link)    : null;
    const prevVal  = creative_preview     ? String(creative_preview)       : null;

    const result = await sql`
      INSERT INTO creatives (creative_name, creative_asset_type, creative_asset_link, creative_preview)
      VALUES (${nameVal}, ${typeVal}, ${linkVal}, ${prevVal})
      RETURNING creative_id
    `;

    return res.status(200).json({ creative_id: result[0].creative_id });
  } catch (err) {
    console.error('creatives-create error:', err);
    return res.status(500).json({ error: err.message });
  }
}
