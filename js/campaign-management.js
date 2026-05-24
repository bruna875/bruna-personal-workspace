// campaign-management.js

// ── Mock Campaign Pacing API ──────────────────────────────────────────────────
// Keyed by DB campaign_id; delivered = impressions served, spent = budget used
var CM_PACING = {
  1:  { delivered: '14.4M', spent: '$302K', pacing: 72  },  // Q2 Walmart Grocery
  2:  { delivered: '10.1M', spent: '$232K', pacing: 58  },  // Back to School 2026
  3:  { delivered: '3.1M',  spent: '$46K',  pacing: 31  },  // Summer Fresh Campaign
  4:  { delivered: '—',     spent: '—',     pacing: null },  // Home Renovation Q3 (draft)
  5:  { delivered: '7.6M',  spent: '$176K', pacing: 84  },  // Target Back to School
  6:  { delivered: '1.4M',  spent: '$35K',  pacing: 18  },  // Pets & More Spring
  7:  { delivered: '24.8M', spent: '$498K', pacing: 100 },  // Electronics Week
  8:  { delivered: '—',     spent: '—',     pacing: null },  // Health & Wellness Q2 (no spec)
  9:  { delivered: '—',     spent: '—',     pacing: null },  // Clean Home Summer (draft)
  10: { delivered: '8.5M',  spent: '$181K', pacing: 90  },  // Beauty Essentials
  11: { delivered: '2.3M',  spent: '$47K',  pacing: 27  },  // Garden & Outdoor Spring
  12: { delivered: '20.1M', spent: '$398K', pacing: 100 },  // New Devices Launch
  13: { delivered: '7.4M',  spent: '$164K', pacing: 53  },  // Everyday Essentials
};

// ── DB loader ─────────────────────────────────────────────────────────────────
var _cmDBLoaded = false;

function cmLoadFromDB() {
  fetch('/api/campaigns')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.campaigns || !data.campaigns.length) return;
      CM_CAMPAIGNS = data.campaigns;
      _cmDBLoaded = true;
      // Refresh table and count if already rendered
      var tbody = document.getElementById('cm-tbody');
      if (tbody) tbody.innerHTML = _cmRowsHtml();
      var count = document.getElementById('cm-count');
      if (count) count.textContent = CM_CAMPAIGNS.length;
    })
    .catch(function(e) { console.warn('campaigns API unavailable, using mock data:', e.message); });
}

// ── Mock campaign data (fallback) ─────────────────────────────────────────────
var CM_CAMPAIGNS = [
  { id:'cm1',  name:'Q2 Walmart Grocery',       advertiser:'Walmart',        geography:['US'],         status:'pacing',      pacing:72,  impressions:'14.2M', goal:'20M',  budget:'$420K', spent:'$301K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:2, moments:5,  partners:['The Trade Desk','DV360'],        createdBy:'Bruna M.',  createdOn:'12 Mar 2026' },
  { id:'cm2',  name:'Back to School 2026',       advertiser:'Walmart',        geography:['US','CA'],    status:'pacing',      pacing:58,  impressions:'9.8M',  goal:'18M',  budget:'$380K', spent:'$218K', start:'15 May 2026', end:'15 Aug 2026',  creatives:3, moments:3,  partners:['Xandr'],                         createdBy:'Marco F.',  createdOn:'2 Apr 2026'  },
  { id:'cm3',  name:'Summer Fresh Campaign',     advertiser:'Walmart',        geography:['EU'],         status:'underpacing', pacing:31,  impressions:'3.1M',  goal:'10M',  budget:'$150K', spent:'$47K',  start:'1 Jun 2026',  end:'31 Jul 2026',  creatives:2, moments:2,  partners:['DV360','Amazon DSP'],             createdBy:'Sara L.',   createdOn:'18 Apr 2026' },
  { id:'cm4',  name:'Home Renovation Q3',        advertiser:'The Home Depot', geography:['US'],         status:'draft',       pacing:0,   impressions:'—',     goal:'25M',  budget:'$600K', spent:'$0',    start:'1 Jul 2026',  end:'30 Sep 2026',  creatives:0, moments:0,  partners:[],                                createdBy:'Bruna M.',  createdOn:'5 May 2026'  },
  { id:'cm5',  name:'Target Back to School',     advertiser:'Target',         geography:['US'],         status:'pacing',      pacing:84,  impressions:'7.4M',  goal:'9M',   budget:'$210K', spent:'$175K', start:'1 May 2026',  end:'20 Jun 2026',  creatives:5, moments:7,  partners:['The Trade Desk'],                createdBy:'Luca R.',   createdOn:'10 Apr 2026' },
  { id:'cm6',  name:'Pets & More Spring',        advertiser:'Walmart',        geography:['US'],         status:'failed',      pacing:18,  impressions:'1.2M',  goal:'8M',   budget:'$190K', spent:'$34K',  start:'1 Apr 2026',  end:'30 May 2026',  creatives:2, moments:1,  partners:['Xandr','Yahoo DSP'],             createdBy:'Marco F.',  createdOn:'15 Mar 2026' },
  { id:'cm7',  name:'Electronics Week',          advertiser:'Samsung',        geography:['US','CA'],    status:'completed',   pacing:100, impressions:'22.5M', goal:'22M',  budget:'$510K', spent:'$508K', start:'1 Mar 2026',  end:'31 Mar 2026',  creatives:6, moments:12, partners:['DV360','The Trade Desk','Xandr'],createdBy:'Sara L.',   createdOn:'1 Feb 2026'  },
  { id:'cm8',  name:'Health & Wellness Q2',      advertiser:'Unilever',       geography:['EU'],         status:'pacing',      pacing:61,  impressions:'5.9M',  goal:'10M',  budget:'$230K', spent:'$142K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:3, moments:4,  partners:['Amazon DSP'],                    createdBy:'Bruna M.',  createdOn:'20 Mar 2026' },
  { id:'cm9',  name:'Clean Home Summer',         advertiser:'P&G',            geography:['US'],         status:'draft',       pacing:0,   impressions:'—',     goal:'12M',  budget:'$280K', spent:'$0',    start:'15 Jun 2026', end:'15 Sep 2026',  creatives:0, moments:0,  partners:[],                                createdBy:'Luca R.',   createdOn:'8 May 2026'  },
  { id:'cm10', name:'Beauty Essentials',         advertiser:'Unilever',       geography:['EU','UK'],    status:'pacing',      pacing:90,  impressions:'8.8M',  goal:'10M',  budget:'$195K', spent:'$176K', start:'1 Apr 2026',  end:'31 May 2026',  creatives:4, moments:6,  partners:['DV360'],                         createdBy:'Sara L.',   createdOn:'5 Mar 2026'  },
  { id:'cm11', name:'Garden & Outdoor Spring',   advertiser:'Walmart',        geography:['US'],         status:'underpacing', pacing:27,  impressions:'2.2M',  goal:'9M',   budget:'$175K', spent:'$48K',  start:'15 Apr 2026', end:'30 Jun 2026',  creatives:2, moments:2,  partners:['Yahoo DSP','Xandr'],             createdBy:'Marco F.',  createdOn:'28 Mar 2026' },
  { id:'cm12', name:'New Devices Launch',        advertiser:'Samsung',        geography:['US','CA'],    status:'completed',   pacing:100, impressions:'18.3M', goal:'18M',  budget:'$440K', spent:'$437K', start:'1 Feb 2026',  end:'28 Feb 2026',  creatives:5, moments:9,  partners:['The Trade Desk','Amazon DSP'],    createdBy:'Bruna M.',  createdOn:'10 Jan 2026' },
  { id:'cm13', name:'Everyday Essentials',       advertiser:'P&G',            geography:['US'],         status:'pacing',      pacing:53,  impressions:'6.7M',  goal:'14M',  budget:'$310K', spent:'$163K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:3, moments:3,  partners:['DV360'],                         createdBy:'Luca R.',   createdOn:'22 Mar 2026' },
];

var cmSearch = '';

// ── Draft creatives panel state ───────────────────────────────────────────────
var _cmDraftCreatives   = [];
var _cmLibSearch        = '';
var _cmOpenDetailId     = null; // tracks which campaign detail is open

// ── Moments panel state ───────────────────────────────────────────────────────
var _cmMomentMode        = null; // 'saved' | 'new'
var _cmSavedPlanId       = null;
var _cmMomentsSearchQuery = '';

// ── Build Media Plan page state ───────────────────────────────────────────────
var _bmpMode              = null; // 'analysis' | 'upload' | 'library' | 'brief'
var _bmpAnalysisSearch    = '';
var _bmpAnalysisId        = null;
var _bmpLibSearch         = '';
var _bmpLibSelectedIds    = [];

var BMP_PREVIOUS_ANALYSES = [
  { id:'bpa1', name:'Q2 Walmart Grocery — Audience Moments',     campaign:'Q2 Walmart Grocery',       date:'14 May 2026' },
  { id:'bpa2', name:'Back to School 2026 — Full Funnel',         campaign:'Back to School 2026',      date:'10 May 2026' },
  { id:'bpa3', name:'Electronics Week — In-Market Signals',      campaign:'Electronics Week',         date:'2 Apr 2026'  },
  { id:'bpa4', name:'Health & Wellness Q2 — Context Match',      campaign:'Health & Wellness Q2',     date:'1 Apr 2026'  },
  { id:'bpa5', name:'Beauty Essentials — Brand Safety Review',   campaign:'Beauty Essentials',        date:'28 Mar 2026' },
  { id:'bpa6', name:'New Devices Launch — Performance Forecast', campaign:'New Devices Launch',       date:'15 Feb 2026' },
];

var CM_SAVED_MEDIA_PLANS = [
  { id:'smp1', name:'Q2 Walmart Grocery — Full Funnel',    advertiser:'Walmart',   date:'Apr 2026' },
  { id:'smp2', name:'Back to School 2026 — Awareness',     advertiser:'Walmart',   date:'May 2026' },
  { id:'smp3', name:'Electronics Week — Performance',      advertiser:'Samsung',   date:'Mar 2026' },
  { id:'smp4', name:'Health & Wellness Q2',                advertiser:'Unilever',  date:'Apr 2026' },
  { id:'smp5', name:'Beauty Essentials — Brand Safety',    advertiser:'Unilever',  date:'Apr 2026' },
  { id:'smp6', name:'Home Renovation Q3 — Full Funnel',    advertiser:'Home Depot',date:'Jul 2026' },
];

function _cmTplIcon(name) {
  var n = (name || '').toLowerCase();
  if (n.indexOf('l-bar') >= 0 || n.indexOf('lbar') >= 0)
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="14" width="20" height="7" rx="2"/><rect x="2" y="3" width="9" height="9" rx="2"/></svg>';
  if (n.indexOf('sync') >= 0)
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>';
  if (n.indexOf('pause') >= 0)
    return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
}

function _cmDraftCreativesInnerHtml() {
  return '<div style="display:flex;align-items:stretch">'
    // ── Left: Add From Library ──
    + '<div style="flex:65;min-width:0;padding:20px 24px;border-right:1px solid var(--border);display:flex;flex-direction:column">'
    +   '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:12px">Add From Library</div>'
    +   _cmLibColHtml()
    + '</div>'
    // ── Right: Upload New Asset ──
    + '<div id="cm-upload-col" style="flex:35;min-width:0;padding:20px 24px;display:flex;flex-direction:column;gap:12px">'
    +   '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Asset</div>'
    +   '<div id="cm-upload-col-content" style="display:flex;flex-direction:column;gap:12px;flex:1;overflow-y:auto">'
    +     _cmUploadColHtml()
    +   '</div>'
    + '</div>'
    + '</div>';
}

// ── Left column: library browser ─────────────────────────────────────────────
var _cmLibCols = [
  { label: '',           width: '32px'  },
  { label: '',           width: '56px'  },
  { label: 'Creative'                   },
  { label: 'Advertiser', width: '100px' },
  { label: 'Template',   width: '130px' },
];

function _cmLibFilteredRows() {
  var q = (_cmLibSearch || '').toLowerCase();
  var lib = (typeof CS_LIBRARY !== 'undefined' ? CS_LIBRARY : []);
  return lib.filter(function(c) {
    return !q
      || (c.name||'').toLowerCase().indexOf(q) >= 0
      || (c.advertiser||'').toLowerCase().indexOf(q) >= 0
      || (c.campaign||'').toLowerCase().indexOf(q) >= 0;
  });
}

function _cmLibRowsHtml(filtered) {
  var BADGE = 'font-size:9px;font-weight:600;border-radius:4px;padding:2px 6px;border:1px solid;white-space:nowrap';
  return filtered.map(function(cr) {
    var isAdded = _cmDraftCreatives.some(function(d){ return d.libId === cr.id; });
    var mtStyle = cr.mediaType === 'CTV' ? 'color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe'
                : cr.mediaType === 'Web' ? 'color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe'
                :                          'color:#0369a1;background:#f0f9ff;border-color:#bae6fd';
    var TD = 'padding:5px 12px;border-bottom:1px solid var(--border);vertical-align:middle';
    var cb = '<input type="checkbox"' + (isAdded ? ' checked' : '') + ' onchange="cmLibToggleCreative(\'' + cr.id + '\')" '
      + 'style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">';
    var thumb = '<div style="width:44px;height:24px;border-radius:3px;overflow:hidden;background:#e5e7eb">'
      + '<img src="' + (cr.thumb||'') + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
    var nameCell = '<div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (cr.name||'—') + '</div>';
    var advCell  = '<div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (cr.advertiser||'—') + '</div>';
    var tplsArr  = cr.templates || [];
    var tplCell  = tplsArr.length
      ? '<div style="display:flex;flex-wrap:nowrap;gap:3px;overflow:hidden">' + tplsArr.map(function(t) {
          return '<span style="font-size:9px;font-weight:600;padding:2px 5px;border-radius:4px;background:var(--subtle);color:var(--muted);border:1px solid var(--border);white-space:nowrap;flex-shrink:0">' + t + '</span>';
        }).join('') + '</div>'
      : '<span style="font-size:11px;color:var(--faint)">—</span>';
    return '<tr onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD + ';width:32px">' + cb + '</td>'
      + '<td style="' + TD + ';width:52px">' + thumb + '</td>'
      + '<td style="' + TD + '">' + nameCell + '</td>'
      + '<td style="' + TD + ';width:100px">' + advCell + '</td>'
      + '<td style="' + TD + ';width:130px">' + tplCell + '</td>'
      + '</tr>';
  }).join('');
}

function _cmLibTableWrapHtml(filtered) {
  var rows = _cmLibRowsHtml(filtered);
  var tableHtml = rows
    ? UI.tableScroll(_cmLibCols, rows, 'cm-lib-tbody', 0, null, { inCard: true })
    : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  // Constrain to 5 rows (~44px each) with vertical scroll
  return tableHtml;
}

function _cmLibColHtml() {
  var filtered = _cmLibFilteredRows();
  var search = '<div style="padding:10px 16px;border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-lib-search', 'Search library…', 'cmLibSearch(this.value)', _cmLibSearch||'')
    + '</div>';
  return '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)">'
    + search
    + '<div id="cm-lib-table-wrap" style="max-height:277px;overflow-y:auto;overflow-x:auto">' + _cmLibTableWrapHtml(filtered) + '</div>'
    + '</div>';
}

// ── Right column: upload zone + uploaded tiles ────────────────────────────────
function _cmUploadColHtml() {
  var upSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  var dz = 'border:1.5px dashed var(--border-md);border-radius:10px;cursor:pointer;transition:border-color .15s,background .15s;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;text-align:center';

  var dropZone = '<div onclick="cmDraftCreativeUpload()" '
    + 'ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
    + 'ondragleave="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'" '
    + 'ondrop="event.preventDefault();cmDraftCreativeUpload()" '
    + 'style="' + dz + ';padding:28px 16px;" '
    + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
    + 'onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'">'
    + upSvg
    + '<div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Drop your assets here</div>'
    + '<div style="font-size:11px;color:var(--muted)">MP4, MOV, JPG, PNG</div></div>'
    + '<button onclick="event.stopPropagation();cmDraftCreativeUpload()" style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;font-size:11px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">'
    +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +   'Browse'
    + '</button>'
    + '</div>';

  if (_cmDraftCreatives.length === 0) return dropZone;

  // Tiles grid
  var tiles = _cmDraftCreatives.map(function(a) {
    var addTplBtn = '<button onclick="event.stopPropagation();cmAddTemplate(\'' + a.id + '\')" style="display:inline-flex;align-items:center;gap:3px;height:18px;padding:0 6px;border:1px solid var(--border-md);border-radius:5px;font-size:9px;font-weight:500;color:var(--muted);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
      + '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
      + 'Add Template'
      + '</button>';
    var tpls = a.templates || [];
    var tplChips = tpls.map(function(t) {
      return '<span style="font-size:9px;font-weight:600;padding:2px 5px;border-radius:4px;background:var(--subtle);color:var(--muted);border:1px solid var(--border);white-space:nowrap;flex-shrink:0">' + t + '</span>';
    }).join('');
    var bottomSection = tpls.length
      ? '<div style="padding:4px 6px 6px;border-top:1px solid var(--border);flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;gap:3px">' + tplChips + '</div>'
      : '<div style="padding:5px 6px 6px;border-top:1px solid var(--border);flex:1;display:flex;align-items:center;justify-content:center">' + addTplBtn + '</div>';
    var hasTpls = tpls.length > 0;
    return '<div onclick="cmAddTemplate(\'' + a.id + '\')" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);position:relative;display:flex;flex-direction:column;' + (hasTpls ? 'cursor:pointer' : '') + '" ' + (hasTpls ? 'onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\'"' : '') + '>'
      + '<div style="aspect-ratio:16/9;background:#e5e7eb;overflow:hidden;flex-shrink:0">'
      +   '<img src="' + a.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      + '</div>'
      + '<div style="position:absolute;top:4px;left:4px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.5);color:#fff">' + a.type + '</div>'
      + '<button onclick="event.stopPropagation();cmDraftCreativeRemove(\'' + a.id + '\')" style="position:absolute;top:3px;right:3px;width:17px;height:17px;border:none;border-radius:4px;background:rgba(0,0,0,.4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:background .12s" onmouseover="this.style.background=\'#ef4444\'" onmouseout="this.style.background=\'rgba(0,0,0,.4)\'">'
      +   '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '<div style="padding:4px 6px;flex-shrink:0">'
      +   '<div style="font-size:10px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.name + '</div>'
      + '</div>'
      + bottomSection
      + '</div>';
  }).join('');

  var dropMoreTile = '<div onclick="cmDraftCreativeUpload()" '
    + 'ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\'" '
    + 'ondragleave="this.style.borderColor=\'var(--border-md)\'" '
    + 'ondrop="event.preventDefault();cmDraftCreativeUpload()" '
    + 'style="border:1.5px dashed var(--border-md);border-radius:8px;cursor:pointer;transition:border-color .15s;background:var(--bg);display:flex;align-items:center;justify-content:center" '
    + 'onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">'
    +   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    + '</div>';

  return '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' + tiles + dropMoreTile + '</div>';
}

function cmDraftCreativeUpload() {
  if (_cmDraftCreatives.length === 0) {
    _cmDraftCreatives = [
      { id:'dc1', name:'campaign-hero.mp4', type:'MP4',
        thumb:'https://img.youtube.com/vi/7IQ1yoN7EsE/mqdefault.jpg',
        templates:[] },
      { id:'dc2', name:'banner-static.jpg', type:'JPG',
        thumb:'/Asset%20Demo%20K1/walmart-ad.jpg',
        templates:[] },
    ];
  } else {
    var next = _cmDraftCreatives.length + 1;
    _cmDraftCreatives.push({ id:'dc'+next, name:'asset-'+next+'.mp4', type:'MP4',
      thumb:'https://img.youtube.com/vi/7IQ1yoN7EsE/mqdefault.jpg',
      templates:['Organic Pause'] });
  }
  var el = document.getElementById('cm-draft-creatives');
  if (el) el.innerHTML = _cmDraftCreativesInnerHtml();
}

function cmDraftCreativeRemove(id) {
  _cmDraftCreatives = _cmDraftCreatives.filter(function(a){ return a.id !== id; });
  var el = document.getElementById('cm-draft-creatives');
  if (el) el.innerHTML = _cmDraftCreativesInnerHtml();
}

function cmAddTemplate(draftId) {
  if (!_cmDraftCreatives.length) return;
  window._cmAddTemplateCreativeId = true; // flag: editor opened from Campaign Management
  // Load ALL draft creatives into CS editor sidebar
  csEditorAssets = _cmDraftCreatives.map(function(cr) {
    return { id: cr.id, name: cr.name, type: cr.type, thumb: cr.thumb, templates: (cr.templates || []).slice() };
  });
  // Pre-select the one the user clicked
  var selectedIdx = 0;
  for (var i = 0; i < _cmDraftCreatives.length; i++) {
    if (_cmDraftCreatives[i].id === draftId) { selectedIdx = i; break; }
  }
  csBuildSelectedAsset = selectedIdx;
  // Open the template builder overlay (same as csBuildTemplates but skip asset reset)
  var existing = document.getElementById('cs-editor-overlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'cs-editor-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#0d1117';
  overlay.innerHTML = _csEditorHtml();
  document.body.appendChild(overlay);
  var _cmSelId = (csEditorAssets[csBuildSelectedAsset] && csEditorAssets[csBuildSelectedAsset].id) ? csEditorAssets[csBuildSelectedAsset].id : (draftId || '');
  history.pushState({ id: 'creative-studio', label: 'Creative Studio', openEditor: true, csAssetId: _cmSelId }, '', '/creative-studio/build-template' + (_cmSelId ? '/' + _cmSelId : ''));
}

function cmLibSearch(val) {
  _cmLibSearch = val || '';
  var wrap = document.getElementById('cm-lib-table-wrap');
  if (wrap) {
    wrap.innerHTML = _cmLibTableWrapHtml(_cmLibFilteredRows());
    var inp = document.getElementById('cm-lib-search');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
}

function cmLibToggleCreative(libId) {
  var already = _cmDraftCreatives.some(function(d){ return d.libId === libId; });
  if (already) {
    _cmDraftCreatives = _cmDraftCreatives.filter(function(d){ return d.libId !== libId; });
  } else {
    var cr = (typeof CS_LIBRARY !== 'undefined' ? CS_LIBRARY : []).find(function(c){ return c.id === libId; });
    if (!cr) return;
    _cmDraftCreatives.push({ id:'lib-'+libId, libId:libId, name:cr.name, type:cr.fileType||'MP4', thumb:cr.thumb||'', templates:cr.templates||[] });
  }
  // Refresh right column tiles + library checkboxes
  var wrap = document.getElementById('cm-lib-table-wrap');
  if (wrap) wrap.innerHTML = _cmLibTableWrapHtml(_cmLibFilteredRows());
  var uploadCol = document.getElementById('cm-upload-col-content');
  if (uploadCol) uploadCol.innerHTML = _cmUploadColHtml();
}

function cmDraftGoToBuilder() {
  // Sync uploaded assets to CS so the builder has them ready
  CS_UPLOADED_ASSETS = _cmDraftCreatives.map(function(a) {
    return { id: a.id, name: a.name, type: a.type, thumb: a.thumb };
  });
  csBuilderBackPage = 'campaign-management';
  setPage('creative-studio', 'Creative Studio', true);
  setTimeout(function() { csBuildTemplates(0); }, 80);
}

// ── Moments full-screen overlay ───────────────────────────────────────────────
function cmOpenMomentsOverlay(mode) {
  var existing = document.getElementById('cm-moments-overlay');
  if (existing) existing.remove();

  var isMoments = mode === 'moments';
  var title  = isMoments ? 'Custom Moments Builder' : 'Media Planner';
  var pageId = isMoments ? 'moments-builder' : 'media-planner-v2';

  // Render the target page content
  var innerHtml = '';
  try {
    innerHtml = isMoments ? renderMomentsBuilder() : renderMediaPlannerV2();
  } catch(e) {
    innerHtml = '<div style="padding:40px;color:var(--muted);font-size:13px">Loading…</div>';
  }

  var overlay = document.createElement('div');
  overlay.id = 'cm-moments-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:var(--bg);overflow:hidden';

  overlay.innerHTML =
    // Top bar
    '<div style="display:flex;align-items:center;gap:12px;padding:0 20px;height:52px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">'
    + '<button onclick="cmCloseMomentsOverlay()" style="display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .12s,color .12s" onmouseover="this.style.borderColor=\'var(--text)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
    +   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>'
    +   'Back to Campaign'
    + '</button>'
    + '<div style="width:1px;height:18px;background:var(--border)"></div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text)">' + title + '</div>'
    + '</div>'
    // Scrollable body
    + '<div style="flex:1;overflow-y:auto;padding:24px 32px" id="cm-moments-overlay-body">'
    + innerHtml
    + '</div>';

  document.body.appendChild(overlay);

  // Re-init any JS that the page needs
  setTimeout(function() {
    if (!isMoments && typeof mp2InitSliders === 'function') mp2InitSliders();
  }, 80);
}

function cmCloseMomentsOverlay() {
  var ov = document.getElementById('cm-moments-overlay');
  if (ov) ov.remove();
}

// ── Build Media Plan page ─────────────────────────────────────────────────────
function _bmpReset() {
  _bmpMode = null; _bmpAnalysisSearch = ''; _bmpAnalysisId = null;
  _bmpLibSearch = ''; _bmpLibSelectedIds = [];
}

function _bmpCardHtml() {
  return '<div style="display:flex;width:100%;height:100%">'
    // ── Left: tiles ──
    + '<div style="width:220px;flex-shrink:0;border-right:1px solid var(--border);background:var(--bg);padding:16px;display:flex;flex-direction:column;gap:6px">'
    +   '<div style="font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;padding:0 4px">Start from</div>'
    +   '<div id="bmp-options" style="display:flex;flex-direction:column;gap:6px">' + _bmpOptionsHtml() + '</div>'
    + '</div>'
    // ── Right: content ──
    + '<div style="flex:1;overflow-y:auto" id="bmp-extra">' + _bmpExtraHtml() + '</div>'
    + '</div>';
}

// Standalone page — accessed directly via URL
function renderBuildMediaPlan() {
  _bmpReset();
  var backBtn = '<button onclick="history.back()" style="display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit" onmouseover="this.style.borderColor=\'var(--text)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
    + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>'
    + 'Back to Campaign'
    + '</button>';
  return UI.pageHeader({ title: 'Build Media Plan', titleRight: backBtn })
    + '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;min-height:460px;display:flex">'
    + _bmpCardHtml()
    + '</div>';
}

// Full-screen overlay — opened from draft campaign
function cmOpenBuildMediaPlanOverlay() {
  _bmpReset();
  var existing = document.getElementById('cm-bmp-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'cm-bmp-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:var(--bg);overflow:hidden';

  var backStyle = 'display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .12s,color .12s';
  overlay.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:0 20px;height:52px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">'
    + '<button onclick="cmCloseBuildMediaPlanOverlay()" style="' + backStyle + '" onmouseover="this.style.borderColor=\'var(--text)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
    +   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>'
    +   'Back to Campaign'
    + '</button>'
    + '<div style="width:1px;height:18px;background:var(--border)"></div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text)">Build Media Plan</div>'
    + '</div>'
    + '<div style="flex:1;overflow:hidden;display:flex">'
    + _bmpCardHtml()
    + '</div>';

  document.body.appendChild(overlay);
  history.pushState({ bmpOverlay: true }, '', '/campaign-management/draft-campaign/build-media-plan');
}

function cmCloseBuildMediaPlanOverlay() {
  var ov = document.getElementById('cm-bmp-overlay');
  if (ov) ov.remove();
  history.back();
}

function _bmpOptionsHtml() {
  var opts = [
    {
      id: 'analysis',
      label: 'Previous Analysis',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 5 3-5 3v-6z"/></svg>'
    },
    {
      id: 'upload',
      label: 'New Asset',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3V10z"/></svg>'
    },
    {
      id: 'library',
      label: 'Asset from Library',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19.5 3-3 3 3"/><path d="M17 22v-5.5"/><circle cx="9" cy="9" r="2"/></svg>'
    },
    {
      id: 'brief',
      label: 'Brief',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    },
  ];
  return opts.map(function(o) {
    var sel = _bmpMode === o.id;
    return '<div onclick="bmpSetMode(\'' + o.id + '\')" style="'
      + 'display:flex;align-items:center;gap:10px;'
      + 'padding:10px 12px;cursor:pointer;border-radius:8px;'
      + 'border:1.5px solid ' + (sel ? 'var(--accent)' : 'var(--border)') + ';'
      + 'background:' + (sel ? 'var(--accent-light)' : '#fff') + ';'
      + 'color:' + (sel ? 'var(--accent)' : 'var(--muted)') + ';'
      + 'transition:border-color .15s,background .15s,color .15s">'
      + o.icon
      + '<span style="font-size:12px;font-weight:' + (sel ? '600' : '500') + ';color:' + (sel ? 'var(--accent)' : 'var(--text)') + '">' + o.label + '</span>'
      + '</div>';
  }).join('');
}

function bmpSetMode(mode) {
  _bmpMode = (_bmpMode === mode) ? null : mode;
  _bmpAnalysisSearch = ''; _bmpAnalysisId = null;
  _bmpLibSearch = ''; _bmpLibSelectedIds = [];
  var optsEl  = document.getElementById('bmp-options');
  var extraEl = document.getElementById('bmp-extra');
  if (optsEl)  optsEl.innerHTML  = _bmpOptionsHtml();
  if (extraEl) extraEl.innerHTML = _bmpExtraHtml();
}

function _bmpExtraHtml() {
  if (!_bmpMode) {
    return '<div style="height:100%;display:flex;align-items:center;justify-content:center">'
      + '<span style="font-size:12px;color:var(--faint)">Select an option to continue.</span>'
      + '</div>';
  }

  if (_bmpMode === 'analysis') {
    var filtered = BMP_PREVIOUS_ANALYSES.filter(function(a) {
      var q = _bmpAnalysisSearch.toLowerCase();
      return !q || a.name.toLowerCase().indexOf(q) >= 0 || a.campaign.toLowerCase().indexOf(q) >= 0;
    });
    var rows = filtered.map(function(a) {
      var isSel = a.id === _bmpAnalysisId;
      return '<div onclick="bmpSelectAnalysis(\'' + a.id + '\')" '
        + 'style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;'
        + (isSel ? 'background:var(--accent-light);' : '')
        + '" onmouseover="if(\'' + a.id + '\'!==\'' + (_bmpAnalysisId||'') + '\')this.style.background=\'var(--subtle)\'" onmouseout="if(\'' + a.id + '\'!==\'' + (_bmpAnalysisId||'') + '\')this.style.background=\'\'">'
        + '<div>'
        + '<div style="font-size:12px;font-weight:500;color:var(--text)">' + a.name + '</div>'
        + '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + a.campaign + ' · ' + a.date + '</div>'
        + '</div>'
        + (isSel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '')
        + '</div>';
    }).join('');

    return '<div style="padding:24px">'
      + '<div style="position:relative;margin-bottom:10px">'
      + '<input id="bmp-search" type="text" placeholder="Search analyses…" oninput="bmpAnalysisSearch(this.value)" value="' + (_bmpAnalysisSearch||'') + '" autocomplete="off" '
      + 'style="width:100%;box-sizing:border-box;height:36px;padding:0 12px 0 34px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--bg);outline:none" />'
      + '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      + '</div>'
      + '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">'
      + (rows || '<div style="padding:16px;text-align:center;font-size:12px;color:var(--faint)">No results</div>')
      + '</div>'
      + '</div>';
  }

  if (_bmpMode === 'library') {
    return _bmpLibExtraHtml();
  }

  // upload / brief — placeholder CTAs
  var labels = { upload:'Upload New Asset', brief:'Import Brief' };
  return '<div style="padding:24px;display:flex;justify-content:flex-end">'
    + '<button style="height:34px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">'
    + labels[_bmpMode]
    + '</button>'
    + '</div>';
}

// ── BMP: Asset from Library ───────────────────────────────────────────────────
function _bmpLibFilteredRows() {
  var q = (_bmpLibSearch || '').toLowerCase();
  var lib = (typeof CS_LIBRARY !== 'undefined' ? CS_LIBRARY : []);
  return lib.filter(function(c) {
    return !q
      || (c.name||'').toLowerCase().indexOf(q) >= 0
      || (c.advertiser||'').toLowerCase().indexOf(q) >= 0;
  });
}

function _bmpLibRowsHtml(filtered) {
  var TD = 'padding:5px 12px;border-bottom:1px solid var(--border);vertical-align:middle';
  return filtered.map(function(cr) {
    var isSel = _bmpLibSelectedIds.indexOf(cr.id) >= 0;
    var cb = '<input type="checkbox"' + (isSel ? ' checked' : '') + ' onchange="bmpLibToggle(\'' + cr.id + '\')" '
      + 'style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer">';
    var thumb = '<div style="width:44px;height:24px;border-radius:3px;overflow:hidden;background:#e5e7eb">'
      + '<img src="' + (cr.thumb||'') + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>';
    var nameCell = '<div style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (cr.name||'—') + '</div>';
    var advCell  = '<div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (cr.advertiser||'—') + '</div>';
    var tplsArr  = cr.templates || [];
    var tplCell  = tplsArr.length
      ? '<div style="display:flex;flex-wrap:nowrap;gap:3px;overflow:hidden">' + tplsArr.map(function(t) {
          return '<span style="font-size:9px;font-weight:600;padding:2px 5px;border-radius:4px;background:var(--subtle);color:var(--muted);border:1px solid var(--border);white-space:nowrap;flex-shrink:0">' + t + '</span>';
        }).join('') + '</div>'
      : '<span style="font-size:11px;color:var(--faint)">—</span>';
    return '<tr onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD + ';width:32px">' + cb + '</td>'
      + '<td style="' + TD + ';width:52px">' + thumb + '</td>'
      + '<td style="' + TD + '">' + nameCell + '</td>'
      + '<td style="' + TD + ';width:100px">' + advCell + '</td>'
      + '<td style="' + TD + ';width:130px">' + tplCell + '</td>'
      + '</tr>';
  }).join('');
}

function _bmpLibCardsHtml() {
  if (!_bmpLibSelectedIds.length) return '';
  var lib = (typeof CS_LIBRARY !== 'undefined' ? CS_LIBRARY : []);
  var tiles = _bmpLibSelectedIds.map(function(id) {
    var cr = lib.find(function(c){ return c.id === id; });
    if (!cr) return '';
    var tpls = cr.templates || [];
    var tplChips = tpls.map(function(t) {
      return '<span style="font-size:9px;font-weight:600;padding:2px 5px;border-radius:4px;background:var(--subtle);color:var(--muted);border:1px solid var(--border);white-space:nowrap;flex-shrink:0">' + t + '</span>';
    }).join('');
    var bottomSection = tpls.length
      ? '<div style="padding:4px 6px 6px;border-top:1px solid var(--border);flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;gap:3px">' + tplChips + '</div>'
      : '<div style="padding:5px 6px 6px;border-top:1px solid var(--border);flex:1"></div>';
    return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);position:relative;display:flex;flex-direction:column">'
      + '<div style="aspect-ratio:16/9;background:#e5e7eb;overflow:hidden;flex-shrink:0">'
      +   '<img src="' + (cr.thumb||'') + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      + '</div>'
      + '<div style="position:absolute;top:4px;left:4px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.5);color:#fff">' + (cr.fileType||'MP4') + '</div>'
      + '<button onclick="event.stopPropagation();bmpLibDeselect(\'' + cr.id + '\')" style="position:absolute;top:3px;right:3px;width:17px;height:17px;border:none;border-radius:4px;background:rgba(0,0,0,.4);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:background .12s" onmouseover="this.style.background=\'#ef4444\'" onmouseout="this.style.background=\'rgba(0,0,0,.4)\'">'
      +   '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '<div style="padding:4px 6px;flex-shrink:0">'
      +   '<div style="font-size:10px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (cr.name||'—') + '</div>'
      + '</div>'
      + bottomSection
      + '</div>';
  }).join('');
  return '<div style="margin-top:16px">'
    + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:8px">Selected (' + _bmpLibSelectedIds.length + ')</div>'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">' + tiles + '</div>'
    + '</div>';
}

function _bmpLibExtraHtml() {
  var filtered = _bmpLibFilteredRows();
  var rows = _bmpLibRowsHtml(filtered);
  var cols = [
    { label: '',           width: '32px'  },
    { label: '',           width: '56px'  },
    { label: 'Creative'                   },
    { label: 'Advertiser', width: '100px' },
    { label: 'Template',   width: '130px' },
  ];
  var tableHtml = rows
    ? UI.tableScroll(cols, rows, 'bmp-lib-tbody', 0, null, { inCard: true })
    : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  var search = '<div style="padding:10px 16px;border-bottom:1px solid var(--border)">'
    + UI.searchBar('bmp-lib-search', 'Search library…', 'bmpLibSearch(this.value)', _bmpLibSearch||'')
    + '</div>';
  return '<div style="padding:20px">'
    + '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)">'
    +   search
    +   '<div id="bmp-lib-table-wrap" style="max-height:260px;overflow-y:auto;overflow-x:auto">' + tableHtml + '</div>'
    + '</div>'
    + '<div id="bmp-lib-cards">' + _bmpLibCardsHtml() + '</div>'
    + '</div>';
}

function bmpLibSearch(val) {
  _bmpLibSearch = val || '';
  var wrap = document.getElementById('bmp-lib-table-wrap');
  if (wrap) {
    var filtered = _bmpLibFilteredRows();
    var rows = _bmpLibRowsHtml(filtered);
    var cols = [
      { label: '', width: '32px' }, { label: '', width: '56px' },
      { label: 'Creative' }, { label: 'Advertiser', width: '100px' }, { label: 'Template', width: '130px' }
    ];
    wrap.innerHTML = rows
      ? UI.tableScroll(cols, rows, 'bmp-lib-tbody', 0, null, { inCard: true })
      : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
    var inp = document.getElementById('bmp-lib-search');
    if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
}

function bmpLibToggle(libId) {
  var idx = _bmpLibSelectedIds.indexOf(libId);
  if (idx >= 0) _bmpLibSelectedIds.splice(idx, 1);
  else _bmpLibSelectedIds.push(libId);
  var wrap = document.getElementById('bmp-lib-table-wrap');
  if (wrap) {
    var filtered = _bmpLibFilteredRows();
    var rows = _bmpLibRowsHtml(filtered);
    var cols = [
      { label: '', width: '32px' }, { label: '', width: '56px' },
      { label: 'Creative' }, { label: 'Advertiser', width: '100px' }, { label: 'Template', width: '130px' }
    ];
    wrap.innerHTML = rows
      ? UI.tableScroll(cols, rows, 'bmp-lib-tbody', 0, null, { inCard: true })
      : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  }
  var cards = document.getElementById('bmp-lib-cards');
  if (cards) cards.innerHTML = _bmpLibCardsHtml();
}

function bmpLibDeselect(libId) {
  var idx = _bmpLibSelectedIds.indexOf(libId);
  if (idx >= 0) _bmpLibSelectedIds.splice(idx, 1);
  var wrap = document.getElementById('bmp-lib-table-wrap');
  if (wrap) {
    var filtered = _bmpLibFilteredRows();
    var rows = _bmpLibRowsHtml(filtered);
    var cols = [
      { label: '', width: '32px' }, { label: '', width: '56px' },
      { label: 'Creative' }, { label: 'Advertiser', width: '100px' }, { label: 'Template', width: '130px' }
    ];
    wrap.innerHTML = rows
      ? UI.tableScroll(cols, rows, 'bmp-lib-tbody', 0, null, { inCard: true })
      : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  }
  var cards = document.getElementById('bmp-lib-cards');
  if (cards) cards.innerHTML = _bmpLibCardsHtml();
}

function bmpAnalysisSearch(val) {
  _bmpAnalysisSearch = val || '';
  var extraEl = document.getElementById('bmp-extra');
  if (extraEl) extraEl.innerHTML = _bmpExtraHtml();
  var inp = document.getElementById('bmp-search');
  if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function bmpSelectAnalysis(id) {
  _bmpAnalysisId = (_bmpAnalysisId === id) ? null : id;
  var extraEl = document.getElementById('bmp-extra');
  if (extraEl) extraEl.innerHTML = _bmpExtraHtml();
}

// ── Moments / Media Plan panel ────────────────────────────────────────────────
function _cmMomentsInnerHtml() {
  function radioCard(mode, title, desc) {
    var sel = _cmMomentMode === mode;
    return '<div onclick="cmSetMomentMode(\'' + mode + '\')" style="flex:1;border:1.5px solid ' + (sel ? 'var(--accent)' : 'var(--border-md)') + ';border-radius:10px;padding:16px;cursor:pointer;background:' + (sel ? 'var(--accent-light)' : 'var(--surface)') + ';transition:border-color .15s,background .15s">'
      + '<div style="display:flex;align-items:flex-start;gap:10px">'
      + (sel
          ? '<div style="width:16px;height:16px;border-radius:50%;border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px"><div style="width:7px;height:7px;border-radius:50%;background:var(--accent)"></div></div>'
          : '<div style="width:16px;height:16px;border-radius:50%;border:2px solid var(--border-md);flex-shrink:0;margin-top:1px"></div>'
        )
      + '<div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px">' + title + '</div>'
      + '<div style="font-size:11px;color:var(--muted);line-height:1.5">' + desc + '</div>'
      + '</div></div></div>';
  }

  var cards = '<div style="display:flex;gap:12px">'
    + radioCard('saved', 'Select Saved Media Plan', 'Use an existing media plan from a previous campaign.')
    + radioCard('new',   'Build New Media Plan',    'Open the Media Planner to configure a new plan from scratch.')
    + '</div>';

  var extra = '';

  if (_cmMomentMode === 'saved') {
    var filtered = CM_SAVED_MEDIA_PLANS.filter(function(p) {
      var q = _cmMomentsSearchQuery.toLowerCase();
      return !q || p.name.toLowerCase().indexOf(q) >= 0 || p.advertiser.toLowerCase().indexOf(q) >= 0;
    });
    var rows = filtered.map(function(p) {
      var isSel = p.id === _cmSavedPlanId;
      return '<div onclick="cmSelectSavedPlan(\'' + p.id + '\')" '
        + 'style="padding:10px 14px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;'
        + (isSel ? 'background:var(--accent-light);' : '')
        + '" onmouseover="if(\'' + p.id + '\'!==\'' + (_cmSavedPlanId||'') + '\')this.style.background=\'var(--subtle)\'" onmouseout="if(\'' + p.id + '\'!==\'' + (_cmSavedPlanId||'') + '\')this.style.background=\'\'">'
        + '<div>'
        + '<div style="font-size:12px;font-weight:500;color:var(--text)">' + p.name + '</div>'
        + '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + p.advertiser + ' · ' + p.date + '</div>'
        + '</div>'
        + (isSel ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '')
        + '</div>';
    }).join('');

    extra = '<div style="margin-top:16px">'
      + '<div style="position:relative;margin-bottom:8px">'
      + '<input id="cm-moments-search" type="text" placeholder="Search media plans…" oninput="cmMomentsSearch(this.value)" value="' + (_cmMomentsSearchQuery || '') + '" autocomplete="off" '
      + 'style="width:100%;box-sizing:border-box;height:36px;padding:0 12px 0 34px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--bg);outline:none" />'
      + '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      + '</div>'
      + '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">'
      + (rows || '<div style="padding:16px;text-align:center;font-size:12px;color:var(--faint)">No results</div>')
      + '</div>'
      + '</div>';

  } else if (_cmMomentMode === 'new') {
    extra = '<div style="margin-top:16px;display:flex;justify-content:flex-end">'
      + '<button onclick="cmOpenBuildMediaPlanOverlay()" style="height:34px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">'
      + 'Build Media Plan'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
      + '</button>'
      + '</div>';
  }

  return '<div style="padding:20px 24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)">'
    + cards + extra
    + '</div>';
}

function cmSetMomentMode(mode) {
  _cmMomentMode = (mode === _cmMomentMode) ? null : mode; // toggle off if same
  _cmMomentsSearchQuery = '';
  _cmSavedPlanId = null;
  var el = document.getElementById('cm-moments-panel');
  if (el) el.innerHTML = _cmMomentsInnerHtml();
}

function cmMomentsSearch(val) {
  _cmMomentsSearchQuery = val || '';
  var el = document.getElementById('cm-moments-panel');
  if (el) el.innerHTML = _cmMomentsInnerHtml();
  // restore focus + cursor position
  var inp = document.getElementById('cm-moments-search');
  if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
}

function cmSelectSavedPlan(id) {
  _cmSavedPlanId = (_cmSavedPlanId === id) ? null : id;
  var el = document.getElementById('cm-moments-panel');
  if (el) el.innerHTML = _cmMomentsInnerHtml();
}

// ── Add Creatives modal ───────────────────────────────────────────────────────
function cmOpenAddCreativesModal() {
  var existing = document.getElementById('cm-creatives-modal');
  if (existing) existing.remove();

  var imageUpIcon =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/>'
    + '<path d="m14 19.5 3-3 3 3"/><path d="M17 22v-5.5"/>'
    + '<circle cx="9" cy="9" r="2"/>'
    + '</svg>';

  var dropZone =
    '<div onclick="cmModalUpload()" '
    + 'style="flex:1;border:1.5px dashed var(--border-md);border-radius:10px;padding:20px 14px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;box-sizing:border-box" '
    + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
    + 'onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'">'
    +   imageUpIcon
    +   '<div>'
    +     '<div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Drop your assets here</div>'
    +     '<div style="font-size:10px;color:var(--muted)">MP4, MOV, JPG, PNG</div>'
    +   '</div>'
    +   '<button onclick="event.stopPropagation();cmModalUpload()" style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;font-size:11px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">'
    +     '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    +     'Browse'
    +   '</button>'
    + '</div>';

  var assetsCol =
    '<div id="cm-modal-assets-col" style="width:152px;flex-shrink:0;display:flex;flex-direction:column">'
    + _cmModalAssetsColHtml()
    + '</div>';

  var modal = document.createElement('div');
  modal.id = 'cm-creatives-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)';
  modal.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;width:520px;max-width:calc(100vw - 48px);box-shadow:0 20px 60px rgba(0,0,0,.18);overflow:hidden">'
    // Header
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">'
    +   '<div style="font-size:14px;font-weight:600;color:var(--text)">Add Creatives</div>'
    +   '<button onclick="cmCloseAddCreativesModal()" style="width:28px;height:28px;border:none;background:none;cursor:pointer;color:var(--faint);display:flex;align-items:center;justify-content:center;border-radius:6px;transition:color .12s" onmouseover="this.style.color=\'var(--text)\'" onmouseout="this.style.color=\'var(--faint)\'">'
    +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +   '</button>'
    + '</div>'
    // Body
    + '<div style="padding:20px">'
    +   '<div style="display:flex;gap:12px;align-items:stretch">' + dropZone + assetsCol + '</div>'
    + '</div>'
    // Footer
    + '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +   '<button onclick="cmCloseAddCreativesModal()" style="height:34px;padding:0 16px;border:1px solid var(--border-md);border-radius:8px;background:transparent;color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Cancel</button>'
    +   '<button id="cm-modal-cta" onclick="cmModalGoToBuilder()" disabled style="height:34px;padding:0 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;opacity:.4;transition:opacity .15s">Open Template Builder</button>'
    + '</div>'
    + '</div>';

  // Close on backdrop click
  modal.addEventListener('click', function(e) { if (e.target === modal) cmCloseAddCreativesModal(); });
  document.body.appendChild(modal);
}

function _cmModalAssetsColHtml() {
  if (CS_UPLOADED_ASSETS.length === 0) {
    return '<div style="flex:1;border:1px dashed var(--border);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;text-align:center;min-height:150px">'
      + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--border-md)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><polyline points="21 15 16 10 5 21"/></svg>'
      + '<span style="font-size:10px;color:var(--faint);line-height:1.4">Upload your<br>first asset</span>'
      + '</div>';
  }
  var label = '<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:6px">'
    + CS_UPLOADED_ASSETS.length + ' asset' + (CS_UPLOADED_ASSETS.length !== 1 ? 's' : '') + ' ready</div>';
  var tiles = CS_UPLOADED_ASSETS.map(function(a) {
    return '<div style="display:flex;align-items:center;gap:5px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;background:var(--surface)">'
      + '<img src="' + a.thumb + '" style="width:30px;height:18px;border-radius:3px;object-fit:cover;flex-shrink:0">'
      + '<div style="flex:1;min-width:0">'
      +   '<div style="font-size:9px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.name + '</div>'
      +   '<span style="font-size:8px;font-weight:600;color:var(--muted);letter-spacing:.2px">' + a.type + '</span>'
      + '</div>'
      + '</div>';
  }).join('');
  return label + '<div style="display:flex;flex-direction:column;gap:4px">' + tiles + '</div>';
}

function cmModalUpload() {
  csSimulateUpload();
  var col = document.getElementById('cm-modal-assets-col');
  if (col) col.innerHTML = _cmModalAssetsColHtml();
  var cta = document.getElementById('cm-modal-cta');
  if (cta) { cta.disabled = false; cta.style.opacity = '1'; }
}

function cmCloseAddCreativesModal() {
  var modal = document.getElementById('cm-creatives-modal');
  if (modal) modal.remove();
}

function cmModalGoToBuilder() {
  cmCloseAddCreativesModal();
  csBuilderBackPage = 'campaign-management';
  setPage('creative-studio', 'Creative Studio', true);
  setTimeout(function() { csBuildTemplates(0); }, 80);
}

// ── Status chip ───────────────────────────────────────────────────────────────
function cmStatusChip(status) {
  var alertIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  var errorIcon  = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';

  var map = {
    'draft':       { label:'Draft',       color:'var(--muted)',  bg:'var(--subtle)',  icon:'' },
    'planned':     { label:'Planned',     color:'#6d28d9',       bg:'#f5f3ff',        icon:'' },
    'pacing':      { label:'Pacing',      color:'#16a34a',       bg:'#f0fdf4',        icon:'' },
    'underpacing': { label:'Underpacing', color:'#b45309',       bg:'#fffbeb',        icon: alertIcon },
    'completed':   { label:'Completed',   color:'#2563eb',       bg:'#eff6ff',        icon:'' },
    'failed':      { label:'Failed',      color:'#dc2626',       bg:'#fef2f2',        icon: errorIcon },
  };
  var s = map[status] || { label: status, color:'var(--muted)', bg:'var(--subtle)', icon:'' };
  return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:3px 8px;border-radius:5px;white-space:nowrap;color:' + s.color + ';background:' + s.bg + '">'
    + s.icon + s.label + '</span>';
}

// ── Partner badges ────────────────────────────────────────────────────────────
function cmPartnerBadges(partners) {
  if (!partners || !partners.length) return '<span style="font-size:11px;color:var(--faint)">—</span>';
  var dots = {
    'The Trade Desk': '#22c55e',
    'DV360':          '#3b82f6',
    'Xandr':          '#f97316',
    'Amazon DSP':     '#f59e0b',
    'Yahoo DSP':      '#a855f7',
  };
  return '<div style="display:flex;flex-wrap:nowrap;gap:4px;overflow:hidden">'
    + partners.map(function(p) {
        var dot = dots[p] || '#8E8E93';
        return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500;color:var(--text);padding:2px 7px 2px 5px;border-radius:999px;border:1px solid var(--border);background:#f3f4f6;white-space:nowrap">'
          + '<span style="width:5px;height:5px;border-radius:50%;background:' + dot + ';flex-shrink:0"></span>'
          + p
          + '</span>';
      }).join('')
    + '</div>';
}

// ── Pacing bar ────────────────────────────────────────────────────────────────
function cmPacingBar(pct, status) {
  var color = status === 'failed'      ? '#ef4444'
            : status === 'underpacing' ? '#f59e0b'
            : status === 'draft'       ? 'var(--border-md)'
            : '#16a34a';
  var trackColor = status === 'draft'  ? 'var(--border)' : 'var(--border)';
  var w = Math.max(0, Math.min(100, pct));
  var label = status === 'draft' ? '—' : pct + '%';
  return '<div style="display:flex;align-items:center;gap:8px">'
    + '<div style="flex:1;height:5px;border-radius:99px;background:' + trackColor + ';overflow:hidden;min-width:40px">'
    +   '<div style="height:100%;width:' + w + '%;background:' + color + ';border-radius:99px"></div>'
    + '</div>'
    + '<span style="font-size:10px;color:var(--faint);min-width:28px;text-align:right">' + label + '</span>'
    + '</div>';
}

// ── Search ────────────────────────────────────────────────────────────────────
function cmApplySearch(val) {
  cmSearch = val;
  _cmRefreshTable();
}

function cmFilteredRows() {
  return CM_CAMPAIGNS.filter(function(c) {
    if (!cmSearch) return true;
    var q = cmSearch.toLowerCase();
    return c.name.toLowerCase().indexOf(q) >= 0
        || c.advertiser.toLowerCase().indexOf(q) >= 0
        || c.geography.join(' ').toLowerCase().indexOf(q) >= 0;
  });
}

function _cmRefreshTable() {
  var tbody = document.getElementById('cm-tbody');
  if (tbody) tbody.innerHTML = _cmRowsHtml();
  var count = document.getElementById('cm-count');
  if (count) count.textContent = cmFilteredRows().length;
}

// ── Rows ──────────────────────────────────────────────────────────────────────
function _cmRowsHtml() {
  var rows = cmFilteredRows();
  if (!rows.length) {
    return '<tr><td colspan="15" style="padding:40px;text-align:center;color:var(--faint);font-size:13px">No campaigns match your search.</td></tr>';
  }

  return rows.map(function(c) {
    var nameCell = '<div style="font-weight:600;font-size:12px;color:var(--text)">' + c.name + '</div>';
    var geoCell = '<span style="font-size:12px;color:var(--muted)">' + c.geography.join(', ') + '</span>';

    var pdata = c.dbId ? CM_PACING[c.dbId] : null;
    var delivered = pdata ? pdata.delivered : (c.impressions || '—');
    var spent     = pdata ? pdata.spent     : (c.spent || '—');

    var imp = '<div style="font-size:12px;font-weight:600;color:var(--text)">' + delivered + '</div>'
      + (c.goal !== '—' ? '<div style="font-size:10px;color:var(--faint);margin-top:2px">' + c.goal + '</div>' : '');

    var budget = '<div style="font-size:12px;font-weight:600;color:var(--text)">' + spent + '</div>'
      + (c.budget !== '—' ? '<div style="font-size:10px;color:var(--faint);margin-top:2px">' + c.budget + '</div>' : '');

    var dates = '<div style="font-size:11px;color:var(--text);white-space:nowrap">' + c.start + '</div>'
      + '<div style="font-size:11px;color:var(--faint);margin-top:1px;white-space:nowrap">' + c.end + '</div>';

    var mkIcon = function(path, title, onclick) {
      return UI.btnIcon(onclick || '', title, '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>');
    };

    var creativesCell = c.status === 'draft'
      ? '<button onclick="cmOpenAddCreativesModal()" style="border:none;background:none;padding:0;font-size:11px;font-weight:500;color:var(--accent);cursor:pointer;font-family:inherit;white-space:nowrap">+ Add Creatives</button>'
      : c.creatives === 0
      ? '<span style="font-size:11px;color:var(--faint)">—</span>'
      : '<div style="display:flex;align-items:center;gap:6px">'
        + '<span style="font-size:12px;color:var(--text)">' + c.creatives + ' creative' + (c.creatives !== 1 ? 's' : '') + '</span>'
        + mkIcon('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 'Preview in Template Builder', 'event.stopPropagation();csBuilderBackPage=\'campaign-management\';setPage(\'creative-studio\',\'Creative Studio\',true);setTimeout(function(){csBuildTemplates(0)},80)')
        + '</div>';

    var actions = '<div style="display:flex;align-items:center;gap:2px;justify-content:flex-end">'
      + mkIcon('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 'Delete')
      + '</div>';

    var clientCell = '<span style="font-size:12px;color:var(--muted)">' + (c.client || '—') + '</span>';

    var pacingPct  = pdata ? pdata.pacing : c.pacing;
    var pacingCell = pacingPct === null || pacingPct === undefined
      ? '<span style="color:var(--faint);font-size:12px">—</span>'
      : cmPacingBar(pacingPct, c.status);

    return UI.tr([
      nameCell,
      clientCell,
      '<span style="font-size:12px;color:var(--text)">' + c.advertiser + '</span>',
      geoCell,
      dates,
      cmStatusChip(c.status),
      pacingCell,
      c.status === 'draft'
        ? '<button onclick="" style="border:none;background:none;padding:0;font-size:11px;font-weight:500;color:var(--accent);cursor:pointer;font-family:inherit;white-space:nowrap">+ Add Partner</button>'
        : cmPartnerBadges(c.partners),
      imp,
      budget,
      creativesCell,
      c.status === 'draft'
        ? '<button onclick="" style="border:none;background:none;padding:0;font-size:11px;font-weight:500;color:var(--accent);cursor:pointer;font-family:inherit;white-space:nowrap">+ Add Media Plan</button>'
        : '<span style="font-size:12px;color:var(--text)">' + c.moments + ' moment' + (c.moments !== 1 ? 's' : '') + '</span>',
      '<span style="font-size:12px;color:var(--muted)">' + (c.createdBy || '—') + '</span>',
      '<span style="font-size:12px;color:var(--muted)">' + (c.createdOn || '—') + '</span>',
      actions,
    ], { onclick: 'cmOpenDetail(\'' + c.id + '\')' });
  }).join('');
}

// ── Main render ───────────────────────────────────────────────────────────────
function renderCampaignManagement() {
  // Kick off DB fetch — will refresh table when data arrives
  setTimeout(cmLoadFromDB, 0);

  var newCampBtn =
    '<button style="height:30px;padding:0 14px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">'
    + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    + 'New Campaign</button>';

  var searchBox =
    '<div style="padding:12px 20px;border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-search', 'Search campaigns…', 'cmApplySearch(this.value)')
    + '</div>';

  var cols = [
    { label: 'Campaign',    width:'260px'  },
    { label: 'Client',      width:'120px' },
    { label: 'Advertiser',  width:'130px' },
    { label: 'Geo',         width:'80px'  },
    { label: 'Flight Dates',width:'115px' },
    { label: 'Status',      width:'120px' },
    { label: 'Pacing',      width:'110px' },
    { label: 'Partner',     width:'170px' },
    { label: 'Imp. Goal',   width:'110px' },
    { label: 'Budget',      width:'120px' },
    { label: 'Creatives',   width:'150px' },
    { label: 'Media Plan',  width:'160px' },
    { label: 'Created By',  width:'140px' },
    { label: 'Created On',  width:'110px' },
    { label: '',            width:'80px',  align:'right' },
  ];

  var tableHtml = UI.tableScroll(cols, _cmRowsHtml(), 'cm-tbody', 1, null, { inCard: true });

  var card =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)">'
    +   '<div>'
    +     '<div style="font-size:13px;font-weight:600;color:var(--text)">Campaigns</div>'
    +     '<div style="font-size:11px;color:var(--faint);margin-top:1px"><span id="cm-count">' + CM_CAMPAIGNS.length + '</span> campaigns total</div>'
    +   '</div>'
    +   newCampBtn
    + '</div>'
    + searchBox
    + tableHtml
    + '</div>';

  return UI.pageHeader({ title: 'Campaign Management', subtitle: 'Monitor and manage all active campaigns' })
    + card;
}

// ── Campaign detail ───────────────────────────────────────────────────────────
function cmOpenDetail(id, noPush) {
  var c = CM_CAMPAIGNS.filter(function(x){ return x.id === id; })[0];
  if (!c) return;
  _cmOpenDetailId = id;
  var body = document.getElementById('content');
  if (!body) return;
  // Reset draft creatives state when opening a draft detail
  if (c.status === 'draft') {
    _cmDraftCreatives = [];
    _cmLibSearch = '';
    _cmMomentMode = null;
    _cmSavedPlanId = null;
    _cmMomentsSearchQuery = '';
  }
  try {
    body.innerHTML = c.status === 'draft' ? _cmDraftDetail(c) : _cmPacingDetail(c);
    if (!noPush) {
      var slug = c.status === 'draft' ? 'draft-campaign' : 'pacing-campaign';
      history.pushState({ id: 'campaign-management', label: 'Campaign Management', cmCampaignId: id }, '', '/campaign-management/' + slug + '/' + id);
    }
  } catch(e) {
    body.innerHTML = '<div style="padding:40px;color:red;font-size:13px">Error: ' + e.message + '</div>';
  }
}


// ── Pacing detail ─────────────────────────────────────────────────────────────
function _cmPacingDetail(c) {
  var pacingColor = c.status === 'underpacing' ? '#f59e0b' : c.status === 'failed' ? '#ef4444' : '#16a34a';

  // Pull live pacing data from mock API (keyed by DB campaign ID)
  var pdata = c.dbId ? CM_PACING[c.dbId] : null;
  var delivered = pdata ? pdata.delivered : (c.impressions || '—');
  var spent     = pdata ? pdata.spent     : (c.spent || '—');
  var pacingPct = (pdata && pdata.pacing != null) ? pdata.pacing : c.pacing;

  // Days remaining: calculate from c.end if parseable, else mock
  var daysLeft = '—';
  try {
    var endDate = new Date(c.end);
    if (!isNaN(endDate)) {
      var diff = Math.ceil((endDate - Date.now()) / 86400000);
      daysLeft = diff > 0 ? diff : 0;
    }
  } catch(e) {}

  // KPI card helper — no individual border (they live inside the outer card)
  function kpi(label, value, sub, accent) {
    return '<div style="flex:1;padding:20px;border-right:1px solid var(--border)">'
      + '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:8px">' + label + '</div>'
      + '<div style="font-size:22px;font-weight:700;color:' + (accent || 'var(--text)') + ';line-height:1">' + value + '</div>'
      + (sub ? '<div style="font-size:11px;color:var(--faint);margin-top:5px">' + sub + '</div>' : '')
      + '</div>';
  }

  // Expected pacing % = how far through the flight we are (mock: 65%)
  var expectedPct = 65;
  var pacingLabel = (pacingPct != null) ? pacingPct + '%' : '—';

  // Single card wrapping scorecards + delivery progress
  var perfCard =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px">'
    // ── Header ──
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">'
    +   '<span style="font-size:13px;font-weight:600;color:var(--text)">Performance</span>'
    +   cmStatusChip(c.status)
    + '</div>'
    // ── KPI row ──
    + '<div style="display:flex;border-bottom:1px solid var(--border)">'
    +   kpi('Impressions Delivered', delivered, 'Goal: ' + (c.goal || '—'))
    +   kpi('Budget Spent', spent, 'of ' + (c.budget || '—'))
    +   kpi('Pacing', pacingLabel, 'Expected: ' + expectedPct + '%', pacingColor)
    +   '<div style="flex:1;padding:20px">'
    +     '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:8px">Days Remaining</div>'
    +     '<div style="font-size:22px;font-weight:700;color:var(--text);line-height:1">' + daysLeft + '</div>'
    +     '<div style="font-size:11px;color:var(--faint);margin-top:5px">' + (c.start || '—') + ' → ' + (c.end || '—') + '</div>'
    +   '</div>'
    + '</div>'
    // ── Delivery progress bar ──
    + '<div style="padding:20px">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +     '<span style="font-size:12px;font-weight:600;color:var(--text)">Delivery Progress</span>'
    +     '<span style="font-size:11px;color:var(--muted)">Expected: ' + expectedPct + '% · Actual: ' + pacingLabel + '</span>'
    +   '</div>'
    +   '<div style="position:relative;height:8px;border-radius:99px;background:var(--border)">'
    +     '<div style="position:absolute;left:0;top:0;height:100%;width:' + (pacingPct || 0) + '%;background:' + pacingColor + ';border-radius:99px;transition:width .4s"></div>'
    +     '<div style="position:absolute;left:' + expectedPct + '%;top:-4px;width:2px;height:16px;background:var(--muted);border-radius:2px"></div>'
    +   '</div>'
    +   '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--faint);margin-top:6px">'
    +     '<span>' + (c.start || '') + '</span>'
    +     '<span>' + (c.end || '') + '</span>'
    +   '</div>'
    + '</div>'
    + '</div>';

  return UI.pageHeader({
      breadcrumb: [
        { label: 'Campaign Management', onclick: 'setPage(\'campaign-management\',\'Campaign Management\')' },
        { label: c.name }
      ],
      title: c.name,
      subtitle: (c.client ? c.client + ' · ' : '') + c.advertiser + ' · ' + c.geography.join(', '),
      titleRight: cmStatusChip(c.status),
    })
    + perfCard;
}

// ── Draft detail — form helpers ───────────────────────────────────────────────

var CM_GEO_OPTIONS = [
  {code:'US',    label:'United States'},
  {code:'CA',    label:'Canada'},
  {code:'EU',    label:'Europe'},
  {code:'UK',    label:'United Kingdom'},
  {code:'AU',    label:'Australia'},
  {code:'MX',    label:'Mexico'},
  {code:'BR',    label:'Brazil'},
  {code:'APAC',  label:'Asia Pacific'},
  {code:'LATAM', label:'Latin America'},
  {code:'MENA',  label:'Middle East & Africa'},
];

// Shared state for the draft form currently open
var _cmDraftGeo   = [];
var _cmDraftAdv   = '';
var _cmDraftFlight = { start:'', end:'' };

function _cmGeoTriggerText() {
  return _cmDraftGeo.length ? _cmDraftGeo.join(', ') : '';
}

function cmDraftGeoToggle(e) {
  if (e) e.stopPropagation();
  var panel = document.getElementById('cm-draft-geo-panel');
  var btn   = document.getElementById('cm-draft-geo-btn');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  if (open) { panel.style.display = 'none'; if (btn) btn.style.borderColor = 'var(--border-md)'; return; }
  _cmBuildGeoList('');
  var rect = btn.getBoundingClientRect();
  panel.style.cssText = 'display:block;position:fixed;z-index:9999;width:' + Math.max(rect.width,200) + 'px;left:' + rect.left + 'px;top:' + (rect.bottom+4) + 'px;background:var(--surface);border:1px solid var(--border-md);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);overflow:hidden';
  if (btn) btn.style.borderColor = 'var(--accent)';
  setTimeout(function() {
    var si = document.getElementById('cm-draft-geo-search');
    if (si) si.focus();
    document.addEventListener('click', function _h(ev) {
      var p = document.getElementById('cm-draft-geo-panel');
      var b = document.getElementById('cm-draft-geo-btn');
      if (p && !p.contains(ev.target) && b && !b.contains(ev.target)) {
        p.style.display = 'none'; if (b) b.style.borderColor = 'var(--border-md)';
        document.removeEventListener('click', _h);
      }
    });
  }, 0);
}

function _cmBuildGeoList(q) {
  var list = document.getElementById('cm-draft-geo-list');
  if (!list) return;
  q = (q||'').toLowerCase();
  list.innerHTML = CM_GEO_OPTIONS.filter(function(o){ return !q || o.label.toLowerCase().indexOf(q)>=0 || o.code.toLowerCase().indexOf(q)>=0; }).map(function(o) {
    var sel = _cmDraftGeo.indexOf(o.code) >= 0;
    return '<div onclick="cmDraftGeoPick(\'' + o.code + '\')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (sel?'var(--accent)':'var(--border-md)') + ';background:' + (sel?'var(--accent)':'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (sel ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span>' + o.code + '</span><span style="color:var(--faint);font-size:11px">' + o.label + '</span>'
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No results</div>';
}

function cmDraftGeoPick(code) {
  var idx = _cmDraftGeo.indexOf(code);
  if (idx >= 0) _cmDraftGeo.splice(idx, 1); else _cmDraftGeo.push(code);
  _cmBuildGeoList(document.getElementById('cm-draft-geo-search') ? document.getElementById('cm-draft-geo-search').value : '');
  var lbl = document.getElementById('cm-draft-geo-lbl');
  if (lbl) { lbl.textContent = _cmGeoTriggerText(); lbl.style.color = _cmDraftGeo.length ? '' : 'var(--faint)'; }
}

function cmDraftAdvToggle(e) {
  if (e) e.stopPropagation();
  var panel = document.getElementById('cm-draft-adv-panel');
  var btn   = document.getElementById('cm-draft-adv-btn');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  if (open) { panel.style.display = 'none'; if (btn) btn.style.borderColor = 'var(--border-md)'; return; }
  _cmBuildAdvList('');
  var rect = btn.getBoundingClientRect();
  panel.style.cssText = 'display:block;position:fixed;z-index:9999;width:' + Math.max(rect.width,200) + 'px;left:' + rect.left + 'px;top:' + (rect.bottom+4) + 'px;background:var(--surface);border:1px solid var(--border-md);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);overflow:hidden';
  if (btn) btn.style.borderColor = 'var(--accent)';
  setTimeout(function() {
    var si = document.getElementById('cm-draft-adv-search');
    if (si) si.focus();
    document.addEventListener('click', function _h(ev) {
      var p = document.getElementById('cm-draft-adv-panel');
      var b = document.getElementById('cm-draft-adv-btn');
      if (p && !p.contains(ev.target) && b && !b.contains(ev.target)) {
        p.style.display = 'none'; if (b) b.style.borderColor = 'var(--border-md)';
        document.removeEventListener('click', _h);
      }
    });
  }, 0);
}

function _cmBuildAdvList(q) {
  var list = document.getElementById('cm-draft-adv-list');
  if (!list) return;
  q = (q||'').toLowerCase();
  var advs = typeof APP_ADVERTISERS !== 'undefined' ? APP_ADVERTISERS : [];
  list.innerHTML = advs.filter(function(a){ return !q || a.name.toLowerCase().indexOf(q)>=0; }).map(function(a) {
    var sel = _cmDraftAdv === a.name;
    return '<div onclick="cmDraftAdvPick(\'' + a.name.replace(/'/g,"\\'") + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;font-weight:' + (sel?'600':'400') + '" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<span style="color:var(--text)">' + a.name + '</span>'
      + (sel ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No results</div>';
}

function cmDraftAdvPick(name) {
  _cmDraftAdv = name;
  _cmBuildAdvList(document.getElementById('cm-draft-adv-search') ? document.getElementById('cm-draft-adv-search').value : '');
  var lbl = document.getElementById('cm-draft-adv-lbl');
  if (lbl) { lbl.textContent = name; lbl.style.color = ''; }
  var panel = document.getElementById('cm-draft-adv-panel');
  var btn   = document.getElementById('cm-draft-adv-btn');
  if (panel) panel.style.display = 'none';
  if (btn) btn.style.borderColor = 'var(--border-md)';
}

// ── Flight dates — full calendar picker (same component as Media Planner) ─────
var _cmFlightCal = {
  start: '', end: '',
  viewMonth: new Date().getMonth(),
  viewYear:  new Date().getFullYear()
};

function _cmFlightFmtShort(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function _cmFlightFmtFull(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
}

function _cmFlightDdContent() {
  var p = _cmFlightCal;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  var vm = p.viewMonth, vy = p.viewYear;
  var firstDay    = (new Date(vy, vm, 1).getDay() + 6) % 7;
  var daysInMonth = new Date(vy, vm + 1, 0).getDate();
  var daysInPrev  = new Date(vy, vm, 0).getDate();
  var today  = new Date(); today.setHours(0,0,0,0);
  var startD = p.start ? new Date(p.start + 'T00:00:00') : null;
  var endD   = p.end   ? new Date(p.end   + 'T00:00:00') : null;
  function ds(y,m,d){ return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0'); }
  var NBTN = 'background:none;border:none;cursor:pointer;font-size:18px;color:var(--muted);padding:2px 8px;border-radius:5px;line-height:1';
  var html = '<div style="width:270px">';

  // Status bar
  if (!p.start) {
    html += '<div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:10px;padding:6px 10px;background:var(--bg);border-radius:6px">Select a start date</div>';
  } else if (!p.end) {
    html += '<div style="font-size:11px;color:#e11d8f;font-weight:500;text-align:center;margin-bottom:10px;padding:6px 10px;background:#fdf2f8;border-radius:6px">'
      + _cmFlightFmtShort(p.start) + ' → now pick end date</div>';
  } else {
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:6px 10px;background:#fdf2f8;border-radius:6px">'
      + '<span style="font-size:11px;color:#e11d8f;font-weight:500">' + _cmFlightFmtShort(p.start) + ' – ' + _cmFlightFmtShort(p.end) + '</span>'
      + '<span onclick="event.stopPropagation();_cmFlightCal.start=\'\';_cmFlightCal.end=\'\';_cmFlightUpdateLbl();var dd=document.getElementById(\'cm-flight-dd\');if(dd)dd.innerHTML=_cmFlightDdContent()" style="font-size:11px;color:var(--muted);cursor:pointer;padding:1px 5px;border-radius:4px;border:1px solid var(--border)">Clear</span>'
      + '</div>';
  }

  // Nav
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
    + '<button style="' + NBTN + '" onclick="event.stopPropagation();_cmFlightCalNav(-1)">‹</button>'
    + '<span style="font-size:13px;font-weight:600;color:var(--text)">' + MONTHS[vm] + ' ' + vy + '</span>'
    + '<button style="' + NBTN + '" onclick="event.stopPropagation();_cmFlightCalNav(1)">›</button>'
    + '</div>';

  // Day headers
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:2px">';
  DAYS.forEach(function(d){ html += '<div style="text-align:center;font-size:10px;font-weight:500;color:var(--faint);padding:3px 0">' + d + '</div>'; });
  html += '</div>';

  // Day grid
  html += '<div style="display:grid;grid-template-columns:repeat(7,1fr)">';
  function renderCell(dayNum, dStr, active) {
    if (!active) { html += '<div style="height:34px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--faint)">' + dayNum + '</div>'; return; }
    var cellD  = new Date(dStr + 'T00:00:00');
    var isSt   = p.start === dStr, isEn = p.end === dStr;
    var inRng  = startD && endD && cellD > startD && cellD < endD;
    var isTdy  = cellD.getTime() === today.getTime();
    var wrapBg = inRng ? '#fdf2f8' : (isSt && endD) ? 'linear-gradient(to right,transparent 50%,#fdf2f8 50%)' : (isEn && startD) ? 'linear-gradient(to left,transparent 50%,#fdf2f8 50%)' : 'transparent';
    var innerBg  = (isSt || isEn) ? '#e11d8f' : 'transparent';
    var innerCol = (isSt || isEn) ? '#fff' : isTdy ? '#e11d8f' : 'var(--text)';
    var fw       = (isTdy && !isSt && !isEn) ? '700' : '400';
    html += '<div style="background:' + wrapBg + ';padding:2px 0">'
      + '<div onclick="event.stopPropagation();_cmFlightCalPick(\'' + dStr + '\')" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;cursor:pointer;border-radius:50%;background:' + innerBg + ';color:' + innerCol + ';font-weight:' + fw + ';margin:0 auto">' + dayNum + '</div>'
      + '</div>';
  }
  for (var i = 0; i < firstDay; i++) renderCell(daysInPrev - firstDay + 1 + i, '', false);
  for (var d2 = 1; d2 <= daysInMonth; d2++) renderCell(d2, ds(vy, vm, d2), true);
  var rem = (firstDay + daysInMonth) % 7;
  if (rem > 0) for (var j = 1; j <= 7 - rem; j++) renderCell(j, '', false);
  html += '</div></div>';

  // OK
  html += '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">'
    + '<button onclick="document.getElementById(\'cm-flight-dd\').remove()" style="width:100%;height:30px;border-radius:7px;border:1px solid var(--border-md);background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>';
  return html;
}

function _cmFlightCalNav(dir) {
  _cmFlightCal.viewMonth += dir;
  if (_cmFlightCal.viewMonth < 0)  { _cmFlightCal.viewMonth = 11; _cmFlightCal.viewYear--; }
  if (_cmFlightCal.viewMonth > 11) { _cmFlightCal.viewMonth = 0;  _cmFlightCal.viewYear++; }
  var dd = document.getElementById('cm-flight-dd');
  if (dd) dd.innerHTML = _cmFlightDdContent();
}

function _cmFlightCalPick(dStr) {
  var p = _cmFlightCal;
  if (!p.start || (p.start && p.end)) { p.start = dStr; p.end = ''; }
  else if (dStr < p.start)  { p.end = p.start; p.start = dStr; }
  else if (dStr === p.start) { p.start = ''; p.end = ''; }
  else                       { p.end = dStr; }
  _cmFlightUpdateLbl();
  var dd = document.getElementById('cm-flight-dd');
  if (dd) dd.innerHTML = _cmFlightDdContent();
}

function _cmFlightUpdateLbl() {
  var p = _cmFlightCal;
  var lbl = document.getElementById('cm-draft-flight-lbl');
  if (!lbl) return;
  if (p.start && p.end) {
    lbl.textContent = _cmFlightFmtFull(p.start) + ' → ' + _cmFlightFmtFull(p.end);
    lbl.style.color = '';
    // Also sync back to _cmDraftFlight for form state
    _cmDraftFlight.start = lbl.textContent.split(' → ')[0];
    _cmDraftFlight.end   = lbl.textContent.split(' → ')[1];
  } else {
    lbl.textContent = 'Set flight dates';
    lbl.style.color = 'var(--faint)';
  }
}

function cmDraftFlightOpen(el) {
  var existing = document.getElementById('cm-flight-dd');
  if (existing) { existing.remove(); return; }

  // Sync state from current campaign flight dates
  var months = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  function toISO(label) {
    if (!label) return '';
    var parts = label.trim().split(' ');
    if (parts.length === 3) return parts[2]+'-'+(months[parts[1]]||'01')+'-'+parts[0].padStart(2,'0');
    return '';
  }
  _cmFlightCal.start = toISO(_cmDraftFlight.start);
  _cmFlightCal.end   = toISO(_cmDraftFlight.end);
  if (!_cmFlightCal.start) {
    _cmFlightCal.viewMonth = new Date().getMonth();
    _cmFlightCal.viewYear  = new Date().getFullYear();
  } else {
    var d = new Date(_cmFlightCal.start + 'T00:00:00');
    _cmFlightCal.viewMonth = d.getMonth();
    _cmFlightCal.viewYear  = d.getFullYear();
  }

  var dd = document.createElement('div');
  dd.id = 'cm-flight-dd';
  dd.style.cssText = 'position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border-md);border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.14);padding:14px;width:294px;box-sizing:border-box';
  dd.innerHTML = _cmFlightDdContent();
  document.body.appendChild(dd);

  var rect = el.getBoundingClientRect();
  var vw = window.innerWidth, vh = window.innerHeight, GAP = 6;
  var ddH = dd.scrollHeight, ddW = 294;
  var top  = rect.bottom + GAP + ddH <= vh - 8 ? rect.bottom + GAP : rect.top - GAP - ddH;
  var left = Math.min(rect.left, vw - ddW - 8);
  dd.style.top  = Math.max(8, top) + 'px';
  dd.style.left = Math.max(8, left) + 'px';

  setTimeout(function() {
    document.addEventListener('mousedown', function _h(e) {
      var d2 = document.getElementById('cm-flight-dd');
      if (d2 && !d2.contains(e.target) && e.target !== el && !el.contains(e.target)) {
        d2.remove(); document.removeEventListener('mousedown', _h);
      }
    });
  }, 0);
}

function _cmSearchablePanel(searchId, listId, buildFn) {
  return '<div style="padding:7px 8px;border-bottom:1px solid var(--border)">'
    + '<input id="' + searchId + '" type="text" placeholder="Search…" oninput="' + buildFn + '(this.value)" onclick="event.stopPropagation()" '
    + 'style="width:100%;height:28px;border:1px solid var(--border-md);border-radius:6px;padding:0 8px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box">'
    + '</div>'
    + '<div id="' + listId + '" style="max-height:180px;overflow-y:auto;padding:4px"></div>';
}

var _CS_TRIG = 'width:100%;box-sizing:border-box;height:36px;padding:0 32px 0 10px;font-size:12px;border:1px solid var(--border-md);border-radius:7px;background:var(--surface);color:var(--text);font-family:inherit;cursor:pointer;text-align:left;display:flex;align-items:center;position:relative;transition:border-color .15s;outline:none';
var _CS_ARW  = '<svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none"><path d="M1 1l4 4 4-4" stroke="#A8A8A0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ── Additional Details state ──────────────────────────────────────────────────
var _cmDraftAddl = {
  budget:    { min:0, max:1000000, exact:'', noBudget:false },
  impr:      { min:0, max:10000000, exact:'', noEstimate:false },
  channels:  [],
  type:      [],
  safety:    [],
  matchScore:[]
};

// ── Inject dual-range slider CSS once ─────────────────────────────────────────
function _cmInjectDualRange() {
  if (document.getElementById('cm-dual-range-css')) return;
  var s = document.createElement('style');
  s.id = 'cm-dual-range-css';
  s.textContent =
    '.cm-dual-range{position:relative;height:28px}'
    + '.cm-dual-range input[type=range]{position:absolute;inset:0;width:100%;appearance:none;-webkit-appearance:none;background:transparent;margin:0;pointer-events:none}'
    + '.cm-dual-range input[type=range]::-webkit-slider-thumb{pointer-events:all;-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.22);margin-top:-6px}'
    + '.cm-dual-range input[type=range]::-moz-range-thumb{pointer-events:all;width:14px;height:14px;border-radius:50%;background:var(--accent);cursor:pointer;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.22)}'
    + '.cm-dual-range input[type=range]::-webkit-slider-runnable-track{height:2px;background:transparent}'
    + '.cm-dual-range input[type=range]::-moz-range-track{height:2px;background:transparent}'
    + '.cm-addl-inp{width:100%;box-sizing:border-box;height:34px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:12px;font-family:inherit;outline:none}'
    + '.cm-addl-inp:focus{border-color:var(--accent)}';
  document.head.appendChild(s);
}

// Generic opener for additional detail pickers
function _cmAddlOpen(id, buildFn, el) {
  _cmInjectDualRange();
  var existing = document.getElementById(id);
  if (existing) { existing.remove(); return; }
  var dd = document.createElement('div');
  dd.id = id;
  dd.style.cssText = 'position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border-md);border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.14);padding:14px;width:280px;box-sizing:border-box;font-family:inherit';
  dd.innerHTML = buildFn();
  document.body.appendChild(dd);
  var rect = el.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, GAP = 6;
  var ddH = dd.scrollHeight, ddW = 280;
  var top  = rect.bottom + GAP + ddH <= vh - 8 ? rect.bottom + GAP : rect.top - GAP - ddH;
  var left = Math.min(rect.left, vw - ddW - 8);
  dd.style.top = Math.max(8, top) + 'px'; dd.style.left = Math.max(8, left) + 'px';
  setTimeout(function() {
    document.addEventListener('mousedown', function _h(e) {
      var d2 = document.getElementById(id);
      if (d2 && !d2.contains(e.target) && !el.contains(e.target)) { d2.remove(); document.removeEventListener('mousedown', _h); }
    });
  }, 0);
}

function _cmAddlOkBtn(id) {
  return '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:10px">'
    + '<button onclick="document.getElementById(\'' + id + '\').remove()" style="width:100%;height:30px;border-radius:7px;border:1px solid var(--border-md);background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>';
}

// ── Budget picker ─────────────────────────────────────────────────────────────
var _CM_BDG_MAX = 1000000;
function _cmBudgetContent() {
  var p = _cmDraftAddl.budget;
  var minPct = p.min / _CM_BDG_MAX * 100, maxPct = p.max / _CM_BDG_MAX * 100;
  var dis = p.noBudget ? 'opacity:.35;pointer-events:none;' : '';
  return '<div style="' + dis + '">'
    + '<div style="position:relative;height:4px;background:var(--border);border-radius:2px;margin-bottom:0">'
    +   '<div id="cm-bdg-track" style="position:absolute;height:100%;border-radius:2px;background:linear-gradient(90deg,#e11d8f,#f43f5e);left:' + minPct + '%;right:' + (100-maxPct) + '%"></div>'
    + '</div>'
    + '<div class="cm-dual-range" style="margin-bottom:4px">'
    +   '<input type="range" min="0" max="' + _CM_BDG_MAX + '" step="10000" value="' + p.min + '" oninput="cmBdgSlide(\'min\',this.value)">'
    +   '<input type="range" min="0" max="' + _CM_BDG_MAX + '" step="10000" value="' + p.max + '" oninput="cmBdgSlide(\'max\',this.value)">'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:10px">'
    +   '<span id="cm-bdg-min-lbl">$' + Number(p.min).toLocaleString() + '</span>'
    +   '<span id="cm-bdg-max-lbl">$' + Number(p.max).toLocaleString() + '</span>'
    + '</div>'
    + '<input type="number" class="cm-addl-inp" placeholder="Or enter exact budget…" value="' + (p.exact||'') + '" oninput="cmBdgExact(this.value)">'
    + '</div>'
    + '<label style="display:flex;align-items:center;gap:7px;margin-top:10px;cursor:pointer;font-size:12px;color:var(--muted);user-select:none">'
    +   '<input type="checkbox"' + (p.noBudget?' checked':'') + ' style="accent-color:#e11d8f;width:13px;height:13px" onchange="_cmDraftAddl.budget.noBudget=this.checked;_cmAddlUpdateLbl(\'cm-draft-budget-lbl\',cmBdgLabel());var dd=document.getElementById(\'cm-addl-budget-dd\');if(dd)dd.innerHTML=_cmBudgetContent()">'
    +   "I don't have a budget"
    + '</label>'
    + _cmAddlOkBtn('cm-addl-budget-dd');
}
function cmBdgSlide(which, val) {
  val = parseInt(val)||0;
  var p = _cmDraftAddl.budget;
  if (which==='min') { p.min = Math.min(val, p.max); document.getElementById('cm-bdg-min-lbl').textContent='$'+Number(p.min).toLocaleString(); }
  else { p.max = Math.max(val, p.min); document.getElementById('cm-bdg-max-lbl').textContent='$'+Number(p.max).toLocaleString(); }
  p.exact='';
  var t=document.getElementById('cm-bdg-track'); if(t){t.style.left=(p.min/_CM_BDG_MAX*100)+'%';t.style.right=((1-p.max/_CM_BDG_MAX)*100)+'%';}
  _cmAddlUpdateLbl('cm-draft-budget-lbl', cmBdgLabel());
}
function cmBdgExact(val) {
  val=Math.min(Math.max(parseInt(val)||0,0),_CM_BDG_MAX);
  var p=_cmDraftAddl.budget; p.exact=val; p.min=val; p.max=val;
  var t=document.getElementById('cm-bdg-track'); if(t){var pct=val/_CM_BDG_MAX*100;t.style.left=pct+'%';t.style.right=(100-pct)+'%';}
  _cmAddlUpdateLbl('cm-draft-budget-lbl', cmBdgLabel());
}
function cmBdgLabel() {
  var p=_cmDraftAddl.budget;
  if (p.noBudget) return "I don't have a budget";
  if (p.exact) return '$'+Number(p.exact).toLocaleString();
  if (p.min===0 && p.max===_CM_BDG_MAX) return 'Any';
  return '$'+Number(p.min).toLocaleString()+' – $'+Number(p.max).toLocaleString();
}

// ── Impressions/day picker ────────────────────────────────────────────────────
var _CM_IMP_MAX = 10000000;
function _cmFmtImp(n) { return n>=1000000?(n/1000000).toFixed(n%1000000===0?0:1)+'M':n>=1000?Math.round(n/1000)+'K':String(n); }
function _cmImprContent() {
  var p = _cmDraftAddl.impr;
  var minPct = p.min/_CM_IMP_MAX*100, maxPct = p.max/_CM_IMP_MAX*100;
  var dis = p.noEstimate ? 'opacity:.35;pointer-events:none;' : '';
  return '<div style="' + dis + '">'
    + '<div style="position:relative;height:4px;background:var(--border);border-radius:2px">'
    +   '<div id="cm-imp-track" style="position:absolute;height:100%;border-radius:2px;background:linear-gradient(90deg,#e11d8f,#f43f5e);left:' + minPct + '%;right:' + (100-maxPct) + '%"></div>'
    + '</div>'
    + '<div class="cm-dual-range" style="margin-bottom:4px">'
    +   '<input type="range" min="0" max="' + _CM_IMP_MAX + '" step="100000" value="' + p.min + '" oninput="cmImprSlide(\'min\',this.value)">'
    +   '<input type="range" min="0" max="' + _CM_IMP_MAX + '" step="100000" value="' + p.max + '" oninput="cmImprSlide(\'max\',this.value)">'
    + '</div>'
    + '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:10px">'
    +   '<span id="cm-imp-min-lbl">' + _cmFmtImp(p.min) + '</span>'
    +   '<span id="cm-imp-max-lbl">' + _cmFmtImp(p.max) + '</span>'
    + '</div>'
    + '<input type="number" class="cm-addl-inp" placeholder="Or enter exact impressions…" value="' + (p.exact||'') + '" oninput="cmImprExact(this.value)">'
    + '</div>'
    + '<label style="display:flex;align-items:center;gap:7px;margin-top:10px;cursor:pointer;font-size:12px;color:var(--muted);user-select:none">'
    +   '<input type="checkbox"' + (p.noEstimate?' checked':'') + ' style="accent-color:#e11d8f;width:13px;height:13px" onchange="_cmDraftAddl.impr.noEstimate=this.checked;_cmAddlUpdateLbl(\'cm-draft-impr-lbl\',cmImprLabel());var dd=document.getElementById(\'cm-addl-impr-dd\');if(dd)dd.innerHTML=_cmImprContent()">'
    +   'No estimate impressions'
    + '</label>'
    + _cmAddlOkBtn('cm-addl-impr-dd');
}
function cmImprSlide(which, val) {
  val=parseInt(val)||0;
  var p=_cmDraftAddl.impr;
  if (which==='min') { p.min=Math.min(val,p.max); var l=document.getElementById('cm-imp-min-lbl'); if(l)l.textContent=_cmFmtImp(p.min); }
  else { p.max=Math.max(val,p.min); var l2=document.getElementById('cm-imp-max-lbl'); if(l2)l2.textContent=_cmFmtImp(p.max); }
  p.exact='';
  var t=document.getElementById('cm-imp-track'); if(t){t.style.left=(p.min/_CM_IMP_MAX*100)+'%';t.style.right=((1-p.max/_CM_IMP_MAX)*100)+'%';}
  _cmAddlUpdateLbl('cm-draft-impr-lbl', cmImprLabel());
}
function cmImprExact(val) {
  val=Math.min(Math.max(parseInt(val)||0,0),_CM_IMP_MAX);
  var p=_cmDraftAddl.impr; p.exact=val; p.min=val; p.max=val;
  var t=document.getElementById('cm-imp-track'); if(t){var pct=val/_CM_IMP_MAX*100;t.style.left=pct+'%';t.style.right=(100-pct)+'%';}
  _cmAddlUpdateLbl('cm-draft-impr-lbl', cmImprLabel());
}
function cmImprLabel() {
  var p=_cmDraftAddl.impr;
  if (p.noEstimate) return 'No estimate';
  if (p.exact) return _cmFmtImp(p.exact)+'/day';
  if (p.min===0 && p.max===_CM_IMP_MAX) return 'Any';
  return _cmFmtImp(p.min)+' – '+_cmFmtImp(p.max)+'/day';
}

// ── Generic checkbox picker (Channels, Type, Safety, MatchScore) ───────────────
function _cmCheckboxDdContent(ddId, items, stateKey, hasSearch) {
  var state = _cmDraftAddl[stateKey];
  var html = '';
  if (hasSearch) {
    html += '<div style="padding-bottom:8px;border-bottom:1px solid var(--border);margin-bottom:6px">'
      + '<input type="text" placeholder="Search…" oninput="_cmCheckboxSearch(this.value,\'' + ddId + '\',\'' + stateKey + '\')" '
      + 'style="width:100%;box-sizing:border-box;height:28px;border:1px solid var(--border-md);border-radius:6px;padding:0 8px;font-size:11px;font-family:inherit;outline:none;background:var(--surface);color:var(--text)">'
      + '</div>';
  }
  html += '<div id="' + ddId + '-list">' + _cmCheckboxList(items, state, ddId, stateKey) + '</div>';
  html += _cmAddlOkBtn(ddId);
  return html;
}
function _cmCheckboxList(items, state, ddId, stateKey) {
  return items.map(function(item) {
    var val = item.val || item; var label = item.label || item;
    var sel = state.indexOf(val) >= 0;
    return '<label style="display:flex;align-items:center;gap:9px;padding:7px 2px;font-size:12px;color:var(--text);cursor:pointer;border-bottom:1px solid var(--border);user-select:none" '
      + 'onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
      + '<input type="checkbox"' + (sel?' checked':'') + ' value="' + val + '" style="accent-color:#e11d8f;width:14px;height:14px;flex-shrink:0" '
      + 'onchange="cmCheckboxPick(\'' + stateKey + '\',\'' + val + '\',this.checked,\'' + ddId + '\')">'
      + label
      + '</label>';
  }).join('');
}
function _cmCheckboxSearch(q, ddId, stateKey) {
  var allItems = { channels:['CTV','OLV','Display','Social','Audio'], type:['All','VoD','Livestream','Organic Pause'], safety:['No Restrictions','Alcohol','Violence','Gambling','Drugs','Adult Content','Weapons','Political'], matchScore:['All','High','Standard'] };
  var items = allItems[stateKey] || [];
  q = q.toLowerCase();
  var filtered = items.filter(function(i){ return !q || (i.label||i).toLowerCase().indexOf(q)>=0; });
  var list = document.getElementById(ddId + '-list');
  if (list) list.innerHTML = _cmCheckboxList(filtered, _cmDraftAddl[stateKey], ddId, stateKey);
}
function cmCheckboxPick(stateKey, val, checked, ddId) {
  var state = _cmDraftAddl[stateKey];
  var idx = state.indexOf(val);
  if (checked && idx < 0) state.push(val);
  else if (!checked && idx >= 0) state.splice(idx, 1);
  var lblMap = { channels:'cm-draft-channels-lbl', type:'cm-draft-type-lbl', safety:'cm-draft-safety-lbl', matchScore:'cm-draft-match-lbl' };
  _cmAddlUpdateLbl(lblMap[stateKey], state.length ? state.join(', ') : 'Any');
}
function _cmAddlUpdateLbl(id, text) {
  var el = document.getElementById(id);
  if (el) { el.textContent = text; el.style.color = (text==='Any'||!text) ? 'var(--faint)' : ''; }
}

// ── Draft detail ──────────────────────────────────────────────────────────────
function _cmDraftToggle(idx) {
  var total = 5;
  for (var i = 0; i < total; i++) {
    var p = document.getElementById('cm-draft-panel-' + i);
    var ch = document.getElementById('cm-draft-chev-' + i);
    var hd = document.getElementById('cm-draft-hd-' + i);
    if (!p) continue;
    var opening = (i === idx) && p.style.display === 'none';
    p.style.display = opening ? 'block' : 'none';
    if (ch) ch.style.transform = opening ? 'rotate(180deg)' : '';
    if (hd) hd.style.background = opening ? 'var(--hover)' : '';
  }
}

function _cmDraftDetail(c) {
  // Initialise shared form state from campaign data
  _cmDraftGeo            = c.geography.slice();
  _cmDraftAdv            = c.advertiser;
  _cmDraftFlight.start   = c.start;
  _cmDraftFlight.end     = c.end;

  // ── Campaign Details form panel ──
  var flightLabel = (c.start && c.end) ? c.start + ' → ' + c.end : 'Set flight dates';

  var geoTrigger =
    '<div style="position:relative">'
    + '<button type="button" id="cm-draft-geo-btn" onclick="cmDraftGeoToggle(event)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-geo-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _cmGeoTriggerText() + '</span>'
    +   _CS_ARW
    + '</button>'
    + '<div id="cm-draft-geo-panel" style="display:none">'
    +   _cmSearchablePanel('cm-draft-geo-search','cm-draft-geo-list','_cmBuildGeoList')
    + '</div>'
    + '</div>';

  var advTrigger =
    '<div style="position:relative">'
    + '<button type="button" id="cm-draft-adv-btn" onclick="cmDraftAdvToggle(event)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-adv-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + c.advertiser + '</span>'
    +   _CS_ARW
    + '</button>'
    + '<div id="cm-draft-adv-panel" style="display:none">'
    +   _cmSearchablePanel('cm-draft-adv-search','cm-draft-adv-list','_cmBuildAdvList')
    + '</div>'
    + '</div>';

  var flightTrigger =
    '<button type="button" onclick="cmDraftFlightOpen(this)" style="' + _CS_TRIG + ';justify-content:flex-start;gap:6px">'
    + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
    + '<span id="cm-draft-flight-lbl">' + flightLabel + '</span>'
    + '</button>';

  var LB = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';
  var detailsForm =
    '<div style="padding:20px 24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)">'
    + '<div style="display:grid;grid-template-columns:repeat(9,1fr);gap:16px">'
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Campaign Name</label>' + UI.input('cm-draft-name','text','Campaign name',c.name) + '</div>'
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Advertiser</label>' + advTrigger + '</div>'
    +   '<div style="grid-column:span 1"><label style="' + LB + '">Geography</label>' + geoTrigger + '</div>'
    +   '<div style="grid-column:span 2"><label style="' + LB + '">Flight Dates</label>' + flightTrigger + '</div>'
    // Divider spanning all 9 cols
    +   '<div style="grid-column:span 9;display:flex;align-items:center;gap:12px;margin:4px 0">'
    +     '<div style="flex:1;height:1px;background:var(--border)"></div>'
    +     '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);white-space:nowrap">Additional Details</span>'
    +     '<div style="flex:1;height:1px;background:var(--border)"></div>'
    +   '</div>'
    // Budget
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Budget</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-budget-dd\',_cmBudgetContent,this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-budget-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    // Impr/day
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Impr. / day</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-impr-dd\',_cmImprContent,this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-impr-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    // Preferred Channels
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Pref. Channels</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-channels-dd\',function(){return _cmCheckboxDdContent(\'cm-addl-channels-dd\',[\'CTV\',\'OLV\',\'Display\',\'Social\',\'Audio\'],\'channels\',true)},this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-channels-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    // Type
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Type</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-type-dd\',function(){return _cmCheckboxDdContent(\'cm-addl-type-dd\',[\'All\',\'VoD\',\'Livestream\',\'Organic Pause\'],\'type\',false)},this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-type-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    // Brand Safety
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Brand Safety</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-safety-dd\',function(){return _cmCheckboxDdContent(\'cm-addl-safety-dd\',[\'No Restrictions\',\'Alcohol\',\'Violence\',\'Gambling\',\'Drugs\',\'Adult Content\',\'Weapons\',\'Political\'],\'safety\',false)},this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-safety-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    // Match Score
    +   '<div style="grid-column:span 3"><label style="' + LB + '">Match Score</label>'
    +     '<div style="position:relative">'
    +       '<button type="button" onclick="_cmAddlOpen(\'cm-addl-match-dd\',function(){return _cmCheckboxDdContent(\'cm-addl-match-dd\',[\'All\',\'High\',\'Standard\'],\'matchScore\',false)},this)" style="' + _CS_TRIG + '">'
    +         '<span id="cm-draft-match-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +       '</button>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="margin-top:18px">'
    +   '<button style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Save Changes</button>'
    + '</div>'
    + '</div>';

  var panelContents = [
    // 0 — Campaign Details
    detailsForm,

    // 1 — Creatives
    '<div style="border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)">'
      + '<div id="cm-draft-creatives">' + _cmDraftCreativesInnerHtml() + '</div>'
    + '</div>',

    // 2 — Media Plan / Moments
    '<div id="cm-moments-panel">' + _cmMomentsInnerHtml() + '</div>',

    // 3 — Partner
    '<div style="padding:20px 24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;gap:16px">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--border-md)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
      + '<span style="font-size:12px;color:var(--faint);flex:1">No DSP / SSP partner connected yet.</span>'
      + '<button style="height:30px;padding:0 14px;border:none;border-radius:7px;background:var(--accent);color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">+ Add Partner</button>'
    + '</div>',

    // 4 — Review & Launch
    '<div style="padding:24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface);text-align:center">'
      + '<div style="font-size:12px;color:var(--faint);margin-bottom:16px">Complete all checklist steps to enable launch.</div>'
      + '<button disabled style="height:36px;padding:0 28px;border:none;border-radius:8px;background:var(--border);color:var(--faint);font-size:13px;font-weight:600;cursor:not-allowed;font-family:inherit">Launch Campaign</button>'
    + '</div>',
  ];

  var steps = [
    { label:'Campaign Details', done:true,  desc:'Name, advertiser, geography, flight dates and budget set.' },
    { label:'Creatives',        done:false, desc:'Upload your video or image assets to build ad templates.' },
    { label:'Media Plan', done:false, desc:'Define the audience moments you want to target.' },
    { label:'Partner',          done:false, desc:'Connect a DSP or SSP to enable delivery.' },
    { label:'Review & Launch',  done:false, desc:'Review all settings and activate your campaign.' },
  ];

  var chevSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg>';

  var checklist = '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border)">'
    +   '<div style="font-size:13px;font-weight:600;color:var(--text)">Setup Checklist</div>'
    +   '<div style="font-size:11px;color:var(--faint);margin-top:2px">Complete all steps before launching</div>'
    + '</div>'
    + steps.map(function(s, i) {
        var icon = s.done
          ? '<div style="width:22px;height:22px;border-radius:99px;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
          : '<div style="width:22px;height:22px;border-radius:99px;border:2px solid var(--border-md);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--faint);font-size:10px;font-weight:700">' + (i+1) + '</div>';
        var badge = s.done
          ? '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;background:var(--accent);color:#fff;white-space:nowrap">Completed</span>'
          : '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;background:var(--subtle);color:var(--muted);white-space:nowrap">Incomplete</span>';
        var header = '<div id="cm-draft-hd-' + i + '" onclick="_cmDraftToggle(' + i + ')" '
          + 'style="display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s" '
          + 'onmouseover="this.style.background=\'var(--hover)\'" onmouseout="var p=document.getElementById(\'cm-draft-panel-\'+' + i + ');this.style.background=p&&p.style.display!==\'none\'?\'var(--hover)\':\'\'">'
          + icon
          + '<div style="flex:1">'
          +   '<div style="font-size:12px;font-weight:600;color:var(--text)">' + s.label + '</div>'
          +   '<div style="font-size:11px;color:var(--faint);margin-top:2px">' + s.desc + '</div>'
          + '</div>'
          + badge
          + '<span id="cm-draft-chev-' + i + '" style="color:var(--faint);transition:transform .2s">' + chevSvg + '</span>'
          + '</div>';
        var panel = '<div id="cm-draft-panel-' + i + '" style="display:none">'
          + panelContents[i]
          + '</div>';
        return header + panel;
      }).join('')
    + '</div>';

  return UI.pageHeader({
      breadcrumb: [
        { label: 'Campaign Management', onclick: 'setPage(\'campaign-management\',\'Campaign Management\')' },
        { label: c.name }
      ],
      title: c.name,
      subtitle: c.advertiser + ' · ' + c.geography.join(', '),
      titleRight: cmStatusChip(c.status),
    })
    + checklist;
}
