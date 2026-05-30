// campaign-setup-v2.js — DSP-style Campaign Setup layout

// ── State ─────────────────────────────────────────────────────────────────────
var cs2Selected   = { type: 'campaign' };
var cs2Campaign   = { name: '', client: '', advertiser: '', type: '', flightStart: '', flightEnd: '', geo: '', mediaType: '' };
var cs2AdGroups   = [{ name: 'Line Item 1' }];
var cs2CampaignId = null;  // set after first save to campaigns_v2

// ── Entry point ───────────────────────────────────────────────────────────────
function renderCampaignSetupV2() {
  // Reset state on fresh entry
  cs2Selected   = { type: 'campaign' };
  cs2Campaign   = { name: '', client: '', advertiser: '', type: '', flightStart: '', flightEnd: '', geo: '', mediaType: '' };
  cs2AdGroups   = [];
  cs2CampaignId = null;

  // Hide the auto-injected breadcrumb and remove its space
  setTimeout(function() {
    var bc = document.getElementById('content-bc');
    if (bc) { bc.style.display = 'none'; }
  }, 0);

  // margin: -28px -32px cancels the .content padding exactly
  // height: calc(100% + 56px) fills the freed space (28px top + 28px bottom)
  return '<div id="cs2-root" style="display:flex;flex-direction:column;height:calc(100% + 56px);overflow:hidden;margin:-28px -32px;background:var(--bg)">'
    + _cs2Header()
    + '<div style="flex:1;display:flex;overflow:hidden">'
    +   _cs2Sidebar()
    +   _cs2Panel()
    + '</div>'
    + '</div>';
}

// ── Header ────────────────────────────────────────────────────────────────────
function _cs2Header() {
  return '<div id="cs2-header" style="flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 24px;height:52px;background:var(--surface);border-bottom:1px solid var(--border);gap:16px">'
    // Left: back + title
    + '<div style="display:flex;align-items:center;gap:12px">'
    +   '<button onclick="setPage(\'campaign-management\',\'Campaign Management\')" style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border:1px solid var(--border-md);border-radius:6px;background:transparent;cursor:pointer;color:var(--muted)" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'transparent\'">'
    +     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>'
    +   '</button>'
    +   '<div style="display:flex;align-items:center;gap:8px">'
    +     '<span style="font-size:13px;color:var(--muted);cursor:pointer" onclick="setPage(\'campaign-management\',\'Campaign Management\')">Campaign Manager</span>'
    +     '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
    +     '<span id="cs2-breadcrumb-title" style="font-size:13px;font-weight:600;color:var(--text)">Create New Campaign</span>'
    +   '</div>'
    + '</div>'
    // Right: Draft badge + Save + Launch
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;padding:3px 8px;border-radius:20px;background:#f3f4f6;color:var(--muted)">Draft</span>'
    +   '<button id="cs2-save-btn" onclick="cs2Save()" style="height:32px;padding:0 14px;font-size:12px;font-weight:500;font-family:inherit;border:1px solid var(--border-md);border-radius:7px;background:var(--surface);color:var(--text);cursor:pointer" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'var(--surface)\'">Save Draft</button>'
    +   '<button disabled style="height:32px;padding:0 14px;font-size:12px;font-weight:600;font-family:inherit;border:none;border-radius:7px;background:var(--accent);color:#fff;cursor:not-allowed;opacity:.45">Launch Campaign</button>'
    + '</div>'
    + '</div>';
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function _cs2Sidebar() {
  var campAct  = cs2Selected.type === 'campaign';
  var campName = (typeof _cmDraftCampaignName !== 'undefined' && _cmDraftCampaignName) ? _cmDraftCampaignName : (cs2Campaign.name || 'New Campaign');

  var agItems = cs2AdGroups.map(function(ag, i) {
    var act = cs2Selected.type === 'adgroup' && cs2Selected.idx === i;
    var actStyle  = act ? 'background:#E8EDF5;' : '';
    var txtColor  = act ? '#0D1E36' : 'var(--text)';
    var iconColor = act ? '#0D1E36' : 'var(--muted)';
    var weight    = act ? '600' : '400';
    return '<div onclick="cs2Select(\'adgroup\',' + i + ')" style="display:flex;align-items:center;gap:8px;padding:6px 14px 6px 36px;cursor:pointer;border-radius:5px;margin:1px 6px;' + actStyle + '" onmouseover="if(!this.dataset.act)this.style.background=\'#f3f4f6\'" onmouseout="if(!this.dataset.act)this.style.background=\'' + (act ? '#E8EDF5' : '') + '\'"' + (act ? ' data-act="1"' : '') + '>'
      + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/><path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/><path d="M3 5c0 1.1.9 2 2 2"/><path d="M3 3v13c0 1.1.9 2 2 2h3"/></svg>'
      + '<span style="font-size:11.5px;font-weight:' + weight + ';color:' + txtColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:138px">'
      + (ag.name || 'Line Item ' + (i + 1))
      + '</span>'
      + '</div>';
  }).join('');

  var addBtn = '<div onclick="cs2AddAdGroup()" style="display:flex;align-items:center;gap:8px;padding:6px 14px 6px 36px;cursor:pointer;border-radius:5px;margin:1px 6px;color:#9ca3af" onmouseover="this.style.background=\'#f3f4f6\';this.style.color=\'var(--accent)\'" onmouseout="this.style.background=\'\';this.style.color=\'#9ca3af\'">'
    + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>'
    + '<span style="font-size:11.5px;font-weight:500">Add Line Item</span>'
    + '</div>';

  var campActStyle  = campAct ? 'background:#E8EDF5;' : '';
  var campTxtColor  = campAct ? '#0D1E36' : 'var(--text)';
  var campIconColor = campAct ? '#0D1E36' : 'var(--muted)';
  var campWeight    = campAct ? '600' : '500';

  return '<div id="cs2-sidebar" style="width:232px;flex-shrink:0;border-right:1px solid var(--border);background:#f7f8fa;display:flex;flex-direction:column;overflow:hidden">'
    // Section label
    + '<div style="padding:14px 16px 8px;flex-shrink:0">'
    +   '<div style="font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Structure</div>'
    + '</div>'
    // Tree
    + '<div style="flex:1;overflow-y:auto;padding:2px 0 10px">'
    // Campaign node
    +   '<div onclick="cs2Select(\'campaign\')" style="display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;border-radius:5px;margin:1px 6px;' + campActStyle + '" onmouseover="if(!this.dataset.act)this.style.background=\'#ebebed\'" onmouseout="if(!this.dataset.act)this.style.background=\'' + (campAct ? '#E8EDF5' : '') + '\'"' + (campAct ? ' data-act="1"' : '') + '>'
    +   '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + campIconColor + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5"/><circle cx="13" cy="12" r="2"/><path d="M13 14v4"/><path d="M7 12v4"/></svg>'
    +   '<span style="font-size:11.5px;font-weight:' + campWeight + ';color:' + campTxtColor + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px">' + campName + '</span>'
    +   '</div>'
    // Children with connector line (only show line if there are items)
    +   '<div style="position:relative">'
    +     (cs2AdGroups.length > 0 ? '<div style="position:absolute;left:22px;top:0;bottom:20px;width:1px;background:#e2e4e7"></div>' : '')
    +     agItems
    +     addBtn
    +   '</div>'
    + '</div>'
    + '</div>';
}

// ── Main panel ────────────────────────────────────────────────────────────────
function _cs2Panel() {
  var isAg = cs2Selected.type === 'adgroup';
  // Ad group mode: no padding so the sticky nav can sit flush at the top.
  // Campaign mode: normal padding.
  var st = isAg
    ? 'flex:1;overflow-y:auto;padding:0;background:var(--bg)'
    : 'flex:1;overflow-y:auto;padding:24px 28px;background:var(--bg)';
  return '<div id="cs2-panel" style="' + st + '">'
    + _cs2PanelContent()
    + '</div>';
}

// Updates both the panel padding/overflow and its content after a selection change.
function _cs2UpdatePanel() {
  var panel = document.getElementById('cs2-panel');
  if (!panel) return;
  var isAg = cs2Selected.type === 'adgroup';
  panel.style.cssText = isAg
    ? 'flex:1;overflow-y:auto;padding:0;background:var(--bg)'
    : 'flex:1;overflow-y:auto;padding:24px 28px;background:var(--bg)';
  panel.innerHTML = _cs2PanelContent();
  if (isAg) {
    cs2LiLoadCreatives(cs2Selected.idx);
    if (typeof cmRenderMpSection === 'function') cmRenderMpSection();
  }
}

function _cs2PanelContent() {
  if (cs2Selected.type === 'campaign') return _cs2CampaignForm();
  if (cs2Selected.type === 'adgroup')  return _cs2AdGroupForm(cs2Selected.idx);
  return '';
}

// ── Campaign Details form — mirrors v1 exactly ────────────────────────────────
function _cs2CampaignForm() {
  // Initialise shared v1 state for a new campaign
  _cmDraftAdv             = '';
  _cmDraftFlight          = { start: '', end: '' };
  _cmDraftGeo             = [];
  _cmDraftCampaignName    = '';
  _cmDraftAddl.mediaType  = [];
  _cmCurrentAdvertiserId  = null;
  _cmNameMode             = 'name';
  // For non-super-org users, pre-set client from current session org
  if (!_appIsSuperOrg()) {
    var _lockedOrg = (typeof _appDbOrgs !== 'undefined' && _appDbOrgs.length)
      ? _appDbOrgs.find(function(o) { return o.dbId === selectedClientOrgId; }) : null;
    _cmDraftClient        = _lockedOrg ? _lockedOrg.name : '';
    _cmCurrentClientOrgId = selectedClientOrgId || null;
  } else {
    _cmDraftClient        = '';
    _cmCurrentClientOrgId = null;
  }

  var LB = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';

  // ── triggers (same logic as v1 _cmSetupChecklist) ──
  var geoTrigger = '<div style="position:relative">'
    + '<button type="button" id="cm-draft-geo-btn" onclick="cmDraftGeoToggle(event)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-geo-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-style:italic">Set geography</span>'
    +   _CS_ARW
    + '</button>'
    + '<div id="cm-draft-geo-panel" style="display:none">'
    +   _cmSearchablePanel('cm-draft-geo-search','cm-draft-geo-list','_cmBuildGeoList')
    + '</div>'
    + '</div>';

  var advTrigger = '<div style="position:relative">'
    + '<button type="button" id="cm-draft-adv-btn" onclick="cmDraftAdvToggle(event)" style="' + _CS_TRIG + ';opacity:.45;cursor:not-allowed">'
    +   '<span id="cm-draft-adv-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-style:italic">Select a client first</span>'
    +   _CS_ARW
    + '</button>'
    + '<div id="cm-draft-adv-panel" style="display:none">'
    +   _cmSearchablePanel('cm-draft-adv-search','cm-draft-adv-list','_cmBuildAdvList')
    + '</div>'
    + '</div>';

  var flightTrigger = '<button type="button" onclick="cmDraftFlightOpen(this)" style="' + _CS_TRIG + ';justify-content:flex-start;gap:6px">'
    + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>'
    + '<span id="cm-draft-flight-lbl">Set flight dates</span>'
    + '</button>';

  var clientTrigger = _appIsSuperOrg()
    ? '<div style="position:relative">'
      + '<button type="button" id="cm-draft-client-btn" onclick="cmDraftClientToggle(event)" style="' + _CS_TRIG + '">'
      +   '<span id="cm-draft-client-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-style:italic">Not selected</span>'
      +   _CS_ARW
      + '</button>'
      + '<div id="cm-draft-client-panel" style="display:none">'
      +   _cmSearchablePanel('cm-draft-client-search','cm-draft-client-list','_cmBuildClientList')
      + '</div>'
      + '</div>'
    : '<div style="height:36px;padding:0 12px;border:1px solid var(--border);border-radius:8px;background:var(--bg);display:flex;align-items:center;font-size:12px;font-weight:500;color:var(--text);cursor:not-allowed;opacity:.8;box-sizing:border-box">'
      + (_cmDraftClient || '—')
      + '</div>';

  var mediaTypeTrigger = '<div style="position:relative">'
    + '<button type="button" onclick="_cmAddlOpen(\'cm-mediatype-dd\',function(){return _cmCheckboxDdContent(\'cm-mediatype-dd\',[\'Display\',\'Video\',\'CTV\',\'Audio\',\'Native\'],\'mediaType\',false,false)},this)" style="' + _CS_TRIG + '">'
    +   '<span id="cm-draft-mediatype-lbl" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint)">Not selected</span>'
    +   _CS_ARW
    + '</button>'
    + '</div>';

  // ── form — same HTML as v1 detailsForm, wrapped in a card ──
  return '<div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:10px">Campaign Details</div>'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<div style="padding:20px 24px">'
    // Row 1
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
    +   '<div style="min-width:0"><label style="' + LB + '">Client ID / Partner ID</label>' + clientTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Advertiser</label>' + advTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Campaign Name / ID</label>'
    +     '<div id="cm-name-field" style="display:flex;align-items:center;gap:8px;height:36px;padding:0 11px 0 4px;border:1px solid var(--border-md);border-radius:5px;background:var(--surface);transition:border-color .15s" onfocusin="this.style.borderColor=\'var(--accent)\'" onfocusout="this.style.borderColor=\'var(--border-md)\'">'
    +       '<div style="display:inline-flex;background:#f3f4f6;border-radius:4px;padding:2px;gap:1px;flex-shrink:0">'
    +         '<button type="button" onclick="cmSwitchNameMode(this,\'name\');_cs2RefreshSidebar()" style="height:20px;padding:0 7px;border:none;border-radius:3px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;background:#fff;color:var(--accent);box-shadow:0 1px 2px rgba(0,0,0,.1);transition:background .12s,color .12s">Name</button>'
    +         '<button type="button" onclick="cmSwitchNameMode(this,\'id\')" style="height:20px;padding:0 7px;border:none;border-radius:3px;font-size:10px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:#9ca3af;transition:background .12s,color .12s">ID</button>'
    +       '</div>'
    +       '<input id="cm-draft-name" type="text" placeholder="Campaign name…" value="" style="flex:1;min-width:0;border:none;outline:none;font-size:12px;font-family:inherit;color:var(--text);background:transparent" oninput="_cmDraftCampaignName=this.value;_cs2RefreshSidebar();_cs2RefreshBreadcrumb()">'
    +     '</div>'
    +   '</div>'
    + '</div>'
    // Row 2
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">'
    +   '<div style="min-width:0"><label style="' + LB + '">Flight Dates</label>' + flightTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Geography</label>' + geoTrigger + '</div>'
    +   '<div style="min-width:0"><label style="' + LB + '">Campaign Type</label>'
    +   UI.customSelect('cm-draft-camptype', [{val:'',label:'Not selected'},{val:'standard',label:'Standard'},{val:'pg',label:'Programmatic Guaranteed'}], '', null)
    +   '</div>'
    + '</div>'
    // Additional Details divider
    + '<div style="display:flex;align-items:center;gap:10px;margin:16px 0 14px">'
    +   '<div style="flex:1;height:1px;background:var(--border)"></div>'
    +   '<span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--faint);white-space:nowrap">Additional Details</span>'
    +   '<div style="flex:1;height:1px;background:var(--border)"></div>'
    + '</div>'
    + '<div id="cm-addl-details-panel">'
    +   '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">'
    +     '<div style="min-width:0"><label style="' + LB + '">Budget</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cm-addl-budget-dd\',_cmBudgetContent,this)" style="' + _CS_TRIG + '">'
    +           '<span id="cm-draft-budget-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div style="min-width:0"><label style="' + LB + '">Impr. / day</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cm-addl-impr-dd\',_cmImprContent,this)" style="' + _CS_TRIG + '">'
    +           '<span id="cm-draft-impr-lbl" style="flex:1;color:var(--faint)">Any</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div style="min-width:0"><label style="' + LB + '">Pacing Mode</label>'
    +       UI.customSelect('cm-draft-pacing', [{val:'',label:'Not selected'},{val:'ahead',label:'Ahead'},{val:'evenly',label:'Evenly'}], '', null)
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '</div>'
    // Footer with save button
    + '<div style="padding:12px 24px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:10px">'
    +   '<span id="cs2-camp-save-feedback" style="font-size:12px;font-weight:500;opacity:0;transition:opacity .3s"></span>'
    +   UI.btnSecondary('Save Campaign Details', 'cs2SaveCampaignDetails()', 'cs2-camp-save-btn')
    + '</div>'
    + '</div>'
    + '</div>';
}

// ── Moments Group form ─────────────────────────────────────────────────
// The panel has padding:0 + overflow-y:auto in Moments Group mode.
// The sticky nav sits at top:0 — flush against the campaign setup header, no gap.
// Below it: three separate cards in a padded wrapper.
function _cs2AdGroupForm(idx) {
  var ag  = cs2AdGroups[idx] || {};
  var LB  = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';
  var INP = 'height:36px;padding:0 12px;border:1px solid var(--border-md);border-radius:6px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;width:100%;box-sizing:border-box;transition:border-color .15s';
  var CARD = 'background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden';
  var CARD_HDR = 'padding:14px 20px 12px;font-size:12px;font-weight:600;color:var(--text);border-bottom:1px solid var(--border)';

  var removeBtn = idx > 0
    ? '<button onclick="cs2RemoveAdGroup(' + idx + ')" style="height:28px;padding:0 12px;font-size:11px;font-weight:500;font-family:inherit;border:1px solid var(--border-md);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer" onmouseover="this.style.color=\'#ef4444\';this.style.borderColor=\'#fca5a5\'" onmouseout="this.style.color=\'var(--muted)\';this.style.borderColor=\'var(--border-md)\'">Remove</button>'
    : '';

  var icoSettings  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M9 5H5"/><path d="M9 9H5"/><path d="M9 13H5"/><path d="M9 17H5"/><path d="M13 5h6"/><path d="M13 9h6"/><path d="M13 13h2"/><path d="m17 17 2 2 4-4"/></svg>';
  var icoCreatives = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
  var icoMoments   = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>';

  function tabAnchor(sectionId, label, icon) {
    return '<button onclick="cs2ScrollToAgSection(\'' + sectionId + '\')" '
      + 'onmouseover="this.style.background=\'var(--secondary-light)\';this.style.color=\'var(--secondary)\'" '
      + 'onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--muted)\'" '
      + 'style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:6px;border:none;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;background:transparent;color:var(--muted);transition:background .12s,color .12s">'
      + icon + label + '</button>';
  }

  // ── Card 1: Moments Group settings ──
  var card1 = '<div id="cs2-ag-section-settings-' + idx + '" style="' + CARD + '">'
    + '<div style="' + CARD_HDR + '">Line Item Details</div>'
    + '<div style="padding:20px;display:flex;flex-direction:column;gap:16px">'

    // Row 1: Name | Media Type | Device Type
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">'
    +     '<div><label style="' + LB + '">Line Item Name</label>'
    +       '<input id="cs2-ag-name-' + idx + '" type="text" placeholder="Line Item name…" value="' + (ag.name||'') + '" style="' + INP + '" oninput="cs2UpdateAgName(' + idx + ',this.value)" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    +     '</div>'
    +     '<div><label style="' + LB + '">Media Type</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cs2-li-mediatype-dd-' + idx + '\',function(){return cs2LiCheckboxContent(' + idx + ',\'cs2-li-mediatype-dd-' + idx + '\',[\'Display\',\'Video\',\'CTV\',\'Audio\',\'Native\'],\'mediaType\',\'cs2-li-mediatype-lbl-' + idx + '\')},this)" style="' + _CS_TRIG + '">'
    +           '<span id="cs2-li-mediatype-lbl-' + idx + '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint)">Not selected</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div><label style="' + LB + '">Device Type</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cs2-li-devicetype-dd-' + idx + '\',function(){return cs2LiCheckboxContent(' + idx + ',\'cs2-li-devicetype-dd-' + idx + '\',[\'CTV\',\'Desktop\',\'Mobile Web\',\'Mobile App\'],\'deviceType\',\'cs2-li-devicetype-lbl-' + idx + '\')},this)" style="' + _CS_TRIG + '">'
    +           '<span id="cs2-li-devicetype-lbl-' + idx + '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint)">Not selected</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'

    // Row 2: Geo | Line Item Budget | Bid CPM (base + max combined)
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">'
    +     '<div><label style="' + LB + '">Geography</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cs2-li-geo-dd-' + idx + '\',function(){return cs2LiGeoContent(' + idx + ')},this)" style="' + _CS_TRIG + '">'
    +           '<span id="cs2-li-geo-lbl-' + idx + '" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--faint);font-style:italic">Inherited from campaign</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +     '<div><label style="' + LB + '">Line Item Budget</label>'
    +       '<div style="position:relative"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--muted);pointer-events:none">$</span>'
    +       '<input type="number" min="0" placeholder="0.00" value="' + (ag.budget != null ? ag.budget : '') + '" style="' + INP + ';padding-left:22px" oninput="cs2AdGroups[' + idx + '].budget=parseFloat(this.value)||null" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'"></div>'
    +     '</div>'
    +     '<div><label style="' + LB + '">Bid CPM</label>'
    +       '<div style="position:relative">'
    +         '<button type="button" onclick="_cmAddlOpen(\'cs2-li-cpm-dd-' + idx + '\',function(){return cs2LiCpmContent(' + idx + ')},this)" style="' + _CS_TRIG + '">'
    +           '<span id="cs2-li-cpm-lbl-' + idx + '" style="flex:1;color:var(--faint)">Not set</span>' + _CS_ARW
    +         '</button>'
    +       '</div>'
    +     '</div>'
    +   '</div>'

    + '</div>'
    // Footer
    + '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;gap:10px">'
    +   '<span id="cs2-li-save-feedback-' + idx + '" style="font-size:12px;font-weight:500;opacity:0;transition:opacity .3s"></span>'
    +   UI.btnSecondary('Save Line Item Details', 'cs2SaveLineItemDetails(' + idx + ')', 'cs2-li-save-btn-' + idx)
    + '</div>'
    + '</div>';

  // ── Card 2: Creatives (reads from creatives_v2) ──
  var card2 = '<div id="cs2-ag-section-creatives-' + idx + '" style="' + CARD + '">'
    + '<div style="' + CARD_HDR + '">Creatives</div>'
    + '<div id="cs2-creatives-list-' + idx + '" style="min-height:80px;display:flex;align-items:center;justify-content:center">'
    +   '<span style="font-size:12px;color:var(--faint)">Loading…</span>'
    + '</div>'
    + '</div>';

  // ── Card 3: Moments Match ──
  var card3 = '<div id="cs2-ag-section-moments-' + idx + '" style="' + CARD + '">'
    + '<div style="' + CARD_HDR + '">Moments Match</div>'
    + '<div id="cm-moments-panel">' + _cmMomentsInnerHtml() + '</div>'
    + '</div>';

  return ''
    // Name header — scrolls away with content
    + '<div style="padding:20px 28px 12px;display:flex;align-items:center;justify-content:space-between">'
    +   '<div style="font-size:13px;font-weight:600;color:var(--text)">' + (ag.name || 'Line Item ' + (idx + 1)) + '</div>'
    +   removeBtn
    + '</div>'
    // Sticky nav — top:0 is flush because panel has no top padding
    + '<div style="position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:2px;padding:4px 24px;background:var(--bg);border-top:1px solid var(--border);border-bottom:1px solid var(--border)">'
    +   tabAnchor('cs2-ag-section-settings-'  + idx, 'Line Item Details', icoSettings)
    +   tabAnchor('cs2-ag-section-creatives-' + idx, 'Creatives',          icoCreatives)
    +   tabAnchor('cs2-ag-section-moments-'   + idx, 'Moments Match',      icoMoments)
    + '</div>'
    // Three cards
    + '<div style="padding:16px 28px 24px;display:flex;flex-direction:column;gap:12px">'
    +   card1 + card2 + card3
    + '</div>';
}

function cs2ScrollToAgSection(sectionId) {
  var el    = document.getElementById(sectionId);
  var panel = document.getElementById('cs2-panel');
  if (!el || !panel) return;
  // Scroll panel so the section top sits just below the sticky nav (~46px)
  var pRect = panel.getBoundingClientRect();
  var eRect = el.getBoundingClientRect();
  panel.scrollTop += (eRect.top - pRect.top) - 46;
}

// ── Interactions ──────────────────────────────────────────────────────────────
function cs2Select(type, idx) {
  cs2Selected = (type === 'adgroup') ? { type: 'adgroup', idx: idx } : { type: 'campaign' };
  _cs2RefreshSidebar();
  _cs2UpdatePanel();
}

function cs2AddAdGroup() {
  cs2AdGroups.push({ name: 'Line Item ' + (cs2AdGroups.length + 1) });
  cs2Selected = { type: 'adgroup', idx: cs2AdGroups.length - 1 };
  _cs2RefreshSidebar();
  _cs2UpdatePanel();
}

function cs2RemoveAdGroup(idx) {
  cs2AdGroups.splice(idx, 1);
  cs2Selected = cs2AdGroups.length === 0
    ? { type: 'campaign' }
    : { type: 'adgroup', idx: Math.min(idx, cs2AdGroups.length - 1) };
  _cs2RefreshSidebar();
  _cs2UpdatePanel();
}

function cs2UpdateAgName(idx, val) {
  cs2AdGroups[idx].name = val;
  _cs2RefreshSidebar();
}

function cs2GoFirstAdGroup() {
  if (cs2AdGroups.length === 0) cs2AdGroups.push({ name: 'Line Item 1' });
  cs2Selected = { type: 'adgroup', idx: 0 };
  _cs2RefreshSidebar();
  _cs2UpdatePanel();
}

function _cs2RefreshBreadcrumb() {
  var el = document.getElementById('cs2-breadcrumb-title');
  if (!el) return;
  var name = (typeof _cmDraftCampaignName !== 'undefined' && _cmDraftCampaignName && _cmDraftCampaignName.trim())
    ? _cmDraftCampaignName.trim() : '';
  el.textContent = name ? 'Create New Campaign: ' + name : 'Create New Campaign';
}

function _cs2RefreshSidebar() {
  var sidebar = document.getElementById('cs2-sidebar');
  if (!sidebar) return;
  var tmp = document.createElement('div');
  tmp.innerHTML = _cs2Sidebar();
  sidebar.parentNode.replaceChild(tmp.firstChild, sidebar);
}

function cs2Save() {
  // ── Collect campaign-level state ────────────────────────────────────────────
  var campaignDetails = {
    flight_start:  (_cmDraftFlight && _cmDraftFlight.start) ? _cmDraftFlight.start : null,
    flight_end:    (_cmDraftFlight && _cmDraftFlight.end)   ? _cmDraftFlight.end   : null,
    geo:           (typeof _cmDraftGeo !== 'undefined' && _cmDraftGeo.length) ? _cmDraftGeo.slice() : [],
    campaign_type: (document.getElementById('cm-draft-camptype') || {}).value || null,
    budget:        (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.budget : null,
    impr:          (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.impr   : null,
    pacing:        (document.getElementById('cm-draft-pacing') || {}).value || null,
  };

  // ── Collect line items ──────────────────────────────────────────────────────
  var lineItems = cs2AdGroups.map(function(ag) {
    return {
      name:        ag.name        || '',
      media_type:  ag.mediaType   || [],
      device_type: ag.deviceType  || [],
      geo:         ag.geo         || [],
      budget:      ag.budget      != null ? ag.budget  : null,
      base_cpm:    ag.baseCpm     != null ? ag.baseCpm : null,
      max_cpm:     ag.maxCpm      != null ? ag.maxCpm  : null,
    };
  });

  var payload = {
    campaign_name:    (typeof _cmDraftCampaignName !== 'undefined' && _cmDraftCampaignName) ? _cmDraftCampaignName.trim() : null,
    client_org_id:    (typeof _cmCurrentClientOrgId  !== 'undefined') ? _cmCurrentClientOrgId  : null,
    advertiser_id:    (typeof _cmCurrentAdvertiserId !== 'undefined') ? _cmCurrentAdvertiserId : null,
    campaign_details: campaignDetails,
    line_items:       lineItems,
  };

  // ── Button feedback ─────────────────────────────────────────────────────────
  var btn = document.getElementById('cs2-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  var url    = cs2CampaignId ? ('/api/campaigns-v2?campaign_id=' + cs2CampaignId) : '/api/campaigns-v2';
  var method = cs2CampaignId ? 'PATCH' : 'POST';

  fetch(url, {
    method:  method,
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.error) throw new Error(data.error);
    if (data.campaign_id) cs2CampaignId = data.campaign_id;
    if (btn) {
      btn.textContent = 'Saved ✓';
      btn.disabled    = false;
      setTimeout(function() { btn.textContent = 'Save Draft'; }, 2000);
    }
  })
  .catch(function(err) {
    console.error('cs2Save error:', err);
    if (btn) {
      btn.textContent = 'Error — retry';
      btn.disabled    = false;
      setTimeout(function() { btn.textContent = 'Save Draft'; }, 3000);
    }
  });
}

// ── Save Campaign Details only (button inside the campaign card) ──────────────
function cs2SaveCampaignDetails() {
  var btn      = document.getElementById('cs2-camp-save-btn');
  var feedback = document.getElementById('cs2-camp-save-feedback');

  function setFeedback(msg, color) {
    if (!feedback) return;
    feedback.textContent  = msg;
    feedback.style.color  = color || 'var(--muted)';
    feedback.style.opacity = '1';
    setTimeout(function() { feedback.style.opacity = '0'; }, 2500);
  }

  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  var campaignDetails = {
    flight_start:  (_cmDraftFlight && _cmDraftFlight.start) ? _cmDraftFlight.start : null,
    flight_end:    (_cmDraftFlight && _cmDraftFlight.end)   ? _cmDraftFlight.end   : null,
    geo:           (typeof _cmDraftGeo !== 'undefined' && _cmDraftGeo.length) ? _cmDraftGeo.slice() : [],
    campaign_type: (document.getElementById('cm-draft-camptype') || {}).value || null,
    budget:        (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.budget : null,
    impr:          (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.impr   : null,
    pacing:        (document.getElementById('cm-draft-pacing') || {}).value || null,
  };

  var payload = {
    campaign_name:    (typeof _cmDraftCampaignName !== 'undefined' && _cmDraftCampaignName) ? _cmDraftCampaignName.trim() : null,
    client_org_id:    (typeof _cmCurrentClientOrgId  !== 'undefined') ? _cmCurrentClientOrgId  : null,
    advertiser_id:    (typeof _cmCurrentAdvertiserId !== 'undefined') ? _cmCurrentAdvertiserId : null,
    campaign_status:  'draft',
    campaign_details: campaignDetails,
    line_items:       cs2AdGroups.map(function(ag) {
      return { name: ag.name || '', media_type: ag.mediaType || [], device_type: ag.deviceType || [], geo: ag.geo || [], budget: ag.budget || null, base_cpm: ag.baseCpm || null, max_cpm: ag.maxCpm || null };
    }),
  };

  var url    = cs2CampaignId ? ('/api/campaigns-v2?campaign_id=' + cs2CampaignId) : '/api/campaigns-v2';
  var method = cs2CampaignId ? 'PATCH' : 'POST';

  fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      if (data.campaign_id) cs2CampaignId = data.campaign_id;
      if (btn) { btn.textContent = 'Save Campaign Details'; btn.disabled = false; }
      setFeedback('Saved ✓', '#16a34a');
    })
    .catch(function(err) {
      console.error('cs2SaveCampaignDetails error:', err);
      if (btn) { btn.textContent = 'Save Campaign Details'; btn.disabled = false; }
      setFeedback('Error — ' + err.message, '#dc2626');
    });
}

// ── Save Line Item Details (button inside card1) ──────────────────────────────
function cs2SaveLineItemDetails(idx) {
  var btn      = document.getElementById('cs2-li-save-btn-' + idx);
  var feedback = document.getElementById('cs2-li-save-feedback-' + idx);

  function setFeedback(msg, color) {
    if (!feedback) return;
    feedback.textContent   = msg;
    feedback.style.color   = color || 'var(--muted)';
    feedback.style.opacity = '1';
    setTimeout(function() { feedback.style.opacity = '0'; }, 2500);
  }

  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  // Sync current line item name from input (in case user typed but didn't blur)
  var nameInput = document.getElementById('cs2-ag-name-' + idx);
  if (nameInput && cs2AdGroups[idx]) cs2AdGroups[idx].name = nameInput.value;

  // Build full line_items array from current state
  var lineItems = cs2AdGroups.map(function(ag) {
    return {
      name:        ag.name        || '',
      media_type:  ag.mediaType   || [],
      device_type: ag.deviceType  || [],
      geo:         ag.geo         || [],
      budget:      ag.budget      != null ? ag.budget  : null,
      base_cpm:    ag.baseCpm     != null ? ag.baseCpm : null,
      max_cpm:     ag.maxCpm      != null ? ag.maxCpm  : null,
    };
  });

  function doSave(campaignId) {
    fetch('/api/campaigns-v2?campaign_id=' + campaignId, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ line_items: lineItems }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      if (btn) { btn.textContent = 'Save Line Item Details'; btn.disabled = false; }
      setFeedback('Saved ✓', '#16a34a');
    })
    .catch(function(err) {
      console.error('cs2SaveLineItemDetails error:', err);
      if (btn) { btn.textContent = 'Save Line Item Details'; btn.disabled = false; }
      setFeedback('Error — ' + err.message, '#dc2626');
    });
  }

  // If campaign not yet saved, create it first then save line items
  if (!cs2CampaignId) {
    var campaignDetails = {
      flight_start:  (_cmDraftFlight && _cmDraftFlight.start) ? _cmDraftFlight.start : null,
      flight_end:    (_cmDraftFlight && _cmDraftFlight.end)   ? _cmDraftFlight.end   : null,
      geo:           (typeof _cmDraftGeo !== 'undefined' && _cmDraftGeo.length) ? _cmDraftGeo.slice() : [],
      campaign_type: (document.getElementById('cm-draft-camptype') || {}).value || null,
      budget:        (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.budget : null,
      impr:          (typeof _cmDraftAddl !== 'undefined') ? _cmDraftAddl.impr   : null,
      pacing:        (document.getElementById('cm-draft-pacing') || {}).value || null,
    };
    fetch('/api/campaigns-v2', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        campaign_name:    (typeof _cmDraftCampaignName !== 'undefined' && _cmDraftCampaignName) ? _cmDraftCampaignName.trim() : null,
        client_org_id:    (typeof _cmCurrentClientOrgId  !== 'undefined') ? _cmCurrentClientOrgId  : null,
        advertiser_id:    (typeof _cmCurrentAdvertiserId !== 'undefined') ? _cmCurrentAdvertiserId : null,
        campaign_status:  'draft',
        campaign_details: campaignDetails,
        line_items:       lineItems,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      cs2CampaignId = data.campaign_id;
      if (btn) { btn.textContent = 'Save Line Item Details'; btn.disabled = false; }
      setFeedback('Saved ✓', '#16a34a');
    })
    .catch(function(err) {
      console.error('cs2SaveLineItemDetails (create) error:', err);
      if (btn) { btn.textContent = 'Save Line Item Details'; btn.disabled = false; }
      setFeedback('Error — ' + err.message, '#dc2626');
    });
  } else {
    doSave(cs2CampaignId);
  }
}

// ── Line Item Bid CPM dropdown ────────────────────────────────────────────────
function cs2LiCpmContent(idx) {
  var ag  = cs2AdGroups[idx] || {};
  var INP = 'width:100%;height:34px;padding:0 10px;border:1px solid var(--border-md);border-radius:6px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .15s';
  var LB  = 'display:block;font-size:11px;font-weight:500;color:var(--muted);margin-bottom:5px';
  return '<div style="display:flex;flex-direction:column;gap:10px">'
    + '<div><label style="' + LB + '">Base Bid CPM</label>'
    +   '<div style="position:relative"><span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--muted);pointer-events:none">$</span>'
    +   '<input type="number" min="0" step="0.01" placeholder="0.00" value="' + (ag.baseCpm || '') + '" style="' + INP + ';padding-left:20px" oninput="cs2AdGroups[' + idx + '].baseCpm=parseFloat(this.value)||null;cs2LiCpmRefreshLbl(' + idx + ')" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    +   '</div>'
    + '</div>'
    + '<div><label style="' + LB + '">Max Bid CPM</label>'
    +   '<div style="position:relative"><span style="position:absolute;left:9px;top:50%;transform:translateY(-50%);font-size:12px;color:var(--muted);pointer-events:none">$</span>'
    +   '<input type="number" min="0" step="0.01" placeholder="0.00" value="' + (ag.maxCpm || '') + '" style="' + INP + ';padding-left:20px" oninput="cs2AdGroups[' + idx + '].maxCpm=parseFloat(this.value)||null;cs2LiCpmRefreshLbl(' + idx + ')" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    +   '</div>'
    + '</div>'
    + '<div style="margin-top:2px;border-top:1px solid var(--border);padding-top:10px">'
    +   '<button onclick="document.getElementById(\'cs2-li-cpm-dd-' + idx + '\').remove()" style="width:100%;height:30px;border-radius:7px;border:1px solid var(--border-md);background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>'
    + '</div>';
}

function cs2LiCpmRefreshLbl(idx) {
  var ag  = cs2AdGroups[idx] || {};
  var lbl = document.getElementById('cs2-li-cpm-lbl-' + idx);
  if (!lbl) return;
  var base = ag.baseCpm, max = ag.maxCpm;
  if (!base && !max) { lbl.textContent = 'Not set'; lbl.style.color = 'var(--faint)'; return; }
  var txt = base ? '$' + parseFloat(base).toFixed(2) : '';
  if (max) txt += (txt ? ' – $' : '$') + parseFloat(max).toFixed(2);
  lbl.textContent = txt;
  lbl.style.color = 'var(--text)';
}

// ── Line Item: per-line-item checkbox dropdown (Media Type, Device Type) ─────
function cs2LiCheckboxContent(idx, ddId, items, stateKey, lblId) {
  if (!cs2AdGroups[idx]) return '';
  if (!cs2AdGroups[idx][stateKey]) cs2AdGroups[idx][stateKey] = [];
  var state = cs2AdGroups[idx][stateKey];
  var rows = items.map(function(item) {
    var checked = state.indexOf(item) >= 0;
    return '<label style="display:flex;align-items:center;gap:8px;padding:5px 4px;cursor:pointer;font-size:12px;border-radius:5px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<input type="checkbox"' + (checked ? ' checked' : '') + ' style="accent-color:var(--accent);width:14px;height:14px;flex-shrink:0;cursor:pointer" '
      + 'onchange="cs2LiCheckboxPick(' + idx + ',\'' + stateKey + '\',\'' + item + '\',this.checked,\'' + lblId + '\')">'
      + '<span>' + item + '</span>'
      + '</label>';
  }).join('');
  return '<div style="display:flex;flex-direction:column;gap:1px">'
    + rows
    + '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:10px">'
    + '<button onclick="document.getElementById(\'' + ddId + '\').remove()" style="width:100%;height:30px;border-radius:7px;border:1px solid var(--border-md);background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>'
    + '</div>';
}

function cs2LiCheckboxPick(idx, stateKey, val, checked, lblId) {
  if (!cs2AdGroups[idx]) return;
  if (!cs2AdGroups[idx][stateKey]) cs2AdGroups[idx][stateKey] = [];
  var state = cs2AdGroups[idx][stateKey];
  var i = state.indexOf(val);
  if (checked && i < 0) state.push(val);
  if (!checked && i >= 0) state.splice(i, 1);
  var lbl = document.getElementById(lblId);
  if (lbl) {
    lbl.textContent  = state.length ? state.join(', ') : 'Not selected';
    lbl.style.color  = state.length ? 'var(--text)' : 'var(--faint)';
  }
}

// ── Line Item: per-line-item Geography dropdown ───────────────────────────────
function cs2LiGeoContent(idx) {
  if (!cs2AdGroups[idx]) return '';
  if (!cs2AdGroups[idx].geo) cs2AdGroups[idx].geo = [];
  var geo = cs2AdGroups[idx].geo;
  var INP = 'width:100%;height:28px;border:1px solid var(--border-md);border-radius:6px;padding:0 8px;font-size:11px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;margin-bottom:6px';
  // Build initial list HTML inline (no separate DOM call needed on open)
  var notSelRow = '<div onclick="cs2LiGeoClear(' + idx + ')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;border-bottom:1px solid var(--border);margin-bottom:2px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
    + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (!geo.length ? 'var(--accent)' : 'var(--border-md)') + ';background:' + (!geo.length ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
    + (!geo.length ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
    + '</div>'
    + '<span style="color:var(--faint);font-style:italic">Inherited from campaign</span>'
    + '</div>';
  var geoOptions = (typeof CM_GEO_OPTIONS !== 'undefined') ? CM_GEO_OPTIONS : [];
  var rows = geoOptions.map(function(o) {
    var sel = geo.indexOf(o.code) >= 0;
    return '<div onclick="cs2LiGeoPick(' + idx + ',\'' + o.code + '\')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (sel ? 'var(--accent)' : 'var(--border-md)') + ';background:' + (sel ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (sel ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span>' + o.code + '</span><span style="color:var(--faint);font-size:11px;margin-left:4px">' + o.label + '</span>'
      + '</div>';
  }).join('');
  return '<div style="display:flex;flex-direction:column;gap:0">'
    + '<input type="text" placeholder="Search geography…" style="' + INP + '" oninput="cs2LiBuildGeoList(' + idx + ',this.value)" onclick="event.stopPropagation()">'
    + '<div id="cs2-li-geo-list-' + idx + '" style="max-height:200px;overflow-y:auto;padding:2px 0">' + notSelRow + rows + '</div>'
    + '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:10px">'
    + '<button onclick="document.getElementById(\'cs2-li-geo-dd-' + idx + '\').remove()" style="width:100%;height:30px;border-radius:7px;border:1px solid var(--border-md);background:var(--surface);color:var(--text);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>'
    + '</div>';
}

function cs2LiBuildGeoList(idx, q) {
  var list = document.getElementById('cs2-li-geo-list-' + idx);
  if (!list) return;
  if (!cs2AdGroups[idx]) return;
  if (!cs2AdGroups[idx].geo) cs2AdGroups[idx].geo = [];
  var geo = cs2AdGroups[idx].geo;
  q = (q || '').toLowerCase();
  var notSelRow = !q
    ? '<div onclick="cs2LiGeoClear(' + idx + ')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px;border-bottom:1px solid var(--border);margin-bottom:2px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (!geo.length ? 'var(--accent)' : 'var(--border-md)') + ';background:' + (!geo.length ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (!geo.length ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span style="color:var(--faint);font-style:italic">Inherited from campaign</span>'
      + '</div>' : '';
  var geoOptions = (typeof CM_GEO_OPTIONS !== 'undefined') ? CM_GEO_OPTIONS : [];
  var rows = geoOptions.filter(function(o) {
    return !q || o.label.toLowerCase().indexOf(q) >= 0 || o.code.toLowerCase().indexOf(q) >= 0;
  }).map(function(o) {
    var sel = geo.indexOf(o.code) >= 0;
    return '<div onclick="cs2LiGeoPick(' + idx + ',\'' + o.code + '\')" style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:12px;cursor:pointer;border-radius:6px" onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (sel ? 'var(--accent)' : 'var(--border-md)') + ';background:' + (sel ? 'var(--accent)' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">'
      + (sel ? '<svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '')
      + '</div>'
      + '<span>' + o.code + '</span><span style="color:var(--faint);font-size:11px;margin-left:4px">' + o.label + '</span>'
      + '</div>';
  }).join('') || '<div style="padding:10px;text-align:center;font-size:11px;color:var(--faint)">No results</div>';
  list.innerHTML = notSelRow + rows;
}

function cs2LiGeoPick(idx, code) {
  if (!cs2AdGroups[idx]) return;
  if (!cs2AdGroups[idx].geo) cs2AdGroups[idx].geo = [];
  var geo = cs2AdGroups[idx].geo;
  var i = geo.indexOf(code);
  if (i >= 0) geo.splice(i, 1); else geo.push(code);
  // Refresh list
  var searchEl = document.querySelector('#cs2-li-geo-dd-' + idx + ' input[type=text]');
  cs2LiBuildGeoList(idx, searchEl ? searchEl.value : '');
  // Update trigger label
  var lbl = document.getElementById('cs2-li-geo-lbl-' + idx);
  if (lbl) {
    lbl.textContent  = geo.length ? geo.join(', ') : 'Inherited from campaign';
    lbl.style.color  = geo.length ? 'var(--text)' : 'var(--faint)';
    lbl.style.fontStyle = geo.length ? '' : 'italic';
  }
}

function cs2LiGeoClear(idx) {
  if (!cs2AdGroups[idx]) return;
  cs2AdGroups[idx].geo = [];
  cs2LiBuildGeoList(idx, '');
  var lbl = document.getElementById('cs2-li-geo-lbl-' + idx);
  if (lbl) { lbl.textContent = 'Inherited from campaign'; lbl.style.color = 'var(--faint)'; lbl.style.fontStyle = 'italic'; }
}

// ── Creatives V2 picker ───────────────────────────────────────────────────────

function cs2LiLoadCreatives(idx) {
  var params = ['no_campaign=1'];
  if (typeof _cmCurrentClientOrgId !== 'undefined' && _cmCurrentClientOrgId)
    params.push('client_org_id=' + _cmCurrentClientOrgId);
  if (typeof _cmCurrentAdvertiserId !== 'undefined' && _cmCurrentAdvertiserId)
    params.push('advertiser_id=' + _cmCurrentAdvertiserId);
  var qs = '?' + params.join('&');
  fetch('/api/creatives-v2' + qs)
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!cs2AdGroups[idx]) return;
      cs2AdGroups[idx]._creativesV2 = d.creatives || [];
      var el = document.getElementById('cs2-creatives-list-' + idx);
      if (el) el.innerHTML = cs2LiCreativesListHtml(idx);
    })
    .catch(function() {
      var el = document.getElementById('cs2-creatives-list-' + idx);
      if (el) el.innerHTML = '<div style="padding:20px;font-size:12px;color:var(--faint);text-align:center">Could not load creatives.</div>';
    });
}

function cs2LiCreativesListHtml(idx) {
  var ag        = cs2AdGroups[idx] || {};
  var creatives = ag._creativesV2  || [];
  var selected  = ag.creative_ids  || [];

  if (!creatives.length) {
    return '<div style="padding:24px;font-size:12px;color:var(--faint);text-align:center">No creatives found.</div>';
  }

  var TH = 'padding:6px 16px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);border-bottom:1px solid var(--border)';
  var TD = 'padding:8px 16px;border-bottom:1px solid var(--border);vertical-align:middle';

  var rows = creatives.map(function(cr) {
    var isSelected = selected.indexOf(cr.creative_id) >= 0;
    var cb = '<input type="checkbox"' + (isSelected ? ' checked' : '')
      + ' onclick="event.stopPropagation();cs2LiToggleCreative(' + idx + ',' + cr.creative_id + ')"'
      + ' style="width:14px;height:14px;accent-color:var(--accent);cursor:pointer;flex-shrink:0">';
    var thumb = cr.asset_thumbnail
      ? '<img src="' + cr.asset_thumbnail + '" style="width:44px;height:24px;object-fit:cover;border-radius:3px;display:block">'
      : '<div style="width:44px;height:24px;border-radius:3px;background:#e5e7eb"></div>';
    var name = '<div style="font-size:12px;font-weight:500;color:var(--text)">' + (cr.creative_name || '—') + '</div>'
      + '<div style="font-size:10px;color:var(--faint)">' + (cr.ad_type_name || '—') + '</div>';
    var adv = '<div style="font-size:12px;color:var(--muted)">' + (cr.advertiser_name || '—') + '</div>';

    return '<tr onclick="cs2LiToggleCreative(' + idx + ',' + cr.creative_id + ')"'
      + ' onmouseover="this.style.background=\'var(--subtle)\'" onmouseout="this.style.background=\'\'"'
      + ' style="cursor:pointer">'
      + '<td style="' + TD + ';width:32px">' + cb + '</td>'
      + '<td style="' + TD + ';width:56px">' + thumb + '</td>'
      + '<td style="' + TD + '">' + name + '</td>'
      + '<td style="' + TD + ';width:130px">' + adv + '</td>'
      + '</tr>';
  }).join('');

  return '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    + '<th style="' + TH + ';width:32px"></th>'
    + '<th style="' + TH + ';width:56px"></th>'
    + '<th style="' + TH + '">Creative</th>'
    + '<th style="' + TH + ';width:130px">Advertiser</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>';
}

function cs2LiToggleCreative(idx, creativeId) {
  var ag = cs2AdGroups[idx];
  if (!ag) return;
  if (!ag.creative_ids) ag.creative_ids = [];
  var pos = ag.creative_ids.indexOf(creativeId);
  if (pos >= 0) ag.creative_ids.splice(pos, 1);
  else ag.creative_ids.push(creativeId);
  var el = document.getElementById('cs2-creatives-list-' + idx);
  if (el) el.innerHTML = cs2LiCreativesListHtml(idx);
}

