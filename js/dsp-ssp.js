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
  'FreeWheel':               '#00b49c',
  'OpenX':                   '#1d5fa6',
  'TripleLift':              '#6c3de8',
};

// ── Logo URLs per DSP/SSP name ────────────────────────────────────────────────
var _dspLogos = {
  'TripleLift':              'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692667/triplelift-logo-new_opnz8i.svg',
  'Magnite':                 'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/magnite_logo_x9jqmb.svg',
  'Yahoo DSP':               'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/Yahoo-DSP-logo_cvypas.webp',
  'Xandr':                   'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/xandr_logo_x871tz.png',
  'The Trade Desk':          'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/The_Trade_Desk.svg_lxfpb2.png',
  'PubMatic':                'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/pubmatic_logo_brnf3v.png',
  'Index Exchange':          'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/Index-Exchange-Stacked-Logo-Homepage-1_sip3w5.png',
  'Amazon DSP':              'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/amazon_dsp_us3lmc.png',
  'DV360':                   'https://res.cloudinary.com/dhfrgr4qd/image/upload/v1779692666/dv360_logo_tfrs2c.png',
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
      + 'background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;padding:5px;box-sizing:border-box">'
      + '<img src="' + logoUrl + '" alt="' + name + '" style="width:100%;height:100%;object-fit:contain;display:block">'
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
    _dspRefreshFilters();
    _dspLoad();
  }).catch(function() { _dspLoad(); });

  return UI.pageHeader({ title: 'DSP / SSP Connections', subtitle: 'Manage programmatic integrations and seat connections' })
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden" id="dsp-card">'
    // ── Card header ──
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border);gap:16px">'
    +   '<div style="flex-shrink:0">'
    +     '<div style="font-size:13px;font-weight:600;color:var(--text)">Integrations</div>'
    +     '<div style="font-size:11px;color:var(--faint);margin-top:1px"><span id="dsp-count">—</span> platforms available</div>'
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

  var clientOpts = [{val: '', label: 'Select client…'}].concat(
    _dspClients.map(function(o) { return {val: String(o.dbId), label: o.name}; })
  );

  var html =
    '<span style="font-size:11px;font-weight:500;color:var(--muted);white-space:nowrap">Client</span>'
    + '<div style="width:180px">'
    +   UI.customSelect('dsp-client-cs', clientOpts, _dspClientId ? String(_dspClientId) : '', 'dspSetClient')
    + '</div>';

  // Advertiser select — only visible when a client is selected
  if (_dspClientId) {
    var filteredAdvs = _dspAdvertisers.filter(function(a) {
      return a.client_org_id === _dspClientId;
    });
    var advOpts = [{val: '', label: 'All advertisers'}].concat(
      filteredAdvs.map(function(a) { return {val: String(a.advertiser_id), label: a.advertiser_name}; })
    );
    html +=
      '<div style="width:1px;height:20px;background:var(--border);flex-shrink:0"></div>'
      + '<span style="font-size:11px;font-weight:500;color:var(--muted);white-space:nowrap">Advertiser</span>'
      + '<div style="width:180px">'
      +   UI.customSelect('dsp-adv-cs', advOpts, _dspAdvId ? String(_dspAdvId) : '', 'dspSetAdv')
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
  _dspClientId = val ? parseInt(val) : null;
  _dspAdvId    = null; // reset advertiser when client changes
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
  var countEl = document.getElementById('dsp-count');
  if (countEl) countEl.textContent = _dspLibrary.length;

  // Map connected library IDs → connection
  var connectedMap = {};
  _dspConnections.forEach(function(c) { connectedMap[c.library_id] = c; });

  // Advertiser filter: filter connections
  var visibleConnMap = connectedMap;
  if (_dspAdvId) {
    visibleConnMap = {};
    _dspConnections.forEach(function(c) {
      if (c.advertiser_id === _dspAdvId) visibleConnMap[c.library_id] = c;
    });
  }

  // Search filter
  var q = (_dspSearch || '').toLowerCase().trim();
  var library = q
    ? _dspLibrary.filter(function(l) {
        return l.name.toLowerCase().indexOf(q) >= 0
            || (l.type     || '').toLowerCase().indexOf(q) >= 0
            || (l.category || '').toLowerCase().indexOf(q) >= 0;
      })
    : _dspLibrary;

  var connected = library.filter(function(l) { return !!visibleConnMap[l.library_id]; });
  var available = library.filter(function(l) { return !visibleConnMap[l.library_id]; });

  var html = '';

  if (connected.length) {
    html += '<div style="margin-bottom:24px">'
      + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:12px">Connected</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">'
      + connected.map(function(l) { return _dspCardHtml(l, visibleConnMap[l.library_id]); }).join('')
      + '</div>'
      + '</div>';
  }

  if (available.length) {
    html += '<div>'
      + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin-bottom:12px">'
      + (connected.length ? 'Available' : 'All Platforms')
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">'
      + available.map(function(l) { return _dspCardHtml(l, null); }).join('')
      + '</div>'
      + '</div>';
  }

  if (!html) {
    html = '<div style="padding:40px;text-align:center;color:var(--faint);font-size:13px">'
      + (q ? 'No results for "' + q + '".' : 'No platforms in library.')
      + '</div>';
  }

  var body = document.getElementById('dsp-body');
  if (body) body.innerHTML = html;
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

  // Only show connection-scope fields in the drawer
  var fields = (_dspConnectItem.preset_fields || []).filter(function(f) { return f.scope !== 'campaign'; });
  var color  = _dspColor(_dspConnectItem.name);

  var fieldsHtml = fields.map(function(f) {
    var preVal = _dspFormValues[f.key] || '';
    if (f.type === 'select') {
      return '<div>'
        + '<label style="display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:6px">'
        + f.label + (f.required ? ' <span style="color:var(--accent)">*</span>' : '') + '</label>'
        + '<select id="dsp-field-' + f.key + '" style="width:100%;height:36px;padding:0 10px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box">'
        + (f.options || []).map(function(o) { return '<option value="' + o + '"' + (o === preVal ? ' selected' : '') + '>' + o + '</option>'; }).join('')
        + '</select>'
        + '</div>';
    }
    return '<div>'
      + '<label style="display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:6px">'
      + f.label + (f.required ? ' <span style="color:var(--accent)">*</span>' : '') + '</label>'
      + '<input id="dsp-field-' + f.key + '" type="' + (f.type === 'password' ? 'password' : 'text') + '" '
      + 'value="' + (f.type === 'password' ? '' : preVal) + '" '
      + 'placeholder="' + (f.placeholder || '') + '" autocomplete="off" '
      + 'style="width:100%;height:36px;padding:0 12px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .15s" '
      + 'onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
      + '</div>';
  }).join('');

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
    // ── Form fields ──
    + '<div style="flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:16px">'
    + (fieldsHtml || '<div style="font-size:12px;color:var(--muted);text-align:center;padding:24px 0">No configuration required.</div>')
    + '</div>'
    // ── Footer ──
    + '<div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:10px;flex-shrink:0">'
    +   '<button onclick="dspCloseConnect()" style="height:34px;padding:0 18px;border:1px solid var(--border-md);border-radius:8px;background:transparent;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;font-family:inherit;transition:border-color .12s" onmouseover="this.style.borderColor=\'var(--border)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">Cancel</button>'
    +   '<button onclick="dspSubmitConnect()" id="dsp-connect-submit" style="height:34px;padding:0 20px;border:none;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Connect</button>'
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

function dspSubmitConnect() {
  if (!_dspConnectItem || !_dspClientId) return;
  var fields  = _dspConnectItem.preset_fields || [];
  var values  = {};
  var missing = [];

  fields.forEach(function(f) {
    var el = document.getElementById('dsp-field-' + f.key);
    var v  = el ? el.value.trim() : '';
    if (f.required && !v) { missing.push(f.label); return; }
    if (v) values[f.key] = v;
  });

  if (missing.length) {
    alert('Required fields missing: ' + missing.join(', '));
    return;
  }

  var btn = document.getElementById('dsp-connect-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Connecting…'; }

  fetch('/api/dsp-ssp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      library_id:    _dspConnectItem.library_id,
      client_org_id: _dspClientId,
      advertiser_id: _dspAdvId || null,
      seat_id:       values['seat_id'] || values['partner_id'] || values['member_id'] || values['entity_id'] || values['publisher_id'] || values['site_id'] || null,
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
