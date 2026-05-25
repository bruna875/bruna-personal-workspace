// livestream-analysis.js

var LS_CHANNELS = [
  // ── On Air (video live disponibile) ──────────────────────────────────────
  { id:1,  title:'CNN',           publisher:'Turner Broadcasting',     category:'news',   channel:'CNN Live Stream',    status:'on-air',  grad:'linear-gradient(145deg,#C8132A,#8B0D1C)', initials:'CN' },
  { id:2,  title:'BBC News',      publisher:'BBC',                     category:'news',   channel:'BBC News 24',        status:'on-air',  grad:'linear-gradient(145deg,#BB1919,#7A0F0F)', initials:'BB' },
  { id:5,  title:'France 24',     publisher:'France Médias Monde',     category:'news',   channel:'France 24 EN',       status:'on-air',  grad:'linear-gradient(145deg,#00267F,#001240)', initials:'F2' },
  { id:6,  title:'Fox News',      publisher:'Fox Corporation',         category:'news',   channel:'Fox News Live',      status:'on-air',  grad:'linear-gradient(145deg,#002868,#001234)', initials:'FN' },
  { id:3,  title:'NBC Sports',    publisher:'NBCUniversal',            category:'sports', channel:'NBC Sports Live',     status:'on-air',  grad:'linear-gradient(145deg,#0067B9,#003F7D)', initials:'NB' },
  { id:7,  title:'ESPN',          publisher:'ESPN Inc.',               category:'sports', channel:'ESPN Main Event',    status:'on-air',  grad:'linear-gradient(145deg,#CC2200,#881700)', initials:'ES' },
  // ── Off Air (fallback statico) ───────────────────────────────────────────
  { id:4,  title:'Al Jazeera',    publisher:'Al Jazeera Media',        category:'news',   channel:'AJ English Live',    status:'off-air', grad:'linear-gradient(145deg,#8B4513,#5C2D0A)', initials:'AJ' },
  { id:8,  title:'Sky Sports',    publisher:'Sky Group',               category:'sports', channel:'Sky Sports Main',    status:'off-air', grad:'linear-gradient(145deg,#0099FF,#005FA3)', initials:'SS' },
  { id:9,  title:'beIN Sports',   publisher:'beIN Media Group',        category:'sports', channel:'beIN Sports 1',      status:'off-air', grad:'linear-gradient(145deg,#8B2FC9,#5A1C84)', initials:'bS' },
  { id:10, title:'DAZN',          publisher:'DAZN Group',              category:'sports', channel:'DAZN Live',          status:'off-air', grad:'linear-gradient(145deg,#1A1A1A,#0A0A0A)', initials:'DZ' },
  { id:11, title:'TNT Sports',    publisher:'Warner Bros. Discovery',  category:'sports', channel:'TNT Sports 1',       status:'off-air', grad:'linear-gradient(145deg,#FF6600,#C24D00)', initials:'TS' },
  { id:12, title:'Eurosport',     publisher:'Discovery Sports',        category:'sports', channel:'Eurosport 1',        status:'off-air', grad:'linear-gradient(145deg,#005A9E,#003366)', initials:'EU' },
];

var lsViewMode          = 'grid';
var lsSearchTerm        = '';
var lsUnsplashCache     = {};

// YouTube video embeds mappati manualmente per canale
var LS_YT_LIVE = {
  'CNN':        'https://www.youtube.com/embed/MXSO88zV9UM?autoplay=1&mute=1',
  'BBC News':   'https://www.youtube.com/embed/Wcmsg4vDERI?autoplay=1&mute=1',
  'France 24':  'https://www.youtube.com/embed/l8PMl7tUDIE?autoplay=1&mute=1',
  'Fox News':   'https://www.youtube.com/embed/swdqmZpgNSU?autoplay=1&mute=1',
  'NBC Sports': 'https://www.youtube.com/embed/xeQN0I192H8?autoplay=1&mute=1',
  'ESPN':       'https://www.youtube.com/embed/QhPhlVhWZww?autoplay=1&mute=1',
};
var lsScanTimeout = null;

var LS_IAB_POOL = [
  { tag: 'Breaking News',    code: 'IAB12-1' },
  { tag: 'News',             code: 'IAB12'   },
  { tag: 'World News',       code: 'IAB12-9' },
  { tag: 'Politics',         code: 'IAB11-4' },
  { tag: 'Business News',    code: 'IAB3-7'  },
  { tag: 'Economy',          code: 'IAB13-12'},
  { tag: 'Sports',           code: 'IAB17'   },
  { tag: 'Football',         code: 'IAB17-4' },
  { tag: 'Basketball',       code: 'IAB17-7' },
  { tag: 'Weather',          code: 'IAB15-10'},
  { tag: 'Entertainment',    code: 'IAB1'    },
  { tag: 'Technology',       code: 'IAB19'   },
  { tag: 'Finance',          code: 'IAB13'   },
  { tag: 'Society',          code: 'IAB14'   },
  { tag: 'Health',           code: 'IAB7'    },
  { tag: 'Science',          code: 'IAB15'   },
  { tag: 'Travel',           code: 'IAB20'   },
  { tag: 'Law & Government', code: 'IAB11'   },
];

var LS_BS_POOL = [
  { label: 'Safe Content',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    reasoning: 'Studio broadcast with professional anchors delivering factual news — fully suitable for brand advertising across all categories.' },
  { label: 'Safe Content',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    reasoning: 'Calm editorial pacing and neutral tone throughout the segment. No sensitive material detected.' },
  { label: 'Safe Content',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    reasoning: 'Sports highlights with upbeat commentary and positive framing — ideal environment for lifestyle and consumer brands.' },
  { label: 'Safe Content',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    reasoning: 'Informational segment with data-driven graphics and factual commentary. Brand-safe across all advertiser categories.' },
  { label: 'Safe Content',       color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    reasoning: 'A logo/title card paired with dreamy music conveys a serene, ambient setup rather than an active narrative emotion.' },
  { label: 'Controversial News', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
    reasoning: 'Coverage of politically charged events may carry audience polarisation risk for certain brand verticals.' },
  { label: 'Political Content',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    reasoning: 'Segment references electoral topics and government policy — brands in neutral categories should exercise caution.' },
  { label: 'Sensitive Topic',    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    reasoning: 'Footage includes conflict imagery reported in a news context. Suitable for news-adjacent brands; may be inappropriate for consumer packaged goods.' },
];

function lsNowLabel() {
  var d = new Date();
  var h = d.getHours() % 12 || 12;
  var m = d.getMinutes().toString().padStart(2, '0');
  var ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return h + ':' + m + ' ' + ampm + ' · ' + days[d.getDay()] + ' ' + months[d.getMonth()] + ' ' + d.getDate();
}

function lsConfColor(score) {
  if (score >= 90) return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  if (score >= 75) return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
}

function lsScanItemHtml(type) {
  var ts = lsNowLabel();
  var conf = 72 + Math.floor(Math.random() * 27); // 72–98
  var cc = lsConfColor(conf);
  var confBadge = '<span style="font-size:10px;font-weight:600;background:' + cc.bg + ';border:1px solid ' + cc.border + ';color:' + cc.color + ';border-radius:20px;padding:2px 8px">' + conf + '% confidence</span>';

  if (type === 'iab') {
    // pick 1–3 random tags
    var pool = LS_IAB_POOL.slice().sort(function() { return Math.random() - .5; });
    var count = 1 + Math.floor(Math.random() * 2);
    var tags = pool.slice(0, count);
    var tagBadges = tags.map(function(t) {
      return '<span style="font-size:11px;font-weight:500;background:var(--bg);border:1px solid var(--border);color:var(--text);border-radius:20px;padding:2px 10px">' + t.tag + '</span>'
        + '<span style="font-size:10px;color:var(--faint);font-family:monospace;padding:0 2px">' + t.code + '</span>';
    }).join('');
    return '<div data-ls-type="iab" style="padding:14px 0;border-bottom:1px solid var(--border)">'
      + '<div style="font-size:10px;color:var(--faint);margin-bottom:5px">' + ts + '</div>'
      + '<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">IAB Taxonomy</div>'
      + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:5px">' + tagBadges + confBadge + '</div>'
      + '</div>';
  } else {
    var bs = LS_BS_POOL[Math.floor(Math.random() * LS_BS_POOL.length)];
    var bsBadge = '<span style="font-size:11px;font-weight:600;background:' + bs.bg + ';border:1px solid ' + bs.border + ';color:' + bs.color + ';border-radius:20px;padding:2px 10px">' + bs.label + '</span>';
    return '<div data-ls-type="bs" style="padding:14px 0;border-bottom:1px solid var(--border)">'
      + '<div style="font-size:10px;color:var(--faint);margin-bottom:5px">' + ts + '</div>'
      + '<div style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Brand Safety</div>'
      + '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin-bottom:8px">' + bsBadge + confBadge + '</div>'
      + '<div style="font-size:11px;color:var(--muted);line-height:1.6"><span style="font-weight:600;color:var(--text-2)">Reasoning:</span> ' + bs.reasoning + '</div>'
      + '</div>';
  }
}

function lsStartScan() {
  lsStopScan();
  function tick() {
    var feed = document.getElementById('ls-scan-feed');
    if (!feed) return;
    // Pick type based on current filter
    var type;
    if (lsSignalMode === 'iab') type = 'iab';
    else if (lsSignalMode === 'brand-safety') type = 'bs';
    else type = Math.random() < 0.55 ? 'iab' : 'bs';
    var html = lsScanItemHtml(type);
    // Insert at top
    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    var item = wrapper.firstChild;
    // animate in
    item.style.opacity = '0';
    item.style.transform = 'translateY(-6px)';
    item.style.transition = 'opacity .35s ease, transform .35s ease';
    feed.insertBefore(item, feed.firstChild);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      });
    });
    var delay = 3500 + Math.floor(Math.random() * 4000); // 3.5s – 7.5s
    lsScanTimeout = setTimeout(tick, delay);
  }
  // First item after a short delay
  lsScanTimeout = setTimeout(tick, 1800);
}

function lsStopScan() {
  if (lsScanTimeout) { clearTimeout(lsScanTimeout); lsScanTimeout = null; }
}

var lsFilterOpen        = false;
var lsFilterAccOpen     = { category: true, status: true, publisher: false };
var lsActiveCategories  = [];
var lsActiveStatuses    = [];
var lsActivePublishers  = [];

function lsToggleFilters() {
  lsFilterOpen = !lsFilterOpen;
  var panel = document.getElementById('ls-filter-panel');
  var btn   = document.getElementById('ls-filter-btn');
  if (!panel) return;
  panel.style.display = lsFilterOpen ? 'block' : 'none';
  if (btn) {
    btn.style.background  = lsFilterOpen ? 'var(--accent)'  : '';
    btn.style.color       = lsFilterOpen ? '#fff'           : 'var(--muted)';
    btn.style.borderColor = lsFilterOpen ? 'var(--accent)'  : 'var(--border)';
  }
  if (lsFilterOpen) {
    var bd = document.getElementById('ls-fp-bd');
    if (bd) bd.style.display = 'block';
    lsRenderFilterPanel();
  } else {
    var bd2 = document.getElementById('ls-fp-bd');
    if (bd2) bd2.style.display = 'none';
  }
}

function lsCloseFilters() {
  lsFilterOpen = false;
  var panel = document.getElementById('ls-filter-panel');
  if (panel) panel.style.display = 'none';
  var bd = document.getElementById('ls-fp-bd');
  if (bd) bd.style.display = 'none';
  var btn = document.getElementById('ls-filter-btn');
  if (btn) { btn.style.background = ''; btn.style.color = 'var(--muted)'; btn.style.borderColor = 'var(--border)'; }
}

function lsToggleAcc(key) {
  lsFilterAccOpen[key] = !lsFilterAccOpen[key];
  lsRenderFilterPanel();
}

function lsRenderFilterPanel() {
  var panel = document.getElementById('ls-filter-panel');
  if (!panel) return;
  panel.innerHTML = lsFilterPanelHtml();
}

function lsFilterPanelHtml() {
  var publishers = LS_CHANNELS.map(function(c) { return c.publisher; })
    .filter(function(v, i, a) { return a.indexOf(v) === i; }).sort();

  function accHead(key, label) {
    var open = lsFilterAccOpen[key];
    var chevron = open
      ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>'
      : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    return '<div onclick="lsToggleAcc(\'' + key + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;user-select:none;font-size:11px;font-weight:600;color:var(--text);text-transform:uppercase;letter-spacing:.5px">'
      + label + chevron + '</div>';
  }

  function checkRow(label, active, onclick) {
    var checked = active
      ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
      : '';
    return '<div onclick="' + onclick + '" style="display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer;border-radius:5px;transition:background .1s;font-size:12px;color:var(--text)" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
      + '<div style="width:14px;height:14px;border-radius:3px;border:1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)') + ';background:' + (active ? 'var(--accent)' : '#fff') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff">' + checked + '</div>'
      + '<span style="flex:1">' + label + '</span>'
      + '</div>';
  }

  var cats = [['news','News'],['sports','Sports']];
  var catRows = lsFilterAccOpen.category
    ? cats.map(function(pair) {
        var active = lsActiveCategories.indexOf(pair[0]) >= 0;
        return checkRow(pair[1], active, 'lsToggleCategory(\'' + pair[0] + '\')');
      }).join('')
    : '';

  var statuses = [['on-air','On Air'],['off-air','Off Air']];
  var statusRows = lsFilterAccOpen.status
    ? statuses.map(function(pair) {
        var active = lsActiveStatuses.indexOf(pair[0]) >= 0;
        return checkRow(pair[1], active, 'lsToggleStatus(\'' + pair[0] + '\')');
      }).join('')
    : '';

  var pubRows = lsFilterAccOpen.publisher
    ? publishers.map(function(p) {
        var active = lsActivePublishers.indexOf(p) >= 0;
        return checkRow(p, active, 'lsTogglePublisher(\'' + p.replace(/'/g,"\\'") + '\')');
      }).join('')
    : '';

  var hasActive = lsActiveCategories.length || lsActiveStatuses.length || lsActivePublishers.length;
  var clearBtn = hasActive
    ? '<div style="padding:8px 12px;border-top:1px solid var(--border)">'
      + '<button onclick="lsClearFilters()" style="width:100%;height:28px;border:none;border-radius:6px;background:var(--bg);color:var(--muted);font-size:11px;font-weight:500;cursor:pointer;font-family:inherit">Clear all filters</button>'
      + '</div>'
    : '';

  return '<div style="border-bottom:1px solid var(--border)">'
    + accHead('category','Category')
    + (catRows ? '<div style="padding-bottom:6px">' + catRows + '</div>' : '')
    + '</div>'
    + '<div style="border-bottom:1px solid var(--border)">'
    + accHead('status','Status')
    + (statusRows ? '<div style="padding-bottom:6px">' + statusRows + '</div>' : '')
    + '</div>'
    + '<div style="border-bottom:1px solid var(--border)">'
    + accHead('publisher','Publisher')
    + (pubRows ? '<div style="padding-bottom:6px">' + pubRows + '</div>' : '')
    + '</div>'
    + clearBtn;
}

function lsToggleCategory(val) {
  var i = lsActiveCategories.indexOf(val);
  if (i >= 0) lsActiveCategories.splice(i, 1); else lsActiveCategories.push(val);
  lsRenderFilterPanel(); lsRenderChips(); lsTx2Render();
}
function lsToggleStatus(val) {
  var i = lsActiveStatuses.indexOf(val);
  if (i >= 0) lsActiveStatuses.splice(i, 1); else lsActiveStatuses.push(val);
  lsRenderFilterPanel(); lsRenderChips(); lsTx2Render();
}
function lsTogglePublisher(val) {
  var i = lsActivePublishers.indexOf(val);
  if (i >= 0) lsActivePublishers.splice(i, 1); else lsActivePublishers.push(val);
  lsRenderFilterPanel(); lsRenderChips(); lsTx2Render();
}
function lsClearFilters() {
  lsActiveCategories = []; lsActiveStatuses = []; lsActivePublishers = [];
  lsRenderFilterPanel(); lsRenderChips(); lsTx2Render();
}

function lsRenderChips() {
  var row = document.getElementById('ls-chips-row');
  if (!row) return;
  var chips = [];
  lsActiveCategories.forEach(function(v) {
    chips.push({ label: v.charAt(0).toUpperCase() + v.slice(1), remove: 'lsToggleCategory(\'' + v + '\')' });
  });
  lsActiveStatuses.forEach(function(v) {
    var label = v === 'on-air' ? 'On Air' : 'Off Air';
    chips.push({ label: label, remove: 'lsToggleStatus(\'' + v + '\')' });
  });
  lsActivePublishers.forEach(function(v) {
    chips.push({ label: v, remove: 'lsTogglePublisher(\'' + v.replace(/'/g,"\\'") + '\')' });
  });
  if (!chips.length) { row.style.display = 'none'; row.innerHTML = ''; return; }
  row.style.display = 'flex';
  row.innerHTML = '<span style="font-size:11px;color:var(--muted);font-weight:500">Filters:</span>'
    + chips.map(function(ch) {
        return '<span onclick="' + ch.remove + '" style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;border:1px solid var(--accent);background:#fdf4ff;font-size:11px;font-weight:500;color:var(--accent);cursor:pointer;white-space:nowrap">'
          + ch.label
          + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
          + '</span>';
      }).join('');
}

function lsLoadImages() {
  document.querySelectorAll('[data-ls-id]').forEach(function(el) {
    var id    = el.getAttribute('data-ls-id');
    var title = el.getAttribute('data-ls-title');
    if (!title) return;
    if (lsUnsplashCache[id]) { lsApplyImage(el, lsUnsplashCache[id]); return; }
    fetch('/api/unsplash?q=' + encodeURIComponent(title))
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.url) { lsUnsplashCache[id] = data.url; lsApplyImage(el, data.url); }
      })
      .catch(function() {});
  });
}

function lsApplyImage(el, url) {
  el.style.backgroundImage    = 'url(' + url + ')';
  el.style.backgroundSize     = 'cover';
  el.style.backgroundPosition = 'center';
  var initials = el.querySelector('.ls-initials');
  if (initials) initials.style.opacity = '0';
  else el.style.color = 'transparent';
}

function renderLivestreamAnalysis() {
  lsViewMode         = 'grid';
  lsSearchTerm       = '';
  lsFilterOpen       = false;
  lsActiveCategories = [];
  lsActiveStatuses   = [];
  lsActivePublishers = [];

  // Ensure shared CSS (cs-card, cs-toolbar, cs-grid, vod-sc-card, etc.) is injected
  if (typeof sdtInjectStyles === 'function') sdtInjectStyles();

  if (!document.getElementById('ls-styles')) {
    var st = document.createElement('style');
    st.id = 'ls-styles';
    st.textContent = '@keyframes ls-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 4px rgba(239,68,68,0)}}.ls-live-dot{animation:ls-pulse 1.5s ease-in-out infinite}';
    document.head.appendChild(st);
  }

  var onAir  = LS_CHANNELS.filter(function(c) { return c.status === 'on-air'; }).length;
  var spark1 = _vodSparklineSvg([4,5,4,6,5,6,7,6,7,onAir], '#e11d8f', 'lsg1');
  var spark2 = _vodSparklineSvg([1.8,2.0,1.9,2.2,2.1,2.3,2.2,2.4,2.3,2.4], '#0891b2', 'lsg2');

  var scorecards =
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">'
    + '<div class="vod-sc-card" style="padding-bottom:0;overflow:hidden">'
    +   '<div style="display:flex;justify-content:space-between;align-items:baseline">'
    +     '<div class="vod-sc-val">' + onAir + '</div>'
    +     '<span style="font-size:10px;font-weight:600;color:#16a34a">↑ 3</span>'
    +   '</div>'
    +   '<div class="vod-sc-lbl" style="margin-bottom:10px">Channels On Air</div>'
    +   spark1
    + '</div>'
    + '<div class="vod-sc-card" style="padding-bottom:0;overflow:hidden">'
    +   '<div style="display:flex;justify-content:space-between;align-items:baseline">'
    +     '<div class="vod-sc-val">2.4M</div>'
    +     '<span style="font-size:10px;font-weight:600;color:#16a34a">↑ 11%</span>'
    +   '</div>'
    +   '<div class="vod-sc-lbl" style="margin-bottom:10px">Avg. Live Viewers</div>'
    +   spark2
    + '</div>'
    + '<div class="vod-sc-card">'
    +   '<div class="vod-sc-val vod-sc-val--err">1</div>'
    +   '<div class="vod-sc-lbl">Stream Errors</div>'
    + '</div>'
    + '</div>';

  setTimeout(function() { lsTx2Render(); }, 0);

  return '<div style="margin-bottom:26px">'
    + '<h1 style="font-size:22px;font-weight:700;letter-spacing:-.5px;color:var(--text);line-height:1.2;margin:0">Livestream Analysis</h1>'
    + '<div id="ls-page-sub" style="font-size:13px;color:var(--muted);margin-top:5px">Browse and analyse your live content pods</div>'
    + '</div>'
    + '<div id="ls-scorecards">' + scorecards + '</div>'
    + '<div id="ls-panel">'
    +   '<div class="cs-card">'
    +     '<div class="cs-toolbar" style="margin-bottom:0;position:relative;gap:8px">'
    +       '<div style="position:relative;flex:1;min-width:0">'
    +         '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--faint);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
    +         '<input type="text" placeholder="Search channels…" oninput="lsSearch(this.value)" style="width:100%;box-sizing:border-box;height:32px;border:1px solid var(--border);border-radius:7px;padding:0 10px 0 30px;font-size:12px;font-family:inherit;color:var(--text);background:#fff;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'">'
    +       '</div>'
    +       '<button id="ls-filter-btn" onclick="lsToggleFilters()" title="Filters" style="width:32px;height:32px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s">'
    +         '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>'
    +       '</button>'
    +       '<div style="width:1px;height:20px;background:var(--border);flex-shrink:0"></div>'
    +       '<div id="ls-filter-panel" style="display:none;position:absolute;top:calc(100% + 8px);right:72px;z-index:99;width:240px;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);overflow:hidden"></div>'
    +       '<div style="display:flex;gap:2px;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:2px;flex-shrink:0">'
    +         '<button id="ls-view-grid-btn" onclick="lsSetView(\'grid\')" title="Grid view" style="width:28px;height:26px;border:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.08);transition:all .12s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>'
    +         '<button id="ls-view-table-btn" onclick="lsSetView(\'table\')" title="Table view" style="width:28px;height:26px;border:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--muted);transition:all .12s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>'
    +       '</div>'
    +     '</div>'
    +     '<div id="ls-chips-row" style="display:none;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px"></div>'
    +     '<div id="ls-fp-bd" onclick="lsCloseFilters()" style="display:none;position:fixed;inset:0;z-index:98"></div>'
    +     '<div style="margin-top:16px"><div id="ls-grid"></div></div>'
    +   '</div>'
    + '</div>'  // close cs-card
    + '</div>'; // close ls-panel
}

function lsSearch(q) {
  lsSearchTerm = (q || '').toLowerCase().trim();
  lsTx2Render();
}

var lsSignalMode = 'all';

function lsSetSignal(v) {
  lsSignalMode = v || 'all';
  // Filter existing feed items
  var feed = document.getElementById('ls-scan-feed');
  if (feed) {
    var items = feed.querySelectorAll('[data-ls-type]');
    items.forEach(function(el) {
      var t = el.getAttribute('data-ls-type');
      var show = lsSignalMode === 'all'
        || (lsSignalMode === 'iab' && t === 'iab')
        || (lsSignalMode === 'brand-safety' && t === 'bs');
      el.style.display = show ? '' : 'none';
    });
  }
}

function lsSetView(v) {
  lsViewMode = v;
  var gb = document.getElementById('ls-view-grid-btn');
  var tb = document.getElementById('ls-view-table-btn');
  if (gb) {
    gb.style.background  = v === 'grid' ? 'var(--surface)' : 'transparent';
    gb.style.color       = v === 'grid' ? 'var(--text)'    : 'var(--muted)';
    gb.style.boxShadow   = v === 'grid' ? '0 1px 3px rgba(0,0,0,.08)' : 'none';
  }
  if (tb) {
    tb.style.background  = v === 'table' ? 'var(--surface)' : 'transparent';
    tb.style.color       = v === 'table' ? 'var(--text)'    : 'var(--muted)';
    tb.style.boxShadow   = v === 'table' ? '0 1px 3px rgba(0,0,0,.08)' : 'none';
  }
  lsTx2Render();
}

function lsTx2Render() {
  var container = document.getElementById('ls-grid');
  if (!container) return;

  var channels = LS_CHANNELS.filter(function(c) {
    if (lsSearchTerm && (c.title + ' ' + c.publisher + ' ' + c.category + ' ' + c.channel).toLowerCase().indexOf(lsSearchTerm) < 0) return false;
    if (lsActiveCategories.length && lsActiveCategories.indexOf(c.category) < 0) return false;
    if (lsActiveStatuses.length && lsActiveStatuses.indexOf(c.status) < 0) return false;
    if (lsActivePublishers.length && lsActivePublishers.indexOf(c.publisher) < 0) return false;
    return true;
  });

  var LIVE_BADGE = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:2px 8px;color:#dc2626;white-space:nowrap">'
    + '<span class="ls-live-dot" style="width:5px;height:5px;border-radius:50%;background:#ef4444;display:inline-block;box-shadow:0 0 4px #ef4444"></span>Live</span>';

  var STATUS_ON  = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:2px 8px;color:#16a34a;white-space:nowrap"><span class="ls-live-dot" style="width:5px;height:5px;border-radius:50%;background:#22c55e;display:inline-block;box-shadow:0 0 4px #22c55e"></span>On Air</span>';
  var STATUS_OFF = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;background:var(--subtle);border:1px solid var(--border);border-radius:20px;padding:2px 8px;color:var(--muted);white-space:nowrap"><span style="width:5px;height:5px;border-radius:50%;background:var(--faint);display:inline-block"></span>Off Air</span>';

  if (lsViewMode === 'table') {
    var TH = 'padding:9px 14px;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);border-bottom:1px solid var(--border);text-align:left;white-space:nowrap';
    var TD = 'padding:10px 14px;font-size:13px;color:var(--text);border-bottom:1px solid var(--border)';
    var rows = channels.map(function(c, i) {
      var isLast = i === channels.length - 1;
      var td = isLast ? TD.replace('border-bottom:1px solid var(--border)', '') : TD;
      return '<tr style="transition:background .1s;cursor:pointer" onmouseover="this.style.background=\'var(--bg)\'" onmouseout="this.style.background=\'\'">'
        + '<td style="' + td + '">'
        +   '<div style="display:flex;align-items:center;gap:12px">'
        +     '<div data-ls-id="' + c.id + '" data-ls-title="' + c.title + ' ' + c.category + ' broadcast television" style="width:56px;height:32px;border-radius:5px;background:' + c.grad + ';background-size:cover;background-position:center;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:rgba(255,255,255,.85)"><span class="ls-initials">' + c.initials + '</span></div>'
        +     '<div>'
        +       '<div style="font-weight:500;font-size:13px">' + c.title + '</div>'
        +       '<div style="font-size:11px;color:var(--faint);margin-top:1px">' + c.channel + '</div>'
        +     '</div>'
        +   '</div>'
        + '</td>'
        + '<td style="' + td + ';color:var(--muted)">' + c.publisher + '</td>'
        + '<td style="' + td + ';color:var(--muted)">' + (c.category.charAt(0).toUpperCase() + c.category.slice(1)) + '</td>'
        + '<td style="' + td + ';color:var(--muted)">' + c.channel + '</td>'
        + '<td style="' + td + '">' + (c.status === 'on-air' ? STATUS_ON : STATUS_OFF) + '</td>'
        + '<td style="' + td + '">' + LIVE_BADGE + '</td>'
        + '</tr>';
    }).join('');
    container.setAttribute('style', '');
    container.className = '';
    container.innerHTML =
      '<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">'
      + '<table style="width:100%;border-collapse:collapse">'
      + '<thead><tr>'
      +   '<th style="' + TH + '">Channel</th>'
      +   '<th style="' + TH + '">Publisher</th>'
      +   '<th style="' + TH + '">Category</th>'
      +   '<th style="' + TH + '">Stream</th>'
      +   '<th style="' + TH + '">Status</th>'
      +   '<th style="' + TH + '"></th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table>'
      + '</div>';
    lsLoadImages();
    return;
  }

  // Grid view
  container.className = 'cs-grid';
  container.removeAttribute('style');

  container.innerHTML = channels.map(function(c) { var cat = c.category.charAt(0).toUpperCase() + c.category.slice(1);
    var liveBadgeThumb = '<div style="position:absolute;top:8px;right:8px">' + LIVE_BADGE + '</div>';
    return '<div class="cs-vod-card" onclick="lsOpenDetail(' + c.id + ')" style="cursor:pointer">'
      + '<div class="cs-vod-thumb" data-ls-id="' + c.id + '" data-ls-title="' + c.title + ' ' + c.category + ' broadcast television" style="background:' + c.grad + ';position:relative">'
      +   '<div class="ls-initials" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:rgba(255,255,255,.7)">' + c.initials + '</div>'
      +   liveBadgeThumb
      + '</div>'
      + '<div class="cs-vod-info">'
      +   '<div class="cs-vod-title">' + c.title + '</div>'
      +   '<div class="cs-vod-row"><span class="cs-vod-lbl">Publisher</span><span class="cs-vod-val">' + c.publisher + '</span></div>'
      +   '<div class="cs-vod-row"><span class="cs-vod-lbl">Category</span><span class="cs-vod-val">' + cat + '</span></div>'
      +   '<div class="cs-vod-row"><span class="cs-vod-lbl">Channel</span><span class="cs-vod-val">' + c.channel + '</span></div>'
      +   '<div class="cs-vod-row"><span class="cs-vod-lbl">Status</span>' + (c.status === 'on-air' ? STATUS_ON : STATUS_OFF) + '</div>'
      + '</div>'
      + '</div>';
  }).join('');
  lsLoadImages();
}

// ── Detail view ──────────────────────────────────────────────────────────────

function lsOpenDetail(id) {
  var c = LS_CHANNELS.filter(function(x) { return x.id === id; })[0];
  if (!c) return;

  var cat     = c.category.charAt(0).toUpperCase() + c.category.slice(1);
  var isOnAir = c.status === 'on-air';

  // Breadcrumb
  var bc = document.getElementById('content-bc');
  if (bc) bc.innerHTML =
    '<span style="font-weight:400;color:var(--muted);cursor:pointer;transition:color .15s"'
    + ' onmouseover="this.style.color=\'var(--accent)\'" onmouseout="this.style.color=\'var(--muted)\'"'
    + ' onclick="lsCloseDetail()">Livestream Analysis</span>'
    + '&nbsp;&nbsp;<span style="color:var(--faint)">/</span>&nbsp;&nbsp;' + c.title;

  // Page subtitle
  var psub = document.getElementById('ls-page-sub');
  if (psub) psub.textContent = c.title + ' · ' + c.channel + ' · ' + cat;

  // Hide scorecards
  var sc = document.getElementById('ls-scorecards');
  if (sc) sc.style.display = 'none';

  // Badges
  var statusBadge = isOnAir
    ? '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:3px 10px;color:#16a34a"><span class="ls-live-dot" style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span>On Air</span>'
    : '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;background:var(--subtle);border:1px solid var(--border);border-radius:20px;padding:3px 10px;color:var(--muted)"><span style="width:6px;height:6px;border-radius:50%;background:var(--faint);display:inline-block"></span>Off Air</span>';
  var liveBadge = '<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;background:#fef2f2;border:1px solid #fecaca;border-radius:20px;padding:3px 10px;color:#dc2626"><span class="ls-live-dot" style="width:6px;height:6px;border-radius:50%;background:#ef4444;display:inline-block"></span>Live</span>';

  // Player column — YouTube live if available, else static
  var ytUrl = LS_YT_LIVE[c.title] || null;
  var playerInner = ytUrl
    ? '<iframe src="' + ytUrl + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>'
    : '<div id="ls-detail-thumb" style="position:absolute;inset:0;background-size:cover;background-position:center"></div>'
      + '<div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.65) 0%,transparent 55%)"></div>'
      + '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">'
      +   '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;cursor:pointer">'
      +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,.92)" style="margin-left:3px"><path d="M5 3l14 9-14 9V3z"/></svg>'
      +   '</div>'
      + '</div>'
      + '<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 16px">'
      +   '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
      +     '<div style="flex:1;height:3px;background:rgba(255,255,255,.22);border-radius:2px"><div style="width:' + (isOnAir ? '100' : '0') + '%;height:100%;background:#ef4444;border-radius:2px"></div></div>'
      +     '<span style="font-size:10px;color:rgba(255,255,255,.6);white-space:nowrap">' + (isOnAir ? 'LIVE' : '—') + '</span>'
      +   '</div>'
      +   '<div style="font-size:12px;font-weight:600;color:#fff">' + c.title + '</div>'
      +   '<div style="font-size:11px;color:rgba(255,255,255,.6);margin-top:2px">' + c.channel + ' · ' + cat + '</div>'
      + '</div>';

  // Always show Live+Status badges overlay (top-left) — on top of iframe too
  var badgesOverlay = '<div style="position:absolute;top:12px;left:14px;display:flex;align-items:center;gap:6px;z-index:2;pointer-events:none">'
    + liveBadge + statusBadge
    + '</div>';

  var playerHtml =
    '<div style="flex:0 0 50%;display:flex;align-items:center;justify-content:center;background:#000;border-right:1px solid var(--border)">'
    + '<div style="width:100%;aspect-ratio:16/9;position:relative;overflow:hidden;background:' + c.grad + '">'
    +   playerInner
    +   badgesOverlay
    + '</div>'
    + '</div>';

  // Right panel — Signal Analysis
  var signalOptions = [
    { val: 'all',          label: 'All Signals' },
    { divider: true },
    { val: 'iab',          label: 'IAB Taxonomies' },
    { val: 'brand-safety', label: 'Brand Safety' }
  ];
  var rightPanel =
    '<div id="ls-detail-right" style="flex:0 0 50%;display:flex;flex-direction:column;overflow:hidden;background:var(--surface)">'
    + '<div style="padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0">'
    +   '<div style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;margin-bottom:8px">Signal Analysis</div>'
    +   UI.customSelect('ls-signal-sel', signalOptions, lsSignalMode, 'lsSetSignal')
    + '</div>'
    + '<div id="ls-scan-feed" style="flex:1;overflow-y:auto;padding:0 20px"></div>'
    + '</div>';

  // Card header — single line
  var cardHdr =
    '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid var(--border);flex-shrink:0">'
    + '<div style="display:flex;align-items:center;gap:8px;min-width:0;overflow:hidden">'
    +   '<span style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + c.title + '</span>'
    +   '<span style="color:var(--border);font-size:12px;flex-shrink:0">·</span>'
    +   '<span style="font-size:12px;color:var(--faint);white-space:nowrap">' + c.channel + ' · ' + cat + '</span>'
    + '</div>'
    + '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:16px">' + statusBadge + '</div>'
    + '</div>';

  // Inject into ls-panel — same pattern as VoD's sdt-panel-taxonomy2
  var panel = document.getElementById('ls-panel');
  if (!panel) return;
  // overhead: 52 topbar + 28 padding-top + 20 breadcrumb + 70 page-header + 28 padding-bottom = 198px
  panel.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;height:calc(100vh - 198px);display:flex;flex-direction:column">'
    + cardHdr
    + '<div style="flex:1;min-height:0;display:flex;overflow:hidden">'
    +   playerHtml
    +   rightPanel
    + '</div>'
    + '</div>';

  // Start real-time signal scan
  lsStartScan();

  // Load unsplash image only for static player (no YouTube live)
  if (!ytUrl) {
    var thumbEl = document.getElementById('ls-detail-thumb');
    if (thumbEl) {
      if (lsUnsplashCache[c.id]) {
        thumbEl.style.backgroundImage = 'url(' + lsUnsplashCache[c.id] + ')';
      } else {
        fetch('/api/unsplash?q=' + encodeURIComponent(c.title + ' ' + c.category + ' broadcast television'))
          .then(function(r) { return r.json(); })
          .then(function(data) {
            if (data.url) {
              lsUnsplashCache[c.id] = data.url;
              var el = document.getElementById('ls-detail-thumb');
              if (el) el.style.backgroundImage = 'url(' + data.url + ')';
            }
          }).catch(function() {});
      }
    }
  }
}

function lsCloseDetail() {
  lsStopScan();
  // Restore breadcrumb
  var bc = document.getElementById('content-bc');
  if (bc) bc.innerHTML = '';

  // Restore page subtitle
  var psub = document.getElementById('ls-page-sub');
  if (psub) psub.textContent = 'Browse and analyse your live content pods';

  // Show scorecards
  var sc = document.getElementById('ls-scorecards');
  if (sc) sc.style.display = '';

  // Re-render panel with toolbar + grid
  var panel = document.getElementById('ls-panel');
  if (!panel) return;
  lsFilterOpen = false;
  panel.innerHTML =
    '<div class="cs-card">'
    + '<div class="cs-toolbar" style="margin-bottom:0;position:relative;gap:8px">'
    +   '<div style="position:relative;flex:1;min-width:0">'
    +     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--faint);pointer-events:none"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
    +     '<input type="text" placeholder="Search channels…" oninput="lsSearch(this.value)" style="width:100%;box-sizing:border-box;height:32px;border:1px solid var(--border);border-radius:7px;padding:0 10px 0 30px;font-size:12px;font-family:inherit;color:var(--text);background:#fff;outline:none;transition:border-color .15s" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border)\'">'
    +   '</div>'
    +   '<button id="ls-filter-btn" onclick="lsToggleFilters()" title="Filters" style="width:32px;height:32px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .12s">'
    +     '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>'
    +   '</button>'
    +   '<div style="width:1px;height:20px;background:var(--border);flex-shrink:0"></div>'
    +   '<div id="ls-filter-panel" style="display:none;position:absolute;top:calc(100% + 8px);right:72px;z-index:99;width:240px;background:var(--surface);border:1px solid var(--border);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);overflow:hidden"></div>'
    +   '<div style="display:flex;gap:2px;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:2px;flex-shrink:0">'
    +     '<button id="ls-view-grid-btn" onclick="lsSetView(\'grid\')" title="Grid view" style="width:28px;height:26px;border:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.08);transition:all .12s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>'
    +     '<button id="ls-view-table-btn" onclick="lsSetView(\'table\')" title="Table view" style="width:28px;height:26px;border:none;border-radius:5px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--muted);transition:all .12s"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>'
    +   '</div>'
    + '</div>'
    + '<div id="ls-chips-row" style="display:none;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px"></div>'
    + '<div id="ls-fp-bd" onclick="lsCloseFilters()" style="display:none;position:fixed;inset:0;z-index:98"></div>'
    + '<div style="margin-top:16px"><div id="ls-grid"></div></div>'
    + '</div>';

  lsSearchTerm = '';
  lsTx2Render();
}
