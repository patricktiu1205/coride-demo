// CoRide Platform Admin Demo

// ── Screen Navigation ──
var currentScreen = 'main';
function goScreen(name) {
  document.querySelectorAll('.detail-screen').forEach(function(s) { s.classList.remove('show'); });
  document.getElementById('screen-' + name).classList.add('show');
  currentScreen = name;
}

// ── Live Clock ──
function updateClock() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2,'0');
  var m = String(now.getMinutes()).padStart(2,'0');
  var s = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('liveDate').textContent = '2026.07.31 · ' + h + ':' + m + ':' + s + ' CST';
}
setInterval(updateClock, 1000);
updateClock();

// ── Simulated Order Stream ──
var routes = [
  { from: '天河', to: '机场', fee: '¥5.00' },
  { from: '海珠', to: '南站', fee: '¥2.50' },
  { from: '越秀', to: '东站', fee: '¥5.00' },
  { from: '番禺', to: '机场', fee: '¥2.50' },
  { from: '白云', to: '南站', fee: '¥5.00' },
  { from: '荔湾', to: '东站', fee: '¥2.50' },
  { from: '黄埔', to: '机场', fee: '¥5.00' },
  { from: '花都', to: '南站', fee: '¥2.50' },
  { from: '增城', to: '东站', fee: '¥5.00' },
  { from: '从化', to: '机场', fee: '¥2.50' }
];

var orderNum = 8827;
function addOrder() {
  var list = document.getElementById('orderList');
  var r = routes[Math.floor(Math.random() * routes.length)];
  var now = new Date();
  var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
  var div = document.createElement('div');
  div.className = 'ol-item';
  div.innerHTML = '<span class="ol-id">#' + (orderNum++) + '</span><span class="ol-route">' + r.from + ' → ' + r.to + '</span><span class="ol-fee">' + r.fee + '</span><span class="ol-time">' + time + '</span>';
  list.insertBefore(div, list.firstChild);
  // Keep max 20 items
  if (list.children.length > 20) { list.removeChild(list.lastChild); }
}
setInterval(addOrder, 4000);

// ── Revenue Increment ──
var revenue = 63750;
var orderCount = 8827;
setInterval(function() {
  revenue += Math.floor(Math.random() * 3) + 2;
  document.getElementById('todayRevenue').textContent = '¥' + revenue.toLocaleString();
}, 15000);

// ── Vehicle Count Pulse ──
var vehOnline = 487;
setInterval(function() {
  var delta = Math.random() > 0.6 ? (Math.random() > 0.5 ? 1 : -1) : 0;
  vehOnline = Math.min(500, Math.max(480, vehOnline + delta));
  document.getElementById('onlineVeh').textContent = vehOnline;
  // Update Jet health bar
  var pct = (vehOnline / 500 * 100).toFixed(1);
  document.getElementById('jhFill').style.width = pct + '%';
}, 8000);

// ── Online Users Pulse ──
var onlineUsers = 1247;
setInterval(function() {
  var delta = Math.floor(Math.random() * 20) - 8;
  onlineUsers = Math.max(950, Math.min(2200, onlineUsers + delta));
  document.getElementById('onlineUsers').textContent = onlineUsers.toLocaleString();
}, 5000);

// ── Review Rotation ──
var reviewPool = [
  { stars: '⭐⭐⭐⭐⭐', text: '"空调温度刚好，座椅加热很舒服"', name: '张先生', ago: '2 分钟前' },
  { stars: '⭐⭐⭐⭐⭐', text: '"比滴滴便宜还快，CoRide 真香"', name: '李女士', ago: '5 分钟前' },
  { stars: '⭐⭐⭐⭐', text: '"路线合理，驾驶很平稳"', name: '王先生', ago: '8 分钟前' },
  { stars: '⭐⭐⭐⭐⭐', text: '"电台功能好评，路上不无聊"', name: '陈同学', ago: '12 分钟前' },
  { stars: '⭐⭐⭐⭐', text: '"第一次用，体验超出预期"', name: '赵女士', ago: '15 分钟前' },
  { stars: '⭐⭐⭐⭐⭐', text: '"静音模式很贴心，不影响工作"', name: '刘经理', ago: '18 分钟前' },
  { stars: '⭐⭐⭐⭐', text: '"比平时打车快了好多"', name: '孙小姐', ago: '22 分钟前' },
  { stars: '⭐⭐⭐⭐⭐', text: '"车内氛围灯太好看了"', name: '周先生', ago: '25 分钟前' },
  { stars: '⭐⭐⭐⭐', text: '"Agent 语音很自然，像真人"', name: '吴女士', ago: '28 分钟前' },
  { stars: '⭐⭐⭐⭐⭐', text: '"下车即删数据，很放心"', name: '郑师傅', ago: '31 分钟前' }
];
var reviewIdx = 5;
function addReview() {
  var list = document.getElementById('reviewList');
  var r = reviewPool[reviewIdx % reviewPool.length];
  reviewIdx++;
  var div = document.createElement('div');
  div.className = 'rv-item';
  div.innerHTML = '<div class="rv-stars">' + r.stars + '</div><div class="rv-text">' + r.text + '</div><div class="rv-meta">' + r.name + ' · ' + r.ago + '</div>';
  list.insertBefore(div, list.firstChild);
  if (list.children.length > 8) { list.removeChild(list.lastChild); }
}
setInterval(addReview, 8000);

// ── Cumulative Flow ──
var cumFlow = 63750;
setInterval(function() {
  cumFlow += Math.floor(Math.random() * 6) + 3;
  document.getElementById('cumFlow').textContent = cumFlow.toLocaleString();
}, 10000);

// ── Revenue bar animation ──
setTimeout(function() {
  document.querySelectorAll('.rb-fill').forEach(function(bar) {
    bar.style.width = bar.style.width; // trigger reflow
  });
}, 500);

// ── Order Filtering ──
function filterOrders(status, el) {
  document.querySelectorAll('.df-tag').forEach(function(t) { t.classList.remove('active'); });
  el.classList.add('active');
  document.querySelectorAll('#screen-orders .vt-row[data-status]').forEach(function(r) {
    if (status === 'all') { r.style.display = 'flex'; }
    else { r.style.display = (r.getAttribute('data-status') === status) ? 'flex' : 'none'; }
  });
}
