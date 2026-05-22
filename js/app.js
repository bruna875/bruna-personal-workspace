// app.js — navigation, routing, events, init

// ── Global driver color system ─────────────────────────────────────────────
var KERV_DRIVER_PALETTE = [
  '#ED005E', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#3B82F6',
  '#84CC16', '#A855F7'
];

function kervDriverColor(name) {
  if (!name || name === '—') return '#8E8E93';
  var h = 0;
  for (var i = 0; i < name.length; i++) { h = (h * 31 + name.charCodeAt(i)) >>> 0; }
  return KERV_DRIVER_PALETTE[h % KERV_DRIVER_PALETTE.length];
}

// ── App state ──
var activeId  = 'metadata-analysis';
var collapsed = false;

// ── Nav config — only Live Prototypes & Work in Progress ──
var NAV_CONFIG = [
  {
    section: 'Live Prototypes',
    items: [
      { id: 'metadata-analysis', label: 'Metadata Analysis',  icon: ico.metadata },
      { id: 'media-planner-v2',  label: 'Media Planner (v2)', icon: ico.showcase }
    ]
  },
  {
    section: 'Work in Progress',
    items: [
      { id: 'sdt-content-form',  label: 'New Content Upload', icon: ico.sdtform },
      { id: 'taxonomy-showcase', label: 'Taxonomy Explorer',  icon: ico.taxonomy },
      { id: 'media-planner',     label: 'Media Planner (v1)', icon: ico.showcase }
    ]
  }
];

// ── Pages map ──
var PAGES = {
  'metadata-analysis': renderMetadataAnalysis,
  'media-planner-v2':  renderMediaPlannerV2,
  'sdt-content-form':  renderSdtContentForm,
  'taxonomy-showcase': renderTaxonomyShowcase,
  'media-planner':     renderInventoryExplorerV2
};

// ── Nav section collapse state — both sections open by default ──
var navCollapsed = {};

function toggleNavSection(section) {
  navCollapsed[section] = !navCollapsed[section];
  buildNav();
}

function buildNav() {
  document.getElementById('nav').innerHTML = NAV_CONFIG.map(function(sec) {
    var items = sec.items.map(function(item) {
      var act     = item.id === activeId;
      var divider = item.dividerBefore ? '<div style="height:1px;background:var(--border);margin:4px 12px"></div>' : '';
      if (item.disabled) {
        return divider + '<div class="nitem" style="opacity:.45;cursor:default;pointer-events:none">'
          + '<div class="nico">' + item.icon + '</div>'
          + '<span class="nlabel">' + item.label + '</span>'
          + '<span class="nsoon" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:var(--subtle);color:var(--muted);font-size:8px;font-weight:700;padding:2px 6px;border-radius:10px;letter-spacing:.4px;white-space:nowrap">Soon</span>'
          + '</div>';
      }
      return divider + '<div class="nitem' + (act ? ' act' : '') + '" data-page="' + item.id + '" data-label="' + item.label + '">'
        + (act ? '<div class="nbar"></div>' : '')
        + '<div class="nico">' + item.icon + '</div>'
        + '<span class="nlabel">' + item.label + '</span>'
        + '</div>';
    }).join('');

    var col = !!navCollapsed[sec.section];
    var chevron = col
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 6.5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var header = '<div class="seclabel seclabel--toggle" onclick="toggleNavSection(\'' + sec.section.replace(/'/g, "\\'") + '\')">'
      + '<span>' + sec.section + '</span>'
      + '<span class="seclabel-chevron">' + chevron + '</span>'
      + '</div>';
    return '<div>' + header + (col ? '' : items) + '</div>';
  }).join('');
}

function setPage(id, label, noPush) {
  activeId = id;
  var content = document.getElementById('content');
  var pageHtml = PAGES[id] ? PAGES[id]() : '<div class="ptitle">' + label + '</div>';
  content.innerHTML = '<div id="content-bc" class="content-bc">' + label + '</div>' + pageHtml;
  buildNav();
  if (!noPush) history.pushState({ id: id, label: label }, '', '/' + id);
}

// ── URL routing helpers ──

function pageFromPath() {
  var path = location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'metadata-analysis';
  var found = null;
  NAV_CONFIG.forEach(function(sec) {
    sec.items.forEach(function(item) {
      if (item.id === path) found = item;
    });
  });
  if (!found) found = NAV_CONFIG[0].items[0];
  return found;
}

window.addEventListener('popstate', function(e) {
  if (e.state && e.state.id) {
    setPage(e.state.id, e.state.label, true);
  } else {
    var item = pageFromPath();
    setPage(item.id, item.label, true);
  }
});

// ── Event delegation ──

document.addEventListener('click', function(e) {
  var ni = e.target.closest('[data-page]');
  if (ni) { setPage(ni.dataset.page, ni.dataset.label); return; }
});

// ── Sidebar toggle ──

function toggleSb() {
  collapsed = !collapsed;
  document.getElementById('sb').classList.toggle('col', collapsed);
  document.getElementById('togico').innerHTML = collapsed
    ? '<path d="M4 2l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    : '<path d="M6 2L3 5l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
}

// ── Login / Logout ──

function login() {
  var e = document.getElementById('em').value.trim(), p = document.getElementById('pw').value;
  if (e === 'bruna' && p === 'Bruna2026') {
    document.getElementById('auth').classList.add('gone');
    setTimeout(function() { document.getElementById('auth').style.display = 'none'; }, 300);
    document.getElementById('app').classList.add('show');
    var name = e.split('@')[0];
    document.getElementById('un').textContent = name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById('av').textContent = name.charAt(0).toUpperCase() + name.charAt(name.length > 1 ? 1 : 0).toUpperCase();
    var startItem = pageFromPath();
    activeId = startItem.id;
    buildNav();
    setPage(startItem.id, startItem.label, true);
  } else {
    document.getElementById('err').textContent = 'Invalid credentials.';
  }
}

function logout() {
  document.getElementById('app').classList.remove('show');
  document.getElementById('auth').style.display = 'flex';
  setTimeout(function() { document.getElementById('auth').classList.remove('gone'); }, 10);
  document.getElementById('pw').value = '';
  document.getElementById('err').textContent = '';
}

// ── Init ──

document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('tog').addEventListener('click', toggleSb);
document.getElementById('pw').addEventListener('keydown', function(e) { if (e.key === 'Enter') login(); });
document.getElementById('em').addEventListener('keydown', function(e) { if (e.key === 'Enter') login(); });

// Auto-login
document.getElementById('em').value = 'bruna';
document.getElementById('pw').value = 'Bruna2026';
login();
