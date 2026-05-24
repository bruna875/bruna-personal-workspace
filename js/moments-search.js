// moments-search.js — Inventory Explorer

var msTab = 'new-search';
var msBrowseTab = 'episodes';

var MS_PREVIOUS = [
  { query: 'cooking & meal prep',        date: '20 May 2025', publisher: 'Paramount AUS', type: 'VoD',          channel: 'Food Network', episodes: 148, taxonomies: 12 },
  { query: 'family entertainment',       date: '17 May 2025', publisher: 'Disney',        type: 'VoD',          channel: 'Disney+',      episodes: 214, taxonomies: 7  },
  { query: 'sports highlights',          date: '14 May 2025', publisher: 'Fox Sports',    type: 'Live',         channel: 'Fox Sports',   episodes: 89,  taxonomies: 5  },
  { query: 'home improvement & DIY',     date: '10 May 2025', publisher: 'Paramount AUS', type: 'Organic Pause',channel: 'HGTV',         episodes: 132, taxonomies: 9  },
  { query: 'travel & outdoor adventure', date: '5 May 2025',  publisher: 'NBC',           type: 'VoD',          channel: 'National Geo', episodes: 76,  taxonomies: 3  },
];

function renderMomentsSearch() {
  msTab = 'new-search';
  msBrowseTab = 'episodes';
  _msDestroyCharts();
  sdtInjectStyles();
  setTimeout(msBindEnterKey, 0);
  var pillTabs = [{id:'new-search',label:'New Search'},{id:'previous',label:'Previous Searches',dividerBefore:true}];
  return UI.pageHeader({ title: 'Inventory Explorer', subtitle: 'Discover and explore contextual moments across your entire content inventory'})
    + '<div id="ms-pills" style="margin-bottom:20px">' + UI.tabNav(pillTabs, msTab, 'msSwitchTab') + '</div>'
    + '<div id="ms-card">'
    +   msCardHtml()
    + '</div>';
}

function msBindEnterKey() {
  var inp = document.getElementById('ms-query');
  if (inp && !inp._msbound) {
    inp._msbound = true;
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') msRunSearch(); });
  }
}

function msCardHtml() {
  if (msTab === 'new-search') return msNewSearchHtml();
  return msPreviousHtml();
}

function msSwitchTab(tab) {
  msTab = tab;
  var pillTabs = [{id:'new-search',label:'New Search'},{id:'previous',label:'Previous Searches',dividerBefore:true}];
  var pillsEl = document.getElementById('ms-pills');
  if (pillsEl) pillsEl.innerHTML = UI.tabNav(pillTabs, tab, 'msSwitchTab');
  var card = document.getElementById('ms-card');
  if (card) card.innerHTML = msCardHtml();
  if (tab === 'new-search') setTimeout(msBindEnterKey, 0);
}

// ── New Search ──────────────────────────────────────────────────────────────

function msNewSearchHtml() {
  var publisherOpts = [
    {val:'',          label:'All Publishers'},
    {val:'paramount', label:'Paramount AUS'},
    {val:'disney',    label:'Disney'},
    {val:'fox',       label:'Fox Sports'},
    {val:'nbc',       label:'NBC'},
    {val:'abc',       label:'ABC'},
    {val:'foodnet',   label:'Food Network'},
  ];
  var typeOpts = [
    {val:'',        label:'All Types'},
    {val:'vod',     label:'VoD'},
    {val:'live',    label:'Live'},
    {val:'organic', label:'Organic Pause'},
  ];
  var channelOpts = [
    {val:'',          label:'All Channels'},
    {val:'paramount', label:'Paramount'},
    {val:'disney',    label:'Disney+'},
    {val:'fox',       label:'Fox'},
    {val:'nbc',       label:'NBC'},
    {val:'abc',       label:'ABC'},
  ];

  var LBL = 'font-size:10px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;display:block';

  // Exact same sparkle icon as Media Planner
  var sparkle = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M9 3L11.2 9.2 17.5 11.5 11.2 13.8 9 20 6.8 13.8 0.5 11.5 6.8 9.2Z"/><path d="M18.5 3L20 7 24 8.5 20 10 18.5 14 17 10 13 8.5 17 7Z" opacity=".75"/></svg>';

  return '<div id="ms-search-card" class="cs-card" style="padding:24px;margin-bottom:0">'
    + '<div style="background:linear-gradient(160deg,#fef6fb 0%,var(--surface) 65%);border-radius:10px;padding:28px 32px">'
    + '<div style="max-width:560px;margin:0 auto">'

    // Icon + heading
    +   '<div style="text-align:center;margin-bottom:20px">'
    +     '<div style="display:flex;flex-direction:column;align-items:center;gap:7px;margin-bottom:6px">'
    +       '<div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#e11d8f,#f43f5e);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(225,29,143,.28)">'
    +         sparkle
    +       '</div>'
    +     '</div>'
    +     '<div style="font-size:15px;font-weight:700;color:#0D1E36;margin-bottom:4px">Inventory Explorer</div>'
    +     '<div style="font-size:11px;color:var(--muted)">Discover the perfect moments across your inventory by keyword, topic or concept.</div>'
    +   '</div>'

    // Search bar
    +   '<div style="position:relative;margin-bottom:12px">'
    +     '<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--faint);pointer-events:none;display:flex">'
    +       '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    +     '</span>'
    +     '<input id="ms-query" type="text" placeholder="e.g. cooking, family dinner, outdoor adventure…" style="width:100%;box-sizing:border-box;padding:11px 13px 11px 38px;font-size:13px;border:1px solid var(--border-md);border-radius:8px;background:var(--surface);color:var(--text);outline:none;font-family:inherit;transition:border-color .15s" onfocus="this.style.borderColor=\'#e11d8f\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    +   '</div>'

    // Three selects
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:28px">'
    +     '<div><span style="' + LBL + '">Publisher</span>'    + UI.customSelect('ms-publisher', publisherOpts, '', null) + '</div>'
    +     '<div><span style="' + LBL + '">Content Type</span>' + UI.customSelect('ms-type',      typeOpts,      '', null) + '</div>'
    +     '<div><span style="' + LBL + '">Channel</span>'      + UI.customSelect('ms-channel',   channelOpts,   '', null) + '</div>'
    +   '</div>'

    // CTA — same as Media Planner
    +   '<div style="display:flex;justify-content:center">'
    +     '<button onclick="msRunSearch()" style="height:46px;padding:0 40px;display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:12px;border:none;background:linear-gradient(135deg,#e11d8f,#f43f5e);color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;box-shadow:0 4px 18px rgba(225,29,143,.32);letter-spacing:.01em">'
    +       '<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M9 3L11.2 9.2 17.5 11.5 11.2 13.8 9 20 6.8 13.8 0.5 11.5 6.8 9.2Z"/><path d="M18.5 3L20 7 24 8.5 20 10 18.5 14 17 10 13 8.5 17 7Z" opacity=".75"/></svg>'
    +       'Browse Inventory'
    +     '</button>'
    +   '</div>'

    + '</div>'
    + '</div>'
    + '</div>'
    + '<div id="ms-results" style="margin-top:16px"></div>';
}

var MS_MOCK_RESULTS = [
  { name: 'Family Dinner — Yellowstone S05E08',    channel: 'Paramount AUS', type: 'vod',     score: 94, inventory: 312, cpm: '$28' },
  { name: 'Grocery Store Scene — Parks & Rec',     channel: 'NBC',           type: 'organic', score: 88, inventory: 278, cpm: '$22' },
  { name: 'Cooking Segment — MasterChef AU',       channel: 'Paramount AUS', type: 'vod',     score: 85, inventory: 241, cpm: '$19' },
  { name: 'Meal Prep Tutorial — Food Network Live',channel: 'Food Network',  type: 'live',    score: 81, inventory: 198, cpm: '$24' },
  { name: 'BBQ Weekend — Outdoor Living Ep.12',    channel: 'Discovery',     type: 'vod',     score: 76, inventory: 143, cpm: '$31' },
  { name: 'Healthy Eating — CBS Morning Show',     channel: 'CBS',           type: 'live',    score: 72, inventory: 110, cpm: '$26' },
];

// ── Insights mock data ───────────────────────────────────────────────────────

var MS_IAB_DATA = [
  {label:'Food & Drink',    pct:32},
  {label:'Sports',          pct:24},
  {label:'Entertainment',   pct:18},
  {label:'Travel',          pct:14},
  {label:'Home & Garden',   pct:12},
];
var MS_LOC_DATA = [
  {label:'Kitchen',      val:847},
  {label:'Outdoor',      val:623},
  {label:'Living Room',  val:512},
  {label:'Restaurant',   val:389},
  {label:'Sports Arena', val:271},
];
var MS_OBJ_DATA = [
  {label:'Food Items',   val:1243},
  {label:'People',       val:987},
  {label:'Vehicles',     val:654},
  {label:'Animals',      val:432},
  {label:'Electronics',  val:318},
];
var MS_SHOW_DATA = [
  {label:'Yellowstone S05',   val:18},
  {label:'MasterChef AU',     val:14},
  {label:'Parks & Rec',       val:11},
  {label:'Outdoor Living',    val:8},
  {label:'CBS Morning Show',  val:6},
];
var MS_TABLE_DATA = [
  {episode:'S05E08 — "Blood the Boy"',      series:'Yellowstone',        score:94, iab:['Food & Drink','Drama'],           locations:['Kitchen','Ranch'],           objects:['Food Items','Animals'],          emotions:['Joy','Tension'],      sentiment:'Positive', celebrities:['Kevin Costner'],   logos:['Chevron','Ford'],         brandSafety:'Safe'},
  {episode:'S02E14 — "The Douche"',         series:'Parks & Rec',        score:88, iab:['Comedy','Food & Drink'],          locations:['Office','Restaurant'],       objects:['Food Items','People'],           emotions:['Joy','Amusement'],    sentiment:'Positive', celebrities:[],                  logos:['Paunch Burger'],          brandSafety:'Safe'},
  {episode:'EP22 — Finale',                 series:'MasterChef AU',      score:97, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen','Restaurant'],      objects:['Food Items','Cutlery'],          emotions:['Excitement','Joy'],   sentiment:'Positive', celebrities:['Gordon Ramsay'],   logos:['Le Creuset'],             brandSafety:'Safe'},
  {episode:'S01E12 — "BBQ Weekend"',        series:'Outdoor Living',     score:82, iab:['Food & Drink','Home & Garden'],   locations:['Outdoor','Garden'],          objects:['BBQ Grill','Food Items'],        emotions:['Joy','Relaxation'],   sentiment:'Positive', celebrities:[],                  logos:['Weber'],                  brandSafety:'Safe'},
  {episode:'May 14 — Healthy Eating',       series:'CBS Morning Show',   score:79, iab:['Food & Drink','Health'],          locations:['Studio','Kitchen'],          objects:['Food Items','Electronics'],      emotions:['Trust','Joy'],        sentiment:'Positive', celebrities:['Gayle King'],      logos:['CBS'],                    brandSafety:'Safe'},
  {episode:'S01E04 — "Midnight Feast"',     series:'Food Network Live',  score:91, iab:['Food & Drink'],                  locations:['Kitchen','Restaurant'],      objects:['Food Items','Drinks'],           emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:[],                  logos:['KitchenAid','Heinz'],     brandSafety:'Safe'},
  {episode:'S03E07 — "Farm to Table"',      series:'MasterChef AU',      score:95, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen','Farm'],            objects:['Food Items','People'],           emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:[],                  logos:['Woolworths'],             brandSafety:'Safe'},
  {episode:'S02E03 — "Taco Night"',         series:'Modern Family',      score:76, iab:['Comedy','Food & Drink'],          locations:['Kitchen','Living Room'],     objects:['Food Items','Furniture'],        emotions:['Amusement','Joy'],    sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S09E11 — "The Dinner Party"',   series:'The Office',         score:85, iab:['Comedy','Food & Drink'],          locations:['Office','Home'],             objects:['Food Items','People'],           emotions:['Amusement','Tension'],sentiment:'Neutral',  celebrities:[],                  logos:['Dunder Mifflin'],         brandSafety:'Safe'},
  {episode:'S04E02 — "Harvest Festival"',   series:'Parks & Rec',        score:71, iab:['Comedy','Food & Drink','Events'], locations:['Outdoor','Park'],            objects:['Food Items','People'],           emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S01E08 — "Sunday Roast"',       series:'Nigella Lawson',     score:93, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen','Dining Room'],     objects:['Food Items','Cutlery','People'], emotions:['Joy','Relaxation'],   sentiment:'Positive', celebrities:['Nigella Lawson'],  logos:[],                         brandSafety:'Safe'},
  {episode:'S06E14 — "The Wedding"',        series:'Yellowstone',        score:68, iab:['Drama','Food & Drink'],           locations:['Outdoor','Ranch'],           objects:['People','Animals'],              emotions:['Joy','Tension'],      sentiment:'Positive', celebrities:['Kevin Costner'],   logos:['Ford'],                   brandSafety:'Safe'},
  {episode:'EP08 — Quarter Final',          series:'MasterChef AU',      score:89, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen'],                   objects:['Food Items','Cutlery'],          emotions:['Tension','Excitement'],sentiment:'Neutral', celebrities:['Gordon Ramsay'],   logos:['Le Creuset','Miele'],     brandSafety:'Safe'},
  {episode:'May 21 — Summer Recipes',       series:'CBS Morning Show',   score:74, iab:['Food & Drink','Health'],          locations:['Studio','Kitchen'],          objects:['Food Items','People'],           emotions:['Joy','Trust'],        sentiment:'Positive', celebrities:['Gayle King'],      logos:['CBS'],                    brandSafety:'Safe'},
  {episode:'S02E09 — "Pizza Party"',        series:'Food Network Live',  score:80, iab:['Food & Drink'],                  locations:['Kitchen','Restaurant'],      objects:['Food Items','People'],           emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:[],                  logos:['KitchenAid'],             brandSafety:'Safe'},
  {episode:'S01E03 — "Brunch Goals"',       series:'Outdoor Living',     score:66, iab:['Food & Drink','Lifestyle'],       locations:['Outdoor','Garden'],          objects:['Food Items','People'],           emotions:['Joy','Relaxation'],   sentiment:'Positive', celebrities:[],                  logos:['Weber','Nespresso'],      brandSafety:'Safe'},
  {episode:'S05E01 — "New Horizons"',       series:'Top Chef',           score:92, iab:['Food & Drink','Competition'],     locations:['Kitchen','Restaurant'],      objects:['Food Items','Cutlery','People'], emotions:['Tension','Excitement'],sentiment:'Positive',celebrities:[],                  logos:['Whole Foods'],            brandSafety:'Safe'},
  {episode:'S03E11 — "Date Night"',         series:'Modern Family',      score:73, iab:['Comedy','Food & Drink'],          locations:['Restaurant','Home'],         objects:['Food Items','People'],           emotions:['Joy','Romance'],      sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S07E05 — "The Grill Off"',      series:'Top Chef',           score:87, iab:['Food & Drink','Competition'],     locations:['Outdoor','Kitchen'],         objects:['BBQ Grill','Food Items'],        emotions:['Tension','Joy'],      sentiment:'Positive', celebrities:[],                  logos:['Weber','Heinz'],          brandSafety:'Safe'},
  {episode:'Jun 3 — Meal Prep Special',     series:'CBS Morning Show',   score:77, iab:['Food & Drink','Health'],          locations:['Studio','Kitchen'],          objects:['Food Items','Electronics'],      emotions:['Trust','Joy'],        sentiment:'Positive', celebrities:[],                  logos:['CBS','Vitamix'],          brandSafety:'Safe'},
  {episode:'S02E06 — "The Feast"',          series:'Nigella Lawson',     score:96, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen','Dining Room'],     objects:['Food Items','Cutlery','Drinks'], emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:['Nigella Lawson'],  logos:[],                         brandSafety:'Safe'},
  {episode:'S04E09 — "Cheat Day"',          series:'Parks & Rec',        score:69, iab:['Comedy','Food & Drink'],          locations:['Office','Restaurant'],       objects:['Food Items','People'],           emotions:['Amusement','Joy'],    sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S01E07 — "Street Food"',        series:'Food Network Live',  score:83, iab:['Food & Drink','Travel'],          locations:['Outdoor','Market'],          objects:['Food Items','People'],           emotions:['Joy','Excitement'],   sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S08E03 — "The Comeback"',       series:'Yellowstone',        score:72, iab:['Drama'],                          locations:['Ranch','Outdoor'],           objects:['Animals','People'],              emotions:['Tension','Sadness'],  sentiment:'Negative', celebrities:['Kevin Costner'],   logos:['Ford'],                   brandSafety:'Review'},
  {episode:'EP15 — Semi Final',             series:'MasterChef AU',      score:90, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen'],                   objects:['Food Items','Cutlery','People'], emotions:['Tension','Excitement'],sentiment:'Neutral', celebrities:['Gordon Ramsay'],   logos:['Miele','Le Creuset'],     brandSafety:'Safe'},
  {episode:'S03E02 — "Slow Cook Sunday"',   series:'Nigella Lawson',     score:86, iab:['Food & Drink','Lifestyle'],       locations:['Kitchen'],                   objects:['Food Items','Cutlery'],          emotions:['Joy','Relaxation'],   sentiment:'Positive', celebrities:['Nigella Lawson'],  logos:[],                         brandSafety:'Safe'},
  {episode:'S06E08 — "Office Olympics"',    series:'The Office',         score:64, iab:['Comedy'],                         locations:['Office'],                    objects:['People','Electronics'],          emotions:['Amusement','Joy'],    sentiment:'Positive', celebrities:[],                  logos:['Dunder Mifflin'],         brandSafety:'Safe'},
  {episode:'S02E12 — "Camping Trip"',       series:'Modern Family',      score:70, iab:['Comedy','Travel'],                locations:['Outdoor'],                   objects:['People','Food Items'],           emotions:['Amusement','Joy'],    sentiment:'Positive', celebrities:[],                  logos:[],                         brandSafety:'Safe'},
  {episode:'S09E02 — "Back to Basics"',     series:'Top Chef',           score:84, iab:['Food & Drink','Competition'],     locations:['Kitchen'],                   objects:['Food Items','Cutlery'],          emotions:['Tension','Joy'],      sentiment:'Positive', celebrities:[],                  logos:['Whole Foods'],            brandSafety:'Safe'},
  {episode:'Jul 8 — Cheese Special',        series:'CBS Morning Show',   score:78, iab:['Food & Drink','Lifestyle'],       locations:['Studio'],                    objects:['Food Items','People'],           emotions:['Joy','Trust'],        sentiment:'Positive', celebrities:[],                  logos:['CBS'],                    brandSafety:'Safe'},
];

// ── Chart & table helpers ─────────────────────────────────────────────────────

function _msE(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function _msChip(text) {
  return '<span class="sc-badge" style="background:#fff;border:1px solid var(--border-md);color:var(--text);margin:1px 3px 1px 0;white-space:nowrap">' + _msE(text) + '</span>';
}
function _msChips(arr, max) {
  if (!arr || !arr.length) return '<span style="color:var(--faint)">—</span>';
  max = max || 2;
  var shown = arr.slice(0, max).map(_msChip).join('');
  var rest  = arr.length - max;
  var more  = rest > 0
    ? '<span class="sc-badge" style="background:#f0f0f0;border:1px solid var(--border-md);color:var(--muted);margin:1px 0;white-space:nowrap">+' + rest + '</span>'
    : '';
  return shown + more;
}

function _msSentBadge(s) {
  var m = {Positive:{bg:'#f0fdf4',bc:'#bbf7d0',c:'#15803d'}, Negative:{bg:'#fef2f2',bc:'#fecaca',c:'#dc2626'}, Neutral:{bg:'#f8fafc',bc:'#e2e8f0',c:'#64748b'}};
  var st = m[s] || m.Neutral;
  return '<span style="display:inline-flex;font-size:10px;font-weight:600;background:' + st.bg + ';border:1px solid ' + st.bc + ';border-radius:20px;padding:2px 8px;color:' + st.c + '">' + _msE(s) + '</span>';
}
function _msBsBadge(s) {
  var m = {Safe:{bg:'#f0fdf4',bc:'#bbf7d0',c:'#15803d'}, Review:{bg:'#fffbeb',bc:'#fde68a',c:'#b45309'}, Unsafe:{bg:'#fef2f2',bc:'#fecaca',c:'#dc2626'}};
  var st = m[s] || m.Safe;
  return '<span style="display:inline-flex;font-size:10px;font-weight:600;background:' + st.bg + ';border:1px solid ' + st.bc + ';border-radius:20px;padding:2px 8px;color:' + st.c + '">' + _msE(s) + '</span>';
}

function _msChartTitle(label) {
  return '<div style="font-size:10px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">' + label + '</div>';
}

function msInsightsBodyHtml() {
  var cards = [
    {label:'Series',            value:'5',      sub:'matched',        color:'#5890D4'},
    {label:'Episodes',          value:'57',     sub:'total',          color:'#48BC6C'},
    {label:'Total Screen Time', value:'42 hrs', sub:'across results', color:'#F47843'},
  ];
  var scorecards = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px">'
    + cards.map(function(c) {
        return '<div style="background:#fff;border:1px solid #ebebeb;border-radius:10px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,.04)">'
          + '<div style="font-size:10px;font-weight:600;color:#a0a0a0;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">' + c.label + '</div>'
          + '<div style="font-size:22px;font-weight:700;color:' + c.color + ';line-height:1;letter-spacing:-.3px">' + c.value + '</div>'
          + '<div style="font-size:11px;color:#b0b0b0;margin-top:3px">' + c.sub + '</div>'
          + '</div>';
      }).join('')
    + '</div>';

  // 4-column chart row: donut + 3 bar charts (all Highcharts containers)
  var charts = '<div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:16px">'
    + '<div>'
    +   _msChartTitle('Top 5 IAB Categories')
    +   '<div id="ms-chart-iab" style="height:220px"></div>'
    + '</div>'
    + '<div>'
    +   _msChartTitle('Top 5 Locations')
    +   '<div id="ms-chart-loc" style="height:220px"></div>'
    + '</div>'
    + '<div>'
    +   _msChartTitle('Top 5 Objects')
    +   '<div id="ms-chart-obj" style="height:220px"></div>'
    + '</div>'
    + '<div>'
    +   _msChartTitle('Top 5 Shows')
    +   '<div id="ms-chart-show" style="height:220px"></div>'
    + '</div>'
    + '</div>';

  return scorecards + charts;
}

// ── Chart instance registry (prevents duplicate renders on re-open) ──────────
var _msChartInstances = {};

function _msDestroyCharts() {
  Object.keys(_msChartInstances).forEach(function(k) {
    try { _msChartInstances[k].destroy(); } catch(e) {}
  });
  _msChartInstances = {};
}

function msInitCharts() {
  if (typeof Highcharts === 'undefined') return;
  _msDestroyCharts();

  var FONT = '"DM Sans", sans-serif';
  var CC   = (UI && UI.CHART_COLORS_FULL) || [];
  // Fallback palette matching UI Kit order
  var DEF  = ['#F47843','#F4A234','#F0C030','#AACC38','#8CC440','#48BC6C','#2AAC88','#30B4B0','#38BCBC','#50C0D4','#5AACD8','#5890D4','#6878CC','#7868CC','#9870CC'];
  if (!CC.length) CC = DEF;

  // ── Donut — IAB Categories ────────────────────────────────────────────────
  var iabEl = document.getElementById('ms-chart-iab');
  if (iabEl) {
    _msChartInstances.iab = Highcharts.chart('ms-chart-iab', {
      chart: { type: 'pie', margin: [0, 0, 60, 0], backgroundColor: 'transparent', style: { fontFamily: FONT } },
      title: { text: null },
      credits: { enabled: false },
      colors: [CC[11], CC[5], CC[0], CC[13], CC[6]],
      tooltip: { pointFormat: '{point.name}: <b>{point.percentage:.0f}%</b>' },
      plotOptions: {
        pie: {
          innerSize: '70%', borderWidth: 0,
          center: ['50%', '43%'],
          dataLabels: { enabled: false },
          showInLegend: true,
        }
      },
      legend: {
        enabled: true,
        align: 'center', verticalAlign: 'bottom', layout: 'horizontal',
        itemStyle: { fontSize: '10px', fontWeight: '500', color: '#444' },
        symbolRadius: 3, symbolHeight: 8, symbolWidth: 8,
        itemMarginBottom: 1, padding: 0,
      },
      series: [{
        name: 'Share', colorByPoint: true,
        data: MS_IAB_DATA.map(function(d) { return { name: d.label, y: d.pct }; }),
      }],
    });
  }

  // ── Horizontal bar — shared factory ──────────────────────────────────────
  function _bar(key, elId, cats, vals, color) {
    var el = document.getElementById(elId);
    if (!el) return;
    _msChartInstances[key] = Highcharts.chart(elId, {
      chart: { type: 'bar', marginLeft: 88, marginRight: 34, marginTop: 6, marginBottom: 6, backgroundColor: 'transparent', style: { fontFamily: FONT } },
      title: { text: null },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        categories: cats, lineWidth: 0, tickLength: 0,
        labels: { style: { fontSize: '10px', color: '#666' } },
      },
      yAxis: { min: 0, title: { text: null }, labels: { enabled: false }, gridLineWidth: 0 },
      tooltip: { valueSuffix: ' instances' },
      plotOptions: {
        bar: {
          color: color, borderWidth: 0, borderRadius: 3,
          maxPointWidth: 10, pointPadding: 0.18, groupPadding: 0.06,
          dataLabels: {
            enabled: true,
            style: { fontSize: '9px', fontWeight: '400', color: '#aaa', textOutline: 'none' },
          },
        }
      },
      series: [{ name: 'Count', data: vals }],
    });
  }

  _bar('loc',  'ms-chart-loc',  MS_LOC_DATA.map(function(d){return d.label;}),  MS_LOC_DATA.map(function(d){return d.val;}),  CC[11]);
  _bar('obj',  'ms-chart-obj',  MS_OBJ_DATA.map(function(d){return d.label;}),  MS_OBJ_DATA.map(function(d){return d.val;}),  CC[5]);
  _bar('show', 'ms-chart-show', MS_SHOW_DATA.map(function(d){return d.label;}), MS_SHOW_DATA.map(function(d){return d.val;}), CC[0]);
}

function msInsightsSection() {
  var chev = '<svg id="ms-ins-chev" width="10" height="10" viewBox="0 0 10 10" fill="none" style="flex-shrink:0;transition:transform .2s;transform:rotate(90deg);color:var(--muted)">'
    + '<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';
  return '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface);margin-bottom:16px">'
    + '<div onclick="msToggleInsights()" style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .12s" onmouseenter="this.style.background=\'var(--bg)\'" onmouseleave="this.style.background=\'\'">'
    +   chev
    +   '<span style="font-size:13px;font-weight:600;color:var(--text);flex:1">Insights</span>'
    +   '<span style="font-size:11px;color:var(--muted)">5 series · 57 episodes · 42 hrs screen time</span>'
    + '</div>'
    + '<div id="ms-ins-body" style="border-top:1px solid var(--border);padding:20px 24px">'
    +   msInsightsBodyHtml()
    + '</div>'
    + '</div>';
}

function msToggleInsights() {
  var body = document.getElementById('ms-ins-body');
  var chev = document.getElementById('ms-ins-chev');
  if (!body) return;
  var open = body.style.display !== 'none';
  body.style.display = open ? 'none' : '';
  if (chev) chev.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  if (!open) setTimeout(function() {
    Object.keys(_msChartInstances).forEach(function(k) {
      try { _msChartInstances[k].reflow(); } catch(e) {}
    });
  }, 30);
}

function msTableSection() {
  var cols = [
    {label:'Episode',        width:'240px'},
    {label:'Score',          width:'80px', align:'center'},
    {label:'IAB Taxonomies', width:'180px'},
    {label:'Locations',      width:'160px'},
    {label:'Objects',        width:'160px'},
    {label:'Emotions',       width:'130px'},
    {label:'Sentiment',      width:'110px'},
    {label:'Celebrities',    width:'150px'},
    {label:'Logos',          width:'150px'},
    {label:'Brand Safety',   width:'120px'},
  ];
  var tbodyId = 'ms-ep-tbody';
  var sorted  = MS_TABLE_DATA.slice().sort(function(a, b) { return b.score - a.score; });
  var rows = sorted.map(function(r) {
    var episodeCell = '<div style="font-weight:500;white-space:nowrap">' + _msE(r.episode) + '</div>'
      + '<div style="font-size:10px;color:var(--faint);margin-top:2px;white-space:nowrap">' + _msE(r.series) + '</div>';
    var scoreColor = r.score >= 85 ? '#16a34a' : r.score >= 70 ? '#d97706' : '#dc2626';
    var scoreBg    = r.score >= 85 ? '#f0fdf4' : r.score >= 70 ? '#fffbeb' : '#fef2f2';
    var scoreBadge = UI.badge(r.score + '%', scoreColor, scoreBg);
    return '<tr style="border-bottom:1px solid var(--border)">'
      + [
          episodeCell,
          scoreBadge,
          _msChips(r.iab, 2),
          _msChips(r.locations, 2),
          _msChips(r.objects, 2),
          _msChips(r.emotions, 2),
          _msSentBadge(r.sentiment),
          _msChips(r.celebrities, 2),
          _msChips(r.logos, 2),
          _msBsBadge(r.brandSafety),
        ].map(function(c, i) {
          var align = (i === 1) ? 'text-align:center;' : '';
          return '<td style="padding:11px 16px;font-size:11px;color:var(--text);' + align + '">' + c + '</td>';
        }).join('')
      + '</tr>';
  }).join('');
  return '<div class="cs-card" style="padding:0;overflow:hidden">'
    + '<div style="padding:14px 20px;border-bottom:1px solid var(--border)">'
    +   '<span style="font-size:13px;font-weight:600;color:var(--text)">Browse by Episodes</span>'
    + '</div>'
    + UI.tableScroll(cols, rows, tbodyId, 2, null, {inCard: true})
    + '</div>';
}

// ── Search execution ─────────────────────────────────────────────────────────

function msResetSearch() {
  var searchCard = document.getElementById('ms-search-card');
  if (searchCard) searchCard.style.display = '';
  var results = document.getElementById('ms-results');
  if (results) results.innerHTML = '';
  history.pushState({ id: 'inventory-explorer', label: 'Inventory Explorer' }, '', '/inventory-explorer');
}

function msRunSearch() {
  var q = (document.getElementById('ms-query') || {}).value || '';
  var results = document.getElementById('ms-results');
  if (!results) return;

  if (!q.trim()) {
    results.innerHTML = '<div style="padding:24px 0;text-align:center;color:var(--faint);font-size:13px">Please enter a keyword to search.</div>';
    return;
  }

  var searchCard = document.getElementById('ms-search-card');
  if (searchCard) searchCard.style.display = 'none';

  history.pushState({ id: 'inventory-explorer', label: 'Inventory Explorer' }, '', '/inventory-explorer/new-search');

  results.innerHTML = '<div style="padding:32px 0;text-align:center"><div style="width:28px;height:28px;border:2.5px solid var(--border-md);border-top-color:var(--accent);border-radius:50%;animation:ld-spin .8s linear infinite;margin:0 auto 10px"></div><div style="font-size:12px;color:var(--muted)">Searching moments…</div></div>';

  setTimeout(function() {
    var saveIco = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    var chevLeft = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    results.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">'
      +   '<button onclick="msResetSearch()" style="display:inline-flex;align-items:center;gap:4px;background:none;border:none;padding:0;font-size:13px;font-weight:600;color:var(--accent);cursor:pointer;font-family:inherit;flex-shrink:0">'
      +     chevLeft + 'Run new search'
      +   '</button>'
      +   '<div style="font-size:13px;color:var(--text);flex:1">'
      +     '<strong>1,247 episodes</strong> found for "<strong>' + _msE(q) + '</strong>"'
      +   '</div>'
      +   '<button id="ms-save-btn" onclick="msSaveSearch(\'' + q.replace(/'/g, '') + '\')" style="display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-weight:500;font-family:inherit;color:var(--muted);background:none;cursor:pointer;transition:all .12s" onmouseover="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--muted)\'">'
      +     saveIco + 'Save Search'
      +   '</button>'
      + '</div>'
      + msInsightsSection()
      + '<div style="margin-top:16px">'
      +   '<div id="ms-browse-tabs" style="margin-bottom:12px">'
      +     UI.tabNav([{id:'episodes',label:'By Episodes'},{id:'taxonomies',label:'By Taxonomies'}], msBrowseTab, 'msSwitchBrowseTab')
      +   '</div>'
      +   '<div id="ms-browse-content">' + msBrowseContentHtml() + '</div>'
      + '</div>';
    setTimeout(msInitCharts, 50);
  }, 900);
}

function msSwitchBrowseTab(tab) {
  msBrowseTab = tab;
  var nav = document.getElementById('ms-browse-tabs');
  if (nav) nav.innerHTML = UI.tabNav(
    [{id:'episodes',label:'By Episodes'},{id:'taxonomies',label:'By Taxonomies'}],
    tab, 'msSwitchBrowseTab');
  var content = document.getElementById('ms-browse-content');
  if (content) content.innerHTML = msBrowseContentHtml();
  if (tab === 'taxonomies') {
    setTimeout(function() {
      msTaxInitScatter();
      msTaxTab('objects');
    }, 50);
  }
}

function msBrowseContentHtml() {
  return msBrowseTab === 'taxonomies' ? msTaxonomiesHtml() : msTableSection();
}

// ── By Taxonomies split view ──────────────────────────────────────────────────

var _msTaxCurrentTab = 'objects';
var _msTaxPanelOpen  = true;

function _msTaxTabStyle(isActive) {
  return 'padding:5px 14px;border:none;border-radius:20px;font-size:12px;font-weight:' + (isActive?'600':'400') + ';'
    + 'cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;'
    + 'background:' + (isActive?'var(--accent)':'transparent') + ';'
    + 'color:' + (isActive?'#fff':'var(--muted)') + ';';
}

function msTaxTogglePanel() {
  _msTaxPanelOpen = !_msTaxPanelOpen;
  var panel   = document.getElementById('ms-tax-left-panel');
  var scatter = document.getElementById('ms-tax-scatter');
  var label   = document.getElementById('ms-tax-panel-label');
  var chevron = document.getElementById('ms-tax-chevron-icon');
  if (!panel) return;
  if (_msTaxPanelOpen) {
    panel.style.width = '340px';
    if (scatter) scatter.style.display = '';
    if (label)   label.style.display   = '';
    if (chevron) chevron.style.transform = '';
    setTimeout(msTaxInitScatter, 220); // re-init after transition
  } else {
    panel.style.width = '40px';
    if (scatter) scatter.style.display = 'none';
    if (label)   label.style.display   = 'none';
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  }
}

function msTaxonomiesHtml() {
  _msTaxPanelOpen = true; // reset on each render
  var tabsHtml = TX_MODAL_TABS.map(function(t) {
    var isActive = t.id === 'objects';
    return '<button id="ms-tax-mtab-' + t.id + '" onclick="msTaxTab(\'' + t.id + '\')" style="' + _msTaxTabStyle(isActive) + '">' + t.label + '</button>';
  }).join('');

  var scatterIco = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;color:var(--faint)">'
    + '<circle cx="7.5" cy="7.5" r="1.5"/>'
    + '<circle cx="18.5" cy="5.5" r="1.5"/>'
    + '<circle cx="11.5" cy="11.5" r="1.5"/>'
    + '<circle cx="7.5" cy="16.5" r="1.5"/>'
    + '<circle cx="17.5" cy="14.5" r="1.5"/>'
    + '<circle cx="13.5" cy="19.5" r="1.5"/>'
    + '</svg>';

  var chevronSvg = '<svg id="ms-tax-chevron-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" style="transition:transform .22s;display:block">'
    + '<path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';

  // Shared header height — both columns use the same flex height so they align
  var HDR = 'display:flex;align-items:center;height:44px;border-bottom:1px solid var(--border);box-sizing:border-box;';

  return '<div class="cs-card" style="padding:0;overflow:hidden">'
    + '<div style="display:flex;height:500px;overflow:hidden">'

    // ── Left panel (collapsible) ──
    +   '<div id="ms-tax-left-panel" style="width:340px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;transition:width .22s ease">'
    +     '<div id="ms-tax-panel-hdr" style="' + HDR + 'padding:0 12px;gap:8px;cursor:pointer;border-radius:6px;transition:background .15s" onclick="msTaxTogglePanel()" onmouseover="if(!_msTaxPanelOpen)this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'\'">'
    +       scatterIco
    +       '<span id="ms-tax-panel-label" style="flex:1;font-size:11px;font-weight:600;color:var(--faint);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;overflow:hidden">&nbsp;Taxonomy Relevance</span>'
    +       '<span style="flex-shrink:0;color:var(--muted)">' + chevronSvg + '</span>'
    +     '</div>'
    +     '<div id="ms-tax-scatter" style="flex:1;min-height:0"></div>'
    +   '</div>'

    // ── Right panel ──
    +   '<div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden">'
    +     '<div style="' + HDR + 'padding:0 12px;gap:2px;flex-wrap:wrap">' + tabsHtml + '</div>'
    +     '<div style="flex:1;overflow-y:auto;min-height:0" id="ms-tax-body"></div>'
    +   '</div>'

    + '</div>'
    + '</div>';
}

function msTaxInitScatter() {
  if (typeof Highcharts === 'undefined') return;
  var container = document.getElementById('ms-tax-scatter');
  if (!container || container.style.display === 'none') return;
  // Derive categories directly from TX_MODAL_TABS so X axis always matches right panel
  var cats = TX_MODAL_TABS.map(function(t) { return t.label; });
  function bp(x,y,z,n) {
    var g = y >= 70;
    return {x:x,y:y,z:z,name:n,color:g?'rgba(34,197,94,0.55)':'rgba(234,179,8,0.55)',marker:{lineColor:g?'#16a34a':'#ca8a04',lineWidth:1.5}};
  }
  var data = [
    // Objects (0)
    bp(0,94,14,'Food Items'),  bp(0,88,12,'Kitchenware'), bp(0,82,11,'Tableware'),  bp(0,70,9,'Beverages'),   bp(0,63,8,'Appliances'),
    // Emotion (1)
    bp(1,91,13,'Joy'),         bp(1,85,12,'Excitement'),  bp(1,74,10,'Trust'),      bp(1,60,8,'Tension'),
    // Location (2)
    bp(2,93,14,'Kitchen'),     bp(2,87,12,'Restaurant'),  bp(2,79,11,'Outdoor'),    bp(2,66,9,'Studio'),
    // Sentiment (3)
    bp(3,96,14,'Positive'),    bp(3,58,8,'Neutral'),
    // IAB (4)
    bp(4,95,14,'Food & Drink'),bp(4,82,12,'Lifestyle'),   bp(4,74,10,'Health'),     bp(4,61,8,'Home & Garden'),
    // Brand Safety (5)
    bp(5,98,14,'Safe'),        bp(5,58,8,'Review'),
  ];
  Highcharts.chart('ms-tax-scatter', {
    chart:{type:'bubble',backgroundColor:'transparent',plotBorderWidth:0,height:null,margin:[16,16,52,44],animation:{duration:400},style:{fontFamily:'inherit'}},
    title:{text:null},legend:{enabled:false},credits:{enabled:false},exporting:{enabled:false},
    xAxis:{
      categories:cats,gridLineWidth:1,gridLineColor:'#f1f5f9',lineWidth:0,tickLength:0,title:{text:null},
      labels:{style:{fontSize:'9px',color:'#64748b'},rotation:-20,y:14},
    },
    yAxis:{
      min:50,max:100,gridLineWidth:1,gridLineColor:'#f1f5f9',
      title:{text:null},
      labels:{
        enabled:true,
        formatter:function(){ return this.value+'%'; },
        style:{fontSize:'9px',color:'#94a3b8'},
      },
      plotLines:[{value:70,color:'#e2e8f0',width:1.5,dashStyle:'ShortDash'}],
    },
    tooltip:{
      useHTML:true,backgroundColor:'#1e293b',borderColor:'#334155',borderRadius:8,style:{color:'#e2e8f0',fontSize:'11px'},
      formatter:function(){
        return '<b style="color:#f8fafc">'+this.point.name+'</b><br/>'
          +'<span style="color:#94a3b8">Category: </span>'+cats[this.x]+'<br/>'
          +'<span style="color:#94a3b8">Relevance: </span><b style="color:'+(this.y>=70?'#4ade80':'#fbbf24')+'">'+this.y+'%</b>';
      }
    },
    plotOptions:{bubble:{minSize:5,maxSize:18,sizeBy:'width',marker:{fillOpacity:0.65,lineWidth:1.5},states:{hover:{halo:{size:3}}},dataLabels:{enabled:false}}},
    series:[{name:'Taxonomy',data:data}]
  });
}

function msTaxTab(tab) {
  _msTaxCurrentTab = tab;
  TX_MODAL_TABS.forEach(function(t) {
    var el = document.getElementById('ms-tax-mtab-' + t.id);
    if (el) el.setAttribute('style', _msTaxTabStyle(t.id === tab));
  });
  var rows = [];
  if (typeof mp2GetMomentTaxonomy === 'function') rows = mp2GetMomentTaxonomy('Family Dinner Time', tab);
  if (!rows || !rows.length) rows = (typeof TX_MOMENT_DATA !== 'undefined' && TX_MOMENT_DATA[tab]) || [];
  rows = rows.slice().sort(function(a, b) { return b.score - a.score; });
  var body = document.getElementById('ms-tax-body');
  if (!body) return;
  body.innerHTML = rows.map(function(r) {
    var label = r.taxonomy + (r.category ? ' > ' + r.category : '');
    var pct   = r.score;
    var hi    = pct >= 70;
    var score = '<span style="font-size:12px;font-weight:700;color:' + (hi ? '#16a34a' : '#d97706') + '">' + pct + '%</span>';
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border)">'
      + '<div style="flex:1;min-width:0;font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + label + '</div>'
      + '<div style="flex-shrink:0">' + score + '</div>'
      + '</div>';
  }).join('');
}

function msSaveSearch(q) {
  var today = new Date();
  var d = today.getDate() + ' ' + ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][today.getMonth()] + ' ' + today.getFullYear();
  MS_PREVIOUS.unshift({ query: q, date: d, channel: 'All Channels', results: MS_MOCK_RESULTS.length, saved: 0 });
  var btn = event.target;
  if (btn) { btn.textContent = 'Saved ✓'; btn.style.color = 'var(--accent)'; btn.style.borderColor = 'var(--accent)'; btn.disabled = true; }
}

// ── Previous Searches ───────────────────────────────────────────────────────

function msPreviousHtml() {
  if (MS_PREVIOUS.length === 0) {
    return UI.cardHeader({ title: 'Previous Searches', subtitle: 'Your recent inventory searches',
      bodyHtml: '<div style="padding:32px 0;text-align:center;color:var(--faint);font-size:13px">No previous searches yet.</div>'
    });
  }

  var cols = [
    { label: 'Search Keyword',      width: '220px' },
    { label: 'Date',                width: '110px' },
    { label: 'Publisher',           width: '130px' },
    { label: 'Content Type',        width: '120px' },
    { label: 'Channel',             width: '130px' },
    { label: 'Episodes Matched',    width: '130px', align: 'right' },
    { label: 'Taxonomies Matched',  width: '140px', align: 'right' },
  ];

  var TD  = 'padding:11px 16px;font-size:12px;color:var(--text);border-bottom:1px solid var(--border)';
  var TDm = 'padding:11px 16px;font-size:12px;color:var(--muted);border-bottom:1px solid var(--border)';
  var TDn = 'padding:11px 16px;font-size:12px;font-weight:600;color:var(--text);border-bottom:1px solid var(--border);text-align:right';

  var rows = MS_PREVIOUS.map(function(s, i) {
    var last = i === MS_PREVIOUS.length - 1;
    var fix  = last ? ';border-bottom:none' : '';
    return '<tr style="cursor:pointer;transition:background .12s" '
      + 'onclick="msReopenSearch(\'' + s.query.replace(/'/g, '') + '\')" '
      + 'onmouseover="this.style.background=\'var(--hover)\'" '
      + 'onmouseout="this.style.background=\'\'">'
      + '<td style="' + TD  + fix + ';font-weight:500">' + _msE(s.query)     + '</td>'
      + '<td style="' + TDm + fix + '">'                  + _msE(s.date)      + '</td>'
      + '<td style="' + TDm + fix + '">'                  + _msE(s.publisher) + '</td>'
      + '<td style="' + TDm + fix + '">'                  + _msE(s.type)      + '</td>'
      + '<td style="' + TDm + fix + '">'                  + _msE(s.channel)   + '</td>'
      + '<td style="' + TDn + fix + '">'                  + s.episodes        + '</td>'
      + '<td style="' + TDn + fix + '">'                  + s.taxonomies      + '</td>'
      + '</tr>';
  }).join('');

  var tableHtml = UI.tableScroll(cols, rows, 'ms-prev-tbody', 0, null, { inCard: true });

  return UI.cardHeader({
    title: 'Previous Searches',
    subtitle: MS_PREVIOUS.length + ' recent searches',
    padding: '0',
    bodyHtml: tableHtml,
  });
}

function msReopenSearch(q) {
  msTab = 'new-search';
  setPage('inventory-explorer', 'Inventory Explorer', true);
  setTimeout(function() {
    var input = document.getElementById('ms-query');
    if (input) { input.value = q; msRunSearch(); }
  }, 50);
}

// ── Episode Detail Modal ──────────────────────────────────────────────────────

var _msEpCurrentTab = 'objects';

function msOpenEpisodeModal(idx) {
  var r = MS_TABLE_DATA[idx];
  if (!r) return;
  var episode = r.episode;
  var series  = r.series;
  if (document.getElementById('ms-ep-modal')) return;
  if (typeof mp2InjectRefineStyles === 'function') mp2InjectRefineStyles();
  _msEpCurrentTab = 'objects';

  var tabsHtml = TX_MODAL_TABS.map(function(t) {
    return '<div class="tx-mtab' + (t.id === 'objects' ? ' tx-mtab--act' : '') + '" '
      + 'id="ms-ep-mtab-' + t.id + '" onclick="msEpTab(\'' + t.id + '\')">' + t.label + '</div>';
  }).join('');

  var overlay = document.createElement('div');
  overlay.id = 'ms-ep-modal';
  overlay.className = 'tx-modal-overlay';
  overlay.innerHTML =
    '<div class="tx-modal" onclick="event.stopPropagation()" style="width:860px;max-width:calc(100vw - 32px)">'
    + '<div class="tx-modal-header">'
    +   '<div>'
    +     '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:3px">Episode Detail</div>'
    +     '<div class="tx-modal-title">' + _msE(episode) + '</div>'
    +     (series ? '<div style="font-size:12px;color:var(--muted);margin-top:2px">' + _msE(series) + '</div>' : '')
    +   '</div>'
    +   '<button class="tx-modal-close" onclick="msCloseEpisodeModal()">'
    +     '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;height:480px;overflow:hidden;border-bottom:1px solid var(--border)">'
    +   '<div class="tx-mtabs-nav">' + tabsHtml + '</div>'
    +   '<div style="display:flex;flex:1;min-height:0;overflow:hidden">'
    +     '<div style="width:340px;flex-shrink:0;border-right:1px solid var(--border);height:100%;display:flex;flex-direction:column">'
    +       '<div id="ms-ep-scatter" style="width:100%;flex:1;min-height:0"></div>'
    +     '</div>'
    +     '<div style="flex:1;overflow-y:auto;min-height:0" id="ms-ep-body"></div>'
    +   '</div>'
    + '</div>'
    + '</div>';

  overlay.addEventListener('click', msCloseEpisodeModal);
  document.body.appendChild(overlay);
  setTimeout(function() {
    overlay.classList.add('tx-modal-overlay--in');
    msEpTab('objects');
    msEpInitScatter(episode);
  }, 10);
}

function msCloseEpisodeModal() {
  var modal = document.getElementById('ms-ep-modal');
  if (!modal) return;
  modal.classList.remove('tx-modal-overlay--in');
  setTimeout(function() { if (modal.parentNode) modal.parentNode.removeChild(modal); }, 200);
}

function msEpInitScatter(name) {
  if (typeof Highcharts === 'undefined') return;
  var container = document.getElementById('ms-ep-scatter');
  if (!container) return;
  var labels = typeof MP2_REFINE_MOMENT_LABELS !== 'undefined'
    ? MP2_REFINE_MOMENT_LABELS
    : ['Grocery Haul','Family Dinner','Healthy Eating','Fresh Produce','Meal Prep','Weekend BBQ','Snack Time','Baking & Sweets','Beverages','Quick & Easy'];
  var nm = name.toLowerCase();
  var selIdx = 0;
  for (var i = 0; i < labels.length; i++) {
    if (labels[i].toLowerCase().split(' ').some(function(w) { return nm.indexOf(w) !== -1; })) { selIdx = i; break; }
  }
  function bp(x,y,z,n) {
    var g = y >= 80;
    return {x:x,y:y,z:z,name:n,color:g?'rgba(34,197,94,0.55)':'rgba(234,179,8,0.55)',marker:{lineColor:g?'#16a34a':'#ca8a04',lineWidth:1.5}};
  }
  var data = [
    bp(0,94,14,'Grocery & Supermarket'),bp(0,88,12,'Food & Drink'),     bp(0,82,11,'Family Meals'),
    bp(1,91,14,'Cooking'),             bp(1,86,13,'Food & Drink'),       bp(1,78,11,'Healthy Living'),
    bp(2,95,14,'Healthy Eating'),      bp(2,90,13,'Grocery'),            bp(2,83,12,'Nutrition'),bp(2,74,10,'Fitness'),
    bp(3,93,14,'Grocery'),             bp(3,87,13,'Produce'),            bp(3,81,12,'Organic Food'),
    bp(4,89,13,'Cooking'),             bp(4,84,12,'Meal Planning'),      bp(4,76,11,'Food & Drink'),
    bp(5,85,13,'Outdoor Dining'),      bp(5,79,11,'Grilling'),           bp(5,68,10,'Summer Food'),
    bp(6,80,12,'Snacks'),              bp(6,72,10,'Beverages'),          bp(6,65,9,'Convenience Food'),
    bp(7,88,13,'Baking'),              bp(7,82,12,'Desserts'),           bp(7,70,10,'Cooking'),
    bp(8,92,14,'Beverages'),           bp(8,86,13,'Grocery'),            bp(8,78,11,'Healthy Drinks'),
    bp(9,90,14,'Cooking'),             bp(9,83,12,'Food & Drink'),       bp(9,73,10,'Quick Meals')
  ];
  Highcharts.chart('ms-ep-scatter', {
    chart:{type:'bubble',backgroundColor:'transparent',plotBorderWidth:0,height:null,margin:[10,12,72,12],animation:{duration:400},style:{fontFamily:'inherit'}},
    title:{text:null},legend:{enabled:false},credits:{enabled:false},exporting:{enabled:false},
    xAxis:{
      categories:labels,gridLineWidth:1,gridLineColor:'#f1f5f9',lineWidth:0,tickLength:0,title:{text:null},
      labels:{style:{fontSize:'8px',color:'#64748b'},rotation:-45,y:12},
      plotBands:[{from:selIdx-.5,to:selIdx+.5,color:'rgba(237,0,94,.05)'}]
    },
    yAxis:{min:55,max:100,gridLineWidth:1,gridLineColor:'#f1f5f9',title:{text:null},labels:{enabled:false}},
    tooltip:{
      useHTML:true,backgroundColor:'#1e293b',borderColor:'#334155',borderRadius:8,style:{color:'#e2e8f0',fontSize:'11px'},
      formatter:function(){
        return '<b style="color:#f8fafc">'+this.point.name+'</b><br/>'
          +'<span style="color:#94a3b8">Moment: </span>'+labels[this.x]+'<br/>'
          +'<span style="color:#94a3b8">Relevance: </span><b style="color:'+(this.y>=80?'#4ade80':'#fbbf24')+'">'+(this.y>=80?'High':'Standard')+'</b>';
      }
    },
    plotOptions:{bubble:{minSize:4,maxSize:16,sizeBy:'width',marker:{fillOpacity:0.6,lineWidth:1.5},states:{hover:{halo:{size:3}}},dataLabels:{enabled:false}}},
    series:[{name:'Taxonomy',data:data}]
  });
}

function msEpTab(tab) {
  _msEpCurrentTab = tab;
  TX_MODAL_TABS.forEach(function(t) {
    var el = document.getElementById('ms-ep-mtab-' + t.id);
    if (el) el.className = 'tx-mtab' + (t.id === tab ? ' tx-mtab--act' : '');
  });
  // Use MP2 taxonomy data if available, otherwise fall back to TX_MOMENT_DATA
  var rows = [];
  if (typeof mp2GetMomentTaxonomy === 'function') {
    rows = mp2GetMomentTaxonomy('Family Dinner Time', tab);
  }
  if (!rows || !rows.length) rows = (typeof TX_MOMENT_DATA !== 'undefined' && TX_MOMENT_DATA[tab]) || [];
  rows = rows.slice().sort(function(a, b) { return b.score - a.score; });
  var body = document.getElementById('ms-ep-body');
  if (!body) return;
  body.innerHTML = rows.map(function(r) {
    var label = r.taxonomy + (r.category ? ' > ' + r.category : '');
    var badge = r.score >= 70
      ? '<span style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700">High Match</span>'
      : '<span style="background:#fffbeb;border:1px solid #fde68a;color:#d97706;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700">Standard Match</span>';
    return '<div class="mp2-ref-row">'
      + '<div style="flex:1;min-width:0">'
      +   '<div style="font-size:12px;font-weight:500;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + label + '</div>'
      + '</div>'
      + '<div style="flex-shrink:0">' + badge + '</div>'
      + '</div>';
  }).join('');
}
