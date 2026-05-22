// user-management.js

function renderUserManagement() {
  var avatarColors = ['#6D28D9','#1D4ED8','#0891B2','#059669','#D97706','#DC2626','#7C3AED','#0369A1','#047857','#B45309'];

  function avatarHtml(name, idx) {
    var initials = name.split(' ').map(function(p){ return p[0]; }).slice(0,2).join('');
    var bg = avatarColors[idx % avatarColors.length];
    return '<div style="width:28px;height:28px;border-radius:50%;background:' + bg + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;flex-shrink:0">' + initials + '</div>';
  }

  function roleBadge(role) {
    var styles = {
      'Super Admin': 'background:var(--accent-light);color:var(--accent)',
      'Admin':       'background:#1e293b;color:#fff',
      'Editor':      'background:#EFF6FF;color:#1D4ED8',
      'Planner':     'background:#F5F3FF;color:#6D28D9',
      'Viewer':      'background:var(--subtle);color:var(--muted)'
    };
    var s = styles[role] || styles['Viewer'];
    return '<span style="' + s + ';font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap">' + role + '</span>';
  }

  function statusBadge(status) {
    var s = status === 'Active'
      ? 'background:#DCFCE7;color:#15803D'
      : 'background:var(--subtle);color:var(--muted)';
    return '<span style="' + s + ';font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap">' + status + '</span>';
  }

  function orgTypeBadge(type) {
    var styles = {
      'Publisher':    'background:#EFF6FF;color:#1D4ED8',
      'Agency':       'background:#F5F3FF;color:#6D28D9',
      'Platform':     'background:var(--accent-light);color:var(--accent)',
      'Brand Direct': 'background:#FFF7ED;color:#C2410C'
    };
    var s = styles[type] || styles['Brand Direct'];
    return '<span style="' + s + ';font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">' + type + '</span>';
  }

  var thStyle = 'font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:left;border-bottom:1px solid var(--border)';
  var tdStyle = 'padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);';
  var tdStyleLast = 'padding:12px 16px;font-size:13px;color:var(--text);';

  // Orgs table
  var orgsRows = APP_ORGS.map(function(o, i) {
    var isLast = i === APP_ORGS.length - 1;
    var td = isLast ? tdStyleLast : tdStyle;
    return '<tr>'
      + '<td style="' + td + 'font-weight:500">' + o.name + '</td>'
      + '<td style="' + td + '">' + orgTypeBadge(o.type) + '</td>'
      + '<td style="' + td + '">' + o.users + '</td>'
      + '<td style="' + td + '">' + statusBadge(o.status) + '</td>'
      + '<td style="' + td + 'color:var(--muted)">' + o.since + '</td>'
      + '</tr>';
  }).join('');

  var orgsTable = '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + '<th style="' + thStyle + '">Name</th>'
    + '<th style="' + thStyle + '">Type</th>'
    + '<th style="' + thStyle + '">Users</th>'
    + '<th style="' + thStyle + '">Status</th>'
    + '<th style="' + thStyle + '">Member Since</th>'
    + '</tr></thead>'
    + '<tbody>' + orgsRows + '</tbody>'
    + '</table>';

  // Users table
  var usersRows = APP_USERS.map(function(u, i) {
    var isLast = i === APP_USERS.length - 1;
    var td = isLast ? tdStyleLast : tdStyle;
    var orgObj = APP_ORGS.find(function(o){ return o.id === u.org; });
    var orgName = orgObj ? orgObj.name : u.org;
    return '<tr>'
      + '<td style="' + td + '">'
      +   '<div style="display:flex;align-items:center;gap:10px">'
      +     avatarHtml(u.name, i)
      +     '<div><div style="font-weight:500;font-size:13px">' + u.name + '</div><div style="font-size:11px;color:var(--muted)">' + u.email + '</div></div>'
      +   '</div>'
      + '</td>'
      + '<td style="' + td + '">' + roleBadge(u.role) + '</td>'
      + '<td style="' + td + 'color:var(--muted)">' + orgName + '</td>'
      + '<td style="' + td + '">' + statusBadge(u.status) + '</td>'
      + '<td style="' + td + 'color:var(--muted)">' + u.last + '</td>'
      + '</tr>';
  }).join('');

  var usersTable = '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + '<th style="' + thStyle + '">User</th>'
    + '<th style="' + thStyle + '">Role</th>'
    + '<th style="' + thStyle + '">Organization</th>'
    + '<th style="' + thStyle + '">Status</th>'
    + '<th style="' + thStyle + '">Last Active</th>'
    + '</tr></thead>'
    + '<tbody>' + usersRows + '</tbody>'
    + '</table>';

  var cardStyle = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden';

  return ''
    + '<div class="page-header">'
    +   '<div><div class="ptitle">User Management</div></div>'
    +   '<button onclick="" style="height:34px;padding:0 16px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer">Invite User</button>'
    + '</div>'
    + '<div style="display:flex;gap:3px;margin-bottom:20px;background:var(--bg);border-radius:10px;padding:3px;width:fit-content">'
    +   '<button id="um-tab-orgs" onclick="umTab(\'orgs\')" style="font-size:13px;font-weight:500;padding:6px 14px;border-radius:8px;cursor:pointer;border:none;background:var(--surface);color:var(--text);box-shadow:0 1px 4px rgba(0,0,0,.08);font-family:inherit">Organizations</button>'
    +   '<button id="um-tab-users" onclick="umTab(\'users\')" style="font-size:13px;font-weight:500;padding:6px 14px;border-radius:8px;cursor:pointer;border:none;background:transparent;color:var(--muted);font-family:inherit">Users</button>'
    + '</div>'
    + '<div id="um-orgs" style="' + cardStyle + '">' + orgsTable + '</div>'
    + '<div id="um-users" style="' + cardStyle + ';display:none">' + usersTable + '</div>';
}

function umTab(t) {
  var orgsEl  = document.getElementById('um-orgs');
  var usersEl = document.getElementById('um-users');
  var orgsBtn  = document.getElementById('um-tab-orgs');
  var usersBtn = document.getElementById('um-tab-users');
  if (t === 'orgs') {
    orgsEl.style.display  = 'block';
    usersEl.style.display = 'none';
    orgsBtn.style.background  = 'var(--surface)';
    orgsBtn.style.color       = 'var(--text)';
    orgsBtn.style.boxShadow   = '0 1px 4px rgba(0,0,0,.08)';
    usersBtn.style.background = 'transparent';
    usersBtn.style.color      = 'var(--muted)';
    usersBtn.style.boxShadow  = 'none';
  } else {
    orgsEl.style.display  = 'none';
    usersEl.style.display = 'block';
    usersBtn.style.background = 'var(--surface)';
    usersBtn.style.color      = 'var(--text)';
    usersBtn.style.boxShadow  = '0 1px 4px rgba(0,0,0,.08)';
    orgsBtn.style.background  = 'transparent';
    orgsBtn.style.color       = 'var(--muted)';
    orgsBtn.style.boxShadow   = 'none';
  }
}
