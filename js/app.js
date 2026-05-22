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
  { id: 'paramount-aus', name: 'Paramount AUS', type: 'Publisher',          email: 'admin@paramount.com.au',  users: 12, advertisers: 3,  campaigns: 18, status: 'Active', since: 'Mar 2024' },
  { id: 'disney',        name: 'Disney',         type: 'Publisher',          email: 'admin@disney.com',         users: 8,  advertisers: 2,  campaigns: 12, status: 'Active', since: 'Jan 2024' },
  { id: 'kerv',          name: 'KERV',            type: 'Super Organization', email: 'admin@kerv.com',           users: 24, advertisers: 0,  campaigns: 0,  status: 'Active', since: 'Jun 2023' },
  { id: 'groupm',        name: 'GroupM',          type: 'Agency',             email: 'admin@groupm.com',         users: 35, advertisers: 8,  campaigns: 47, status: 'Active', since: 'Feb 2024' },
  { id: 'walmart',       name: 'Walmart',         type: 'Brand Direct',       email: 'admin@walmart.com',        users: 6,  advertisers: 1,  campaigns: 8,  status: 'Active', since: 'May 2024' }
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

var selectedOrgId = 'kerv';
var selectedAdvId = 'walmart-adv';

// ── App state ──
var activeId  = 'overview';
var collapsed = false;

// ── Nav config ──
var NAV_CONFIG = [
  {
    items: [
      { id: 'overview',            label: 'Overview',              icon: ico.overview }
    ]
  },
  {
    section: 'Inventory Management',
    sectionBadge: 'Publisher',
    items: [
      { id: 'content-library',     label: 'Inventory Analysis',    icon: ico.metadata },
      { id: 'moments-search',      label: 'Moments Search Tool',   icon: ico.search   }
    ]
  },
  {
    section: 'Plan and Activate',
    items: [
      { id: 'media-planner-v2',    label: 'Media Planner',         icon: ico.showcase  },
      { id: 'campaign-management', label: 'Campaign Management',   icon: ico.campaign, dividerBefore: true },
      { id: 'moments-builder',     label: 'Moments Builder',       icon: ico.builder   },
      { id: 'creative-studio',     label: 'Creative Studio',       icon: ico.creative  }
    ]
  },
  {
    section: 'Reporting and Measure',
    items: [
      { id: 'measurement',         label: 'Measurement',           icon: ico.reporting }
    ]
  },
  {
    section: 'Integration and Libraries',
    dividerBefore: true,
    items: [
      { id: 'dsp-ssp',             label: 'DSP / SSP Connections', icon: ico.dsp       },
      { id: 'api-docs',            label: 'API Documentation',     icon: ico.api       }
    ]
  }
];

// ── Pages map ──
var PAGES = {
  'content-library':       renderMetadataAnalysis,
  'media-planner-v2':      renderMediaPlannerV2,
  'sdt-content-form':      renderSdtContentForm,
  'taxonomy-showcase':     renderTaxonomyShowcase,
  'media-planner':         renderInventoryExplorerV2,
  'organization':          renderOrganization,
  'org-management':        renderOrgManagement
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
      var act = item.id === activeId;
      var div = item.dividerBefore ? '<div style="height:1px;background:var(--border);margin:4px 12px"></div>' : '';
      return div + '<div class="nitem' + (act ? ' act' : '') + '" data-page="' + item.id + '" data-label="' + item.label + '">'
        + (act ? '<div class="nbar"></div>' : '')
        + '<div class="nico">' + item.icon + '</div>'
        + '<span class="nlabel">' + item.label + '</span>'
        + '</div>';
    }).join('');

    var divider = sec.dividerBefore ? '<div style="height:1px;background:var(--border);margin:6px 12px"></div>' : '';

    if (!sec.section) {
      return divider + '<div>' + items + '</div>';
    }

    var col = !!navCollapsed[sec.section];
    var chevron = col
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 6.5l3-3 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var badge = sec.sectionBadge
      ? ' <span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:8px;background:#EFF6FF;color:#1D4ED8;letter-spacing:.2px;vertical-align:middle">' + sec.sectionBadge + '</span>'
      : '';
    var header = '<div class="seclabel seclabel--toggle" onclick="toggleNavSection(\'' + sec.section.replace(/'/g, "\\'") + '\')">'
      + '<span>' + sec.section + badge + '</span>'
      + '<span class="seclabel-chevron">' + chevron + '</span>'
      + '</div>';
    return divider + '<div>' + header + (col ? '' : items) + '</div>';
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
  var path = location.pathname.replace(/^\//, '').replace(/\/$/, '') || 'overview';
  var base = path.split('/')[0];
  // Direct PAGES entries not in NAV_CONFIG (e.g. /organization/users, /organization/advertisers)
  var directLabels = {
    'organization':          'Organization',
    'org-management':        'Organization Management',
    'overview':              'Overview',
    'moments-search':        'Moments Search Tool',
    'campaign-management':   'Campaign Management',
    'moments-builder':       'Moments Builder',
    'creative-studio':       'Creative Studio',
    'measurement':           'Measurement',
    'dsp-ssp':               'DSP / SSP Connections',
    'api-docs':              'API Documentation'
  };
  if (directLabels[base]) return { id: base, label: directLabels[base] };
  var found = null;
  NAV_CONFIG.forEach(function(sec) {
    sec.items.forEach(function(item) {
      if (item.id === base) found = item;
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
      + '<div style="flex:1;min-width:0">'
        + '<div style="font-weight:500;font-size:13px">' + o.name + '</div>'
        + '<div style="font-size:11px;color:var(--faint);margin-top:1px">' + o.type + '</div>'
      + '</div>'
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

function updateOrgMgmtVisibility() {
  var el = document.getElementById('org-mgmt-item');
  if (el) el.style.display = selectedOrgId === 'kerv' ? '' : 'none';
}

function selectOrg(id) {
  selectedOrgId = id;
  var org = APP_ORGS.find(function(o){ return o.id === id; });
  document.getElementById('orgVal').textContent = org.name;
  closeSelectDds();
  updateOrgMgmtVisibility();
  // Hide advertiser dropdown for Brand Direct orgs
  var advWrap = document.getElementById('adv-wrap');
  if (advWrap) advWrap.style.display = org.type === 'Brand Direct' ? 'none' : '';
  if (activeId === 'organization') {
    var sub = location.pathname.split('/')[2] || 'users';
    setPage('organization', 'Organization');
    history.replaceState(null, '', '/organization/' + sub);
  }
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
updateOrgMgmtVisibility();
