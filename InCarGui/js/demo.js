// CoRide In-Car Agent Demo

// ── Agent Message Auto-advance ──
var msgIndex = 0;
var msgIds = ['msg1','msg2','msg3','msg4','msg5','msg6'];
var msgTimers = [];

function showNextMsg() {
  if (msgIndex >= msgIds.length) return;
  var el = document.getElementById(msgIds[msgIndex]);
  if (el) { el.style.display = 'flex'; el.scrollIntoView({behavior:'smooth',block:'end'}); }
  msgIndex++;
}

function scheduleMessages() {
  var delays = [800, 3000, 6000, 9000, 11000, 13000];
  delays.forEach(function(d, i) {
    var t = setTimeout(function() { showNextMsg(); }, d);
    msgTimers.push(t);
  });
}

// ── Route Confirmation ──
function routeConfirm(yes) {
  document.getElementById('msg4').querySelector('.btns').style.display = 'none';
  if (yes) {
    setTimeout(function() { showNextMsg(); }, 400);
  }
}

// ── CAN Bubble ──
setTimeout(function() {
  var bubble = document.getElementById('canBubble');
  if (bubble) bubble.style.display = 'block';
}, 5000);

// ── Bottom Sheet ──
var currentSheet = null;
function openSheet(name) {
  closeSheet();
  currentSheet = name;
  document.getElementById('sheetOverlay').classList.add('show');
  document.getElementById('sheet' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('show');
  // Sync temp slider
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

// ── Environment Controls ──
var carTemp = 23;

function adjustTemp(val) {
  carTemp = parseInt(val);
  document.getElementById('envTemp').textContent = carTemp + '°C';
  document.getElementById('sheetTempVal').textContent = carTemp + '°C';
}

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

var isMuted = false;
var currentRadio = '';

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

function pickSeat(mode, el) {
  // kept for backward compatibility - redirects to new system
  var panel = el.parentElement;
  panel.querySelectorAll('.sheet-opt').forEach(function(o) { o.classList.remove('selected'); });
  el.classList.add('selected');
  panel.querySelectorAll('.chk').forEach(function(c) { c.remove(); });
  var chk = document.createElement('span'); chk.className = 'chk'; chk.textContent = '✓';
  el.appendChild(chk);
  document.getElementById('envSeat').textContent = mode;
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

// ── Seat Level Controls ──
var seatHeat = '关';
var seatVent = '关';
var seatMassage = '关';

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
  var emojiHeat = '🔥'; var emojiVent = '💨'; var emojiMassage = '💆';
  document.getElementById('envSeat').textContent = emojiHeat + seatHeat + '·' + emojiVent + seatVent + '·' + emojiMassage + seatMassage;
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
    // User message
    var div = document.createElement('div');
    div.className = 'msg';
    div.style.justifyContent = 'flex-end';
    div.innerHTML = '<div class="bubble" style="background:#1a2a1a;color:#8f8;text-align:right"><div class="time" style="color:#4a4">你</div>' + example.user + '</div>';
    chat.appendChild(div);
    div.scrollIntoView({behavior:'smooth',block:'end'});
    // Agent response
    setTimeout(function() {
      // Apply side effects based on example
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

// ── ETA countdown ──
var etaMin = 12;
setInterval(function() {
  if (etaMin > 8) { etaMin--; document.getElementById('tlEta').textContent = etaMin + ' min'; }
}, 30000);

// ── Start ──
scheduleMessages();
