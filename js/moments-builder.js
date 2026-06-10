// moments-builder.js — Custom Moments Builder

// ── State ────────────────────────────────────────────────────────────────────
var _mbInputTab    = 'text';
var _mbTaxTab      = 'overview';
var _mbLoading     = false;
var _mbThemes      = [];
var _mbScored      = null;
var _mbShowAll     = {};
var _mbSelected    = {};
var _mbUploadFile  = null;
var _mbLibraryImageUrl = null;

var MB_TAX_TABS = [
  { id: 'overview',     label: 'Top Scoring Signals' },
  { id: 'iab',          label: 'IAB'          },
  { id: 'emotion',      label: 'Emotions'     },
  { id: 'sentiment',    label: 'Sentiment'    },
  { id: 'object',       label: 'Objects'      },
  { id: 'location',     label: 'Locations'    },
  { id: 'logo',         label: 'Logos'        },
  { id: 'face',         label: 'Faces'        },
  { id: 'brand_safety', label: 'Brand Safety' },
];

// ── Pods / Impressions helpers ────────────────────────────────────────────────
function _mbPods(item) {
  var s = String(item.id) + item.name, seed = 0;
  for (var i = 0; i < s.length; i++) seed = (((seed << 5) - seed) + s.charCodeAt(i)) & 0x7fffffff;
  return 10 + (seed % 491);
}
function _mbImpressions(pods, item) {
  var s = String(item.id), seed = 0;
  for (var i = 0; i < s.length; i++) seed = ((seed << 3) + s.charCodeAt(i)) & 0xff;
  return pods * (15000 + (seed % 7) * 1000);
}
function _mbFmtN(n) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'K';
  return String(n);
}

// ── Entry point ───────────────────────────────────────────────────────────────
function renderMomentsBuilder() {
  _mbInputTab = 'text'; _mbTaxTab = 'overview';
  _mbScored = null; _mbThemes = [];
  _mbSelected = {}; _mbShowAll = {};
  _mbUploadFile = null;
  setTimeout(function() { _mbBindUpload(); }, 0);
  return _mbShell();
}

function _mbShell() {
  return UI.pageHeader({ title: 'Custom Moments Builder', subtitle: 'Select content to discover the most relevant contextual moments across all taxonomy dimensions' })
    + '<div style="display:flex;gap:20px;align-items:flex-start">'
    +   '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:16px">'
    +     _mbInputCard()
    +     '<div id="mb-results">' + (_mbScored ? _mbResultsHtml() : '') + '</div>'
    +   '</div>'
    +   '<div id="mb-sidebar" style="width:260px;flex-shrink:0;position:sticky;top:0;height:calc(100vh - 80px);display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    +     _mbSidebarHtml()
    +   '</div>'
    + '</div>';
}

// ── Input card ────────────────────────────────────────────────────────────────
function _mbInputCard() {
  return '<div style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<textarea id="mb-text-input" placeholder="Paste or type your brief here. The AI will analyse topics, sentiments, moments and taxonomy classifications…" onkeydown="if(event.ctrlKey&&event.key===\'Enter\')mbAnalyze()" style="width:100%;box-sizing:border-box;height:60px;padding:12px 14px;font-size:13px;font-family:inherit;color:var(--text);background:transparent;border:none;outline:none;resize:none;line-height:1.6;display:block"></textarea>'
    + '<div id="mb-themes-chips" style="display:none;padding:8px 14px 0;flex-wrap:wrap;gap:5px"></div>'
    + '<div style="height:1px;background:var(--border);margin-top:8px"></div>'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px">'
    +   '<div style="display:flex;align-items:center;gap:10px">'
    +     '<input type="file" id="mb-file-input" accept=".pdf,.doc,.docx,.txt" style="display:none" onchange="mbOnFileSelect(this)">'
    +     '<label for="mb-file-input" style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);cursor:pointer;padding:4px 6px;border-radius:6px;transition:color .13s,background .13s" onmouseenter="this.style.color=\'var(--text)\';this.style.background=\'var(--bg)\'" onmouseleave="this.style.color=\'var(--muted)\';this.style.background=\'transparent\'">'
    +       '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4M10 16h4"/></svg>'
    +       '<span id="mb-file-label">Upload Doc or PDF</span>'
    +     '</label>'
    +     '<div id="mb-status" style="font-size:12px;color:var(--muted)"></div>'
    +   '</div>'
    +   '<button onclick="mbAnalyze()" id="mb-analyze-btn" style="height:34px;padding:0 18px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;transition:opacity .13s" onmouseenter="this.style.opacity=\'.85\'" onmouseleave="this.style.opacity=\'1\'">Analyze</button>'
    + '</div>'
    + '</div>';
}

function _mbUpdateThemesChips() {
  var el = document.getElementById('mb-themes-chips');
  if (!el) return;
  if (!_mbThemes.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = 'flex';
  el.innerHTML = '<span style="font-size:11px;font-weight:500;color:var(--faint);flex-shrink:0;margin-right:2px">Recognized keywords</span>'
    + _mbThemes.map(function(t) {
        return '<span style="font-size:11px;padding:2px 8px;background:var(--bg);border:1px solid var(--border);border-radius:20px;color:var(--muted);white-space:nowrap">' + _mbEsc(t) + '</span>';
      }).join('');
}

// ── Analyze ───────────────────────────────────────────────────────────────────
function _mbBindUpload() {
  var fi = document.getElementById('mb-file-input');
  if (!fi) return;
  fi.onchange = function() { _mbUploadFile = fi.files[0] || null; };
}

function mbOnFileSelect(input) {
  var f = input.files && input.files[0];
  var lbl = document.getElementById('mb-file-label');
  if (lbl) lbl.textContent = f ? f.name : 'Upload Doc or PDF';
  _mbUploadFile = f || null;
}

function mbOpenLibraryPicker() {
  var sel = document.getElementById('mb-library-selected');
  if (sel) sel.textContent = 'Library integration coming soon.';
}

async function mbAnalyze() {
  if (_mbLoading) return;
  var ta = document.getElementById('mb-text-input');
  var txt = ta ? ta.value.trim() : '';
  if (!txt) { _mbSetStatus('Enter some text first.', true); return; }

  _mbLoading = true;
  _mbSetStatus('Analyzing with Groq…', false, true);
  var btn = document.getElementById('mb-analyze-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '.5'; }

  try {
    var resp = await fetch('/api/taxonomy-affinity', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_type: 'text', text: txt })
    });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'API error');

    _mbThemes = data.themes || [];

    // Normalize scores per dimension: top item → 100, rest scale accordingly
    var raw = data.scored || {};
    var normalized = {};
    Object.keys(raw).forEach(function(type) {
      var items = raw[type];
      var maxS  = items.length ? items[0].score : 1;
      if (maxS === 0) maxS = 1;
      normalized[type] = items.map(function(item) {
        return Object.assign({}, item, { score: Math.round(item.score / maxS * 100) });
      });
    });

    _mbScored  = normalized;
    _mbShowAll = {};
    _mbTaxTab  = 'overview';
    _mbSetStatus('');
    _mbUpdateThemesChips();

    var results = document.getElementById('mb-results');
    if (results) results.innerHTML = _mbResultsHtml();

  } catch(e) {
    _mbSetStatus('Error: ' + e.message, true);
  } finally {
    _mbLoading = false;
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  }
}

function _mbSetStatus(msg, isErr, isLoading) {
  var el = document.getElementById('mb-status');
  if (!el) return;
  if (isLoading) {
    el.innerHTML = '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:11px;height:11px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin .7s linear infinite"></span>' + msg + '</span>';
  } else {
    el.textContent = msg;
    el.style.color = isErr ? '#ef4444' : 'var(--muted)';
  }
}

// ── Results ───────────────────────────────────────────────────────────────────
function _mbResultsHtml() {
  if (!_mbScored) return '';
  return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    + '<div style="border-bottom:1px solid var(--border);padding:0 4px">'
    +   UI.tabNav(MB_TAX_TABS, _mbTaxTab, 'mbSwitchTaxTab')
    + '</div>'
    + '<div id="mb-tax-panel" style="padding:20px 24px">'
    +   (_mbTaxTab === 'overview' ? _mbOverviewHtml() : _mbTaxPanelHtml(_mbTaxTab))
    + '</div>'
    + '</div>';
}

function mbSwitchTaxTab(id) {
  _mbTaxTab = id;
  var tabsEl = document.querySelector('.ul-tabnav');
  if (tabsEl) tabsEl.outerHTML = UI.tabNav(MB_TAX_TABS, _mbTaxTab, 'mbSwitchTaxTab');
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = id === 'overview' ? _mbOverviewHtml() : _mbTaxPanelHtml(id);
}

// ── Quadrant scatter plot ─────────────────────────────────────────────────────
// Colors by taxonomy type — from UI Kit CHART_COLORS_FULL palette
var MB_TYPE_COLORS = {
  iab:          '#5890D4', // Sky-Blue
  emotion:      '#E04CA0', // Hot Pink
  sentiment:    '#9870CC', // Violet
  object:       '#F4A234', // Amber
  location:     '#48BC6C', // Green
  logo:         '#F47843', // Warm Orange
  face:         '#38BCBC', // Teal
  brand_safety: '#6878CC', // Cornflower
};

function _mbQuadrantFamilies() {
  var t = _mbThemes.slice();
  if (!t.length) return [{label:'Category A',themes:[]},{label:'Category B',themes:[]},{label:'Category C',themes:[]},{label:'Category D',themes:[]}];
  var n = t.length, q = Math.ceil(n / 4);
  return [t.slice(0,q), t.slice(q,q*2), t.slice(q*2,q*3), t.slice(q*3)].map(function(g) {
    var lbl = (g[0] || 'Group').replace(/^\w/, function(c){return c.toUpperCase();});
    if (lbl.length > 22) lbl = lbl.slice(0,22)+'…';
    return { label: lbl, themes: g };
  });
}

function _mbAssignQuadrant(sig, families) {
  var sigText = (sig.name + ' ' + sig.type).toLowerCase();
  var best = -1, bestN = 0;
  families.forEach(function(f, fi) {
    var n = f.themes.reduce(function(s, theme) {
      return s + theme.toLowerCase().split(/\s+/).filter(function(w){ return w.length > 2 && sigText.includes(w); }).length;
    }, 0);
    if (n > bestN) { bestN = n; best = fi; }
  });
  if (best < 0) {
    var seed = 0;
    for (var i = 0; i < sig.name.length; i++) seed = (((seed << 5) - seed) + sig.name.charCodeAt(i)) & 0x7fff;
    best = seed % 4;
  }
  return best;
}

function _mbScatterSvg(signals, families) {
  var W = 640, H = 460, CX = W/2, CY = H/2, PAD = 44;

  // Normalize pod sizes for point radius (3–11px)
  var allPods = signals.map(function(s){ return _mbPods(s); });
  var maxPods = Math.max.apply(null, allPods.concat([1]));
  function podRadius(pods) { return 3 + (pods / maxPods) * 8; }

  var svg = '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="display:block;background:#fff">';

  // Axis lines — thin solid
  svg += '<line x1="' + CX + '" y1="0" x2="' + CX + '" y2="' + H + '" stroke="#e5e7eb" stroke-width="0.75"/>';
  svg += '<line x1="0" y1="' + CY + '" x2="' + W + '" y2="' + CY + '" stroke="#e5e7eb" stroke-width="0.75"/>';

  // Quadrant family labels — top-left, top-right, bottom-right, bottom-left
  var labelDefs = [
    { x: 10,   y: 14,   anchor: 'start' },
    { x: W-10, y: 14,   anchor: 'end'   },
    { x: W-10, y: H-8,  anchor: 'end'   },
    { x: 10,   y: H-8,  anchor: 'start' },
  ];
  families.forEach(function(f, i) {
    var lp = labelDefs[i];
    var lbl = f.label.length > 18 ? f.label.slice(0,18)+'…' : f.label;
    svg += '<text x="' + lp.x + '" y="' + lp.y + '" font-size="9" font-weight="600" fill="#c0c4cc" font-family="Geist,sans-serif" text-anchor="' + lp.anchor + '" letter-spacing=".3">' + _mbEsc(lbl.toUpperCase()) + '</text>';
  });

  // Points (render small/low first so large appear on top)
  var sorted = signals.slice().sort(function(a,b){
    return _mbPods(a) - _mbPods(b);
  });
  var qCounts = [0,0,0,0];

  sorted.forEach(function(sig) {
    var q = sig.quadrant, idx = qCounts[q]++;
    var cols = 6, row = Math.floor(idx/cols), col = idx % cols;
    var iW = CX - PAD*2, iH = CY - PAD*2 - 20;

    // Quadrant origin: top-left=Q0, top-right=Q1, bottom-left=Q2, bottom-right=Q3
    var qOX = q===0||q===2 ? 0 : CX;
    var qOY = q===0||q===1 ? 0 : CY;

    var jSeed = 0, js = sig.name + sig.typeId;
    for (var i=0;i<js.length;i++) jSeed=(((jSeed<<5)-jSeed)+js.charCodeAt(i))&0x7fff;
    var jx = (jSeed%30)-15, jy = ((jSeed>>4)%30)-15;

    var px = Math.max(qOX+10, Math.min(qOX+CX-12, qOX+PAD+(col/Math.max(1,cols-.5))*iW+jx));
    var py = Math.max(qOY+24, Math.min(qOY+CY-10, qOY+PAD+22+(row/4)*iH+jy));

    var pods = _mbPods(sig);
    var r    = podRadius(pods);
    var sel  = !!_mbSelected[sig.key];
    var c    = MB_TYPE_COLORS[sig.typeId] || '#8b5cf6';

    // Label for top signals (score >= 75)
    if (sig.score >= 75) {
      var lbl  = (sig.name.length>13 ? sig.name.slice(0,13)+'…' : sig.name);
      var tx   = px+r+3, anchor = 'start';
      if (tx + lbl.length*4.8 > W-6) { tx = px-r-3; anchor = 'end'; }
      svg += '<text x="' + tx.toFixed(1) + '" y="' + (py+3).toFixed(1) + '" font-size="8.5" fill="#9ca3af" font-family="Geist,sans-serif" text-anchor="' + anchor + '" pointer-events="none">' + _mbEsc(lbl) + '</text>';
    }

    var tipData = _mbEsc(sig.name) + '|' + _mbEsc(sig.type) + '|' + sig.score + '|' + pods;
    svg += (sel
      ? '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (r+4).toFixed(1) + '" fill="none" stroke="#ED005E" stroke-width="2" opacity=".9"/>'
      : '')
      + '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + r.toFixed(1) + '"'
      + ' fill="' + c + '"'
      + ' style="cursor:pointer"'
      + ' onclick="mbToggleItem(\'' + (sig.key+'').replace(/'/g,"\\'") + '\')"'
      + ' onmouseover="mbScatterTip(event,\'' + tipData + '\')"'
      + ' onmouseout="mbScatterHideTip()"'
      + '/>';
  });

  svg += '</svg>';
  return svg;
}

// Tooltip helpers
function mbScatterTip(e, data) {
  var parts = data.split('|');
  var name = parts[0], type = parts[1], score = parts[2], pods = parts[3];
  var tip = document.getElementById('mb-scatter-tip');
  if (!tip) return;
  tip.innerHTML = '<div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">' + name + '</div>'
    + '<div style="font-size:11px;color:var(--muted)">' + type + '</div>'
    + '<div style="display:flex;gap:10px;margin-top:5px">'
    +   '<span style="font-size:11px">Score <strong>' + score + '</strong></span>'
    +   '<span style="font-size:11px">Pods <strong>' + pods + '</strong></span>'
    + '</div>';
  tip.style.display = 'block';
  tip.style.left = (e.offsetX + 14) + 'px';
  tip.style.top  = (e.offsetY - 10) + 'px';
}
function mbScatterHideTip() {
  var tip = document.getElementById('mb-scatter-tip');
  if (tip) tip.style.display = 'none';
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function _mbOverviewHtml() {
  var families = _mbQuadrantFamilies();
  var dims = MB_TAX_TABS.filter(function(t){ return t.id !== 'overview'; });

  // Collect signals — top 20 per dimension regardless of score
  var seen = {}, signals = [];
  dims.forEach(function(d) {
    (_mbScored[d.id] || []).slice(0,20).forEach(function(item) {
      var key = d.id + ':' + item.id;
      if (!seen[key]) {
        seen[key] = true;
        signals.push({ name:item.name, type:d.label, typeId:d.id, id:item.id, score:item.score, key:key });
      }
    });
  });
  signals.forEach(function(s){ s.quadrant = _mbAssignQuadrant(s, families); });
  // Sort by score desc, cap at 120 for readability
  signals = signals.sort(function(a,b){ return b.score - a.score; }).slice(0,120);

  // Legend by taxonomy category
  var legend = dims.map(function(d) {
    var c = MB_TYPE_COLORS[d.id] || '#8b5cf6';
    return '<div style="display:flex;align-items:center;gap:5px">'
      + '<span style="width:9px;height:9px;border-radius:50%;background:' + c + ';flex-shrink:0"></span>'
      + '<span style="font-size:11px;color:var(--muted)">' + _mbEsc(d.label) + '</span>'
      + '</div>';
  }).join('');

  return '<div>'
    + '<div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:center">'
    +   legend
    +   '<div style="margin-left:auto;font-size:10px;color:var(--faint)">Point size = pods &nbsp;·&nbsp; Click to select</div>'
    + '</div>'
    + '<div style="position:relative;border:1px solid var(--border);border-radius:10px;overflow:hidden">'
    +   _mbScatterSvg(signals, families)
    +   '<div id="mb-scatter-tip" style="display:none;position:absolute;background:var(--surface);border:1px solid var(--border-md);border-radius:8px;padding:8px 12px;box-shadow:0 4px 12px rgba(0,0,0,.12);pointer-events:none;z-index:10;min-width:140px"></div>'
    + '</div>'
    + '</div>';
}

// ── Dimension tab ─────────────────────────────────────────────────────────────
function _mbTaxPanelHtml(type) {
  var items = (_mbScored && _mbScored[type]) || [];
  if (!items.length) return '<div style="padding:40px;text-align:center;color:var(--faint);font-size:12px">No data</div>';

  var showAll = !!_mbShowAll[type];
  var topN    = 30;
  var visible = showAll ? items : items.slice(0, topN);
  var hasMore = items.length > topN;

  // Table header
  var TH = 'padding:6px 12px;font-size:10px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;text-align:left;border-bottom:1px solid var(--border);background:var(--bg);white-space:nowrap';
  var TD = 'padding:9px 12px;font-size:12px;color:var(--text);border-bottom:1px solid var(--border);vertical-align:middle';

  var html = '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse">'
    + '<thead><tr>'
    +   '<th style="' + TH + ';width:32px"></th>'
    +   '<th style="' + TH + '">Signal</th>'
    +   '<th style="' + TH + ';text-align:center">Score</th>'
    +   '<th style="' + TH + ';text-align:right">Pods</th>'
    +   '<th style="' + TH + ';text-align:right">Est. Impressions</th>'
    + '</tr></thead><tbody>';

  visible.forEach(function(item) {
    var key  = type + ':' + item.id;
    var sel  = !!_mbSelected[key];
    var pods = _mbPods(item);
    var impr = _mbImpressions(pods, item);
    var score = item.score || 0;
    var scoreColor = score >= 60 ? '#15803d' : score >= 30 ? '#b45309' : 'var(--faint)';
    var scoreBg    = score >= 60 ? '#dcfce7'  : score >= 30 ? '#fef3c7' : 'var(--bg)';

    var label = item.name;
    if (item.subcategory && item.subcategory !== item.name) label = item.subcategory + ' › ' + item.name;
    else if (item.category && item.category !== item.name && !item.subcategory) label = item.category + ' › ' + item.name;

    html += '<tr onclick="mbToggleItem(\'' + _mbEsc(key) + '\')" style="cursor:pointer;background:' + (sel ? 'rgba(225,29,143,.04)' : 'transparent') + ';transition:background .1s" onmouseenter="this.style.background=\'' + (sel ? 'rgba(225,29,143,.07)' : 'var(--bg)') + '\'" onmouseleave="this.style.background=\'' + (sel ? 'rgba(225,29,143,.04)' : 'transparent') + '\'">'
      + '<td style="' + TD + ';width:32px;padding-right:0">'
      +   (sel
        ? '<svg width="14" height="14" viewBox="0 0 14 14" fill="var(--accent)"><circle cx="7" cy="7" r="7"/><path d="M4 7l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke="var(--border-md)"/></svg>')
      + '</td>'
      + '<td style="' + TD + '">' + _mbEsc(label) + '</td>'
      + '<td style="' + TD + ';text-align:center"><span style="font-size:11px;font-weight:600;color:' + scoreColor + ';background:' + scoreBg + ';border-radius:20px;padding:2px 8px">' + score + '</span></td>'
      + '<td style="' + TD + ';text-align:right;color:var(--muted)">' + _mbFmtN(pods) + '</td>'
      + '<td style="' + TD + ';text-align:right;color:var(--muted)">' + _mbFmtN(impr) + '</td>'
      + '</tr>';
  });

  html += '</tbody></table></div>';

  if (hasMore && !showAll) {
    html += '<div style="margin-top:12px;text-align:center">'
      + '<button onclick="mbShowAll(\'' + type + '\')" style="font-size:12px;color:var(--accent);background:none;border:1px solid var(--border);border-radius:7px;padding:6px 16px;cursor:pointer;font-family:inherit">Show all ' + items.length + ' signals</button>'
      + '</div>';
  }

  return html;
}

function mbToggleItem(key) {
  if (_mbSelected[key]) delete _mbSelected[key];
  else _mbSelected[key] = true;

  var type  = key.split(':')[0];
  var panel = document.getElementById('mb-tax-panel');
  if (panel) {
    if (_mbTaxTab === 'overview') panel.innerHTML = _mbOverviewHtml();
    else if (_mbTaxTab === type)  panel.innerHTML = _mbTaxPanelHtml(type);
  }
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function mbRemoveItem(key) {
  delete _mbSelected[key];
  var type  = key.split(':')[0];
  var panel = document.getElementById('mb-tax-panel');
  if (panel) {
    if (_mbTaxTab === 'overview') panel.innerHTML = _mbOverviewHtml();
    else if (_mbTaxTab === type)  panel.innerHTML = _mbTaxPanelHtml(type);
  }
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function mbClearAll() {
  _mbSelected = {};
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = _mbTaxTab === 'overview' ? _mbOverviewHtml() : _mbTaxPanelHtml(_mbTaxTab);
  var sb = document.getElementById('mb-sidebar');
  if (sb) sb.innerHTML = _mbSidebarHtml();
}

function mbShowAll(type) {
  _mbShowAll[type] = true;
  var panel = document.getElementById('mb-tax-panel');
  if (panel) panel.innerHTML = _mbTaxPanelHtml(type);
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function _mbSidebarHtml() {
  var keys  = Object.keys(_mbSelected);
  var total = keys.length;

  var grouped = {};
  MB_TAX_TABS.forEach(function(t) { if (t.id !== 'overview') grouped[t.id] = []; });

  keys.forEach(function(key) {
    var parts = key.split(':'), type = parts[0], id = parts.slice(1).join(':');
    if (!grouped[type]) grouped[type] = [];
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
      +   '<div style="font-size:12px;color:var(--faint);line-height:1.5">Analyze some content<br>then click signals to select</div>'
      + '</div>';
  }

  var listHtml = '<div style="flex:1;overflow-y:auto;padding:8px 0">';
  MB_TAX_TABS.forEach(function(t) {
    if (t.id === 'overview') return;
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
  alert('Save as Moments Group — coming soon!');
}

function _mbEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
