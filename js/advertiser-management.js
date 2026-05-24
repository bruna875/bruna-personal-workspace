// advertiser-management.js

function renderAdvertiserManagement() {
  var cols = [
    { label: 'Advertiser' },
    { label: 'Organization' },
    { label: 'Est. Spend' },
    { label: 'Active Campaigns' },
    { label: 'Status' }
  ];

  var rowsHtml = APP_ADVERTISERS.map(function(a) {
    var orgObj  = APP_ORGS.find(function(o){ return o.id === a.org; });
    var orgName = orgObj ? orgObj.name : a.org;
    var orgType = orgObj ? orgObj.type : '';

    var typeBadge = '';
    if (orgType === 'Publisher')          typeBadge = UI.badge(orgType, '#1D4ED8', '#EFF6FF');
    else if (orgType === 'Agency')        typeBadge = UI.badge(orgType, '#6D28D9', '#F5F3FF');
    else if (orgType === 'Brand Direct')  typeBadge = UI.badge(orgType, '#C2410C', '#FFF7ED');
    else if (orgType)                     typeBadge = UI.badge(orgType, 'var(--accent)', 'var(--accent-light)');

    var orgCell = '<div style="display:flex;align-items:center;gap:7px">'
      + '<span style="color:var(--muted)">' + orgName + '</span>'
      + (typeBadge ? typeBadge : '')
      + '</div>';

    var statusBadge = a.status === 'Active'
      ? UI.badge('Active', '#15803D', '#DCFCE7')
      : UI.badge(a.status, 'var(--muted)', 'var(--subtle)');

    return UI.tr([
      '<span style="font-weight:500">' + a.name + '</span>',
      orgCell,
      '<span style="color:var(--muted)">' + a.spend + '</span>',
      a.campaigns,
      statusBadge
    ]);
  }).join('');

  return UI.pageHeader({
      title:      'Advertiser Management',
      titleRight: UI.btnPrimary('Add Advertiser', ''),

    })
    + UI.table(cols, rowsHtml);
}
