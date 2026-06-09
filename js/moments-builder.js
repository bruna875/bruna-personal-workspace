// moments-builder.js — Custom Moments Builder

// ── State ────────────────────────────────────────────────────────────────────
var _mbInputTab    = 'text';          // 'text' | 'upload' | 'library'
var _mbTaxTab      = 'iab';           // active taxonomy tab
var _mbLoading     = false;
var _mbThemes      = [];
var _mbScored      = null;            // { iab:[], emotion:[], ... }
var _mbShowAll     = {};              // { iab: false, ... }
var _mbSelected    = {};              // { 'iab:123': true, ... }

var MB_TAX_TABS = [
  { id: 'iab',          label: 'IAB'          },
  { id: 'emotion',      label: 'Emotions'     },
  { id: 'sentiment',    label: 'Sentiment'    },
  { id: 'object',       label: 'Objects'      },
  { id: 'location',     label: 'Locations'    },
  { id: 'logo',         label: 'Logos'        },
  { id: 'face',         label: 'Faces'        },
  { id: 'brand_safety', label: 'Brand Safety' },
];

// ── Entry point ───────────────────────────────────────────────────────────────
function renderMomentsBuilder() {
  // Reset state on every page load
  _mbInputTab = 'text';
  _mbScored   = null;
  _mbThemes   = [];
  _mbSelected = {};
  _mbShowAll  = {};
  _mbUploadFile = null;

  setTimeout(function() { _mbBindUpload(); }, 0);

  return _mbShell();
}

function _mbShell() {
  return UI.pageHeader({ title: 'Custom Moments Builder', subtitle: 'Select content to discover the most relevant contextual moments across all taxonomy dimensions' })
    + '<div style="display:flex;gap:20px;align-items:flex-start">'

    +   '<!-- main -->'
    +   '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">'
    +     _mbInputCard()
    +     '<div id="mb-results">' + (_mbScored ? _mbResultsHtml() : '') + '</div>'
    +   '</div>'

    +   '<!-- sidebar -->'
    +   '<div id="mb-sidebar" style="width:260px;flex-shrink:0;position:sticky;top:0;height:calc(100vh - 80px);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    +     _mbSidebarHtml()
    +   '</div>'

    + '</div>';
}

// ── Input card ────────────────────────────────────────────────────────────────
function _mbInputCard() {
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px 24px">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    +     '<div style="font-size:13px;font-weight:600;color:var(--text)">Content Input</div>'
    +     '<div id="mb-input-pills">' + _mbInputTypePills() + '</div>'
    +   '</div>'
    +   '<div id="mb-input-area">' + _mbInputArea() + '</div>'
    +   '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">'
    +     '<button onclick="mbAnalyze()" id="mb-analyze-btn" style="height:38px;padding:0 24px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:opacity .13s" onmouseenter="this.style.opacity=\'.85\'" onmouseleave="this.style.opacity=\'1\'">'
    +       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +       'Analyze'
    +     '</button>'
    +     '<div id="mb-status" style="font-size:12px;color:var(--muted)"></div>'
    +   '</div>'
    + '</div>';
}

function _mbInputTypePills() {
  var tabs = [
    { id: 'text',    label: 'Free Text' },
    { id: 'upload',  label: 'Upload Image' },
    { id: 'library', label: 'From Library' },
  ];
  return '<div style="display:flex;gap:2px;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:3px">'
    + tabs.map(function(t) {
        var act = t.id === _mbInputTab;
        return '<button onclick="mbSwitchInput(\'' + t.id + '\')" style="height:28px;padding:0 12px;border-radius:6px;border:none;font-size:12px;font-weight:' + (act ? '600' : '400') + ';font-family:inherit;cursor:pointer;background:' + (act ? 'var(--surface)' : 'transparent') + ';color:' + (act ? 'var(--text)' : 'var(--muted)') + ';box-shadow:' + (act ? '0 1px 3px rgba(0,0,0,.08)' : 'none') + ';transition:all .13s">' + t.label + '</button>';
      }).join('')
    + '</div>';
}

function _mbInputArea() {
  if (_mbInputTab === 'text') {
    return '<textarea id="mb-text-input" placeholder="Describe the content, scene, mood, or context you want to match — e.g. \'A family barbecue on a summer afternoon with kids playing in the backyard\'…" style="width:100%;box-sizing:border-box;height:88px;padding:10px 12px;font-size:13px;font-family:inherit;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:8px;resize:none;outline:none;line-height:1.5;transition:border-color .15s" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'"></textarea>';
  }
  if (_mbInputTab === 'upload') {
    return '<div id="mb-upload-zone" style="border:2px dashed var(--border-md);border-radius:10px;padding:28px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s" onclick="document.getElementById(\'mb-file-input\').click()" onmouseenter="this.style.borderColor=\'var(--accent)\';this.style.background=\'var(--subtle)\'" onmouseleave="this.style.borderColor=\'var(--border-md)\';this.style.background=\'\'">'
      + '<input type="file" id="mb-file-input" accept="image/*" style="display:none">'
      + '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--faint);margin-bottom:8px"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>'
      + '<div style="font-size:13px;font-weight:500;color:var(--text);margin-bottom:4px">Drop image here or click to browse</div>'
      + '<div id="mb-file-name" style="font-size:11px;color:var(--faint)">JPG, PNG, WebP</div>'
      + '</div>';
  }
  if (_mbInputTab === 'library') {
    return '<div style="padding:20px;text-align:center;background:var(--bg);border-radius:8px;border:1px solid var(--border)">'
      + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--faint);margin-bottom:8px"><path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>'
      + '<div style="font-size:12px;color:var(--muted);margin-bottom:12px">Pick an asset from Creative Studio</div>'
      + '<button onclick="mbOpenLibraryPicker()" style="height:32px;padding:0 16px;background:var(--surface);border:1px solid var(--border);border-radius:7px;font-size:12px;font-weight:500;font-family:inherit;cursor:pointer;color:var(--text)">Browse Library</button>'
      + '<div id="mb-library-selected" style="margin-top:10px;font-size:12px;color:var(--muted)"></div>'
      + '</div>';
  }
  return '';
}

// ── Analyze ───────────────────────────────────────────────────────────────────
function mbSwitchInput(tab) {
  _mbInputTab = tab;
  // Re-render pills
  var pillsEl = document.getElementById('mb-input-pills');
  if (pillsEl) pillsEl.innerHTML = _mbInputTypePills();
  // Re-render input area
  var areaEl = document.getElementById('mb-input-area');
  if (areaEl) areaEl.innerHTML = _mbInputArea();
  _mbBindUpload();
}

function _mbBindUpload() {
  var fi = document.getElementById('mb-file-input');
  if (!fi) return;
  fi.onchange = function() {
    var f = fi.files[0];
    if (!f) return;
    var lbl = document.getElementById('mb-file-name');
    if (lbl) lbl.textContent = f.name;
    // Store file ref
    _mbUploadFile = f;
  };
}

var _mbUploadFile = null;
var _mbLibraryImageUrl = null;

function mbOpenLibraryPicker() {
  // Placeholder — will integrate with Creative Studio later
  var sel = document.getElementById('mb-library-selected');
  if (sel) sel.textContent = 'Library integration coming soon — use Free Text or Upload for now.';
}

async function mbAnalyze() {
  if (_mbLoading) return;

  var body = {};

  if (_mbInputTab === 'text') {
    var ta = document.getElementById('mb-text-input');
    var txt = ta ? ta.value.trim() : '';
    if (!txt) { _mbSetStatus('Enter some text first.', true); return; }
    body = { input_type: 'text', text: txt };

  } else if (_mbInputTab === 'upload') {
    if (!_mbUploadFile) { _mbSetStatus('Select an image first.', true); return; }
    body = await _mbFileToBody(_mbUploadFile);

  } else if (_mbInputTab === 'library') {
    if (!_mbLibraryImageUrl) { _mbSetStatus('Select an asset from the library first.', true); return; }
    body = { input_type: 'image', image_url: _mbLibraryImageUrl };
  }

  _mbLoading = true;
  _mbSetStatus('Analyzing with Groq…', false, true);
  var btn = document.getElementById('mb-analyze-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '.5'; }

  try {
    var resp = await fetch('/api/taxonomy-affinity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'API error');

    _mbThemes = data.themes || [];
    _mbScored = data.scored || {};
    _mbShowAll = {};
    _mbSetStatus('');

    var results = document.getElementById('mb-results');
    if (results) results.innerHTML = _mbResultsHtml();

  } catch(e) {
    _mbSetStatus('Error: ' + e.message, true);
  } finally {
    _mbLoading = false;
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

async function _mbFileToBody(file) {
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var b64 = e.target.result.split(',')[1];
      resolve({ input_type: 'image', image_base64: b64 });
    };
    reader.readAsDataURL(file);
  });
}

function _mbSetStatus(msg, isErr, isLoading) {
  var el = document.getElementById('mb-status');
  if (!el) return;
  if (isLoading) {
    el.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:12px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin .7s linear infinite"></span>' + msg + '</span>';
  } else {
    el.textContent = msg;
    el.style.color = isErr ? '#ef4444' : 'var(--muted)';
  }
}

// ── Results ───────────────────────────────────────────────────────────────────
function _mbResultsHtml() {
  if (!_mbScored) return '';

  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    +   _mbThemesBar()
    +   '<div style="border-bottom:1px solid var(--border);padding:0 4px">'
    +     UI.tabNav(MB_TAX_TABS, _mbTaxTab, 'mbSwitchTaxTab')
    +   '</div>'
    +   '<div id="mb-tax-panel" style="padding:20px 24px">'
    +     _mbTaxPanelHtml(_mbTaxTab)
    +   '</div>'
    + '</div>';
}

function _mbThemesBar() {
  if (!_mbThemes.length) return '';
  return '<div style="padding:12px 24px;border-bottom:1px solid var(--border);background:var(--bg);display:flex;flex-wrap:wrap;gap:6px;align-items:center">'
    + '<span style="font-size:11px;font-weight:600;color:var(--muted);flex-shrink:0;margin-right:4px">THEMES DETECTED</span>'
    + _mbThemes.map(function(t) {
        return '<span style="font-size:11px;padding:2px 8px;background:var(--subtle);border:1px solid var(--border);border-radius:20px;color:var(--text)">' + _mbEsc(t) + '</span>';
      }).join('')
    + '</div>';
}

function mbSwitchTaxTab(id) {
  _mbTaxTab = id;
  // Update tab nav
  var tabsEl = document.querySelector('.ul-tabnav');
  if (tabsEl) tabsEl.outerHTML = UI.tabNav(MB_TAX_TABS, _mbTaxTab, 'mbSwitchTaxTab');
  // Update panel
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = _mbTaxPanelHtml(id);
}

function _mbTaxPanelHtml(type) {
  var items = (_mbScored && _mbScored[type]) || [];
  if (!items.length) return '<div style="padding:40px;text-align:center;color:var(--faint);font-size:12px">No data</div>';

  var showAll = !!_mbShowAll[type];
  var topN    = 30;
  var visible = showAll ? items : items.slice(0, topN);
  var hasMore = items.length > topN;

  var html = '<div style="display:flex;flex-wrap:wrap;gap:8px">'
    + visible.map(function(item) { return _mbItemChip(item, type); }).join('')
    + '</div>';

  if (hasMore && !showAll) {
    html += '<div style="margin-top:14px;text-align:center">'
      + '<button onclick="mbShowAll(\'' + type + '\')" style="font-size:12px;color:var(--accent);background:none;border:1px solid var(--border);border-radius:7px;padding:6px 16px;cursor:pointer;font-family:inherit">Show all ' + items.length + ' items</button>'
      + '</div>';
  }

  return html;
}

function _mbItemChip(item, type) {
  var score   = item.score || 0;
  var key     = type + ':' + item.id;
  var sel     = !!_mbSelected[key];

  // Score color
  var scoreColor, scoreBg;
  if (score >= 60)      { scoreColor = '#15803d'; scoreBg = '#dcfce7'; }
  else if (score >= 30) { scoreColor = '#b45309'; scoreBg = '#fef3c7'; }
  else                  { scoreColor = 'var(--muted)'; scoreBg = 'var(--bg)'; }

  var label = item.name;
  if (item.subcategory && item.subcategory !== item.name) label = item.subcategory + ' › ' + item.name;
  else if (item.category && item.category !== item.name && !item.subcategory) label = item.category + ' › ' + item.name;

  return '<div onclick="mbToggleItem(\'' + _mbEsc(key) + '\')" style="display:inline-flex;align-items:center;gap:7px;padding:6px 10px 6px 8px;border-radius:8px;border:1.5px solid ' + (sel ? 'var(--accent)' : 'var(--border)') + ';background:' + (sel ? 'rgba(225,29,143,.05)' : 'var(--surface)') + ';cursor:pointer;transition:border-color .13s,background .13s;max-width:280px" onmouseenter="this.style.borderColor=\'var(--accent-light,#f472b6)\'" onmouseleave="this.style.borderColor=\'' + (sel ? 'var(--accent)' : 'var(--border)') + '\'">'
    + (sel ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="var(--accent)"><circle cx="6" cy="6" r="6"/></svg>'
           : '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="var(--border-md)"/></svg>')
    + '<span style="font-size:12px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + _mbEsc(label) + '</span>'
    + (score > 0 ? '<span style="font-size:10px;font-weight:600;color:' + scoreColor + ';background:' + scoreBg + ';border-radius:20px;padding:1px 6px;flex-shrink:0">' + score + '</span>' : '')
    + '</div>';
}

function mbToggleItem(key) {
  if (_mbSelected[key]) delete _mbSelected[key];
  else _mbSelected[key] = true;

  // Re-render chip panel
  var type  = key.split(':')[0];
  var panel = document.getElementById('mb-tax-panel');
  if (panel && _mbTaxTab === type) panel.innerHTML = _mbTaxPanelHtml(type);

  // Re-render sidebar
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function mbRemoveItem(key) {
  delete _mbSelected[key];
  var type  = key.split(':')[0];
  var panel = document.getElementById('mb-tax-panel');
  if (panel && _mbTaxTab === type) panel.innerHTML = _mbTaxPanelHtml(type);
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function mbClearAll() {
  _mbSelected = {};
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = _mbTaxPanelHtml(_mbTaxTab);
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function _mbSidebarHtml() {
  var keys   = Object.keys(_mbSelected);
  var total  = keys.length;

  // Group by type
  var grouped = {};
  MB_TAX_TABS.forEach(function(t) { grouped[t.id] = []; });

  keys.forEach(function(key) {
    var parts = key.split(':');
    var type  = parts[0];
    var id    = parts.slice(1).join(':');
    if (!grouped[type]) grouped[type] = [];
    // Find item name from scored data
    var name = id;
    if (_mbScored && _mbScored[type]) {
      var found = _mbScored[type].find(function(i) { return i.id === id; });
      if (found) name = found.name;
    }
    grouped[type].push({ key: key, name: name });
  });

  var headerHtml = '<div style="padding:14px 16px 10px;border-bottom:1px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:space-between">'
    + '<div style="display:flex;align-items:center;gap:8px">'
    +   '<span style="font-size:13px;font-weight:600;color:var(--text)">Selected</span>'
    +   (total > 0 ? '<span style="font-size:10px;font-weight:600;color:#fff;background:var(--accent);border-radius:20px;padding:1px 7px">' + total + '</span>' : '')
    + '</div>'
    + (total > 0 ? '<button onclick="mbClearAll()" style="font-size:11px;color:var(--muted);background:none;border:none;cursor:pointer;font-family:inherit;padding:2px 6px;border-radius:5px;transition:color .12s" onmouseenter="this.style.color=\'#ef4444\'" onmouseleave="this.style.color=\'var(--muted)\'">Clear all</button>' : '')
    + '</div>';

  if (total === 0) {
    return headerHtml
      + '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;gap:10px">'
      +   '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" style="color:var(--border-md)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
      +   '<div style="font-size:12px;color:var(--faint);line-height:1.5">Analyze some content<br>then click items to select them</div>'
      + '</div>';
  }

  var listHtml = '<div style="flex:1;overflow-y:auto;padding:8px 0">';
  MB_TAX_TABS.forEach(function(t) {
    var items = grouped[t.id];
    if (!items.length) return;
    listHtml += '<div style="padding:6px 16px 4px">'
      + '<div style="font-size:10px;font-weight:600;color:var(--muted);letter-spacing:.05em;margin-bottom:4px">' + t.label.toUpperCase() + '</div>'
      + items.map(function(item) {
          return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0">'
            + '<span style="font-size:12px;color:var(--text);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _mbEsc(item.name) + '</span>'
            + '<button onclick="mbRemoveItem(\'' + _mbEsc(item.key) + '\')" style="width:16px;height:16px;flex-shrink:0;background:none;border:none;cursor:pointer;color:var(--faint);padding:0;display:flex;align-items:center;justify-content:center;border-radius:3px;transition:color .12s" onmouseenter="this.style.color=\'#ef4444\'" onmouseleave="this.style.color=\'var(--faint)\'">'
            +   '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
            + '</button>'
            + '</div>';
        }).join('')
      + '</div>';
  });
  listHtml += '</div>';

  var footerHtml = '<div style="padding:12px 16px;border-top:1px solid var(--border);flex-shrink:0">'
    + '<button onclick="mbSaveMomentsGroup()" style="width:100%;height:36px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:opacity .13s" onmouseenter="this.style.opacity=\'.85\'" onmouseleave="this.style.opacity=\'1\'">Save as Moments Group</button>'
    + '</div>';

  return headerHtml + listHtml + footerHtml;
}

function mbSaveMomentsGroup() {
  // Placeholder — will wire to DB
  alert('Save as Moments Group — coming soon!');
}

function mbShowAll(type) {
  _mbShowAll[type] = true;
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = _mbTaxPanelHtml(type);
}

function _mbEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
