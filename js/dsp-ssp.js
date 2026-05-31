// dsp-ssp.js

// ── State ─────────────────────────────────────────────────────────────────────
var _dspClientId    = null;   // selected client_org_id (number)
var _dspAdvId       = null;   // selected advertiser_id (number)
var _dspSearch      = '';
var _dspLibrary     = [];
var _dspConnections = [];
var _dspClients     = [];     // [{dbId, name}]
var _dspAdvertisers = [];     // [{advertiser_id, advertiser_name}]
var _dspConnectItem = null;   // library item being connected (modal)
var _dspFormValues  = {};
var _dspAdvRows     = [];     // [{uid, advertiser, advertiserId}] for Advertiser Preset
var _dspAdvRowSearch = '';    // search filter for advertiser rows
var _dspAdvRowUid   = 0;      // counter for unique row IDs
var _dspDrawerTab   = 'partner'; // active tab: 'partner' | 'advertiser'
var _dspPendingLibIds = [];      // library_ids selected from library modal, not yet connected

// ── Brand colors per DSP/SSP name ─────────────────────────────────────────────
var _dspColors = {
  'The Trade Desk':          '#003f5c',
  'DV360':                   '#4285f4',
  'Xandr':                   '#00a4ef',
  'Amazon DSP':              '#ff9900',
  'Yahoo DSP':               '#720e9e',
  'Adobe Advertising Cloud': '#e1251b',
  'Magnite':                 '#e34040',
  'PubMatic':                '#0068b5',
  'Index Exchange':          '#1a1a2e',
  'FreeWheel':               '#00b49c', // fallback only
  'OpenX':                   '#1d5fa6',
  'TripleLift':              '#6c3de8',
};

// ── Logo URLs per DSP/SSP name ────────────────────────────────────────────────
var _dspLogos = {
  'TripleLift':              'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779704072/triplelift_logo_poxw3r.jpg',
  'Magnite':                 'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694954/mglogo_f3gxp5.webp',
  'Yahoo DSP':               'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779704049/yahoo_fav_jooabt.png',
  'Xandr':                   'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694968/xandr_logo_bofilp.jpg',
  'The Trade Desk':          'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694963/thetradedesk_logo_lpfoxg.webp',
  'PubMatic':                'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694959/pubmatic-small-1_fnrdng.png',
  'Index Exchange':          'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694949/index-exchange-logo_if47uv.png',
  'Amazon DSP':              'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779694942/Amazon-logo-meaning_nygv5n.jpg',
  'DV360':                   'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/dv360_logo_tfrs2c.png',
  'FreeWheel':               'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779704156/freewhile_tp8k2e.png',
  'Adobe Advertising Cloud': 'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/Adobe_Advertising_Cloud_logo_RGB_192px_no_shadow_nnbjgy.png',
};

function _dspColor(name) {
  return _dspColors[name] || '#6b7280';
}

function _dspInitials(name) {
  return name.split(' ').slice(0, 2).map(function(w) { return w[0]; }).join('').toUpperCase();
}

// ── Logo avatar HTML (image if available, initials fallback) ──────────────────
function _dspLogoHtml(name, size) {
  size = size || 40;
  var radius = size <= 36 ? 9 : 10;
  var logoUrl = _dspLogos[name];
  if (logoUrl) {
    return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + 'px;'
      + 'flex-shrink:0;overflow:hidden">'
      + '<img src="' + logoUrl + '" alt="' + name + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      + '</div>';
  }
  var color = _dspColor(name);
  var fs    = size <= 36 ? 11 : 12;
  return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:' + radius + 'px;'
    + 'background:' + color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
    + '<span style="font-size:' + fs + 'px;font-weight:800;color:#fff;letter-spacing:-.5px">' + _dspInitials(name) + '</span>'
    + '</div>';
}

// ── Main render ───────────────────────────────────────────────────────────────
function renderDspSsp() {
  _dspLibrary     = [];
  _dspConnections = [];
  _dspClients     = [];
  _dspAdvertisers = [];
  _dspSearch      = '';

  // Fetch orgs + advertisers in parallel
  Promise.all([
    fetch('/api/organizations').then(function(r) { return r.json(); }),
    fetch('/api/advertisers').then(function(r) { return r.json(); }),
  ]).then(function(results) {
    var orgData = results[0];
    var advData = results[1];
    _dspClients     = orgData.orgs || [];
    _dspAdvertisers = advData.advertisers || [];
    // Pre-populate with topbar selected client (lock for non-super, pre-select for super)
    if (selectedClientOrgId) {
      _dspClientId = selectedClientOrgId;
    }
    _dspRefreshFilters();
    _dspLoad();
  }).catch(function() { _dspLoad(); });

  return UI.pageHeader({ title: 'DSP / SSP Connections', subtitle: 'Manage programmatic integrations and seat connections' })
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden" id="dsp-card">'
    // ── Card header ──
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border);gap:16px">'
    +   '<div style="flex-shrink:0">'
    +     '<div style="font-size:13px;font-weight:600;color:var(--text)">Integrations</div>'
    +     '<div style="font-size:11px;color:var(--faint);margin-top:1px"><span id="dsp-count">—</span> active connections</div>'
    +   '</div>'
    +   '<div id="dsp-header-filters" style="display:flex;align-items:center;gap:10px"></div>'
    + '</div>'
    // ── Search row ──
    + '<div style="padding:10px 20px;border-bottom:1px solid var(--border)">'
    +   UI.searchBar('dsp-search', 'Search platforms…', 'dspApplySearch(this.value)')
    + '</div>'
    // ── Grid body ──
    + '<div id="dsp-body" style="padding:20px">'
    +   '<div style="display:flex;align-items:center;justify-content:center;height:120px;color:var(--faint);font-size:13px">Loading…</div>'
    + '</div>'
    + '</div>';
}

// ── Rebuild the header filters (client + advertiser custom selects) ────────────
function _dspRefreshFilters() {
  var el = document.getElementById('dsp-header-filters');
  if (!el) return;

  var isSuper = _appIsSuperOrg();
  var html = '<span style="font-size:11px;font-weight:500;color:var(--muted);white-space:nowrap">Client</span>';

  if (isSuper) {
    // Super org: full select with all clients
    var clientOpts = [{val: '', label: 'Select client…'}].concat(
      _dspClients.map(function(o) { return {val: String(o.dbId), label: o.name}; })
    );
    html += '<div style="width:180px">'
      + UI.customSelect('dsp-client-cs', clientOpts, _dspClientId ? String(_dspClientId) : '', 'dspSetClient')
      + '</div>';
  } else {
    // Non-super: locked to their org
    var lockedOrg = _appDbOrgs.find(function(o) { return o.dbId === selectedClientOrgId; });
    html += '<div style="height:32px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);'
      + 'display:flex;align-items:center;font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;cursor:not-allowed;opacity:.8">'
      + (lockedOrg ? lockedOrg.name : '—')
      + '</div>';
  }

  el.innerHTML = html;
}

// ── Load data ─────────────────────────────────────────────────────────────────
function _dspLoad() {
  var url = '/api/dsp-ssp' + (_dspClientId ? '?client_org_id=' + _dspClientId : '');
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _dspLibrary     = data.library     || [];
      _dspConnections = data.connections || [];
      _dspRender();
    })
    .catch(function(e) {
      var body = document.getElementById('dsp-body');
      if (body) body.innerHTML = '<div style="padding:40px;text-align:center;color:#ef4444;font-size:12px">Error loading integrations: ' + e.message + '</div>';
    });
}

function dspSetClient(val) {
  _dspClientId      = val ? parseInt(val) : null;
  _dspAdvId         = null;
  _dspPendingLibIds = [];
  _dspRefreshFilters();
  _dspLoad();
}

function dspSetAdv(val) {
  _dspAdvId = val ? parseInt(val) : null;
  _dspRender();
}

function dspApplySearch(q) {
  _dspSearch = q || '';
  _dspRender();
}

// ── Render grid ───────────────────────────────────────────────────────────────
function _dspRender() {
  // Map connected library IDs → connection
  var connectedMap = {};
  _dspConnections.forEach(function(c) { connectedMap[c.library_id] = c; });

  // Remove from pending any IDs that are now connected
  _dspPendingLibIds = _dspPendingLibIds.filter(function(id) { return !connectedMap[id]; });

  var countEl = document.getElementById('dsp-count');
  if (countEl) countEl.textContent = _dspConnections.length;

  // Search filter (applied only to active cards)
  var q = (_dspSearch || '').toLowerCase().trim();

  var connected = _dspLibrary.filter(function(l) { return !!connectedMap[l.library_id]; });
  if (q) {
    connected = connected.filter(function(l) {
      return l.name.toLowerCase().indexOf(q) >= 0
          || (l.type     || '').toLowerCase().indexOf(q) >= 0
          || (l.category || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  // Pending: selected from library modal but not yet connected
  var pending = _dspLibrary.filter(function(l) {
    return !connectedMap[l.library_id] && _dspPendingLibIds.indexOf(l.library_id) >= 0;
  });

  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
  html += connected.map(function(l) { return _dspCardHtml(l, connectedMap[l.library_id]); }).join('');
  html += pending.map(function(l) { return _dspPendingCardHtml(l); }).join('');
  html += _dspAddMoreCardHtml();
  html += '</div>';

  var body = document.getElementById('dsp-body');
  if (body) body.innerHTML = html;
}

// ── "Add more partners" dashed card ──────────────────────────────────────────
function _dspAddMoreCardHtml() {
  return '<div onclick="dspOpenLibraryModal()" '
    + 'style="border-radius:10px;border:2px dashed var(--border);background:transparent;cursor:pointer;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;'
    + 'padding:28px 20px;min-height:110px;transition:border-color .15s,background .15s" '
    + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'var(--subtle)\'" '
    + 'onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'transparent\'">'
    + '<div style="width:34px;height:34px;border-radius:9px;border:1.5px solid var(--border-md);'
    +   'display:flex;align-items:center;justify-content:center;color:var(--muted)">'
    +   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
    + '</div>'
    + '<div style="text-align:center">'
    +   '<div style="font-size:13px;font-weight:600;color:var(--text)">Add more partners</div>'
    +   '<div style="font-size:11px;color:var(--muted);margin-top:3px">Browse the platform library</div>'
    + '</div>'
    + '</div>';
}

// ── Pending card (selected from library, not yet connected) ───────────────────
function _dspPendingCardHtml(lib) {
  var typeBadge = '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.04em;'
    + (lib.type === 'DSP' ? 'background:#eff6ff;color:#2563eb' : 'background:#f0fdf4;color:#16a34a')
    + '">' + lib.type + '</span>';
  var catBadge = lib.category
    ? '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:600;background:var(--subtle);color:var(--muted)">' + lib.category + '</span>'
    : '';
  return '<div style="border-radius:10px;overflow:hidden;border:2px solid var(--accent);background:var(--surface)">'
    + '<div style="padding:14px;display:flex;flex-direction:column;gap:10px">'
    +   '<div style="display:flex;align-items:center;gap:10px;min-width:0">'
    +     _dspLogoHtml(lib.name, 40)
    +     '<div style="min-width:0;flex:1">'
    +       '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + lib.name + '</div>'
    +       '<div style="display:flex;align-items:center;gap:4px;margin-top:3px">' + typeBadge + catBadge + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;justify-content:flex-end">'
    +     '<button onclick="event.stopPropagation();dspOpenConnect(' + lib.library_id + ')" '
    +       'style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 14px;border:none;border-radius:6px;background:var(--accent);font-size:11px;font-weight:600;color:#fff;cursor:pointer;font-family:inherit;transition:opacity .12s" '
    +       'onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'">'
    +       '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
    +       'Add Presets'
    +     '</button>'
    +   '</div>'
    + '</div>'
    + '</div>';
}

// ── Library modal ─────────────────────────────────────────────────────────────
function dspOpenLibraryModal() {
  var connectedMap = {};
  _dspConnections.forEach(function(c) { connectedMap[c.library_id] = c; });
  var available = _dspLibrary.filter(function(l) { return !connectedMap[l.library_id]; });

  var backdrop = document.createElement('div');
  backdrop.id = 'dsp-lib-modal-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;padding:20px;animation:dsp-fade-in .18s ease';
  backdrop.addEventListener('click', function(e) { if (e.target === backdrop) dspCloseLibraryModal(); });

  var modal = document.createElement('div');
  modal.id = 'dsp-lib-modal';
  modal.style.cssText = 'background:var(--surface);border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.22);width:100%;max-width:780px;max-height:82vh;display:flex;flex-direction:column;overflow:hidden';

  modal.innerHTML =
    '<div style="padding:20px 24px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    +   '<div>'
    +     '<div style="font-size:16px;font-weight:700;color:var(--text)">Partner Library</div>'
    +     '<div style="font-size:12px;color:var(--muted);margin-top:2px">Select platforms to add to your workspace</div>'
    +   '</div>'
    +   '<button onclick="dspCloseLibraryModal()" style="width:30px;height:30px;border:none;background:transparent;cursor:pointer;color:var(--muted);display:flex;align-items:center;justify-content:center;border-radius:7px;transition:background .12s" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'transparent\'">'
    +     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div id="dsp-lib-modal-body" style="flex:1;overflow-y:auto;padding:20px">'
    +   _dspLibModalBodyHtml(available)
    + '</div>'
    + '<div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-shrink:0">'
    +   '<button onclick="dspCloseLibraryModal()" style="height:34px;padding:0 18px;border:1px solid var(--border-md);border-radius:8px;background:transparent;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;font-family:inherit">Cancel</button>'
    +   '<button onclick="dspLibraryModalDone()" id="dsp-lib-modal-add-btn" style="height:34px;padding:0 20px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">'
    +     _dspLibModalBtnLabel()
    +   '</button>'
    + '</div>';

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
}

function _dspLibModalBodyHtml(available) {
  if (!available || !available.length) {
    return '<div style="padding:40px;text-align:center;color:var(--faint);font-size:13px">All platforms are already connected.</div>';
  }
  return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">'
    + available.map(function(l) { return _dspLibCardHtml(l, _dspPendingLibIds.indexOf(l.library_id) >= 0); }).join('')
    + '</div>';
}

function _dspLibModalBtnLabel() {
  var n = _dspPendingLibIds.length;
  return n > 0 ? 'Add Selected (' + n + ')' : 'Add Selected';
}

function _dspLibCardHtml(lib, selected) {
  var typeBadge = '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.04em;'
    + (lib.type === 'DSP' ? 'background:#eff6ff;color:#2563eb' : 'background:#f0fdf4;color:#16a34a')
    + '">' + lib.type + '</span>';
  var catBadge = lib.category
    ? '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:600;background:var(--subtle);color:var(--muted)">' + lib.category + '</span>'
    : '';
  var checkIcon = selected
    ? '<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      +   '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      + '</div>'
    : '<div style="width:22px;height:22px;border-radius:50%;border:2px solid var(--border-md);flex-shrink:0"></div>';
  return '<div onclick="dspLibraryToggleCard(' + lib.library_id + ')" '
    + 'style="border-radius:10px;border:2px solid ' + (selected ? 'var(--accent)' : 'var(--border)') + ';background:' + (selected ? 'var(--subtle)' : 'var(--surface)') + ';cursor:pointer;padding:14px;display:flex;flex-direction:column;gap:10px;transition:border-color .15s,background .15s" '
    + 'onmouseover="if(!this.dataset.sel){this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'}" '
    + 'onmouseout="if(!this.dataset.sel){this.style.borderColor=\'var(--border)\';this.style.background=\'var(--surface)\'}" '
    + (selected ? 'data-sel="1"' : '') + '>'
    +   '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">'
    +     '<div style="display:flex;align-items:center;gap:10px;min-width:0">'
    +       _dspLogoHtml(lib.name, 38)
    +       '<div style="min-width:0">'
    +         '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + lib.name + '</div>'
    +         '<div style="display:flex;align-items:center;gap:4px;margin-top:3px">' + typeBadge + catBadge + '</div>'
    +       '</div>'
    +     '</div>'
    +     checkIcon
    +   '</div>'
    +   (lib.description ? '<div style="font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + lib.description + '</div>' : '')
    + '</div>';
}

function dspLibraryToggleCard(libraryId) {
  var idx = _dspPendingLibIds.indexOf(libraryId);
  if (idx >= 0) { _dspPendingLibIds.splice(idx, 1); }
  else           { _dspPendingLibIds.push(libraryId); }

  // Re-render modal body
  var connectedMap = {};
  _dspConnections.forEach(function(c) { connectedMap[c.library_id] = c; });
  var available = _dspLibrary.filter(function(l) { return !connectedMap[l.library_id]; });
  var body = document.getElementById('dsp-lib-modal-body');
  if (body) body.innerHTML = _dspLibModalBodyHtml(available);

  // Update CTA label
  var btn = document.getElementById('dsp-lib-modal-add-btn');
  if (btn) btn.textContent = _dspLibModalBtnLabel();
}

function dspLibraryModalDone() {
  dspCloseLibraryModal();
  _dspRender();
}

function dspCloseLibraryModal() {
  var el = document.getElementById('dsp-lib-modal-backdrop');
  if (el) el.remove();
}

// ── Single card ───────────────────────────────────────────────────────────────
// Inject pulsing dot keyframe once
(function() {
  if (document.getElementById('dsp-pulse-style')) return;
  var s = document.createElement('style');
  s.id = 'dsp-pulse-style';
  s.textContent = '@keyframes dspPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}';
  document.head.appendChild(s);
})();

function _dspCardHtml(lib, conn) {
  var isConn = !!conn;

  var typeBadge = '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.04em;'
    + (lib.type === 'DSP' ? 'background:#eff6ff;color:#2563eb' : 'background:#f0fdf4;color:#16a34a')
    + '">' + lib.type + '</span>';

  var catBadge = lib.category
    ? '<span style="display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:4px;font-size:9px;font-weight:600;background:var(--subtle);color:var(--muted)">' + lib.category + '</span>'
    : '';

  var logoArea = _dspLogoHtml(lib.name, 40);

  // Active chip with pulsing dot
  var activeBadge = isConn
    ? '<span style="display:inline-flex;align-items:center;gap:5px;height:20px;padding:0 8px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;font-size:10px;font-weight:600;color:#16a34a;white-space:nowrap">'
      + '<span style="width:6px;height:6px;border-radius:99px;background:#16a34a;animation:dspPulse 2s ease-in-out infinite"></span>'
      + 'Active</span>'
    : '';

  // Connect button — only for unconnected
  var cardAction = isConn ? '' :
    '<button onclick="event.stopPropagation();dspOpenConnect(' + lib.library_id + ')" '
    + 'style="display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 10px;border:1px solid var(--accent);border-radius:6px;background:transparent;font-size:11px;font-weight:600;color:var(--accent);cursor:pointer;font-family:inherit;transition:background .12s,color .12s" '
    + 'onmouseover="this.style.background=\'var(--accent)\';this.style.color=\'#fff\'" '
    + 'onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--accent)\'">'
    + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    + 'Connect</button>';

  // Footer — always same height regardless of seat_id presence
  var connDetails = isConn
    ? '<div style="padding:10px 14px;border-top:1px solid var(--border);background:var(--bg)">'
      + '<div style="font-size:11px;color:var(--muted)">Seat ID: <span style="color:' + (conn.seat_id ? 'var(--text);font-weight:500' : 'var(--faint)') + '">' + (conn.seat_id || '—') + '</span></div>'
      + '<div style="font-size:10px;color:var(--faint);margin-top:3px">'
      + (conn.connected_at ? 'Connected ' + _dspFmtDate(conn.connected_at) + (conn.connected_by ? ' · ' + conn.connected_by : '') : '—')
      + '</div>'
      + '</div>'
    : '';

  return '<div onclick="dspOpenConnect(' + lib.library_id + ')" '
    + 'style="border-radius:10px;overflow:hidden;border:1px solid var(--border);background:var(--surface);cursor:pointer;transition:box-shadow .15s" '
    + 'onmouseover="this.style.boxShadow=\'0 2px 10px rgba(0,0,0,.08)\'" '
    + 'onmouseout="this.style.boxShadow=\'none\'">'
    + '<div style="padding:14px;display:flex;flex-direction:column;gap:10px">'
    +   '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">'
    +     '<div style="display:flex;align-items:center;gap:10px;min-width:0">'
    +       logoArea
    +       '<div style="min-width:0">'
    +         '<div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + lib.name + '</div>'
    +         '<div style="display:flex;align-items:center;gap:4px;margin-top:3px">' + typeBadge + catBadge + '</div>'
    +       '</div>'
    +     '</div>'
    +     activeBadge
    +   '</div>'
    +   (lib.description && !isConn
       ? '<div style="font-size:11px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + lib.description + '</div>'
       : '')
    +   (cardAction ? '<div style="display:flex;justify-content:flex-end">' + cardAction + '</div>' : '')
    + '</div>'
    + connDetails
    + '</div>';
}

// ── Connect drawer ────────────────────────────────────────────────────────────
function dspOpenConnect(libraryId) {
  if (!_dspClientId) {
    alert('Please select a client first.');
    return;
  }
  _dspConnectItem = _dspLibrary.find(function(l) { return l.library_id === libraryId; });
  if (!_dspConnectItem) return;

  // Pre-fill from existing connection if already connected
  var existingConn = _dspConnections.find(function(c) { return c.library_id === libraryId; });
  _dspFormValues = (existingConn && existingConn.preset_values) ? Object.assign({}, existingConn.preset_values) : {};
  if (existingConn && existingConn.seat_id) _dspFormValues._seat_id = existingConn.seat_id;

  // Initialise advertiser rows from existing connection or start with one blank row
  _dspAdvRowSearch = '';
  _dspAdvRows = [];
  _dspDrawerTab = 'partner';
  var savedRows = (_dspFormValues.advertiser_rows && Array.isArray(_dspFormValues.advertiser_rows))
    ? _dspFormValues.advertiser_rows : [];
  if (savedRows.length) {
    savedRows.forEach(function(r) {
      _dspAdvRows.push({ uid: ++_dspAdvRowUid, advertiser: r.advertiser || '', advertiserId: r.advertiserId || '' });
    });
  } else {
    _dspAdvRows.push({ uid: ++_dspAdvRowUid, advertiser: '', advertiserId: '' });
  }

  // Inject CSS for slide animation (once)
  if (!document.getElementById('dsp-drawer-style')) {
    var s = document.createElement('style');
    s.id  = 'dsp-drawer-style';
    s.textContent = [
      '@keyframes dsp-slide-in{from{transform:translateX(100%)}to{transform:translateX(0)}}',
      '@keyframes dsp-slide-out{from{transform:translateX(0)}to{transform:translateX(100%)}}',
      '@keyframes dsp-fade-in{from{opacity:0}to{opacity:1}}',
      '@keyframes dsp-fade-out{from{opacity:1}to{opacity:0}}',
    ].join('');
    document.head.appendChild(s);
  }

  // Backdrop
  var backdrop = document.createElement('div');
  backdrop.id = 'dsp-drawer-backdrop';
  backdrop.style.cssText = 'position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.3);animation:dsp-fade-in .2s ease';
  backdrop.addEventListener('click', dspCloseConnect);

  // Drawer panel
  var drawer = document.createElement('div');
  drawer.id = 'dsp-connect-drawer';
  drawer.style.cssText = 'position:fixed;top:0;right:0;bottom:0;z-index:9500;width:420px;max-width:100vw;background:var(--surface);box-shadow:-8px 0 40px rgba(0,0,0,.14);display:flex;flex-direction:column;animation:dsp-slide-in .25s cubic-bezier(.32,.72,0,1)';

  var INP = 'width:100%;height:36px;padding:0 12px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .15s';
  var LBL = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';
  var SEC = 'font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:12px';

  // Tab bar style helper
  var _tabStyle = function(active) {
    return 'display:inline-flex;align-items:center;height:36px;padding:0 16px;border:none;background:none;font-size:12px;font-weight:' + (active ? '600' : '500') + ';color:' + (active ? 'var(--accent)' : 'var(--muted)') + ';cursor:pointer;font-family:inherit;border-bottom:2px solid ' + (active ? 'var(--accent)' : 'transparent') + ';transition:color .15s,border-color .15s;white-space:nowrap';
  };

  drawer.innerHTML =
    // ── Drawer header ──
    '<div style="padding:20px 20px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0">'
    +   '<button onclick="dspCloseConnect()" style="width:30px;height:30px;border:none;background:transparent;cursor:pointer;color:var(--muted);display:flex;align-items:center;justify-content:center;border-radius:7px;flex-shrink:0;transition:background .12s" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'transparent\'">'
    +     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
    +   '</button>'
    +   _dspLogoHtml(_dspConnectItem.name, 38)
    +   '<div style="flex:1;min-width:0">'
    +     '<div style="font-size:15px;font-weight:700;color:var(--text)">Connect ' + _dspConnectItem.name + '</div>'
    +     '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + _dspConnectItem.type + ' · ' + (_dspConnectItem.category || '') + '</div>'
    +   '</div>'
    + '</div>'
    // ── Description (if any) ──
    + (_dspConnectItem.description
        ? '<div style="padding:14px 20px;border-bottom:1px solid var(--border);font-size:12px;color:var(--muted);line-height:1.6;flex-shrink:0">' + _dspConnectItem.description + '</div>'
        : '')
    // ── Tab bar ──
    + '<div id="dsp-tab-bar" style="display:flex;align-items:flex-end;border-bottom:1px solid var(--border);padding:0 20px;flex-shrink:0">'
    +   '<button id="dsp-tab-partner" onclick="dspDrawerSetTab(\'partner\')" style="' + _tabStyle(true) + '">Partner Preset</button>'
    +   '<button id="dsp-tab-advertiser" onclick="dspDrawerSetTab(\'advertiser\')" style="' + _tabStyle(false) + '">Advertiser Preset</button>'
    + '</div>'
    // ── Tab panels ──
    // Partner Preset panel
    + '<div id="dsp-panel-partner" style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:12px">'
    +   '<div><label style="' + LBL + '">Partner ID</label>'
    +     '<input id="dsp-partner-id" type="text" value="' + (_dspFormValues.partner_id || '') + '" placeholder="e.g. 12345" autocomplete="off" style="' + INP + '" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'"></div>'
    +   '<div><label style="' + LBL + '">Seat ID</label>'
    +     '<input id="dsp-seat-id" type="text" value="' + (_dspFormValues.seat_id || _dspFormValues._seat_id || '') + '" placeholder="e.g. seat-abc-001" autocomplete="off" style="' + INP + '" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'"></div>'
    +   '<div><label style="' + LBL + '">API Token</label>'
    +     '<input id="dsp-api-token" type="password" value="" placeholder="Paste token…" autocomplete="new-password" style="' + INP + '" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'"></div>'
    + '</div>'
    // Advertiser Preset panel (hidden initially)
    + '<div id="dsp-panel-advertiser" style="flex:1;overflow-y:auto;padding:20px;display:none;flex-direction:column;gap:0">'
    // Search bar
    +   '<div style="position:relative;margin-bottom:12px">'
    +     '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:var(--faint)" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +     '<input id="dsp-adv-search" type="text" placeholder="Search advertisers…" oninput="dspAdvRowSearch(this.value)" style="' + INP + ';padding-left:32px" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    +   '</div>'
    // Rows header
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 28px;gap:8px;margin-bottom:6px">'
    +     '<span style="font-size:10px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.05em">Advertiser</span>'
    +     '<span style="font-size:10px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.05em">Advertiser ID</span>'
    +     '<span></span>'
    +   '</div>'
    // Rows container
    +   '<div id="dsp-adv-rows" style="display:flex;flex-direction:column;gap:6px">'
    +     _dspAdvRowsHtml()
    +   '</div>'
    // Add row button
    +   '<button onclick="dspAddAdvRow()" style="margin-top:12px;border:none;background:none;padding:0;font-size:12px;font-weight:500;color:var(--accent);cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;transition:opacity .12s" onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'">'
    +     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>'
    +     'Add Row'
    +   '</button>'
    + '</div>'
    // ── Footer ──
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-shrink:0">'
    +   '<button onclick="dspCloseConnect()" style="height:34px;padding:0 18px;border:1px solid var(--border-md);border-radius:8px;background:transparent;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;font-family:inherit;transition:border-color .12s" onmouseover="this.style.borderColor=\'var(--border)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">Cancel</button>'
    +   (existingConn
      ? '<button onclick="dspDisconnect(' + existingConn.connection_id + ')" id="dsp-connect-submit" style="height:34px;padding:0 20px;border:none;border-radius:8px;background:#ef4444;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Disconnect</button>'
      : '<button onclick="dspSubmitConnect()" id="dsp-connect-submit" style="height:34px;padding:0 20px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Connect</button>')
    + '</div>';

  document.body.appendChild(backdrop);
  document.body.appendChild(drawer);
}

function dspCloseConnect() {
  var backdrop = document.getElementById('dsp-drawer-backdrop');
  var drawer   = document.getElementById('dsp-connect-drawer');

  function _remove() {
    if (backdrop) backdrop.remove();
    if (drawer)   drawer.remove();
  }

  if (drawer) {
    drawer.style.animation   = 'dsp-slide-out .22s cubic-bezier(.32,.72,0,1) forwards';
    if (backdrop) backdrop.style.animation = 'dsp-fade-out .22s ease forwards';
    setTimeout(_remove, 220);
  } else {
    _remove();
  }
  _dspConnectItem = null;
}

// ── Tab switcher ──────────────────────────────────────────────────────────────
function dspDrawerSetTab(tab) {
  _dspDrawerTab = tab;
  var panels = ['partner', 'advertiser'];
  panels.forEach(function(p) {
    var panel = document.getElementById('dsp-panel-' + p);
    var btn   = document.getElementById('dsp-tab-' + p);
    if (!panel || !btn) return;
    var active = (p === tab);
    panel.style.display = active ? 'flex' : 'none';
    btn.style.fontWeight   = active ? '600' : '500';
    btn.style.color        = active ? 'var(--accent)' : 'var(--muted)';
    btn.style.borderBottom = active ? '2px solid var(--accent)' : '2px solid transparent';
  });
}

// ── Advertiser row helpers ────────────────────────────────────────────────────
function _dspAdvSelectHtml(uid, selected) {
  var advs = _dspAdvertisers.filter(function(a) { return a.client_org_id === _dspClientId; });
  var opts = '<option value="">— select —</option>'
    + advs.map(function(a) {
        return '<option value="' + a.advertiser_name + '"' + (a.advertiser_name === selected ? ' selected' : '') + '>'
          + a.advertiser_name + '</option>';
      }).join('');
  return '<select onchange="_dspAdvRowChange(' + uid + ',\'advertiser\',this.value)" '
    + 'style="width:100%;height:36px;padding:0 8px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;cursor:pointer">'
    + opts + '</select>';
}

function _dspAdvRowHtml(row) {
  return '<div id="dsp-adv-row-' + row.uid + '" style="display:grid;grid-template-columns:1fr 1fr 28px;gap:8px;align-items:center">'
    + _dspAdvSelectHtml(row.uid, row.advertiser)
    + '<input type="text" value="' + (row.advertiserId || '') + '" placeholder="Advertiser ID" '
    +   'oninput="_dspAdvRowChange(' + row.uid + ',\'advertiserId\',this.value)" '
    +   'style="width:100%;height:36px;padding:0 10px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .15s" '
    +   'onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    + '<button onclick="dspRemoveAdvRow(' + row.uid + ')" '
    +   'style="width:28px;height:28px;border:1px solid var(--border);border-radius:7px;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--faint);transition:border-color .12s,color .12s;flex-shrink:0" '
    +   'onmouseover="this.style.borderColor=\'#ef4444\';this.style.color=\'#ef4444\'" '
    +   'onmouseout="this.style.borderColor=\'var(--border)\';this.style.color=\'var(--faint)\'">'
    +   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>'
    + '</button>'
    + '</div>';
}

function _dspAdvRowsHtml() {
  var q = (_dspAdvRowSearch || '').toLowerCase();
  return _dspAdvRows
    .filter(function(r) { return !q || (r.advertiser || '').toLowerCase().indexOf(q) >= 0 || (r.advertiserId || '').toLowerCase().indexOf(q) >= 0; })
    .map(_dspAdvRowHtml).join('') || '<div style="font-size:12px;color:var(--faint);padding:8px 0">No results</div>';
}

function _dspAdvRowChange(uid, field, val) {
  var row = _dspAdvRows.find(function(r) { return r.uid === uid; });
  if (row) row[field] = val;
}

function dspAddAdvRow() {
  _dspAdvRows.push({ uid: ++_dspAdvRowUid, advertiser: '', advertiserId: '' });
  var container = document.getElementById('dsp-adv-rows');
  if (container) container.innerHTML = _dspAdvRowsHtml();
}

function dspRemoveAdvRow(uid) {
  _dspAdvRows = _dspAdvRows.filter(function(r) { return r.uid !== uid; });
  var container = document.getElementById('dsp-adv-rows');
  if (container) container.innerHTML = _dspAdvRowsHtml();
}

function dspAdvRowSearch(val) {
  _dspAdvRowSearch = val || '';
  var container = document.getElementById('dsp-adv-rows');
  if (container) container.innerHTML = _dspAdvRowsHtml();
}

// ── Submit ────────────────────────────────────────────────────────────────────
function dspSubmitConnect() {
  if (!_dspConnectItem || !_dspClientId) return;
  var values = {};

  // Partner Preset fields
  var partnerId = (document.getElementById('dsp-partner-id') || {}).value || '';
  var seatId    = (document.getElementById('dsp-seat-id')    || {}).value || '';
  var apiToken  = (document.getElementById('dsp-api-token')  || {}).value || '';
  if (partnerId) values.partner_id = partnerId;
  if (seatId)    values.seat_id    = seatId;
  if (apiToken)  values.api_token  = apiToken;

  // Advertiser Preset rows (persist all, including unsaved partial rows)
  values.advertiser_rows = _dspAdvRows
    .filter(function(r) { return r.advertiser || r.advertiserId; })
    .map(function(r) { return { advertiser: r.advertiser, advertiserId: r.advertiserId }; });

  var btn = document.getElementById('dsp-connect-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }

  fetch('/api/dsp-ssp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      library_id:    _dspConnectItem.library_id,
      client_org_id: _dspClientId,
      advertiser_id: _dspAdvId || null,
      seat_id:       seatId || partnerId || null,
      preset_values: values,
      connected_by:  'Bruna M.',
    }),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (!data.ok) { alert('Error: ' + (data.error || 'unknown')); return; }
    dspCloseConnect();
    _dspLoad();
  })
  .catch(function(e) { alert('Network error: ' + e.message); })
  .finally(function() {
    if (btn) { btn.disabled = false; btn.textContent = 'Connect'; }
  });
}

// ── Disconnect ────────────────────────────────────────────────────────────────
function dspDisconnect(connectionId) {
  if (!confirm('Disconnect this integration? The configuration will be lost.')) return;
  fetch('/api/dsp-ssp?connection_id=' + connectionId, { method: 'DELETE' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.ok) _dspLoad();
      else alert('Error: ' + (data.error || 'unknown'));
    })
    .catch(function(e) { alert('Network error: ' + e.message); });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _dspFmtDate(d) {
  if (!d) return '—';
  var dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
