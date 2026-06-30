// creative-studio.js — Kerv Creative Studio

// ── Template Builder video ────────────────────────────────────────────────────
var CS_TEMPLATE_YT_ID = '7IQ1yoN7EsE';

// ── State ────────────────────────────────────────────────────────────────────
var csStep               = 1;
var CS_UPLOADED_ASSETS   = [];
var csCampaignMode       = 'select';   // 'create' | 'select'
var csSelectedCampaign   = null;
var csCampaignName       = '';
var csEditorAssets       = [];
var csBuildSelectedAsset = 0;
var csRcTab              = 0;   // 0 = Ad Types, 1 = Add Template
var _csPendingAssets     = null; // pre-set by external callers before setPage; consumed by renderCreativeStudio

var CS_PRODUCT_CATALOGS = ['Walmart Grocery', 'Walmart Electronics', 'Walmart Home & Garden', 'Back to School Collection'];

// ── CTA Pause config state ────────────────────────────────────────────────────
var csEditorTemplateType  = '';             // 'lbar' | 'ctapause' | ''
var csCtaBadgeText        = 'PAUSE TO SHOP';
var csCtaBadgeColor       = '#0071CE';      // Walmart blue
var csCtaBadgePosition    = 'bottom-right';
var csCtaProductCatalogue = '';
var csCtaBgImage          = '';
var csCtaActiveElement    = 0;             // 1 = badge, 2 = product tiles
var csCtaSelectedProduct  = -1;            // -1 = none, 0-4 = selected product index

// ── Mock CTA products ─────────────────────────────────────────────────────────
var CS_CTA_PRODUCTS = [
  { name:'Product-1', price:'$89',  img:'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=200&fit=crop&q=80', desc:'Professional grade power tool for all your cutting needs. Built for durability and precision.' },
  { name:'Product-2', price:'$75',  img:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&q=80',    desc:'Complete set for any repair or construction job. Ergonomic grip for maximum comfort.' },
  { name:'Product-3', price:'$65',  img:'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop&q=80', desc:'Heavy duty tool for metal and masonry. Powerful motor with variable speed control.' },
  { name:'Product-4', price:'$120', img:'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=200&h=200&fit=crop&sat=-30&q=80', desc:'Cordless driver with long-lasting battery. Compact design, fits in tight spaces.' },
  { name:'Product-5', price:'$45',  img:'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop&sat=-30&q=80',    desc:'Full metric and imperial set. Chrome-vanadium steel for long-lasting performance.' },
];

// ── L-Bar config state ────────────────────────────────────────────────────────
var csLBarBadgeGraphic   = 'standard';    // 'standard' | 'custom'
var csLBarBadgeDir       = 'horizontal';  // 'horizontal' | 'vertical'
var csLBarPlacement      = 'bottom-right';// 'top' | 'bottom-right' | 'bottom-left'
var csLBarBadgeAppear    = '00:05';
var csLBarBadgeDisappear = '00:15';
var csLBarSqAppear       = '00:03';
var csLBarQRLink           = '';
var csLBarCustomBadgeImage = '';
var csLBarCustomBgImage    = '';
var csLBarActiveElement    = 0;  // 1 = badge, 2 = squeeze-in, 3 = qr link

// ── Editor saved-template state ───────────────────────────────────────────────
var csEditorAdTemplateValue  = '';   // currently selected ad template value
var csEditorSelectedSavedTpl = -1;  // index of selected saved template (-1 = none)
var csLeftPanelTab           = 0;   // 0 = Creative Assets, 1 = Brand Guidelines, 2 = Shoppable

// ── Brand Guidelines state ────────────────────────────────────────────────────
var csBrandColors = [
  { id: 'bc1', hex: '#0071CE' },
  { id: 'bc2', hex: '#FFC220' },
];
var csBrandLogoImage    = '';
var _csBrandColorCount  = 2;

// ── Mock library ─────────────────────────────────────────────────────────────
var _CS_THUMBS = [
  'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=640&h=360&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&h=360&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=640&h=360&fit=crop&q=80',
];
var CS_LIBRARY = [];
var csLibCollapsedCampaigns = {};
var BRIEF_LIBRARY = [];

// ── L-Bar config panel ───────────────────────────────────────────────────────
function csAdTemplateSelected(value) {
  csEditorAdTemplateValue = value;
  var el = document.getElementById('cs-template-config');
  if (!el) return;
  var footer = document.getElementById('cs-rc-save-footer');
  if (value === 'CTV - Sync LBAR') {
    csEditorTemplateType = 'lbar';
    csLBarBadgeGraphic = 'standard'; csLBarBadgeDir = '';
    csLBarPlacement = ''; csLBarBadgeAppear = '00:05';
    csLBarBadgeDisappear = '00:15'; csLBarSqAppear = '00:03';
    csLBarQRLink = ''; csLBarCustomBadgeImage = ''; csLBarCustomBgImage = ''; csLBarActiveElement = 1;
    el.innerHTML = _csSyncLBarConfigHtml();
    if (footer) { footer.style.display = 'block'; csLBarUpdateSaveBtn(); }
    csLBarUpdatePlayerOverlay();
  } else if (value === 'CTV - CTA Pause') {
    csEditorTemplateType = 'ctapause';
    csCtaPauseSelected();
  } else {
    csEditorTemplateType = '';
    el.innerHTML = '';
    if (footer) footer.style.display = 'none';
    var ov = document.getElementById('cs-player-overlay');
    if (ov) ov.innerHTML = '';
  }
}

function csLBarRefreshConfig() {
  var el = document.getElementById('cs-template-config');
  if (el) el.innerHTML = _csSyncLBarConfigHtml();
}

function csLBarSetActiveElement(n) {
  csLBarActiveElement = n;
  [1, 2, 3].forEach(function(i) {
    var card = document.getElementById('cs-lbar-card-' + i);
    var body = document.getElementById('cs-lbar-card-' + i + '-body');
    var chev = document.getElementById('cs-lbar-chevron-' + i);
    var active = i === n;
    if (card) card.style.borderColor = active ? '#e11d8f' : 'rgba(255,255,255,.08)';
    if (body) body.style.display = active ? 'block' : 'none';
    if (chev) chev.style.transform = active ? 'rotate(180deg)' : 'rotate(0deg)';
  });
  csLBarUpdatePlayerOverlay();
  csLBarUpdateSaveBtn();
}

function csLBarUpdateSaveBtn() {
  var btn = document.getElementById('cs-rc-save-btn');
  if (!btn) return;
  var disabled = csEditorTemplateType === 'lbar' ? !csLBarQRLink.trim() : false;
  btn.style.opacity       = disabled ? '0.35' : '1';
  btn.style.cursor        = disabled ? 'not-allowed' : 'pointer';
  btn.style.borderColor   = disabled ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.25)';
  btn.style.pointerEvents = disabled ? 'none' : 'auto';
}

// ── Mock QR code SVG ─────────────────────────────────────────────────────────
function _csMockQR(size) {
  var s = size || 44;
  var c = '#000'; var w = 'white';
  return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 40 40" style="flex-shrink:0;border-radius:2px">'
    + '<rect width="40" height="40" fill="' + w + '"/>'
    // finder TL
    + '<rect x="1" y="1" width="12" height="12" rx="1.5" fill="' + c + '"/>'
    + '<rect x="3" y="3" width="8" height="8" rx=".8" fill="' + w + '"/>'
    + '<rect x="5" y="5" width="4" height="4" fill="' + c + '"/>'
    // finder TR
    + '<rect x="27" y="1" width="12" height="12" rx="1.5" fill="' + c + '"/>'
    + '<rect x="29" y="3" width="8" height="8" rx=".8" fill="' + w + '"/>'
    + '<rect x="31" y="5" width="4" height="4" fill="' + c + '"/>'
    // finder BL
    + '<rect x="1" y="27" width="12" height="12" rx="1.5" fill="' + c + '"/>'
    + '<rect x="3" y="29" width="8" height="8" rx=".8" fill="' + w + '"/>'
    + '<rect x="5" y="31" width="4" height="4" fill="' + c + '"/>'
    // data dots
    + '<rect x="15" y="1" width="2" height="2" fill="' + c + '"/><rect x="19" y="1" width="2" height="2" fill="' + c + '"/><rect x="23" y="3" width="2" height="2" fill="' + c + '"/>'
    + '<rect x="15" y="5" width="2" height="4" fill="' + c + '"/><rect x="21" y="5" width="2" height="2" fill="' + c + '"/>'
    + '<rect x="17" y="9" width="4" height="2" fill="' + c + '"/><rect x="23" y="7" width="2" height="4" fill="' + c + '"/>'
    + '<rect x="1" y="15" width="2" height="4" fill="' + c + '"/><rect x="5" y="15" width="4" height="2" fill="' + c + '"/>'
    + '<rect x="3" y="19" width="2" height="4" fill="' + c + '"/><rect x="7" y="21" width="4" height="2" fill="' + c + '"/>'
    + '<rect x="1" y="25" width="4" height="2" fill="' + c + '"/><rect x="7" y="23" width="2" height="2" fill="' + c + '"/>'
    + '<rect x="15" y="15" width="4" height="4" fill="' + c + '"/><rect x="21" y="15" width="2" height="2" fill="' + c + '"/>'
    + '<rect x="19" y="19" width="2" height="4" fill="' + c + '"/><rect x="23" y="17" width="2" height="4" fill="' + c + '"/>'
    + '<rect x="15" y="23" width="4" height="2" fill="' + c + '"/><rect x="21" y="23" width="4" height="2" fill="' + c + '"/>'
    + '<rect x="27" y="15" width="2" height="6" fill="' + c + '"/><rect x="31" y="15" width="2" height="2" fill="' + c + '"/>'
    + '<rect x="35" y="15" width="4" height="2" fill="' + c + '"/><rect x="29" y="21" width="6" height="2" fill="' + c + '"/>'
    + '<rect x="37" y="19" width="2" height="4" fill="' + c + '"/><rect x="27" y="25" width="4" height="2" fill="' + c + '"/>'
    + '<rect x="33" y="23" width="6" height="2" fill="' + c + '"/><rect x="31" y="27" width="2" height="4" fill="' + c + '"/>'
    + '<rect x="35" y="27" width="4" height="2" fill="' + c + '"/><rect x="27" y="31" width="6" height="2" fill="' + c + '"/>'
    + '<rect x="35" y="31" width="4" height="8" fill="' + c + '"/>'
    + '</svg>';
}

// ── Player overlay (badge preview) ───────────────────────────────────────────
function csLBarUpdatePlayerOverlay() {
  var overlay = document.getElementById('cs-player-overlay');
  if (!overlay) return;
  overlay.innerHTML = _csPlayerOverlayHtml();
}

function _csPlayerOverlayHtml() {
  if (csEditorTemplateType === 'ctapause') return _csCtaPlayerOverlayHtml();
  if (csLBarActiveElement === 2) return _csPlayerSqueezeHtml();
  if (csLBarActiveElement === 1) return _csPlayerBadgeHtml();
  return '';
}

function _csPlayerSqueezeHtml() {
  var BG    = '#153d4a';   // L-bar teal
  var rW    = '27%';       // right strip width
  var bH    = '22%';       // bottom strip height
  var pTop  = '5%';        // top padding (same color as L-bar, above the video)
  var pLeft = '3%';        // left padding (same color as L-bar, left of the video)

  var hasImg = !!csLBarCustomBgImage;

  // Image uploaded → transparent overlay (PNG alpha reveals video underneath)
  if (hasImg) {
    return '<div style="position:absolute;inset:0;pointer-events:none">'
      + '<img src="' + csLBarCustomBgImage + '" style="width:100%;height:100%;display:block">'
      + '</div>';
  }

  // Placeholder L-bar shape
  var rightStrip = '<div style="position:absolute;top:0;right:0;width:' + rW + ';bottom:0;background:' + BG + ';display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px">'
    + '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'
    + '<span style="font-size:6px;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:.9px;writing-mode:vertical-rl;transform:rotate(180deg);margin-top:4px">Ad Space</span>'
    + '</div>';

  var bottomStrip = '<div style="position:absolute;bottom:0;left:0;right:0;height:' + bH + ';background:' + BG + ';display:flex;align-items:center;padding:0 calc(' + rW + ' + 3%) 0 4%">'
    + '<span style="font-size:7px;color:rgba(255,255,255,.2);text-transform:uppercase;letter-spacing:.8px">L-Bar · Bottom Band</span>'
    + '</div>';

  var topPad  = '<div style="position:absolute;top:0;left:0;right:' + rW + ';height:' + pTop + ';background:' + BG + '"></div>';
  var leftPad = '<div style="position:absolute;top:0;left:0;width:' + pLeft + ';bottom:' + bH  + ';background:' + BG + '"></div>';

  return '<div style="position:absolute;inset:0;pointer-events:none">'
    + topPad + leftPad + rightStrip + bottomStrip
    + '</div>';
}

function _csPlayerBadgeHtml() {
  var qr = _csMockQR(44);
  var hasImg = csLBarCustomBadgeImage && csLBarBadgeGraphic === 'custom';
  var badge = '';
  if (csLBarBadgeDir === 'horizontal') {
    var rightPanel = hasImg
      ? '<div style="width:100px;overflow:hidden;flex-shrink:0"><img src="' + csLBarCustomBadgeImage + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>'
      : '<div style="padding:8px 14px;display:flex;flex-direction:column;justify-content:center">'
        + '<div style="font-size:10px;font-weight:700;color:#fff;letter-spacing:.2px">Scan to shop</div>'
        + '<div style="font-size:9px;color:rgba(255,255,255,.45);margin-top:2px">walmart.com</div>'
        + '</div>';
    badge = '<div style="display:flex;align-items:stretch;background:rgba(8,8,8,.88);border-radius:7px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.7)">'
      + '<div style="padding:7px;display:flex;align-items:center">' + qr + '</div>'
      + '<div style="width:1px;background:rgba(255,255,255,.12);flex-shrink:0"></div>'
      + rightPanel
      + '</div>';
  } else {
    var topPanel = hasImg
      ? '<div style="width:58px;height:40px;overflow:hidden;border-radius:4px;flex-shrink:0"><img src="' + csLBarCustomBadgeImage + '" style="width:100%;height:100%;object-fit:cover;display:block"></div>'
      : '';
    badge = '<div style="display:flex;flex-direction:column;align-items:center;background:rgba(8,8,8,.88);border-radius:7px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.7);padding:8px 10px;gap:6px">'
      + topPanel
      + qr
      + '<div style="font-size:8px;font-weight:700;color:#fff;text-align:center;line-height:1.35;letter-spacing:.2px">Scan<br>to shop</div>'
      + '</div>';
  }
  var pos = '';
  if      (csLBarPlacement === 'top')          pos = 'top:6%;left:50%;transform:translateX(-50%)';
  else if (csLBarPlacement === 'bottom-right') pos = 'bottom:8%;right:3%';
  else                                          pos = 'bottom:8%;left:3%';
  return '<div style="position:absolute;' + pos + ';z-index:10;pointer-events:none;animation:cs-fadein .2s ease">' + badge + '</div>'
    + '<style>@keyframes cs-fadein{from{opacity:0;transform:' + (csLBarPlacement==='top'?'translateX(-50%) translateY(-6px)':'translateY(6px)') + '}to{opacity:1;transform:' + (csLBarPlacement==='top'?'translateX(-50%) translateY(0)':'translateY(0)') + '}}</style>';
}

// ── Dispatch for dark select changes ─────────────────────────────────────────
function csOnDarkSelectChange(id, value) {
  if (id === 'cs-ds-adtemplate')     { csAdTemplateSelected(value); return; }
  if (id === 'cs-ds-lbar-dir')       {
    csLBarBadgeDir = (value === 'Vertical') ? 'vertical' : 'horizontal';
    csLBarUpdatePlayerOverlay(); return;
  }
  if (id === 'cs-ds-lbar-placement') {
    csLBarPlacement = value === 'Bottom Right' ? 'bottom-right' : value === 'Bottom Left' ? 'bottom-left' : 'top';
    csLBarUpdatePlayerOverlay(); return;
  }
  if (id === 'cs-ds-lbar-graphic') {
    csLBarBadgeGraphic = value.toLowerCase();
    var u = document.getElementById('cs-lbar-custom-upload-wrap');
    if (u) u.style.display = value === 'Custom' ? 'block' : 'none';
    return;
  }
  if (id === 'cs-ds-cta-position') {
    csCtaBadgePosition = value === 'Bottom Left' ? 'bottom-left' : 'bottom-right';
    csCtaUpdatePlayerOverlay(); return;
  }
  if (id === 'cs-ds-cta-catalogue') {
    csCtaProductCatalogue = value; csCtaUpdateSaveBtn(); return;
  }
}

function _csLBarUploadArea(label, id, uploadType) {
  // uploadType: 'badge' | 'bg' | 'ctabg' | falsy (simulate)
  var upIcon = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#484f58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
  var isReal = uploadType === 'badge' || uploadType === 'bg' || uploadType === 'ctabg' || uploadType === 'brandlogo';
  var handlerFn = uploadType === 'bg' ? 'csLBarHandleBgUpload' : uploadType === 'ctabg' ? 'csCtaHandleBgUpload' : uploadType === 'brandlogo' ? 'csBrandHandleLogoUpload' : 'csLBarHandleImageUpload';
  var clickFn = isReal
    ? 'document.getElementById(\'' + id + '-file\').click()'
    : 'csLBarSimulateUpload(\'' + id + '\')';
  var fileInput = isReal
    ? '<input id="' + id + '-file" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="' + handlerFn + '(this)">'
    : '';
  return '<div id="' + id + '" onclick="' + clickFn + '" style="width:100%;height:34px;border:1.5px dashed rgba(255,255,255,.1);border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;margin-bottom:10px;box-sizing:border-box;transition:border-color .12s" onmouseover="this.style.borderColor=\'rgba(225,29,143,.4)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.1)\'">'
    + upIcon
    + '<span style="font-size:10px;color:#484f58">' + label + '</span>'
    + fileInput
    + '</div>';
}

function csLBarHandleImageUpload(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    csLBarCustomBadgeImage = e.target.result;
    // Update upload area to show success
    var wrap = document.getElementById('cs-lbar-badge-upload');
    if (wrap) {
      wrap.style.borderColor = '#e11d8f';
      wrap.style.borderStyle = 'solid';
      wrap.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e11d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        + '<span style="font-size:10px;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">' + file.name + '</span>'
        + '<input id="cs-lbar-badge-upload-file" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="csLBarHandleImageUpload(this)">';
      wrap.onclick = function() { document.getElementById('cs-lbar-badge-upload-file').click(); };
    }
    csLBarUpdatePlayerOverlay();
  };
  reader.readAsDataURL(file);
}

function csLBarHandleBgUpload(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    csLBarCustomBgImage = e.target.result;
    var wrap = document.getElementById('cs-lbar-bg-upload');
    if (wrap) {
      wrap.style.borderColor = '#e11d8f';
      wrap.style.borderStyle = 'solid';
      wrap.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e11d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        + '<span style="font-size:10px;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">' + file.name + '</span>'
        + '<input id="cs-lbar-bg-upload-file" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="csLBarHandleBgUpload(this)">';
      wrap.onclick = function() { document.getElementById('cs-lbar-bg-upload-file').click(); };
    }
    csLBarUpdatePlayerOverlay();
  };
  reader.readAsDataURL(file);
}

function csLBarSimulateUpload(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '#e11d8f';
  el.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e11d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style="font-size:10px;color:#c9d1d9">File uploaded</span>';
}

function csLBarUpdateGenBtn() {
  var btn = document.getElementById('cs-lbar-gen-btn');
  if (!btn) return;
  var can = csLBarQRLink.trim().length > 0;
  btn.style.background = can ? 'linear-gradient(135deg,#e11d8f,#f43f5e)' : 'rgba(255,255,255,.06)';
  btn.style.color = can ? '#fff' : '#484f58';
  btn.style.cursor = can ? 'pointer' : 'not-allowed';
}

function csLBarGenerate() {
  if (!csLBarQRLink.trim()) return;
  var btn = document.getElementById('cs-lbar-gen-btn');
  if (btn) {
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Template Generated!';
    btn.style.background = 'linear-gradient(135deg,#16a34a,#22c55e)';
    btn.style.cursor = 'default';
  }
}

function _csSyncLBarConfigHtml() {
  var SLBL = 'display:block;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#484f58;margin-bottom:6px;margin-top:10px';
  var TINP = 'height:28px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 8px;font-size:11px;font-family:inherit;color:#c9d1d9;outline:none;box-sizing:border-box;transition:border-color .12s;width:100%';
  var can  = csLBarQRLink.trim().length > 0;

  // Timeline pair
  function tlRow(lA, vA, onA, lB, vB, onB) {
    return '<div style="display:flex;gap:8px;margin-bottom:10px">'
      + '<div style="flex:1"><label style="' + SLBL + ';margin-top:6px">' + lA + '</label><input type="text" value="' + vA + '" oninput="' + onA + '" placeholder="00:00" style="' + TINP + '" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'"></div>'
      + '<div style="flex:1"><label style="' + SLBL + ';margin-top:6px">' + lB + '</label><input type="text" value="' + vB + '" oninput="' + onB + '" placeholder="00:00" style="' + TINP + '" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'"></div>'
      + '</div>';
  }

  var CARD_BASE = 'background:#0d1117;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .15s;border:1px solid ';
  var CARD_HDR  = 'font-size:9px;font-weight:700;color:#8b949e;letter-spacing:.8px;text-transform:uppercase';
  var CHEVRON   = function(n) {
    var rot = csLBarActiveElement === n ? 'rotate(180deg)' : 'rotate(0deg)';
    return '<svg id="cs-lbar-chevron-' + n + '" width="10" height="10" viewBox="0 0 12 12" fill="none" style="flex-shrink:0;transition:transform .2s;transform:' + rot + '"><path d="M2 4l4 4 4-4" stroke="#484f58" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  return ''
    // Section title
    + '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:10px">Customize Sync L-Bar Elements</div>'
    // 1. BADGE WITH QR CODE
    + '<div id="cs-lbar-card-1" onclick="csLBarSetActiveElement(1)" style="' + CARD_BASE + (csLBarActiveElement===1?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between">'
    +     '<div style="' + CARD_HDR + '">1. Badge with QR Code</div>'
    +     CHEVRON(1)
    +   '</div>'
    +   '<div id="cs-lbar-card-1-body" onclick="event.stopPropagation()" style="display:' + (csLBarActiveElement===1?'block':'none') + ';margin-top:12px">'
    +     _csDarkSelect('cs-ds-lbar-graphic',   'Graphic',    ['Standard', 'Custom'],                 '— select —')
    +     '<div id="cs-lbar-custom-upload-wrap" style="display:' + (csLBarBadgeGraphic === 'custom' ? 'block' : 'none') + ';margin-top:-4px;margin-bottom:12px">'
    +       _csLBarUploadArea('Upload JPG / PNG', 'cs-lbar-badge-upload', 'badge')
    +     '</div>'
    +     _csDarkSelect('cs-ds-lbar-dir',       'Direction',  ['Horizontal', 'Vertical'],             '— select —')
    +     _csDarkSelect('cs-ds-lbar-placement',  'Placement',  ['Top', 'Bottom Right', 'Bottom Left'], '— select —')
    +     '<label style="' + SLBL + '">Timeline</label>'
    +     tlRow('Appears at', csLBarBadgeAppear, 'csLBarBadgeAppear=this.value', 'Disappears at', csLBarBadgeDisappear, 'csLBarBadgeDisappear=this.value')
    +   '</div>'
    + '</div>'

    // 2. L-BAR SQUEEZE IN
    + '<div id="cs-lbar-card-2" onclick="csLBarSetActiveElement(2)" style="' + CARD_BASE + (csLBarActiveElement===2?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between">'
    +     '<div style="' + CARD_HDR + '">2. L-Bar Squeeze In</div>'
    +     CHEVRON(2)
    +   '</div>'
    +   '<div id="cs-lbar-card-2-body" onclick="event.stopPropagation()" style="display:' + (csLBarActiveElement===2?'block':'none') + ';margin-top:12px">'
    +     '<label style="' + SLBL + ';margin-top:0">Background Image</label>'
    +     _csLBarUploadArea('Upload JPG / PNG', 'cs-lbar-bg-upload', 'bg')
    +     '<label style="' + SLBL + '">Appears at</label>'
    +     '<input type="text" value="' + csLBarSqAppear + '" oninput="csLBarSqAppear=this.value" placeholder="00:00" style="' + TINP + '" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
    +   '</div>'
    + '</div>'

    // 3. QR CODE LINK
    + '<div id="cs-lbar-card-3" onclick="csLBarSetActiveElement(3)" style="' + CARD_BASE + (csLBarActiveElement===3?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between">'
    +     '<div style="' + CARD_HDR + '">3. QR Code Link</div>'
    +     CHEVRON(3)
    +   '</div>'
    +   '<div id="cs-lbar-card-3-body" onclick="event.stopPropagation()" style="display:' + (csLBarActiveElement===3?'block':'none') + ';margin-top:12px">'
    +     '<label style="' + SLBL + ';margin-top:0">Destination URL</label>'
    +     '<input type="url" value="' + csLBarQRLink + '" oninput="csLBarQRLink=this.value;csLBarUpdateSaveBtn()" placeholder="https://..." style="' + TINP + '" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
    +   '</div>'
    + '</div>';
}

// ── Dark custom select (editor) ───────────────────────────────────────────────
function _csDarkSelect(id, label, opts, placeholder) {
  var CHV = '<svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#484f58" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BTN = 'width:100%;height:30px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border:1px solid rgba(255,255,255,.1);border-radius:6px;background:#21262d;font-size:11px;font-family:inherit;cursor:pointer;box-sizing:border-box;transition:border-color .12s;text-align:left';
  return '<div style="margin-bottom:12px">'
    + '<label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:5px">' + label + '</label>'
    + '<div style="position:relative">'
    +   '<button id="' + id + '-btn" onclick="csDarkSelectToggle(\'' + id + '\')" style="' + BTN + '">'
    +     '<span id="' + id + '-lbl" style="color:#6e7681">' + placeholder + '</span>'
    +     CHV
    +   '</button>'
    +   '<div id="' + id + '-panel" style="display:none;position:fixed;z-index:10000;background:#21262d;border:1px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.6);padding:4px">'
    +   opts.map(function(o) {
          return '<div onclick="csDarkSelectPick(\'' + id + '\',\'' + o.replace(/'/g,"\\'") + '\')" style="padding:7px 10px;font-size:11px;color:#c9d1d9;cursor:pointer;border-radius:5px;white-space:nowrap;transition:background .1s" onmouseover="this.style.background=\'rgba(255,255,255,.08)\'" onmouseout="this.style.background=\'none\'">' + o + '</div>';
        }).join('')
    +   '</div>'
    + '</div></div>';
}
function csDarkSelectToggle(id) {
  var panel = document.getElementById(id + '-panel');
  var btn   = document.getElementById(id + '-btn');
  if (!panel || !btn) return;
  var isOpen = panel.style.display !== 'none';
  // close all
  document.querySelectorAll('[id$="-panel"]').forEach(function(p) {
    if (/^cs-ds-/.test(p.id)) p.style.display = 'none';
  });
  if (!isOpen) {
    var r = btn.getBoundingClientRect();
    panel.style.top    = (r.bottom + 4) + 'px';
    panel.style.left   = r.left + 'px';
    panel.style.width  = r.width + 'px';
    panel.style.display = 'block';
  }
}
function csDarkSelectPick(id, value) {
  var lbl = document.getElementById(id + '-lbl');
  if (lbl) { lbl.textContent = value; lbl.style.color = '#c9d1d9'; }
  var panel = document.getElementById(id + '-panel');
  if (panel) panel.style.display = 'none';
  csOnDarkSelectChange(id, value);
}
// Close dark selects + color pickers on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('[id$="-btn"]') && !e.target.closest('[id$="-panel"]')) {
    document.querySelectorAll('[id^="cs-ds-"][id$="-panel"]').forEach(function(p) { p.style.display = 'none'; });
    document.querySelectorAll('[id^="cs-cp-"][id$="-panel"]').forEach(function(p) { p.style.display = 'none'; });
  }
});

// ── Dark color picker ─────────────────────────────────────────────────────────
function hexToRgbCS(hex) {
  var h = (hex || '#000000').replace('#', '');
  if (h.length !== 6) return { r:0, g:0, b:0 };
  return { r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16) };
}
function rgbToHexCS(r,g,b) {
  return '#' + [r,g,b].map(function(x){ return ('0'+Math.max(0,Math.min(255,x|0)).toString(16)).slice(-2); }).join('');
}

function _csDarkColorPicker(id, label, value) {
  var PRESETS = ['#0071CE','#003087','#FFC220','#004F9A','#1d4ed8','#000000','#ffffff','#e11d8f'];
  var rgb = hexToRgbCS(value);
  return '<div style="margin-bottom:12px">'
    + '<label style="display:block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:5px">' + label + '</label>'
    + '<div style="position:relative">'
    +   '<button id="' + id + '-btn" onclick="csDarkColorPickerToggle(\'' + id + '\')" style="width:100%;height:30px;border-radius:6px;background:' + value + ';cursor:pointer;border:1px solid rgba(255,255,255,.18);display:block;transition:opacity .12s" onmouseover="this.style.opacity=\'.85\'" onmouseout="this.style.opacity=\'1\'"></button>'
    +   '<div id="' + id + '-panel" style="display:none;position:fixed;z-index:10000;background:#21262d;border:1px solid rgba(255,255,255,.12);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.7);padding:12px;width:196px">'
    +     '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-bottom:10px">'
    +     PRESETS.map(function(c) {
            var sel = c.toLowerCase() === value.toLowerCase();
            return '<div onclick="csDarkColorPickerSelect(\'' + id + '\',\'' + c + '\')" style="height:20px;border-radius:4px;background:' + c + ';cursor:pointer;border:2px solid ' + (sel?'#fff':'transparent') + ';box-sizing:border-box;transition:transform .1s" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'scale(1)\'"></div>';
          }).join('')
    +     '</div>'
    +     '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">'
    +       '<div id="' + id + '-preview" style="width:24px;height:24px;border-radius:4px;background:' + value + ';flex-shrink:0;border:1px solid rgba(255,255,255,.15)"></div>'
    +       '<input id="' + id + '-hex" type="text" value="' + value + '" oninput="csDarkColorPickerHex(\'' + id + '\',this.value)" placeholder="#000000" style="flex:1;height:24px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 7px;font-size:10px;font-family:monospace;color:#c9d1d9;outline:none" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
    +     '</div>'
    +     '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px">'
    +     [['R',rgb.r],['G',rgb.g],['B',rgb.b]].map(function(ch) {
            return '<div><label style="font-size:8px;color:#484f58;display:block;margin-bottom:2px">' + ch[0] + '</label>'
              + '<input type="number" min="0" max="255" value="' + ch[1] + '" id="' + id + '-rgb-' + ch[0].toLowerCase() + '" oninput="csDarkColorPickerRgb(\'' + id + '\')" style="width:100%;height:24px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 5px;font-size:10px;color:#c9d1d9;outline:none;box-sizing:border-box;font-family:inherit"></div>';
          }).join('')
    +     '</div>'
    +   '</div>'
    + '</div></div>';
}
function csDarkColorPickerToggle(id) {
  var panel = document.getElementById(id + '-panel');
  var btn   = document.getElementById(id + '-btn');
  if (!panel || !btn) return;
  var isOpen = panel.style.display !== 'none';
  if (isOpen) { panel.style.display = 'none'; return; }
  var r = btn.getBoundingClientRect();
  panel.style.top  = (r.bottom + 4) + 'px';
  panel.style.left = r.left + 'px';
  panel.style.display = 'block';
}
function _cpApply(id, hex) {
  var btn = document.getElementById(id + '-btn');
  var prev = document.getElementById(id + '-preview');
  var hexI = document.getElementById(id + '-hex');
  if (btn)  btn.style.background  = hex;
  if (prev) prev.style.background = hex;
  if (hexI) hexI.value = hex;
  var rgb = hexToRgbCS(hex);
  var ri = document.getElementById(id + '-rgb-r');
  var gi = document.getElementById(id + '-rgb-g');
  var bi = document.getElementById(id + '-rgb-b');
  if (ri) ri.value = rgb.r;
  if (gi) gi.value = rgb.g;
  if (bi) bi.value = rgb.b;
  csOnColorPickerChange(id, hex);
}
function csDarkColorPickerSelect(id, color) {
  _cpApply(id, color);
  var panel = document.getElementById(id + '-panel');
  if (panel) panel.style.display = 'none';
}
function csDarkColorPickerHex(id, value) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(value)) return;
  _cpApply(id, value);
}
function csDarkColorPickerRgb(id) {
  var r = parseInt((document.getElementById(id+'-rgb-r')||{}).value)||0;
  var g = parseInt((document.getElementById(id+'-rgb-g')||{}).value)||0;
  var b = parseInt((document.getElementById(id+'-rgb-b')||{}).value)||0;
  _cpApply(id, rgbToHexCS(r,g,b));
}
function csOnColorPickerChange(id, value) {
  if (id === 'cs-cp-cta-color') { csCtaBadgeColor = value; csCtaUpdatePlayerOverlay(); return; }
  if (id.indexOf('cs-cp-brand-') === 0) {
    var colorId = id.replace('cs-cp-brand-', '');
    var entry = csBrandColors.filter(function(c) { return c.id === colorId; })[0];
    if (entry) entry.hex = value;
  }
}

// ── Asset rename ──────────────────────────────────────────────────────────────
function csEditorRenameAsset() {
  var nameEl = document.getElementById('cs-asset-name');
  if (!nameEl) return;
  var current = nameEl.textContent;
  var input = document.createElement('input');
  input.value = current;
  input.style.cssText = 'background:#21262d;border:1px solid rgba(225,29,143,.5);border-radius:4px;color:#e6edf3;font-size:12px;font-weight:600;font-family:inherit;padding:2px 6px;width:100%;outline:none;box-sizing:border-box';
  nameEl.parentNode.replaceChild(input, nameEl);
  input.focus(); input.select();
  function save() {
    var newName = input.value.trim() || current;
    var asset = csEditorAssets[csBuildSelectedAsset];
    if (asset) asset.name = newName;
    // Save to DB if this is a DB creative (has dbId)
    if (asset && asset.dbId) {
      fetch('/api/creatives-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: asset.dbId, name: newName })
      }).catch(function(e) { console.warn('Failed to save creative name:', e.message); });
    }
    var overlay = document.getElementById('cs-editor-overlay');
    if (overlay) overlay.innerHTML = _csEditorHtml();
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = current; input.blur(); }
  });
}

// ── Editor tooltip (fixed-position, escapes overflow clipping) ────────────────
function csEditorTooltip(btn, text, show) {
  var el = document.getElementById('cs-editor-tip');
  if (!show) { if (el) el.style.opacity = '0'; return; }
  if (!el) {
    el = document.createElement('div');
    el.id = 'cs-editor-tip';
    el.style.cssText = 'position:fixed;z-index:99999;background:#21262d;color:#c9d1d9;font-size:10px;font-weight:500;padding:4px 8px;border-radius:5px;white-space:nowrap;border:1px solid rgba(255,255,255,.1);pointer-events:none;transition:opacity .12s;opacity:0';
    document.body.appendChild(el);
  }
  var r = btn.getBoundingClientRect();
  el.textContent = text;
  el.style.top  = (r.bottom + 6) + 'px';
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.transform = 'translateX(-50%)';
  el.style.opacity = '1';
}

// ── Entry point ───────────────────────────────────────────────────────────────
function renderCreativeStudio() {
  csStep = 1; csCampaignMode = 'select';
  // Consume pending assets pre-set by external callers (e.g. campaign preview eye icon)
  CS_UPLOADED_ASSETS = (_csPendingAssets && _csPendingAssets.length) ? _csPendingAssets : [];
  _csPendingAssets = null;
  csSelectedCampaign = null; csCampaignName = '';
  var tabs = [{id:'new',label:'New Creative'},{id:'library',label:'Creative Library',dividerBefore:true},{id:'brief-library',label:'Brief Library'}];
  setTimeout(function() { csRenderContent('new'); }, 0);
  return UI.pageHeader({ title:'Creative Studio', subtitle:'Build contextual ad creatives from your assets across every format and platform.' })
    + '<div id="cs-tabs" style="margin-bottom:20px">' + UI.tabNav(tabs, 'new', 'csSwitchTab') + '</div>'
    + '<div id="cs-outer" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:0;overflow:hidden"><div id="cs-body"></div></div>';
}

function csSwitchTab(tab) {
  var tabs = [{id:'new',label:'New Creative'},{id:'library',label:'Creative Library',dividerBefore:true},{id:'brief-library',label:'Brief Library'}];
  var el = document.getElementById('cs-tabs');
  if (el) el.innerHTML = UI.tabNav(tabs, tab, 'csSwitchTab');
  csRenderContent(tab);
  var url = tab === 'brief-library' ? '/creative-studio/brief-library' : tab === 'library' ? '/creative-studio/creative-library' : '/creative-studio';
  history.replaceState({ id: 'creative-studio', label: 'Creative Studio' }, '', url);
}

function csRenderContent(tab) {
  var outer = document.getElementById('cs-outer');
  if (outer) outer.style.padding = (tab === 'library' || tab === 'brief-library') ? '0' : '32px';
  if (tab === 'library') { csRenderLibrary(); setTimeout(csLoadLibraryFromDB, 0); return; }
  if (tab === 'brief-library') { csRenderBriefLibrary(); setTimeout(csLoadBriefLibraryFromDB, 0); return; }
  // If assets were pre-loaded by an external caller (e.g. campaign preview), skip reset and go straight to builder
  if (CS_UPLOADED_ASSETS.length) { csBuildTemplates(0); return; }
  csStep = 1; CS_UPLOADED_ASSETS = [];
  csRenderNewCreative();
}

// ── Stepper header — 2 steps ──────────────────────────────────────────────────
function _csStepHdrHtml() {
  var steps = [{n:1,label:'Upload Creatives'},{n:2,label:'Add Campaign'}];
  var html = '<div style="display:flex;align-items:center;padding:16px 24px;border-bottom:1px solid var(--border)">';
  steps.forEach(function(s, i) {
    var done   = csStep > s.n;
    var active = csStep === s.n;
    var bg = (done || active) ? 'var(--accent)' : 'transparent';
    var bd = (done || active) ? 'none' : '1.5px solid var(--border-md)';
    var inner = done
      ? '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<span style="font-size:11px;font-weight:700;color:' + (active ? '#fff' : 'var(--faint)') + '">' + s.n + '</span>';
    var lc = active ? 'var(--text)' : done ? 'var(--accent)' : 'var(--faint)';
    html += '<div style="display:flex;align-items:center;gap:8px">'
      + '<div style="width:24px;height:24px;border-radius:50%;background:' + bg + ';border:' + bd + ';display:flex;align-items:center;justify-content:center;flex-shrink:0">' + inner + '</div>'
      + '<span style="font-size:12px;font-weight:' + (active ? '600' : '400') + ';color:' + lc + ';white-space:nowrap">' + s.label + '</span>'
      + '</div>';
    if (i < 1) html += '<div style="flex:1;height:1px;background:' + (csStep > s.n ? 'var(--accent)' : 'var(--border)') + ';margin:0 12px"></div>';
  });
  return html + '</div>';
}

// ── Stepper nav footer ────────────────────────────────────────────────────────
function _csStepNavHtml() {
  var BACK = 'display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border:1px solid var(--border-md);border-radius:8px;background:none;font-size:12px;font-weight:500;font-family:inherit;color:var(--muted);cursor:pointer';
  var NEXT = 'display:inline-flex;align-items:center;gap:7px;height:34px;padding:0 18px;border:none;border-radius:8px;background:linear-gradient(135deg,#e11d8f,#f43f5e);color:#fff;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;box-shadow:0 3px 10px rgba(225,29,143,.28)';
  var html = '<div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">';
  html += csStep > 1
    ? '<button onclick="csStepNav(-1)" style="' + BACK + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>Back</button>'
    : '<div></div>';
  html += csStep < 2
    ? '<button onclick="csStepNav(1)" style="' + NEXT + '">Next<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>'
    : '<button onclick="csBuildTemplates()" style="' + NEXT + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>Build Templates</button>';
  return html + '</div>';
}

// ── Step navigation ───────────────────────────────────────────────────────────
function csStepNav(dir) {
  csStep = Math.min(2, Math.max(1, csStep + dir));
  var hdr = document.getElementById('cs-step-hdr');
  if (hdr) hdr.innerHTML = _csStepHdrHtml();
  [1, 2].forEach(function(n) {
    var el = document.getElementById('cs-step' + n);
    if (el) el.style.display = csStep === n ? '' : 'none';
  });
  var nav = document.getElementById('cs-step-nav');
  if (nav) nav.innerHTML = _csStepNavHtml();
  // Re-render step content when navigating
  if (csStep === 1) {
    var s1 = document.getElementById('cs-step1');
    if (s1) s1.innerHTML = _csStep2Html();
    _csInitDropzone();
  }
  if (csStep === 2) {
    var s2 = document.getElementById('cs-step2');
    if (s2) s2.innerHTML = _csStep1Html();
  }
}

// Re-render campaign step in place when toggling campaign mode
function csRefreshStep1() {
  var el = document.getElementById('cs-step2');
  if (el) el.innerHTML = _csStep1Html();
}

// ── Build Templates — Video Editor ───────────────────────────────────────────
function csBuildTemplates(selectedIdx, assetId) {
  csEditorAssets = CS_UPLOADED_ASSETS.length > 0 ? CS_UPLOADED_ASSETS : [
    { id:'a1', name:'walmart-ad.mp4',     type:'MP4',
      thumb:'https://img.youtube.com/vi/' + CS_TEMPLATE_YT_ID + '/mqdefault.jpg' },
    { id:'a2', name:'walmart-ad.jpg', type:'JPG',
      thumb:'/Asset%20Demo%20K1/walmart-ad.jpg', src:'/Asset%20Demo%20K1/walmart-ad.jpg' },
  ];
  // If an assetId was passed (e.g. from URL routing), find its index
  if (assetId) {
    var idIdx = csEditorAssets.findIndex(function(a) { return a.id === assetId; });
    if (idIdx >= 0) selectedIdx = idIdx;
  }
  csBuildSelectedAsset = selectedIdx || 0;

  // Full-screen overlay — covers sidebar, topbar, everything
  var existing = document.getElementById('cs-editor-overlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.id = 'cs-editor-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:#0d1117';
  overlay.innerHTML = _csEditorHtml();
  document.body.appendChild(overlay);
  // Fade out the title cover after 4s — video stays visible, only top bar disappears
  setTimeout(function() {
    var cover = document.getElementById('cs-yt-title-cover');
    if (cover) { cover.style.opacity = '0'; setTimeout(function() { if (cover.parentNode) cover.parentNode.removeChild(cover); }, 1000); }
  }, 4000);
  var _selAsset = csEditorAssets[csBuildSelectedAsset] || csEditorAssets[0];
  var _selId = (_selAsset && _selAsset.id) ? _selAsset.id : '';
  history.pushState({ id: 'creative-studio', label: 'Creative Studio', openEditor: true, csAssetId: _selId }, '', '/creative-studio/build-template' + (_selId ? '/' + _selId : ''));
}

function _csEditorHtml() {
  var assets = csEditorAssets;
  var sel    = assets[csBuildSelectedAsset] || assets[0];
  var thumb  = sel ? sel.thumb : '';
  var campLabel = csCampaignName || (csSelectedCampaign ? csSelectedCampaign.name : (APP_CAMPAIGNS[0] ? APP_CAMPAIGNS[0].name : 'Campaign'));

  // ── Toolbar ──
  var toolbar =
    '<div style="height:42px;background:#1c2128;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;padding:0 14px;gap:10px;flex-shrink:0">'
    + '<button onclick="csBackToStepper()" style="display:flex;align-items:center;gap:4px;height:24px;padding:0 9px;border:1px solid rgba(255,255,255,.1);border-radius:5px;background:transparent;color:#8b949e;font-size:10px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .12s,color .12s" onmouseover="this.style.borderColor=\'rgba(255,255,255,.25)\';this.style.color=\'#e6edf3\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.1)\';this.style.color=\'#8b949e\'">'
    +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>Back'
    + '</button>'
    + '<div style="width:1px;height:18px;background:rgba(255,255,255,.07)"></div>'
    + '<span style="font-size:11px;color:#484f58">Advertiser:</span>'
    + '<span style="font-size:11px;font-weight:600;color:#c9d1d9">Walmart</span>'
    + '<div style="width:1px;height:18px;background:rgba(255,255,255,.07)"></div>'
    + '<span style="font-size:11px;color:#484f58">Creative Studio</span>'
    + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
    + '<span style="font-size:11px;color:#484f58">' + campLabel + '</span>'
    + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>'
    + '<span style="font-size:11px;color:#c9d1d9;font-weight:500">' + (sel ? sel.name : 'Asset') + '</span>'
    + '<div style="flex:1"></div>'
    + '<button onclick="csEditorSave()" style="display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 13px;border:none;border-radius:6px;background:linear-gradient(135deg,#e11d8f,#f43f5e);color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">'
    +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
    +   'Save Creative'
    + '</button>'
    + '</div>';

  // ── Left column — asset tiles ──
  var leftCol =
    '<div id="cs-left-col" style="width:280px;flex-shrink:0;background:#161b22;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;padding:10px 12px;gap:5px;overflow-y:auto">'
    + _csLeftAssetsHtml()
    + '</div>';

  // ── Center — player + timeline ──
  // Detect asset type to choose the right player
  var isRadiusAsset = sel && sel.assetType === 'radius';
  // Extract YouTube video ID from asset src if available, fall back to hardcoded demo
  var _ytId = CS_TEMPLATE_YT_ID;
  if (!isRadiusAsset && sel && sel.src) {
    var _ytMatch = sel.src.match(/(?:youtube\.com\/embed\/|youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);
    if (_ytMatch) _ytId = _ytMatch[1];
  }
  var ytThumb = isRadiusAsset ? '' : 'https://img.youtube.com/vi/' + _ytId + '/mqdefault.jpg';
  var scenes = '';
  for (var i = 0; i < 14; i++) {
    var secs = i * 3;
    var tLabel = Math.floor(secs/60) + ':' + (secs%60 < 10 ? '0' : '') + (secs%60);
    var isActive = i === 2;
    scenes += '<div style="flex:1;min-width:0;cursor:pointer;border-radius:4px;overflow:hidden;border:1.5px solid ' + (isActive ? '#e11d8f' : 'rgba(255,255,255,.06)') + '" onmouseover="this.style.borderColor=\'rgba(255,255,255,.22)\'" onmouseout="this.style.borderColor=\'' + (isActive ? '#e11d8f' : 'rgba(255,255,255,.06)') + '\'">'
      + '<div style="height:36px;overflow:hidden;background:#0d1117;display:flex;align-items:center;justify-content:center">'
      + (ytThumb
        ? '<img src="' + ytThumb + '" style="width:100%;height:100%;object-fit:cover;display:block;opacity:.75">'
        : '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>')
      + '</div>'
      + '<div style="padding:2px 4px;background:#1c2128;font-size:8px;font-weight:600;color:' + (isActive ? '#e11d8f' : '#484f58') + ';text-align:center;font-variant-numeric:tabular-nums">' + tLabel + '</div>'
      + '</div>';
  }

  var isImageAsset = sel && (sel.assetType === 'image' || sel.type === 'JPG' || sel.type === 'PNG' || sel.type === 'WEBP');
  var playerInnerHtml = isImageAsset
    ? '<img src="' + (sel.src || sel.thumb) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block">'
      + '<div id="cs-player-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:1"></div>'
    : isRadiusAsset
      ? '<iframe src="' + (sel.src || '') + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>'
        + '<div id="cs-player-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:3"></div>'
      : '<iframe src="https://www.youtube.com/embed/' + _ytId + '?autoplay=1&mute=1&modestbranding=1&rel=0" style="position:absolute;inset:0;width:100%;height:100%;border:0" allowfullscreen allow="autoplay; encrypted-media; picture-in-picture"></iframe>'
        + '<div id="cs-yt-title-cover" style="position:absolute;top:0;left:0;right:0;height:22%;background:linear-gradient(to bottom,#000 0%,rgba(0,0,0,.7) 60%,transparent 100%);pointer-events:none;z-index:2;transition:opacity 1s ease;opacity:1"></div>'
        + '<div id="cs-player-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:3"></div>';

  var timelineHtml = isImageAsset ? '' :
    '<div style="height:58px;background:#161b22;border-top:1px solid rgba(255,255,255,.06);display:flex;align-items:stretch;padding:6px 8px;flex-shrink:0;gap:3px">'
    +   scenes
    + '</div>';

  var centerCol =
    '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0">'
    // Player
    + '<div style="flex:1;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;min-height:0">'
    +   '<div style="width:85%;aspect-ratio:16/9;overflow:hidden;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,.6);position:relative">'
    +     playerInnerHtml
    +   '</div>'
    + '</div>'
    // Timeline (hidden for image assets)
    + timelineHtml
    + '</div>';

  // Top bar icons: Ad Types + grid-2x2-plus (Lucide)
  var rcNavIconsTop = [
    { label: 'Ad Types',     svg: '<path d="M3 3h8v8H3z"/><path d="M13 3h8v5h-8z"/><path d="M13 11h8v10h-8z"/><path d="M3 14h8v9H3z"/>' },
    { label: 'Add Template', svg: '<rect width="7" height="7" x="2" y="2" rx="1"/><rect width="7" height="7" x="15" y="2" rx="1"/><rect width="7" height="7" x="2" y="15" rx="1"/><path d="M18.5 15v7M15 18.5h7"/>' },
  ];
  // Bottom bar icons: Element 1, Element 2, Link (qr-code), Tags
  var rcNavIconsBottom = [
    { label: 'Element 1', svg: '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>' },
    { label: 'Element 2', svg: '<rect width="18" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>' },
    { label: 'Link',      svg: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>' },
    { label: 'Tags',      svg: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' },
  ];
  function _rcNavBtns(icons, cls, withTabSwitch, onClickFn) {
    return icons.map(function(ic, i) {
      var active = i === csRcTab;
      var tabCall   = withTabSwitch ? 'csRcSetTab(' + i + ');' : '';
      var extraCall = onClickFn    ? onClickFn + '(' + i + ');' : '';
      return '<button onclick="' + tabCall + extraCall + 'this.parentNode.querySelectorAll(\'.' + cls + '\').forEach(function(b){b.style.background=\'none\';b.style.color=\'#484f58\'});this.style.background=\'rgba(255,255,255,.07)\';this.style.color=\'#c9d1d9\'" '
        + 'class="' + cls + '" '
        + 'style="width:34px;height:30px;border:none;border-radius:6px;background:' + (active ? 'rgba(255,255,255,.07)' : 'none') + ';color:' + (active ? '#c9d1d9' : '#484f58') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s" '
        + 'onmouseover="csEditorTooltip(this,\'' + ic.label + '\',true)" '
        + 'onmouseout="csEditorTooltip(this,\'\',false)">'
        +   '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ic.svg + '</svg>'
        + '</button>';
    }).join('');
  }
  // Top icon bar — with tab switching
  var rcNav = '<div style="display:flex;align-items:center;gap:2px;border-bottom:1px solid rgba(255,255,255,.06);margin:-14px -16px 14px;padding:8px 10px">'
    + _rcNavBtns(rcNavIconsTop, 'rc-nav-btn', true)
    + '</div>';
  // Bottom icon bar (inside tab 1, no tab switching, context-aware click)
  var rcNav2 = '<div style="display:flex;align-items:center;gap:2px;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);margin:0 -16px 14px;padding:8px 10px">'
    + _rcNavBtns(rcNavIconsBottom, 'rc-nav-btn2', false, 'csRcNav2Click')
    + '</div>';

  var SEP    = '<div style="height:1px;background:rgba(255,255,255,.06);margin:14px 0"></div>';
  var PENCIL = '<button onclick="csEditorRenameAsset()" style="flex-shrink:0;width:22px;height:22px;border:none;background:none;cursor:pointer;color:#484f58;display:flex;align-items:center;justify-content:center;border-radius:4px;padding:0;transition:color .12s" onmouseover="this.style.color=\'#c9d1d9\'" onmouseout="this.style.color=\'#484f58\'">'
    + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
    + '</button>';

  var rightCol =
    '<div style="width:280px;flex-shrink:0;background:#161b22;border-left:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;overflow:hidden">'
    // ── Scrollable content
    + '<div style="flex:1;overflow-y:auto;padding:14px 16px">'
    +   rcNav
    // Asset name + pencil — always visible
    +   '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
    +     '<div id="cs-asset-name" style="font-size:12px;font-weight:600;color:#e6edf3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + (sel ? sel.name : '—') + '</div>'
    +     PENCIL
    +   '</div>'
    // ── Tab 0: Ad Types — Template Added
    +   '<div id="cs-rc-tab0" style="display:' + (csRcTab === 0 ? 'block' : 'none') + '">'
    +     SEP
    +     '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:8px">Template Added</div>'
    +     '<div id="cs-saved-tpl-section">' + _csSavedTplSectionHtml() + '</div>'
    +   '</div>'
    // ── Tab 1: Add Template — second icon bar + Media Type + Ad Template
    +   '<div id="cs-rc-tab1" style="display:' + (csRcTab === 1 ? 'block' : 'none') + '">'
    +     _csDarkSelect('cs-ds-mediatype',  'Media Type',  ['CTV', 'Web', 'Mobile'], '— select —')
    +     _csDarkSelect('cs-ds-adtemplate', 'Ad Template', ['CTV - Sync', 'CTV - Sync Impulse', 'CTV - Sync LBAR', 'CTV - Pause Ad', 'CTV - Organic Pause', 'CTV - CTA Pause'], '— select —')
    +     rcNav2
    +     '<div id="cs-template-config" style="margin-top:4px"></div>'
    +   '</div>'
    + '</div>'
    // ── Sticky Save footer (hidden until template selected)
    + '<div id="cs-rc-save-footer" style="display:none;flex-shrink:0;padding:12px 16px;border-top:1px solid rgba(255,255,255,.06)">'
    +   '<button id="cs-rc-save-btn" onclick="csLBarSaveTemplate()" style="width:100%;height:34px;border:1px solid rgba(255,255,255,.25);border-radius:8px;background:transparent;color:#c9d1d9;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;transition:border-color .15s,color .15s,opacity .15s" onmouseover="this.style.borderColor=\'rgba(255,255,255,.5)\';this.style.color=\'#fff\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.25)\';this.style.color=\'#c9d1d9\'">'
    +   '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
    +   'Save Template</button>'
    + '</div>'
    + '</div>';

  return toolbar
    + '<div style="flex:1;display:flex;overflow:hidden;min-height:0">'
    +   leftCol + centerCol + rightCol
    + '</div>';
}

function csEditorSelectAsset(idx) {
  csBuildSelectedAsset = idx;
  var overlay = document.getElementById('cs-editor-overlay');
  if (overlay) overlay.innerHTML = _csEditorHtml();
  // Re-apply title cover fade if video asset selected
  var sel = csEditorAssets[idx];
  var isImg = sel && (sel.type === 'JPG' || sel.type === 'PNG' || sel.type === 'WEBP');
  if (!isImg) {
    setTimeout(function() {
      var cover = document.getElementById('cs-yt-title-cover');
      if (cover) { cover.style.opacity = '0'; setTimeout(function() { if (cover.parentNode) cover.parentNode.removeChild(cover); }, 1000); }
    }, 4000);
  }
  // Update URL to reflect selected asset
  if (sel && sel.id) {
    history.replaceState({ id: 'creative-studio', label: 'Creative Studio', openEditor: true, csAssetId: sel.id }, '', '/creative-studio/build-template/' + sel.id);
  }
}

function csBackToStepper() {
  var overlay = document.getElementById('cs-editor-overlay');
  if (overlay) overlay.remove();
  // If opened from Moments Match "Add Template", close without saving — restore URL
  if (window._mp2AddTemplateCreativeId) {
    window._mp2AddTemplateCreativeId = null;
    var retUrl   = window._mp2TemplateReturnUrl   || '/media-planner-v2';
    var retState = window._mp2TemplateReturnState || { id: 'media-planner-v2', label: 'Moments Match' };
    window._mp2TemplateReturnUrl   = null;
    window._mp2TemplateReturnState = null;
    history.replaceState(retState, '', retUrl);
    return;
  }
  // If opened from CM "Add Template", close overlay without saving — restore URL silently
  if (window._cmAddTemplateCreativeId) {
    window._cmAddTemplateCreativeId = null;
    var detailUrl = _cmOpenDetailId
      ? '/campaign-management/draft-campaign/' + _cmOpenDetailId
      : '/campaign-management';
    history.replaceState({ id: 'campaign-management', cmCampaignId: _cmOpenDetailId }, '', detailUrl);
    return;
  }
  if (window.csBuilderBackPage) {
    var bp = window.csBuilderBackPage;
    window.csBuilderBackPage = null;
    setPage(bp, bp.replace(/-/g, ' ').replace(/\b\w/g, function(c){return c.toUpperCase();}), true);
  } else {
    history.replaceState({ id: 'creative-studio', label: 'Creative Studio' }, '', '/creative-studio');
  }
}

// ── Left panel tab switcher ───────────────────────────────────────────────────
function csLeftPanelSetTab(n) {
  csLeftPanelTab = n;
  var leftCol = document.getElementById('cs-left-col');
  if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
}

function csRcSetTab(n) {
  csRcTab = n;
  var t0 = document.getElementById('cs-rc-tab0');
  var t1 = document.getElementById('cs-rc-tab1');
  if (t0) t0.style.display = n === 0 ? 'block' : 'none';
  if (t1) t1.style.display = n === 1 ? 'block' : 'none';
  document.querySelectorAll('.rc-nav-btn').forEach(function(b, i) {
    b.style.background = i === n ? 'rgba(255,255,255,.07)' : 'none';
    b.style.color      = i === n ? '#c9d1d9' : '#484f58';
  });
}

// Bottom icon bar click handler — context-aware per template type
// i: 0=Element1, 1=Element2, 2=Link, 3=Tags
function csRcNav2Click(i) {
  if (csEditorTemplateType === 'lbar') {
    // Map icons to L-Bar cards: Element1→1 (Badge+QR), Element2→2 (Squeeze In), Link→3 (QR Link)
    var lbarMap = { 0: 1, 1: 2, 2: 3 };
    if (lbarMap[i] !== undefined) csLBarSetActiveElement(lbarMap[i]);
  }
}

// ── Brand Guidelines panel ────────────────────────────────────────────────────
function _csBrandColorSwatch(id, hex) {
  var PRESETS = ['#0071CE','#003087','#FFC220','#004F9A','#1d4ed8','#000000','#ffffff','#e11d8f'];
  var rgb = hexToRgbCS(hex);
  return '<div style="position:relative">'
    + '<button id="' + id + '-btn" onclick="csDarkColorPickerToggle(\'' + id + '\')" style="width:100%;height:44px;border-radius:7px;background:' + hex + ';cursor:pointer;border:1px solid rgba(255,255,255,.15);display:block;transition:opacity .12s" onmouseover="this.style.opacity=\'.82\'" onmouseout="this.style.opacity=\'1\'"></button>'
    + '<div id="' + id + '-panel" style="display:none;position:fixed;z-index:10000;background:#21262d;border:1px solid rgba(255,255,255,.12);border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.7);padding:12px;width:196px">'
    +   '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-bottom:10px">'
    +   PRESETS.map(function(c) {
          var sel = c.toLowerCase() === hex.toLowerCase();
          return '<div onclick="csDarkColorPickerSelect(\'' + id + '\',\'' + c + '\')" style="height:20px;border-radius:4px;background:' + c + ';cursor:pointer;border:2px solid ' + (sel ? '#fff' : 'transparent') + ';box-sizing:border-box;transition:transform .1s" onmouseover="this.style.transform=\'scale(1.15)\'" onmouseout="this.style.transform=\'scale(1)\'"></div>';
        }).join('')
    +   '</div>'
    +   '<div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">'
    +     '<div id="' + id + '-preview" style="width:24px;height:24px;border-radius:4px;background:' + hex + ';flex-shrink:0;border:1px solid rgba(255,255,255,.15)"></div>'
    +     '<input id="' + id + '-hex" type="text" value="' + hex + '" oninput="csDarkColorPickerHex(\'' + id + '\',this.value)" placeholder="#000000" style="flex:1;height:24px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 7px;font-size:10px;font-family:monospace;color:#c9d1d9;outline:none" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
    +   '</div>'
    +   '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px">'
    +   [['R', rgb.r], ['G', rgb.g], ['B', rgb.b]].map(function(ch) {
          return '<div><label style="font-size:8px;color:#484f58;display:block;margin-bottom:2px">' + ch[0] + '</label>'
            + '<input type="number" min="0" max="255" value="' + ch[1] + '" id="' + id + '-rgb-' + ch[0].toLowerCase() + '" oninput="csDarkColorPickerRgb(\'' + id + '\')" style="width:100%;height:24px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 5px;font-size:10px;color:#c9d1d9;outline:none;box-sizing:border-box;font-family:inherit"></div>';
        }).join('')
    +   '</div>'
    + '</div>'
    + '</div>';
}

function csBrandAddColor() {
  _csBrandColorCount++;
  csBrandColors.push({ id: 'bc' + _csBrandColorCount, hex: '#ffffff' });
  var leftCol = document.getElementById('cs-left-col');
  if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
}

function csBrandRemoveColor(id) {
  csBrandColors = csBrandColors.filter(function(c) { return c.id !== id; });
  var leftCol = document.getElementById('cs-left-col');
  if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
}

function csBrandHandleLogoUpload(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    csBrandLogoImage = e.target.result;
    var leftCol = document.getElementById('cs-left-col');
    if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
  };
  reader.readAsDataURL(file);
}

function _csBrandGuidelinesHtml() {
  var SEC = 'font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#484f58;margin-bottom:10px;padding:0 2px';
  var DIV = '<div style="height:1px;background:rgba(255,255,255,.06);margin:16px 0"></div>';

  // ── Brand Colors ──
  var addBtn =
    '<button onclick="csBrandAddColor()" style="width:100%;height:30px;border:1.5px dashed rgba(255,255,255,.1);border-radius:7px;background:none;color:#484f58;font-size:10px;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:border-color .12s,color .12s;margin-top:6px" onmouseover="this.style.borderColor=\'rgba(225,29,143,.4)\';this.style.color=\'#c9d1d9\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.1)\';this.style.color=\'#484f58\'">'
    + '<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2v8M2 6h8"/></svg>Add Color'
    + '</button>';

  var colorsSection =
    '<div style="' + SEC + '">Brand Colors</div>'
    + csBrandColors.map(function(c) {
        var swatchId = 'cs-cp-brand-' + c.id;
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">'
          + '<div style="flex:1;min-width:0">' + _csBrandColorSwatch(swatchId, c.hex) + '</div>'
          + '<button onclick="csBrandRemoveColor(\'' + c.id + '\')" style="flex-shrink:0;width:22px;height:22px;border:none;background:none;cursor:pointer;color:#484f58;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:15px;line-height:1;padding:0;transition:color .12s" onmouseover="this.style.color=\'#f43f5e\'" onmouseout="this.style.color=\'#484f58\'">×</button>'
          + '</div>';
      }).join('')
    + addBtn;

  // ── Brand Logo ──
  var logoPreview = csBrandLogoImage
    ? '<div style="width:100%;background:#fff;border-radius:8px;border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;padding:14px;box-sizing:border-box;margin-bottom:8px">'
    +   '<img src="' + csBrandLogoImage + '" style="max-width:100%;max-height:72px;object-fit:contain;display:block">'
    + '</div>'
    : '';

  var logoSection =
    '<div style="' + SEC + '">Brand Logo</div>'
    + logoPreview
    + _csLBarUploadArea(csBrandLogoImage ? 'Replace Logo' : 'Upload Logo (PNG / SVG)', 'cs-brand-logo-upload', 'brandlogo');

  return colorsSection + DIV + logoSection;
}

// ── Left assets column HTML (extracted so it can be refreshed without full re-render) ──
function _csLeftAssetsHtml() {
  var leftNavIcons = [
    { label: 'Creative Assets',     svg: '<rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m3 14 5-5 3 3"/><polygon points="13 9 19 12 13 15"/><path d="M3 21h18"/><path d="M7 21v-2"/><path d="M17 21v-2"/>' },
    { label: 'Brand Guidelines',    svg: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>' },
    { label: 'Shoppable Catalogue', svg: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>' },
  ];

  var nav = '<div style="display:flex;align-items:center;gap:2px;border-bottom:1px solid rgba(255,255,255,.06);margin:-10px -12px 10px;padding:6px 8px">'
    + leftNavIcons.map(function(ic, i) {
        var active = i === csLeftPanelTab;
        return '<button onclick="csLeftPanelSetTab(' + i + ')" '
          + 'style="width:32px;height:28px;border:none;border-radius:5px;background:' + (active ? 'rgba(255,255,255,.07)' : 'none') + ';color:' + (active ? '#c9d1d9' : '#484f58') + ';cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s,color .12s" '
          + 'onmouseover="csEditorTooltip(this,\'' + ic.label + '\',true)" '
          + 'onmouseout="csEditorTooltip(this,\'\',false)">'
          + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ic.svg + '</svg>'
          + '</button>';
      }).join('')
    + '</div>';

  var content = '';
  if (csLeftPanelTab === 0) {
    var assets = csEditorAssets;
    var TICON = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
    content = '<div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#484f58;margin-bottom:6px;padding:0 2px">Assets</div>'
      + assets.map(function(a, idx) {
          var active = idx === csBuildSelectedAsset;
          var templates = a.templates || [];
          var tplItems = templates.length === 0
            ? '<span style="font-size:8px;color:#6e7681">No templates</span>'
            : templates.map(function(t) {
                return '<div style="display:flex;align-items:center;gap:3px;padding:2px 5px;margin-bottom:2px;border-radius:3px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)">'
                  + '<span style="color:#6e7681;flex-shrink:0">' + TICON + '</span>'
                  + '<span style="font-size:8px;font-weight:600;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + t + '</span>'
                  + '</div>';
              }).join('');
          return '<div onclick="csEditorSelectAsset(' + idx + ')" style="cursor:pointer;border-radius:6px;overflow:hidden;border:2px solid ' + (active ? '#e11d8f' : 'rgba(255,255,255,.05)') + ';transition:border-color .15s;margin-bottom:6px;display:flex;align-items:stretch">'
            // Left — thumbnail 16:9 + type label below
            + '<div style="width:96px;flex-shrink:0;display:flex;flex-direction:column;background:#000">'
            +   '<div style="flex:1;min-height:54px;overflow:hidden">'
            +     '<img src="' + a.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block;opacity:' + (active ? '1' : '.6') + ';transition:opacity .15s">'
            +   '</div>'
            +   '<div style="padding:3px 5px;background:' + (active ? 'rgba(225,29,143,.2)' : '#1c2128') + ';text-align:center">'
            +     '<span style="font-size:8px;font-weight:700;color:' + (active ? '#e11d8f' : '#484f58') + ';letter-spacing:.3px">' + a.type + '</span>'
            +   '</div>'
            + '</div>'
            // Right — templates only
            + '<div style="flex:1;min-width:0;background:' + (active ? 'rgba(225,29,143,.07)' : '#161b22') + ';padding:7px 9px;border-left:1px solid rgba(255,255,255,.05)">'
            +   '<div style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#484f58;margin-bottom:5px">Templates</div>'
            +   tplItems
            + '</div>'
            + '</div>';
        }).join('')
      + '<div ondragover="event.preventDefault()" ondrop="event.preventDefault();csSimulateUpload()" '
      + 'style="border:1.5px dashed rgba(255,255,255,.1);border-radius:8px;padding:10px 8px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;margin-top:4px" '
      + 'onmouseover="this.style.borderColor=\'#e11d8f\';this.style.background=\'rgba(225,29,143,.05)\'" '
      + 'onmouseout="this.style.borderColor=\'rgba(255,255,255,.1)\';this.style.background=\'transparent\'">'
      +   '<div style="font-size:9px;font-weight:600;color:#484f58;margin-bottom:6px">Drop more assets</div>'
      +   '<button onclick="csSimulateUpload()" style="height:22px;padding:0 10px;border:1px solid rgba(255,255,255,.12);border-radius:5px;background:rgba(255,255,255,.04);color:#8b949e;font-size:9px;font-weight:500;cursor:pointer;font-family:inherit;transition:border-color .12s,color .12s" onmouseover="this.style.borderColor=\'#e11d8f\';this.style.color=\'#e11d8f\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.12)\';this.style.color=\'#8b949e\'">Browse</button>'
      + '</div>';
  } else if (csLeftPanelTab === 1) {
    content = _csBrandGuidelinesHtml();
  } else {
    content = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:32px 8px;text-align:center">'
      + '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#30363d" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + leftNavIcons[2].svg + '</svg>'
      + '<span style="font-size:9px;color:#30363d;font-weight:500">Shoppable Catalogue</span>'
      + '</div>';
  }

  return nav + content;
}

// ── Saved templates section in right col ──────────────────────────────────────
function _csSavedTplSectionHtml() {
  var asset = csEditorAssets[csBuildSelectedAsset];
  var templates = (asset && asset.templates) || [];
  var TICON = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>';
  if (templates.length === 0) {
    return '<div style="font-size:10px;color:#6e7681;margin-bottom:12px">No Templates Added yet for this creative</div>';
  }
  return '<div style="margin-bottom:12px">'
    + templates.map(function(t) {
        return '<div style="border-radius:7px;padding:8px 10px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);display:flex;align-items:center;gap:8px;margin-bottom:5px;transition:border-color .12s" onmouseover="this.style.borderColor=\'rgba(255,255,255,.2)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
          + '<span style="color:#6e7681;flex-shrink:0">' + TICON + '</span>'
          + '<span style="font-size:11px;font-weight:500;color:#c9d1d9;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + t + '</span>'
          + '</div>';
      }).join('')
    + '</div>';
}

function csSelectSavedTemplate(i) {
  csEditorSelectedSavedTpl = i;
  var leftCol = document.getElementById('cs-left-col');
  if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
  var sec = document.getElementById('cs-saved-tpl-section');
  if (sec) sec.innerHTML = _csSavedTplSectionHtml();
}

// ── CTA Pause template ────────────────────────────────────────────────────────
function csCtaPauseSelected() {
  csCtaBadgeText = 'PAUSE TO SHOP'; csCtaBadgeColor = '#0071CE';
  csCtaBadgePosition = 'bottom-right'; csCtaProductCatalogue = '';
  csCtaBgImage = ''; csCtaActiveElement = 1; csCtaSelectedProduct = -1;
  var el = document.getElementById('cs-template-config');
  if (el) el.innerHTML = _csCtaPauseConfigHtml();
  var footer = document.getElementById('cs-rc-save-footer');
  if (footer) { footer.style.display = 'block'; csCtaUpdateSaveBtn(); }
  csCtaUpdatePlayerOverlay();
}
function csCtaSetActiveElement(n) {
  csCtaActiveElement = n; csCtaSelectedProduct = -1;
  [1, 2, 3].forEach(function(i) {
    var card = document.getElementById('cs-cta-card-' + i);
    var body = document.getElementById('cs-cta-card-' + i + '-body');
    var chev = document.getElementById('cs-cta-chevron-' + i);
    var active = i === n;
    if (card) card.style.borderColor = active ? '#e11d8f' : 'rgba(255,255,255,.08)';
    if (body) body.style.display = active ? 'block' : 'none';
    if (chev) chev.style.transform = active ? 'rotate(180deg)' : 'rotate(0deg)';
  });
  csCtaUpdatePlayerOverlay();
}
function csCtaUpdatePlayerOverlay() {
  var ov = document.getElementById('cs-player-overlay');
  if (ov) ov.innerHTML = _csCtaPlayerOverlayHtml();
}
function csCtaUpdateSaveBtn() {
  var btn = document.getElementById('cs-rc-save-btn');
  if (!btn) return;
  var disabled = !csCtaProductCatalogue;
  btn.style.opacity       = disabled ? '0.35' : '1';
  btn.style.cursor        = disabled ? 'not-allowed' : 'pointer';
  btn.style.borderColor   = disabled ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.25)';
  btn.style.pointerEvents = disabled ? 'none' : 'auto';
}
function csCtaSelectProduct(i) {
  csCtaSelectedProduct = i;
  csCtaUpdatePlayerOverlay();
}

// ── CTA player overlay ────────────────────────────────────────────────────────
function _csCtaPlayerOverlayHtml() {
  if (csCtaSelectedProduct >= 0) return _csCtaProductDetailHtml();
  if (csCtaActiveElement === 2)  return _csCtaBadgeHtml();
  if (csCtaActiveElement === 3)  return _csCtaProductTilesHtml();
  return '';
}
function _csCtaBadgeHtml() {
  var color = csCtaBadgeColor || '#0071CE';
  var text  = (csCtaBadgeText || 'PAUSE TO SHOP').toUpperCase();
  var pos   = csCtaBadgePosition === 'bottom-left' ? 'bottom:8%;left:4%' : 'bottom:8%;right:4%';
  var badge =
    '<div style="display:inline-flex;align-items:center;border-radius:50px;overflow:visible;box-shadow:0 4px 20px rgba(0,0,0,.55);pointer-events:none">'
    + '<div style="width:42px;height:42px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;position:relative;z-index:1;box-shadow:0 2px 8px rgba(0,0,0,.3)">'
    +   '<svg width="12" height="15" viewBox="0 0 12 15" fill="none"><rect x="0.5" y="0.5" width="4" height="14" rx="1" fill="#111"/><rect x="7.5" y="0.5" width="4" height="14" rx="1" fill="#111"/></svg>'
    + '</div>'
    + '<div style="background:' + color + ';height:42px;display:flex;align-items:center;padding:0 18px 0 26px;margin-left:-20px;border-radius:0 50px 50px 0">'
    +   '<span style="font-size:10px;font-weight:800;color:#fff;letter-spacing:1.8px;white-space:nowrap">' + text + '</span>'
    + '</div>'
    + '</div>';
  return '<div style="position:absolute;' + pos + ';z-index:10;animation:cs-fadein .2s ease">' + badge + '</div>';
}
function _csCtaProductTilesHtml() {
  var bgOverlay = csCtaBgImage
    ? '<img src="' + csCtaBgImage + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block">'
    : '';
  var tiles = CS_CTA_PRODUCTS.map(function(p, i) {
    return '<div onclick="csCtaSelectProduct(' + i + ')" style="cursor:pointer;flex-shrink:0;width:145px;background:rgba(18,18,18,.92);border-radius:10px;overflow:hidden;display:flex;align-items:center;gap:9px;padding:8px 10px;border:1px solid rgba(255,255,255,.1);pointer-events:auto;transition:border-color .12s" onmouseover="this.style.borderColor=\'rgba(255,255,255,.35)\'" onmouseout="this.style.borderColor=\'rgba(255,255,255,.1)\'">'
      + '<div style="width:46px;height:46px;flex-shrink:0;background:#fff;border-radius:6px;overflow:hidden">'
      +   '<img src="' + p.img + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      + '</div>'
      + '<div style="min-width:0">'
      +   '<div style="font-size:10px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + p.name + '</div>'
      +   '<div style="font-size:9px;color:rgba(255,255,255,.45);margin-top:2px">Shop Now</div>'
      + '</div>'
      + '</div>';
  }).join('');
  return '<div style="position:absolute;inset:0;pointer-events:none">'
    + bgOverlay
    + '<div style="position:absolute;bottom:0;left:0;right:0;padding:14px 0 22px;background:linear-gradient(to top,rgba(0,0,0,.82) 0%,transparent 100%)">'
    +   '<div style="font-size:6px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.9px;margin-bottom:5px;padding-left:33%">Sponsored by · Walmart</div>'
    +   '<div style="display:flex;gap:5px;padding-left:33%;overflow:visible">' + tiles + '</div>'
    + '</div>'
    + '</div>';
}
function _csCtaProductDetailHtml() {
  var p = CS_CTA_PRODUCTS[csCtaSelectedProduct];
  if (!p) return '';
  var color = csCtaBadgeColor || '#0071CE';
  var colorDark = '#003087';
  return '<div style="position:absolute;inset:10px;background:linear-gradient(135deg,' + colorDark + ' 0%,' + color + ' 45%,#338fdb 72%,' + color + ' 100%);border-radius:6px;overflow:hidden;display:flex;flex-direction:column;pointer-events:auto">'
    // Header
    + '<div style="padding:7px 12px;display:flex;align-items:center;gap:6px">'
    +   '<div style="width:14px;height:14px;background:#fff;border-radius:50%;flex-shrink:0"></div>'
    +   '<span style="font-size:8px;font-weight:700;color:#fff;letter-spacing:.3px">Walmart × SHOP</span>'
    +   '<span style="font-size:7px;color:rgba(255,255,255,.5);margin-left:2px">Powered by SnowCommerce</span>'
    +   '<div style="flex:1"></div>'
    +   '<button onclick="event.stopPropagation();csCtaSelectProduct(-1)" style="width:18px;height:18px;border:none;background:rgba(0,0,0,.25);border-radius:50%;cursor:pointer;color:#fff;font-size:12px;font-family:inherit;display:flex;align-items:center;justify-content:center;line-height:1;flex-shrink:0">×</button>'
    + '</div>'
    // Body
    + '<div style="flex:1;display:flex;gap:10px;padding:4px 14px 8px;align-items:center;min-height:0">'
    +   '<div style="width:36%;background:#fff;border-radius:8px;overflow:hidden;flex-shrink:0;aspect-ratio:1;display:flex;align-items:center;justify-content:center;padding:8px;box-sizing:border-box">'
    +     '<img src="' + p.img + '" style="max-width:100%;max-height:100%;object-fit:contain;display:block">'
    +   '</div>'
    +   '<div style="flex:1;min-width:0">'
    +     '<div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:5px;line-height:1.2">' + p.name + '</div>'
    +     '<div style="font-size:8px;color:rgba(255,255,255,.75);line-height:1.6;margin-bottom:8px">' + p.desc + '</div>'
    +     '<div style="font-size:15px;font-weight:700;color:#fff">' + p.price + '</div>'
    +   '</div>'
    + '</div>'
    // Footer QR
    + '<div style="padding:6px 14px 10px;display:flex;align-items:center;justify-content:flex-end;gap:12px">'
    +   '<div style="display:flex;align-items:center;gap:6px">'
    +     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>'
    +     '<span style="font-size:8px;font-weight:700;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.6px;line-height:1.5">Scan QR Code with your<br>camera and shop now</span>'
    +   '</div>'
    +   _csMockQR(80)
    + '</div>'
    + '</div>';
}

// ── CTA Pause config panel ─────────────────────────────────────────────────────
function _csCtaPauseConfigHtml() {
  var SLBL = 'display:block;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#484f58;margin-bottom:6px;margin-top:10px';
  var CARD_BASE = 'background:#0d1117;border-radius:8px;padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .15s;border:1px solid ';
  var CARD_HDR  = 'font-size:9px;font-weight:700;color:#8b949e;letter-spacing:.8px;text-transform:uppercase';
  function CHEV(n) {
    var rot = csCtaActiveElement === n ? 'rotate(180deg)' : 'rotate(0deg)';
    return '<svg id="cs-cta-chevron-' + n + '" width="10" height="10" viewBox="0 0 12 12" fill="none" style="flex-shrink:0;transition:transform .2s;transform:' + rot + '"><path d="M2 4l4 4 4-4" stroke="#484f58" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  return '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:#484f58;margin-bottom:10px">Customize CTA Pause Elements</div>'
    // Card 1 — Shoppable Catalogue
    + '<div id="cs-cta-card-1" onclick="csCtaSetActiveElement(1)" style="' + CARD_BASE + (csCtaActiveElement===1?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between"><div style="' + CARD_HDR + '">1. Shoppable Catalogue</div>' + CHEV(1) + '</div>'
    +   '<div id="cs-cta-card-1-body" onclick="event.stopPropagation()" style="display:' + (csCtaActiveElement===1?'block':'none') + ';margin-top:12px">'
    +     _csDarkSelect('cs-ds-cta-catalogue', 'Shoppable Catalogue', ['Walmart Catalogue', 'Walmart Grocery', 'Walmart Electronics', 'Walmart Home & Garden'], '— select —')
    +   '</div>'
    + '</div>'
    // Card 2 — CTA Badge
    + '<div id="cs-cta-card-2" onclick="csCtaSetActiveElement(2)" style="' + CARD_BASE + (csCtaActiveElement===2?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between"><div style="' + CARD_HDR + '">2. CTA Badge</div>' + CHEV(2) + '</div>'
    +   '<div id="cs-cta-card-2-body" onclick="event.stopPropagation()" style="display:' + (csCtaActiveElement===2?'block':'none') + ';margin-top:12px">'
    +     '<label style="' + SLBL + ';margin-top:0">CTA Text</label>'
    +     '<input type="text" value="' + csCtaBadgeText + '" oninput="csCtaBadgeText=this.value;csCtaUpdatePlayerOverlay()" placeholder="PAUSE TO SHOP" style="height:28px;background:#0d1117;border:1px solid rgba(255,255,255,.08);border-radius:5px;padding:0 8px;font-size:11px;font-family:inherit;color:#c9d1d9;outline:none;box-sizing:border-box;width:100%;margin-bottom:12px;transition:border-color .12s" onfocus="this.style.borderColor=\'rgba(225,29,143,.4)\'" onblur="this.style.borderColor=\'rgba(255,255,255,.08)\'">'
    +     _csDarkColorPicker('cs-cp-cta-color', 'Color', csCtaBadgeColor)
    +     _csDarkSelect('cs-ds-cta-position', 'Position', ['Bottom Right', 'Bottom Left'], '— select —')
    +   '</div>'
    + '</div>'
    // Card 3 — Product Tiles
    + '<div id="cs-cta-card-3" onclick="csCtaSetActiveElement(3)" style="' + CARD_BASE + (csCtaActiveElement===3?'#e11d8f':'rgba(255,255,255,.08)') + '">'
    +   '<div style="display:flex;align-items:center;justify-content:space-between"><div style="' + CARD_HDR + '">3. Product Tiles</div>' + CHEV(3) + '</div>'
    +   '<div id="cs-cta-card-3-body" onclick="event.stopPropagation()" style="display:' + (csCtaActiveElement===3?'block':'none') + ';margin-top:12px">'
    +     '<label style="' + SLBL + ';margin-top:0">Background Image</label>'
    +     _csLBarUploadArea('Upload JPG / PNG', 'cs-cta-bg-upload', 'ctabg')
    +   '</div>'
    + '</div>';
}

function csCtaHandleBgUpload(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    csCtaBgImage = e.target.result;
    var wrap = document.getElementById('cs-cta-bg-upload');
    if (wrap) {
      wrap.style.borderColor = '#e11d8f'; wrap.style.borderStyle = 'solid';
      wrap.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#e11d8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        + '<span style="font-size:10px;color:#c9d1d9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">' + file.name + '</span>'
        + '<input id="cs-cta-bg-upload-file" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="csCtaHandleBgUpload(this)">';
      wrap.onclick = function() { document.getElementById('cs-cta-bg-upload-file').click(); };
    }
    csCtaUpdatePlayerOverlay();
  };
  reader.readAsDataURL(file);
}

// ── Save template (sticky button) ─────────────────────────────────────────────
var _csAdTypeNames = {
  'CTV - Sync LBAR':     'Sync L-Bar',
  'CTV - Sync':          'CTV Sync',
  'CTV - Sync Impulse':  'Sync Impulse',
  'CTV - Pause Ad':      'Pause Ad',
  'CTV - Organic Pause': 'Organic Pause',
  'CTV - CTA Pause':     'CTA Pause',
};

function csLBarSaveTemplate() {
  if (csEditorTemplateType === 'lbar' && !csLBarQRLink.trim()) return;
  var displayName = _csAdTypeNames[csEditorAdTemplateValue] || csEditorAdTemplateValue;
  var asset = csEditorAssets[csBuildSelectedAsset];
  if (!asset) return;
  if (!asset.templates) asset.templates = [];
  if (asset.templates.indexOf(displayName) === -1) asset.templates.push(displayName);

  // Reset state
  csEditorAdTemplateValue = ''; csEditorTemplateType = '';
  csLBarQRLink = ''; csLBarCustomBadgeImage = ''; csLBarCustomBgImage = ''; csLBarActiveElement = 0;
  csCtaBadgeText = 'PAUSE TO SHOP'; csCtaBadgeColor = '#0071CE';
  csCtaBadgePosition = 'bottom-right'; csCtaProductCatalogue = '';
  csCtaBgImage = ''; csCtaActiveElement = 0; csCtaSelectedProduct = -1;

  // Reset dropdowns to placeholder
  var mtLbl = document.getElementById('cs-ds-mediatype-lbl');
  var atLbl = document.getElementById('cs-ds-adtemplate-lbl');
  if (mtLbl) { mtLbl.textContent = '— select —'; mtLbl.style.color = '#6e7681'; }
  if (atLbl) { atLbl.textContent = '— select —'; atLbl.style.color = '#6e7681'; }

  // Clear config panel + player overlay + hide footer
  var config = document.getElementById('cs-template-config');
  if (config) config.innerHTML = '';
  var ov = document.getElementById('cs-player-overlay');
  if (ov) ov.innerHTML = '';
  var footer = document.getElementById('cs-rc-save-footer');
  if (footer) footer.style.display = 'none';

  // Refresh left col and saved templates section
  var leftCol = document.getElementById('cs-left-col');
  if (leftCol) leftCol.innerHTML = _csLeftAssetsHtml();
  var sec = document.getElementById('cs-saved-tpl-section');
  if (sec) sec.innerHTML = _csSavedTplSectionHtml();
}

function csEditorSave() {
  var campName   = csCampaignName || (csSelectedCampaign ? csSelectedCampaign.name : null);
  var advName    = (csSelectedCampaign && csSelectedCampaign.advertiserName)
                   || (APP_ADVERTISERS && APP_ADVERTISERS.find(function(a){return a.id===selectedAdvId;})||{}).name
                   || 'Walmart';
  var date       = new Date().toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'});
  var savedAt    = Date.now();
  // Add one library entry per asset (not just the selected one)
  var assetsToSave = csEditorAssets.length > 0 ? csEditorAssets : [csEditorAssets[csBuildSelectedAsset] || csEditorAssets[0]];
  assetsToSave.forEach(function(asset, i) {
    if (!asset) return;
    CS_LIBRARY.unshift({
      id: 'cr' + (savedAt + i) + Math.random().toString(36).slice(2),
      name: asset.name,
      advertiser: advName,
      campaign: campName,
      fileType: asset.type,
      mediaType: 'CTV',
      templates: asset.templates || [],
      date: date,
      thumb: asset.thumb,
      savedAt: savedAt + i,
    });
  });
  var overlay = document.getElementById('cs-editor-overlay');
  if (overlay) overlay.remove();

  // If opened from Moments Match "Add Template", sync templates back
  if (window._mp2AddTemplateCreativeId) {
    window._mp2AddTemplateCreativeId = null;
    csEditorAssets.forEach(function(asset) {
      var cr = mp2MockCreatives.find(function(c) { return c.id === asset.id; });
      if (cr) cr.templates = (asset.templates || []).slice();
    });
    var retUrl   = window._mp2TemplateReturnUrl   || '/media-planner-v2';
    var retState = window._mp2TemplateReturnState || { id: 'media-planner-v2', label: 'Moments Match' };
    window._mp2TemplateReturnUrl   = null;
    window._mp2TemplateReturnState = null;
    history.replaceState(retState, '', retUrl);
    return;
  }

  // If opened from Campaign Management "Add Template", sync all assets back without re-rendering
  if (window._cmAddTemplateCreativeId) {
    window._cmAddTemplateCreativeId = null;
    // Update each draft creative with its templates from the CS editor
    csEditorAssets.forEach(function(asset) {
      var dr = _cmDraftCreatives.find(function(d){ return d.id === asset.id; });
      if (dr) dr.templates = (asset.templates || []).slice();
    });
    // Refresh only the upload column — campaign detail DOM is still intact underneath
    var uploadContent = document.getElementById('cm-upload-col-content');
    if (uploadContent) uploadContent.innerHTML = _cmUploadColHtml();
    // Restore URL to campaign detail without triggering popstate (which would re-render and reset state)
    var detailUrl = _cmOpenDetailId
      ? '/campaign-management/draft-campaign/' + _cmOpenDetailId
      : '/campaign-management';
    history.replaceState({ id: 'campaign-management', cmCampaignId: _cmOpenDetailId }, '', detailUrl);
    return;
  }

  setPage('creative-studio', 'Creative Studio', true);
  setTimeout(function() { csSwitchTab('library'); }, 0);
}

// ── Step 1 — Create / Select Campaign ────────────────────────────────────────
function _csStep1Html() {
  var INP = 'width:100%;height:36px;border:1px solid var(--border-md);border-radius:8px;padding:0 12px;font-size:13px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;transition:border .15s,box-shadow .15s;box-sizing:border-box';
  var FOCUS = 'onfocus="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 0 0 3px rgba(237,0,94,.08)\'" onblur="this.style.borderColor=\'var(--border-md)\';this.style.boxShadow=\'none\'"';
  var CHEVRON = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0;color:var(--faint)"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var TRIGBTN = 'width:100%;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;border:1px solid var(--border-md);border-radius:8px;background:var(--surface);font-size:13px;font-family:inherit;cursor:pointer;transition:border .15s,box-shadow .15s;text-align:left';

  var toggle = _segControlHtml(csCampaignMode, [
    { id: 'select', label: 'Select Campaign', onclick: "csCampaignMode='select';csRefreshStep1()" },
    { id: 'create', label: 'Create Campaign', onclick: "csCampaignMode='create';csRefreshStep1()" },
  ]);

  var DISABLED = 'width:100%;height:36px;border:1px solid var(--border);border-radius:8px;padding:0 12px;font-size:13px;font-family:inherit;color:var(--muted);background:var(--bg);outline:none;cursor:not-allowed;box-sizing:border-box';

  var campField;
  if (csCampaignMode === 'select') {
    var selCamp = csSelectedCampaign; // full object or null
    campField = '<div style="margin-bottom:14px">'
      + '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Campaign</label>'
      + '<div style="position:relative">'
      + '<button id="cs-camp-trigger" onclick="toggleSharedCampaignPanel(event,\'cs-camp-trigger\',\'cs-camp-panel\',\'csSelectedCampaign\',\'csRefreshStep1\')" style="' + TRIGBTN + ';color:' + (selCamp ? 'var(--text)' : 'var(--faint)') + '">'
      + '<span class="camp-lbl">' + (selCamp ? selCamp.name : '— select a campaign —') + '</span>'
      + CHEVRON + '</button>'
      + '<div id="cs-camp-panel" style="display:none"></div>'
      + '</div></div>';
    if (selCamp) {
      campField +=
        '<div style="margin-bottom:14px">'
        + '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Advertiser</label>'
        + '<input type="text" value="' + selCamp.advertiserName + '" disabled style="' + DISABLED + '">'
        + '</div>'
        + '<div>'
        + '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Geography</label>'
        + '<input type="text" value="' + selCamp.geography + '" disabled style="' + DISABLED + '">'
        + '</div>';
    }
    return toggle + campField;
  }

  // Create mode
  campField = '<div style="margin-bottom:14px">'
    + '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Campaign Name</label>'
    + '<input id="cs-campaign-name" type="text" placeholder="e.g. Walmart Summer Launch" value="' + csCampaignName + '" oninput="csCampaignName=this.value" style="' + INP + '" ' + FOCUS + '>'
    + '</div>';

  return toggle + campField
    + '<div style="margin-bottom:14px">'
    +   '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Advertiser</label>'
    +   '<div style="position:relative">'
    +     '<button id="cs-adv-trigger" onclick="toggleSharedAdvPanel(event,\'cs-adv-trigger\',\'cs-adv-panel\')" style="' + TRIGBTN + ';color:var(--text)">'
    +       '<span class="adv-lbl">' + ((APP_ADVERTISERS.find(function(a){return a.id===selectedAdvId;})||{}).name||'Select Advertiser') + '</span>'
    +       CHEVRON
    +     '</button>'
    +     '<div id="cs-adv-panel" style="display:none"></div>'
    +   '</div>'
    + '</div>'
    + '<div>'
    +   '<label style="display:block;font-size:11px;font-weight:500;color:var(--text);margin-bottom:5px">Geography</label>'
    +   '<button style="' + TRIGBTN + ';color:var(--faint)">'
    +     '<span>All regions</span>'
    +     CHEVRON
    +   '</button>'
    + '</div>';
}

// ── Step 2 — Upload Assets ────────────────────────────────────────────────────
function _csStep2Html() {
  return '<div id="cs-assets-col">' + _csAssetsColHtml() + '</div>';
}

function _csAssetsColHtml() {
  var upIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10l-3.1-3.1a2 2 0 0 0-2.814.014L6 21"/><path d="m14 19.5 3-3 3 3"/><path d="M17 22v-5.5"/><circle cx="9" cy="9" r="2"/></svg>';

  // Empty state — full drop zone
  if (CS_UPLOADED_ASSETS.length === 0) {
    return '<div id="cs-dropzone" onclick="csSimulateUpload()" '
      + 'style="border:1.5px dashed var(--border-md);border-radius:10px;padding:28px 14px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:160px;box-sizing:border-box" '
      + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
      + 'onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'">'
      + upIcon
      + '<div>'
      +   '<div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:3px">Drop your assets here</div>'
      +   '<div style="font-size:10px;color:var(--muted)">MP4, MOV, JPG, PNG</div>'
      + '</div>'
      + '<button onclick="event.stopPropagation();csSimulateUpload()" style="display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 12px;border:1px solid var(--border-md);border-radius:7px;font-size:11px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">'
      +   '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
      +   'Browse'
      + '</button>'
      + '</div>';
  }

  // Asset tiles grid
  var tiles = CS_UPLOADED_ASSETS.map(function(a) {
    return '<div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface);position:relative">'
      // Thumbnail
      + '<div style="aspect-ratio:16/9;background:#000;overflow:hidden">'
      +   '<img src="' + a.thumb + '" style="width:100%;height:100%;object-fit:cover;display:block">'
      + '</div>'
      // Type badge
      + '<div style="position:absolute;top:5px;left:5px;font-size:8px;font-weight:700;padding:1px 5px;border-radius:3px;background:rgba(0,0,0,.55);color:#fff;letter-spacing:.3px">' + a.type + '</div>'
      // Remove
      + '<button onclick="csRemoveAsset(\'' + a.id + '\')" style="position:absolute;top:4px;right:4px;width:18px;height:18px;border:none;border-radius:4px;background:rgba(0,0,0,.45);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0" onmouseover="this.style.background=\'#ef4444\'" onmouseout="this.style.background=\'rgba(0,0,0,.45)\'">'
      +   '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      // Filename
      + '<div style="padding:5px 7px 6px">'
      +   '<div style="font-size:10px;font-weight:500;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + a.name + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  // Drop-more zone
  var dropMore =
    '<div id="cs-dropzone" onclick="csSimulateUpload()" '
    + 'ondragover="event.preventDefault();this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
    + 'ondragleave="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'" '
    + 'ondrop="event.preventDefault();csSimulateUpload()" '
    + 'style="border:1.5px dashed var(--border-md);border-radius:8px;padding:12px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;background:var(--bg);display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px" '
    + 'onmouseover="this.style.borderColor=\'var(--accent)\';this.style.background=\'rgba(237,0,94,.025)\'" '
    + 'onmouseout="this.style.borderColor=\'var(--border-md)\';this.style.background=\'var(--bg)\'">'
    +   '<span style="font-size:11px;font-weight:500;color:var(--muted)">Drop more assets</span>'
    +   '<button onclick="event.stopPropagation();csSimulateUpload()" style="height:24px;padding:0 10px;border:1px solid var(--border-md);border-radius:6px;font-size:10px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;transition:border .15s" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border-md)\'">Browse</button>'
    + '</div>';

  var count = '<div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:var(--faint);margin-bottom:8px">'
    + CS_UPLOADED_ASSETS.length + ' asset' + (CS_UPLOADED_ASSETS.length !== 1 ? 's' : '') + ' ready</div>';

  return count
    + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">' + tiles + '</div>'
    + dropMore;
}

function csSimulateUpload() {
  if (CS_UPLOADED_ASSETS.length === 0) {
    CS_UPLOADED_ASSETS = [
      { id:'a1', name:'walmart-ad.mp4', type:'MP4',
        thumb:'https://img.youtube.com/vi/' + CS_TEMPLATE_YT_ID + '/mqdefault.jpg' },
      { id:'a2', name:'walmart-ad.jpg', type:'JPG',
        thumb:'/Asset%20Demo%20K1/walmart-ad.jpg', src:'/Asset%20Demo%20K1/walmart-ad.jpg' },
    ];
  }
  var col = document.getElementById('cs-assets-col');
  if (col) col.innerHTML = _csAssetsColHtml();
}

function csRemoveAsset(id) {
  CS_UPLOADED_ASSETS = CS_UPLOADED_ASSETS.filter(function(a){ return a.id !== id; });
  var col = document.getElementById('cs-assets-col');
  if (col) col.innerHTML = _csAssetsColHtml();
}

function _csInitDropzone() {
  var dz = document.getElementById('cs-dropzone');
  if (!dz) return;
  dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.style.borderColor='var(--accent)'; dz.style.background='#fdf2f8'; });
  dz.addEventListener('dragleave', function() { dz.style.borderColor='var(--border-md)'; dz.style.background='var(--surface)'; });
  dz.addEventListener('drop', function(e) { e.preventDefault(); csSimulateUpload(); });
}

// ── Main render ───────────────────────────────────────────────────────────────
function csRenderNewCreative() {
  var body = document.getElementById('cs-body');
  if (!body) return;

  body.innerHTML =
    '<div style="background:linear-gradient(160deg,#fef6fb 0%,var(--surface) 65%);border-radius:10px;padding:28px 32px;display:flex;flex-direction:column">'
    // Header
    + '<div style="text-align:center;margin-bottom:16px">'
    +   '<div style="font-size:15px;font-weight:700;color:#0D1E36;margin-bottom:4px">Creative Studio</div>'
    +   '<div style="font-size:11px;color:var(--muted)">Upload your asset and apply contextual templates across CTV, Web and Mobile.</div>'
    + '</div>'
    // Stepper card
    + '<div style="max-width:520px;width:100%;margin:0 auto;flex:1;display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">'
    +   '<div id="cs-step-hdr">' + _csStepHdrHtml() + '</div>'
    +   '<div style="padding:24px 28px;flex:1">'
    +     '<div id="cs-step1">' + _csStep2Html() + '</div>'
    +     '<div id="cs-step2" style="display:none">' + _csStep1Html() + '</div>'
    +   '</div>'
    +   '<div id="cs-step-nav">' + _csStepNavHtml() + '</div>'
    + '</div>'
    + '</div>';
}

// ── Open editor from library ──────────────────────────────────────────────────
function csLibOpenEditor(crId) {
  var cr = CS_LIBRARY.filter(function(c) { return c.id === crId; })[0];
  if (!cr) return;

  // Load all assets from the same campaign (or just this one if unassigned)
  var group = cr.campaign
    ? CS_LIBRARY.filter(function(c) { return c.campaign === cr.campaign; })
    : [cr];

  // Map to editor asset format — include assetLink as src so the builder uses the real URL
  CS_UPLOADED_ASSETS = group.map(function(c) {
    return { id: c.id, name: c.name, type: c.fileType, thumb: c.thumb,
             src: c.assetLink || '', assetType: c.assetType || '',
             templates: (c.templates || []).slice() };
  });

  // Pre-fill campaign name for breadcrumb
  csCampaignName = cr.campaign || '';

  // Open editor with the clicked asset selected
  var idx = 0;
  group.forEach(function(c, i) { if (c.id === crId) idx = i; });
  csBuildTemplates(idx);
}

// ── Creative Library DB loader ────────────────────────────────────────────────
function csLoadLibraryFromDB() {
  var qs = (typeof _appIsSuperOrg === 'function' && !_appIsSuperOrg() && typeof selectedClientOrgId !== 'undefined' && selectedClientOrgId)
    ? '?client_org_id=' + selectedClientOrgId
    : '';
  fetch('/api/creatives' + qs)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data.creatives) return;
      // Keep only entries added in this session (savedAt set), replace rest with DB data
      var sessionSaved = CS_LIBRARY.filter(function(c) { return c.savedAt; });
      CS_LIBRARY = data.creatives.concat(sessionSaved);
      csRenderLibrary();
    })
    .catch(function(e) { console.warn('creatives API unavailable:', e.message); });
}

// ── Creative Library ──────────────────────────────────────────────────────────
function csRenderLibrary() {
  var body = document.getElementById('cs-body');
  if (!body) return;

  if (CS_LIBRARY.length === 0) {
    body.innerHTML = UI.cardHeader({
      title: 'Creative Library', subtitle: '0 creatives', padding: '40px 24px',
      bodyHtml: '<div style="text-align:center;color:var(--faint);font-size:13px">No creatives yet. Start by creating a new creative.</div>',
    });
    return;
  }

  // Sort: newly saved items first, then campaign rows grouped alphabetically, no-campaign last
  var sorted = CS_LIBRARY.slice().sort(function(a, b) {
    if (a.savedAt && !b.savedAt) return -1;
    if (!a.savedAt && b.savedAt) return  1;
    if (a.savedAt && b.savedAt) return b.savedAt - a.savedAt;
    if (a.campaign && !b.campaign) return -1;
    if (!a.campaign && b.campaign) return  1;
    if (a.campaign && b.campaign && a.campaign !== b.campaign) return a.campaign < b.campaign ? -1 : 1;
    return 0;
  });

  var BADGE = 'font-size:9px;font-weight:600;border-radius:4px;padding:2px 7px;border:1px solid;white-space:nowrap';
  var TD    = 'padding:10px 16px;vertical-align:middle;border-bottom:1px solid var(--border)';

  // Icon button: accent + subtle bg on hover, csEditorTooltip, optional onclick
  function iconBtn(svgPath, tooltip, onclick) {
    var base = 'width:28px;height:28px;border:none;background:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);transition:background .12s,color .12s';
    var svg  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + svgPath + '</svg>';
    var tip  = tooltip.replace(/'/g, "\\'");
    var clickAttr = onclick ? ' onclick="' + onclick + '"' : '';
    return '<button' + clickAttr + ' style="' + base + '" '
      + 'onmouseover="this.style.background=\'var(--subtle)\';this.style.color=\'var(--accent)\';csEditorTooltip(this,\'' + tip + '\',true)" '
      + 'onmouseout="this.style.background=\'none\';this.style.color=\'var(--muted)\';csEditorTooltip(this,\'\',false)">'
      + svg + '</button>';
  }

  var rows = sorted.map(function(cr) {
    var thumb = '<td style="' + TD + ';padding-right:6px;width:60px">'
      + '<div style="width:56px;height:32px;border-radius:4px;overflow:hidden;background:#e5e7eb">'
      + '<img src="' + (cr.thumb||'') + '" style="width:100%;height:100%;object-fit:cover;display:block"></div></td>';

    var _crName = (cr.name||'—');
    var _crNameDisplay = _crName.length > 92 ? _crName.slice(0, 92) + '…' : _crName;
    var name = '<td style="' + TD + '">'
      + '<div style="font-weight:600;color:var(--text);font-size:12px" title="' + _crName.replace(/"/g,'&quot;') + '">' + _crNameDisplay + '</div>'
      + '<div style="font-size:10px;color:var(--faint);margin-top:2px">' + (cr.fileType||'') + '</div></td>';

    var adv = '<td style="' + TD + ';font-size:12px">' + (cr.advertiser||'—') + '</td>';

    var client = '<td style="' + TD + ';font-size:12px;color:var(--muted)">' + (cr.client||'—') + '</td>';

    var crIdSafe0 = cr.id.replace(/'/g, "\\'");
    var camp = '<td style="' + TD + ';font-size:12px" onclick="event.stopPropagation()">'
      + (cr.campaign
          ? '<span style="color:var(--text)">' + cr.campaign + '</span>'
          : '<button onclick="event.stopPropagation()" style="border:none;background:none;padding:0;cursor:pointer;font-size:11px;font-weight:500;color:var(--accent);font-family:inherit;white-space:nowrap;transition:opacity .12s" onmouseover="this.style.opacity=\'.7\'" onmouseout="this.style.opacity=\'1\'">+ Add Campaign</button>')
      + '</td>';

    var mtStyle = cr.mediaType === 'CTV' ? 'color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe'
                : cr.mediaType === 'Web' ? 'color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe'
                :                          'color:#0369a1;background:#f0f9ff;border-color:#bae6fd';
    var mt = '<td style="' + TD + '"><span style="' + BADGE + ';' + mtStyle + '">' + (cr.mediaType||'—') + '</span></td>';

    var tpls = (cr.templates && cr.templates.length)
      ? cr.templates.map(function(t) {
          return '<span style="' + BADGE + ';color:#e11d8f;background:#fdf2f8;border-color:#f9a8d4;margin-right:3px">' + (t.name || t) + '</span>';
        }).join('')
      : '<span style="font-size:11px;color:var(--faint)">—</span>';
    var tpl = '<td style="' + TD + '">' + tpls + '</td>';

    var date = '<td style="' + TD + ';color:var(--muted);font-size:11px">' + (cr.date||'—') + '</td>';

    var crIdSafe = crIdSafe0;
    var actions = '<td style="' + TD + ';padding-right:8px;text-align:right;white-space:nowrap" onclick="event.stopPropagation()">'
      + iconBtn('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>', 'Delete', 'csDeleteCreative(\'' + crIdSafe + '\')')
      + '</td>';

    return '<tr style="cursor:pointer" onclick="csLibOpenEditor(\'' + crIdSafe + '\')" onmouseover="this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'\'">'
      + thumb + name + camp + adv + client + mt + tpl + date + actions + '</tr>';
  }).join('');

  var cols = [
    { label: '',            width: '60px'  },
    { label: 'Creative'                    },
    { label: 'Campaign',    width: '180px' },
    { label: 'Advertiser',  width: '130px' },
    { label: 'Client',      width: '130px' },
    { label: 'Media',       width: '80px'  },
    { label: 'Templates'                   },
    { label: 'Date',        width: '110px' },
    { label: '',            width: '70px',  align: 'right' },
  ];

  var searchBar = '<div style="padding:12px 16px;border-bottom:1px solid var(--border)">'
    + '<div style="position:relative;max-width:320px">'
    + '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    + '<input id="cs-lib-search" type="text" placeholder="Search creatives, campaigns, advertisers…" oninput="csLibSearch(this.value)" style="width:100%;height:32px;border:1px solid var(--border-md);border-radius:8px;padding:0 10px 0 30px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .12s" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    + '</div></div>';

  body.innerHTML = UI.cardHeader({
    title: 'Creative Library',
    subtitle: CS_LIBRARY.length + ' creative' + (CS_LIBRARY.length !== 1 ? 's' : ''),
    padding: '0',
    bodyHtml: searchBar + UI.tableScroll(cols, rows, 'cs-lib-tbody', 0, null, { inCard: true }),
  });
}

function csDeleteCreative(id) {
  var cr = CS_LIBRARY.find(function(c) { return c.id === id; });
  if (!cr) return;
  if (!confirm('Delete "' + (cr.name || 'this creative') + '"? This cannot be undone.')) return;

  // If it's a DB creative, call the API first
  if (cr.dbId) {
    fetch('/api/creatives?creative_id=' + cr.dbId, { method: 'DELETE' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) { alert('Error: ' + data.error); return; }
        CS_LIBRARY = CS_LIBRARY.filter(function(c) { return c.id !== id; });
        csRenderLibrary();
      })
      .catch(function(e) { alert('Delete failed: ' + e.message); });
  } else {
    // Session-only creative — remove locally
    CS_LIBRARY = CS_LIBRARY.filter(function(c) { return c.id !== id; });
    csRenderLibrary();
  }
}

function csLibSearch(q) {
  var term = (q || '').toLowerCase().trim();
  var rows = document.querySelectorAll('#cs-lib-tbody tr');
  rows.forEach(function(tr) {
    tr.style.display = (!term || tr.textContent.toLowerCase().indexOf(term) >= 0) ? '' : 'none';
  });
}

// ── Brief Library DB loader ───────────────────────────────────────────────────
function csLoadBriefLibraryFromDB() {
  var qs = (typeof _appIsSuperOrg === 'function' && !_appIsSuperOrg() && typeof selectedClientOrgId !== 'undefined' && selectedClientOrgId)
    ? '?client_org_id=' + selectedClientOrgId
    : '';
  fetch('/api/moments-match' + qs)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var analyses = data.analyses || data || [];
      BRIEF_LIBRARY = analyses.filter(function(a) {
        var t = (a.asset_type || a.creative_asset_type || '').toLowerCase();
        return t === 'brief' || t === 'text' || t === 'doc' || t === 'document';
      });
      csRenderBriefLibrary();
    })
    .catch(function(e) { console.warn('moments-match API unavailable:', e.message); });
}

// ── Brief Library ─────────────────────────────────────────────────────────────
function csRenderBriefLibrary() {
  var body = document.getElementById('cs-body');
  if (!body) return;

  if (BRIEF_LIBRARY.length === 0) {
    body.innerHTML = UI.cardHeader({
      title: 'Brief Library', subtitle: '0 briefs',  padding: '40px 24px',
      bodyHtml: '<div style="text-align:center;color:var(--faint);font-size:13px">No briefs yet. Run a Moments Match analysis using a brief or document to populate this library.</div>',
    });
    return;
  }

  var BADGE = 'font-size:9px;font-weight:600;border-radius:4px;padding:2px 7px;border:1px solid;white-space:nowrap';
  var TD    = 'padding:10px 16px;vertical-align:middle;border-bottom:1px solid var(--border)';

  // Icon for brief type
  function briefTypeIcon(type) {
    var t = (type || '').toLowerCase();
    if (t === 'doc' || t === 'document') {
      return '<div style="width:56px;height:32px;display:flex;align-items:center;justify-content:center">'
        + '<div style="width:32px;height:32px;border-radius:6px;background:rgba(3,105,161,.12);display:flex;align-items:center;justify-content:center">'
        + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
        + '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'
        + '</svg></div></div>';
    }
    return '<div style="width:56px;height:32px;display:flex;align-items:center;justify-content:center">'
      + '<div style="width:32px;height:32px;border-radius:6px;background:rgba(124,58,237,.12);display:flex;align-items:center;justify-content:center">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>'
      + '</svg></div></div>';
  }

  // Badge for media type column
  function briefTypeBadge(type) {
    var t = (type || '').toLowerCase();
    if (t === 'doc' || t === 'document') {
      return '<span style="' + BADGE + ';color:#0369a1;background:#f0f9ff;border-color:#bae6fd">Document</span>';
    }
    return '<span style="' + BADGE + ';color:#7c3aed;background:#f5f3ff;border-color:#ddd6fe">Brief</span>';
  }

  var sorted = BRIEF_LIBRARY.slice().sort(function(a, b) {
    var na = (a.moments_match_analysis_name || a.name || '').toLowerCase();
    var nb = (b.moments_match_analysis_name || b.name || '').toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });

  var rows = sorted.map(function(item) {
    var assetType = item.asset_type || item.creative_asset_type || 'brief';
    var itemName  = item.moments_match_analysis_name || item.name || '—';
    var itemNameDisplay = itemName.length > 92 ? itemName.slice(0, 92) + '…' : itemName;

    var thumb = '<td style="' + TD + ';padding-right:6px;width:60px">' + briefTypeIcon(assetType) + '</td>';

    var name = '<td style="' + TD + '">'
      + '<div style="font-weight:600;color:var(--text);font-size:12px" title="' + itemName.replace(/"/g,'&quot;') + '">' + itemNameDisplay + '</div>'
      + (item.brief ? '<div style="font-size:10px;color:var(--faint);margin-top:2px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + item.brief.slice(0, 120) + '</div>' : '')
      + '</td>';

    var camp = '<td style="' + TD + ';font-size:12px">' + (item.campaign_name || item.campaign || '—') + '</td>';

    var adv  = '<td style="' + TD + ';font-size:12px">' + (item.advertiser_name || item.advertiser || '—') + '</td>';

    var client = '<td style="' + TD + ';font-size:12px;color:var(--muted)">' + (item.client_name || item.client || '—') + '</td>';

    var mt = '<td style="' + TD + '">' + briefTypeBadge(assetType) + '</td>';

    var moments = item.moments
      ? '<span style="font-size:11px;color:var(--text);font-weight:500">' + (Array.isArray(item.moments) ? item.moments.length : '—') + ' moments</span>'
      : '<span style="font-size:11px;color:var(--faint)">—</span>';
    var mom = '<td style="' + TD + '">' + moments + '</td>';

    var dateVal = item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : (item.date || '—');
    var date = '<td style="' + TD + ';color:var(--muted);font-size:11px">' + dateVal + '</td>';

    var itemId = item.moments_match_analysis_id;
    var actions = '<td style="' + TD + ';padding-right:8px;text-align:right;white-space:nowrap" onclick="event.stopPropagation()">'
      + '<button onclick="event.stopPropagation();csDeleteBrief(' + itemId + ')" style="width:28px;height:28px;border:none;background:none;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:var(--muted);transition:background .12s,color .12s" onmouseover="this.style.background=\'var(--subtle)\';this.style.color=\'var(--accent)\'" onmouseout="this.style.background=\'none\';this.style.color=\'var(--muted)\'">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>'
      + '</button></td>';

    var idxSafe = JSON.stringify(item).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return '<tr style="cursor:pointer" onclick="csOpenBriefItem(' + itemId + ')" onmouseover="this.style.background=\'var(--hover)\'" onmouseout="this.style.background=\'\'">'
      + thumb + name + camp + adv + client + mt + mom + date + actions + '</tr>';
  }).join('');

  var cols = [
    { label: '',           width: '60px'  },
    { label: 'Brief / Doc'               },
    { label: 'Campaign',   width: '160px' },
    { label: 'Advertiser', width: '130px' },
    { label: 'Client',     width: '130px' },
    { label: 'Type',       width: '100px' },
    { label: 'Moments',    width: '100px' },
    { label: 'Date',       width: '110px' },
    { label: '',           width: '50px',  align: 'right' },
  ];

  var searchBar = '<div style="padding:12px 16px;border-bottom:1px solid var(--border)">'
    + '<div style="position:relative;max-width:320px">'
    + '<svg style="position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>'
    + '<input id="cs-brief-search" type="text" placeholder="Search briefs, campaigns, advertisers…" oninput="csBriefSearch(this.value)" style="width:100%;height:32px;border:1px solid var(--border-md);border-radius:8px;padding:0 10px 0 30px;font-size:12px;font-family:inherit;color:var(--text);background:var(--surface);outline:none;box-sizing:border-box;transition:border-color .12s" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'var(--border-md)\'">'
    + '</div></div>';

  body.innerHTML = UI.cardHeader({
    title: 'Brief Library',
    subtitle: BRIEF_LIBRARY.length + ' brief' + (BRIEF_LIBRARY.length !== 1 ? 's' : ''),
    padding: '0',
    bodyHtml: searchBar + UI.tableScroll(cols, rows, 'cs-brief-tbody', 0, null, { inCard: true }),
  });
}

function csOpenBriefItem(id) {
  var item = BRIEF_LIBRARY.find(function(i) { return i.moments_match_analysis_id === id; });
  if (!item) return;
  var t = (item.asset_type || '').toLowerCase();
  if (t === 'doc' || t === 'document') {
    csOpenDocModal(item);
  } else {
    csOpenBriefModal(item);
  }
}

function csOpenBriefModal(item) {
  var title = item.moments_match_analysis_name || 'Brief';
  var text  = item.brief || '';
  var overlay = document.createElement('div');
  overlay.id = 'cs-brief-view-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;opacity:0;transition:opacity .18s ease';
  overlay.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;width:100%;max-width:680px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.22);font-family:inherit;transform:translateY(6px);transition:transform .2s ease">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border);flex-shrink:0">'
    +   '<div>'
    +     '<div style="font-size:14px;font-weight:600;color:var(--text)">' + title.replace(/</g,'&lt;') + '</div>'
    +     (item.campaign_name ? '<div style="font-size:11px;color:var(--muted);margin-top:2px">' + item.campaign_name + (item.advertiser_name ? ' · ' + item.advertiser_name : '') + '</div>' : '')
    +   '</div>'
    +   '<button type="button" onclick="document.getElementById(\'cs-brief-view-overlay\').remove()" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--muted);line-height:1;border-radius:4px" onmouseenter="this.style.color=\'var(--text)\'" onmouseleave="this.style.color=\'var(--muted)\'">'
    +     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +   '</button>'
    + '</div>'
    + '<div style="flex:1;overflow-y:auto;padding:24px;font-size:13px;line-height:1.75;color:var(--text);white-space:pre-wrap">' + text.replace(/</g,'&lt;') + '</div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  requestAnimationFrame(function() {
    overlay.style.opacity = '1';
    var inner = overlay.querySelector('div');
    if (inner) inner.style.transform = 'translateY(0)';
  });
}

function csOpenDocModal(item) {
  var title   = item.moments_match_analysis_name || item.doc || 'Document';
  var docName = item.doc || 'document.pdf';
  var overlay = document.createElement('div');
  overlay.id = 'cs-brief-view-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;opacity:0;transition:opacity .18s ease';
  overlay.innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;width:100%;max-width:820px;height:88vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.22);font-family:inherit;transform:translateY(6px);transition:transform .2s ease">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid var(--border);flex-shrink:0;gap:12px">'
    +   '<div style="display:flex;align-items:center;gap:10px;min-width:0">'
    +     '<div style="width:30px;height:30px;border-radius:6px;background:rgba(3,105,161,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">'
    +       '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    +     '</div>'
    +     '<div style="min-width:0">'
    +       '<div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + title.replace(/</g,'&lt;') + '</div>'
    +       '<div style="font-size:11px;color:var(--muted);margin-top:1px">' + docName + '</div>'
    +     '</div>'
    +   '</div>'
    +   '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'
    +     '<a href="#" download="' + docName + '" onclick="event.preventDefault()" style="display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 14px;border:1px solid var(--border-md);border-radius:8px;font-size:12px;font-weight:500;color:var(--text);background:var(--surface);cursor:pointer;font-family:inherit;text-decoration:none;transition:border .13s" onmouseenter="this.style.borderColor=\'var(--accent)\';this.style.color=\'var(--accent)\'" onmouseleave="this.style.borderColor=\'var(--border-md)\';this.style.color=\'var(--text)\'">'
    +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    +       'Download'
    +     '</a>'
    +     '<button type="button" onclick="document.getElementById(\'cs-brief-view-overlay\').remove()" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--muted);line-height:1;border-radius:4px" onmouseenter="this.style.color=\'var(--text)\'" onmouseleave="this.style.color=\'var(--muted)\'">'
    +       '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +     '</button>'
    +   '</div>'
    + '</div>'
    + '<div style="flex:1;background:#f3f4f6;position:relative;border-radius:0 0 14px 14px;overflow:hidden">'
    +   '<iframe src="about:blank" style="width:100%;height:100%;border:none;display:block"></iframe>'
    +   '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;pointer-events:none">'
    +     '<div style="width:56px;height:56px;border-radius:12px;background:rgba(3,105,161,.1);display:flex;align-items:center;justify-content:center">'
    +       '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0369a1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>'
    +     '</div>'
    +     '<div style="text-align:center">'
    +       '<div style="font-size:13px;font-weight:600;color:#374151">' + docName + '</div>'
    +       '<div style="font-size:12px;color:#9ca3af;margin-top:4px">Document preview will appear here once the file is uploaded</div>'
    +     '</div>'
    +   '</div>'
    + '</div>'
    + '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  requestAnimationFrame(function() {
    overlay.style.opacity = '1';
    var inner = overlay.querySelector('div');
    if (inner) inner.style.transform = 'translateY(0)';
  });
}

function csDeleteBrief(id) {
  if (!id) return;
  if (!confirm('Delete this brief? This cannot be undone.')) return;
  fetch('/api/moments-match?moments_match_analysis_id=' + id, { method: 'DELETE' })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) { alert('Error: ' + data.error); return; }
      BRIEF_LIBRARY = BRIEF_LIBRARY.filter(function(i) { return i.moments_match_analysis_id !== id; });
      csRenderBriefLibrary();
    })
    .catch(function(e) { alert('Delete failed: ' + e.message); });
}

function csBriefSearch(q) {
  var term = (q || '').toLowerCase().trim();
  var rows = document.querySelectorAll('#cs-brief-tbody tr');
  rows.forEach(function(tr) {
    tr.style.display = (!term || tr.textContent.toLowerCase().indexOf(term) >= 0) ? '' : 'none';
  });
}
