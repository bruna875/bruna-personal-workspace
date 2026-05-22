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

// ── App data ──
var APP_ORGS = [
  { id: 'paramount-aus', name: 'Paramount AUS', type: 'Publisher',    users: 12, status: 'Active', since: 'Mar 2024' },
  { id: 'disney',        name: 'Disney',         type: 'Publisher',    users: 8,  status: 'Active', since: 'Jan 2024' },
  { id: 'kerv',          name: 'KERV',            type: 'Platform',     users: 24, status: 'Active', since: 'Jun 2023' },
  { id: 'groupm',        name: 'GroupM',          type: 'Agency',       users: 35, status: 'Active', since: 'Feb 2024' },
  { id: 'walmart',       name: 'Walmart',         type: 'Brand Direct', users: 6,  status: 'Active', since: 'May 2024' }
];

var APP_ADVERTISERS = [
  { id: 'walmart-adv',  name: 'Walmart',         org: 'walmart',  spend: '$2.4M', campaigns: 8,  status: 'Active' },
  { id: 'target',       name: 'Target',          org: 'groupm',   spend: '$1.8M', campaigns: 5,  status: 'Active' },
  { id: 'home-depot',   name: 'The Home Depot',  org: 'groupm',   spend: '$950K', campaigns: 3,  status: 'Active' }
];

var APP_USERS = [
  { id:'u1', name:'Sarah Mitchell',  email:'sarah.mitchell@paramount.com.au', role:'Admin',       org:'paramount-aus', status:'Active',   last:'2h ago'   },
  { id:'u2', name:'James Thornton',  email:'j.thornton@paramount.com.au',     role:'Editor',      org:'paramount-aus', status:'Active',   last:'1d ago'   },
  { id:'u3', name:'Lena Park',       email:'l.park@paramount.com.au',         role:'Viewer',      org:'paramount-aus', status:'Active',   last:'3d ago'   },
  { id:'u4', name:'Emma Clarke',     email:'e.clarke@disney.com',             role:'Admin',       org:'disney',        status:'Active',   last:'5h ago'   },
  { id:'u5', name:'Tom Reyes',       email:'t.reyes@disney.com',              role:'Editor',      org:'disney',        status:'Inactive', last:'14d ago'  },
  { id:'u6', name:'Bruna Ferrari',   email:'bruna@saykudos.co',               role:'Super Admin', org:'kerv',          status:'Active',   last:'Just now' },
  { id:'u7', name:'Marco Rossi',     email:'m.rossi@kerv.com',                role:'Admin',       org:'kerv',          status:'Active',   last:'1h ago'   },
  { id:'u8', name:'Alex Rivera',     email:'a.rivera@groupm.com',             role:'Admin',       org:'groupm',        status:'Active',   last:'3h ago'   },
  { id:'u9', name:'Priya Nair',      email:'p.nair@groupm.com',               role:'Planner',     org:'groupm',        status:'Active',   last:'2d ago'   },
  { id:'u10',name:'Jordan Kim',      email:'j.kim@walmart.com',               role:'Viewer',      org:'walmart',       status:'Active',   last:'1w ago'   }
];

var selectedOrgId = 'paramount-aus';
var selectedAdvId = 'walmart-adv';

// ── App state ──
var activeId  = 'metadata-analysis';
var collapsed = false;

// ── Nav config — Live Prototypes only (WIP moved to topbar launcher) ──
var NAV_CONFIG = [
  {
    section: 'Live Prototypes',
    items: [
      { id: 'metadata-analysis', label: 'Metadata Analysis',  icon: ico.metadata },
      { id: 'media-planner-v2',  label: 'Media Planner (v2)', icon: ico.showcase }
    ]
  }
];

// ── Pages map ──
var PAGES = {
  'metadata-analysis':     renderMetadataAnalysis,
  'media-planner-v2':      renderMediaPlannerV2,
  'sdt-content-form':      renderSdtContentForm,
  'taxonomy-showcase':     renderTaxonomyShowcase,
  'media-planner':         renderInventoryExplorerV2,
  'user-management':       renderUserManagement,
  'advertiser-management': renderAdvertiserManagement
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

// ── Topbar dropdowns ──

function toggleSettingsMenu(e) {
  e.stopPropagation();
  var settings = document.getElementById('settingsMenu');
  var btn = document.getElementById('settingsBtn');
  var wasOpen = settings.classList.contains('open');
  settings.classList.toggle('open', !wasOpen);
  btn.classList.toggle('active', !wasOpen);
  if (wasOpen) {
    document.getElementById('wipSubmenu').classList.remove('open');
    document.getElementById('wip-chevron').classList.remove('open');
  }
}

function toggleWipSubmenu(e) {
  e.stopPropagation();
  var sub = document.getElementById('wipSubmenu');
  var chevron = document.getElementById('wip-chevron');
  sub.classList.toggle('open');
  chevron.classList.toggle('open');
}

function closeMenus() {
  document.getElementById('settingsMenu').classList.remove('open');
  document.getElementById('settingsBtn').classList.remove('active');
  document.getElementById('wipSubmenu').classList.remove('open');
  document.getElementById('wip-chevron').classList.remove('open');
}

document.addEventListener('click', function(e) {
  if (!e.target.closest('#settings-wrap')) closeMenus();
  if (!e.target.closest('#org-wrap')) { document.getElementById('orgDd').classList.remove('open'); document.getElementById('orgBtn').classList.remove('active'); }
  if (!e.target.closest('#adv-wrap')) { document.getElementById('advDd').classList.remove('open'); document.getElementById('advBtn').classList.remove('active'); }
});

// ── Topbar selectors ──

function orgTypeBadge(type) {
  var cls = type === 'Publisher' ? 'tb-type-publisher' : type === 'Agency' ? 'tb-type-agency' : type === 'Platform' ? 'tb-type-platform' : 'tb-type-brand';
  return '<span class="tb-type-badge ' + cls + '">' + type + '</span>';
}

function buildOrgDd() {
  document.getElementById('orgDd').innerHTML = APP_ORGS.map(function(o) {
    return '<div class="tb-select-item' + (o.id === selectedOrgId ? ' sel' : '') + '" onclick="selectOrg(\'' + o.id + '\')">'
      + '<span class="tb-select-item-name">' + o.name + ' <span style="color:var(--faint);font-weight:400">(' + o.type + ')</span></span>'
      + '</div>';
  }).join('');
}

function buildAdvDd() {
  document.getElementById('advDd').innerHTML = APP_ADVERTISERS.map(function(a) {
    var org = APP_ORGS.find(function(o){ return o.id === a.org; });
    return '<div class="tb-select-item' + (a.id === selectedAdvId ? ' sel' : '') + '" onclick="selectAdv(\'' + a.id + '\')">'
      + '<span class="tb-select-item-name">' + a.name + (org ? ' <span style="color:var(--faint);font-weight:400">(' + org.name + ')</span>' : '') + '</span>'
      + '</div>';
  }).join('');
}

function toggleOrgDd(e) {
  e.stopPropagation();
  var dd = document.getElementById('orgDd');
  var btn = document.getElementById('orgBtn');
  var wasOpen = dd.classList.contains('open');
  closeSelectDds();
  if (!wasOpen) { buildOrgDd(); dd.classList.add('open'); btn.classList.add('active'); }
}

function toggleAdvDd(e) {
  e.stopPropagation();
  var dd = document.getElementById('advDd');
  var btn = document.getElementById('advBtn');
  var wasOpen = dd.classList.contains('open');
  closeSelectDds();
  if (!wasOpen) { buildAdvDd(); dd.classList.add('open'); btn.classList.add('active'); }
}

function closeSelectDds() {
  ['orgDd','advDd'].forEach(function(id){ document.getElementById(id).classList.remove('open'); });
  ['orgBtn','advBtn'].forEach(function(id){ document.getElementById(id).classList.remove('active'); });
}

function selectOrg(id) {
  selectedOrgId = id;
  var org = APP_ORGS.find(function(o){ return o.id === id; });
  document.getElementById('orgVal').textContent = org.name;
  closeSelectDds();
}

function selectAdv(id) {
  selectedAdvId = id;
  var adv = APP_ADVERTISERS.find(function(a){ return a.id === id; });
  document.getElementById('advVal').textContent = adv.name;
  closeSelectDds();
}

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

// Inject WIP icons (ico.* available after icons.js loads)
document.getElementById('wip-ico-0').innerHTML = ico.sdtform;
document.getElementById('wip-ico-1').innerHTML = ico.taxonomy;
document.getElementById('wip-ico-2').innerHTML = ico.showcase;

// Auto-login
document.getElementById('em').value = 'bruna';
document.getElementById('pw').value = 'Bruna2026';
login();
