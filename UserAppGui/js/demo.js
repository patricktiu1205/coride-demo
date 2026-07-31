// CoRide App Demo - Screen Navigation
let currentScreen = 'scr1';
let navHistory = [];
let autoTimer = null;

function goToScreen(id, addToHistory, isBack) {
  if (addToHistory === undefined) addToHistory = true;
  if (isBack === undefined) isBack = false;

  // Clear any pending auto-advance timer
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }

  // Push current screen to history before changing
  if (addToHistory && currentScreen !== id) {
    navHistory.push(currentScreen);
    if (navHistory.length > 30) navHistory.shift();
  }

  // Transition: briefly add .back class for reverse animations
  var oldScreenEl = document.getElementById(currentScreen);
  if (oldScreenEl && isBack) oldScreenEl.classList.add('back');
  setTimeout(function() {
    if (oldScreenEl) oldScreenEl.classList.remove('back');
  }, 250);

  // Switch screen
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    currentScreen = id;
  }

  // Update bottom nav highlights
  updateBottomNav(id);

  // Auto-advance: scr3 (matching) to scr4 (pre-trip) after 3 seconds
  if (id === 'scr3') {
    autoTimer = setTimeout(function() {
      if (currentScreen === 'scr3') goToScreen('scr4');
    }, 3000);
  }

  // Voice screen: simulate transcription then auto-advance to matching
  if (id === 'scrVoice') {
    var voiceTextEl = document.getElementById('voiceText');
    var voicePulseEl = document.getElementById('voicePulse');
    // After 0.5s, show first transcription
    autoTimer = setTimeout(function() {
      if (voiceTextEl) voiceTextEl.textContent = '去...广州南站';
    }, 600);
    // After 1.2s, full transcription
    autoTimer = setTimeout(function() {
      if (voiceTextEl) { voiceTextEl.textContent = '去广州南站'; voiceTextEl.style.color = '#27ae60'; }
    }, 1200);
    // After 2s, advance to matching (replace voice page in history)
    autoTimer = setTimeout(function() {
      if (currentScreen === 'scrVoice') {
        goToScreen('scr3');
        // Pop voice from history so back from scr3 goes to scr2
        if (navHistory.length > 0 && navHistory[navHistory.length-1] === 'scrVoice') {
          navHistory.pop();
        }
      }
    }, 2200);
  }
}

// Go back one step in history
function goBack() {
  if (navHistory.length > 0) {
    var prev = navHistory.pop();
    goToScreen(prev, false, true);
  }
}

// Check if there's a previous screen to go back to
function canGoBack() {
  return navHistory.length > 0;
}

function updateBottomNav(id) {
  document.querySelectorAll('.bottom-nav .ni').forEach(function(n) { n.classList.remove('active'); });
  // Screen 2 = home tab active, Screen 6 & trip screens = trips tab active, Screen 7 & addr edit = profile tab active
  var tabMap = { 'scr2': 0, 'scr6': 1, 'scrTripList': 1, 'scrTripDetail': 1, 'scr7': 2, 'scrAddrEdit': 2 };
  var tabIdx = tabMap[id];
  if (tabIdx !== undefined) {
    var allNavs = document.querySelectorAll('.bottom-nav .ni');
    // Find nav items inside the active screen or globally
    var screenEl = document.getElementById(id);
    if (screenEl) {
      var navs = screenEl.querySelectorAll('.bottom-nav .ni');
      if (navs.length > tabIdx) navs[tabIdx].classList.add('active');
    }
  }
}

// --- Onboarding flow ---
var onboardStep = 1;
var audioPref = 'music'; // 'music', 'quiet', 'radio'

function setAudioPref(type) {
  audioPref = type;
}

function hideAllOnboard() {
  var allSteps = ['onboardStep1','onboardStep2','onboardStep3','onboardStep4','onboardStep4b','onboardStep5'];
  allSteps.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showOnboard(id) {
  var el = document.getElementById(id);
  if (el) el.style.display = '';
}

function nextOnboard(step) {
  onboardStep = step;

  // Branching: step 3 → check audioPref to determine real target
  if (step === 4 && audioPref === 'quiet') {
    // Quiet mode: skip to completion
    step = 5;
  }
  if (step === 4 && audioPref === 'radio') {
    // Radio: go to station picker
    step = '4b';
  }
  // step === 4 with audioPref === 'music' stays at step 4

  hideAllOnboard();

  if (step === '4b') {
    onboardStep = '4b';
    showOnboard('onboardStep4b');
  } else {
    onboardStep = step;
    showOnboard('onboardStep' + step);
  }

  // Show/hide back button in nav bar
  var backBtn = document.getElementById('onboardBackBtn');
  if (backBtn) backBtn.style.display = (onboardStep !== 1) ? '' : 'none';

  // Update step description for step 5
  if (step === 5) {
    var label = document.getElementById('doneAudioLabel');
    if (label) {
      if (audioPref === 'quiet') label.textContent = '安静模式';
      else if (audioPref === 'radio') label.textContent = '听电台';
      else label.textContent = '古典音乐';
    }
  }
}

function prevOnboard() {
  var cur = onboardStep;
  if (cur === 1) return;

  // From completion (5), go back based on audioPref
  if (cur === 5) {
    if (audioPref === 'quiet') {
      nextOnboard(3);
    } else if (audioPref === 'radio') {
      hideAllOnboard(); showOnboard('onboardStep4b'); onboardStep = '4b';
    } else {
      nextOnboard(4);
    }
    return;
  }

  // From music style (4) or radio station (4b), go back to step 3
  if (cur === 4 || cur === '4b') {
    nextOnboard(3);
    return;
  }

  // Standard: go to previous step
  nextOnboard(cur - 1);
}

function pickCh(el) {
  var parent = el.parentElement;
  if (parent) {
    parent.querySelectorAll('.ch').forEach(function(c) { c.classList.remove('picked'); });
    el.classList.add('picked');
  }
}

// --- Platform multi-select & price update (screen 2) ---
function togglePlatform(chip) {
  chip.classList.toggle('on');
  updatePrice();
}

function updatePrice() {
  var chips = document.querySelectorAll('#platformChips .platform-chip.on');
  var prices = [];
  chips.forEach(function(c) { prices.push(parseFloat(c.getAttribute('data-price'))); });
  var priceTag = document.getElementById('priceTag');
  var callPrice = document.getElementById('callPrice');

  if (prices.length === 0) {
    if (priceTag) priceTag.textContent = '请至少选择一个运营商';
    if (callPrice) callPrice.textContent = '请选择运营商';
    return;
  }

  var min = Math.min.apply(null, prices).toFixed(2);
  var max = Math.max.apply(null, prices).toFixed(2);
  var range = min === max ? ('¥' + min) : ('¥' + min + '-' + max);

  if (priceTag) priceTag.textContent = '预估 ' + range + ' · 最快 2.3 分钟';
  if (callPrice) callPrice.textContent = '预估 ' + range;
}

function callRide() {
  var selected = document.querySelectorAll('#platformChips .platform-chip.on');
  if (selected.length === 0) return;
  goToScreen('scr3');
}

function setDest(addr) {
  var destInput = document.querySelector('#scr2 .input-row input');
  if (destInput) {
    destInput.value = addr;
    destInput.style.color = '#333';
  }
}

// --- Inline Expand/Collapse (Profile) ---
function toggleExpand(el) {
  el.classList.toggle('expanded');
}

// --- Temperature Slider (inline) ---
function updateTemp(val) {
  var d = document.getElementById('tempDisplay');
  if (d) d.textContent = val + '°C';
  var s = document.getElementById('tempSlider');
  if (s) s.setAttribute('value', val);
  var p = document.getElementById('prefTemp');
  if (p) p.innerHTML = val + '°C <span class="arrow">▾</span>';
}

// --- Music Style (inline) ---
function pickMusic(style, el) {
  var panel = el.parentElement;
  panel.querySelectorAll('.ep-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  panel.querySelectorAll('.ep-opt .check').forEach(function(c) { c.remove(); });
  var chk = document.createElement('span'); chk.className = 'check'; chk.textContent = '✓';
  el.appendChild(chk);
  var p = document.getElementById('prefMusic');
  if (p) p.innerHTML = style + ' <span class="arrow">▾</span>';
}

// --- Volume / Interaction Detail (inline) ---
function pickVolume(level, el) {
  var panel = el.parentElement;
  panel.querySelectorAll('.tt-opt').forEach(function(o) { o.classList.remove('active'); });
  el.classList.add('active');
  var descMap = {
    '详细': '全程讲解驾驶决策、路况分析与推荐理由',
    '标准': '仅在关键节点（转弯、拥堵、到达）播报',
    '静音': '全程静音，仅保留安全警报'
  };
  var descDiv = panel.parentElement.querySelector('.vol-desc');
  if (descDiv) descDiv.textContent = descMap[level] || '';
  var p = document.getElementById('prefVolume');
  if (p) p.innerHTML = level + ' <span class="arrow">▾</span>';
}

// --- Address Editor (navigate to separate page) ---
var editingAddr = { name: '', detail: '' };

function openAddrEditor(name, detail) {
  editingAddr.name = name;
  editingAddr.detail = detail;
  // Pre-fill the inputs when screen becomes visible
  setTimeout(function() {
    var n = document.getElementById('addrEditName');
    var d = document.getElementById('addrEditDetail');
    if (n) n.value = editingAddr.name;
    if (d) d.value = editingAddr.detail;
  }, 50);
  goToScreen('scrAddrEdit');
}

function saveAddrAndBack() {
  var nameEl = document.getElementById('addrEditName');
  var detailEl = document.getElementById('addrEditDetail');
  if (!nameEl || !detailEl) return;
  var name = nameEl.value || editingAddr.name;
  var detail = detailEl.value || editingAddr.detail;
  // Update the display in the collapsed list (find by data-name or just refresh)
  goBack();
}

console.log('CoRide App Demo ready - 10 screens v4');

