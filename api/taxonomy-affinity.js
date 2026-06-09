// api/taxonomy-affinity.js
// POST { input_type: 'text'|'image', text?, image_url?, type? }
// Returns { themes: string[], scored: { [type]: [{id,name,category,subcategory,score}] } }

import { neon } from '@neondatabase/serverless';
import Groq from 'groq-sdk';

const TYPES = ['iab','emotion','sentiment','object','location','logo','brand_safety','face'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { input_type, text, image_url, image_base64, type } = req.body || {};
  if (!input_type) return res.status(400).json({ error: 'input_type required' });

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const sql  = neon(process.env.DATABASE_URL);

    // ── 1. Extract themes from input via Groq ──────────────────────────────────
    let themes = [];
    const THEME_PROMPT = `Analyze this content and return a JSON array of 20-30 highly specific semantic themes, concepts, emotions, objects, locations, brands, activities, and moods present or strongly implied. Be specific and varied. Return ONLY a JSON array of strings, no explanation.`;

    if (input_type === 'text' && text) {
      const resp = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: THEME_PROMPT },
          { role: 'user',   content: text }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500
      });
      const parsed = JSON.parse(resp.choices[0].message.content);
      themes = Array.isArray(parsed) ? parsed : (parsed.themes || parsed.items || Object.values(parsed)[0] || []);

    } else if (input_type === 'image' && (image_url || image_base64)) {
      const imgContent = image_url
        ? { type: 'image_url', image_url: { url: image_url } }
        : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image_base64}` } };

      const resp = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            imgContent,
            { type: 'text', text: THEME_PROMPT }
          ]
        }],
        temperature: 0.3,
        max_tokens: 500
      });
      try {
        // Strip markdown code fences if present
        let content = resp.choices[0].message.content.trim();
        content = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
        const parsed = JSON.parse(content);
        themes = Array.isArray(parsed) ? parsed : (parsed.themes || parsed.items || Object.values(parsed)[0] || []);
      } catch {
        // Fallback: extract quoted strings
        themes = (resp.choices[0].message.content.match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, ''));
      }
    } else {
      return res.status(400).json({ error: 'text or image required' });
    }

    if (!themes.length) return res.status(500).json({ error: 'Could not extract themes from input' });

    // ── 2. Load taxonomy items ─────────────────────────────────────────────────
    const typeFilter = type && TYPES.includes(type) ? type : null;
    const items = typeFilter
      ? await sql`SELECT id, type, name, category, subcategory FROM taxonomy_items WHERE type = ${typeFilter}`
      : await sql`SELECT id, type, name, category, subcategory FROM taxonomy_items`;

    // ── 3. Score each item against themes ──────────────────────────────────────
    const themesLower = themes.map(t => t.toLowerCase());

    function scoreItem(item) {
      const tokens = [item.name, item.category, item.subcategory]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      let score = 0;
      for (const theme of themesLower) {
        const tWords = theme.split(/\s+/);
        // Exact full match
        if (tokens.includes(theme)) { score += 10; continue; }
        // Partial word matches
        for (const w of tWords) {
          if (w.length < 3) continue;
          if (tokens.includes(w)) score += 3;
          else if (tokens.split(/\s+/).some(tok => tok.startsWith(w) || w.startsWith(tok))) score += 1;
        }
      }
      // Normalize to 0-100
      return Math.min(100, Math.round((score / (themes.length * 2)) * 100));
    }

    // Group and sort by score descending
    const scored = {};
    for (const t of TYPES) scored[t] = [];

    for (const item of items) {
      const s = scoreItem(item);
      scored[item.type].push({ id: item.id, name: item.name, category: item.category, subcategory: item.subcategory, score: s });
    }

    for (const t of TYPES) {
      scored[t].sort((a, b) => b.score - a.score);
    }

    return res.status(200).json({ themes, scored });

  } catch (err) {
    console.error('taxonomy-affinity error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
