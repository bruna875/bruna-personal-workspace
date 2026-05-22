// advertiser-management.js

function renderAdvertiserManagement() {
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

  function statusBadge(status) {
    var s = status === 'Active'
      ? 'background:#DCFCE7;color:#15803D'
      : 'background:var(--subtle);color:var(--muted)';
    return '<span style="' + s + ';font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;white-space:nowrap">' + status + '</span>';
  }

  var thStyle = 'font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.4px;padding:10px 16px;text-align:left;border-bottom:1px solid var(--border)';
  var tdStyle = 'padding:12px 16px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);';
  var tdStyleLast = 'padding:12px 16px;font-size:13px;color:var(--text);';

  var rows = APP_ADVERTISERS.map(function(a, i) {
    var isLast = i === APP_ADVERTISERS.length - 1;
    var td = isLast ? tdStyleLast : tdStyle;
    var orgObj = APP_ORGS.find(function(o){ return o.id === a.org; });
    var orgName = orgObj ? orgObj.name : a.org;
    var orgType = orgObj ? orgObj.type : '';
    return '<tr>'
      + '<td style="' + td + 'font-weight:500">' + a.name + '</td>'
      + '<td style="' + td + '">'
      +   '<div style="display:flex;align-items:center;gap:7px">'
      +     '<span style="color:var(--muted)">' + orgName + '</span>'
      +     (orgType ? orgTypeBadge(orgType) : '')
      +   '</div>'
      + '</td>'
      + '<td style="' + td + 'color:var(--muted)">' + a.spend + '</td>'
      + '<td style="' + td + '">' + a.campaigns + '</td>'
      + '<td style="' + td + '">' + statusBadge(a.status) + '</td>'
      + '</tr>';
  }).join('');

  var table = '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + '<th style="' + thStyle + '">Advertiser</th>'
    + '<th style="' + thStyle + '">Organization</th>'
    + '<th style="' + thStyle + '">Est. Spend</th>'
    + '<th style="' + thStyle + '">Active Campaigns</th>'
    + '<th style="' + thStyle + '">Status</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>';

  var cardStyle = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden';

  return ''
    + '<div class="page-header">'
    +   '<div><div class="ptitle">Advertiser Management</div></div>'
    +   '<button onclick="" style="height:34px;padding:0 16px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer">Add Advertiser</button>'
    + '</div>'
    + '<div style="' + cardStyle + '">' + table + '</div>';
}
