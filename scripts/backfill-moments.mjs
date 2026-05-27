// scripts/backfill-moments.mjs
// Backfills the `moments` JSONB column for all analyses that have it NULL.
// Run: node scripts/backfill-moments.mjs
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

// Full MOCK_MOMENTS_API snapshot — getters replaced with computed values
const MOMENTS = [
  { moment_id:'MOM001', moment_name:'Sports Comeback Moment',      moment_type:'Live',           moment_score:91, est_impressions:4200000,  est_cpm:18.50, est_dollar_value:77700,  pods:240, channels:['ESPN','ESPN2','CBS Sports','NBC Sports','Fox Sports 1','TNT'] },
  { moment_id:'MOM002', moment_name:'Morning Coffee Ritual',       moment_type:'VoD',            moment_score:72, est_impressions:1850000,  est_cpm:9.20,  est_dollar_value:17020,  pods:140, channels:['HGTV','Food Network','Bravo','Lifetime','Hallmark Channel','TLC'] },
  { moment_id:'MOM003', moment_name:'Family Movie Night',          moment_type:'VoD',            moment_score:68, est_impressions:2700000,  est_cpm:8.00,  est_dollar_value:21600,  pods:175, channels:['TBS','TNT','AMC','Freeform','USA Network','Disney Channel','Hallmark Channel'] },
  { moment_id:'MOM004', moment_name:'Holiday Shopping Rush',       moment_type:'VoD',            moment_score:88, est_impressions:5800000,  est_cpm:22.00, est_dollar_value:127600, pods:290, channels:['NBC','ABC','CBS','FOX','Lifetime','Hallmark Channel','TLC','Bravo'] },
  { moment_id:'MOM005', moment_name:'Outdoor Adventure Escape',   moment_type:'VoD',            moment_score:76, est_impressions:1100000,  est_cpm:14.50, est_dollar_value:15950,  pods:120, channels:['Discovery','National Geographic','Travel Channel','Animal Planet','History'] },
  { moment_id:'MOM006', moment_name:'Tech Unboxing Reveal',        moment_type:'Organic Pause',  moment_score:82, est_impressions:3400000,  est_cpm:15.00, est_dollar_value:51000,  pods:200, channels:['TBS','Comedy Central','ESPN','FX','FXX','USA Network','Syfy'] },
  { moment_id:'MOM007', moment_name:'Cooking Competition Finals',  moment_type:'VoD',            moment_score:64, est_impressions:2100000,  est_cpm:10.80, est_dollar_value:22680,  pods:160, channels:['Food Network','Bravo','TLC','Lifetime','A&E','E!'] },
  { moment_id:'MOM008', moment_name:'Late Night Comedy Punchline', moment_type:'Organic Pause',  moment_score:71, est_impressions:1900000,  est_cpm:11.50, est_dollar_value:21850,  pods:145, channels:['NBC','CBS','ABC','Comedy Central','TBS','Conan'] },
  { moment_id:'MOM009', moment_name:'Pet Rescue Heartwarming',     moment_type:'VoD',            moment_score:69, est_impressions:1500000,  est_cpm:9.00,  est_dollar_value:13500,  pods:130, channels:['Animal Planet','Discovery','TLC','Hallmark Channel','OWN','Lifetime'] },
  { moment_id:'MOM010', moment_name:'Thriller Chase Scene',        moment_type:'Organic Pause',  moment_score:43, est_impressions:3100000,  est_cpm:13.00, est_dollar_value:40300,  pods:210, channels:['AMC','FX','TNT','USA Network','Syfy','A&E','CBS'] },
  { moment_id:'MOM011', moment_name:'Fitness & Workout Grind',     moment_type:'VoD',            moment_score:79, est_impressions:2500000,  est_cpm:12.20, est_dollar_value:30500,  pods:180, channels:['ESPN','ESPN2','NBC Sports','Fox Sports 1','CBS Sports','Discovery'] },
  { moment_id:'MOM012', moment_name:'Breaking News Alert',         moment_type:'Live',           moment_score:51, est_impressions:6200000,  est_cpm:25.00, est_dollar_value:155000, pods:300, channels:['CNN','MSNBC','Fox News','NBC','ABC','CBS','BBC America'] },
  { moment_id:'MOM013', moment_name:'Kids Birthday Celebration',   moment_type:'VoD',            moment_score:73, est_impressions:1650000,  est_cpm:7.50,  est_dollar_value:12375,  pods:115, channels:['Disney Channel','Nickelodeon','Cartoon Network','Freeform','TLC','Hallmark Channel'] },
  { moment_id:'MOM014', moment_name:'Luxury Car Commercial',       moment_type:'Organic Pause',  moment_score:84, est_impressions:2900000,  est_cpm:21.00, est_dollar_value:60900,  pods:190, channels:['NBC','ABC','CBS','FOX','CNN','MSNBC','ESPN','Golf Channel'] },
  { moment_id:'MOM015', moment_name:'Nature Documentary Sunrise',  moment_type:'VoD',            moment_score:62, est_impressions:980000,   est_cpm:11.00, est_dollar_value:10780,  pods:100, channels:['National Geographic','Discovery','Animal Planet','BBC America','PBS'] },
  { moment_id:'MOM016', moment_name:'Wedding Day Ceremony',        moment_type:'VoD',            moment_score:77, est_impressions:1750000,  est_cpm:12.00, est_dollar_value:21000,  pods:135, channels:['Lifetime','TLC','Hallmark Channel','Bravo','OWN','WE tv'] },
  { moment_id:'MOM017', moment_name:'College Game Day',            moment_type:'Live',           moment_score:85, est_impressions:3800000,  est_cpm:16.50, est_dollar_value:62700,  pods:260, channels:['ESPN','ESPN2','ABC','CBS Sports','Fox Sports 1','NBC Sports'] },
  { moment_id:'MOM018', moment_name:'Real Estate House Tour',      moment_type:'VoD',            moment_score:65, est_impressions:1300000,  est_cpm:10.50, est_dollar_value:13650,  pods:115, channels:['HGTV','TLC','Bravo','A&E','Lifetime','Discovery'] },
  { moment_id:'MOM019', moment_name:'Music Award Show',            moment_type:'Live',           moment_score:93, est_impressions:7200000,  est_cpm:28.00, est_dollar_value:201600, pods:295, channels:['CBS','NBC','ABC','MTV','VH1','BET','E!'] },
  { moment_id:'MOM020', moment_name:'Beach Summer Vacation',       moment_type:'VoD',            moment_score:74, est_impressions:2200000,  est_cpm:11.00, est_dollar_value:24200,  pods:155, channels:['TLC','Travel Channel','Bravo','E!','Discovery','National Geographic'] },
  { moment_id:'MOM021', moment_name:'Hospital Drama Cliffhanger',  moment_type:'Organic Pause',  moment_score:38, est_impressions:3500000,  est_cpm:14.20, est_dollar_value:49700,  pods:225, channels:['ABC','NBC','CBS','FOX','Lifetime','A&E','TNT'] },
  { moment_id:'MOM022', moment_name:'Grocery Store Discovery',     moment_type:'Organic Pause',  moment_score:70, est_impressions:4100000,  est_cpm:8.80,  est_dollar_value:36080,  pods:250, channels:['Food Network','TLC','Bravo','HGTV','Lifetime','Hallmark Channel','CBS'] },
  { moment_id:'MOM023', moment_name:'Travel Airport Departure',    moment_type:'VoD',            moment_score:67, est_impressions:1600000,  est_cpm:13.50, est_dollar_value:21600,  pods:130, channels:['Travel Channel','Discovery','CNN','MSNBC','National Geographic','BBC America'] },
  { moment_id:'MOM024', moment_name:'Political Debate Showdown',   moment_type:'Live',           moment_score:29, est_impressions:5500000,  est_cpm:30.00, est_dollar_value:165000, pods:285, channels:['CNN','MSNBC','Fox News','NBC','ABC','CBS','PBS'] },
  { moment_id:'MOM025', moment_name:'Wine & Dining Experience',    moment_type:'Organic Pause',  moment_score:78, est_impressions:1050000,  est_cpm:19.00, est_dollar_value:19950,  pods:105, channels:['Bravo','Food Network','Travel Channel','E!','Lifetime','OWN'] },
  { moment_id:'MOM026', moment_name:'Newborn Baby Arrival',        moment_type:'VoD',            moment_score:71, est_impressions:1400000,  est_cpm:9.50,  est_dollar_value:13300,  pods:120, channels:['TLC','Lifetime','Hallmark Channel','OWN','A&E','Bravo'] },
  { moment_id:'MOM027', moment_name:'Superhero Action Sequence',   moment_type:'Organic Pause',  moment_score:58, est_impressions:4800000,  est_cpm:16.00, est_dollar_value:76800,  pods:270, channels:['FX','FXX','TNT','TBS','Syfy','AMC','USA Network'] },
  { moment_id:'MOM028', moment_name:'Back to School Season',       moment_type:'VoD',            moment_score:73, est_impressions:3300000,  est_cpm:10.00, est_dollar_value:33000,  pods:220, channels:['Disney Channel','Nickelodeon','Cartoon Network','ABC','NBC','CBS','Freeform'] },
  { moment_id:'MOM029', moment_name:'Crime Investigation Reveal',  moment_type:'VoD',            moment_score:34, est_impressions:2800000,  est_cpm:13.80, est_dollar_value:38640,  pods:195, channels:['ID','A&E','Oxygen','NBC','CBS','AMC','TNT'] },
  { moment_id:'MOM030', moment_name:'Graduation Day Celebration',  moment_type:'VoD',            moment_score:75, est_impressions:1200000,  est_cpm:11.80, est_dollar_value:14160,  pods:110, channels:['NBC','ABC','CBS','Hallmark Channel','OWN','Lifetime','TLC'] },
];

async function run() {
  // Find all analyses where moments IS NULL
  const rows = await sql`SELECT analysis_id FROM moments_match WHERE moments IS NULL ORDER BY analysis_id`;
  console.log(`Found ${rows.length} analyses to backfill.`);
  if (!rows.length) { console.log('Nothing to do.'); return; }

  let updated = 0;
  for (const row of rows) {
    await sql`UPDATE moments_match SET moments = ${JSON.stringify(MOMENTS)}::jsonb WHERE analysis_id = ${row.analysis_id}`;
    console.log(`  ✓ analysis_id ${row.analysis_id} updated`);
    updated++;
  }
  console.log(`\nDone — ${updated} analyses backfilled.`);
}

run().catch(err => { console.error(err); process.exit(1); });
