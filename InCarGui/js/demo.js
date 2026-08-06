// CoRide In-Car Agent — Journey Timeline Demo

// ── Journey Phase Definitions ──
var phases = [
  { id: 'ble',  label: '🤝 蓝牙握手',     info: 'BLE 5.0 · 偏好向量传输',                             duration: 5000 },
  { id: 'load', label: '🚗 启程出发',     info: '偏好加载 · 空调 23°C · 古典音乐',                      duration: 6000 },
  { id: 'lane', label: '🛣️ 巡航驾驶',     info: '变道避让 · CAN 信号翻译',                              duration: 7000 },
  { id: 'ped',  label: '⚠️ 行人预警',     info: '快速通道 · 200ms 响应 · 仅播报不推理',                   duration: 6000 },
  { id: 'jam',  label: '🚦 拥堵绕行',     info: 'SLM 深度推理 · 路线重规划 · 节省 4 分钟',                duration: 8000 },
  { id: 'order',label: '☕ 预点单',        info: '途经星巴克 · 偏好匹配 · 手机确认 · 生物识别',              duration: 8000 },
  { id: 'arrive',label:'🏁 即将到达',      info: 'YOLO 遗留物检测 · 舱内视觉提醒',                        duration: 7000 },
  { id: 'wipe',  label: '🔒 下车即删',     info: '全零覆写 · 逐字节验证 · 会话密钥销毁',                    duration: 6000 }
];

var currentPhase = -1;
var phaseTimer = null;
var allTimers = [];
var journeyStarted = false;
var journeyPaused = false;

// Car position waypoints (top%, left%)
var carWaypoints = [
  { top: '21%', left: '12%' },  // start
  { top: '20%', left: '20%' },  // lane change
  { top: '22%', left: '32%' },  // pedestrian
  { top: '24%', left: '45%' },  // traffic area
  { top: '26%', left: '55%' },  // via starbucks
  { top: '23%', left: '65%' },  // approaching
  { top: '20%', left: '78%' },  // arrive
];

// ── Helper: add agent message to chat ──
function addAgentMsg(time, text, type) {
  type = type || '';
  var chat = document.getElementById('agentChat');
  var div = document.createElement('div');
  div.className = 'msg';
  var dotClass = 'g';
  if (type === 'warn') dotClass = 'y';
  if (type === 'alert') dotClass = 'r';
  var bubbleClass = '';
  if (type === 'warn') bubbleClass = ' warn';
  if (type === 'alert') bubbleClass = ' alert';
  if (type === 'info') bubbleClass = ' info';
  div.innerHTML = '<div class="dot ' + dotClass + '"></div><div class="bubble' + bubbleClass + '"><div class="time">' + time + ' · Agent</div>' + text + '</div>';
  chat.appendChild(div);
  div.scrollIntoView({behavior:'smooth',block:'end'});
  return div;
}

function addUserMsg(text) {
  var chat = document.getElementById('agentChat');
  var div = document.createElement('div');
  div.className = 'msg';
  div.style.justifyContent = 'flex-end';
  div.innerHTML = '<div class="bubble" style="background:#1a2a1a;color:#8f8;text-align:right"><div class="time" style="color:#4a4">你</div>' + text + '</div>';
  chat.appendChild(div);
  div.scrollIntoView({behavior:'smooth',block:'end'});
  return div;
}

function addActionMsg(time, text, yesLabel, noLabel, yesCb) {
  var chat = document.getElementById('agentChat');
  var div = document.createElement('div');
  div.className = 'msg';
  var bid = 'action_' + Date.now();
  div.innerHTML = '<div class="dot y"></div><div class="bubble warn"><div class="time">' + time + ' · Agent</div>' + text +
    '<div class="btns" id="' + bid + '">' +
    '<span class="yes" onclick="resolveAction(\'' + bid + '\',true)">' + (yesLabel || '是') + '</span>' +
    '<span class="no" onclick="resolveAction(\'' + bid + '\',false)">' + (noLabel || '否') + '</span>' +
    '</div></div>';
  chat.appendChild(div);
  div.scrollIntoView({behavior:'smooth',block:'end'});
  return bid;
}

// ── Pipeline animation ──
function setPipelineActive(stageIndex) {
  var stages = ['plPerc', 'plIntent', 'plTool', 'plExec', 'plReply'];
  stages.forEach(function(id, i) {
    var el = document.getElementById(id);
    el.classList.remove('active', 'done');
    if (i < stageIndex) el.classList.add('done');
    if (i === stageIndex) el.classList.add('active');
  });
}

function resetPipeline() {
  var stages = ['plPerc', 'plIntent', 'plTool', 'plExec', 'plReply'];
  stages.forEach(function(id) {
    document.getElementById(id).classList.remove('active', 'done');
  });
}

function runPipeline(callback) {
  var steps = [
    function() { setPipelineActive(0); },
    function() { setPipelineActive(1); },
    function() { setPipelineActive(2); },
    function() { setPipelineActive(3); },
    function() { setPipelineActive(4); }
  ];
  var i = 0;
  function next() {
    if (i < steps.length) { steps[i](); i++; allTimers.push(setTimeout(next, 350)); }
    else { allTimers.push(setTimeout(function() { resetPipeline(); if (callback) callback(); }, 600)); }
  }
  next();
}

// ── Car animation ──
function moveCar(waypointIndex) {
  var wp = carWaypoints[Math.min(waypointIndex, carWaypoints.length - 1)];
  var car = document.getElementById('carPos');
  if (car && wp) {
    car.style.top = wp.top;
    car.style.left = wp.left;
  }
}

// ── Timeline bar update ──
function updateTimeline(pct) {
  var fill = document.getElementById('tlFill');
  var dot = document.getElementById('tlDot');
  if (fill) fill.style.width = pct + '%';
  if (dot) dot.style.left = pct + '%';
  var eta = Math.max(1, Math.round(12 * (1 - pct / 100)));
  var el = document.getElementById('tlEta');
  if (el) el.textContent = eta + ' min';
}

// ── Phase management ──
function setPhase(index) {
  if (index >= phases.length) return;
  currentPhase = index;
  var p = phases[index];
  document.getElementById('phaseLabel').textContent = p.label;
  document.getElementById('phaseLabel').classList.add('phase-blink');
  setTimeout(function() { document.getElementById('phaseLabel').classList.remove('phase-blink'); }, 500);
  document.getElementById('skipInfo').textContent = '第 ' + (index + 1) + '/' + phases.length + ' 阶段 · ' + p.info;
  document.getElementById('skipBtn').disabled = false;
}

function skipPhase() {
  if (currentPhase >= phases.length - 1) return;
  document.getElementById('skipBtn').disabled = true;
  if (phaseTimer) { clearTimeout(phaseTimer); phaseTimer = null; }
  // Clear all pending timers
  allTimers.forEach(function(t) { clearTimeout(t); });
  allTimers = [];
  // Move to next phase
  var nextIdx = currentPhase + 1;
  cleanupPhase(currentPhase);
  runPhase(nextIdx);
}

function cleanupPhase(idx) {
  // Hide all CAN bubbles
  var bubbles = ['canPedestrian', 'canTraffic', 'canBrake', 'canDetour'];
  bubbles.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  // Hide order card
  var oc = document.getElementById('orderCard');
  if (oc) oc.style.display = 'none';
  // Hide via tag
  var vt = document.getElementById('viaTag');
  if (vt) vt.style.display = 'none';
  // Reset pipeline
  resetPipeline();
}

// ── Phase runners ──
function runPhase(idx) {
  if (idx >= phases.length) { journeyComplete(); return; }
  setPhase(idx);
  cleanupPhase(idx);

  switch (idx) {
    case 0: runPhaseBLE(); break;
    case 1: runPhaseLoad(); break;
    case 2: runPhaseLane(); break;
    case 3: runPhasePedestrian(); break;
    case 4: runPhaseTraffic(); break;
    case 5: runPhaseOrder(); break;
    case 6: runPhaseArrive(); break;
    case 7: runPhaseWipe(); break;
  }
}

// Phase 0: BLE Handshake
function runPhaseBLE() {
  var bleOverlay = document.getElementById('bleOverlay');
  bleOverlay.style.display = 'flex';
  bleOverlay.classList.remove('hide');
  var bleFill = document.getElementById('bleFill');
  bleFill.style.width = '0%';

  var steps = ['验证会话 Token…', 'AES-256-GCM 密钥交换…', '偏好向量加载中…', '空调 23°C · 古典音乐 · 座椅默认', '握手完成 ✓'];
  var stepIdx = 0;

  function nextStep() {
    if (stepIdx < steps.length) {
      document.getElementById('bleSteps').textContent = steps[stepIdx];
      bleFill.style.width = ((stepIdx + 1) * 20) + '%';
      stepIdx++;
      allTimers.push(setTimeout(nextStep, 900));
    } else {
      allTimers.push(setTimeout(function() {
        bleOverlay.classList.add('hide');
        allTimers.push(setTimeout(function() {
          bleOverlay.style.display = 'none';
          moveCar(0);
          advancePhase();
        }, 600));
      }, 500));
    }
  }
  nextStep();

  addAgentMsg('12:00', '检测到蓝牙握手请求…正在加载您的偏好设置');
  phaseTimer = setTimeout(function() { /* handled by advancePhase via nextStep */ }, phases[0].duration);
}

// Phase 1: Departure & Load
function runPhaseLoad() {
  moveCar(0);
  updateTimeline(5);

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:01', '下午好，刁先生。偏好已加载：空调 23°C、古典音乐、暖色氛围灯。<br>本次行程：珠江新城 → 广州南站，预计 24 分钟');
    runPipeline();
  }, 800));

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:01', '舱内视觉已就绪。检测到您携带背包，已记录——下车时我会提醒您。');
    setPipelineActive(0);
    allTimers.push(setTimeout(function() { setPipelineActive(1); }, 400));
    allTimers.push(setTimeout(function() { setPipelineActive(2); }, 800));
    allTimers.push(setTimeout(function() { setPipelineActive(3); }, 1200));
    allTimers.push(setTimeout(function() { setPipelineActive(4); resetPipeline(); }, 1600));
  }, 2500));

  allTimers.push(setTimeout(function() {
    moveCar(1);
    updateTimeline(12);
  }, 3500));

  phaseTimer = setTimeout(advancePhase, phases[1].duration);
}

// Phase 2: Lane Change
function runPhaseLane() {
  moveCar(1);
  updateTimeline(20);

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:03', '正在向左变道——前方有慢车，我们超过去。', 'info');
    runPipeline();
  }, 1000));

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:03', '变道完成，当前车速 42km/h，进入猎德大道。');
    setPipelineActive(0);
    allTimers.push(setTimeout(function() { setPipelineActive(4); resetPipeline(); }, 800));
  }, 3500));

  allTimers.push(setTimeout(function() {
    moveCar(2);
    updateTimeline(30);
  }, 4000));

  phaseTimer = setTimeout(advancePhase, phases[2].duration);
}

// Phase 3: Pedestrian Warning (Fast Channel)
function runPhasePedestrian() {
  moveCar(2);
  updateTimeline(38);

  allTimers.push(setTimeout(function() {
    var can = document.getElementById('canPedestrian');
    can.style.display = 'block';
    can.style.right = '15%';
    can.style.top = '32%';
    addAgentMsg('12:05', '⚠️ 前方 200 米检测到行人横穿——已自动减速。', 'alert');
    addAgentMsg('12:05', '<span style="color:#4facfe">⚡ 快速通道</span> · CAN 信号直通 · 端到端 200ms<br>不经过 SLM 推理，确定性安全响应', 'info');
  }, 1000));

  allTimers.push(setTimeout(function() {
    document.getElementById('canPedestrian').style.display = 'none';
    addAgentMsg('12:05', '行人已通过，恢复正常行驶。');
  }, 3500));

  allTimers.push(setTimeout(function() {
    moveCar(3);
    updateTimeline(48);
  }, 3000));

  phaseTimer = setTimeout(advancePhase, phases[3].duration);
}

// Phase 4: Traffic & Reroute
function runPhaseTraffic() {
  moveCar(3);
  updateTimeline(55);

  allTimers.push(setTimeout(function() {
    var can = document.getElementById('canTraffic');
    can.style.display = 'block';
    can.style.right = '10%';
    can.style.top = '40%';
    addAgentMsg('12:07', '检测到珠江新城段拥堵，缓行约 800 米。正在分析绕行方案…', 'warn');
    runPipeline(function() {
      addAgentMsg('12:07', '已找到更优路线：绕行内环路，可节省约 4 分钟。', 'warn');
      var bid = addActionMsg('12:07', '是否切换到推荐路线？', '是，切换', '不用');
      allTimers.push(setTimeout(function() {
        resolveAction(bid, true);
      }, 3000));
    });
  }, 1200));

  phaseTimer = setTimeout(advancePhase, phases[4].duration);
}

var rerouteResolved = false;
function resolveAction(bid, yes) {
  var btns = document.getElementById(bid);
  if (!btns) return;
  btns.style.display = 'none';
  if (yes) {
    addAgentMsg('12:08', '已切换到最优路线 ✓<br>绕行内环路，预计节省 4 分钟。新 ETA：12:22 到达。');
    document.getElementById('canTraffic').style.display = 'none';
    var canDetour = document.getElementById('canDetour');
    canDetour.style.display = 'block';
    canDetour.style.right = '20%';
    canDetour.style.top = '35%';
    allTimers.push(setTimeout(function() {
      canDetour.style.display = 'none';
    }, 3500));
    updateTimeline(60);
    moveCar(4);
    rerouteResolved = true;
  } else {
    addAgentMsg('12:08', '好的，保持当前路线。预计拥堵持续约 5 分钟。');
  }
}

// Phase 5: Starbucks Pre-order
function runPhaseOrder() {
  moveCar(4);
  updateTimeline(72);

  allTimers.push(setTimeout(function() {
    var viaTag = document.getElementById('viaTag');
    viaTag.style.display = 'block';
    addAgentMsg('12:10', '3 分钟后途经星巴克（猎德店）☕<br>照旧来一杯大杯冰拿铁？¥36，到店可取。', 'warn');
  }, 1000));

  allTimers.push(setTimeout(function() {
    var oc = document.getElementById('orderCard');
    oc.style.display = 'block';
    document.getElementById('ocStatus').textContent = '等待确认…';
    addAgentMsg('12:10', '已推送预点单至您的手机 📱<br>请在手机上确认支付。');
    addAgentMsg('12:10', '<span style="color:#F5A623">📱 手机端确认中…</span> 30 秒内需完成指纹验证，否则自动取消。', 'warn');
  }, 3000));

  allTimers.push(setTimeout(function() {
    document.getElementById('ocStatus').textContent = '✅ 已确认 · ¥36 已支付';
    document.getElementById('ocStatus').style.color = '#27ae60';
    document.getElementById('ocStatus').style.animation = 'none';
    addAgentMsg('12:11', '订单已确认 ✓ 大杯冰拿铁 ¥36<br>到店扫码即取，无需排队。');
    runPipeline();
  }, 5500));

  phaseTimer = setTimeout(advancePhase, phases[5].duration);
}

// Phase 6: Arriving
function runPhaseArrive() {
  moveCar(5);
  updateTimeline(85);

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:13', '即将到达广州南站，预计 2 分钟后抵达下车点。');
  }, 1000));

  allTimers.push(setTimeout(function() {
    // YOLO: detect phone left behind
    var phone = document.getElementById('yoloPhone');
    phone.style.display = 'flex';
    document.getElementById('yoloStatus').textContent = '⚠️ 检测: 1人+背包+手机 遗留风险';
    document.getElementById('yoloStatus').style.color = '#e74c3c';
    addAgentMsg('12:14', '⚠️ 舱内视觉检测到座位上有手机——请记得带好随身物品！', 'alert');
    var oc = document.getElementById('orderCard');
    if (oc) oc.style.display = 'none';
  }, 3000));

  allTimers.push(setTimeout(function() {
    moveCar(6);
    updateTimeline(100);
    // Update trip summary to final
    var tmini = document.getElementById('tripMini');
    tmini.innerHTML = '<div class="tm-row"><span>🎫 行程费用</span><span>¥26.50</span></div><div class="tm-row"><span>⏱ 行程时长</span><span>14 min</span></div><div class="tm-row highlight"><span>💎 会员已省</span><span>¥150 · 本次免费</span></div>';
    addAgentMsg('12:14', '已到达广州南站下车点 🎯<br>本次行程结束，感谢您选择 CoRide。');
  }, 5500));

  phaseTimer = setTimeout(advancePhase, phases[6].duration);
}

// Phase 7: Data Wipe
function runPhaseWipe() {
  moveCar(6);
  updateTimeline(100);
  document.getElementById('tlEta').textContent = '已到达';

  var wipeOverlay = document.getElementById('wipeOverlay');
  wipeOverlay.style.display = 'flex';
  var wipeFill = document.getElementById('wipeFill');
  wipeFill.style.width = '0%';

  allTimers.push(setTimeout(function() {
    addAgentMsg('12:15', '行程结束。正在执行安全擦除程序…');
  }, 500));

  var wipeSteps = ['擦除用户偏好向量…', '擦除对话历史…', '擦除视觉检测记录…', '会话密钥销毁…', '全零覆写验证通过 ✓'];
  var wsIdx = 0;
  function nextWipe() {
    if (wsIdx < wipeSteps.length) {
      document.querySelector('.wipe-text').textContent = wipeSteps[wsIdx];
      wipeFill.style.width = ((wsIdx + 1) * 20) + '%';
      document.getElementById('npuStatus').textContent = '数据擦除中…';
      wsIdx++;
      allTimers.push(setTimeout(nextWipe, 900));
    } else {
      allTimers.push(setTimeout(function() {
        addAgentMsg('12:15', '🔒 数据已安全擦除。本次行程所有个人数据已从车端清除。<br><span style="color:#888">CAN 只读 · 本地推理 · 下车即删 ✓</span>');
        document.getElementById('npuStatus').textContent = 'Jet NPU 空闲';
        document.getElementById('phaseLabel').textContent = '✅ 旅程结束';
        document.getElementById('skipInfo').textContent = '全部 8 阶段已完成 · 数据安全擦除';
        document.getElementById('skipBtn').disabled = true;
        document.getElementById('viaTag').style.display = 'none';
        document.getElementById('yoloPhone').style.display = 'none';
        document.getElementById('yoloStatus').textContent = '检测: 离线';
        document.getElementById('yoloStatus').style.color = '#27ae60';
      }, 600));
    }
  }
  nextWipe();
}

// ── Advance to next phase ──
function advancePhase() {
  if (currentPhase + 1 < phases.length) {
    runPhase(currentPhase + 1);
  } else {
    journeyComplete();
  }
}

function journeyComplete() {
  document.getElementById('phaseLabel').textContent = '✅ 旅程结束';
  document.getElementById('skipInfo').textContent = '全部阶段已完成';
  document.getElementById('skipBtn').disabled = true;
}

// ── Start Journey ──
function startJourney() {
  if (journeyStarted) return;
  journeyStarted = true;
  runPhase(0);
}

// ── Bottom Sheet (unchanged) ──
var currentSheet = null;
function openSheet(name) {
  closeSheet();
  currentSheet = name;
  document.getElementById('sheetOverlay').classList.add('show');
  document.getElementById('sheet' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('show');
  if (name === 'temp') {
    var s = document.getElementById('sheetTempSlider');
    if (s) s.value = carTemp;
    document.getElementById('sheetTempVal').textContent = carTemp + '°C';
  }
}

function closeSheet() {
  document.getElementById('sheetOverlay').classList.remove('show');
  if (currentSheet) {
    document.getElementById('sheet' + currentSheet.charAt(0).toUpperCase() + currentSheet.slice(1)).classList.remove('show');
    currentSheet = null;
  }
}

// ── Environment Controls (unchanged) ──
var carTemp = 23;
function adjustTemp(val) {
  carTemp = parseInt(val);
  document.getElementById('envTemp').textContent = carTemp + '°C';
  document.getElementById('sheetTempVal').textContent = carTemp + '°C';
}

var isMuted = false;
var currentRadio = '';

function pickMusic(style, el) {
  var panel = el.parentElement;
  panel.querySelectorAll('.sheet-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  panel.querySelectorAll('.chk').forEach(function(c) { c.remove(); });
  var chk = document.createElement('span'); chk.className = 'chk'; chk.textContent = '✓';
  el.appendChild(chk);
  document.getElementById('envMusic').textContent = style;
  isMuted = false;
}

function switchMusicTab(tab, el) {
  document.querySelectorAll('#musicTabs .st-tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('musicPanel').style.display = (tab === 'music') ? 'block' : 'none';
  document.getElementById('radioPanel').style.display = (tab === 'radio') ? 'block' : 'none';
  document.getElementById('mutePanel').style.display = (tab === 'mute') ? 'block' : 'none';
  if (tab === 'mute') { isMuted = true; document.getElementById('envMusic').textContent = '静音'; }
  if (tab === 'music' && isMuted) { isMuted = false; document.getElementById('envMusic').textContent = '古典'; }
  if (tab === 'radio' && currentRadio) { isMuted = false; document.getElementById('envMusic').textContent = currentRadio; }
}

function pickRadio(station, el) {
  var panel = el.parentElement;
  panel.querySelectorAll('.sheet-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  panel.querySelectorAll('.chk').forEach(function(c) { c.remove(); });
  var chk = document.createElement('span'); chk.className = 'chk'; chk.textContent = '✓';
  el.appendChild(chk);
  currentRadio = station;
  isMuted = false;
  document.getElementById('envMusic').textContent = station;
}

function pickLight(color, el) {
  var panel = el.parentElement;
  panel.querySelectorAll('.sheet-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  panel.querySelectorAll('.chk').forEach(function(c) { c.remove(); });
  var chk = document.createElement('span'); chk.className = 'chk'; chk.textContent = '✓';
  el.appendChild(chk);
  document.getElementById('envLight').textContent = color;
}

var seatHeat = '关', seatVent = '关', seatMassage = '关';

function switchSeatTab(tab, el) {
  document.querySelectorAll('#seatTabs .st-tab').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('heatPanel').style.display = (tab === 'heat') ? 'block' : 'none';
  document.getElementById('ventPanel').style.display = (tab === 'vent') ? 'block' : 'none';
  document.getElementById('massagePanel').style.display = (tab === 'massage') ? 'block' : 'none';
}

function setSeatLevel(func, level, el) {
  if (func === 'heat') seatHeat = level;
  if (func === 'vent') seatVent = level;
  if (func === 'massage') seatMassage = level;
  var panel = el.parentElement;
  panel.querySelectorAll('.sl-btn').forEach(function(b) { b.classList.remove('selected'); });
  el.classList.add('selected');
  updateSeatDisplay();
}

function updateSeatDisplay() {
  document.getElementById('envSeat').textContent = '\uD83D\uDD25' + seatHeat + '·\uD83D\uDCA8' + seatVent + '·\uD83D\uDC86' + seatMassage;
}

// ── Voice Input ──
var voiceTimer = null;
var voiceExamples = [
  { user: '有点热，空调调低一点', agent: '好的，空调已调到 ' },
  { user: '换个音乐，来点流行', agent: '已切换到流行音乐 🎵' },
  { user: '还有多久到？', agent: '预计还有 8 分钟到达广州南站' },
  { user: '前面怎么堵了？', agent: '前方珠江新城路段轻微拥堵，已自动规划避让路线' },
  { user: '打开座椅加热，调到中档', agent: '好的，座椅加热已调至中档 🔥' },
  { user: '打开氛围灯，暖色的', agent: '暖色氛围灯已开启 🌅' }
];
var voiceIdx = 0;

function startVoice() {
  var btn = document.getElementById('voiceBtn');
  btn.classList.add('listening');
  btn.innerHTML = '<span class="mic">🎤</span> 正在聆听...';
  var example = voiceExamples[voiceIdx % voiceExamples.length];
  voiceIdx++;
  voiceTimer = setTimeout(function() {
    var chat = document.getElementById('agentChat');
    var div = document.createElement('div');
    div.className = 'msg';
    div.style.justifyContent = 'flex-end';
    div.innerHTML = '<div class="bubble" style="background:#1a2a1a;color:#8f8;text-align:right"><div class="time" style="color:#4a4">你</div>' + example.user + '</div>';
    chat.appendChild(div);
    div.scrollIntoView({behavior:'smooth',block:'end'});
    setTimeout(function() {
      if (example.user.indexOf('空调调低') >= 0) { carTemp = Math.max(18, carTemp - 2); document.getElementById('envTemp').textContent = carTemp + '°C'; }
      if (example.user.indexOf('流行') >= 0) { document.getElementById('envMusic').textContent = '流行'; }
      if (example.user.indexOf('座椅') >= 0) { seatHeat = '中'; updateSeatDisplay(); }
      if (example.user.indexOf('暖色') >= 0) { document.getElementById('envLight').textContent = '暖色'; }
      var resp = document.createElement('div');
      resp.className = 'msg';
      var respText = example.agent;
      if (example.agent.indexOf('调到 ') >= 0) respText = example.agent + carTemp + '°C';
      resp.innerHTML = '<div class="dot g"></div><div class="bubble"><div class="time">Agent</div>' + respText + '</div>';
      chat.appendChild(resp);
      resp.scrollIntoView({behavior:'smooth',block:'end'});
    }, 800);
  }, 1200);
}

function stopVoice() {
  var btn = document.getElementById('voiceBtn');
  btn.classList.remove('listening');
  btn.innerHTML = '<span class="mic">🎤</span> 按住说话';
  if (voiceTimer) { clearTimeout(voiceTimer); voiceTimer = null; }
}

// ── Auto-start after short delay ──
setTimeout(startJourney, 1500);
