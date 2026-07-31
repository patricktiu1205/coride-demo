// 小马智行 · CoRide 渠道看板 Demo

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

// ── Increment orders & revenue ──
var incOrders = 138;
var incRevenue = 41262;
setInterval(function() {
  incOrders += Math.floor(Math.random() * 3);
  incRevenue += Math.floor(Math.random() * 15) + 5;
  document.getElementById('incOrders').textContent = incOrders;
  document.getElementById('incRevenue').textContent = '¥' + incRevenue.toLocaleString();
}, 12000);

// ── Fleet online pulse ──
var fleetOnline = 47;
setInterval(function() {
  var delta = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
  fleetOnline = Math.min(50, Math.max(44, fleetOnline + delta));
  document.getElementById('fleetOnline').textContent = fleetOnline;
}, 10000);

// ── Sparkline regeneration ──
var sparkChars = ['▁','▂','▃','▄','▅','▆','▇','█'];
var sparkIdx = 0;
setInterval(function() {
  var line = '';
  for (var i = 0; i < 30; i++) {
    var v = Math.floor(Math.abs(Math.sin((i + sparkIdx) * 0.25)) * 7);
    line += sparkChars[Math.min(7, v)];
  }
  document.getElementById('sparkline').textContent = line;
  sparkIdx++;
}, 5000);

// ── Vehicle list data refresh ──
var vehData = [
  { id: '#A102', npu: 58, rev: 22 },
  { id: '#A107', npu: 64, rev: 25 },
  { id: '#A112', npu: 0,  rev: 0,  status: 'offline' },
  { id: '#B003', npu: 55, rev: 19 },
  { id: '#B008', npu: 71, rev: 24 },
  { id: '#B015', npu: 0,  rev: 0,  status: 'fault' },
  { id: '#A088', npu: 49, rev: 31 },
  { id: '#A095', npu: 62, rev: 18 }
];

function refreshVehList() {
  var items = document.querySelectorAll('.vl-item');
  items.forEach(function(item, i) {
    if (i < vehData.length && vehData[i].status !== 'offline' && vehData[i].status !== 'fault') {
      vehData[i].npu = Math.min(85, Math.max(35, vehData[i].npu + Math.floor(Math.random() * 9) - 4));
      vehData[i].rev += Math.floor(Math.random() * 3);
      var npuEl = item.querySelector('.vl-npu');
      var revEl = item.querySelector('.vl-revenue');
      if (npuEl) npuEl.textContent = 'NPU ' + vehData[i].npu + '%';
      if (revEl) revEl.textContent = '¥' + vehData[i].rev;
    }
  });
}
setInterval(refreshVehList, 8000);
