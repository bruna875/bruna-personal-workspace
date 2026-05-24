// moments-api.js
// Mock Moments API — source of truth for moment metadata
// Est_Dollar_Value = Est_Impressions * Est_CPM / 1000

var MOCK_MOMENTS_API = [
  { moment_id:'MOM001', name:'Sports & Fitness Live',    category:'Sports',        est_impressions:2100000, est_cpm:8.50  },
  { moment_id:'MOM002', name:'Cooking & Recipes',        category:'Food',          est_impressions:1800000, est_cpm:7.20  },
  { moment_id:'MOM003', name:'Home Improvement',         category:'Lifestyle',     est_impressions:1400000, est_cpm:9.00  },
  { moment_id:'MOM004', name:'Travel & Adventure',       category:'Travel',        est_impressions:1100000, est_cpm:11.50 },
  { moment_id:'MOM005', name:'Family & Parenting',       category:'Family',        est_impressions:900000,  est_cpm:6.80  },
  { moment_id:'MOM006', name:'Tech & Gadgets',           category:'Technology',    est_impressions:3200000, est_cpm:12.00 },
  { moment_id:'MOM007', name:'Music & Entertainment',    category:'Entertainment', est_impressions:4500000, est_cpm:5.50  },
  { moment_id:'MOM008', name:'Fashion & Beauty',         category:'Lifestyle',     est_impressions:2800000, est_cpm:9.75  },
  { moment_id:'MOM009', name:'Outdoor Adventures',       category:'Sports',        est_impressions:750000,  est_cpm:13.20 },
  { moment_id:'MOM010', name:'Gaming & Esports',         category:'Gaming',        est_impressions:5100000, est_cpm:7.80  },
  { moment_id:'MOM011', name:'Health & Wellness',        category:'Health',        est_impressions:2300000, est_cpm:10.50 },
  { moment_id:'MOM012', name:'News & Current Affairs',   category:'News',          est_impressions:3800000, est_cpm:14.00 },
  { moment_id:'MOM013', name:'Kids & Animation',         category:'Family',        est_impressions:1600000, est_cpm:8.20  },
  { moment_id:'MOM014', name:'Auto & Motorsport',        category:'Auto',          est_impressions:1200000, est_cpm:15.50 },
  { moment_id:'MOM015', name:'Finance & Business',       category:'Finance',       est_impressions:880000,  est_cpm:18.00 },
];

// Helper: enrich a moment_id with API data
function momentById(id) {
  return MOCK_MOMENTS_API.find(function(m){ return m.moment_id === id; }) || null;
}

// Helper: format impressions (e.g. 2100000 → "2.1M")
function fmtMomentImpr(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'K';
  return String(n);
}

// Helper: format dollar value
function fmtMomentDollar(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '$' + Math.round(n / 1000) + 'K';
  return '$' + n.toFixed(2);
}
