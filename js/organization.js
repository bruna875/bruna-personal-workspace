// organization.js — unified Organization management page

// ── Organization Management (KERV-only list view) ────────────────────────────

function renderOrgManagement() {
  function typeBadge(type) {
    var styles = {
      'Publisher':          'background:#EFF6FF;color:#1D4ED8',
      'Agency':             'background:#F5F3FF;color:#6D28D9',
      'Brand Direct':       'background:#FFF7ED;color:#C2410C',
      'Super Organization': 'background:var(--accent-light);color:var(--accent)'
    };
    return '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap;' + (styles[type] || '') + '">' + type + '</span>';
  }

  var rows = APP_ORGS.map(function(o) {
    return '<tr style="cursor:pointer" onclick="orgMgmtSelectOrg(\'' + o.id + '\')" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border)">'
          + '<div style="font-size:13px;font-weight:500;color:var(--text)">' + o.name + '</div>'
          + '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + o.since + '</div>'
          + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border)">' + typeBadge(o.type) + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);text-align:center">' + o.users + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);text-align:center">' + o.advertisers + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);text-align:center">' + o.campaigns + '</td>'
      + '<td style="padding:12px 16px;border-bottom:1px solid var(--border)">'
          + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
          + '</td>'
      + '</tr>';
  }).join('');

  return [
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">',
      '<div>',
        '<div class="ptitle" style="margin-bottom:2px">Organization Management</div>',
        '<div style="font-size:12px;color:var(--muted)">' + APP_ORGS.length + ' organizations</div>',
      '</div>',
    '</div>',
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">',
      '<table style="width:100%;border-collapse:collapse">',
        '<thead><tr>',
          ['Organization', 'Type', 'Users', 'Advertisers', 'Campaigns', ''].map(function(h) {
            var align = (h === 'Users' || h === 'Advertisers' || h === 'Campaigns') ? 'center' : 'left';
            return '<th style="font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:' + align + ';border-bottom:1px solid var(--border);white-space:nowrap">' + h + '</th>';
          }).join(''),
        '</tr></thead>',
        '<tbody>' + rows + '</tbody>',
      '</table>',
    '</div>'
  ].join('');
}

function orgMgmtSelectOrg(id) {
  selectOrg(id);
  setPage('organization', 'Organization');
  history.replaceState(null, '', '/organization/users');
}

function renderOrganization() {
  var sub = (location.pathname.split('/')[2] || 'users');
  if (sub !== 'users' && sub !== 'advertisers') sub = 'users';

  return [
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">',
      '<div>',
        '<div class="ptitle" style="margin-bottom:2px">Organization</div>',
        '<div style="font-size:12px;color:var(--muted)">Manage users and advertisers for this organization</div>',
      '</div>',
      '<button onclick="orgInvite()" style="display:flex;align-items:center;gap:6px;height:34px;padding:0 14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer">',
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        '<span id="org-invite-label">' + (sub === 'users' ? 'Invite User' : 'Add Advertiser') + '</span>',
      '</button>',
    '</div>',

    // Tab bar
    '<div style="display:flex;gap:2px;background:var(--bg);border-radius:10px;padding:3px;width:fit-content;margin-bottom:20px">',
      orgTabBtn('users',       'Users',       sub),
      orgTabBtn('advertisers', 'Advertisers', sub),
    '</div>',

    // Tab content
    '<div id="org-tab-content">',
      sub === 'users' ? orgUsersHtml() : orgAdvertisersHtml(),
    '</div>'
  ].join('');
}

function orgTabBtn(tab, label, active) {
  var isActive = tab === active;
  return '<button class="org-tab" data-tab="' + tab + '" onclick="orgSetTab(\'' + tab + '\')" style="'
    + 'height:30px;padding:0 14px;border:none;border-radius:8px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;transition:background .12s,box-shadow .12s;'
    + (isActive
        ? 'background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.08)'
        : 'background:transparent;color:var(--muted)')
    + '">' + label + '</button>';
}

function orgSetTab(tab) {
  history.pushState({ id: 'organization', label: 'Organization' }, '', '/organization/' + tab);
  // Update tab buttons
  document.querySelectorAll('.org-tab').forEach(function(btn) {
    var isActive = btn.dataset.tab === tab;
    btn.style.background    = isActive ? 'var(--surface)' : 'transparent';
    btn.style.color         = isActive ? 'var(--text)'    : 'var(--muted)';
    btn.style.boxShadow     = isActive ? '0 1px 4px rgba(0,0,0,.08)' : 'none';
  });
  // Update invite button label
  var lbl = document.getElementById('org-invite-label');
  if (lbl) lbl.textContent = tab === 'users' ? 'Invite User' : 'Add Advertiser';
  // Swap content
  document.getElementById('org-tab-content').innerHTML = tab === 'users' ? orgUsersHtml() : orgAdvertisersHtml();
}

function orgInvite() { /* placeholder */ }

// ── Users tab ────────────────────────────────────────────────────────────────

function orgUsersHtml() {
  var avatarColors = ['#6D28D9','#1D4ED8','#0891B2','#059669','#D97706','#DC2626','#7C3AED','#0369A1','#047857','#B45309'];

  function avatarHtml(name, idx) {
    var initials = name.split(' ').map(function(p){ return p[0]; }).slice(0,2).join('');
    return '<div style="width:28px;height:28px;border-radius:50%;background:' + avatarColors[idx % avatarColors.length] + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0">' + initials + '</div>';
  }

  function roleBadge(role) {
    var map = {
      'Super Admin': 'background:var(--accent-light);color:var(--accent)',
      'Admin':       'background:#1e293b;color:#fff',
      'Editor':      'background:#EFF6FF;color:#1D4ED8',
      'Planner':     'background:#F5F3FF;color:#6D28D9',
      'Viewer':      'background:var(--subtle);color:var(--muted)'
    };
    return '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;' + (map[role] || map['Viewer']) + '">' + role + '</span>';
  }

  function statusBadge(s) {
    return '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;' + (s === 'Active' ? 'background:#DCFCE7;color:#15803D' : 'background:var(--subtle);color:var(--muted)') + '">' + s + '</span>';
  }

  var rows = APP_USERS.map(function(u, i) {
    var orgObj = APP_ORGS.find(function(o){ return o.id === u.org; });
    return '<tr>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border)">'
          + '<div style="display:flex;align-items:center;gap:10px">'
          + avatarHtml(u.name, i)
          + '<div><div style="font-weight:500;font-size:13px">' + u.name + '</div>'
          + '<div style="font-size:11px;color:var(--muted)">' + u.email + '</div></div>'
          + '</div></td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border)">' + roleBadge(u.role) + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted)">' + (orgObj ? orgObj.name : '—') + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border)">' + statusBadge(u.status) + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border);font-size:12px;color:var(--faint)">' + u.last + '</td>'
      + '</tr>';
  }).join('');

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + ['User','Role','Organization','Status','Last Active'].map(function(h){
        return '<th style="font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap">' + h + '</th>';
      }).join('')
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div>';
}

// ── Advertisers tab ───────────────────────────────────────────────────────────

function orgAdvertisersHtml() {
  function statusBadge(s) {
    return '<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap;background:#DCFCE7;color:#15803D">' + s + '</span>';
  }

  var rows = APP_ADVERTISERS.map(function(a) {
    var orgObj = APP_ORGS.find(function(o){ return o.id === a.org; });
    var typeStyle = orgObj && orgObj.type === 'Agency' ? 'background:#F5F3FF;color:#6D28D9' : 'background:#FFF7ED;color:#C2410C';
    return '<tr>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:500">' + a.name + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border)">'
          + (orgObj ? '<div style="display:flex;align-items:center;gap:7px"><span style="font-size:13px;color:var(--text)">' + orgObj.name + '</span>'
          + '<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;' + typeStyle + '">' + orgObj.type + '</span></div>' : '—')
          + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;font-weight:500">' + a.spend + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--muted);text-align:center">' + a.campaigns + '</td>'
      + '<td style="padding:11px 16px;border-bottom:1px solid var(--border)">' + statusBadge(a.status) + '</td>'
      + '</tr>';
  }).join('');

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + ['Advertiser','Organization','Est. Spend','Campaigns','Status'].map(function(h){
        return '<th style="font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap">' + h + '</th>';
      }).join('')
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table></div>';
}
