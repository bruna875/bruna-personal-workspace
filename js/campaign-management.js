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
  var qs = (typeof _appIsSuperOrg === 'function' && !_appIsSuperOrg() && typeof selectedClientOrgId !== 'undefined' && selectedClientOrgId)
    ? '?client_org_id=' + selectedClientOrgId
    : '';
  fetch('/api/campaigns' + qs)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.campaigns || !data.campaigns.length) { CM_CAMPAIGNS = []; _cmDBLoaded = true; _cmRefreshTable(); return; }
      CM_CAMPAIGNS = data.campaigns;
      _cmDBLoaded = true;
      // Refresh table, count and tab nav if already rendered
      _cmRefreshTable();
    })
    .catch(function(e) { console.warn('campaigns API unavailable, using mock data:', e.message); });
}

function cmDeleteCampaign(dbId, btn) {
  var c = (CM_CAMPAIGNS || []).find(function(x) { return String(x.dbId) === String(dbId); });
  var crCount  = c ? (c.creatives     || 0) : 0;
  var mpCount  = c ? (c.analysisCount || 0) : 0;
  var hasLinks = crCount > 0 || mpCount > 0;

  // Build warning message for linked assets
  var warningHtml = '';
  if (hasLinks) {
    var parts = [];
    if (crCount > 0) parts.push(crCount + ' creative' + (crCount === 1 ? '' : 's'));
    if (mpCount > 0) parts.push(mpCount + ' Moments Group' + (mpCount === 1 ? '' : 's'));
    var linked = parts.join(' and ');
    warningHtml = '<div style="margin-top:12px;padding:10px 12px;border-radius:8px;background:#fef9c3;border:1px solid #fde68a;font-size:12px;color:#92400e;line-height:1.6">'
      + '<strong style="display:block;margin-bottom:3px">⚠️ Warning</strong>'
      + 'There ' + (crCount + mpCount === 1 ? 'is' : 'are') + ' ' + linked + ' linked to this campaign. Deleting it will leave them in Creative Library and Moments Match unassigned to any client, advertiser or campaign.'
      + '</div>';
  }

  // Build modal
  var modal = document.createElement('div');
  modal.id = 'cm-delete-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)';
  modal.innerHTML = '<div style="background:var(--surface);border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.22);padding:24px;max-width:420px;width:90%;font-family:inherit" onclick="event.stopPropagation()">'
    + '<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:6px">Delete campaign</div>'
    + '<div style="font-size:13px;color:var(--muted);line-height:1.5">Are you sure you want to delete <strong style="color:var(--text)">' + (c ? c.name : 'this campaign') + '</strong>? This action cannot be undone.</div>'
    + warningHtml
    + '<div id="cm-delete-err" style="display:none;margin-top:10px;padding:8px 10px;border-radius:7px;background:#fef2f2;border:1px solid #fecaca;font-size:12px;color:#dc2626"></div>'
    + '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px">'
    +   '<button onclick="document.getElementById(\'cm-delete-modal\').remove()" style="height:32px;padding:0 16px;border:1px solid var(--border-md);border-radius:8px;background:transparent;color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">Cancel</button>'
    +   '<button id="cm-delete-confirm-btn" style="height:32px;padding:0 16px;border:none;border-radius:8px;background:#dc2626;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Delete</button>'
    + '</div>'
    + '</div>';

  modal.addEventListener('click', function() { modal.remove(); });
  document.body.appendChild(modal);

  document.getElementById('cm-delete-confirm-btn').addEventListener('click', function() {
    modal.remove();
    var row = btn ? btn.closest('tr') : null;
    fetch('/api/campaigns?campaign_id=' + dbId, { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.ok) {
          var errEl = document.getElementById('cm-delete-err');
          if (errEl) { errEl.textContent = 'Delete failed: ' + (data.error || 'unknown error'); errEl.style.display = 'block'; }
          return;
        }
        CM_CAMPAIGNS = CM_CAMPAIGNS.filter(function(x) { return String(x.dbId) !== String(dbId); });
        if (row) {
          row.style.transition = 'opacity 0.2s';
          row.style.opacity = '0';
          setTimeout(function() {
            var tbody = document.getElementById('cm-tbody');
            if (tbody) tbody.innerHTML = _cmRowsHtml();
            var count = document.getElementById('cm-count');
            if (count) count.textContent = CM_CAMPAIGNS.length;
          }, 220);
        } else {
          var tbody = document.getElementById('cm-tbody');
          if (tbody) tbody.innerHTML = _cmRowsHtml();
          var count = document.getElementById('cm-count');
          if (count) count.textContent = CM_CAMPAIGNS.length;
        }
      })
      .catch(function(e) {
        var errEl = document.getElementById('cm-delete-err');
        if (errEl) { errEl.textContent = 'Delete failed: ' + e.message; errEl.style.display = 'block'; }
      });
  });
}


// ── Mock campaign data (fallback) ─────────────────────────────────────────────
var CM_CAMPAIGNS = [
  { id:'cm1',  name:'Q2 Walmart Grocery',       advertiser:'Walmart',        geography:['US'],         status:'pacing',      pacing:72,  impressions:'14.2M', goal:'20M',  budget:'$420K', spent:'$301K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:2, moments:5,  partners:['The Trade Desk','DV360'],        createdBy:'Bruna M.',  createdOn:'12 Mar 2026' },
  { id:'cm2',  name:'Back to School 2026',       advertiser:'Walmart',        geography:['US','CA'],    status:'pacing',      pacing:58,  impressions:'9.8M',  goal:'18M',  budget:'$380K', spent:'$218K', start:'15 May 2026', end:'15 Aug 2026',  creatives:3, moments:3,  partners:['Xandr'],                         createdBy:'Marco F.',  createdOn:'2 Apr 2026'  },
  { id:'cm3',  name:'Summer Fresh Campaign',     advertiser:'Walmart',        geography:['EU'],         status:'underpacing', pacing:31,  impressions:'3.1M',  goal:'10M',  budget:'$150K', spent:'$47K',  start:'1 Jun 2026',  end:'31 Jul 2026',  creatives:2, moments:2,  partners:['DV360','Amazon DSP'],             createdBy:'Sara L.',   createdOn:'18 Apr 2026' },
  { id:'cm4',  name:'Home Renovation Q3',        advertiser:'The Home Depot', geography:['US'],         status:'draft',       pacing:0,   impressions:'—',     goal:'25M',  budget:'$600K', spent:'$0',    start:'1 Jul 2026',  end:'30 Sep 2026',  creatives:0, moments:0,  partners:[],                                createdBy:'Bruna M.',  createdOn:'5 May 2026'  },
  { id:'cm5',  name:'Target Back to School',     advertiser:'Target',         geography:['US'],         status:'pacing',      pacing:84,  impressions:'7.4M',  goal:'9M',   budget:'$210K', spent:'$175K', start:'1 May 2026',  end:'20 Jun 2026',  creatives:5, moments:7,  partners:['The Trade Desk'],                createdBy:'Luca R.',   createdOn:'10 Apr 2026' },
  { id:'cm6',  name:'Pets & More Spring',        advertiser:'Walmart',        geography:['US'],         status:'error',       pacing:18,  impressions:'1.2M',  goal:'8M',   budget:'$190K', spent:'$34K',  start:'1 Apr 2026',  end:'30 May 2026',  creatives:2, moments:1,  partners:['Xandr','Yahoo DSP'],             createdBy:'Marco F.',  createdOn:'15 Mar 2026' },
  { id:'cm7',  name:'Electronics Week',          advertiser:'Samsung',        geography:['US','CA'],    status:'completed',   pacing:100, impressions:'22.5M', goal:'22M',  budget:'$510K', spent:'$508K', start:'1 Mar 2026',  end:'31 Mar 2026',  creatives:6, moments:12, partners:['DV360','The Trade Desk','Xandr'],createdBy:'Sara L.',   createdOn:'1 Feb 2026'  },
  { id:'cm8',  name:'Health & Wellness Q2',      advertiser:'Unilever',       geography:['EU'],         status:'pacing',      pacing:61,  impressions:'5.9M',  goal:'10M',  budget:'$230K', spent:'$142K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:3, moments:4,  partners:['Amazon DSP'],                    createdBy:'Bruna M.',  createdOn:'20 Mar 2026' },
  { id:'cm9',  name:'Clean Home Summer',         advertiser:'P&G',            geography:['US'],         status:'draft',       pacing:0,   impressions:'—',     goal:'12M',  budget:'$280K', spent:'$0',    start:'15 Jun 2026', end:'15 Sep 2026',  creatives:0, moments:0,  partners:[],                                createdBy:'Luca R.',   createdOn:'8 May 2026'  },
  { id:'cm10', name:'Beauty Essentials',         advertiser:'Unilever',       geography:['EU','UK'],    status:'pacing',      pacing:90,  impressions:'8.8M',  goal:'10M',  budget:'$195K', spent:'$176K', start:'1 Apr 2026',  end:'31 May 2026',  creatives:4, moments:6,  partners:['DV360'],                         createdBy:'Sara L.',   createdOn:'5 Mar 2026'  },
  { id:'cm11', name:'Garden & Outdoor Spring',   advertiser:'Walmart',        geography:['US'],         status:'underpacing', pacing:27,  impressions:'2.2M',  goal:'9M',   budget:'$175K', spent:'$48K',  start:'15 Apr 2026', end:'30 Jun 2026',  creatives:2, moments:2,  partners:['Yahoo DSP','Xandr'],             createdBy:'Marco F.',  createdOn:'28 Mar 2026' },
  { id:'cm12', name:'New Devices Launch',        advertiser:'Samsung',        geography:['US','CA'],    status:'completed',   pacing:100, impressions:'18.3M', goal:'18M',  budget:'$440K', spent:'$437K', start:'1 Feb 2026',  end:'28 Feb 2026',  creatives:5, moments:9,  partners:['The Trade Desk','Amazon DSP'],    createdBy:'Bruna M.',  createdOn:'10 Jan 2026' },
  { id:'cm13', name:'Everyday Essentials',       advertiser:'P&G',            geography:['US'],         status:'pacing',      pacing:53,  impressions:'6.7M',  goal:'14M',  budget:'$310K', spent:'$163K', start:'1 Apr 2026',  end:'30 Jun 2026',  creatives:3, moments:3,  partners:['DV360'],                         createdBy:'Luca R.',   createdOn:'22 Mar 2026' },
];

var cmSearch = '';
var _cmActiveTab = 'live'; // 'live' | 'draft' | 'completed'

var _cmTabGroups = {
  live:      ['pacing', 'underpacing', 'error'],
  draft:     ['draft', 'planned'],
  completed: ['completed'],
};

// ── Draft creatives panel state ───────────────────────────────────────────────
var _cmDraftCreatives   = [];
var _cmLibSearch        = '';

// ── Moments Match panel state (Campaign Setup step) ───────────────────────────
var _cmSelectedAnalysis = null; // single selected analysis (col 1)
var _cmSelectedMp       = null; // selected Moments Group within analysis (col 2)
var _cmMpLibrary        = null; // null = not loaded, [] = loaded
var _cmMpLibSearch      = '';
var _cmMpPlansSearch    = '';
var _cmOpenDetailId     = null; // tracks which campaign detail is open

// ── Pending deep-link state (set by mp2SaveAndDistribute) ─────────────────────
var _cmPendingCampaignDbId = null; // DB id of campaign to auto-open
var _cmPendingAnalysisId   = null; // analysis_id to pre-select in step 2
var _cmPendingMpId         = null; // ad_group_id to pre-select in step 2

// ── Moments panel state ───────────────────────────────────────────────────────
var _cmMomentMode        = null; // 'saved' | 'new'
var _cmSavedPlanId       = null;
var _cmMomentsSearchQuery = '';
var _cmMomentsMode = 'moments'; // 'moments' | 'custom'

// ── Build Moments Group page state ───────────────────────────────────────────────
var _bmpMode              = null; // 'analysis' | 'creatives' | 'brief'
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

var CM_SAVED_AD_GROUPS = [
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
    + '<div style="flex:65;min-width:0;border-right:1px solid var(--border);display:flex;flex-direction:column">'
    +   '<div style="padding:20px 20px 10px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Add From Library</div>'
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
    // Always exclude creatives already assigned to a DIFFERENT campaign
    var noOtherCampaign = !c.campaignId || c.campaignId === _cmCurrentCampaignDbId;
    if (!noOtherCampaign) return false;

    // Client filter: match if no client selected, or creative has no client, or client matches
    var clientOk = !_cmDraftClient
      || !c.client || c.client === '—'
      || (c.client||'') === _cmDraftClient;

    // Advertiser filter: match if no advertiser selected, or creative has no advertiser, or advertiser matches
    var advOk = !_cmDraftAdv
      || !c.advertiser || c.advertiser === '—'
      || (c.advertiser||'') === _cmDraftAdv;

    // Text search
    var searchOk = !q
      || (c.name||'').toLowerCase().indexOf(q) >= 0
      || (c.advertiser||'').toLowerCase().indexOf(q) >= 0;

    return clientOk && advOk && searchOk;
  });
}

function _cmLibRowsHtml(filtered) {
  var TD = 'padding:5px 20px;border-bottom:1px solid var(--border);vertical-align:middle';
  return filtered.map(function(cr) {
    var isAdded = _cmDraftCreatives.some(function(d){ return d.libId === cr.id; });
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
    return '<tr style="cursor:pointer" onclick="cmLibToggleCreative(\'' + cr.id + '\')" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD + ';width:32px;padding-left:20px;padding-right:8px" onclick="event.stopPropagation()">' + cb + '</td>'
      + '<td style="' + TD + ';width:52px;padding-left:0">' + thumb + '</td>'
      + '<td style="' + TD + ';padding-left:10px">' + nameCell + '</td>'
      + '<td style="' + TD + ';width:100px">' + advCell + '</td>'
      + '<td style="' + TD + ';width:130px;padding-right:20px">' + tplCell + '</td>'
      + '</tr>';
  }).join('');
}

function _cmLibTableWrapHtml(filtered) {
  if (!filtered.length) return '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  return '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr style="background:var(--bg)">'
    + '<th style="width:32px;padding-left:20px;padding-right:8px;border-bottom:1px solid var(--border)"></th>'
    + '<th style="width:52px;padding-left:0;border-bottom:1px solid var(--border)"></th>'
    + '<th style="padding:5px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);text-align:left">Creative</th>'
    + '<th style="width:100px;padding:5px 20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);text-align:left">Advertiser</th>'
    + '<th style="width:130px;padding:5px 20px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);text-align:left">Template</th>'
    + '</tr></thead>'
    + '<tbody>' + _cmLibRowsHtml(filtered) + '</tbody>'
    + '</table>';
}

function _cmLibColHtml() {
  var filtered = _cmLibFilteredRows();
  var search = '<div style="padding:8px 20px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-lib-search', 'Search library…', 'cmLibSearch(this.value)', _cmLibSearch||'')
    + '</div>';
  var body = '<div id="cm-lib-table-wrap" style="max-height:277px;overflow-y:auto">' + _cmLibTableWrapHtml(filtered) + '</div>';
  return search + body;
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
    var addTplBtn = '<button onclick="event.stopPropagation();cmAddTemplate(\'' + a.id + '\')" style="display:inline-flex;align-items:center;gap:3px;height:16px;padding:0 5px;border:1px solid var(--border-md);border-radius:4px;font-size:8px;font-weight:500;color:var(--muted);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
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
    return '<div onclick="cmAddTemplate(\'' + a.id + '\')" style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);position:relative;display:flex;flex-direction:column;cursor:pointer;transition:border-color .15s,box-shadow .15s" '
      + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 0 0 2px rgba(225,29,143,.12)\';var o=this.querySelector(\'.cm-tile-ov\');if(o)o.style.opacity=\'1\'" '
      + 'onmouseout="this.style.borderColor=\'var(--border)\';this.style.boxShadow=\'none\';var o=this.querySelector(\'.cm-tile-ov\');if(o)o.style.opacity=\'0\'">'
      + '<div style="aspect-ratio:16/9;background:#e5e7eb;overflow:hidden;flex-shrink:0;position:relative">'
      +   '<img src="' + a.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      +   '<div class="cm-tile-ov" style="position:absolute;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s">'
      +     '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>'
      +   '</div>'
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
  // Remove any existing modal
  var existing = document.getElementById('cm-upload-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'cm-upload-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.45);backdrop-filter:blur(2px)';

  var upSvg = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';

  modal.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;width:480px;max-width:92vw;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.25)">'
    // Header
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border)">'
    +   '<div style="font-size:14px;font-weight:600;color:var(--text)">Upload Creative</div>'
    +   '<button onclick="document.getElementById(\'cm-upload-modal\').remove()" style="width:28px;height:28px;border:none;border-radius:7px;background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'transparent\'">'
    +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +   '</button>'
    + '</div>'
    // Drop zone
    + '<div style="padding:24px">'
    +   '<div id="cm-upload-dropzone" style="border:2px dashed var(--border-md);border-radius:12px;padding:40px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s" onclick="document.getElementById(\'cm-upload-file-input\').click()" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'\'">'
    +     upSvg
    +     '<div>'
    +       '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">Click to upload your assets</div>'
    +       '<div style="font-size:12px;color:var(--muted)">MP4, MOV, JPG, PNG, GIF</div>'
    +     '</div>'
    +     '<input id="cm-upload-file-input" type="file" accept="video/*,image/*,.gif" multiple style="display:none" onchange="cmUploadHandleFiles(this.files)">'
    +   '</div>'
    // Or paste YouTube link
    +   '<div style="display:flex;align-items:center;gap:10px;margin:16px 0">'
    +     '<div style="flex:1;height:1px;background:var(--border)"></div>'
    +     '<span style="font-size:11px;color:var(--faint)">or paste a link</span>'
    +     '<div style="flex:1;height:1px;background:var(--border)"></div>'
    +   '</div>'
    +   '<div style="display:flex;gap:8px">'
    +     '<input id="cm-upload-url" type="text" placeholder="YouTube or video URL…" style="flex:1;height:36px;padding:0 12px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--bg);outline:none" onkeydown="if(event.key===\'Enter\')cmUploadHandleUrl()">'
    +     '<button onclick="cmUploadHandleUrl()" style="height:36px;padding:0 16px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Add</button>'
    +   '</div>'
    // Preview area
    +   '<div id="cm-upload-preview" style="margin-top:16px;display:flex;flex-direction:column;gap:8px"></div>'
    + '</div>'
    // Footer
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px">'
    +   '<button onclick="document.getElementById(\'cm-upload-modal\').remove()" style="height:32px;padding:0 16px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-weight:500;color:var(--muted);background:transparent;cursor:pointer;font-family:inherit">Cancel</button>'
    +   '<button id="cm-upload-save-btn" onclick="cmUploadConfirm()" style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Save to Creative Library</button>'
    + '</div>'
    + '</div>';

  document.body.appendChild(modal);
  // Close on backdrop click
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
}

// Staged uploads waiting to be confirmed
var _cmUploadStaged = [];

// ── Thumbnail generators ──────────────────────────────────────────────────────
function _cmThumbFromImage(file, cb) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var MAX = 320;
      var r = Math.min(MAX / img.width, MAX / img.height, 1);
      var canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * r);
      canvas.height = Math.round(img.height * r);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function _cmThumbFromVideo(file, cb) {
  var blobUrl = URL.createObjectURL(file);
  var video = document.createElement('video');
  video.muted = true;
  video.preload = 'metadata';
  video.onloadeddata = function() { video.currentTime = 0.5; };
  video.onseeked = function() {
    var canvas = document.createElement('canvas');
    canvas.width  = 320;
    canvas.height = video.videoHeight ? Math.round(320 * video.videoHeight / video.videoWidth) : 180;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(blobUrl);
    cb(canvas.toDataURL('image/jpeg', 0.75));
  };
  video.onerror = function() { URL.revokeObjectURL(blobUrl); cb(''); };
  video.src = blobUrl;
}

function _cmThumbPromise(item) {
  if (item.thumb) return Promise.resolve(item.thumb);
  return new Promise(function(resolve) {
    if (!item._file) { resolve(''); return; }
    if (item.assetType === 'video') {
      _cmThumbFromVideo(item._file, function(url) { item.thumb = url; resolve(url); });
    } else {
      _cmThumbFromImage(item._file, function(url) { item.thumb = url; resolve(url); });
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

function cmUploadHandleFiles(files) {
  if (!files || !files.length) return;
  for (var i = 0; i < files.length; i++) {
    (function(f, idx) {
      var isVideo = f.type.indexOf('video') === 0;
      var ext = f.name.split('.').pop().toUpperCase();
      var item = {
        id: 'up-' + Date.now() + '-' + idx,
        name: f.name,
        type: ext,
        thumb: '',
        src: URL.createObjectURL(f),
        assetType: isVideo ? 'video' : 'image',
        _file: f
      };
      _cmUploadStaged.push(item);
      // Generate thumbnail async, re-render preview when ready
      if (isVideo) {
        _cmThumbFromVideo(f, function(url) { item.thumb = url; _cmRenderUploadPreview(); });
      } else {
        _cmThumbFromImage(f, function(url) { item.thumb = url; _cmRenderUploadPreview(); });
      }
    })(files[i], i);
  }
  _cmRenderUploadPreview();
}

function cmUploadHandleUrl() {
  var inp = document.getElementById('cm-upload-url');
  if (!inp) return;
  var url = inp.value.trim();
  if (!url) return;
  var ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  var rvMatch = url.match(/radius\.video\/previews\/(?:share\/)?([A-Za-z0-9%=+/_-]+)/);
  var thumb, name, assetType;
  if (ytMatch) {
    thumb     = 'https://img.youtube.com/vi/' + ytMatch[1] + '/mqdefault.jpg';
    name      = 'YouTube – ' + ytMatch[1];
    assetType = 'youtube';
  } else if (rvMatch) {
    var rvId  = decodeURIComponent(rvMatch[1]).split(',')[0];
    thumb     = '';
    name      = 'Radius – ' + rvId;
    assetType = 'radius';
  } else {
    thumb     = '';
    name      = url.split('/').pop().split('?')[0] || 'Video';
    assetType = 'youtube';
  }
  _cmUploadStaged.push({ id: 'up-' + Date.now(), name: name, type: 'MP4', thumb: thumb, src: url, assetType: assetType });
  inp.value = '';
  _cmRenderUploadPreview();
}

function _cmRenderUploadPreview() {
  var el = document.getElementById('cm-upload-preview');
  if (!el) return;
  if (!_cmUploadStaged.length) { el.innerHTML = ''; return; }
  el.innerHTML = _cmUploadStaged.map(function(a, i) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--subtle)">'
      + (a.thumb
        ? '<img src="' + a.thumb + '" style="width:48px;height:28px;border-radius:4px;object-fit:cover;flex-shrink:0">'
        : '<div style="width:48px;height:28px;border-radius:4px;background:var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg></div>')
      + '<div style="flex:1;min-width:0">'
      +   '<div style="font-size:11px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.name + '</div>'
      +   '<div style="font-size:10px;color:var(--faint)">' + a.type + '</div>'
      + '</div>'
      + '<button onclick="_cmUploadStagedRemove(' + i + ')" style="width:20px;height:20px;border:none;border-radius:4px;background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--faint)\'">'
      +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '</div>';
  }).join('');
}

function _cmUploadStagedRemove(i) {
  _cmUploadStaged.splice(i, 1);
  _cmRenderUploadPreview();
}

function cmUploadConfirm() {
  if (!_cmUploadStaged.length) {
    var m = document.getElementById('cm-upload-modal');
    if (m) m.remove();
    return;
  }

  // Disable save button, show loading state
  var btn = document.getElementById('cm-upload-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; btn.style.opacity = '0.7'; }

  // For each staged item: ensure thumbnail is ready, then save to DB
  Promise.all(_cmUploadStaged.map(function(item) {
    return _cmThumbPromise(item).then(function(thumb) {
      return fetch('/api/creatives-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creative_name:       item.name,
          creative_asset_type: item.assetType,
          creative_asset_link: (item.assetType === 'youtube' || item.assetType === 'radius') ? item.src : '',
          creative_preview:    thumb
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        return { item: item, dbId: data.creative_id, thumb: thumb };
      });
    });
  }))
  .then(function(results) {
    // Add saved creatives to the campaign draft with real DB IDs
    results.forEach(function(r) {
      var dbId = r.dbId;
      _cmDraftCreatives.push({
        id:        'dbcr' + dbId,
        libId:     'dbcr' + dbId,
        dbId:      dbId,
        name:      r.item.name,
        type:      r.item.type,
        thumb:     r.thumb,
        assetType: r.item.assetType,
        templates: []
      });
      // Also add to CS_LIBRARY so it appears in the library browser
      if (typeof CS_LIBRARY !== 'undefined') {
        CS_LIBRARY.push({
          id:          'dbcr' + dbId,
          dbId:        dbId,
          name:        r.item.name,
          client:      '—',
          advertiser:  '—',
          campaign:    null,
          campaignId:  null,
          fileType:    r.item.type,
          date:        new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }),
          thumb:       r.thumb,
          assetLink:   r.item.assetType === 'youtube' ? r.item.src : '',
          assetType:   r.item.assetType,
          assetS3:     '',
          templates:   []
        });
      }
    });

    _cmUploadStaged = [];
    // Re-render the Asset panel (right column of Step 2)
    var el = document.getElementById('cm-draft-creatives');
    if (el) el.innerHTML = _cmDraftCreativesInnerHtml();
    var modal = document.getElementById('cm-upload-modal');
    if (modal) modal.remove();
  })
  .catch(function(err) {
    console.error('Save to Creative Library error:', err);
    if (btn) { btn.disabled = false; btn.textContent = 'Save to Creative Library'; btn.style.opacity = '1'; }
  });
}

function cmDraftCreativeRemove(id) {
  _cmDraftCreatives = _cmDraftCreatives.filter(function(a){ return a.id !== id; });
  var el = document.getElementById('cm-draft-creatives');
  if (el) el.innerHTML = _cmDraftCreativesInnerHtml();
}

function cmSwitchNameMode(btn, mode) {
  _cmNameMode = mode;
  var pill = btn.parentNode;
  Array.prototype.forEach.call(pill.querySelectorAll('button'), function(b) {
    var active = b === btn;
    b.style.background  = active ? '#fff' : 'transparent';
    b.style.color       = active ? 'var(--accent)' : '#9ca3af';
    b.style.fontWeight  = active ? '600' : '500';
    b.style.boxShadow   = active ? '0 1px 2px rgba(0,0,0,.1)' : 'none';
  });
  var inp = document.getElementById('cm-draft-name');
  if (inp) {
    inp.placeholder = mode === 'name' ? 'Campaign name…' : 'e.g. CAMP-2024-001';
    inp.focus();
  }
}

function cmSaveCreatives() {
  var btn = document.getElementById('cm-creatives-save-btn');
  var fb  = document.getElementById('cm-creatives-feedback');
  function _showFb(msg, color) {
    if (!fb) return;
    fb.textContent = msg;
    fb.style.color = color;
    fb.style.opacity = '1';
    setTimeout(function() { fb.style.opacity = '0'; }, 3000);
  }
  if (!_cmCurrentCampaignDbId) {
    _showFb('Campaign name needed to save the Creatives', '#dc2626');
    return;
  }
  // Extract numeric DB IDs — library items have libId like 'dbcr28'
  var ids = _cmDraftCreatives
    .map(function(a) {
      if (a.libId) return parseInt(a.libId.replace('dbcr', ''), 10);
      if (a.dbId)  return parseInt(a.dbId, 10);
      return null;
    })
    .filter(function(id) { return id && !isNaN(id); });

  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  fetch('/api/creatives-link', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ campaign_id: _cmCurrentCampaignDbId, creative_ids: ids }),
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r); })
  .then(function() {
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    _showFb('Saved correctly ✓', '#16a34a');
    // Update in-memory creatives count and refresh badges
    var updated = CM_CAMPAIGNS.map(function(camp) {
      if (camp.dbId !== _cmCurrentCampaignDbId) return camp;
      return Object.assign({}, camp, { creatives: ids.length });
    });
    CM_CAMPAIGNS = updated;
    cmRefreshStepBadges();
  })
  .catch(function(err) {
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    _showFb('Error saving — please retry', '#dc2626');
    console.error('cmSaveCreatives error', err);
  });
}

function cmAddTemplate(draftId) {
  if (!_cmDraftCreatives.length) return;
  window._cmAddTemplateCreativeId = true; // flag: editor opened from Campaign Management
  // Load ALL draft creatives into CS editor sidebar
  csEditorAssets = _cmDraftCreatives.map(function(cr) {
    return { id: cr.id, name: cr.name, type: cr.type, thumb: cr.thumb, src: cr.src || '', assetType: cr.assetType || '', templates: (cr.templates || []).slice() };
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
    _cmDraftCreatives.push({ id:'lib-'+libId, libId:libId, name:cr.name, type:cr.fileType||'MP4', thumb:cr.thumb||'', src:cr.assetLink||'', assetType:cr.assetType||'', templates:cr.templates||[] });
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

// Open Template Builder pre-populated with the creatives of a live/saved campaign
function cmPreviewCampaignCreatives(campaignDbId) {
  function _open(creatives) {
    // Use _csPendingAssets so renderCreativeStudio() picks them up instead of resetting
    _csPendingAssets = creatives.map(function(cr) {
      return {
        id:        cr.id        || ('cr' + cr.dbId),
        name:      cr.name      || '',
        type:      cr.fileType  || '',
        thumb:     cr.thumb     || '',
        src:       cr.assetLink || '',
        assetType: cr.assetType || '',
        templates: cr.templates || [],
      };
    });
    csBuilderBackPage = 'campaign-management';
    setPage('creative-studio', 'Creative Studio', true);
    setTimeout(function() { csBuildTemplates(0); }, 80);
  }

  // Try CS_LIBRARY first (already loaded)
  var lib = (typeof CS_LIBRARY !== 'undefined' ? CS_LIBRARY : []);
  var cached = lib.filter(function(cr) { return cr.campaignId === campaignDbId; });
  if (cached.length) { _open(cached); return; }

  // Fallback: fetch from API
  fetch('/api/creatives?campaign_id=' + campaignDbId)
    .then(function(r) { return r.json(); })
    .then(function(data) { _open(data.creatives || []); })
    .catch(function() { _open([]); });
}

// ── Moments full-screen overlay ───────────────────────────────────────────────
function cmOpenMomentsOverlay(mode) {
  var existing = document.getElementById('cm-moments-overlay');
  if (existing) existing.remove();

  var isMoments = mode === 'moments';
  var title  = isMoments ? 'Custom Moments Builder' : 'Moments Match';
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

// ── Build Moments Group page ─────────────────────────────────────────────────────
function _bmpReset() {
  _bmpMode = null; _bmpAnalysisSearch = ''; _bmpAnalysisId = null;
  _bmpLibSearch = ''; _bmpLibSelectedIds = [];
}

function _bmpCardHtml() {
  return '<div style="display:flex;width:100%;height:100%">'
    // ── Left: option list ──
    + '<div style="width:200px;flex-shrink:0;border-right:1px solid var(--border);background:var(--surface);display:flex;flex-direction:column">'
    +   '<div id="bmp-options">' + _bmpOptionsHtml() + '</div>'
    + '</div>'
    // ── Right: content ──
    + '<div style="flex:1;overflow-y:auto;background:var(--surface)" id="bmp-extra">' + _bmpExtraHtml() + '</div>'
    + '</div>';
}

// Standalone page — accessed directly via URL
function renderBuildAdGroup() {
  _bmpReset();
  var backBtn = '<button onclick="history.back()" style="display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit" onmouseover="this.style.borderColor=\'var(--text)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
    + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>'
    + 'Back to Campaign'
    + '</button>';
  return UI.pageHeader({ title: 'Build Moments Group', titleRight: backBtn })
    + '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;min-height:460px;display:flex;background:var(--surface)">'
    + _bmpCardHtml()
    + '</div>';
}

// Full-screen overlay — opened from draft campaign
function cmOpenBuildAdGroupOverlay() {
  _bmpReset();
  if (_cmDraftCreatives && _cmDraftCreatives.length > 0) _bmpMode = 'creatives';
  var existing = document.getElementById('cm-bmp-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'cm-bmp-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:var(--bg);overflow:hidden';

  var backStyle = 'display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;background:transparent;color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .12s,color .12s';
  var _bmpClient   = _cmDraftClient       || '—';
  var _bmpAdv      = _cmDraftAdv          || '—';
  var _bmpCampName = _cmDraftCampaignName || '—';

  function _bmpMetaChip(label, value) {
    return '<div style="display:flex;align-items:center;gap:5px">'
      + '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint)">' + label + '</span>'
      + '<span style="font-size:12px;font-weight:500;color:var(--text)">' + value + '</span>'
      + '</div>';
  }

  overlay.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;padding:0 20px;height:52px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">'
    + '<button onclick="cmCloseBuildAdGroupOverlay()" style="' + backStyle + '" onmouseover="this.style.borderColor=\'var(--text)\';this.style.color=\'var(--text)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
    +   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>'
    +   'Back to Campaign'
    + '</button>'
    + '<div style="width:1px;height:18px;background:var(--border)"></div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text)">Build Moments Group</div>'
    + '<div style="flex:1"></div>'
    + _bmpMetaChip('Client', _bmpClient)
    + '<div style="width:1px;height:14px;background:var(--border)"></div>'
    + _bmpMetaChip('Advertiser', _bmpAdv)
    + '<div style="width:1px;height:14px;background:var(--border)"></div>'
    + _bmpMetaChip('Campaign', _bmpCampName)
    + '</div>'
    + '<div style="flex:1;overflow:hidden;display:flex">'
    + _bmpCardHtml()
    + '</div>';

  document.body.appendChild(overlay);
  history.pushState({ bmpOverlay: true }, '', '/campaign-management/draft-campaign/build-ad-group');
}

function cmCloseBuildAdGroupOverlay() {
  var ov = document.getElementById('cm-bmp-overlay');
  if (ov) ov.remove();
  history.back();
}

function _bmpOptionsHtml() {
  var opts = [
    {
      id: 'analysis',
      label: 'Previous Analysis',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 5 3-5 3v-6z"/></svg>'
    },
    {
      id: 'creatives',
      label: 'Creative Assets',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3V10z"/></svg>'
    },
    {
      id: 'brief',
      label: 'Brief',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    },
  ];
  var hasCreatives = _cmDraftCreatives && _cmDraftCreatives.length > 0;
  return opts.map(function(o, i) {
    var sel = _bmpMode === o.id;
    var disabled = hasCreatives && (o.id === 'analysis' || o.id === 'brief');
    var isLast = i === opts.length - 1;
    var divider = isLast ? '' : '<div style="height:1px;background:var(--border);margin:0 0"></div>';

    if (disabled) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;opacity:.4;cursor:not-allowed" title="Not available when creatives are associated">'
        + '<span style="color:var(--faint);display:flex">' + o.icon + '</span>'
        + '<span style="font-size:13px;font-weight:500;color:var(--muted)">' + o.label + '</span>'
        + '</div>' + divider;
    }

    var bg      = sel ? 'var(--bg)' : 'transparent';
    var bgHover = 'var(--bg)';
    var bgOut   = sel ? 'var(--bg)' : 'transparent';

    return '<div onclick="bmpSetMode(\'' + o.id + '\')" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;background:' + bg + ';transition:background .12s" '
      + 'onmouseover="this.style.background=\'' + bgHover + '\'" '
      + 'onmouseout="this.style.background=\'' + bgOut + '\'">'
      + '<span style="color:' + (sel ? 'var(--accent)' : 'var(--muted)') + ';display:flex;flex-shrink:0">' + o.icon + '</span>'
      + '<span style="font-size:13px;font-weight:' + (sel ? '600' : '500') + ';color:' + (sel ? 'var(--accent)' : 'var(--text)') + '">' + o.label + '</span>'
      + (sel ? '<span style="margin-left:auto;display:flex"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>' : '')
      + '</div>' + divider;
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

  if (_bmpMode === 'creatives') {
    if (_cmDraftCreatives && _cmDraftCreatives.length > 0) {
      // Show tiles of the creatives already associated with the campaign
      var tiles = _cmDraftCreatives.map(function(a) {
        return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);display:flex;flex-direction:column">'
          + '<div style="aspect-ratio:16/9;background:#e5e7eb;overflow:hidden;flex-shrink:0;position:relative">'
          +   '<img src="' + (a.thumb||'') + '" style="width:100%;height:100%;object-fit:cover;display:block">'
          +   '<div style="position:absolute;top:4px;left:4px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.5);color:#fff">' + (a.type||'') + '</div>'
          + '</div>'
          + '<div style="padding:6px 8px">'
          +   '<div style="font-size:11px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (a.name||'—') + '</div>'
          + '</div>'
          + '</div>';
      }).join('');
      return '<div style="padding:20px">'
        + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:12px">'
        +   _cmDraftCreatives.length + ' creative' + (_cmDraftCreatives.length !== 1 ? 's' : '') + ' associated'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px">'
        + tiles
        + '</div>'
        + '</div>';
    }
    return _bmpLibExtraHtml();
  }

  // brief — placeholder CTA
  return '<div style="padding:24px;display:flex;justify-content:flex-end">'
    + '<button style="height:34px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Import Brief</button>'
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

// ── Moments Group panel — two-col (library + selected) ───────────────────────────
var _cmAnalysisCols = [
  { label: '',       width: '32px'  },
  { label: 'Analysis'               },
  { label: 'Date',   width: '100px' },
];

function _cmAnalysisFilteredRows() {
  var q   = (_cmMpLibSearch || '').toLowerCase();
  var lib = _cmMpLibrary || [];

  // Statuses that indicate an active/live campaign (excluded from the list)
  var LIVE_STATUSES = { pacing: 1, underpacing: 1, error: 1, completed: 1 };

  return lib.filter(function(a) {
    var searchOk = !q
      || (a.moments_match_analysis_name   || '').toLowerCase().indexOf(q) >= 0
      || (a.advertiser_name || '').toLowerCase().indexOf(q) >= 0
      || (a.client_name     || '').toLowerCase().indexOf(q) >= 0;

    // ── Case 1: not linked to any campaign ───────────────────────────────────
    if (!a.campaign_id) return searchOk;

    // ── Case 2: linked to a campaign ─────────────────────────────────────────
    // Exclude live/completed campaigns
    var status = (a.campaign_status || '').toLowerCase();
    if (LIVE_STATUSES[status]) return false;
    // Only include if campaign is draft AND belongs to same client+advertiser as step 1
    if (status !== 'draft') return false;
    var orgMatch = _cmCurrentClientOrgId
      ? String(a.client_org_id) === String(_cmCurrentClientOrgId)
      : false;
    var advMatch = _cmCurrentAdvertiserId
      ? String(a.advertiser_id) === String(_cmCurrentAdvertiserId)
      : true; // no advertiser selected yet → don't filter on advertiser
    return orgMatch && advMatch && searchOk;
  });
}

function _cmAnalysisRowsHtml(filtered) {
  var TD = 'padding:5px 12px;border-bottom:1px solid var(--border);vertical-align:middle';
  return filtered.map(function(a) {
    var isSel = _cmSelectedAnalysis && _cmSelectedAnalysis.moments_match_analysis_id === a.moments_match_analysis_id;
    var cb = '<input type="checkbox"' + (isSel ? ' checked' : '') + ' onchange="cmAnalysisLibToggle(' + a.moments_match_analysis_id + ')" '
      + 'style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer">';
    var date = a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' }) : '—';
    var nameCell = '<div style="font-size:12px;font-weight:' + (isSel ? '600' : '500') + ';color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (a.moments_match_analysis_name || 'Untitled Analysis') + '</div>'
      + '<div style="font-size:10px;color:var(--faint)">' + date + '</div>';
    return '<tr style="cursor:pointer" onclick="cmAnalysisLibToggle(' + a.moments_match_analysis_id + ')" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD + ';width:32px" onclick="event.stopPropagation()">' + cb + '</td>'
      + '<td style="' + TD + '">' + nameCell + '</td>'
      + '</tr>';
  }).join('');
}

function _cmMpLibColHtml() {
  var filtered = _cmAnalysisFilteredRows();
  var search = '<div style="padding:8px 12px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-mp-lib-search', 'Search analyses…', 'cmMpLibSearch(this.value)', _cmMpLibSearch || '')
    + '</div>';
  var body = filtered.length
    ? '<div style="overflow-y:auto;max-height:260px"><table style="width:100%;border-collapse:collapse">'
      + '<thead><tr style="background:var(--bg)">'
      + '<th style="width:32px;border-bottom:1px solid var(--border)"></th>'
      + '<th style="padding:5px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);text-align:left">Analysis</th>'
      + '</tr></thead>'
      + '<tbody>' + _cmAnalysisRowsHtml(filtered) + '</tbody>'
      + '</table></div>'
    : '<div style="padding:24px;text-align:center;font-size:12px;color:var(--faint)">No analyses found</div>';
  return search + body;
}

function _cmMpSelColHtml() {
  if (!_cmSelectedAnalysis) {
    var dz = 'border:1.5px dashed var(--border-md);border-radius:10px;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;box-sizing:border-box;text-align:center;padding:28px 16px;min-height:120px';
    return '<div style="' + dz + '">'
      + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>'
      + '<div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">No analysis selected</div>'
      + '<div style="font-size:11px;color:var(--muted)">Pick one from the library</div></div>'
      + '</div>';
  }
  var a = _cmSelectedAnalysis;
  var date = a.created_at ? new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' }) : '—';
  var mCount = 0;
  try { var _m = typeof a.moments === 'string' ? JSON.parse(a.moments) : a.moments; mCount = Array.isArray(_m) ? _m.length : 0; } catch(e){}
  return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">'
    + '<div style="padding:8px 10px;border-bottom:1px solid var(--border);background:var(--subtle);display:flex;align-items:center;gap:6px">'
    +   '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +   '<div style="font-size:11px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + (a.moments_match_analysis_name || 'Untitled Analysis') + '</div>'
    +   '<button onclick="cmAnalysisDeselect()" style="width:16px;height:16px;border:none;border-radius:3px;background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:color .12s" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--faint)\'">'
    +     '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div style="padding:6px 10px 8px;display:flex;flex-direction:column;gap:3px">'
    +   (a.campaign_name   ? '<div style="font-size:10px;color:var(--muted)">Campaign: <span style="color:var(--text)">'   + a.campaign_name   + '</span></div>' : '')
    +   (a.advertiser_name ? '<div style="font-size:10px;color:var(--muted)">Advertiser: <span style="color:var(--text)">' + a.advertiser_name + '</span></div>' : '')
    +   '<div style="font-size:10px;color:var(--muted);margin-top:2px">'
    +     '<span style="margin-right:10px">' + mCount + ' moment' + (mCount !== 1 ? 's' : '') + '</span>'
    +     '<span style="color:var(--faint)">' + date + '</span>'
    +   '</div>'
    + '</div>'
    + '</div>';
}

function _cmThreeColEmpty(msg) {
  return '<div style="border:1.5px dashed var(--border-md);border-radius:10px;background:var(--bg);display:flex;align-items:center;justify-content:center;min-height:80px;padding:16px">'
    + '<div style="font-size:12px;color:var(--faint);text-align:center">' + msg + '</div>'
    + '</div>';
}

function _cmParseMpPlans() {
  if (!_cmSelectedAnalysis) return [];
  try {
    var raw = _cmSelectedAnalysis.moments_groups;
    return typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
  } catch(e) { return []; }
}

function _cmMpPlansColHtml() {
  if (!_cmSelectedAnalysis) return _cmThreeColEmpty('Select an analysis');
  var allPlans = _cmParseMpPlans();
  if (!allPlans.length) return _cmThreeColEmpty('No Moments Groups in this analysis');
  var q = (_cmMpPlansSearch || '').toLowerCase();
  var plans = q ? allPlans.filter(function(p, i) {
    var name = (p.ad_group_name || p.name || '').toLowerCase();
    return name.indexOf(q) >= 0;
  }) : allPlans;
  var search = '<div style="padding:8px 12px;border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-mp-plans-search', 'Search Moments Groups…', 'cmMpPlansSearch(this.value)', _cmMpPlansSearch || '')
    + '</div>';
  var TD = 'padding:5px 12px;border-bottom:1px solid var(--border);vertical-align:middle';
  var body = plans.length
    ? '<div style="overflow-y:auto;max-height:220px"><table style="width:100%;border-collapse:collapse">'
      + '<thead><tr style="background:var(--bg)">'
      +   '<th style="width:32px;border-bottom:1px solid var(--border)"></th>'
      +   '<th style="padding:5px 12px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);text-align:left">Moments Group</th>'
      + '</tr></thead>'
      + '<tbody>' + allPlans.map(function(p, i) {
          if (q && (p.ad_group_name || p.name || '').toLowerCase().indexOf(q) < 0) return '';
          var isSel = _cmSelectedMp && _cmSelectedMp._idx === i;
          var planName = p.ad_group_name || p.name || ('Moments Group ' + (i + 1));
          var momArr   = Array.isArray(p.moments) ? p.moments : (Array.isArray(p.items) ? p.items : []);
          var cb = '<input type="checkbox"' + (isSel ? ' checked' : '') + ' onchange="cmSelectMediaPlan(' + i + ')" '
            + 'style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer">';
          var nameCell = '<div style="font-size:12px;font-weight:' + (isSel ? '600' : '500') + ';color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + planName + '</div>'
            + '<div style="font-size:10px;color:var(--faint)">' + momArr.length + ' moments</div>';
          return '<tr style="cursor:pointer" onclick="cmSelectMediaPlan(' + i + ')" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
            + '<td style="' + TD + ';width:32px" onclick="event.stopPropagation()">' + cb + '</td>'
            + '<td style="' + TD + '">' + nameCell + '</td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>'
    : '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">No results</div>';
  return search + body;
}

function _cmMpMomentsColHtml() {
  if (!_cmSelectedMp) return _cmThreeColEmpty('Select a Moments Group');
  // DB structure: { moments: [{ moment_name, moment_type, moment_channels, moment_est_impr, moment_est_cpm, moment_est_dollar_value }] }
  // Fall back to legacy: { items: [{ name, type, channels, impressionsLabel }] }
  var items = Array.isArray(_cmSelectedMp.moments) ? _cmSelectedMp.moments
            : Array.isArray(_cmSelectedMp.items)   ? _cmSelectedMp.items
            : [];
  if (!items.length) return _cmThreeColEmpty('No moments in this plan');

  var totalImpr = 0; var totalVal = 0;
  var TH = 'padding:6px 10px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap';
  var TD = 'padding:6px 10px;border-bottom:1px solid var(--border);vertical-align:middle';

  var rows = items.map(function(item) {
    var name     = item.moment_name    || item.name    || '—';
    var typeRaw  = (item.moment_type   || item.type    || '').toLowerCase();
    var channels = item.moment_channels || item.channels || [];
    var imprNum  = Number(item.moment_est_impr) || 0;
    var cpmNum   = Number(item.moment_est_cpm)  || 0;
    var valNum   = Number(item.moment_est_dollar_value) || (imprNum && cpmNum ? Math.round(imprNum * cpmNum / 1000) : 0);
    totalImpr += imprNum; totalVal += valNum;

    var imprLabel = item.impressionsLabel
      || (imprNum >= 1000000 ? (imprNum / 1000000).toFixed(1) + 'M'
          : imprNum >= 1000  ? Math.round(imprNum / 1000) + 'K'
          : imprNum          ? String(imprNum) : '—');
    var cpmLabel  = cpmNum  ? '$' + cpmNum.toFixed(2)  : '—';
    var valLabel  = valNum  ? '$' + (valNum >= 1000 ? Math.round(valNum / 1000) + 'K' : valNum) : '—';

    var badge;
    if (typeRaw === 'live') {
      badge = '<span style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:10px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca">Live</span>';
    } else if (typeRaw === 'vod' || typeRaw === 'ads') {
      badge = '<span style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:10px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">VoD</span>';
    } else {
      badge = '<span style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:10px;background:var(--bg);color:var(--muted);border:1px solid var(--border)">' + (typeRaw || 'OLV') + '</span>';
    }
    var chCount = Array.isArray(channels) ? channels.length : 0;
    var chHtml  = chCount ? '<span style="font-size:9px;color:var(--faint);margin-left:4px">' + chCount + ' ch.</span>' : '';
    return '<tr onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD + '">'
      +   '<div style="font-size:11px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + name + '</div>'
      +   '<div style="display:flex;align-items:center;margin-top:2px">' + badge + chHtml + '</div>'
      + '</td>'
      + '<td style="' + TD + ';text-align:right;font-size:11px;color:var(--text);white-space:nowrap">' + imprLabel + '</td>'
      + '<td style="' + TD + ';text-align:right;font-size:11px;color:var(--text);white-space:nowrap">' + cpmLabel  + '</td>'
      + '<td style="' + TD + ';text-align:right;font-size:11px;color:var(--text);white-space:nowrap">' + valLabel  + '</td>'
      + '</tr>';
  }).join('');

  var totImprLabel = totalImpr >= 1000000 ? (totalImpr / 1000000).toFixed(1) + 'M' : totalImpr >= 1000 ? Math.round(totalImpr / 1000) + 'K' : totalImpr ? String(totalImpr) : '—';
  var totValLabel  = totalVal  ? '$' + (totalVal  >= 1000 ? Math.round(totalVal  / 1000) + 'K' : totalVal)  : '—';
  var avgCpm       = (totalImpr && totalVal) ? (totalVal / totalImpr * 1000) : 0;
  var avgCpmLabel  = avgCpm ? '$' + avgCpm.toFixed(2) : '—';
  var TOT = 'padding:7px 10px;font-size:11px;font-weight:700;color:var(--text);border-top:2px solid var(--border-md);background:var(--bg);white-space:nowrap';
  var totRow = '<tr>'
    + '<td style="' + TOT + '">Total</td>'
    + '<td style="' + TOT + ';text-align:right">' + totImprLabel + '</td>'
    + '<td style="' + TOT + ';text-align:right">' + avgCpmLabel  + '</td>'
    + '<td style="' + TOT + ';text-align:right">' + totValLabel  + '</td>'
    + '</tr>';

  return '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr style="background:var(--bg)">'
    +   '<th style="' + TH + ';text-align:left">Moment</th>'
    +   '<th style="' + TH + ';text-align:right;width:64px">Impr.</th>'
    +   '<th style="' + TH + ';text-align:right;width:56px">CPM</th>'
    +   '<th style="' + TH + ';text-align:right;width:60px">$ Value</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '<tfoot>' + totRow + '</tfoot>'
    + '</table>';
}

function _cmMpPanelInnerHtml() {
  var rightCols = _cmSelectedAnalysis
    ? '<div style="flex:0 0 29%;min-width:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">'
      +   '<div style="padding:12px 16px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Moments Groups</div>'
      +   '<div id="cm-mp-plans-col" style="overflow-y:auto">' + _cmMpPlansColHtml() + '</div>'
      + '</div>'
      + '<div style="flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden">'
      +   '<div style="padding:12px 16px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Moments</div>'
      +   '<div id="cm-mp-moments-col" style="flex:1;overflow-y:auto;border-top:1px solid var(--border)">' + _cmMpMomentsColHtml() + '</div>'
      + '</div>'
    : '<div style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;padding:20px">'
      +   '<div onclick="cmGoToMomentsMatch()" style="border:1.5px dashed var(--border-md);border-radius:10px;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:32px 24px;width:100%;text-align:center;cursor:pointer;transition:border-color .15s,background .15s" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.03)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'">'
      +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="8" height="8" rx="2"/><path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2"/><path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"/></svg>'
      +     '<div style="font-size:12px;font-weight:600;color:var(--text)">Run a Moments Match analysis</div>'
      +     '<div style="font-size:11px;color:var(--muted)">' + (_cmCurrentCampaignDbId ? 'Opens the wizard pre-filled with this campaign' : 'Click to open the Moments Match wizard') + '</div>'
      +     '<button onclick="event.stopPropagation();cmGoToMomentsMatch()" style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;font-size:11px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">'
      +       '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
      +       'New Analysis'
      +     '</button>'
      +   '</div>'
      + '</div>';

  return '<div style="display:flex;align-items:stretch;min-height:280px">'
    + '<div style="flex:0 0 32%;min-width:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden">'
    +   '<div style="padding:12px 16px 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Analyses</div>'
    +   '<div id="cm-mp-lib-col" style="flex:1;overflow:hidden">' + _cmMpLibColHtml() + '</div>'
    + '</div>'
    + rightCols
    + '</div>'
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:14px">'
    +   '<span id="cm-mp-feedback" style="font-size:12px;font-weight:600;opacity:0;transition:opacity .4s"></span>'
    +   '<button id="cm-mp-save-btn" onclick="cmSaveAnalysis()" style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Assign Analysis to Campaign</button>'
    + '</div>';
}

function _cmMomentsPillHtml() {
  function btn(mode, label) {
    var act = _cmMomentsMode === mode;
    return '<button type="button" onclick="cmSwitchMomentsMode(\'' + mode + '\')" style="height:20px;padding:0 9px;border:none;border-radius:3px;font-size:10px;font-weight:' + (act ? '600' : '500') + ';cursor:pointer;font-family:inherit;background:' + (act ? '#fff' : 'transparent') + ';color:' + (act ? 'var(--accent)' : '#9ca3af') + ';box-shadow:' + (act ? '0 1px 2px rgba(0,0,0,.1)' : 'none') + ';transition:background .12s,color .12s;white-space:nowrap">' + label + '</button>';
  }
  return '<div style="display:inline-flex;background:#f3f4f6;border-radius:5px;padding:2px;gap:1px">'
    + btn('moments', 'Moments match')
    + btn('custom',  'Custom moments')
    + '</div>';
}
function cmSwitchMomentsMode(mode) {
  _cmMomentsMode = mode;
  var panel = document.getElementById('cm-moments-panel');
  if (panel) panel.innerHTML = _cmMomentsInnerHtml();
}
function _cmMomentsInnerHtml() {
  return '<div style="padding:14px 20px 0">'
    +   _cmMomentsPillHtml()
    + '</div>'
    + '<div id="cm-mp-panel" style="border-top:1px solid var(--border);margin-top:10px">'
    + (_cmMomentsMode === 'custom'
        ? '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 24px;gap:12px;color:var(--muted);text-align:center">'
          + '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="opacity:.35"><path d="M12 3a9 9 0 100 18A9 9 0 0012 3z"/><path d="M12 8v4l3 3"/></svg>'
          + '<div style="font-size:13px;font-weight:600;color:var(--text);opacity:.5">Custom moments coming soon</div>'
          + '<div style="font-size:12px;color:var(--muted);max-width:280px;line-height:1.5">Define your own moment categories to target specific content contexts beyond the standard Moments library.</div>'
          + '</div>'
        : _cmMpPanelInnerHtml())
    + '</div>';
}

// Navigate to Moments Match wizard, pre-filling from campaign setup state:
//   • Saved campaign  → land on step 1 pre-filled with campaign data
//   • No saved campaign but draft creatives exist → land on step 3 pre-filled with those creatives
function cmGoToMomentsMatch() {
  var c = _cmCurrentCampaignDbId
    ? (CM_CAMPAIGNS || []).find(function(x) { return String(x.dbId) === String(_cmCurrentCampaignDbId); })
    : null;
  if (c && c.dbId) {
    // Case 1 – saved campaign: pre-fill step 1
    _mp2PendingCampaign = {
      dbId:            c.dbId,
      name:            c.name         || '',
      advertiser:      c.advertiser   || '',
      advertiserId:    c.advertiserId || null,
      client:          c.client       || '',
      clientOrgId:     c.clientOrgId  || _cmCurrentClientOrgId || null,
      status:          c.status       || 'draft',
      budget:          c.budget       || '',
      impression_goal: c.goal         || '',
    };
    _mp2PendingCreatives = null;
  } else if (_cmDraftCreatives && _cmDraftCreatives.length > 0) {
    // Case 2 – no saved campaign but draft creatives: skip to step 3
    _mp2PendingCampaign  = null;
    _mp2PendingCreatives = _cmDraftCreatives.map(function(a) {
      return {
        id:        a.id,
        dbId:      a.dbId  || null,
        name:      a.name  || '',
        thumb:     a.thumb || '',
        fileType:  a.type  || '',
        mediaType: '',
        templates: a.templates || [],
        campaign:  '',
        advertiser: '',
        assetLink: a.src       || '',
        assetType: a.assetType || '',
      };
    });
  } else {
    _mp2PendingCampaign  = null;
    _mp2PendingCreatives = null;
  }
  if (typeof setPage === 'function') setPage('media-planner-v2', 'Moments Match', true);
}

function cmLoadMediaPlanPanel() {
  function _applyPendingSelection() {
    // Auto-select pending analysis + Moments Group (set by Save & Distribute flow)
    if (_cmPendingAnalysisId && _cmMpLibrary && _cmMpLibrary.length) {
      var _a = _cmMpLibrary.find(function(x) { return String(x.moments_match_analysis_id) === String(_cmPendingAnalysisId); });
      if (_a) {
        _cmSelectedAnalysis = _a;
        if (_cmPendingMpId && Array.isArray(_a.moments_groups)) {
          var _mpIdx = _a.moments_groups.findIndex(function(p) { return String(p.ad_group_id) === String(_cmPendingMpId); });
          if (_mpIdx >= 0) {
            _cmSelectedMp = Object.assign({}, _a.moments_groups[_mpIdx], { _idx: _mpIdx });
          }
        }
      }
      _cmPendingAnalysisId = null;
      _cmPendingMpId       = null;
    }
  }
  // If we have a pending deep-link (from Save & Distribute), always force a fresh fetch
  // so the newly-saved Moments Group is included in the library — the cache may be stale.
  if (_cmMpLibrary !== null && !_cmPendingAnalysisId) {
    _applyPendingSelection();
    var el = document.getElementById('cm-mp-panel');
    if (el) el.innerHTML = _cmMpPanelInnerHtml();
    return;
  }
  _cmMpLibrary = [];
  fetch('/api/moments-match')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _cmMpLibrary = data.analyses || [];
      _applyPendingSelection();
      var el = document.getElementById('cm-mp-panel');
      if (el) el.innerHTML = _cmMpPanelInnerHtml();
    })
    .catch(function() { _cmMpLibrary = []; });
}

function cmMpLibSearch(q) {
  _cmMpLibSearch = q || '';
  var el = document.getElementById('cm-mp-lib-col');
  if (el) el.innerHTML = _cmMpLibColHtml();
}

function cmMpPlansSearch(q) {
  _cmMpPlansSearch = q || '';
  var el = document.getElementById('cm-mp-plans-col');
  if (el) el.innerHTML = _cmMpPlansColHtml();
}

function cmSelectMediaPlan(planIdx) {
  if (!_cmSelectedAnalysis) return;
  var plans = _cmParseMpPlans();
  var plan = plans[planIdx];
  if (!plan) return;
  _cmSelectedMp = (_cmSelectedMp && _cmSelectedMp._idx === planIdx) ? null : Object.assign({}, plan, { _idx: planIdx });
  var plansEl   = document.getElementById('cm-mp-plans-col');
  var momentsEl = document.getElementById('cm-mp-moments-col');
  if (plansEl)   plansEl.innerHTML   = _cmMpPlansColHtml();
  if (momentsEl) momentsEl.innerHTML = _cmMpMomentsColHtml();
}

function cmAnalysisLibToggle(analysisId) {
  var a = (_cmMpLibrary || []).find(function(x) { return x.moments_match_analysis_id === analysisId; });
  if (!a) return;
  _cmSelectedAnalysis = (_cmSelectedAnalysis && _cmSelectedAnalysis.moments_match_analysis_id === analysisId) ? null : a;
  _cmSelectedMp = null;
  var panelEl = document.getElementById('cm-mp-panel');
  if (panelEl) panelEl.innerHTML = _cmMpPanelInnerHtml();
}

function cmAnalysisDeselect() {
  _cmSelectedAnalysis = null;
  _cmSelectedMp = null;
  var panelEl = document.getElementById('cm-mp-panel');
  if (panelEl) panelEl.innerHTML = _cmMpPanelInnerHtml();
}

function cmSaveAnalysis() {
  var btn = document.getElementById('cm-mp-save-btn');
  var fb  = document.getElementById('cm-mp-feedback');
  function _showFb(msg, color) {
    if (!fb) return;
    fb.textContent = msg; fb.style.color = color; fb.style.opacity = '1';
    setTimeout(function() { fb.style.opacity = '0'; }, 3000);
  }
  if (!_cmCurrentCampaignDbId) { _showFb('Save the campaign first', '#dc2626'); return; }
  if (!_cmSelectedAnalysis)    { _showFb('Select an analysis first',  '#dc2626'); return; }
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  fetch('/api/campaigns-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: _cmCurrentCampaignDbId, moments_match_analysis_id: _cmSelectedAnalysis.moments_match_analysis_id })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
    if (data.ok) {
      _showFb('Saved ✓', 'var(--accent)');
      // Update in-memory campaign so step badge flips to Ready immediately
      var _dbId = _cmCurrentCampaignDbId;
      var _camp = CM_CAMPAIGNS.filter(function(x) { return x.dbId === _dbId; })[0];
      if (_camp) {
        _camp.analysisCount = Math.max((_camp.analysisCount || 0) + 1, 1);
      }
      cmRefreshStepBadges();
    } else {
      _showFb(data.error || 'Error saving', '#dc2626');
    }
  })
  .catch(function() { _showFb('Network error', '#dc2626'); })
  .finally(function() {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  });
}

// ── Partner panel (step 3) ────────────────────────────────────────────────────

function _cmPartnerTypeBadge(type) {
  var dsp = type === 'DSP';
  return '<span style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;'
    + (dsp ? 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe'
           : 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0')
    + '">' + (type || '—') + '</span>';
}

function _cmPartnerFilteredConns() {
  var q    = (_cmPartnerSearch || '').toLowerCase();
  var list = _cmDspConnections || [];
  return list.filter(function(conn) {
    var lib  = _cmDspLibraryMap[conn.library_id] || {};
    var name = (lib.name || '').toLowerCase();
    return !q || name.indexOf(q) >= 0;
  });
}

function _cmPartnerGridColHtml() {
  // Guard: client and advertiser must be set in Step 1 first
  if (!_cmDraftClient || !_cmDraftAdv) {
    var missing = [];
    if (!_cmDraftClient) missing.push('Client');
    if (!_cmDraftAdv)    missing.push('Advertiser');
    return '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface);padding:20px">'
      + UI.alertBanner('warning', '', 'Select ' + missing.join(' and ') + ' in Step 1 — Campaign Details before choosing partners.')
      + '</div>';
  }

  var filtered = _cmPartnerFilteredConns();
  var search = '<div style="padding:10px 16px;border-bottom:1px solid var(--border)">'
    + UI.searchBar('cm-partner-search', 'Search platforms…', 'cmPartnerSearch(this.value)', _cmPartnerSearch || '')
    + '</div>';

  var grid = '';
  if (!_cmDspConnections) {
    grid = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--faint)">Loading…</div>';
  } else if (filtered.length === 0) {
    grid = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--faint)">No platforms connected for this client.</div>';
  } else {
    var logoFn = (typeof _dspLogoHtml === 'function') ? _dspLogoHtml : function(n) {
      return '<div style="width:36px;height:36px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff">' + (n||'?').slice(0,2).toUpperCase() + '</div>';
    };
    var cards = filtered.map(function(conn) {
      var lib    = _cmDspLibraryMap[conn.library_id] || {};
      var name   = lib.name || 'Unknown';
      var type   = lib.type || '';
      var isAdded = _cmDraftPartners.some(function(p) { return p.connectionId === conn.connection_id; });
      var border = isAdded ? '2px solid var(--accent)' : '1px solid var(--border)';
      var bg     = isAdded ? 'rgba(237,0,94,.03)' : 'var(--surface)';
      var tick   = isAdded
        ? '<div style="position:absolute;top:8px;right:8px;width:16px;height:16px;border-radius:4px;background:var(--accent);display:flex;align-items:center;justify-content:center">'
          + '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          + '</div>'
        : '';
      var seatRow = conn.seat_id
        ? '<div style="font-size:10px;color:var(--muted);margin-top:2px">Seat: ' + conn.seat_id + '</div>'
        : '';
      return '<div onclick="cmTogglePartner(' + conn.connection_id + ')" '
        + 'style="position:relative;border:' + border + ';border-radius:10px;background:' + bg + ';padding:12px;cursor:pointer;transition:border-color .15s,background .15s" '
        + 'onmouseover="this.style.borderColor=\'var(--accent)\'" '
        + 'onmouseout="this.style.borderColor=\'' + (isAdded ? 'var(--accent)' : 'var(--border)') + '\'">'
        + tick
        + '<div style="display:flex;align-items:center;gap:10px">'
        +   '<div style="flex-shrink:0">' + logoFn(name, 36) + '</div>'
        +   '<div style="min-width:0">'
        +     '<div style="font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + name + '</div>'
        +     '<div style="margin-top:3px">' + _cmPartnerTypeBadge(type) + '</div>'
        +     seatRow
        +   '</div>'
        + '</div>'
        + '</div>';
    }).join('');
    grid = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:14px">' + cards + '</div>';
  }

  return '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)">'
    + search
    + '<div style="max-height:290px;overflow-y:auto">' + grid + '</div>'
    + '</div>';
}

function _cmPartnerSelColHtml() {
  if (_cmDraftPartners.length === 0) {
    var partnerSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    return '<div style="border:1.5px dashed var(--border-md);border-radius:10px;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:28px 16px;min-height:120px">'
      + partnerSvg
      + '<div><div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">No partners added</div>'
      + '<div style="font-size:11px;color:var(--muted)">Select platforms from the grid</div></div>'
      + '</div>';
  }
  var logoFn = (typeof _dspLogoHtml === 'function') ? _dspLogoHtml : function(n) {
    return '<div style="width:28px;height:28px;border-radius:6px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">' + (n||'?').slice(0,2).toUpperCase() + '</div>';
  };
  var cards = _cmDraftPartners.map(function(p, i) {
    return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)">'
      + '<div style="padding:8px 10px;display:flex;align-items:center;gap:8px">'
      +   '<div style="flex-shrink:0">' + logoFn(p.name, 28) + '</div>'
      +   '<div style="flex:1;min-width:0">'
      +     '<div style="font-size:11px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + p.name + '</div>'
      +     '<div style="margin-top:2px;display:flex;align-items:center;gap:6px">'
      +       _cmPartnerTypeBadge(p.type)
      +       (p.seatId ? '<span style="font-size:10px;color:var(--muted)">Seat: ' + p.seatId + '</span>' : '')
      +     '</div>'
      +   '</div>'
      +   '<button onclick="cmPartnerSelRemove(' + i + ')" style="width:18px;height:18px;border:none;border-radius:3px;background:transparent;color:var(--faint);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:color .12s;flex-shrink:0" onmouseover="this.style.color=\'#ef4444\'" onmouseout="this.style.color=\'var(--faint)\'">'
      +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      +   '</button>'
      + '</div>'
      + '</div>';
  }).join('');
  return '<div style="display:flex;flex-direction:column;gap:6px">' + cards + '</div>';
}

function _cmPartnerPanelInnerHtml() {
  return '<div style="display:flex;align-items:stretch">'
    + '<div style="flex:65;min-width:0;padding:20px 24px;border-right:1px solid var(--border);display:flex;flex-direction:column">'
    +   '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:12px">Connected Platforms</div>'
    +   '<div id="cm-partner-grid-col">' + _cmPartnerGridColHtml() + '</div>'
    + '</div>'
    + '<div style="flex:35;min-width:0;padding:20px 24px;display:flex;flex-direction:column;gap:12px">'
    +   '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)">Campaign Partners</div>'
    +   '<div id="cm-partner-sel-col">' + _cmPartnerSelColHtml() + '</div>'
    + '</div>'
    + '</div>'
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:14px">'
    +   '<span id="cm-partner-feedback" style="font-size:12px;font-weight:600;opacity:0;transition:opacity .4s"></span>'
    +   '<button id="cm-partner-save-btn" onclick="cmSavePartners()" style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Add Partners to Campaign</button>'
    + '</div>';
}

function _cmPartnerInnerHtml() {
  return '<div id="cm-partner-panel" style="border-top:1px solid var(--border)">' + _cmPartnerPanelInnerHtml() + '</div>';
}

function cmLoadPartnerPanel() {
  // Guard: client and advertiser must be selected first
  if (!_cmDraftClient || !_cmDraftAdv) {
    _cmDspConnections = null; // reset so it fetches fresh when they fill step 1
    _cmDraftPartners  = [];
    var g = document.getElementById('cm-partner-grid-col');
    var s = document.getElementById('cm-partner-sel-col');
    if (g) g.innerHTML = _cmPartnerGridColHtml(); // shows the warning banner
    if (s) s.innerHTML = _cmPartnerSelColHtml();
    return;
  }
  if (!_cmCurrentClientOrgId) {
    var grid = document.getElementById('cm-partner-grid-col');
    if (grid) grid.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:var(--faint)">Save Campaign Details first to load available partners.</div>';
    return;
  }
  if (_cmDspConnections !== null) {
    // Already loaded — just re-render
    var g = document.getElementById('cm-partner-grid-col');
    var s = document.getElementById('cm-partner-sel-col');
    if (g) g.innerHTML = _cmPartnerGridColHtml();
    if (s) s.innerHTML = _cmPartnerSelColHtml();
    return;
  }
  fetch('/api/dsp-ssp?client_org_id=' + _cmCurrentClientOrgId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _cmDspLibraryMap = {};
      (data.library || []).forEach(function(item) { _cmDspLibraryMap[item.library_id] = item; });

      // Filter: show only connections eligible for this campaign
      // = org-level (advertiser_id null) OR matching this campaign's advertiser_id
      var advId = _cmCurrentAdvertiserId;
      _cmDspConnections = (data.connections || []).filter(function(conn) {
        if (conn.status !== 'active') return false;
        if (conn.advertiser_id === null || conn.advertiser_id === undefined) return true;
        return advId && conn.advertiser_id === advId;
      });

      // Pre-select partners already saved on campaign (via partnerIds)
      var c = CM_CAMPAIGNS.filter(function(x) { return x.dbId === _cmCurrentCampaignDbId; })[0];
      if (c && c.partnerIds && c.partnerIds.length) {
        _cmDraftPartners = _cmDspConnections
          .filter(function(conn) { return c.partnerIds.indexOf(conn.connection_id) >= 0; })
          .map(function(conn) {
            var lib = _cmDspLibraryMap[conn.library_id] || {};
            return { connectionId: conn.connection_id, library_id: conn.library_id, name: lib.name || '', type: lib.type || '', seatId: conn.seat_id || '' };
          });
      }
      var g = document.getElementById('cm-partner-grid-col');
      var s = document.getElementById('cm-partner-sel-col');
      if (g) g.innerHTML = _cmPartnerGridColHtml();
      if (s) s.innerHTML = _cmPartnerSelColHtml();
    })
    .catch(function() {
      var g = document.getElementById('cm-partner-grid-col');
      if (g) g.innerHTML = '<div style="padding:24px;text-align:center;font-size:12px;color:#ef4444">Failed to load partners.</div>';
    });
}

function cmTogglePartner(connectionId) {
  var already = _cmDraftPartners.some(function(p) { return p.connectionId === connectionId; });
  if (already) {
    _cmDraftPartners = _cmDraftPartners.filter(function(p) { return p.connectionId !== connectionId; });
  } else {
    var conn = (_cmDspConnections || []).filter(function(c) { return c.connection_id === connectionId; })[0];
    if (!conn) return;
    var lib = _cmDspLibraryMap[conn.library_id] || {};
    _cmDraftPartners.push({ connectionId: connectionId, library_id: conn.library_id, name: lib.name || '', type: lib.type || '', seatId: conn.seat_id || '' });
  }
  var g = document.getElementById('cm-partner-grid-col');
  var s = document.getElementById('cm-partner-sel-col');
  if (g) g.innerHTML = _cmPartnerGridColHtml();
  if (s) s.innerHTML = _cmPartnerSelColHtml();
  cmRefreshStepBadges();
}

function cmPartnerSelRemove(idx) {
  _cmDraftPartners.splice(idx, 1);
  var g = document.getElementById('cm-partner-grid-col');
  var s = document.getElementById('cm-partner-sel-col');
  if (g) g.innerHTML = _cmPartnerGridColHtml();
  if (s) s.innerHTML = _cmPartnerSelColHtml();
  cmRefreshStepBadges();
}

function cmPartnerSearch(q) {
  _cmPartnerSearch = q || '';
  var g = document.getElementById('cm-partner-grid-col');
  if (g) g.innerHTML = _cmPartnerGridColHtml();
}

function cmSavePartners() {
  var dbId = _cmCurrentCampaignDbId;
  var btn  = document.getElementById('cm-partner-save-btn');
  var fb   = document.getElementById('cm-partner-feedback');
  function _showFb(msg, color) {
    if (!fb) return;
    fb.textContent  = msg;
    fb.style.color  = color;
    fb.style.opacity = '1';
    setTimeout(function() { fb.style.opacity = '0'; }, 3000);
  }
  if (!dbId) { _showFb('Save campaign details first', '#dc2626'); return; }
  var ids = _cmDraftPartners.map(function(p) { return p.connectionId; });
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  fetch('/api/campaigns-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaign_id: dbId, partner_ids: ids })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (btn) { btn.textContent = 'Add Partners to Campaign'; btn.disabled = false; }
    if (data.error) { _showFb('Error: ' + data.error, '#dc2626'); return; }
    _showFb('Partners saved ✓', '#16a34a');
    CM_CAMPAIGNS = CM_CAMPAIGNS.map(function(c) {
      if (c.dbId !== dbId) return c;
      return Object.assign({}, c, {
        partnerIds: ids,
        partners:   _cmDraftPartners.map(function(p) { return p.name; }),
      });
    });
    cmRefreshStepBadges();
  })
  .catch(function() {
    if (btn) { btn.textContent = 'Add Partners to Campaign'; btn.disabled = false; }
    _showFb('Save failed', '#dc2626');
  });
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
    'error':       { label:'Error',       color:'#dc2626',       bg:'#fef2f2',        icon: errorIcon },
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
  var isPreLive = status === 'draft' || status === 'planned';
  var color = status === 'error'        ? '#ef4444'
            : status === 'underpacing' ? '#f59e0b'
            : isPreLive                ? 'var(--border-md)'
            : '#16a34a';
  var trackColor = 'var(--border)';
  var w = isPreLive ? 0 : Math.max(0, Math.min(100, pct));
  var label = isPreLive ? '—' : pct + '%';
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

function cmSetTab(tab) {
  _cmActiveTab = tab;
  // Re-render tab bar and table
  var navEl = document.getElementById('cm-tab-nav');
  if (navEl) navEl.innerHTML = _cmTabNavInnerHtml();
  _cmRefreshTable();
}

function _cmTabNavInnerHtml() {
  var tabs = [
    { id: 'live',      label: 'Live' },
    { id: 'draft',     label: 'Draft' },
    { id: 'completed', label: 'Completed' },
  ];
  return tabs.map(function(t) {
    var sel = _cmActiveTab === t.id;
    var count = CM_CAMPAIGNS.filter(function(c) {
      return (_cmTabGroups[t.id] || []).indexOf(c.status) >= 0;
    }).length;
    return '<button onclick="cmSetTab(\'' + t.id + '\')" style="'
      + 'display:inline-flex;align-items:center;gap:6px;'
      + 'height:32px;padding:0 14px;border:none;cursor:pointer;font-family:inherit;'
      + 'font-size:12px;font-weight:' + (sel ? '600' : '500') + ';'
      + 'color:' + (sel ? 'var(--accent)' : 'var(--muted)') + ';'
      + 'background:transparent;'
      + 'border-bottom:2px solid ' + (sel ? 'var(--accent)' : 'transparent') + ';'
      + 'transition:color .12s,border-color .12s">'
      + t.label
      + '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:16px;padding:0 5px;border-radius:99px;font-size:10px;font-weight:700;'
      + 'background:' + (sel ? 'var(--accent)' : 'var(--border-md)') + ';'
      + 'color:' + (sel ? '#fff' : 'var(--muted)') + '">' + count + '</span>'
      + '</button>';
  }).join('');
}

function cmFilteredRows() {
  var tabStatuses = _cmTabGroups[_cmActiveTab] || [];
  return CM_CAMPAIGNS.filter(function(c) {
    // Tab filter
    if (tabStatuses.indexOf(c.status) < 0) return false;
    // Search filter
    if (!cmSearch) return true;
    var q = cmSearch.toLowerCase();
    return c.name.toLowerCase().indexOf(q) >= 0
        || c.advertiser.toLowerCase().indexOf(q) >= 0
        || (c.geography || []).join(' ').toLowerCase().indexOf(q) >= 0;
  });
}

function _cmRefreshTable() {
  var tbody = document.getElementById('cm-tbody');
  if (tbody) tbody.innerHTML = _cmRowsHtml();
  var count = document.getElementById('cm-count');
  if (count) count.textContent = cmFilteredRows().length;
  // Refresh tab counters when DB loads
  var navEl = document.getElementById('cm-tab-nav');
  if (navEl) navEl.innerHTML = _cmTabNavInnerHtml();
  // Deep-link: if arriving from Save & Distribute, auto-open campaign + step 2
  if (_cmPendingCampaignDbId) {
    var _pId = _cmPendingCampaignDbId;
    _cmPendingCampaignDbId = null;
    setTimeout(function() { cmOpenDetailByDbId(_pId); }, 0);
  }
}

// ── Deep-link opener: open a campaign by DB id and jump to a specific step ────
function cmOpenDetailByDbId(dbId) {
  var c = (CM_CAMPAIGNS || []).find(function(x) { return String(x.dbId) === String(dbId); });
  if (!c) return;
  cmOpenDetail(c.id);
  // After DOM renders, open step 2 (Moments Match)
  setTimeout(function() { _cmDraftToggle(2); }, 60);
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

    var isPreLive = c.status === 'draft' || c.status === 'planned';
    var pdata = (!isPreLive && c.dbId) ? CM_PACING[c.dbId] : null;
    var delivered = isPreLive ? '—' : (pdata ? pdata.delivered : (c.impressions || '—'));
    var spent     = isPreLive ? '—' : (pdata ? pdata.spent     : (c.spent || '—'));

    var imp = '<div style="font-size:12px;font-weight:600;color:' + (isPreLive ? 'var(--faint)' : 'var(--text)') + '">' + delivered + '</div>'
      + (!isPreLive && c.goal !== '—' ? '<div style="font-size:10px;color:var(--faint);margin-top:2px">' + c.goal + '</div>' : '');

    var budget = '<div style="font-size:12px;font-weight:600;color:' + (isPreLive ? 'var(--faint)' : 'var(--text)') + '">' + spent + '</div>'
      + (!isPreLive && c.budget !== '—' ? '<div style="font-size:10px;color:var(--faint);margin-top:2px">' + c.budget + '</div>' : '');

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
        + mkIcon('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>', 'Preview in Template Builder', 'event.stopPropagation();cmPreviewCampaignCreatives(' + (c.dbId || 'null') + ')')
        + '</div>';

    var actions = '<div style="display:flex;align-items:center;gap:2px;justify-content:flex-end">'
      + mkIcon('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', 'Delete', 'event.stopPropagation();cmDeleteCampaign(' + (c.dbId || 'null') + ',this)')
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
      cmPartnerBadges(c.partners),
      imp,
      budget,
      creativesCell,
      c.status === 'draft'
        ? '<button onclick="" style="border:none;background:none;padding:0;font-size:11px;font-weight:500;color:var(--accent);cursor:pointer;font-family:inherit;white-space:nowrap">+ Add Moments Group</button>'
        : '<span style="font-size:12px;color:var(--text)">' + c.moments + ' moment' + (c.moments !== 1 ? 's' : '') + '</span>',
      '<span style="font-size:12px;color:var(--muted)">' + (c.createdBy || '—') + '</span>',
      '<span style="font-size:12px;color:var(--muted)">' + (c.createdOn || '—') + '</span>',
      actions,
    ], { onclick: 'cmOpenDetail(\'' + c.id + '\')' });
  }).join('');
}

// ── Main render ───────────────────────────────────────────────────────────────
function renderCampaignManagement() {
  // Reset so fetch always re-runs with current org filter
  _cmDBLoaded = false;
  CM_CAMPAIGNS = [];
  // Kick off DB fetch — will refresh table when data arrives
  setTimeout(cmLoadFromDB, 0);

  var newCampBtn =
    '<button onclick="cmCreateNewCampaign()" style="height:30px;padding:0 14px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px">'
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
    { label: (_cmActiveTab === 'live' ? 'Imp. Delivery' : 'Imp. Goal'), width:'110px' },
    { label: 'Budget',      width:'120px' },
    { label: 'Creatives',   width:'150px' },
    { label: 'Moments Group',  width:'160px' },
    { label: 'Created By',  width:'140px' },
    { label: 'Created On',  width:'110px' },
    { label: '',            width:'80px',  align:'right' },
  ];

  var tableHtml = UI.tableScroll(cols, _cmRowsHtml(), 'cm-tbody', 1, null, { inCard: true });

  var tabNav =
    '<div id="cm-tab-nav" style="display:flex;align-items:flex-end;gap:0;padding:0 20px;border-bottom:1px solid var(--border)">'
    + _cmTabNavInnerHtml()
    + '</div>';

  var card =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border)">'
    +   '<div>'
    +     '<div style="font-size:13px;font-weight:600;color:var(--text)">Campaigns</div>'
    +     '<div style="font-size:11px;color:var(--faint);margin-top:1px"><span id="cm-count">' + cmFilteredRows().length + '</span> campaigns</div>'
    +   '</div>'
    +   newCampBtn
    + '</div>'
    + tabNav
    + searchBox
    + tableHtml
    + '</div>';

  return UI.pageHeader({ title: 'Campaign Management', subtitle: 'Monitor and manage all active campaigns' })
    + card;
}

// ── Create new campaign → open its setup form (no DB write yet) ───────────────
function cmCreateNewCampaign() {
  // Build a temporary in-memory object — dbId is null until first Save
  var tempId = 'cm-new-' + Date.now();
  var newCampaign = {
    id:         tempId,
    dbId:       null,
    name:       '',
    client:     '',
    advertiser: '',
    status:     'draft',
    geo:        [],
    startDate:  null,
    endDate:    null,
    budget:     null,
    goal:       null,
    partners:   [],
    creatives:  0,
    moments:    0,
  };
  CM_CAMPAIGNS.unshift(newCampaign);
  // Reset draft state
  _cmDraftCreatives = [];
  _cmLibSearch = '';
  // For non-super orgs, pre-fill with selected org
  if (!_appIsSuperOrg()) {
    var _selOrg = _appDbOrgs.find(function(o){ return o.dbId === selectedClientOrgId; });
    _cmDraftClient = _selOrg ? _selOrg.name : '';
    _cmCurrentClientOrgId = selectedClientOrgId;
  } else {
    _cmDraftClient = '';
    _cmCurrentClientOrgId = null;
  }
  _cmDraftAdv = '';
  _cmDraftCampaignName = '';
  _cmNameMode = 'name';
  _cmSelectedAnalysis = null;
  _cmSelectedMp = null;
  _cmMpLibrary = null;
  _cmMpLibSearch = '';
  _cmMpPlansSearch = '';
  cmOpenDetail(tempId);
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
  var pacingColor = c.status === 'underpacing' ? '#f59e0b' : c.status === 'error' ? '#ef4444' : '#16a34a';

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

  // KPI card helper
  function kpi(label, value, sub, accent) {
    return '<div style="flex:1;padding:20px;border-right:1px solid var(--border)">'
      + '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:8px">' + label + '</div>'
      + '<div style="font-size:22px;font-weight:700;color:' + (accent || 'var(--text)') + ';line-height:1">' + value + '</div>'
      + (sub ? '<div style="font-size:11px;color:var(--faint);margin-top:5px">' + sub + '</div>' : '')
      + '</div>';
  }

  var expectedPct = 65;
  var pacingLabel = (pacingPct != null) ? pacingPct + '%' : '—';

  // ── Performance card (KPIs + pacing bar) ────────────────────────────────────
  var perfCard =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +   '<span style="font-size:13px;font-weight:600;color:var(--text)">' + (c.name || '—') + '</span>'
    +   '<span style="font-size:13px;color:var(--muted)">(' + (c.advertiser || '—') + ')</span>'
    +   (c.partners && c.partners.length ? cmPartnerBadges(c.partners) : '')
    +   '<div style="margin-left:auto">' + cmStatusChip(c.status) + '</div>'
    + '</div>'
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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function infoField(label, value) {
    return '<div style="display:flex;align-items:baseline;gap:8px;min-width:0">'
      + '<span style="font-size:10px;font-weight:600;color:var(--faint);white-space:nowrap;flex-shrink:0">' + label + '</span>'
      + '<span style="font-size:12px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + value + '</span>'
      + '</div>';
  }
  function sectionLabel(text) {
    return '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);margin-bottom:10px">' + text + '</div>';
  }

  var geo         = (c.geography || []).join(', ') || '—';
  var flight      = (c.start && c.end) ? c.start + ' → ' + c.end : '—';
  var partnersStr = (c.partners && c.partners.length) ? c.partners.join(', ') : '—';

  // ── Row 1: 3-column info card (Asset | Campaign Details | Additional Details) ─
  var infoCard =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px;display:flex;align-items:stretch">'

    // Asset column
    + '<div style="flex:1;padding:16px 20px;min-width:0">'
    +   sectionLabel('Asset')
    +   '<div id="cm-detail-creatives" style="display:flex;gap:10px;flex-wrap:wrap"><span style="font-size:12px;color:var(--faint)">Loading…</span></div>'
    + '</div>'

    + '<div style="width:1px;background:var(--border);flex-shrink:0"></div>'

    // Campaign Details column
    + '<div style="flex:1;padding:16px 20px;min-width:0">'
    +   sectionLabel('Campaign Details')
    +   '<div style="display:flex;flex-direction:column;gap:8px">'
    +     infoField('Campaign', c.name || '—')
    +     infoField('Advertiser', c.advertiser || '—')
    +     infoField('Geography', geo)
    +     infoField('Flight Dates', flight)
    +     infoField('Status', cmStatusChip(c.status))
    +   '</div>'
    + '</div>'

    + '<div style="width:1px;background:var(--border);flex-shrink:0"></div>'

    // Additional Details column
    + '<div style="flex:1;padding:16px 20px;min-width:0">'
    +   sectionLabel('Additional Details')
    +   '<div style="display:flex;flex-direction:column;gap:8px">'
    +     infoField('Goal', c.goal || '—')
    +     infoField('Budget', c.budget || '—')
    +     infoField('Delivered', delivered)
    +     infoField('Spent', spent)
    +     infoField('Partners', partnersStr)
    +   '</div>'
    + '</div>'

    + '</div>';

  // ── Row 2: Moments table card ─────────────────────────────────────────────────
  var momentsCard =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:20px">'
    + '<div style="padding:12px 20px;border-bottom:1px solid var(--border)">'
    +   '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--faint)">Moments</span>'
    + '</div>'
    + '<div id="cm-detail-plan"><div style="padding:32px;text-align:center;font-size:12px;color:var(--faint)">Loading…</div></div>'
    + '</div>';

  if (c.dbId) {
    setTimeout(function() {
      _cmLoadPacingCreatives(c.dbId);
      _cmLoadPacingPlan(c.dbId);
    }, 0);
  } else {
    setTimeout(function() {
      var ec = document.getElementById('cm-detail-creatives');
      var ep = document.getElementById('cm-detail-plan');
      if (ec) ec.innerHTML = '<span style="font-size:12px;color:var(--faint)">Not available for mock campaigns.</span>';
      if (ep) ep.innerHTML = '<div style="padding:32px;text-align:center;font-size:12px;color:var(--faint)">Not available for mock campaigns.</div>';
    }, 0);
  }

  return UI.pageHeader({
      breadcrumb: [
        { label: 'Campaign Management', onclick: 'setPage(\'campaign-management\',\'Campaign Management\')' },
        { label: c.name }
      ],
      title: c.name,
      subtitle: (c.client ? c.client + ' · ' : '') + c.advertiser + ' · ' + c.geography.join(', '),
    })
    + perfCard
    + infoCard
    + momentsCard;
}

// ── Pacing detail: load creatives ─────────────────────────────────────────────
function _cmLoadPacingCreatives(dbId) {
  fetch('/api/creatives?campaign_id=' + dbId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var el = document.getElementById('cm-detail-creatives');
      if (!el) return;
      var list = data.creatives || [];
      if (!list.length) {
        el.innerHTML = '<span style="font-size:12px;color:var(--faint);font-style:italic">No assets linked to this campaign.</span>';
        return;
      }
      // Map DB creative fields to the format expected by _mp2CreativeTilesHtml
      var mapped = list.map(function(cr) {
        return {
          id:        cr.creative_id || cr.id || ('cr' + Math.random()),
          name:      cr.creative_name || cr.name || cr.creative_id || '—',
          thumb:     cr.thumb || cr.file_url || '',
          type:      cr.fileType || cr.creative_asset_type || 'VoD',
          templates: cr.templates || []
        };
      });
      if (typeof _mp2CreativeTilesHtml === 'function') {
        el.innerHTML = _mp2CreativeTilesHtml(mapped);
      } else {
        // Fallback inline tile render
        el.innerHTML = mapped.map(function(cr) {
          var thumbHtml = cr.thumb
            ? '<img src="' + cr.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block">'
            : '<div style="width:100%;height:100%;background:#e5e7eb;display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9l5-5 4 4 3-3 6 6"/></svg></div>';
          return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);width:140px;flex-shrink:0;display:flex;flex-direction:column">'
            + '<div style="aspect-ratio:16/9;background:#e5e7eb;overflow:hidden;position:relative">' + thumbHtml
            +   '<div style="position:absolute;top:4px;left:4px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.5);color:#fff">' + cr.type + '</div>'
            + '</div>'
            + '<div style="padding:4px 6px"><div style="font-size:10px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + cr.name + '</div></div>'
            + '</div>';
        }).join('');
      }
    })
    .catch(function() {
      var el = document.getElementById('cm-detail-creatives');
      if (el) el.innerHTML = '<span style="font-size:12px;color:var(--faint)">Could not load creatives.</span>';
    });
}

// ── Pacing detail: load Moments Group moments table ──────────────────────────────
function _cmLoadPacingPlan(dbId) {
  var TH  = 'padding:9px 12px;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);border-bottom:1px solid var(--border);white-space:nowrap';
  var TOT = 'padding:10px 12px;font-size:12px;font-weight:600;color:var(--text);border-top:2px solid var(--border-md);background:var(--bg)';

  fetch('/api/ad-groups?campaign_id=' + dbId)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var el = document.getElementById('cm-detail-plan');
      if (!el) return;
      var rows = data.moments_groups || [];
      if (!rows.length) {
        el.innerHTML = '<div style="padding:32px;text-align:center;font-size:12px;color:var(--faint)">No Moments Group linked.</div>';
        return;
      }

      // Deduplicate by moment_id
      var seen = {};
      var unique = rows.filter(function(r) {
        if (seen[r.moment_id]) return false;
        seen[r.moment_id] = true;
        return true;
      });

      // Accumulate totals
      var totalImpr = 0;
      var totalCpm  = 0;
      var cpmCount  = 0;

      var rowsHtml = unique.map(function(r) {
        var det      = r.moment_details || {};
        var mock     = (typeof momentById === 'function' && momentById(r.moment_id)) || {};
        var name     = det.moment_name || mock.moment_name || r.moment_id;
        var type     = det.moment_type || mock.moment_type || '';
        var pods     = (det.pods !== undefined && det.pods !== null) ? det.pods : (mock.pods !== undefined ? mock.pods : '—');
        var channels = det.channels || mock.channels || [];
        var imprRaw  = Number(r.est_impressions) || 0;
        var cpmRaw   = parseFloat(r.est_cpm) || 0;

        totalImpr += imprRaw;
        if (cpmRaw > 0) { totalCpm += cpmRaw; cpmCount++; }

        var imprLabel = (typeof fmtMomentImpr === 'function') ? fmtMomentImpr(imprRaw)
          : (imprRaw ? (imprRaw / 1000000).toFixed(1) + 'M' : '—');
        var cpmLabel  = cpmRaw > 0 ? '$' + cpmRaw.toFixed(2) : '—';
        var dollar    = imprRaw > 0 && cpmRaw > 0 ? (imprRaw / 1000) * cpmRaw : 0;
        var dolLabel  = dollar > 0
          ? '$' + (dollar >= 1000000 ? (dollar / 1000000).toFixed(1) + 'M'
                   : dollar >= 1000 ? (dollar / 1000).toFixed(0) + 'K'
                   : dollar.toFixed(0))
          : '—';

        var rowType  = type.toLowerCase();
        var typeBadge = rowType === 'live'
          ? '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:2px 8px;color:#dc2626;white-space:nowrap"><span style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;box-shadow:0 0 4px #ef4444"></span>Live</span>'
          : rowType === 'organic pause' || rowType === 'organic'
          ? '<span style="font-size:10px;font-weight:600;background:#f0fdfa;border:1px solid #99f6e4;border-radius:20px;padding:2px 8px;color:#0f766e;white-space:nowrap">Organic Pause</span>'
          : type
          ? '<span style="font-size:10px;font-weight:600;background:#eff6ff;border:1px solid #bfdbfe;border-radius:20px;padding:2px 8px;color:#1d4ed8;white-space:nowrap">VoD</span>'
          : '';

        var chCount = channels.length;
        var chList  = channels.join(', ');
        var chChip  = chCount > 0
          ? '<div style="position:relative;display:inline-block" onmouseenter="this.querySelector(\'.cm-ch-tt\').style.display=\'block\'" onmouseleave="this.querySelector(\'.cm-ch-tt\').style.display=\'none\'">'
          +   '<span style="font-size:10px;font-weight:500;color:var(--muted);background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:2px 8px;cursor:default;white-space:nowrap">' + chCount + ' channel' + (chCount > 1 ? 's' : '') + '</span>'
          +   '<div class="cm-ch-tt" style="display:none;position:absolute;left:0;top:calc(100% + 4px);z-index:200;background:#1e293b;color:#e2e8f0;font-size:10px;line-height:1.6;padding:6px 10px;border-radius:7px;box-shadow:0 4px 16px rgba(0,0,0,.2);white-space:nowrap;pointer-events:none">' + chList + '</div>'
          + '</div>'
          : '<span style="color:var(--faint)">—</span>';

        return '<tr style="border-bottom:1px solid var(--border)">'
          + '<td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text)">' + name + '</td>'
          + '<td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text);text-align:right;white-space:nowrap">' + pods + '</td>'
          + '<td style="padding:10px 12px">' + typeBadge + '</td>'
          + '<td style="padding:10px 12px">' + chChip + '</td>'
          + '<td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text);text-align:right;white-space:nowrap">' + imprLabel + '</td>'
          + '<td style="padding:10px 12px;font-size:12px;font-weight:500;color:var(--text);text-align:right;white-space:nowrap">' + cpmLabel + '</td>'
          + '<td style="padding:10px 12px;font-size:12px;font-weight:600;color:var(--text);text-align:right;white-space:nowrap">' + dolLabel + '</td>'
          + '</tr>';
      }).join('');

      // Totals row
      var avgCpm     = cpmCount > 0 ? totalCpm / cpmCount : 0;
      var totImprLbl = totalImpr > 0 ? (totalImpr / 1000000).toFixed(1) + 'M' : '—';
      var totCpmLbl  = avgCpm   > 0 ? '$' + avgCpm.toFixed(2) : '—';
      var totDollar  = totalImpr > 0 && avgCpm > 0 ? (totalImpr / 1000) * avgCpm : 0;
      var totDolLbl  = totDollar > 0
        ? '$' + (totDollar >= 1000000 ? (totDollar / 1000000).toFixed(1) + 'M'
                  : totDollar >= 1000 ? (totDollar / 1000).toFixed(0) + 'K'
                  : totDollar.toFixed(0))
        : '—';

      el.innerHTML =
        '<table style="width:100%;border-collapse:collapse">'
        + '<thead><tr style="background:var(--bg)">'
        +   '<th style="text-align:left;'  + TH + '">Moment</th>'
        +   '<th style="text-align:right;' + TH + '">PODs</th>'
        +   '<th style="text-align:left;'  + TH + '">Type</th>'
        +   '<th style="text-align:left;'  + TH + '">Channels</th>'
        +   '<th style="text-align:right;' + TH + '">Est. Imp.</th>'
        +   '<th style="text-align:right;' + TH + '">Est. CPM</th>'
        +   '<th style="text-align:right;' + TH + '">Est. $ Value</th>'
        + '</tr></thead>'
        + '<tbody>' + rowsHtml + '</tbody>'
        + '<tfoot><tr>'
        +   '<td style="' + TOT + '">Total</td>'
        +   '<td style="' + TOT + '"></td>'
        +   '<td style="' + TOT + '"></td>'
        +   '<td style="' + TOT + '"></td>'
        +   '<td style="' + TOT + ';text-align:right">' + totImprLbl + '</td>'
        +   '<td style="' + TOT + ';text-align:right">' + totCpmLbl + '</td>'
        +   '<td style="' + TOT + ';text-align:right">' + totDolLbl + '</td>'
        + '</tr></tfoot>'
        + '</table>';
    })
    .catch(function() {
      var el = document.getElementById('cm-detail-plan');
      if (el) el.innerHTML = '<div style="padding:32px;text-align:center;font-size:12px;color:var(--faint)">Could not load Moments Group.</div>';
    });
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
var _cmDraftClient       = '';
var _cmDraftGeo          = [];
var _cmDraftAdv          = '';
var _cmDraftFlight       = { start:'', end:'' };
var _cmDraftCampaignName = '';
var _cmNameMode          = 'name'; // 'name' | 'id'
var _cmCurrentCampaignDbId  = null; // set when _cmSetupChecklist renders
var _cmCurrentClientOrgId   = null; // client_org_id of the campaign being edited
var _cmCurrentAdvertiserId  = null; // advertiser_id of the campaign being edited

// ── Partner panel state ───────────────────────────────────────────────────────
var _cmDraftPartners  = [];   // [{ connectionId, library_id, name, type, seatId }]
var _cmPartnerSearch  = '';
var _cmDspConnections = null; // null = not yet loaded; [] = loaded (may be empty)
var _cmDspLibraryMap  = {};   // library_id → { name, type, ... }

// ── Client picker ─────────────────────────────────────────────────────────────
function cmDraftClientToggle(e) {
  if (e) e.stopPropagation();
  var panel = document.getElementById('cm-draft-client-panel');
  var btn   = document.getElementById('cm-draft-client-btn');
  if (!panel) return;
  var open = panel.style.display !== 'none';
  if (open) { panel.style.display = 'none'; if (btn) btn.style.borderColor = 'var(--border-md)'; return; }
  _cmBuildClientList('');
  var rect = btn.getBoundingClientRect();
  panel.style.cssText = 'display:block;position:fixed;z-index:9999;width:' + Math.max(rect.width,220) + 'px;left:' + rect.left + 'px;top:' + (rect.bottom+4) + 'px;background:var(--surface);border:1px solid var(--border-md);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);overflow:hidden';
  if (btn) btn.style.borderColor = 'var(--accent)';
  setTimeout(function() {
    var si = document.getElementById('cm-draft-client-search');
    if (si) si.focus();
    document.addEventListener('click', function _h(ev) {
      var p = document.getElementById('cm-draft-client-panel');
      var b = document.getElementById('cm-draft-client-btn');
      if (p && !p.contains(ev.target) && b && !b.contains(ev.target)) {
        p.style.display = 'none'; if (b) b.style.borderColor = 'var(--border-md)';
        document.removeEventListener('click', _h);
      }
    });
  }, 0);
}

function _cmBuildClientList(q) {
  var list = document.getElementById('cm-draft-client-list');
  if (!list) return;
  q = (q||'').toLowerCase();
  var orgs = (typeof _appClientOrgs === 'function' ? _appClientOrgs() : (typeof APP_ORGS !== 'undefined' ? APP_ORGS : []));
  var notSelRow = !q
    ? '<div onclick="cmDraftClientPick(\'\',null)" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;font-weight:' + (!_cmDraftClient?'600':'400') + ';border-bottom:1px solid var(--border);margin-bottom:2px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<span style="color:var(--faint);font-style:italic">Not selected</span>'
      + (!_cmDraftClient ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>' : '';
  list.innerHTML = notSelRow + (orgs.filter(function(o){ return !q || o.name.toLowerCase().indexOf(q) >= 0; }).map(function(o) {
    var sel = _cmDraftClient === o.name;
    return '<div onclick="cmDraftClientPick(\'' + o.name.replace(/'/g,"\\'") + '\',' + (o.dbId || 'null') + ')" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;font-weight:' + (sel?'600':'400') + '" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div>'
      +   '<span style="color:var(--text)">' + o.name + '</span>'
      +   (o.type ? '<span style="font-size:10px;color:var(--faint);margin-left:6px">' + o.type + '</span>' : '')
      + '</div>'
      + (sel ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No results</div>');
}

function cmDraftClientPick(name, orgId) {
  _cmDraftClient = name;
  _cmCurrentClientOrgId = orgId || null;
  _cmBuildClientList(document.getElementById('cm-draft-client-search') ? document.getElementById('cm-draft-client-search').value : '');
  var lbl = document.getElementById('cm-draft-client-lbl');
  if (lbl) { lbl.textContent = name || 'Not selected'; lbl.style.color = name ? '' : 'var(--faint)'; lbl.style.fontStyle = name ? '' : 'italic'; }
  var panel = document.getElementById('cm-draft-client-panel');
  var btn   = document.getElementById('cm-draft-client-btn');
  if (panel) panel.style.display = 'none';
  if (btn) btn.style.borderColor = 'var(--border-md)';
  // Reset advertiser when client changes and update its button state live
  _cmDraftAdv = '';
  var advBtn = document.getElementById('cm-draft-adv-btn');
  var advLbl = document.getElementById('cm-draft-adv-lbl');
  if (advBtn) {
    advBtn.style.opacity    = name ? '' : '0.45';
    advBtn.style.cursor     = name ? '' : 'not-allowed';
  }
  if (advLbl) {
    advLbl.textContent   = name ? 'Not selected' : 'Select a client first';
    advLbl.style.color   = 'var(--faint)';
    advLbl.style.fontStyle = 'italic';
  }
  // Close adv panel if open
  var advPanel = document.getElementById('cm-draft-adv-panel');
  if (advPanel) advPanel.style.display = 'none';
  // Refresh creatives panel if open
  var p1 = document.getElementById('cm-draft-panel-1');
  if (p1 && p1.style.display !== 'none') cmLoadCreativesPanel();
}

function _cmGeoTriggerText() {
  return _cmDraftGeo.length ? _cmDraftGeo.join(', ') : 'Not selected';
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
  var notSelRow = !q
    ? '<div onclick="cmDraftGeoClear()" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;border-bottom:1px solid var(--border);margin-bottom:2px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (!_cmDraftGeo.length?'var(--accent)':'var(--border-md)') + ';background:' + (!_cmDraftGeo.length?'var(--accent)':'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (!_cmDraftGeo.length ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span style="color:var(--faint);font-style:italic">Not selected</span>'
      + '</div>' : '';
  list.innerHTML = notSelRow + (CM_GEO_OPTIONS.filter(function(o){ return !q || o.label.toLowerCase().indexOf(q)>=0 || o.code.toLowerCase().indexOf(q)>=0; }).map(function(o) {
    var sel = _cmDraftGeo.indexOf(o.code) >= 0;
    return '<div onclick="cmDraftGeoPick(\'' + o.code + '\')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (sel?'var(--accent)':'var(--border-md)') + ';background:' + (sel?'var(--accent)':'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (sel ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span>' + o.code + '</span><span style="color:var(--faint);font-size:11px">' + o.label + '</span>'
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No results</div>');
}

function cmDraftGeoClear() {
  _cmDraftGeo = [];
  _cmBuildGeoList('');
  var lbl = document.getElementById('cm-draft-geo-lbl');
  if (lbl) { lbl.textContent = 'Not selected'; lbl.style.color = 'var(--faint)'; lbl.style.fontStyle = 'italic'; }
}

function cmDraftGeoPick(code) {
  var idx = _cmDraftGeo.indexOf(code);
  if (idx >= 0) _cmDraftGeo.splice(idx, 1); else _cmDraftGeo.push(code);
  _cmBuildGeoList(document.getElementById('cm-draft-geo-search') ? document.getElementById('cm-draft-geo-search').value : '');
  var lbl = document.getElementById('cm-draft-geo-lbl');
  if (lbl) { lbl.textContent = _cmGeoTriggerText(); lbl.style.color = _cmDraftGeo.length ? '' : 'var(--faint)'; lbl.style.fontStyle = _cmDraftGeo.length ? '' : 'italic'; }
}

function cmDraftAdvToggle(e) {
  if (e) e.stopPropagation();
  if (!_cmDraftClient) return; // client must be selected first
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
  // Use DB advertisers filtered by currently selected client org
  var all  = (typeof _appDbAdvertisers !== 'undefined' && _appDbAdvertisers.length)
    ? _appDbAdvertisers
    : [];
  var advs = _cmCurrentClientOrgId
    ? all.filter(function(a) { return String(a.client_org_id) === String(_cmCurrentClientOrgId); })
    : all;
  var notSelRow = !q
    ? '<div onclick="cmDraftAdvPick(\'\',null)" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;font-weight:' + (!_cmDraftAdv?'600':'400') + ';border-bottom:1px solid var(--border);margin-bottom:2px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<span style="color:var(--faint);font-style:italic">Not selected</span>'
      + (!_cmDraftAdv ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>' : '';
  list.innerHTML = notSelRow + (advs.filter(function(a){ return !q || a.advertiser_name.toLowerCase().indexOf(q)>=0; }).map(function(a) {
    var sel = _cmDraftAdv === a.advertiser_name;
    return '<div onclick="cmDraftAdvPick(\'' + a.advertiser_name.replace(/'/g,"\\'") + '\',' + a.advertiser_id + ')" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;font-weight:' + (sel?'600':'400') + '" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<span style="color:var(--text)">' + a.advertiser_name + '</span>'
      + (sel ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No advertisers for this client</div>');
}

function cmDraftAdvPick(name, advId) {
  _cmDraftAdv = name;
  _cmCurrentAdvertiserId = advId || null;
  _cmBuildAdvList(document.getElementById('cm-draft-adv-search') ? document.getElementById('cm-draft-adv-search').value : '');
  var lbl = document.getElementById('cm-draft-adv-lbl');
  if (lbl) { lbl.textContent = name || 'Not selected'; lbl.style.color = name ? '' : 'var(--faint)'; lbl.style.fontStyle = name ? '' : 'italic'; }
  var panel = document.getElementById('cm-draft-adv-panel');
  var btn   = document.getElementById('cm-draft-adv-btn');
  if (panel) panel.style.display = 'none';
  if (btn) btn.style.borderColor = 'var(--border-md)';
  // Refresh creatives panel if open
  var p1 = document.getElementById('cm-draft-panel-1');
  if (p1 && p1.style.display !== 'none') cmLoadCreativesPanel();
}

// ── Flight dates — full calendar picker (same component as Moments Match) ─────
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
  bidCpm:    { base:'', max:'', noCap:false },
  channels:  [],
  type:      [],
  safety:    [],
  matchScore:[],
  mediaType: [],
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

// ── Bid CPM picker ────────────────────────────────────────────────────────────
function _cmBidCpmContent() {
  var p = _cmDraftAddl.bidCpm;
  var dis = p.noCap ? 'opacity:.35;pointer-events:none;' : '';
  function dollarInput(id, val, onInput) {
    return '<div style="position:relative">'
      + '<span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--muted);pointer-events:none">$</span>'
      + '<input id="' + id + '" type="number" min="0" step="0.01" class="cm-addl-inp" placeholder="0.00" value="' + (val||'') + '" style="padding-left:22px" oninput="' + onInput + '">'
      + '</div>';
  }
  return '<div style="' + dis + 'display:flex;flex-direction:column;gap:8px">'
    + '<div>'
    +   '<div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Base bid CPM</div>'
    +   dollarInput('cm-bid-base-inp', p.base, '_cmDraftAddl.bidCpm.base=this.value;_cmAddlUpdateLbl(\'cm-draft-bidcpm-lbl\',cmBidCpmLabel())')
    + '</div>'
    + '<div>'
    +   '<div style="font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Max bid CPM</div>'
    +   dollarInput('cm-bid-max-inp', p.max, '_cmDraftAddl.bidCpm.max=this.value;_cmAddlUpdateLbl(\'cm-draft-bidcpm-lbl\',cmBidCpmLabel())')
    + '</div>'
    + '</div>'
    + '<label style="display:flex;align-items:center;gap:7px;margin-top:10px;cursor:pointer;font-size:12px;color:var(--muted);user-select:none">'
    +   '<input type="checkbox"' + (p.noCap?' checked':'') + ' style="accent-color:#e11d8f;width:13px;height:13px" onchange="_cmDraftAddl.bidCpm.noCap=this.checked;_cmAddlUpdateLbl(\'cm-draft-bidcpm-lbl\',cmBidCpmLabel());var dd=document.getElementById(\'cm-addl-bidcpm-dd\');if(dd)dd.innerHTML=_cmBidCpmContent()">'
    +   'No CPM target'
    + '</label>'
    + _cmAddlOkBtn('cm-addl-bidcpm-dd');
}
function cmBidCpmLabel() {
  var p = _cmDraftAddl.bidCpm;
  if (p.noCap) return 'No CPM target';
  var parts = [];
  if (p.base) parts.push('Base $' + parseFloat(p.base).toFixed(2));
  if (p.max)  parts.push('Max $'  + parseFloat(p.max).toFixed(2));
  return parts.length ? parts.join(' / ') : 'Any';
}

// ── Generic checkbox picker (Channels, Type, Safety, MatchScore) ───────────────
function _cmCheckboxDdContent(ddId, items, stateKey, hasSearch, firstDividerOnly) {
  var state = _cmDraftAddl[stateKey];
  var html = '';
  if (hasSearch) {
    html += '<div style="padding-bottom:8px;border-bottom:1px solid var(--border);margin-bottom:6px">'
      + '<input type="text" placeholder="Search…" oninput="_cmCheckboxSearch(this.value,\'' + ddId + '\',\'' + stateKey + '\')" '
      + 'style="width:100%;box-sizing:border-box;height:28px;border:1px solid var(--border-md);border-radius:6px;padding:0 8px;font-size:11px;font-family:inherit;outline:none;background:var(--surface);color:var(--text)">'
      + '</div>';
  }
  html += '<div id="' + ddId + '-list">' + _cmCheckboxList(items, state, ddId, stateKey, firstDividerOnly) + '</div>';
  html += _cmAddlOkBtn(ddId);
  return html;
}
function _cmCheckboxList(items, state, ddId, stateKey, firstDividerOnly) {
  return items.map(function(item, idx) {
    var val = item.val || item; var label = item.label || item;
    var sel = state.indexOf(val) >= 0;
    // firstDividerOnly: divider only after first item (separator between "All" and specific options); false = no dividers
    var border = (firstDividerOnly && idx === 0) ? 'border-bottom:1px solid var(--border);margin-bottom:2px;' : '';
    return '<label style="display:flex;align-items:center;gap:9px;padding:7px 2px;font-size:12px;color:var(--text);cursor:pointer;' + border + 'user-select:none" '
      + 'onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
      + '<input type="checkbox"' + (sel?' checked':'') + ' value="' + val + '" style="accent-color:#e11d8f;width:14px;height:14px;flex-shrink:0" '
      + 'onchange="cmCheckboxPick(\'' + stateKey + '\',\'' + val + '\',this.checked,\'' + ddId + '\')">'
      + label
      + '</label>';
  }).join('');
}
// Keys that use firstDividerOnly mode (divider only after the first item)
var _cmCheckboxFirstDivider = { channels: true, type: true, safety: true, matchScore: true };
function _cmCheckboxSearch(q, ddId, stateKey) {
  var allItems = { channels:['All','CTV','OLV','Display','Social','Audio'], type:['All','VoD','Livestream','Organic Pause'], safety:['No Restrictions','Alcohol','Violence','Gambling','Drugs','Adult Content','Weapons','Political'], matchScore:['All','High','Standard'], mediaType:['Display','Video','CTV','Audio','Native'] };
  var items = allItems[stateKey] || [];
  q = q.toLowerCase();
  var filtered = items.filter(function(i){ return !q || (i.label||i).toLowerCase().indexOf(q)>=0; });
  var list = document.getElementById(ddId + '-list');
  if (list) list.innerHTML = _cmCheckboxList(filtered, _cmDraftAddl[stateKey], ddId, stateKey, !!_cmCheckboxFirstDivider[stateKey]);
}
function cmCheckboxPick(stateKey, val, checked, ddId) {
  var state = _cmDraftAddl[stateKey];
  var idx = state.indexOf(val);
  if (checked && idx < 0) state.push(val);
  else if (!checked && idx >= 0) state.splice(idx, 1);
  var lblMap = { channels:'cm-draft-channels-lbl', type:'cm-draft-type-lbl', safety:'cm-draft-safety-lbl', matchScore:'cm-draft-match-lbl', mediaType:'cm-draft-mediatype-lbl' };
  _cmAddlUpdateLbl(lblMap[stateKey], state.length ? state.join(', ') : 'Any');
}
function _cmAddlUpdateLbl(id, text) {
  var el = document.getElementById(id);
  if (el) { el.textContent = text; el.style.color = (text==='Any'||!text) ? 'var(--faint)' : ''; }
}

// ── Creatives panel (panel 1) ─────────────────────────────────────────────────
function _cmCreativesPanelHtml() {
  return '<div style="border-top:1px solid var(--border);background:var(--surface)">'
    + '<div id="cm-creatives-panel-wrap" style="min-height:100px;display:flex;align-items:center;justify-content:center">'
    +   '<span style="font-size:12px;color:var(--faint)">Loading…</span>'
    + '</div>'
    + '</div>';
}

function cmLoadCreativesPanel() {
  var wrap = document.getElementById('cm-creatives-panel-wrap');
  if (!wrap) return;
  wrap.innerHTML = '<span style="font-size:12px;color:var(--faint)">Loading…</span>';

  fetch('/api/creatives')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var w = document.getElementById('cm-creatives-panel-wrap');
      if (!w) return;
      var all = data.creatives || [];

      // Filter by active client and advertiser selections
      var filtered = all.filter(function(cr) {
        var clientOk = !_cmDraftClient || cr.client === _cmDraftClient;
        var advOk    = !_cmDraftAdv   || cr.advertiser === _cmDraftAdv;
        return clientOk && advOk;
      });

      // Filter badge
      var badge = '';
      if (_cmDraftClient || _cmDraftAdv) {
        var parts = [];
        if (_cmDraftClient) parts.push(_cmDraftClient);
        if (_cmDraftAdv)    parts.push(_cmDraftAdv);
        badge = '<div style="padding:10px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">'
          + '<span style="font-size:11px;color:var(--faint)">Filtered by:</span>'
          + parts.map(function(p) {
              return '<span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;background:var(--subtle);color:var(--text);border:1px solid var(--border)">' + p + '</span>';
            }).join('')
          + '<span style="font-size:11px;color:var(--faint);margin-left:auto">' + filtered.length + ' creative' + (filtered.length !== 1 ? 's' : '') + '</span>'
          + '</div>';
      }

      if (!filtered.length) {
        w.innerHTML = badge + '<div style="padding:40px;text-align:center;font-size:12px;color:var(--faint)">No creatives found for the selected client / advertiser.</div>';
        return;
      }

      var cols = [
        { label: '',            width: '60px'  },
        { label: 'Creative'                    },
        { label: 'Advertiser',  width: '130px' },
        { label: 'Type',        width: '70px'  },
        { label: 'Date',        width: '110px' },
      ];

      var rows = filtered.map(function(cr) {
        var thumb = cr.thumb
          ? '<div style="width:48px;height:28px;border-radius:4px;overflow:hidden;background:#e5e7eb;flex-shrink:0"><img src="' + cr.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>'
          : '<div style="width:48px;height:28px;border-radius:4px;background:#e5e7eb"></div>';
        return UI.tr([
          thumb,
          '<span style="font-size:12px;font-weight:500;color:var(--text)">' + (cr.name || '—') + '</span>',
          '<span style="font-size:12px;color:var(--muted)">' + (cr.advertiser || '—') + '</span>',
          '<span style="font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;background:var(--subtle);color:var(--muted)">' + (cr.fileType || '—') + '</span>',
          '<span style="font-size:11px;color:var(--faint)">' + (cr.date || '—') + '</span>',
        ]);
      }).join('');

      w.innerHTML = badge + UI.tableScroll(cols, rows, 'cm-creatives-panel-tbody', 0, null, { inCard: false });
    })
    .catch(function() {
      var w = document.getElementById('cm-creatives-panel-wrap');
      if (w) w.innerHTML = '<div style="padding:20px;text-align:center;font-size:12px;color:var(--faint)">Could not load creatives.</div>';
    });
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
    if (hd) hd.style.background = opening ? 'var(--bg)' : '';
  }
  // Lazy-load creatives when panel 1 opens — fetch from DB into CS_LIBRARY then re-render
  if (idx === 1) {
    var p1 = document.getElementById('cm-draft-panel-1');
    if (p1 && p1.style.display !== 'none') {
      fetch('/api/creatives')
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.creatives) {
            CS_LIBRARY = data.creatives;
            // Pre-select creatives already linked to this campaign
            if (_cmCurrentCampaignDbId) {
              _cmDraftCreatives = CS_LIBRARY
                .filter(function(c) { return c.campaignId === _cmCurrentCampaignDbId; })
                .map(function(c) {
                  return { id: 'lib-' + c.id, libId: c.id, name: c.name, type: c.fileType || 'MP4', thumb: c.thumb || '', templates: c.templates || [] };
                });
            }
            var el = document.getElementById('cm-draft-creatives');
            if (el) el.innerHTML = _cmDraftCreativesInnerHtml();
          }
        })
        .catch(function() {});
    }
  }
  // Lazy-load Moments Group when panel 2 opens
  if (idx === 2) {
    var p2 = document.getElementById('cm-draft-panel-2');
    if (p2 && p2.style.display !== 'none') cmLoadMediaPlanPanel();
  }
  // Lazy-load partner panel when panel 3 opens
  if (idx === 3) {
    var p3 = document.getElementById('cm-draft-panel-3');
    if (p3 && p3.style.display !== 'none') cmLoadPartnerPanel();
  }
}

// ── Save campaign details to DB ───────────────────────────────────────────────
function cmSaveCampaignDetails() {
  var dbId = _cmCurrentCampaignDbId;
  var btn  = document.getElementById('cm-draft-save-btn');
  var fb   = document.getElementById('cm-save-feedback');

  function _showFb(msg, color) {
    if (!fb) return;
    fb.textContent  = msg;
    fb.style.color  = color;
    fb.style.opacity = '1';
    setTimeout(function() { fb.style.opacity = '0'; }, 3000);
  }

  var nameEl = document.getElementById('cm-draft-name');
  var campaignName   = nameEl ? nameEl.value.trim() : '';
  var clientName     = _cmDraftClient  || '';
  var advertiserName = _cmDraftAdv     || '';

  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  function _onSaved(newDbId) {
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    _showFb('Saved correctly ✓', '#16a34a');
    var resolvedId = newDbId || dbId;
    _cmCurrentCampaignDbId = resolvedId;
    CM_CAMPAIGNS = CM_CAMPAIGNS.map(function(c) {
      if (c.dbId !== resolvedId && c.id !== _cmOpenDetailId) return c;
      return Object.assign({}, c, {
        dbId:        resolvedId,
        id:          'cm' + resolvedId,
        name:        campaignName         || c.name,
        client:      clientName           || c.client,
        advertiser:  advertiserName       || c.advertiser,
        clientOrgId: _cmCurrentClientOrgId  || c.clientOrgId  || null,
        advertiserId: _cmCurrentAdvertiserId || c.advertiserId || null,
      });
    });
    _cmOpenDetailId = 'cm' + resolvedId;
    cmRefreshStepBadges();
  }

  function _onError(msg) {
    if (btn) { btn.textContent = 'Save Changes'; btn.disabled = false; }
    _showFb(msg || 'Error — try again', '#dc2626');
  }

  if (!dbId) {
    // First save — create the record in DB
    fetch('/api/campaigns-create', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ campaign_name: campaignName, client_name: clientName, advertiser_name: advertiserName }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.campaign_id) throw new Error(data.error || 'No campaign_id');
      _onSaved(data.campaign_id);
    })
    .catch(function(e) { _onError(e.message); });
    return;
  }

  fetch('/api/campaigns-update', {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ id: dbId, campaign_name: campaignName, client_name: clientName, advertiser_name: advertiserName }),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.ok) _onSaved(null);
    else _onError('Error: ' + (data.error || 'unknown'));
  })
  .catch(function() { _onError('Network error — try again'); });
}

// ── Step completion logic (single source of truth) ───────────────────────────
function _cmStepDone(stepIdx, c) {
  switch (stepIdx) {
    case 0: // Campaign Details — all 6 fields must be filled
      return !!(
        (_cmDraftCampaignName || c.name        || '').trim() &&
        (_cmDraftClient       || c.client      || '').trim() &&
        (_cmDraftAdv          || c.advertiser  || '').trim() &&
        (_cmDraftGeo && _cmDraftGeo.length > 0 || (c.geography && c.geography.length > 0)) &&
        (_cmDraftFlight.start || c.start       || '').trim() &&
        (_cmDraftFlight.end   || c.end         || '').trim()
      );
    case 1: // Creatives — at least one creative linked to this campaign in DB
      return (c.creatives > 0);
    case 2: // Moments Group — at least one analysis assigned to this campaign in DB
      return (c.analysisCount > 0);
    case 3: // Partner — at least one connection_id saved on partner_ids
      return !!(
        (c.partnerIds && c.partnerIds.length > 0) ||
        _cmDraftPartners.length > 0
      );
    case 4: // Review & Launch
      return c.status !== 'draft';
    default:
      return false;
  }
}

// ── Step badge HTML helper ────────────────────────────────────────────────────
function _cmStepBadgeHtml(done) {
  return done
    ? '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;white-space:nowrap">Ready</span>'
    : '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:5px;background:#FFFBEB;color:#92400E;border:1px solid rgba(245,158,11,.3);white-space:nowrap">Incomplete</span>';
}

// ── Live badge refresh — call after any step save ─────────────────────────────
function cmRefreshStepBadges() {
  var c = CM_CAMPAIGNS.filter(function(x){ return x.dbId === _cmCurrentCampaignDbId; })[0];
  if (!c) return;
  var allReady = true;
  for (var i = 0; i < 4; i++) {
    var done = _cmStepDone(i, c);
    if (!done) allReady = false;
    // Accordion badges
    var badge = document.getElementById('cm-draft-badge-' + i);
    if (badge) badge.innerHTML = _cmStepBadgeHtml(done);
    // Summary panel badges
    var sumBadge = document.getElementById('cm-summary-badge-' + i);
    if (sumBadge) sumBadge.innerHTML = _cmStepBadgeHtml(done);
  }
  // Update launch button in summary
  var launchBtn = document.getElementById('cm-summary-launch');
  if (launchBtn) {
    launchBtn.disabled = !allReady;
    launchBtn.style.background = allReady ? 'var(--accent)' : 'var(--subtle)';
    launchBtn.style.color      = allReady ? '#fff' : 'var(--faint)';
    launchBtn.style.cursor     = allReady ? 'pointer' : 'not-allowed';
  }
}

// ── Shared setup checklist — used by both draft and pacing detail views ────────
function _cmSetupChecklist(c, opts) {
  var isNew = (opts && opts.isNew) || false;
  // Initialise shared form state from campaign data
  _cmCurrentCampaignDbId = c.dbId         || null;
  _cmCurrentClientOrgId  = c.clientOrgId  || null;
  _cmCurrentAdvertiserId = c.advertiserId || null;
  // For non-super orgs, force client to their org regardless of what the campaign has
  if (!_appIsSuperOrg()) {
    var _lockedOrg = _appDbOrgs.find(function(o){ return o.dbId === selectedClientOrgId; });
    _cmDraftClient = _lockedOrg ? _lockedOrg.name : (c.client || '');
    if (!_cmCurrentClientOrgId) _cmCurrentClientOrgId = selectedClientOrgId;
  } else {
    _cmDraftClient = c.client || '';
  }
  _cmDraftGeo            = (c.geography  || []).slice();
  _cmDraftAdv            = c.advertiser  || '';
  _cmDraftFlight.start   = c.start       || '';
  _cmDraftFlight.end     = c.end         || '';
  _cmDraftCampaignName   = c.name        || '';
  _cmDraftAddl.mediaType = (c.mediaType  || []).slice();
  // Reset partner draft state for each new campaign open
  _cmDraftPartners  = [];
  _cmPartnerSearch  = '';
  _cmDspConnections = null;
  _cmDspLibraryMap  = {};

  var flightLabel = (c.start && c.end) ? c.start + ' → ' + c.end : 'Set flight dates';

  var geoTrigger =
    '<div style="position:relative">'
    + '<button type="button" id="cm-draft-geo-btn" onclick="cmDraftGeoToggle(event)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-geo-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' + (!_cmDraftGeo.length ? ';color:var(--faint);font-style:italic' : '') + '">' + _cmGeoTriggerText() + '</span>'
    +   _CS_ARW
    + '</button>'
    + '<div id="cm-draft-geo-panel" style="display:none">'
    +   _cmSearchablePanel('cm-draft-geo-search','cm-draft-geo-list','_cmBuildGeoList')
    + '</div>'
    + '</div>';

  var _advLocked = !_cmDraftClient; // disabled until a client is selected
  var _advLabel  = _advLocked ? 'Select a client first' : (_cmDraftAdv || 'Not selected');
  var _advLblStyle = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-style:italic';
  if (!_advLocked && _cmDraftAdv) _advLblStyle = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  var advTrigger =
    '<div style="position:relative">'
    + '<button type="button" id="cm-draft-adv-btn" onclick="cmDraftAdvToggle(event)" style="' + _CS_TRIG + (_advLocked ? ';opacity:.45;cursor:not-allowed' : '') + '">'
    +   '<span id="cm-draft-adv-lbl" style="' + _advLblStyle + '">' + _advLabel + '</span>'
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

  var clientTrigger;
  if (!_appIsSuperOrg()) {
    // Non-super: locked to their org, no dropdown
    clientTrigger =
      '<div style="height:36px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);'
      + 'display:flex;align-items:center;font-size:12px;font-weight:500;color:var(--text);cursor:not-allowed;opacity:.8;box-sizing:border-box">'
      + (_cmDraftClient || '—')
      + '</div>';
  } else {
    clientTrigger =
      '<div style="position:relative">'
      + '<button type="button" id="cm-draft-client-btn" onclick="cmDraftClientToggle(event)" style="' + _CS_TRIG + '">'
      +   '<span id="cm-draft-client-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' + (!_cmDraftClient ? ';color:var(--faint);font-style:italic' : '') + '">' + (_cmDraftClient || 'Not selected') + '</span>'
      +   _CS_ARW
      + '</button>'
      + '<div id="cm-draft-client-panel" style="display:none">'
      +   _cmSearchablePanel('cm-draft-client-search','cm-draft-client-list','_cmBuildClientList')
      + '</div>'
      + '</div>';
  }

  var LB = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';
  var mediaTypeTrigger =
    '<div style="position:relative">'
    + '<button type="button" onclick="_cmAddlOpen(\'cm-mediatype-dd\',function(){return _cmCheckboxDdContent(\'cm-mediatype-dd\',[\'Display\',\'Video\',\'CTV\',\'Audio\',\'Native\'],\'mediaType\',false,false)},this)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-mediatype-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (_cmDraftAddl.mediaType.length ? '' : 'color:var(--faint)') + '">'
    +   (_cmDraftAddl.mediaType.length ? _cmDraftAddl.mediaType.join(', ') : 'Not selected')
    +   '</span>'
    +   _CS_ARW
    + '</button>'
    + '</div>';

  var detailsForm =
    '<div style="padding:20px 24px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface)">'
    // ── Row 1: Campaign Name / ID, Client ID / Partner ID, Advertiser ──
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
    +   '<div style="min-width:0"><label style="' + LB + '">Campaign Name / ID</label>'
+   '<div id="cm-name-field" style="display:flex;align-items:center;gap:8px;height:36px;padding:0 11px 0 4px;border:1px solid var(--border-md);border-radius:5px;background:var(--surface);transition:border-color .15s" onfocusin="this.style.borderColor=\'var(--accent)\'" onfocusout="this.style.borderColor=\'var(--border-md)\'">'
+     '<div style="display:inline-flex;background:#f3f4f6;border-radius:4px;padding:2px;gap:1px;flex-shrink:0">'
+       '<button type="button" onclick="cmSwitchNameMode(this,\'name\')" style="height:20px;padding:0 7px;border:none;border-radius:3px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;background:#fff;color:var(--accent);box-shadow:0 1px 2px rgba(0,0,0,.1);transition:background .12s,color .12s">Name</button>'
+       '<button type="button" onclick="cmSwitchNameMode(this,\'id\')" style="height:20px;padding:0 7px;border:none;border-radius:3px;font-size:10px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:#9ca3af;transition:background .12s,color .12s">ID</button>'
+     '</div>'
+     '<input id="cm-draft-name" type="text" placeholder="Campaign name…" value="' + (c.name||'').replace(/"/g,'&quot;') + '" style="flex:1;min-width:0;border:none;outline:none;font-size:12px;font-family:inherit;color:var(--text);background:transparent" oninput="_cmDraftCampaignName=this.value">'
+   '</div>'
+   '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Client ID / Partner ID</label>' + clientTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Advertiser</label>' + advTrigger + '</div>'
    + '</div>'
    // ── Row 2: [Flight Dates + Geography stacked] | Media Type | Campaign Type ──
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
    +   '<div style="min-width:0;display:flex;gap:8px;align-items:end">'
    +     '<div style="flex:4;min-width:0"><label style="' + LB + '">Flight Dates</label>' + flightTrigger + '</div>'
    +     '<div style="flex:2;min-width:0"><label style="' + LB + '">Geography</label>' + geoTrigger + '</div>'
    +   '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Media Type</label>' + mediaTypeTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Campaign Type</label>'
    +   UI.customSelect('cm-draft-camptype', [{val:'',label:'Not selected'},{val:'standard',label:'Standard'},{val:'pg',label:'Programmatic Guaranteed'}], '', null)
    +   '</div>'
    + '</div>'
    // ── Additional Details toggle ──
    + '<div style="margin:4px 0 0">'
    +   '<button type="button" onclick="cmToggleAddlDetails()" '
    +   'style="display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;padding:0;font-family:inherit">'
    +     '<span id="cm-addl-chev" style="color:var(--faint);display:flex;transition:transform .18s">'
    +       '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
    +     '</span>'
    +     '<span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--faint)">Additional Details</span>'
    +   '</button>'
    + '</div>'
    // ── Additional Details panel (hidden by default) ──
    + '<div id="cm-addl-details-panel" style="display:none;margin-top:14px">'
    +   '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
    +     '<div style="min-width:0"><label style="' + LB + '">Budget</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cm-addl-budget-dd\',_cmBudgetContent,this)" style="' + _CS_TRIG + '">'
    +           '<span id="cm-draft-budget-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div style="min-width:0"><label style="' + LB + '">Impr. / day</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cm-addl-impr-dd\',_cmImprContent,this)" style="' + _CS_TRIG + '">'
    +           '<span id="cm-draft-impr-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div style="min-width:0"><label style="' + LB + '">Bid CPM</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cm-addl-bidcpm-dd\',_cmBidCpmContent,this)" style="' + _CS_TRIG + '">'
    +           '<span id="cm-draft-bidcpm-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div style="min-width:0"><label style="' + LB + '">Pacing Mode</label>'
    +       UI.customSelect('cm-draft-pacing', [{val:'',label:'Not selected'},{val:'ahead',label:'Ahead'},{val:'evenly',label:'Evenly'}], '', null)
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '<div style="margin-top:18px;display:flex;align-items:center;justify-content:flex-end;gap:14px">'
    +   '<span id="cm-save-feedback" style="font-size:12px;font-weight:600;opacity:0;transition:opacity .4s"></span>'
    +   '<button id="cm-draft-save-btn" onclick="cmSaveCampaignDetails()" style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Save Changes</button>'
    + '</div>'
    + '</div>';

  var isDraft = c.status === 'draft';

  // ── Incomplete alert per step ─────────────────────────────────────────────
  function _stepAlert(stepIdx) {
    if (_cmStepDone(stepIdx, c)) return '';
    var msg = '';
    if (stepIdx === 0) {
      var missing = [];
      if (!(_cmDraftCampaignName || c.name       || '').trim()) missing.push('Campaign Name');
      if (!(_cmDraftClient       || c.client     || '').trim()) missing.push('Client');
      if (!(_cmDraftAdv          || c.advertiser || '').trim()) missing.push('Advertiser');
      if (!(_cmDraftGeo && _cmDraftGeo.length > 0 || (c.geography && c.geography.length > 0))) missing.push('Geography');
      if (!(_cmDraftFlight.start || c.start || '').trim()) missing.push('Flight Start');
      if (!(_cmDraftFlight.end   || c.end   || '').trim()) missing.push('Flight End');
      msg = 'Required fields missing: ' + missing.join(', ') + '.';
    } else if (stepIdx === 1) {
      msg = 'No creatives attached yet. Add at least one creative to mark this step as complete.';
    } else if (stepIdx === 2) {
      msg = 'No Moments Group linked yet. Associate at least one moment to continue.';
    } else if (stepIdx === 3) {
      msg = 'No DSP / SSP partner connected yet. Link a partner to enable campaign delivery.';
    }
    return msg ? '<div style="padding:10px 20px;border-top:1px solid var(--border)">' + UI.alertBanner('warning', '', msg) + '</div>' : '';
  }

  var panelContents = [
    // 0 — Campaign Details
    _stepAlert(0) + detailsForm,

    // 1 — Creatives (two-col: library picker + asset tiles)
    _stepAlert(1)
    + '<div id="cm-draft-creatives" style="border-top:1px solid var(--border)">' + _cmDraftCreativesInnerHtml() + '</div>'
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:14px">'
    +   '<span id="cm-creatives-feedback" style="font-size:12px;font-weight:600;opacity:0;transition:opacity .4s"></span>'
    +   '<button id="cm-creatives-save-btn" onclick="cmSaveCreatives()" style="height:32px;padding:0 18px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Add Creatives to Campaign</button>'
    + '</div>'
    + '<div style="height:1px;background:var(--border);margin:0"></div>',

    // 2 — Moments Group / Moments
    _stepAlert(2)
    + '<div id="cm-moments-panel">' + _cmMomentsInnerHtml() + '</div>'
    + '<div style="height:1px;background:var(--border);margin:0"></div>',

    // 3 — Partner
    _stepAlert(3)
    + '<div id="cm-partner-panel-wrap">' + _cmPartnerInnerHtml() + '</div>'
    + '<div style="height:1px;background:var(--border);margin:0"></div>',
  ];

  // Dynamic completion per step
  var steps = [
    { label:'Campaign Details', done: _cmStepDone(0, c), desc:'Name, advertiser, geography, flight dates and budget.' },
    { label:'Creatives',        done: _cmStepDone(1, c), desc:'Video or image assets attached to the campaign.' },
    { label:'Moments Match',    done: _cmStepDone(2, c), desc:'Audience moments targeted for delivery.' },
    { label:'Partner',          done: _cmStepDone(3, c), desc:'DSP / SSP connected for delivery.' },
  ];

  var chevSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform .2s"><path d="M6 9l6 6 6-6"/></svg>';

  // Lucide icons: text-quote, pen-tool, combine, split
  var stepIconPaths = [
    '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    '<rect x="8" y="8" width="8" height="8" rx="2"/><path d="M4 10a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2"/><path d="M14 20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"/>',
    '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/>',
  ];

  var stepsHtml = steps.map(function(s, i) {
    var openByDefault = false;
    var icon = '<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--muted)">' + stepIconPaths[i] + '</svg>'
      + '</div>';
    var chevRotated = openByDefault ? 'transform:rotate(180deg)' : '';
    var hdr = '<div id="cm-draft-hd-' + i + '" onclick="_cmDraftToggle(' + i + ')" '
      + 'style="display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .12s' + (openByDefault ? ';background:var(--bg)' : '') + '" '
      + 'onmouseover="this.style.background=\'var(--bg)\'" onmouseout="var p=document.getElementById(\'cm-draft-panel-\'+' + i + ');this.style.background=p&&p.style.display!==\'none\'?\'var(--bg)\':\'\'">'
      + icon
      + '<div style="flex:1">'
      +   '<div style="font-size:12px;font-weight:600;color:var(--text)">' + s.label + '</div>'
      +   '<div style="font-size:11px;color:var(--faint);margin-top:2px">' + s.desc + '</div>'
      + '</div>'
      + '<span id="cm-draft-badge-' + i + '">' + _cmStepBadgeHtml(s.done) + '</span>'
      + '<span id="cm-draft-chev-' + i + '" style="color:var(--faint);transition:transform .2s;' + chevRotated + '">' + chevSvg + '</span>'
      + '</div>';
    var panel = '<div id="cm-draft-panel-' + i + '" style="display:' + (openByDefault ? 'block' : 'none') + '">'
      + panelContents[i]
      + '</div>';
    return hdr + panel;
  }).join('');

  var accordionCard =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + (isNew ? '' :
        '<div style="padding:14px 20px;border-bottom:1px solid var(--border)">'
        + '<div style="font-size:13px;font-weight:600;color:var(--text)">Campaign Setup</div>'
        + '<div style="font-size:11px;color:var(--faint);margin-top:2px">' + (isDraft ? 'Complete all steps before launching' : 'Campaign configuration') + '</div>'
        + '</div>')
    + stepsHtml
    + '</div>';

  return '<div style="margin-top:20px">'
    + accordionCard
    + '</div>';
}

// ── Additional Details toggle ─────────────────────────────────────────────────
function cmToggleAddlDetails() {
  var panel = document.getElementById('cm-addl-details-panel');
  var chev  = document.getElementById('cm-addl-chev');
  if (!panel) return;
  var open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
}

// ── Launch (placeholder — to be wired up) ────────────────────────────────────
function cmLaunchCampaign() {
  alert('Launch logic coming soon.');
}

// ── Campaign Summary sidebar ──────────────────────────────────────────────────
function _cmSummaryToggle(i) {
  var panel = document.getElementById('cm-sum-panel-' + i);
  var chev  = document.getElementById('cm-sum-chev-' + i);
  if (!panel) return;
  var open = panel.style.display === 'none';
  panel.style.display = open ? 'block' : 'none';
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
}

function _cmSummaryDetailHtml(i, c) {
  var row = function(label, val) {
    return '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:4px 0">'
      + '<span style="font-size:11px;color:var(--faint);white-space:nowrap">' + label + '</span>'
      + '<span style="font-size:11px;font-weight:500;color:var(--text);text-align:right">' + (val || '—') + '</span>'
      + '</div>';
  };
  switch (i) {
    case 0:
      return row('Name',       _cmDraftCampaignName || c.name       || '')
           + row('Client',     _cmDraftClient       || c.client     || '')
           + row('Advertiser', _cmDraftAdv          || c.advertiser || '')
           + row('Geography',  (_cmDraftGeo && _cmDraftGeo.length ? _cmDraftGeo : (c.geography || [])).join(', '))
           + row('Flight',     ((_cmDraftFlight.start || c.start) && (_cmDraftFlight.end || c.end))
               ? (_cmDraftFlight.start || c.start) + ' → ' + (_cmDraftFlight.end || c.end) : '');
    case 1:
      var crCount = c.creatives || (_cmDraftCreatives && _cmDraftCreatives.length) || 0;
      return row('Creatives', crCount ? crCount + ' attached' : 'None yet');
    case 2:
      var hasAnalysis = _cmSelectedAnalysis || c.moments_match_analysis_id;
      return row('Analysis', hasAnalysis ? 'Assigned' : 'None yet');
    case 3:
      return row('Partners', (c.partners && c.partners.length) ? c.partners.join(', ') : 'None yet');
    default: return '';
  }
}

function _cmSummaryHtml(c) {
  var stepLabels = [
    { label: 'Campaign Details' },
    { label: 'Creatives'       },
    { label: 'Moments Match' },
    { label: 'Partner'         },
  ];

  var allReady = [0,1,2,3].every(function(i) { return _cmStepDone(i, c); });
  var chevSvg  = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

  var stepsHtml = stepLabels.map(function(s, i) {
    var done    = _cmStepDone(i, c);
    var isLast  = i === stepLabels.length - 1;
    return '<div style="' + (isLast ? '' : 'border-bottom:1px solid var(--border)') + '">'
      // Row header (clickable)
      + '<div onclick="_cmSummaryToggle(' + i + ')" style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;cursor:pointer;gap:6px">'
      +   '<span style="font-size:12px;font-weight:500;color:var(--text);flex:1">' + s.label + '</span>'
      +   '<span id="cm-summary-badge-' + i + '">' + _cmStepBadgeHtml(done) + '</span>'
      +   '<span id="cm-sum-chev-' + i + '" style="color:var(--faint);transition:transform .18s;flex-shrink:0">' + chevSvg + '</span>'
      + '</div>'
      // Collapsible detail panel (hidden by default)
      + '<div id="cm-sum-panel-' + i + '" style="display:none;padding-bottom:10px">'
      +   _cmSummaryDetailHtml(i, c)
      + '</div>'
      + '</div>';
  }).join('');

  var launchStyle = allReady
    ? 'background:var(--accent);color:#fff;cursor:pointer'
    : 'background:var(--subtle);color:var(--faint);cursor:not-allowed';

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;position:sticky;top:20px">'
    + '<div style="padding:14px 16px;border-bottom:1px solid var(--border)">'
    +   '<div style="font-size:13px;font-weight:600;color:var(--text)">Campaign Summary</div>'
    +   '<div style="font-size:11px;color:var(--faint);margin-top:1px">Setup checklist</div>'
    + '</div>'
    + '<div style="padding:0 16px">' + stepsHtml + '</div>'
    + '<div style="padding:14px 16px;border-top:1px solid var(--border)">'
    +   '<button id="cm-summary-launch" ' + (allReady ? 'onclick="cmLaunchCampaign()"' : 'disabled') + ' '
    +   'style="width:100%;height:34px;border:none;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;transition:background .15s,color .15s;' + launchStyle + '">'
    +   'Launch Campaign'
    +   '</button>'
    + '</div>'
    + '</div>';
}

function _cmDraftDetail(c) {
  var isNew = !c.name;
  return UI.pageHeader({
      breadcrumb: [
        { label: 'Campaign Management', onclick: 'setPage(\'campaign-management\',\'Campaign Management\')' },
        { label: isNew ? 'New Campaign' : c.name }
      ],
      title: isNew ? 'Create New Campaign' : c.name,
      subtitle: isNew ? 'Fill in the details below to set up your new campaign' : (c.advertiser + ' · ' + (c.geography || []).join(', ')),
      titleRight: cmStatusChip(c.status),
    })
    + _cmSetupChecklist(c, isNew ? { isNew: true } : null);
}
