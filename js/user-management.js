// user-management.js

function renderUserManagement() {
  var orgsCols = [
    { label: 'Name' },
    { label: 'Type' },
    { label: 'Users' },
    { label: 'Status' },
    { label: 'Member Since' }
  ];

  var orgsRows = APP_ORGS.map(function(o) {
    var typeBadge;
    if (o.type === 'Publisher')          typeBadge = UI.badge(o.type, '#1D4ED8', '#EFF6FF');
    else if (o.type === 'Agency')        typeBadge = UI.badge(o.type, '#6D28D9', '#F5F3FF');
    else if (o.type === 'Brand Direct')  typeBadge = UI.badge(o.type, '#C2410C', '#FFF7ED');
    else                                 typeBadge = UI.badge(o.type, 'var(--accent)', 'var(--accent-light)');

    var statusBadge = o.status === 'Active'
      ? UI.badge('Active', '#15803D', '#DCFCE7')
      : UI.badge(o.status, 'var(--muted)', 'var(--subtle)');

    return UI.tr([
      '<span style="font-weight:500">' + o.name + '</span>',
      typeBadge,
      o.users,
      statusBadge,
      '<span style="color:var(--muted)">' + o.since + '</span>'
    ]);
  }).join('');

  var usersCols = [
    { label: 'User' },
    { label: 'Role' },
    { label: 'Organization' },
    { label: 'Status' },
    { label: 'Last Active' }
  ];

  var usersRows = APP_USERS.map(function(u) {
    var orgObj = APP_ORGS.find(function(o){ return o.id === u.org; });
    var orgName = orgObj ? orgObj.name : u.org;

    var roleBadge;
    if (u.role === 'Super Admin') roleBadge = UI.badge(u.role, 'var(--accent)', 'var(--accent-light)');
    else if (u.role === 'Admin')  roleBadge = UI.badge(u.role, '#fff', '#1e293b');
    else if (u.role === 'Editor') roleBadge = UI.badge(u.role, '#1D4ED8', '#EFF6FF');
    else if (u.role === 'Planner') roleBadge = UI.badge(u.role, '#6D28D9', '#F5F3FF');
    else                           roleBadge = UI.badge(u.role, 'var(--muted)', 'var(--subtle)');

    var statusBadge = u.status === 'Active'
      ? UI.badge('Active', '#15803D', '#DCFCE7')
      : UI.badge(u.status, 'var(--muted)', 'var(--subtle)');

    return UI.tr([
      UI.avatarCell(u.name, u.email),
      roleBadge,
      '<span style="color:var(--muted)">' + orgName + '</span>',
      statusBadge,
      '<span style="color:var(--muted)">' + u.last + '</span>'
    ]);
  }).join('');

  var pillTabs = [{id:'orgs',label:'Organizations'},{id:'users',label:'Users'}];

  return UI.pageHeader({
      title:      'User Management',
      titleRight: UI.btnPrimary('Invite User', ''),

    })
    + '<div id="um-pills">' + UI.pills(pillTabs, 'orgs', 'umTab') + '</div>'
    + '<div id="um-orgs">'  + UI.table(orgsCols,  orgsRows)  + '</div>'
    + '<div id="um-users" style="display:none">' + UI.table(usersCols, usersRows) + '</div>';
}

function umTab(t) {
  var pillTabs = [{id:'orgs',label:'Organizations'},{id:'users',label:'Users'}];
  var pillsEl = document.getElementById('um-pills');
  if (pillsEl) pillsEl.innerHTML = UI.pills(pillTabs, t, 'umTab');

  var orgsEl  = document.getElementById('um-orgs');
  var usersEl = document.getElementById('um-users');
  if (t === 'orgs') {
    if (orgsEl)  orgsEl.style.display  = 'block';
    if (usersEl) usersEl.style.display = 'none';
  } else {
    if (orgsEl)  orgsEl.style.display  = 'none';
    if (usersEl) usersEl.style.display = 'block';
  }
}
