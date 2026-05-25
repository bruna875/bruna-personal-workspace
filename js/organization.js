// organization.js — unified Organization management page

// ── DB advertisers cache (loaded on demand) ───────────────────────────────────
var _orgDbAdvertisers = null; // null = not loaded, [] = loaded

// Active tab state (no URL segment needed)
var _orgActiveTab = 'advertisers'; // default: advertisers first

function _cell(html, align) {
  var a = align ? 'text-align:' + align + ';' : '';
  return '<td style="' + a + 'padding:10px 16px;font-size:13px;vertical-align:middle">' + (html || '—') + '</td>';
}
function _cellN(html) { return _cell(html, 'center'); }

// ── Slug helper ───────────────────────────────────────────────────────────────
function _orgSlug(name) {
  return (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function _orgFromSlug(slug) {
  return APP_ORGS.find(function(o) {
    return _orgSlug(o.name) === slug || String(o.dbId) === slug || o.id === slug;
  });
}

// ── Org Management table ──────────────────────────────────────────────────────
function _orgMgmtRowsHtml() {
  var chevron = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  return APP_ORGS.map(function(o) {
    var nameCell = '<div style="font-size:13px;font-weight:500;color:var(--text)">' + o.name + '</div>'
                 + (o.email && o.email !== '—' ? '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + o.email + '</div>' : '');
    var onclick = 'orgMgmtSelectOrg(' + (o.dbId || 0) + ')';
    return '<tr onclick="' + onclick + '" style="border-bottom:1px solid var(--border);cursor:pointer;transition:background .1s"'
      + ' onmouseenter="this.style.background=\'var(--subtle)\'" onmouseleave="this.style.background=\'\'">'
      + _cell(nameCell)
      + _cell(typeBadgeOrg(o.type))
      + _cell(_mediaTypeStreamBadges(o.mediaTypeStream))
      + _cellN('<span style="font-weight:600">' + (o.advertisers || 0) + '</span>')
      + _cellN('<span style="font-weight:600">' + (o.campaigns   || 0) + '</span>')
      + _cell(chevron, 'right')
      + '</tr>';
  }).join('');
}

function orgLoadFromDB() {
  fetch('/api/organizations')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.orgs || !data.orgs.length) return;
      APP_ORGS = data.orgs;
      // Sync _appDbOrgs too
      _appDbOrgs = APP_ORGS.map(function(o) { return { dbId: o.dbId, name: o.name, type: o.type, mediaTypeStream: o.mediaTypeStream }; });
      var tbody = document.getElementById('org-mgmt-tbody');
      if (tbody) tbody.innerHTML = _orgMgmtRowsHtml();
    })
    .catch(function(e) { console.warn('organizations API unavailable:', e.message); });
}

function renderOrgManagement() {
  setTimeout(orgLoadFromDB, 0);

  var TH = 'padding:10px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);white-space:nowrap';
  var thead = '<thead><tr style="border-bottom:1px solid var(--border);background:var(--bg)">'
    + '<th style="' + TH + ';width:300px">Organization</th>'
    + '<th style="' + TH + ';width:160px">Type</th>'
    + '<th style="' + TH + ';width:180px">Media Type Stream</th>'
    + '<th style="' + TH + ';width:120px;text-align:center">Advertisers</th>'
    + '<th style="' + TH + ';width:120px;text-align:center">Campaigns</th>'
    + '<th style="' + TH + ';width:48px"></th>'
    + '</tr></thead>';

  var tableHtml = '<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border);background:var(--surface)">'
    + '<table style="width:100%;border-collapse:collapse">'
    + thead
    + '<tbody id="org-mgmt-tbody">' + _orgMgmtRowsHtml() + '</tbody>'
    + '</table></div>';

  return UI.pageHeader({ title: 'Organization Management', subtitle: APP_ORGS.length + ' organizations' })
    + tableHtml;
}

function _mediaTypeStreamBadges(arr) {
  if (!arr || !arr.length) return '<span style="font-size:11px;color:var(--faint)">—</span>';
  var colors = { VoD: ['#0369A1','#E0F2FE'], Live: ['#15803D','#F0FDF4'], OLV: ['#7C3AED','#F5F3FF'] };
  return arr.map(function(v) {
    var c = colors[v] || ['var(--muted)','var(--subtle)'];
    return UI.badge(v, c[0], c[1]);
  }).join(' ');
}

function typeBadgeOrg(type) {
  if (type === 'Publisher')          return UI.badge(type, '#1D4ED8', '#EFF6FF');
  if (type === 'Agency')             return UI.badge(type, '#6D28D9', '#F5F3FF');
  if (type === 'Brand Direct')       return UI.badge(type, '#C2410C', '#FFF7ED');
  if (type === 'Brand')              return UI.badge(type, '#0369A1', '#E0F2FE');
  if (type === 'Super Organization') return UI.badge(type, 'var(--accent)', 'var(--accent-light)');
  return UI.badge(type || '—', 'var(--muted)', 'var(--subtle)');
}

function orgMgmtSelectOrg(dbId) {
  selectOrg(dbId);
  // Resolve org to get its name for the slug URL
  var org = APP_ORGS.find(function(o) { return o.dbId === dbId; }) || APP_ORGS[0];
  _orgActiveTab = 'advertisers';
  setPage('organization', 'Organization', true);
  history.pushState({ id: 'organization', label: 'Organization' }, '', '/organization/' + _orgSlug(org.name));
}

// ── Organization detail ───────────────────────────────────────────────────────
function renderOrganization() {
  // Resolve org from URL slug
  var parts   = location.pathname.split('/');
  var orgSlug = parts[2] || '';

  var org = _orgFromSlug(orgSlug)
    || APP_ORGS.find(function(o) { return o.dbId === selectedClientOrgId; })
    || APP_ORGS[0];

  // Default tab to advertisers; preserve in-memory state on re-render
  var tab = _orgActiveTab || 'advertisers';

  // Pencil icon — inline next to the org name in the h1
  var editSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var editInline = '<button type="button" onclick="orgEditOpen()" title="Edit organization" '
    + 'style="display:inline-flex;align-items:center;justify-content:center;'
    + 'width:24px;height:24px;border-radius:6px;border:1px solid var(--border);'
    + 'background:var(--surface);cursor:pointer;color:var(--muted);'
    + 'vertical-align:middle;margin-left:8px;flex-shrink:0;transition:background .12s"'
    + ' onmouseenter="this.style.background=\'var(--subtle)\'" onmouseleave="this.style.background=\'var(--surface)\'">'
    + editSvg + '</button>';

  var plusSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

  var titleRight = UI.btnPrimary(plusSvg + ' <span id="org-invite-label">' + (tab === 'users' ? 'Invite User' : 'Add Advertiser') + '</span>', 'orgInvite()');

  var pillTabs = [
    { id: 'advertisers', label: 'Advertisers' },
    { id: 'users',       label: 'Users'       }
  ];

  // Kick off advertiser load
  setTimeout(function() { orgLoadAdvertisers(org.dbId); }, 0);

  // Hide the legacy content-bc breadcrumb injected by setPage — we use pageHeader's own breadcrumb
  setTimeout(function() { var bc = document.getElementById('content-bc'); if (bc) bc.style.display = 'none'; }, 0);

  return UI.pageHeader({
      breadcrumb: [
        { label: 'Organization Management', onclick: 'setPage(\'org-management\', \'Organization\')' },
        { label: org.name }
      ],
      title:      org.name + editInline,
      titleRight: titleRight,
      mb:         '8px'
    })
    + '<div style="margin-bottom:20px">' + typeBadgeOrg(org.type) + '</div>'
    + '<div id="org-tabs">' + UI.tabNav(pillTabs, tab, 'orgSetTab') + '</div>'
    + '<div id="org-tab-content" style="margin-top:20px">'
    + (tab === 'advertisers' ? orgAdvertisersHtml(org.dbId) : orgUsersHtml())
    + '</div>';
}

// ── Advertisers from DB ───────────────────────────────────────────────────────
function orgLoadAdvertisers(orgDbId) {
  fetch('/api/advertisers')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _orgDbAdvertisers = data.advertisers || [];
      var content = document.getElementById('org-tab-content');
      if (content && _orgActiveTab === 'advertisers') {
        content.innerHTML = orgAdvertisersHtml(orgDbId);
      }
    })
    .catch(function() {});
}

function orgSetTab(tab) {
  _orgActiveTab = tab;

  var org = APP_ORGS.find(function(o) {
    var parts = location.pathname.split('/');
    return _orgSlug(o.name) === parts[2] || o.dbId === selectedClientOrgId;
  }) || APP_ORGS[0];

  // Update tabNav active state
  var pillTabs = [
    { id: 'advertisers', label: 'Advertisers' },
    { id: 'users',       label: 'Users'       }
  ];
  var tabsEl = document.getElementById('org-tabs');
  if (tabsEl) tabsEl.innerHTML = UI.tabNav(pillTabs, tab, 'orgSetTab');

  // Update CTA label
  var lbl = document.getElementById('org-invite-label');
  if (lbl) lbl.textContent = tab === 'users' ? 'Invite User' : 'Add Advertiser';

  // Render tab content
  document.getElementById('org-tab-content').innerHTML =
    tab === 'advertisers' ? orgAdvertisersHtml(org.dbId) : orgUsersHtml();

  if (tab === 'advertisers') orgLoadAdvertisers(org.dbId);
}

function orgInvite() { /* placeholder */ }

// ── Users tab ─────────────────────────────────────────────────────────────────
function orgRoleBadge(role) {
  if (role === 'Super Admin') return UI.badge(role, 'var(--accent)', 'var(--accent-light)');
  if (role === 'Admin')       return UI.badge(role, '#fff', '#1e293b');
  if (role === 'Editor')      return UI.badge(role, '#1D4ED8', '#EFF6FF');
  if (role === 'Planner')     return UI.badge(role, '#6D28D9', '#F5F3FF');
  return UI.badge(role, 'var(--muted)', 'var(--subtle)');
}

function orgUsersHtml() {
  var cols = [
    { label: 'User'        },
    { label: 'Role'        },
    { label: 'Organization'},
    { label: 'Status'      },
    { label: 'Last Active' }
  ];
  var rowsHtml = APP_USERS.map(function(u) {
    var orgObj    = APP_ORGS.find(function(o) { return o.id === u.org; });
    var statusBadge = u.status === 'Active'
      ? UI.badge('Active', '#15803D', '#DCFCE7')
      : UI.badge(u.status, 'var(--muted)', 'var(--subtle)');
    return UI.tr([
      UI.avatarCell(u.name, u.email),
      orgRoleBadge(u.role),
      '<span style="color:var(--muted)">' + (orgObj ? orgObj.name : '—') + '</span>',
      statusBadge,
      '<span style="color:var(--faint)">' + u.last + '</span>'
    ]);
  }).join('');
  return UI.table(cols, rowsHtml);
}

// ── Advertisers tab ───────────────────────────────────────────────────────────
function orgAdvertisersHtml(orgDbId) {
  var advs = _orgDbAdvertisers
    ? _orgDbAdvertisers.filter(function(a) { return a.client_org_id === orgDbId; })
    : [];

  var TH = 'padding:10px 16px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);white-space:nowrap';
  var thead = '<thead><tr style="border-bottom:1px solid var(--border);background:var(--bg)">'
    + '<th style="' + TH + '">#</th>'
    + '<th style="' + TH + ';width:100%">Advertiser</th>'
    + '<th style="' + TH + ';width:80px;text-align:center">ID</th>'
    + '</tr></thead>';

  var rowsHtml;
  if (!_orgDbAdvertisers) {
    rowsHtml = '<tr><td colspan="3" style="padding:32px;text-align:center;font-size:12px;color:var(--faint)">Loading…</td></tr>';
  } else if (!advs.length) {
    rowsHtml = '<tr><td colspan="3" style="padding:40px;text-align:center;font-size:12px;color:var(--faint)">No advertisers for this organization.</td></tr>';
  } else {
    rowsHtml = advs.map(function(a, i) {
      var avatar = '<div style="width:28px;height:28px;border-radius:8px;background:var(--accent-light);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--accent);flex-shrink:0">'
        + (a.advertiser_name || '?').charAt(0).toUpperCase() + '</div>';
      return '<tr style="border-bottom:1px solid var(--border)">'
        + _cell('<span style="font-size:12px;color:var(--faint)">' + (i + 1) + '</span>')
        + _cell('<div style="display:flex;align-items:center;gap:10px">' + avatar + '<span style="font-size:13px;font-weight:500">' + (a.advertiser_name || '—') + '</span></div>')
        + _cellN('<span style="font-size:11px;color:var(--faint);font-family:monospace">' + a.advertiser_id + '</span>')
        + '</tr>';
    }).join('');
  }

  return '<div style="overflow-x:auto;border-radius:10px;border:1px solid var(--border);background:var(--surface)">'
    + '<table style="width:100%;border-collapse:collapse">'
    + thead + '<tbody>' + rowsHtml + '</tbody></table></div>';
}

// ── Edit org modal ────────────────────────────────────────────────────────────
function orgEditOpen() {
  var org = APP_ORGS.find(function(o) { return o.dbId === selectedClientOrgId; }) || APP_ORGS[0];
  var types = ['Publisher', 'Agency', 'Brand', 'Brand Direct', 'Super Organization'];
  var typeOpts = types.map(function(t) { return { val: t, label: t }; });
  var bodyHtml = UI.field('Organization Name', UI.input('oe-name', 'text', '', org.name), true)
    + UI.field('Type', UI.select('oe-type', typeOpts, org.type), true)
    + UI.field('Email', UI.input('oe-email', 'email', '', org.email || ''));
  UI.openModal({
    id:          'org-edit-modal',
    title:       'Edit Organization',
    closeFn:     'orgEditClose',
    bodyHtml:    bodyHtml,
    footerRight: UI.btnCancel('Cancel', 'orgEditClose()') + UI.btnPrimary('Save', 'orgEditSave()')
  });
}

function orgEditClose() { UI.closeModal('org-edit-modal'); }

function orgEditSave() {
  var org = APP_ORGS.find(function(o) { return o.dbId === selectedClientOrgId; });
  if (!org) return;
  org.name  = document.getElementById('oe-name').value.trim()  || org.name;
  org.type  = document.getElementById('oe-type').value;
  org.email = document.getElementById('oe-email').value.trim();
  var nameEl = document.getElementById('orgVal');
  if (nameEl) nameEl.textContent = org.name;
  var typeEl = document.getElementById('orgTypeVal');
  if (typeEl) typeEl.textContent = org.type;
  orgEditClose();
  setPage('organization', 'Organization', true);
  history.replaceState({ id: 'organization', label: 'Organization' }, '', '/organization/' + _orgSlug(org.name));
}
