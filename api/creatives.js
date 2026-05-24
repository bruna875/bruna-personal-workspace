import { neon } from '@neondatabase/serverless';

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function thumbFromLink(link, type) {
  if (!link) return '';
  if (type === 'image') return link;
  if (type === 'youtube') {
    // Extract video ID from iframe src or youtube URL
    var m = link.match(/(?:youtube\.com\/embed\/|youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
    return m ? 'https://img.youtube.com/vi/' + m[1] + '/mqdefault.jpg' : '';
  }
  return '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT
        cr.creative_id,
        cr.client_org_id,
        cr.campaign_id,
        cr.advertiser_id,
        cr.creative_preview,
        cr.creative_asset_s3,
        cr.creative_asset_link,
        cr.creative_asset_type,
        cr.template_ids,
        cr.created_at,
        o.client_name,
        a.advertiser_name,
        c.campaign_name
      FROM creatives cr
      LEFT JOIN client_organizations o ON cr.client_org_id  = o.client_org_id
      LEFT JOIN advertisers          a ON cr.advertiser_id  = a.advertiser_id
      LEFT JOIN campaigns            c ON cr.campaign_id    = c.campaign_id
      ORDER BY cr.creative_id
    `;

    const creatives = rows.map(r => ({
      id:          'dbcr' + r.creative_id,
      dbId:        r.creative_id,
      name:        r.creative_asset_link
                     ? r.creative_asset_link.split('/').pop().split('?')[0]
                     : 'Creative #' + r.creative_id,
      client:      r.client_name    || '—',
      advertiser:  r.advertiser_name || '—',
      campaign:    r.campaign_name   || null,
      fileType:    r.creative_asset_type === 'youtube' ? 'MP4'
                 : r.creative_asset_type === 'image'   ? r.creative_asset_link && r.creative_asset_link.split('.').pop().toUpperCase()
                 : '—',
      mediaType:   null,
      templates:   [],
      date:        fmtDate(r.created_at),
      thumb:       r.creative_preview
                     || thumbFromLink(r.creative_asset_link, r.creative_asset_type)
                     || '',
      assetLink:   r.creative_asset_link  || '',
      assetType:   r.creative_asset_type  || '',
      assetS3:     r.creative_asset_s3    || '',
    }));

    return res.status(200).json({ creatives });
  } catch (err) {
    console.error('creatives API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
