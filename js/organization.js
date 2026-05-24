// organization.js — unified Organization management page

function _orgMgmtRowsHtml() {
  var chevron = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  return APP_ORGS.map(function(o) {
    var nameCell = '<div style="font-size:13px;font-weight:500;color:var(--text)">' + o.name + '</div>'
                 + '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + o.since + '</div>';
    return UI.tr(
      [ nameCell, typeBadgeOrg(o.type), o.users, o.advertisers, o.campaigns, chevron ],
      { onclick: "orgMgmtSelectOrg('" + o.id + "')" }
    );
  }).join('');
}

function orgLoadFromDB() {
  fetch('/api/organizations')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.orgs || !data.orgs.length) return;
      APP_ORGS = data.orgs;
      var tbody = document.getElementById('org-mgmt-tbody');
      if (tbody) tbody.innerHTML = _orgMgmtRowsHtml();
      var subtitle = document.getElementById('org-mgmt-subtitle');
      if (subtitle) subtitle.textContent = APP_ORGS.length + ' organizations';
    })
    .catch(function(e) { console.warn('organizations API unavailable:', e.message); });
}

function renderOrgManagement() {
  setTimeout(orgLoadFromDB, 0);

  var cols = [
    { label: 'Organization' },
    { label: 'Type' },
    { label: 'Users',       align: 'center' },
    { label: 'Advertisers', align: 'center' },
    { label: 'Campaigns',   align: 'center' },
    { label: '',            width: '40px'   }
  ];

  return UI.pageHeader({ title: 'Organization Management', subtitle: '<span id="org-mgmt-subtitle">' + APP_ORGS.length + ' organizations</span>'})
    + UI.table(cols, _orgMgmtRowsHtml(), 'org-mgmt-tbody');
}

function typeBadgeOrg(type) {
  if (type === 'Publisher')          return UI.badge(type, '#1D4ED8', '#EFF6FF');
  if (type === 'Agency')             return UI.badge(type, '#6D28D9', '#F5F3FF');
  if (type === 'Brand Direct')       return UI.badge(type, '#C2410C', '#FFF7ED');
  if (type === 'Super Organization') return UI.badge(type, 'var(--accent)', 'var(--accent-light)');
  return UI.badge(type, 'var(--muted)', 'var(--subtle)');
}

function orgMgmtSelectOrg(id) {
  selectOrg(id);
  setPage('organization', 'Organization', true);
  history.pushState({ id: 'organization', label: 'Organization' }, '', '/organization/' + id + '/users');
}

function renderOrganization() {
  var parts = location.pathname.split('/');
  // URL: /organization/{org-id}/{tab}
  var orgSlug = parts[2] || selectedOrgId;
  var sub     = parts[3] || 'users';
  if (sub !== 'users' && sub !== 'advertisers') sub = 'users';

  // Resolve org from URL slug, then fall back to selectedOrgId
  var orgFromUrl = APP_ORGS.find(function(o){ return o.id === orgSlug; });
  if (orgFromUrl) selectedOrgId = orgFromUrl.id;
  var org = APP_ORGS.find(function(o){ return o.id === selectedOrgId; }) || APP_ORGS[0];

  var editSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var editBtn = UI.btnIconBordered('orgEditOpen()', 'Edit organization', editSvg, 26);

  var plusSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  var inviteLabel = sub === 'users' ? 'Invite User' : 'Add Advertiser';

  var titleRight = '<div style="display:flex;align-items:center;gap:8px">'
    + typeBadgeOrg(org.type)
    + editBtn
    + UI.btnPrimary(plusSvg + ' <span id="org-invite-label">' + inviteLabel + '</span>', 'orgInvite()')
    + '</div>';

  var pillTabs = [{id:'users',label:'Users'},{id:'advertisers',label:'Advertisers'}];

  return UI.pageHeader({ title: org.name, titleRight: titleRight})
    + '<div id="org-pills">' + UI.pills(pillTabs, sub, 'orgSetTab') + '</div>'
    + '<div id="org-tab-content">'
    + (sub === 'users' ? orgUsersHtml() : orgAdvertisersHtml())
    + '</div>';
}

function orgEditOpen() {
  var org = APP_ORGS.find(function(o){ return o.id === selectedOrgId; }) || APP_ORGS[0];
  var types = ['Publisher', 'Agency', 'Brand Direct', 'Super Organization'];
  var typeOpts = types.map(function(t){ return { val: t, label: t }; });

  var bodyHtml = UI.field('Nome Organizzazione', UI.input('oe-name', 'text', '', org.name), true)
    + UI.field('Tipo', UI.select('oe-type', typeOpts, org.type), true)
    + UI.field('Email di riferimento', UI.input('oe-email', 'email', '', org.email || ''));

  UI.openModal({
    id:          'org-edit-modal',
    title:       'Edit Organization',
    closeFn:     'orgEditClose',
    bodyHtml:    bodyHtml,
    footerRight: UI.btnCancel('Cancel', 'orgEditClose()') + UI.btnPrimary('Save', 'orgEditSave()')
  });
}

function orgEditClose() {
  UI.closeModal('org-edit-modal');
}

function orgEditSave() {
  var org = APP_ORGS.find(function(o){ return o.id === selectedOrgId; });
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
  var tab = location.pathname.split('/')[3] || 'users';
  history.replaceState({ id: 'organization', label: 'Organization' }, '', '/organization/' + org.id + '/' + tab);
}

function orgSetTab(tab) {
  var org = APP_ORGS.find(function(o){ return o.id === selectedOrgId; }) || APP_ORGS[0];
  history.pushState({ id: 'organization', label: 'Organization' }, '', '/organization/' + org.id + '/' + tab);
  var pillTabs = [{id:'users',label:'Users'},{id:'advertisers',label:'Advertisers'}];
  var pillsEl = document.getElementById('org-pills');
  if (pillsEl) pillsEl.innerHTML = UI.pills(pillTabs, tab, 'orgSetTab');
  var lbl = document.getElementById('org-invite-label');
  if (lbl) lbl.textContent = tab === 'users' ? 'Invite User' : 'Add Advertiser';
  document.getElementById('org-tab-content').innerHTML = tab === 'users' ? orgUsersHtml() : orgAdvertisersHtml();
}

function orgInvite() { /* placeholder */ }

function orgRoleBadge(role) {
  if (role === 'Super Admin') return UI.badge(role, 'var(--accent)', 'var(--accent-light)');
  if (role === 'Admin')       return UI.badge(role, '#fff', '#1e293b');
  if (role === 'Editor')      return UI.badge(role, '#1D4ED8', '#EFF6FF');
  if (role === 'Planner')     return UI.badge(role, '#6D28D9', '#F5F3FF');
  return UI.badge(role, 'var(--muted)', 'var(--subtle)');
}

function orgUsersHtml() {
  var cols = [
    { label: 'User' },
    { label: 'Role' },
    { label: 'Organization' },
    { label: 'Status' },
    { label: 'Last Active' }
  ];

  var rowsHtml = APP_USERS.map(function(u) {
    var orgObj = APP_ORGS.find(function(o){ return o.id === u.org; });
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

function orgAdvertisersHtml() {
  var cols = [
    { label: 'Advertiser' },
    { label: 'Organization' },
    { label: 'Tipo' },
    { label: 'Est. Spend' },
    { label: 'Campaigns', align: 'center' },
    { label: 'Status' }
  ];

  var rowsHtml = APP_ADVERTISERS.map(function(a) {
    var orgObj = APP_ORGS.find(function(o){ return o.id === a.org; });
    var statusBadge = UI.badge(a.status, '#15803D', '#DCFCE7');
    return UI.tr([
      '<span style="font-weight:500">' + a.name + '</span>',
      '<span style="color:var(--muted)">' + (orgObj ? orgObj.name : '—') + '</span>',
      orgObj ? typeBadgeOrg(orgObj.type) : '—',
      '<span style="font-weight:500">' + a.spend + '</span>',
      '<span style="display:block;text-align:center">' + a.campaigns + '</span>',
      statusBadge
    ]);
  }).join('');

  return UI.table(cols, rowsHtml);
}
