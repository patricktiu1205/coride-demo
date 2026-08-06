// CoRide App Demo - Screen Navigation
let currentScreen = 'scr1';
let navHistory = [];
let autoTimer = null;
let lastVoiceDest = '';

function goToScreen(id, addToHistory, isBack) {
  if (addToHistory === undefined) addToHistory = true;
  if (isBack === undefined) isBack = false;
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
  if (addToHistory && currentScreen !== id) {
    navHistory.push(currentScreen);
    if (navHistory.length > 30) navHistory.shift();
  }
  var oldScreenEl = document.getElementById(currentScreen);
  if (oldScreenEl && isBack) oldScreenEl.classList.add('back');
  setTimeout(function() {
    if (oldScreenEl) oldScreenEl.classList.remove('back');
  }, 250);
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var target = document.getElementById(id);
  if (target) { target.classList.add('active'); currentScreen = id; }
  updateBottomNav(id);
  if (id === 'scr2' && lastVoiceDest) {
    var destInput = document.querySelector('#scr2 .input-row input');
    if (destInput) { destInput.value = lastVoiceDest; destInput.style.color = '#333'; }
  }
  if (id === 'scr3') {
    runMatchSequence();
  }
  if (id === 'scr5') {
    startRideAnimation();
  }
  if (id === 'scr6') {
    hideRideFloat();
  }
  if (id === 'scrVoice') {
    var voiceTextEl = document.getElementById('voiceText');
    autoTimer = setTimeout(function() {
      if (voiceTextEl) voiceTextEl.textContent = '...广州南站';
    }, 600);
    autoTimer = setTimeout(function() {
      if (voiceTextEl) { voiceTextEl.textContent = '去广州南站'; voiceTextEl.style.color = '#27ae60'; }
      lastVoiceDest = '广州南站';
    }, 1200);
    autoTimer = setTimeout(function() {
      if (currentScreen === 'scrVoice') {
        goToScreen('scr3');
        if (navHistory.length > 0 && navHistory[navHistory.length-1] === 'scrVoice') { navHistory.pop(); }
      }
    }, 2200);
  }
}

function goBack() {
  if (navHistory.length > 0) { var prev = navHistory.pop(); goToScreen(prev, false, true); }
}

function updateBottomNav(id) {
  document.querySelectorAll('.bottom-nav .ni').forEach(function(n) { n.classList.remove('active'); });
  var tabMap = { 'scr2': 0, 'scr6': 1, 'scrTripList': 1, 'scrTripDetail': 1, 'scrExplore': 2, 'scr7': 3, 'scrMember': 3, 'scrPrefTemp': 3, 'scrPrefMusic': 3, 'scrPrefAddr': 3, 'scrPrefConsumer': 3, 'scrPrefVolume': 3, 'scrAddrEdit': 3, 'scrAddrNew': 3, 'scrCarbon': 3, 'scrFamily': 3, 'scrAnnual': 3, 'scrPrivacy': 3, 'scrAbout': 3 };
  var tabIdx = tabMap[id];
  if (tabIdx !== undefined) {
    var screenEl = document.getElementById(id);
    if (screenEl) {
      var navs = screenEl.querySelectorAll('.bottom-nav .ni');
      if (navs.length > tabIdx) navs[tabIdx].classList.add('active');
    }
  }
}

// --- Onboarding flow ---
var onboardStep = 1;
var audioPref = 'music';

function setAudioPref(type) { audioPref = type; }

function hideAllOnboard() {
  ['onboardStep1','onboardStep2','onboardStep3','onboardStep4','onboardStep4b','onboardStep5','onboardStep6','onboardStep7'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.style.display = 'none';
  });
}

function showOnboard(id) {
  var el = document.getElementById(id); if (el) el.style.display = '';
}

function nextOnboard(step) {
  if (step === 4 && audioPref === 'quiet') step = 5;
  if (step === 4 && audioPref === 'radio') step = '4b';
  hideAllOnboard();
  if (step === '4b') { onboardStep = '4b'; showOnboard('onboardStep4b'); }
  else { onboardStep = step; showOnboard('onboardStep' + step); }
  var backBtn = document.getElementById('onboardBackBtn');
  if (backBtn) backBtn.style.display = (onboardStep === 1) ? 'none' : '';
}

function prevOnboard() {
  var cur = onboardStep;
  if (cur === 1) return;
  if (cur === 7) { nextOnboard(6); return; }
  if (cur === 6) { nextOnboard(5); return; }
  if (cur === 5) {
    if (audioPref === 'quiet') { nextOnboard(3); }
    else if (audioPref === 'radio') { hideAllOnboard(); showOnboard('onboardStep4b'); onboardStep = '4b'; }
    else { nextOnboard(4); }
    return;
  }
  if (cur === 4 || cur === '4b') { nextOnboard(3); return; }
  nextOnboard(cur - 1);
}

function pickCh(el) {
  var parent = el.parentElement;
  if (parent) {
    parent.querySelectorAll('.ch').forEach(function(c) { c.classList.remove('picked'); });
    el.classList.add('picked');
  }
}

// --- In-Ride Agent ---
var rideAnimTimer = null;
var rideProgressVal = 10;
var rideActive = false;

function showRideFloat() {
  rideActive = true;
  var bar = document.getElementById('rideFloatBar');
  if (bar) bar.style.display = 'flex';
}

function hideRideFloat() {
  rideActive = false;
  var bar = document.getElementById('rideFloatBar');
  if (bar) bar.style.display = 'none';
}

function updateRideFloat(progress, dist, mins) {
  if (!rideActive) return;
  var e = document.getElementById('rfbETA2');
  if (e) e.textContent = '约' + mins + '分钟到达';
  var d = document.getElementById('rfbDist2');
  if (d) d.textContent = dist.toFixed(1) + 'km';
}

function startRideAnimation() {
  rideProgressVal = 10;
  showRideFloat();
  var milestones = {};
  rideAnimTimer = setInterval(function() {
    if (currentScreen !== 'scr5') { clearInterval(rideAnimTimer); return; }
    rideProgressVal += 1.5;
    if (rideProgressVal > 100) { rideProgressVal = 100; clearInterval(rideAnimTimer); }
    var bar = document.getElementById('rideProgress');
    if (bar) bar.style.width = rideProgressVal + '%';
    // Update metrics
    var dist = (12.3 * (100 - rideProgressVal) / 100);
    var distEl = document.getElementById('rideDist');
    if (distEl) distEl.textContent = dist.toFixed(1);
    var speedEl = document.getElementById('rideSpeed');
    if (speedEl) speedEl.textContent = (38 + Math.floor(Math.random() * 12));
    // Traffic
    if (rideProgressVal > 40 && rideProgressVal < 70) {
      var te = document.getElementById('rideTraffic');
      if (te) te.textContent = '🟡';
    } else if (rideProgressVal >= 70) {
      var te2 = document.getElementById('rideTraffic');
      if (te2) te2.textContent = '🟢';
    }
    // ETA
    var minLeft = Math.max(1, Math.ceil((100 - rideProgressVal) / 8));
    var etaEl = document.getElementById('rideETA');
    if (etaEl) etaEl.textContent = '预计 10:09 到达 · 剩余 ' + minLeft + ' 分钟';
    // Sync floating bar on home
    updateRideFloat(rideProgressVal, dist, minLeft);

    // --- Milestone messages ---
    var chatArea = document.getElementById('rideChat');
    if (!chatArea) return;

    function addBubble(html) {
      var bubble = document.createElement('div');
      bubble.className = 'agent-bubble';
      bubble.innerHTML = '<div class="b-avatar">🤖</div><div class="b-body"><div class="b-txt"><div class="b-time">Agent</div>' + html + '</div></div>';
      chatArea.appendChild(bubble);
      chatArea.scrollTop = chatArea.scrollHeight;
    }

    // 20% - weather alert
    if (rideProgressVal >= 20 && rideProgressVal < 21.5 && !milestones['m20']) {
      milestones['m20'] = true;
      addBubble('🌧️ 前方琶洲区域有小雨，已自动关窗并开启雨刮。到达时预计雨停。');
    }
    // 30% - Starbucks
    if (rideProgressVal >= 30 && rideProgressVal < 31.5 && !milestones['m30']) {
      milestones['m30'] = true;
      var sb = document.getElementById('bubbleStarbucks');
      if (sb) sb.style.display = '';
    }
    // 45% - route insight
    if (rideProgressVal >= 45 && rideProgressVal < 46.5 && !milestones['m45']) {
      milestones['m45'] = true;
      var dc = document.createElement('div');
      dc.className = 'drive-card';
      dc.innerHTML = '<div class="dc-icon">📊</div><div class="dc-body"><div class="dc-title">交通洞察</div>当前路线比备选路线节省 3 分钟。前方新港东路有轻微缓行，Agent 已选择最优车道，预计 2 分钟后通过。</div>';
      chatArea.appendChild(dc);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
    // 60% - energy/eco
    if (rideProgressVal >= 60 && rideProgressVal < 61.5 && !milestones['m60']) {
      milestones['m60'] = true;
      addBubble('🌱 本次行程已减碳 0.8kg，相当于种了 0.04 棵树。本月累计减碳 5.2kg，超过 92% 的用户！');
    }
    // 80% - ETA update
    if (rideProgressVal >= 80 && rideProgressVal < 81.5 && !milestones['m80']) {
      milestones['m80'] = true;
      addBubble('📍 还有约 2 分钟到达。已向广州南站发送到达通知。下车后请留意随身物品，Agent 会自动检测遗留物。');
    }
    // 95% - arrival prep
    if (rideProgressVal >= 95 && rideProgressVal < 96.5 && !milestones['m95']) {
      milestones['m95'] = true;
      addBubble('🚪 即将到达，偏好数据准备清除中... 下车方向：右侧。祝你旅途愉快！<br><span style="font-size:11px;color:#F5A623;cursor:pointer" onclick="skipToArrive()">👉 查看下车指引</span>');
    }
  }, 600);
}

// --- Order Dialog ---
function showOrderDialog() {
  var dialogEl = document.getElementById('orderDialog');
  if (dialogEl) dialogEl.style.display = 'flex';
}

function closeOrderDialog() {
  var dialogEl = document.getElementById('orderDialog');
  if (dialogEl) dialogEl.style.display = 'none';
}

function confirmOrder() {
  closeOrderDialog();
  // Show confirmation in chat
  var chatArea = document.getElementById('rideChat');
  if (chatArea) {
    var bubble = document.createElement('div');
    bubble.className = 'agent-bubble';
    bubble.innerHTML = '<div class="b-avatar">🤖</div><div class="b-body"><div class="b-txt"><div class="b-time">9:57</div>好的！星巴克已下单 ✔<br>大杯冰拿铁 ¥34.20 · 途经可取<br>商户使用临时会话ID，你的信息完全脱敏。</div></div>';
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  // Update bottom card
  var commTitle = document.querySelector('.comm-card .cc-title');
  if (commTitle) commTitle.textContent = '星巴克 · 已下单 ✓';
}

function skipToArrive() {
  hideRideFloat();
  if (rideAnimTimer) clearInterval(rideAnimTimer);
  var bar = document.getElementById('rideProgress');
  if (bar) bar.style.width = '100%';
  var distEl = document.getElementById('rideDist');
  if (distEl) distEl.textContent = '0.0';
  var etaEl = document.getElementById('rideETA');
  if (etaEl) etaEl.textContent = '已到达 · 剩余 0 分钟';
  setTimeout(function() { if (currentScreen === 'scr5') goToScreen('scr6'); }, 600);
}

function inrideSkip() {
  var chatArea = document.getElementById('rideChat');
  if (chatArea) {
    var bubble = document.createElement('div');
    bubble.className = 'agent-bubble';
    bubble.innerHTML = '<div class="b-avatar">🤖</div><div class="b-body"><div class="b-txt"><div class="b-time">9:57</div>好的，这次不推送商业信息。专注驾驶。</div></div>';
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

function switchMode(chip, mode) {
  document.querySelectorAll('.mode-card').forEach(function(c) { c.classList.remove('on'); });
  chip.classList.add('on');
  var chatArea = document.getElementById('rideChat');
  var modeDescs = {
    work: '已切换到<b>工作模式</b>。关掉音乐、调亮灯光、播报会议提醒。',
    rest: '已切换到<b>休息模式</b>。座椅后仰、灯光调暗、播放白噪音。好好休息~',
    entertain: '已切换到<b>娱乐模式</b>。播放你收藏的歌单，氛围灯随音乐变化。',
    learn: '已切换到<b>学习模式</b>。静音环境，推送今日资讯简报，适合碎片化阅读。',
    health: '已切换到<b>健康模式</b>。空调调至 26°C 恒温，空气净化开最大。',
    social: '已切换到<b>社交模式</b>。适当亮度，适合视频通话。要帮你拨给最近联系人吗？'
  };
  if (chatArea) {
    var bubble = document.createElement('div');
    bubble.className = 'agent-bubble';
    bubble.innerHTML = '<div class="b-avatar">🤖</div><div class="b-body"><div class="b-txt"><div class="b-time">刚刚</div>' + (modeDescs[mode] || '模式已切换') + '</div></div>';
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
}

// --- Platform multi-select & price update ---
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
  if (destInput) { destInput.value = addr; destInput.style.color = '#333'; }
}

// --- Inline Expand/Collapse ---
function toggleExpand(el) {
  el.classList.toggle('expanded');
  // For inline expand panels (new scr7)
  var parent = el.parentElement;
  var panel = parent ? parent.querySelector('.expand-panel') : null;
  if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// --- Trip Filters ---
function filterTrips(cat, el) {
  var tabs = document.querySelectorAll('#tripFilters .filter-tab');
  tabs.forEach(function(t) { t.classList.remove('on'); });
  el.classList.add('on');
  var cards = document.querySelectorAll('.trip-card');
  cards.forEach(function(c) {
    if (cat === 'all') { c.style.display = 'flex'; }
    else { c.style.display = c.getAttribute('data-status') === cat ? 'flex' : 'none'; }
  });
}

// --- Trip Detail (dynamic) ---
function openTripDetail(el) {
  var tripData = {
    from: el.getAttribute('data-from') || '',
    to: el.getAttribute('data-to') || '',
    date: el.getAttribute('data-date') || '',
    duration: el.getAttribute('data-duration') || '0',
    dist: el.getAttribute('data-dist') || '0',
    price: el.getAttribute('data-price') || '0',
    status: el.getAttribute('data-status') || '',
    operator: el.getAttribute('data-operator') || '',
    plate: el.getAttribute('data-plate') || '',
    rating: el.getAttribute('data-rating') || 'none',
    tags: el.getAttribute('data-tags') || '',
    extra: el.getAttribute('data-extra') || '',
    extraDesc: el.getAttribute('data-extra-desc') || '',
    extraIcon: el.getAttribute('data-extra-icon') || '☕'
  };
  setTimeout(function() {
    var route = document.getElementById('tdRoute');
    var badge = document.getElementById('tdStatusBadge');
    var info = document.getElementById('tdInfo');
    var plateEl = document.getElementById('tdPlate');
    var breakdown = document.getElementById('tdBreakdown');
    var fare = document.getElementById('tdFare');
    var total = document.getElementById('tdTotal');
    var saved = document.getElementById('tdSaved');
    var orderCard = document.getElementById('tdCardOrder');
    var extraEl = document.getElementById('tdExtraOrder');
    var extraIcon = document.getElementById('tdExtraIcon');
    var extraTitle = document.getElementById('tdExtraTitle');
    var extraDesc = document.getElementById('tdExtraDesc');
    var ratingCard = document.getElementById('tdCardRating');
    var ratingTitle = document.getElementById('tdRatingTitle');
    var ratingEl = document.getElementById('tdRating');
    var tagsEl = document.getElementById('tdTags');

    if (route) route.textContent = tripData.from + ' → ' + tripData.to;

    // Status badge
    if (badge) {
      if (tripData.status === 'active') badge.innerHTML = '<span style="background:#F5A623;color:#fff;padding:3px 12px;border-radius:10px;font-size:11px;font-weight:600">进行中</span>';
      else if (tripData.status === 'cancelled') badge.innerHTML = '<span style="background:#e74c3c;color:#fff;padding:3px 12px;border-radius:10px;font-size:11px;font-weight:600">已取消</span>';
      else badge.innerHTML = '<span style="background:#27ae60;color:#fff;padding:3px 12px;border-radius:10px;font-size:11px;font-weight:600">已完成</span>';
    }

    // Cancelled trip - hide pricing
    if (tripData.status === 'cancelled') {
      if (breakdown) breakdown.style.display = 'none';
      if (saved) saved.style.display = 'none';
      if (extraEl) extraEl.style.display = 'none';
      if (ratingCard) ratingCard.style.display = 'none';
      if (info) info.textContent = '🕐 ' + tripData.date + ' · 已取消';
      if (plateEl) plateEl.textContent = '未分配车辆';
      if (orderCard) orderCard.style.opacity = '0.7';
      return;
    }

    if (orderCard) orderCard.style.opacity = '1';
    if (breakdown) breakdown.style.display = 'block';
    if (saved) saved.style.display = 'block';

    if (info) info.textContent = '🕐 ' + tripData.date + ' · ' + tripData.duration + ' 分钟 · ' + tripData.dist + ' km · ' + tripData.operator;
    if (plateEl) plateEl.textContent = '车牌：' + tripData.plate;
    var price = parseFloat(tripData.price) || 0;
    if (fare) fare.textContent = '¥' + (price - 2.5).toFixed(2);
    if (total) total.textContent = '¥' + price.toFixed(2);
    if (saved) {
      var savedAmount = price >= 40 ? 6 : (price >= 20 ? 3.50 : (price * 0.13).toFixed(2));
      saved.textContent = '💎 会员省了 ¥' + savedAmount;
    }

    // Extra order (Starbucks etc.)
    if (tripData.extra && extraEl) {
      extraEl.style.display = 'flex';
      if (extraIcon) extraIcon.textContent = tripData.extraIcon;
      if (extraTitle) extraTitle.textContent = tripData.extra;
      if (extraDesc) extraDesc.textContent = tripData.extraDesc;
    } else if (extraEl) {
      extraEl.style.display = 'none';
    }

    // Rating
    if (ratingCard) ratingCard.style.display = 'block';
    if (tripData.rating && tripData.rating !== 'none') {
      if (ratingTitle) ratingTitle.textContent = '⭐ 我的评价';
      if (ratingEl) ratingEl.innerHTML = '<div class="stars">' + tripData.rating + '</div>';
      if (tagsEl && tripData.tags) {
        tagsEl.style.display = 'block';
        tagsEl.innerHTML = tripData.tags.split(',').map(function(tag) { return '<span class="sel">' + tag.trim() + '</span>'; }).join('');
      } else if (tagsEl) {
        tagsEl.style.display = 'none';
      }
    } else {
      if (ratingTitle) ratingTitle.textContent = '⭐ 我的评价';
      if (ratingEl) ratingEl.innerHTML = '<span style="color:#999;font-size:12px">暂未评价</span>';
      if (tagsEl) tagsEl.style.display = 'none';
    }
  }, 50);
  goToScreen('scrTripDetail');
}

// --- Address Editor ---
var editingAddr = { name: '', detail: '' };

function openAddrEditor(name, detail) {
  editingAddr.name = name;
  editingAddr.detail = detail;
  setTimeout(function() {
    var n = document.getElementById('addrEditName');
    var d = document.getElementById('addrEditDetail');
    if (n) n.value = editingAddr.name;
    if (d) d.value = editingAddr.detail;
  }, 50);
  goToScreen('scrAddrEdit');
}

function saveAddrAndBack() {
  goBack();
}

// --- Preference Editor (scrPrefEdit) ---
function pickMusicPref(el) {
  var picker = document.getElementById('musicPicker');
  if (!picker) return;
  picker.querySelectorAll('span').forEach(function(opt) {
    opt.style.color = '#666';
    opt.style.background = '#1a1a1a';
    opt.style.borderColor = '#333';
  });
  el.style.color = '#F5A623';
  el.style.background = '#2a1f0a';
  el.style.borderColor = '#F5A623';
}

function pickVolPref(el) {
  var panel = el.parentElement;
  if (!panel) return;
  panel.querySelectorAll('span').forEach(function(opt) {
    opt.style.color = '#666';
    opt.style.background = '#1a1a1a';
    opt.style.fontWeight = '400';
  });
  el.style.color = '#F5A623';
  el.style.background = '#2a1f0a';
  el.style.fontWeight = '600';
  var descMap = {
    '详细': '全程讲解驾驶决策、路况分析与推荐理由',
    '标准': '仅在关键节点（转弯、拥堵、到达）播报',
    '静音': '全程静音，仅保留安全警报'
  };
  var descEl = document.getElementById('volPrefDesc');
  if (descEl) descEl.textContent = descMap[el.textContent] || '';
}

// --- Matching Sequence Animation ---
function runMatchSequence() {
  var steps = [
    { el: document.getElementById('matchStep1'), delay: 400, opacity: 1, text: '🔍 扫描附近 Robotaxi... 发现 12 辆在线' },
    { el: document.getElementById('matchStep2'), delay: 900, opacity: 1, text: '📡 查询各运营商实时位置... 4 家响应' },
    { el: document.getElementById('matchStep3'), delay: 1400, opacity: 1, text: '🎯 偏好匹配：空调 23°C · 古典音乐 · 暖色灯... ✓' },
    { el: document.getElementById('matchStep4'), delay: 1900, opacity: 1, text: '📊 综合评分：距离 · 评分 · 价格 · 偏好契合度... ✓' }
  ];

  // Animate search steps
  steps.forEach(function(s) {
    autoTimer = setTimeout(function() {
      if (currentScreen !== 'scr3') return;
      if (s.el) { s.el.textContent = s.text; s.el.style.opacity = s.opacity; }
    }, s.delay);
  });

  // Transition: hide searching, show results
  autoTimer = setTimeout(function() {
    if (currentScreen !== 'scr3') return;
    var searching = document.getElementById('matchSearching');
    var results = document.getElementById('matchResults');
    var agent = document.getElementById('matchAgent');
    var btns = document.getElementById('matchBtns');
    var title = document.getElementById('matchTitle');
    if (searching) searching.style.display = 'none';
    if (results) results.style.display = '';
    if (title) title.textContent = '匹配完成';
    // Stagger card reveals
    var cardDelays = [100, 250, 400, 550];
    for (var i = 1; i <= 4; i++) {
      (function(idx) {
        autoTimer = setTimeout(function() {
          if (currentScreen !== 'scr3') return;
          var card = document.getElementById('mc' + idx);
          if (card) { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }
          var cnt = document.getElementById('matchCount');
          if (cnt) cnt.textContent = idx;
        }, cardDelays[idx-1]);
      })(i);
    }
  }, 2600);

  // Show Agent message + buttons
  autoTimer = setTimeout(function() {
    if (currentScreen !== 'scr3') return;
    if (agent) agent.style.display = '';
    if (btns) btns.style.display = 'flex';
  }, 3200);
}

console.log('CoRide App Demo ready - 16 screens v3');