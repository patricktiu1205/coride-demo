// ═══ CoRide Operator Admin v2.0 ═══
// Auth guard
if (!sessionStorage.getItem("op_logged_in")) { window.location.href = "login.html"; }

// ═══ OPERATOR INFO ═══
var currentOperator = {
  id: sessionStorage.getItem("op_id") || "PX",
  name: sessionStorage.getItem("op_name") || "小马智行",
  avatar: sessionStorage.getItem("op_avatar") || "🤖",
  color: sessionStorage.getItem("op_color") || "#F5A623"
};

// ═══ PLATFORM DATA (reference, aligned with PlatformAdmin) ═══
var platforms = [
  {id:"PX",name:"小马智行",color:"#F5A623",vehCount:15,onlineCount:14,dailyOrders:345,dailyRevenue:107000,avgPrice:25.80,rating:4.9},
  {id:"WR",name:"文远知行",color:"#4facfe",vehCount:12,onlineCount:11,dailyOrders:276,dailyRevenue:87200,avgPrice:26.30,rating:4.8},
  {id:"AP",name:"百度Apollo",color:"#2ecc71",vehCount:13,onlineCount:13,dailyOrders:299,dailyRevenue:94200,avgPrice:26.20,rating:4.9},
  {id:"AX",name:"AutoX 安途",color:"#e74c3c",vehCount:10,onlineCount:9,dailyOrders:230,dailyRevenue:69400,avgPrice:25.10,rating:4.7}
];
var platformById = {};
platforms.forEach(function(p){ platformById[p.id] = p; });
var opPlatform = platformById[currentOperator.id];

// ═══ NAVIGATION ═══
var currentPage = "dashboard";
var pageLabels = {dashboard:"仪表盘",vehicles:"车辆管理",orders:"订单管理",revenue:"营收分析",ota:"OTA 升级",tickets:"工单管理",reviews:"用户评价",settings:"系统设置"};

function navTo(page) {
  currentPage = page;
  document.querySelectorAll(".sn-item").forEach(function(el){ el.classList.remove("active"); });
  var navItem = document.querySelector(".sn-item[data-page='" + page + "']");
  if (navItem) navItem.classList.add("active");
  document.querySelectorAll(".content-page").forEach(function(el){ el.classList.remove("active"); });
  var pageEl = document.getElementById("page-" + page);
  if (pageEl) pageEl.classList.add("active");
  var bc = document.getElementById("breadcrumb");
  if (bc && pageLabels[page]) bc.textContent = pageLabels[page];
  if (page === "dashboard") renderDashboard();
  if (page === "vehicles") { renderVehicles(); updateSortArrows("vehicles"); }
  if (page === "orders") { orderPage = 1; renderOrders(); updateSortArrows("orders"); }
  if (page === "revenue") renderRevenue();
  if (page === "ota") renderOTA();
  if (page === "tickets") renderTickets();
  if (page === "reviews") renderReviews();
  if (page === "settings") renderSettings();
}

// ═══ TABLE SORTING ═══
var sortState = {vehicles:{col:"id",dir:"asc"},orders:{col:"time",dir:"desc"}};

// ═══ PAGINATION ═══
var orderPage = 1;
var pageSize = 30;

function renderPagination(pageVar, page, totalPages, renderFn) {
  if (totalPages <= 1) return "";
  var h = '<div class="pagination">';
  h += '<button class="pg-btn" onclick="' + pageVar + '=1;' + renderFn + '" ' + (page <= 1 ? "disabled" : "") + '>«</button>';
  h += '<button class="pg-btn" onclick="' + pageVar + '=' + (page - 1) + ';' + renderFn + '" ' + (page <= 1 ? "disabled" : "") + '>‹</button>';
  var startPg = Math.max(1, page - 2);
  var endPg = Math.min(totalPages, page + 2);
  for (var p = startPg; p <= endPg; p++) {
    h += '<button class="pg-btn' + (p === page ? ' active' : '') + '" onclick="' + pageVar + '=' + p + ';' + renderFn + '">' + p + '</button>';
  }
  h += '<button class="pg-btn" onclick="' + pageVar + '=' + (page + 1) + ';' + renderFn + '" ' + (page >= totalPages ? "disabled" : "") + '>›</button>';
  h += '<button class="pg-btn" onclick="' + pageVar + '=' + totalPages + ';' + renderFn + '" ' + (page >= totalPages ? "disabled" : "") + '>»</button>';
  h += '<span class="pg-info">第 ' + page + '/' + totalPages + ' 页</span>';
  h += '</div>';
  return h;
}

function goOrderPage(p) { orderPage = p; renderOrders(); }

function sortTable(table, col) {
  var ss = sortState[table];
  if (ss.col === col) { ss.dir = ss.dir === "asc" ? "desc" : "asc"; }
  else { ss.col = col; ss.dir = "asc"; }
  updateSortArrows(table);
  if (table === "vehicles") renderVehicles();
  else if (table === "orders") renderOrders();
}

function updateSortArrows(table) {
  var ss = sortState[table];
  var thId = table + "Th_" + ss.col;
  var allTh = document.querySelectorAll("#page-" + table + " th.sortable");
  for (var i = 0; i < allTh.length; i++) {
    var arr = allTh[i].querySelector(".sort-arrow");
    if (arr) { arr.textContent = ""; arr.className = "sort-arrow"; }
  }
  var activeTh = document.getElementById(thId);
  if (activeTh) {
    var arrow = activeTh.querySelector(".sort-arrow");
    if (!arrow) { arrow = document.createElement("span"); arrow.className = "sort-arrow"; activeTh.appendChild(arrow); }
    arrow.textContent = ss.dir === "asc" ? "▲" : "▼";
    arrow.className = "sort-arrow " + ss.dir;
  }
}

function applySort(arr, table) {
  var ss = sortState[table];
  if (!ss) return arr;
  var col = ss.col, dir = ss.dir;
  var sorted = arr.slice().sort(function(a, b) {
    var va, vb, cmp;
    var statusOrder = {online:1,offline:2,fault:3,completed:1,ongoing:2,cancelled:3};
    function numVal(s) { var m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }
    if (col === "id" && table === "vehicles") { va = numVal(a.id); vb = numVal(b.id); return dir === "asc" ? va - vb : vb - va; }
    if (col === "id" && table === "orders") { va = numVal(a.id); vb = numVal(b.id); return dir === "asc" ? va - vb : vb - va; }
    if (col === "status") { va = statusOrder[a.status] || 9; vb = statusOrder[b.status] || 9; return dir === "asc" ? va - vb : vb - va; }
    if (["npu","orders","revenue","amount","distance","rating","trips","spend"].indexOf(col) >= 0) {
      va = Number(a[col]) || 0; vb = Number(b[col]) || 0; return dir === "asc" ? va - vb : vb - va;
    }
    va = String(a[col] || ""); vb = String(b[col] || "");
    cmp = va.localeCompare(vb, "zh-CN");
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ═══ LIVE CLOCK ═══
function updateClock() {
  var now = new Date();
  var h = String(now.getHours()).padStart(2,"0");
  var m = String(now.getMinutes()).padStart(2,"0");
  var s = String(now.getSeconds()).padStart(2,"0");
  var el = document.getElementById("liveClock");
  if (el) el.textContent = h + ":" + m + ":" + s + " CST";
}
setInterval(updateClock, 1000); updateClock();

// ═══ THEME TOGGLE ═══
function applyTheme(theme) {
  document.body.classList.toggle("light-theme", theme === "light");
  var el = document.getElementById("themeToggle");
  if (el) el.textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("op_theme", theme);
}
function toggleTheme() {
  var current = document.body.classList.contains("light-theme") ? "dark" : "light";
  applyTheme(current);
}
(function(){
  var saved = localStorage.getItem("op_theme") || "dark";
  applyTheme(saved);
})();

// ═══ TOAST ═══
function showToast(msg, isErr) {
  var t = document.createElement("div");
  t.className = "toast" + (isErr ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function(){ t.remove(); }, 2500);
}

// ═══ MODAL ═══
function openModal(html) {
  var overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  document.getElementById("modalContent").innerHTML = html;
  overlay.style.display = "flex";
}
function closeModal() {
  var overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.style.display = "none";
}

// ═══ LOGOUT ═══
function handleLogout() {
  sessionStorage.removeItem("op_logged_in");
  sessionStorage.removeItem("op_id");
  sessionStorage.removeItem("op_name");
  sessionStorage.removeItem("op_avatar");
  sessionStorage.removeItem("op_color");
  window.location.href = "login.html";
}

// ═══ UPDATE SIDEBAR ═══
function updateSidebar() {
  var nameEl = document.querySelector(".su-name");
  if (nameEl) nameEl.textContent = currentOperator.name;
  var avatarEl = document.querySelector(".su-avatar");
  if (avatarEl) avatarEl.textContent = currentOperator.avatar;
  var logoEl = document.querySelector(".sidebar-logo");
  if (logoEl) logoEl.innerHTML = currentOperator.avatar + " " + currentOperator.name;
  var dotEl = document.querySelector(".sl-dot");
  if (dotEl) dotEl.style.background = currentOperator.color;
  // Update ticket badge
  updateTicketBadge();
}

// ═══ ═══ ═══ DATA — loaded from PlatformAdmin shared store ═══ ═══ ═══
var allVehicles = [];
var allUsers = [];
var allOrders = [];
var locations = ["天河","海珠","越秀","番禺","白云","黄埔"];

// Load shared platform data from localStorage (PlatformAdmin is source of truth)
var sharedData = null;
try {
  var raw = localStorage.getItem("coride_platform_data");
  if (raw) sharedData = JSON.parse(raw);
} catch(e) {}

if (sharedData && sharedData.vehicles && sharedData.orders && sharedData.vehicles.length > 0) {
  // Filter vehicles to this operator
  allVehicles = sharedData.vehicles.filter(function(v) { return v.platform === currentOperator.id; });
  // Build vehicle ID set for order filtering
  var vehIdSet = {};
  for (var vi = 0; vi < allVehicles.length; vi++) { vehIdSet[allVehicles[vi].id] = true; }
  // Filter orders for this operator's vehicles
  allOrders = sharedData.orders.filter(function(o) { return vehIdSet[o.vehicle]; });
  
  // Derive users from order data
  var userMap = {};
  for (var oi = 0; oi < allOrders.length; oi++) {
    var ord = allOrders[oi];
    if (!userMap[ord.userId]) {
      userMap[ord.userId] = {
        id: ord.userId,
        name: ord.passenger,
        phone: ord.userPhone || "13800000000",
        trips: 0,
        spend: 0,
        tags: [],
        city: locations[Math.floor(Math.random() * locations.length)],
        regDate: "2025-0" + (Math.floor(Math.random() * 8) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")
      };
    }
    userMap[ord.userId].trips++;
    userMap[ord.userId].spend = Math.round((userMap[ord.userId].spend + ord.amount) * 100) / 100;
  }
  allUsers = Object.values(userMap);
  // Assign random tags to derived users
  var userTags = ["商务出行","高频通勤","家庭出行","音乐偏好","安静模式","座椅加热","暖色灯光","咖啡爱好者","出差党","周末出游"];
  for (var ui = 0; ui < allUsers.length; ui++) {
    var tags = [];
    var shuffled = userTags.slice().sort(function(){ return Math.random() - 0.5; });
    for (var t = 0; t < Math.floor(Math.random() * 3) + 2; t++) { tags.push(shuffled[t]); }
    allUsers[ui].tags = tags.filter(function(v,idx,s){ return s.indexOf(v) === idx; });
  }
  
  // Re-derive per-vehicle stats from aligned orders
  for (var vii = 0; vii < allVehicles.length; vii++) {
    var vid = allVehicles[vii].id;
    var vOrders = 0, vRevenue = 0;
    for (var oi2 = 0; oi2 < allOrders.length; oi2++) {
      if (allOrders[oi2].vehicle === vid && allOrders[oi2].status !== "cancelled") {
        vOrders++;
        vRevenue += allOrders[oi2].amount;
      }
    }
    allVehicles[vii].orders = vOrders;
    allVehicles[vii].revenue = Math.round(vRevenue);
  }
} else {
  // ═══ FALLBACK: generate data locally if PlatformAdmin hasn't initialized ═══
  var vehModels = ["广汽Aion LX","比亚迪汉EV","小鹏G9","蔚来ET7","红旗E-HS9"];
  var hwSwMap = [
    { hw: "HW 1.0", maxSw: [3,4] },
    { hw: "HW 2.0", maxSw: [3,8] },
    { hw: "HW 3.0", maxSw: [5,2] }
  ];
  var vCount = opPlatform.vehCount;
  var vOnline = opPlatform.onlineCount;
  var vFault = 1;
  var vOffline = vCount - vOnline - vFault;
  var vehStatuses = [];
  for (var i = 0; i < vOnline; i++) vehStatuses.push("online");
  for (var i = 0; i < vOffline; i++) vehStatuses.push("offline");
  if (vFault > 0) vehStatuses.push("fault");
  for (var i = vehStatuses.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = vehStatuses[i]; vehStatuses[i] = vehStatuses[j]; vehStatuses[j] = tmp; }
  
  for (var vi = 0; vi < vCount; vi++) {
    var num = String(vi + 1).padStart(3,"0");
    var st = vehStatuses[vi] || "online";
    var hwIdx = vi < Math.floor(vCount*0.2) ? 2 : vi < Math.floor(vCount*0.7) ? 1 : 0;
    var hwInfo = hwSwMap[hwIdx];
    var swMajor;
    var roll = Math.random();
    if (roll < 0.55)      { swMajor = hwInfo.maxSw[0]; }
    else if (roll < 0.80) { swMajor = Math.max(1, hwInfo.maxSw[0] - 1); }
    else                   { swMajor = Math.max(1, hwInfo.maxSw[0] - 2); }
    var swMinorMax = swMajor >= hwInfo.maxSw[0] ? hwInfo.maxSw[1] : 9;
    var swMinor;
    if (swMajor >= hwInfo.maxSw[0] && Math.random() < 0.55) { swMinor = hwInfo.maxSw[1]; }
    else if (swMajor >= hwInfo.maxSw[0]) { swMinor = Math.max(0, hwInfo.maxSw[1] - Math.floor(Math.random() * 2) - 1); }
    else { swMinor = Math.floor(Math.random() * (swMinorMax + 1)); }
    var swVersion = "v" + swMajor + "." + swMinor;
    allVehicles.push({
      id: currentOperator.id + "-" + num,
      platform: currentOperator.id,
      model: vehModels[Math.floor(Math.random() * vehModels.length)],
      status: st,
      npu: st === "online" ? Math.floor(Math.random() * 40) + 35 : 0,
      orders: 0,
      revenue: 0,
      hwVersion: hwInfo.hw,
      swVersion: swVersion,
      swMax: "v" + hwInfo.maxSw[0] + "." + hwInfo.maxSw[1],
      location: locations[Math.floor(Math.random() * locations.length)],
      lastMaint: "2026-0" + Math.floor(Math.random() * 8 + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")
    });
  }
  
  var surnames = ["陈","李","王","赵","刘","张","黄","周","吴","孙","马","林","何","郭","郑","钱","冯","曹","蒋","沈","杨","朱","秦","许","徐","韩","魏","谢","苏","潘","范","邓","董","梁","宋","唐","于","罗","高"];
  var givenNames = ["小明","婷婷","建国","丽华","伟","敏","志强","雪","磊","雨桐","超","婷","勇","美玲","浩","蕾","军","芳","涛","琳","文","杰","宇","涵","博","静","晨","阳","宁","悦","峰","毅","鹏","慧","彬","然","睿","萱","怡","嘉","瑞","泽","琳","欣","凯","铭"];
  var userTags = ["商务出行","高频通勤","家庭出行","音乐偏好","安静模式","座椅加热","暖色灯光","咖啡爱好者","出差党","周末出游"];
  var userCount = Math.round(vCount * 4);
  for (var ui = 0; ui < userCount; ui++) {
    var sName = surnames[Math.floor(Math.random() * surnames.length)];
    var gName = givenNames[Math.floor(Math.random() * givenNames.length)];
    var fullName = sName + gName;
    var trips = Math.floor(Math.random() * 60) + 5;
    var spend = trips * (Math.floor(Math.random() * 28) + 18);
    var tags = [];
    var shuffledTags = userTags.slice().sort(function(){ return Math.random() - 0.5; });
    for (var t = 0; t < Math.floor(Math.random() * 3) + 2; t++) { tags.push(shuffledTags[t]); }
    tags = tags.filter(function(v,idx,s){ return s.indexOf(v) === idx; });
    allUsers.push({
      id: "U-" + String(ui + 1).padStart(3,"0"),
      name: fullName,
      phone: "138" + String(Math.floor(Math.random() * 90000000) + 10000000),
      trips: trips,
      spend: spend,
      tags: tags,
      city: locations[Math.floor(Math.random() * locations.length)],
      regDate: "2025-" + String(Math.floor(Math.random() * 12) + 1).padStart(2,"0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")
    });
  }
  
  var orderRoutes = [
    {from:"珠江新城",to:"广州南站",dist:18},
    {from:"白云机场",to:"天河城",dist:32},
    {from:"广州南站",to:"珠江新城",dist:18},
    {from:"天河区",to:"白云机场",dist:32},
    {from:"海珠区",to:"广州东站",dist:8},
    {from:"越秀区",to:"番禺广场",dist:22},
    {from:"白云机场",to:"广州南站",dist:55},
    {from:"珠江新城",to:"白云机场",dist:35}
  ];
  var ordersPerVehicle = 23;
  var totalOrders = vCount * ordersPerVehicle;
  var baseH = 8, baseM = 0, baseS = 0;
  for (var oi = 0; oi < totalOrders; oi++) {
    var rt = orderRoutes[Math.floor(Math.random() * orderRoutes.length)];
    var dist = rt.dist + Math.floor(Math.random() * 6) - 3;
    if (dist < 3) dist = 3;
    // Stagger by 1-60s for unique timestamps
    baseS += Math.floor(Math.random() * 60) + 1;
    if (baseS >= 60) { baseM += Math.floor(baseS / 60); baseS = baseS % 60; }
    if (baseM >= 60) { baseH += Math.floor(baseM / 60); baseM = baseM % 60; }
    if (baseH >= 22) { baseH = 8; baseM = 0; baseS = 0; }
    var timeStr = "2026-08-06 " + String(baseH).padStart(2,"0") + ":" + String(baseM).padStart(2,"0") + ":" + String(baseS).padStart(2,"0");
    var tsPart = "20260806" + String(baseH).padStart(2,"0") + String(baseM).padStart(2,"0") + String(baseS).padStart(2,"0");
    var totalMinutes = (baseH - 8) * 60 + baseM;
    var st;
    // Only last 30min can be ongoing; older orders all completed/cancelled.
    if (totalMinutes >= 380)       { st = Math.random() < 0.7 ? "ongoing" : "completed"; }
    else                            { st = Math.random() < 0.06 ? "cancelled" : "completed"; }
    var user = allUsers[Math.floor(Math.random() * allUsers.length)];
    var veh = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    var farePerKm = 1.80 + Math.random() * 0.70;
    var amount = Math.round(dist * farePerKm * 100) / 100;
    if (amount < 12) amount = 12;
    var orderPlatform = veh.id.split("-")[0];
    var orderId = "CO-" + orderPlatform + "-" + tsPart;
    allOrders.push({
      id: orderId,
      passenger: user.name,
      userId: user.id,
      vehicle: veh.id,
      from: rt.from,
      to: rt.to,
      distance: dist,
      amount: amount,
      status: st,
      time: timeStr,
      duration: Math.floor(Math.random() * 40) + 15,
      payment: Math.random() > 0.3 ? "微信支付" : "支付宝",
      rating: Math.random() > 0.1 ? 5 : 4
    });
  }
  // Derive per-vehicle stats
  for (var vii2 = 0; vii2 < allVehicles.length; vii2++) {
    var vid2 = allVehicles[vii2].id;
    var vOrders2 = 0, vRevenue2 = 0;
    for (var oi3 = 0; oi3 < allOrders.length; oi3++) {
      if (allOrders[oi3].vehicle === vid2 && allOrders[oi3].status !== "cancelled") {
        vOrders2++;
        vRevenue2 += allOrders[oi3].amount;
      }
    }
    allVehicles[vii2].orders = vOrders2;
    allVehicles[vii2].revenue = Math.round(vRevenue2);
  }
}

// ═══ REVIEWS ═══
var reviewPool = [
  { stars: "⭐⭐⭐⭐⭐", text: '"空调温度刚好，座椅加热很舒服"', name: "张先生", ago: "2 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐⭐", text: '"比滴滴便宜还快，CoRide 真香"', name: "李女士", ago: "5 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐", text: '"路线合理，驾驶很平稳"', name: "王先生", ago: "8 分钟前", rating: 4 },
  { stars: "⭐⭐⭐⭐⭐", text: '"电台功能好评，路上不无聊"', name: "陈同学", ago: "12 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐", text: '"第一次用，体验超出预期"', name: "赵女士", ago: "15 分钟前", rating: 4 },
  { stars: "⭐⭐⭐⭐⭐", text: '"静音模式很贴心，不影响工作"', name: "刘经理", ago: "18 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐", text: '"比平时打车快了好多"', name: "孙小姐", ago: "22 分钟前", rating: 4 },
  { stars: "⭐⭐⭐⭐⭐", text: '"车内氛围灯太好看了"', name: "周先生", ago: "25 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐", text: '"Agent 语音很自然，像真人"', name: "吴女士", ago: "28 分钟前", rating: 4 },
  { stars: "⭐⭐⭐⭐⭐", text: '"下车即删数据，很放心"', name: "郑师傅", ago: "31 分钟前", rating: 5 },
  { stars: "⭐⭐⭐⭐", text: '"座椅很舒服，空间又大"', name: "黄先生", ago: "35 分钟前", rating: 4 },
  { stars: "⭐⭐⭐⭐⭐", text: '"推荐给所有朋友了"', name: "林小姐", ago: "40 分钟前", rating: 5 }
];

// ═══ TICKET SYSTEM (BIDIRECTIONAL) ═══
// ═══ ═══ ═══ TICKET DATA (localStorage-synced) ═══ ═══ ═══
var ticketCounter = 1;
// CoRide → 运营商: Jetson维护工单
var coRideTickets = [];
// 运营商 → CoRide: 下线/返修/升级通知
var operatorTickets = [];
var ticketDirection = "incoming"; // "incoming" or "outgoing"

function loadSharedTickets() {
  var raw = localStorage.getItem("coride_shared_tickets");
  if (raw) {
    try { return JSON.parse(raw); } catch(e) {}
  }
  return null;
}

function saveSharedTickets() {
  var all = coRideTickets.concat(operatorTickets);
  localStorage.setItem("coride_shared_tickets", JSON.stringify(all));
}

// Initialize tickets: load from localStorage or seed
(function initTickets() {
  var shared = loadSharedTickets();
  if (shared && shared.length > 0) {
    // Restore from localStorage — filter to this operator's tickets
    for (var s = 0; s < shared.length; s++) {
      var st = shared[s];
      // CT tickets: accept if operatorId matches OR is null (broadcast to all)
      // OT tickets: accept only if operatorId matches this operator
      if (st.id.indexOf("CT-") === 0) {
        if (st.operatorId === null || st.operatorId === currentOperator.id) {
          coRideTickets.push(st);
        }
      } else if (st.id.indexOf("OT-") === 0) {
        if (st.operatorId === currentOperator.id) {
          operatorTickets.push(st);
        }
      }
      var num = parseInt(st.id.split("-")[1]);
      if (num >= ticketCounter) ticketCounter = num + 1;
    }
    // Seed if no tickets loaded for this operator
    if (coRideTickets.length === 0) {
      seedCoRideMaintenanceTickets();
      saveSharedTickets();
    }
    if (operatorTickets.length === 0) {
      seedOperatorDemoTickets();
      saveSharedTickets();
    }
  } else {
    // Fresh install: seed all defaults
    seedCoRideMaintenanceTickets();
    seedOperatorDemoTickets();
    saveSharedTickets();
  }
})();

function seedCoRideMaintenanceTickets() {
  // Per-operator differentiated Jetson maintenance tickets
  var tickPool = [];
  var opId = currentOperator.id;
  var opName = currentOperator.name;
  var vehCount = opPlatform.vehCount;

  // Count hardware versions for operator-specific tickets
  var hw3count = 0, hw2count = 0, hw1count = 0;
  for (var vi = 0; vi < allVehicles.length; vi++) {
    if (allVehicles[vi].hwVersion === "HW 3.0") hw3count++;
    else if (allVehicles[vi].hwVersion === "HW 2.0") hw2count++;
    else hw1count++;
  }

  // Common ticket: JetPack security patch (all operators)
  tickPool.push({title:"JetPack 6.0 安全补丁推送",desc:"修复NPU内存泄漏漏洞(CVE-2026-3821)，请3个工作日内完成OTA升级，影响全部" + vehCount + "台车辆。",priority:"high"});

  // HW-version-specific tickets
  if (hw3count > 0) {
    tickPool.push({title:"LiDAR传感器校准提醒（HW 3.0）",desc:"监测到" + hw3count + "台HW 3.0车辆LiDAR偏移超阈值，请安排校准维护。",priority:"medium"});
  }
  if (hw2count > 0) {
    tickPool.push({title:"Jetson Orin Nano 散热模组维护（HW 2.0）",desc:"" + hw2count + "台HW 2.0车辆散热模组需本月清理，请安排轮流进站维护。",priority:"medium"});
  }
  if (hw1count > 0) {
    tickPool.push({title:"摄像头模组老化更换建议（HW 1.0）",desc:"" + hw1count + "台HW 1.0车辆摄像头超3年，夜间识别精度下降，建议逐步更换。",priority:"low"});
  }

  // Operator-specific tickets based on operator identity
  var opSpecific = {
    "PX": [
      {title:"小马智行·南沙区域5G信号优化",desc:"南沙运营区3台车辆偶发5G延迟超标(>200ms)，请检查对应Jetson网络模块。",priority:"medium"},
      {title:"AutoPilot 感知模型推送 v4.2.1",desc:"针对小马智行车辆的定制感知模型，优化羊城通交叉路口识别准确率。",priority:"low"}
    ],
    "WR": [
      {title:"文远知行·黄埔区高精地图更新",desc:"黄埔区3处新设立交通标识需同步至车载地图，涉及" + Math.min(vehCount,6) + "台车辆。",priority:"medium"},
      {title:"WeRide Driver 固件对齐验证",desc:"请验证WR全系车辆Driver固件v3.18兼容性，确保与JetPack 6.0无冲突。",priority:"high"}
    ],
    "AP": [
      {title:"百度Apollo·V2X 路侧单元对接测试",desc:"天河CBD新增5个V2X路侧单元，" + Math.min(vehCount,8) + "台车辆需完成对接测试。",priority:"medium"},
      {title:"Apollo ADFM 大模型推送 v2.0",desc:"端到端自动驾驶大模型更新，需全部Apollo车辆验证推理延时达标。",priority:"high"}
    ],
    "AX": [
      {title:"AutoX·Gen5 传感器套件校准",desc:"AutoX Gen5传感器套件季度校准到期，" + hw3count + "台HW3.0车辆优先安排。",priority:"medium"},
      {title:"AutoX XCU 域控制器诊断日志",desc:"部分XCU上报偶发watchdog复位，请导出近30天诊断日志提交分析。",priority:"medium"}
    ]
  };

  var extra = opSpecific[opId] || [];
  for (var ei = 0; ei < extra.length; ei++) {
    tickPool.push(extra[ei]);
  }

  // Ensure we have at least 5-7 tickets per operator
  for (var jmi = 0; jmi < tickPool.length; jmi++) {
    var jm = tickPool[jmi];
    coRideTickets.push({
      id: "CT-" + String(ticketCounter).padStart(3,"0"),
      type: "maintenance",
      title: jm.title,
      description: jm.desc,
      status: jmi < 3 ? "pending" : jmi < 5 ? "in_progress" : "done",
      priority: jm.priority,
      vehicle: null,
      operatorId: currentOperator.id,
      direction: "coride_to_operator",
      createdAt: "2026-08-0" + (jmi+1) + " " + (10+jmi).toString().padStart(2,"0") + ":30",
      from: "CoRide"
    });
    ticketCounter++;
  }
}

function seedOperatorDemoTickets() {
  var opId = currentOperator.id;
  var opName = currentOperator.name;
  var v1 = allVehicles.length > 1 ? allVehicles[1].id : (opId + "-002");
  var v2 = allVehicles.length > 2 ? allVehicles[2].id : (opId + "-003");

  // Per-operator demo tickets
  var opDemoTickets = {
    "PX": [
      {type:"offline",title:"车辆 " + v2 + " 计划下线通知",desc:"该车将于下周一起临时下线进行常规保养，预计3个工作日后恢复运营。",priority:"medium",vehicle:v2},
      {type:"repair",title:"车辆 " + v1 + " 返厂维修申请",desc:"NPU出现过热保护，已离线。需返厂更换散热模块，预计维修周期5-7天。",priority:"high",vehicle:v1}
    ],
    "WR": [
      {type:"offline",title:"车辆 " + v1 + " 临时停运报备",desc:"为配合黄埔区道路施工，该车8月10-12日暂停运营，已同步通知乘客。",priority:"low",vehicle:v1},
      {type:"repair",title:"车辆 " + v2 + " 触摸屏触控故障维修",desc:"用户多次投诉触控屏漂移，已离线检测，疑似驱动芯片故障，申请返厂更换。",priority:"high",vehicle:v2}
    ],
    "AP": [
      {type:"offline",title:"车辆 " + v2 + " 计划下线升级通知",desc:"该车计划下线安装ADFM大模型v2.0，预计停机4小时。",priority:"medium",vehicle:v2},
      {type:"repair",title:"车辆 " + v1 + " V2X通信模块异常",desc:"RSU对接测试中发现该车V2X时延超标3倍，需更换通信模块。",priority:"high",vehicle:v1}
    ],
    "AX": [
      {type:"offline",title:"车辆 " + v1 + " 例行保养下线通知",desc:"按季度保养计划，该车将于8月9日下线一日进行Gen5传感器套件校准。",priority:"medium",vehicle:v1},
      {type:"repair",title:"车辆 " + v2 + " XCU域控制器异常",desc:"XCU上报多次watchdog复位，系统诊断建议返厂更换控制器。",priority:"high",vehicle:v2}
    ]
  };

  var demos = opDemoTickets[opId] || [
    {type:"offline",title:"车辆 " + v2 + " 计划下线通知",desc:"常规保养，3个工作日后恢复。",priority:"medium",vehicle:v2},
    {type:"repair",title:"车辆 " + v1 + " 返厂维修申请",desc:"硬件故障，需返厂维修。",priority:"high",vehicle:v1}
  ];

  for (var di = 0; di < demos.length; di++) {
    var d = demos[di];
    operatorTickets.push({
      id: "OT-" + String(ticketCounter).padStart(3,"0"),
      type: d.type,
      title: d.title,
      description: d.desc,
      status: di === 0 ? "pending" : "in_progress",
      priority: d.priority,
      vehicle: d.vehicle,
      operatorId: currentOperator.id,
      direction: "operator_to_coride",
      createdAt: "2026-08-0" + (6 - di) + " " + (14 + di).toString().padStart(2,"0") + ":20",
      from: currentOperator.name
    });
    ticketCounter++;
  }
}

function createOperatorTicket(type, title, desc, vehicleId) {
  var id = "OT-" + String(ticketCounter).padStart(3,"0");
  ticketCounter++;
  operatorTickets.push({
    id: id, type: type, title: title, description: desc || "",
    status: "pending", priority: type === "repair" ? "high" : "medium",
    vehicle: vehicleId || null,
    operatorId: currentOperator.id,
    direction: "operator_to_coride",
    createdAt: new Date().toISOString().slice(0,16).replace("T"," "),
    from: currentOperator.name
  });
  updateTicketBadge();
  saveSharedTickets();
  return id;
}

function updateTicketBadge() {
  var pendingCount = 0;
  for (var i = 0; i < coRideTickets.length; i++) { if (coRideTickets[i].status === "pending") pendingCount++; }
  for (var j = 0; j < operatorTickets.length; j++) { if (operatorTickets[j].status === "pending") pendingCount++; }
  var badge = document.getElementById("ticketBadge");
  if (badge) {
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? "" : "none";
  }
}

function changeVehicleStatus(vehId, newStatus) {
  var veh = null;
  for (var i = 0; i < allVehicles.length; i++) { if (allVehicles[i].id === vehId) { veh = allVehicles[i]; break; } }
  if (!veh) return;
  var oldStatus = veh.status;
  veh.status = newStatus;
  if (newStatus === "offline") veh.npu = 0;
  if (newStatus === "fault") { veh.npu = 0; veh.orders = 0; }
  if (newStatus === "online") veh.npu = Math.floor(Math.random() * 40) + 35;
  // Auto-create operator→CoRide ticket
  if (newStatus === "offline" && oldStatus === "online") {
    createOperatorTicket("offline", "车辆 " + vehId + " 下线通知", "从在线变更为离线", vehId);
  }
  if (newStatus === "fault") {
    createOperatorTicket("repair", "车辆 " + vehId + " 故障返修通知", "从" + (oldStatus==="online"?"在线":"离线") + "变更为故障，需返厂维修", vehId);
  }
  showToast("车辆 " + vehId + " 状态已更新 → " + (newStatus==="online"?"在线":newStatus==="offline"?"下线":"故障"));
  renderVehicles();
  renderDashboard();
}

// ═══ CHAT DATA ═══
var chatConversations = [];
var chatConvId = 1;
var chatMessagesSample = [
  ["你好，我刚才打的车空调好像不制冷了", "我的订单号是 CO-PX-20260807-0001" ],
  ["请问今天的车辆有WiFi吗？", "上次坐的那辆车信号不太好" ],
  ["你们的会员怎么开通？", "每月12块钱包含什么服务？" ],
  ["刚坐完车，体验很好！", "给司机点个赞👍" ],
  ["我想投诉，司机绕路了", "本来18公里的路走了25公里" ],
  ["请问发票怎么开？", "公司需要报销" ],
  ["车辆内部有点脏，建议清洁一下", "" ],
  ["蓝牙连不上车机怎么办", "重启了手机也不行" ]
];

for (var ci = 0; ci < Math.min(8, chatMessagesSample.length); ci++) {
  var chatId = "C" + String(ci + 1).padStart(3,"0");
  // Pick a user from our user pool
  var cUser = allUsers[ci % allUsers.length];
  var msgs = chatMessagesSample[ci];
  var now = new Date();
  var conv = {
    id: chatId,
    user: cUser ? cUser.name : "用户" + (ci + 1),
    phone: cUser ? cUser.phone : "1380000" + String(ci).padStart(4,"0"),
    online: ci < 5,
    messages: []
  };
  // Add user messages
  for (var mi = 0; mi < msgs.length; mi++) {
    if (msgs[mi]) {
      var mTime = new Date(now.getTime() - (msgs.length - mi) * 180000);
      conv.messages.push({ from: "user", text: msgs[mi], time: String(mTime.getHours()).padStart(2,"0") + ":" + String(mTime.getMinutes()).padStart(2,"0") });
    }
  }
  chatConversations.push(conv);
  chatConvId++;
}
var activeChat = chatConversations.length > 0 ? chatConversations[0].id : null;

// ═══ ═══ ═══ RENDER: DASHBOARD ═══ ═══ ═══
function renderDashboard() {
  var onlineCount = 0;
  for (var i = 0; i < allVehicles.length; i++) { if (allVehicles[i].status === "online") onlineCount++; }

  // KPI cards
  var totalRev = 0, completedCount = 0;
  for (var j = 0; j < allOrders.length; j++) { totalRev += allOrders[j].amount; if (allOrders[j].status === "completed") completedCount++; }
  var elFleet = document.getElementById("kpiFleet"); if (elFleet) elFleet.textContent = onlineCount + "/" + allVehicles.length;
  var elOrders = document.getElementById("kpiOrders"); if (elOrders) elOrders.textContent = allOrders.length;
  var elRev = document.getElementById("kpiRevenue"); if (elRev) elRev.textContent = "¥" + totalRev.toLocaleString();
  var elRating = document.getElementById("kpiRating"); if (elRating) elRating.textContent = "⭐ " + opPlatform.rating;

  // Vehicle grid
  var vh = "";
  for (var k = 0; k < allVehicles.length; k++) {
    var v = allVehicles[k];
    vh += "<div class='veh-item'><div class='vi-id'>" + v.id + "</div><div class='vi-status " + v.status + "'>" + (v.status==="online"?"🟢 在线":v.status==="offline"?"🟡 离线":"🔴 故障") + "</div><div class='vi-npu'>NPU " + (v.npu || 0) + "%</div></div>";
  }
  var vg = document.getElementById("vehGrid"); if (vg) vg.innerHTML = vh;

  // Order stream
  var rl = document.getElementById("reviewList");
  var ol = document.getElementById("orderList");

  // Jet health panel
  var jhFill = document.getElementById("jhFill");
  if (jhFill) jhFill.style.width = (onlineCount / allVehicles.length * 100).toFixed(1) + "%";
  var jhOnline = document.getElementById("jhOnline"); if (jhOnline) jhOnline.textContent = onlineCount;
  var jhTotal = document.getElementById("jhTotal"); if (jhTotal) jhTotal.textContent = allVehicles.length;
}

// ═══ REAL-TIME ORDER STREAM ═══
var orderStreamNum = allOrders.length + 1;
setInterval(function() {
  if (currentPage !== "dashboard") return;
  var ol = document.getElementById("orderList");
  if (!ol) return;
  var r = orderRoutes[Math.floor(Math.random() * orderRoutes.length)];
  var now = new Date();
  var time = String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0") + ":" + String(now.getSeconds()).padStart(2,"0");
  var div = document.createElement("div");
  div.className = "ol-item";
  div.innerHTML = '<span class="ol-id">#CO' + String(orderStreamNum).padStart(6,"0") + '</span><span class="ol-route">' + r.from + ' → ' + r.to + '</span><span class="ol-fee">¥' + (Math.random()*30+15).toFixed(2) + '</span><span class="ol-time">' + time + '</span>';
  ol.insertBefore(div, ol.firstChild);
  orderStreamNum++;
  if (ol.children.length > 20) { ol.removeChild(ol.lastChild); }
}, 3500);

// ═══ REAL-TIME REVIEW ROTATION ═══
var reviewIdx = 0;
setInterval(function() {
  if (currentPage !== "dashboard") return;
  var rl = document.getElementById("reviewList");
  if (!rl) return;
  var r = reviewPool[reviewIdx % reviewPool.length];
  reviewIdx++;
  var div = document.createElement("div");
  div.className = "rv-item";
  div.innerHTML = '<div class="rv-stars">' + r.stars + '</div><div class="rv-text">' + r.text + '</div><div class="rv-meta">' + r.name + ' · ' + r.ago + '</div>';
  rl.insertBefore(div, rl.firstChild);
  if (rl.children.length > 8) { rl.removeChild(rl.lastChild); }
}, 8000);

// ═══ REVENUE COUNTER ═══
var liveRevenue = opPlatform.dailyRevenue;
setInterval(function() {
  liveRevenue += Math.floor(Math.random() * 3) + 1;
  var el = document.getElementById("kpiRevenue");
  if (el && currentPage === "dashboard") el.textContent = "¥" + liveRevenue.toLocaleString();
}, 15000);

// ═══ ═══ ═══ RENDER: VEHICLES ═══ ═══ ═══
function renderVehicles() {
  var filter = document.getElementById("vehFilter");
  var search = document.getElementById("vehSearch");
  var filterVal = filter ? filter.value : "all";
  var searchVal = search ? search.value.toLowerCase() : "";
  var filtered = allVehicles.filter(function(v){
    if (filterVal !== "all" && v.status !== filterVal) return false;
    if (searchVal && v.id.toLowerCase().indexOf(searchVal) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "vehicles");
  // Stats cards
  var onlineC = 0, offlineC = 0, faultC = 0;
  for (var si = 0; si < allVehicles.length; si++) {
    if (allVehicles[si].status === "online") onlineC++;
    else if (allVehicles[si].status === "offline") offlineC++;
    else faultC++;
  }
  document.getElementById("vehOnline").textContent = onlineC;
  document.getElementById("vehOffline").textContent = offlineC;
  document.getElementById("vehFault").textContent = faultC;
  document.getElementById("vehOnlineRate").textContent = (onlineC / allVehicles.length * 100).toFixed(1) + "%";
  var el = document.getElementById("vehCount"); if (el) el.textContent = "共 " + filtered.length + " 台";
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var v = filtered[i];
    var stBadge = v.status === "online" ? "<span class='badge green'>在线</span>" : v.status === "offline" ? "<span class='badge orange'>离线</span>" : "<span class='badge red'>故障</span>";
    var hwBadge = v.hwVersion === "HW 3.0" ? "<span style='color:#2ecc71;font-weight:600'>" + v.hwVersion + "</span>" : v.hwVersion === "HW 2.0" ? "<span style='color:#4facfe;font-weight:600'>" + v.hwVersion + "</span>" : "<span style='color:var(--text-tertiary)'>" + v.hwVersion + "</span>";
    var needUpgrade = v.swVersion !== v.swMax;
    var swDisplay = needUpgrade ? v.swVersion + " / " + v.swMax + " <span class='badge orange' style='font-size:9px;padding:1px 4px'>可升级</span>" : v.swVersion + " <span class='badge green' style='font-size:9px;padding:1px 4px'>最新</span>";
    var actions = "";
    if (v.status === "online") {
      actions += "<button class='dt-btn warn' onclick='changeVehicleStatus(\"" + v.id + "\",\"offline\")' title='下线'>⬇</button> ";
      actions += "<button class='dt-btn danger' onclick='changeVehicleStatus(\"" + v.id + "\",\"fault\")' title='报修'>🔧</button>";
    } else if (v.status === "offline") {
      actions += "<button class='dt-btn view' onclick='changeVehicleStatus(\"" + v.id + "\",\"online\")' title='上线'>⬆</button>";
    } else if (v.status === "fault") {
      actions += "<button class='dt-btn view' onclick='changeVehicleStatus(\"" + v.id + "\",\"online\")' title='恢复上线'>⬆</button>";
    }
    h += "<tr><td><b>" + v.id + "</b></td><td>" + v.model + "</td><td>" + stBadge + "</td><td>" + (v.npu ? v.npu + "%" : "-") + "</td><td>" + v.orders + " 单</td><td>¥" + v.revenue + "</td><td>" + hwBadge + "</td><td>" + swDisplay + "</td><td>" + v.lastMaint + "</td><td style='display:flex;gap:4px'>" + actions + "</td></tr>";
  }
  var tb = document.getElementById("vehTableBody"); if (tb) tb.innerHTML = h;
}

// ═══ ═══ ═══ RENDER: ORDERS ═══ ═══ ═══
function renderOrders() {
  var filter = document.getElementById("orderFilter");
  var search = document.getElementById("orderSearch");
  var filterVal = filter ? filter.value : "all";
  var searchVal = search ? search.value.toLowerCase() : "";
  var filtered = allOrders.filter(function(o){
    if (filterVal !== "all" && o.status !== filterVal) return false;
    if (searchVal && o.id.toLowerCase().indexOf(searchVal) === -1 && o.vehicle.toLowerCase().indexOf(searchVal) === -1 && o.passenger.toLowerCase().indexOf(searchVal) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "orders");
  var el = document.getElementById("orderCount"); if (el) el.textContent = "共 " + filtered.length + " 单";

  // Stats
  var totalRev = 0, completedCount = 0;
  for (var i = 0; i < allOrders.length; i++) { totalRev += allOrders[i].amount; if (allOrders[i].status === "completed") completedCount++; }
  var avgPrice = allOrders.length > 0 ? (totalRev / allOrders.length) : 0;
  var completeRate = allOrders.length > 0 ? (completedCount / allOrders.length * 100) : 0;
  var elToday = document.getElementById("osToday"); if (elToday) elToday.textContent = allOrders.length;
  var elRev = document.getElementById("osRevenue"); if (elRev) elRev.textContent = "¥" + totalRev.toLocaleString();
  var elRate = document.getElementById("osCompleteRate"); if (elRate) elRate.textContent = completeRate.toFixed(1) + "%";
  var elAvg = document.getElementById("osAvgPrice"); if (elAvg) elAvg.textContent = "¥" + avgPrice.toFixed(2);

  var totalPages = Math.ceil(filtered.length / pageSize) || 1;
  if (orderPage > totalPages) orderPage = totalPages;
  var start = (orderPage - 1) * pageSize;
  var pageData = filtered.slice(start, start + pageSize);
  var h = "";
  for (var j = 0; j < pageData.length; j++) {
    var o = pageData[j];
    var stBadge = o.status === "completed" ? "<span class='badge green'>已完成</span>" : o.status === "ongoing" ? "<span class='badge blue'>进行中</span>" : "<span class='badge gray'>已取消</span>";
    h += "<tr><td><b>" + o.id + "</b></td><td>" + o.passenger + "</td><td>" + o.vehicle + "</td><td>" + o.from + " → " + o.to + "</td><td>" + o.distance + "km</td><td>¥" + o.amount.toFixed(2) + "</td><td>" + stBadge + "</td><td>" + o.time + "</td><td><button class='dt-btn view' onclick='viewOrder(\"" + o.id + "\")'>详情</button></td></tr>";
  }
  var tb = document.getElementById("orderTableBody"); if (tb) tb.innerHTML = h;
  var pg = document.getElementById("orderPagination"); if (pg) pg.innerHTML = renderPagination("orderPage", orderPage, totalPages, "renderOrders()");
}

function viewOrder(oid) {
  var o = null;
  for (var i = 0; i < allOrders.length; i++) { if (allOrders[i].id === oid) { o = allOrders[i]; break; } }
  if (!o) return;
  var stBadge = o.status === "completed" ? "<span class='badge green'>已完成</span>" : o.status === "ongoing" ? "<span class='badge blue'>进行中</span>" : "<span class='badge gray'>已取消</span>";
  openModal("<div class='modal-header'><span class='mh-title'>📋 订单详情 " + o.id + "</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>乘客</div><div class='mb-val'>" + o.passenger + "</div></div><div class='mb-item'><div class='mb-label'>车辆</div><div class='mb-val'>" + o.vehicle + "</div></div><div class='mb-item'><div class='mb-label'>状态</div><div class='mb-val'>" + stBadge + "</div></div></div>" +
    "<div class='mb-section-title'>🗺 行程信息</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>起点</div><div class='mb-val'>" + o.from + "</div></div><div class='mb-item'><div class='mb-label'>终点</div><div class='mb-val'>" + o.to + "</div></div><div class='mb-item'><div class='mb-label'>距离 / 时长</div><div class='mb-val'>" + o.distance + "km / " + o.duration + "分钟</div></div></div>" +
    "<div class='mb-section-title'>💰 费用明细</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>乘车费</div><div class='mb-val'>¥" + o.amount.toFixed(2) + "</div></div><div class='mb-item'><div class='mb-label'>支付方式</div><div class='mb-val'>" + o.payment + "</div></div><div class='mb-item'><div class='mb-label'>下单时间</div><div class='mb-val'>" + o.time + "</div></div></div>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>用户评分</div><div class='mb-val'>" + "⭐".repeat(o.rating) + "</div></div></div></div>");
}

// ═══ ═══ ═══ RENDER: USERS ═══ ═══ ═══
function renderUsers() {
  var filtered = applySort(allUsers.slice(), "users");
  document.getElementById("userCount").textContent = "共 " + filtered.length + " 人";

  // Stats
  var todayNew = Math.floor(filtered.length * 0.05);
  var active7d = Math.floor(filtered.length * 0.6);
  var retention = Math.floor(55 + Math.random() * 15);
  var elT = document.getElementById("usToday"); if (elT) elT.textContent = filtered.length;
  var elN = document.getElementById("usNew"); if (elN) elN.textContent = todayNew;
  var elA = document.getElementById("usActive"); if (elA) elA.textContent = active7d;
  var elR = document.getElementById("usRetention"); if (elR) elR.textContent = retention + "%";

  // Funnel
  var funnel = [
    {label:"浏览服务",val:Math.floor(filtered.length*2.5),pct:100},
    {label:"注册用户",val:filtered.length,pct:40},
    {label:"完成首单",val:Math.floor(filtered.length*0.7),pct:28},
    {label:"活跃用户",val:active7d,pct:24}
  ];
  var fh = "";
  for (var i = 0; i < funnel.length; i++) {
    var f = funnel[i];
    fh += "<div class='fn-bar' style='width:" + f.pct + "%'>" + f.label + "<span>" + f.val + "</span></div>";
  }
  var fc = document.getElementById("userFunnel"); if (fc) fc.innerHTML = fh;

  // City distribution
  var cityMap = {};
  for (var j = 0; j < allUsers.length; j++) { var c = allUsers[j].city; cityMap[c] = (cityMap[c] || 0) + 1; }
  var cities = [];
  for (var k in cityMap) cities.push({name:k, count:cityMap[k]});
  cities.sort(function(a,b){ return b.count - a.count; });
  var maxC = cities.length > 0 ? cities[0].count : 1;
  var ch = "";
  for (var m = 0; m < cities.length; m++) {
    var ct = cities[m];
    ch += "<div class='cb-row'><span>" + ct.name + "</span><div class='cb-track'><div class='cb-fill' style='width:" + (ct.count/maxC*100) + "%'></div></div><span>" + ct.count + "人</span></div>";
  }
  var cc = document.getElementById("cityChart"); if (cc) cc.innerHTML = ch;

  // Table
  var h = "";
  for (var n = 0; n < filtered.length; n++) {
    var u = filtered[n];
    h += "<tr><td><b>" + u.id + "</b></td><td>" + u.name + "</td><td>" + u.phone + "</td><td>" + u.trips + " 次</td><td>¥" + u.spend + "</td><td>" + u.city + "</td><td>" + u.regDate + "</td><td><button class='dt-btn view' onclick='viewUser(\"" + u.id + "\")'>详情</button></td></tr>";
  }
  var tb = document.getElementById("userTableBody"); if (tb) tb.innerHTML = h;
}

function viewUser(uid) {
  var u = null;
  for (var i = 0; i < allUsers.length; i++) { if (allUsers[i].id === uid) { u = allUsers[i]; break; } }
  if (!u) return;
  openModal("<div class='modal-header'><span class='mh-title'>👤 " + u.name + " 用户详情</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>用户 ID</div><div class='mb-val'>" + u.id + "</div></div><div class='mb-item'><div class='mb-label'>手机号</div><div class='mb-val'>" + u.phone + "</div></div><div class='mb-item'><div class='mb-label'>所在城市</div><div class='mb-val'>" + u.city + "</div></div></div>" +
    "<div class='mb-section-title'>📊 消费数据</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>累计行程</div><div class='mb-val'>" + u.trips + " 次</div></div><div class='mb-item'><div class='mb-label'>累计消费</div><div class='mb-val'>¥" + u.spend + "</div></div><div class='mb-item'><div class='mb-label'>注册时间</div><div class='mb-val'>" + u.regDate + "</div></div></div>" +
    "<div class='mb-section-title'>🏷 用户标签</div><div class='mb-val'>" + u.tags.map(function(t){ return "<span class='badge orange' style='margin:2px'>" + t + "</span>"; }).join(" ") + "</div>" +
    "</div>");
}

// ═══ ═══ ═══ RENDER: REVENUE ═══ ═══ ═══
function renderRevenue() {
  // ═══ Platform-wide baseline (aligned with CoRide PlatformAdmin) ═══
  // Total fleet: 50 vehicles, ~9 orders/vehicle/day, ~¥25 avg fare
  // Platform daily ride revenue baseline: 50 × 9 × 25 = ¥11,250
  var platformDailyBaseline = 11250;
  // Operator share = fleet proportion: this operator's vehicles / 50
  var opShare = opPlatform.vehCount / 50;
  var opDaily = Math.round(platformDailyBaseline * opShare);

  // Today's actual ride revenue from this operator's orders (for KPI cards)
  var totalRideRev = 0, completedCount = 0;
  for (var i = 0; i < allOrders.length; i++) {
    totalRideRev += allOrders[i].amount;
    if (allOrders[i].status === "completed") completedCount++;
  }
  var avgPrice = allOrders.length > 0 ? (totalRideRev / allOrders.length) : 0;

  // Revenue KPI cards
  var mKpi = document.getElementById("revKpiTotal"); if (mKpi) mKpi.innerHTML = '<div class="os-val">¥' + totalRideRev.toLocaleString() + '</div><div class="os-label">今日流水</div>';
  var mCompl = document.getElementById("revKpiCompleted"); if (mCompl) mCompl.innerHTML = '<div class="os-val" style="color:var(--green)">' + completedCount + ' 单</div><div class="os-label">已完成</div>';
  var mAvg = document.getElementById("revKpiAvg"); if (mAvg) mAvg.innerHTML = '<div class="os-val">¥' + avgPrice.toFixed(2) + '</div><div class="os-label">均单价</div>';

  // ═══ Monthly trend: platform total → operator proportional share ═══
  // Growth scales mirror PlatformAdmin's monthly curve (Jan→Aug)
  var growthScales = [0.39, 0.48, 0.57, 0.65, 0.74, 0.83, 0.91, 1.00];
  var months = ["1月","2月","3月","4月","5月","6月","7月","8月"];
  var platformMonthly = [];  // platform total monthly revenue (X = a+b+c+d)
  var opMonthly = [];       // this operator's proportional share
  for (var m = 0; m < 8; m++) {
    platformMonthly.push(Math.round(platformDailyBaseline * 30 * growthScales[m]));
    opMonthly.push(Math.round(platformMonthly[m] * opShare));
  }

  // Annual target: ~¥33k per vehicle per year
  var annualTarget = opPlatform.vehCount * 33000;
  var histTotal = 0;
  for (var mm = 0; mm < 8; mm++) histTotal += opMonthly[mm];

  // Bar chart
  var maxVal = opMonthly[7];
  var bh = "";
  for (var mi = 0; mi < 8; mi++) {
    var pct = maxVal > 0 ? (opMonthly[mi] / maxVal * 100) : 0;
    var barH = Math.max(4, Math.round(pct * 1.8));
    bh += "<div style='flex:1;display:flex;flex-direction:column;align-items:center;gap:6px'>" +
      "<span style='font-size:10px;color:var(--orange);font-weight:600'>¥" + (opMonthly[mi]/1000).toFixed(1) + "k</span>" +
      "<div style='width:100%;max-width:60px;height:" + barH + "px;background:linear-gradient(180deg,var(--orange),#f7c873);border-radius:6px 6px 0 0'></div>" +
      "<span style='font-size:10px;color:var(--text-dim)'>" + months[mi] + "</span></div>";
  }
  var revBars = document.getElementById("revBars"); if (revBars) revBars.innerHTML = "<div style='display:flex;align-items:flex-end;justify-content:space-around;height:200px;padding:0 10px'>" + bh + "</div>";

  // Target + platform alignment note
  var targetEl = document.getElementById("revTarget");
  if (targetEl) targetEl.innerHTML = '年度目标: ¥' + annualTarget.toLocaleString() + ' | 达成率: ' + Math.round(histTotal / annualTarget * 100) + '%<br><span style="font-size:10px;color:var(--text-tertiary)">占平台总量 ' + Math.round(opShare * 100) + '%（' + opPlatform.vehCount + '/50 台）| 平台8月总流水: ¥' + (platformMonthly[7]).toLocaleString() + '</span>';

  // Hide the trend chart panel (not needed)
  var tc = document.getElementById("revTrendChart");
  if (tc) tc.style.display = "none";
}

// ═══ ═══ ═══ RENDER: OTA ═══ ═══ ═══
function renderOTA() {
  var filter = document.getElementById("otaFilter");
  var filterVal = filter ? filter.value : "all";
  var needUpgrade = 0, upToDate = 0;
  var filtered = allVehicles.filter(function(v){
    if (filterVal === "pending") return v.swVersion !== v.swMax;
    if (filterVal === "latest") return v.swVersion === v.swMax;
    return true;
  });
  for (var i = 0; i < allVehicles.length; i++) {
    if (allVehicles[i].swVersion !== allVehicles[i].swMax) needUpgrade++; else upToDate++;
  }
  var el = document.getElementById("otaCount"); if (el) el.textContent = "共 " + filtered.length + " 台";
  var elUp = document.getElementById("otaNeedUpgrade"); if (elUp) elUp.textContent = needUpgrade;
  var elOk = document.getElementById("otaUpToDate"); if (elOk) elOk.textContent = upToDate;
  var elCov = document.getElementById("otaCoverage"); if (elCov) elCov.textContent = Math.round(upToDate/allVehicles.length*100) + "%";

  // Version distribution bar chart
  var verMap = {};
  for (var j = 0; j < allVehicles.length; j++) { var sv = allVehicles[j].swVersion; verMap[sv] = (verMap[sv] || 0) + 1; }
  var sortedVers = Object.keys(verMap).sort();
  var vh = "";
  for (var k = 0; k < sortedVers.length; k++) {
    var ver = sortedVers[k], cnt = verMap[ver];
    var pct = cnt / allVehicles.length * 100;
    var isLatest = allVehicles.some(function(x){ return x.swMax === ver; });
    vh += "<div class='vb-row" + (isLatest ? " vb-latest" : " vb-outdated") + "'><span class='vb-label'>" + ver + "</span><div class='vb-track'><div class='vb-fill' style='width:" + pct + "%'>" + cnt + " 台</div></div></div>";
  }
  var vb = document.getElementById("versionBars"); if (vb) vb.innerHTML = vh;

  // Table
  var h = "";
  for (var m = 0; m < filtered.length; m++) {
    var v = filtered[m];
    var needUp = v.swVersion !== v.swMax;
    var stBadge = needUp ? "<span class='badge orange'>可升级</span>" : "<span class='badge green'>已最新</span>";
    var btn = needUp ? "<button class='dt-btn' style='background:var(--orange);color:#fff;font-size:11px;padding:4px 12px' onclick='submitUpgradeTicket(\"" + v.id + "\")'>⬆ 申请升级</button>" : "<span style='color:var(--text-tertiary);font-size:11px'>—</span>";
    h += "<tr><td><b>" + v.id + "</b></td><td>" + v.model + "</td><td>" + v.hwVersion + "</td><td>" + v.swVersion + "</td><td>" + v.swMax + "</td><td>" + stBadge + "</td><td>" + btn + "</td></tr>";
  }
  var tb = document.getElementById("otaTableBody"); if (tb) tb.innerHTML = h;
}

function submitUpgradeTicket(vehId) {
  createOperatorTicket("upgrade", "OTA升级申请: " + vehId, "申请将车辆 " + vehId + " 升级至最新软件版本", vehId);
  showToast("已提交升级工单: " + vehId);
  renderOTA();
  renderTickets();
}

// ═══ ═══ ═══ RENDER: TICKETS ═══ ═══ ═══
function renderTickets() {
  var tickets = ticketDirection === "incoming" ? coRideTickets : operatorTickets;
  var filterVal = ticketFilter || "all";
  var filtered = tickets.filter(function(t){
    if (filterVal !== "all" && t.status !== filterVal) return false;
    return true;
  });
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var t = filtered[i];
    var typeNames = {maintenance:"Jetson维护",upgrade:"升级申请",offline:"下线通知",repair:"返厂维修","other":"其他"};
    var typeIcon = {maintenance:"🖥",upgrade:"⬆",offline:"⬇",repair:"🔧","other":"📋"};
    var stBadge = t.status === "pending" ? "<span class='badge red'>待处理</span>" : t.status === "in_progress" ? "<span class='badge orange'>处理中</span>" : "<span class='badge green'>已完成</span>";
    var priClass = t.priority === "high" ? "high" : t.priority === "medium" ? "medium" : "low";
    var priLabel = t.priority === "high" ? "🔴 高" : t.priority === "medium" ? "🟡 中" : "🟢 低";
    var fromLabel = ticketDirection === "incoming" ? "📩 CoRide → 你" : "📤 " + currentOperator.name + " → CoRide";
    var actions = "";
    if (ticketDirection === "incoming") {
      if (t.status === "pending") actions += "<button class='dt-btn view' onclick='toggleTicketStatus(\"" + t.id + "\",\"in_progress\")' style='margin-right:4px'>确认接单</button>";
      if (t.status === "in_progress") actions += "<button class='dt-btn warn' onclick='toggleTicketStatus(\"" + t.id + "\",\"done\")' style='margin-right:4px'>标记完成</button>";
    } else {
      if (t.status === "pending") actions += "<button class='dt-btn warn' onclick='toggleTicketStatus(\"" + t.id + "\",\"done\")' style='margin-right:4px'>撤回</button>";
    }
    h += "<div class='ticket-card'>" +
      "<div class='tc-head'><span class='tc-id'>" + (typeIcon[t.type] || "📋") + " " + t.id + "</span><span class='tc-type'>" + (typeNames[t.type] || t.type) + "</span></div>" +
      "<div class='tc-title'>" + t.title + "</div>" +
      (t.description ? "<div class='tc-desc'>" + t.description + "</div>" : "") +
      "<div class='tc-footer'><span>" + fromLabel + " · <span class='ticket-priority " + priClass + "'>" + priLabel + "</span> · " + stBadge + (t.vehicle ? " · 🚗 " + t.vehicle : "") + "</span><span>" + t.createdAt + " · " + actions + "</span></div>" +
      "</div>";
  }
  var tl = document.getElementById("ticketList"); if (tl) tl.innerHTML = h || "<div style='color:var(--text-muted);padding:20px;text-align:center'>暂无工单</div>";
  // Update direction tab badges
  var incCount = 0, outCount = 0;
  for (var ci = 0; ci < coRideTickets.length; ci++) { if (coRideTickets[ci].status === "pending") incCount++; }
  for (var co = 0; co < operatorTickets.length; co++) { if (operatorTickets[co].status === "pending") outCount++; }
  var it = document.getElementById("tkTabIncoming"); if (it) it.textContent = "📥 CoRide → 运营商" + (incCount > 0 ? " (" + incCount + ")" : "");
  var ot = document.getElementById("tkTabOutgoing"); if (ot) ot.textContent = "📤 运营商 → CoRide" + (outCount > 0 ? " (" + outCount + ")" : "");
  updateTicketBadge();
}

function toggleTicketStatus(ticketId, newStatus) {
  var pool = ticketDirection === "incoming" ? coRideTickets : operatorTickets;
  var t = null;
  for (var i = 0; i < pool.length; i++) { if (pool[i].id === ticketId) { t = pool[i]; break; } }
  if (!t) return;
  t.status = newStatus;
  saveSharedTickets();
  var statusNames = {pending:"待处理",in_progress:"处理中",done:"已完成"};
  showToast("工单 " + ticketId + " → " + (statusNames[newStatus] || newStatus));
  renderTickets();
}

// ═══ TICKET FILTER ═══
var ticketFilter = "all";
function filterTickets(f) {
  ticketFilter = f;
  var map = {all:"tkFilterAll", pending:"tkFilterPending", in_progress:"tkFilterProgress", done:"tkFilterDone"};
  ["all","pending","in_progress","done"].forEach(function(k) {
    var el = document.getElementById(map[k]);
    if (el) el.className = "badge " + (f === k ? "orange" : "gray");
  });
  renderTickets();
}

function setTicketDirection(dir) {
  ticketDirection = dir;
  var incTab = document.getElementById("tkTabIncoming");
  var outTab = document.getElementById("tkTabOutgoing");
  if (incTab) { incTab.style.background = dir === "incoming" ? "var(--orange)" : "var(--bg-tertiary)"; incTab.style.color = dir === "incoming" ? "#fff" : "var(--text-primary)"; }
  if (outTab) { outTab.style.background = dir === "outgoing" ? "var(--orange)" : "var(--bg-tertiary)"; outTab.style.color = dir === "outgoing" ? "#fff" : "var(--text-primary)"; }
  filterTickets("all");
}

// ═══ TICKET MODAL (Operator → CoRide) ═══
function openTicketModal(type) {
  var h = "<h2>" + (type === "upgrade" ? "📤 提交OTA升级申请" : "📤 新建工单 (→ CoRide)") + "</h2>";
  h += "<div style='margin:12px 0'>";
  h += "<label style='display:block;margin-bottom:4px;font-size:13px;color:var(--text-dim)'>标题</label>";
  h += "<input id='tktTitle' style='width:100%;padding:10px;background:var(--bg-secondary);border:1px solid var(--border-default);border-radius:8px;color:var(--text-primary);font-size:14px' placeholder='工单标题...'>";
  h += "</div>";
  h += "<div style='margin:12px 0'>";
  h += "<label style='display:block;margin-bottom:4px;font-size:13px;color:var(--text-dim)'>类型</label>";
  h += "<select id='tktType' style='width:100%;padding:10px;background:var(--bg-secondary);border:1px solid var(--border-default);border-radius:8px;color:var(--text-primary);font-size:14px'>";
  h += "<option value='upgrade'" + (type==="upgrade"?" selected":"") + ">OTA 升级申请</option>";
  h += "<option value='offline'>车辆下线通知</option>";
  h += "<option value='repair'>返厂维修通知</option>";
  h += "<option value='other'>其他</option>";
  h += "</select></div>";
  h += "<div style='margin:12px 0'><label style='display:block;margin-bottom:4px;font-size:13px;color:var(--text-dim)'>描述</label>";
  h += "<textarea id='tktDesc' rows='4' style='width:100%;padding:10px;background:var(--bg-secondary);border:1px solid var(--border-default);border-radius:8px;color:var(--text-primary);font-size:14px;resize:vertical' placeholder='详细描述...'></textarea></div>";
  h += "<div style='text-align:right;margin-top:16px'>";
  h += "<button class='ticket-btn' style='margin-right:8px;background:var(--bg-tertiary);border-color:var(--border-default)' onclick='closeModal()'>取消</button>";
  h += "<button class='ticket-btn' onclick='submitNewTicketFromModal()'>提交工单</button></div>";
  openModal(h);
}

function submitNewTicketFromModal() {
  var title = document.getElementById("tktTitle").value.trim();
  var type = document.getElementById("tktType").value;
  var desc = document.getElementById("tktDesc").value.trim();
  if (!title) { showToast("请输入工单标题", true); return; }
  var id = createOperatorTicket(type, title, desc, null);
  showToast("工单 " + id + " 已提交至CoRide");
  closeModal();
  setTicketDirection("outgoing");
  renderTickets();
}

// ═══ ═══ ═══ RENDER: HARDWARE ═══ ═══ ═══
function renderHardware() {
  var jetsonDeployed = allVehicles.length;
  var jetsonStock = Math.floor(allVehicles.length * 0.1);
  var jetsonCost = jetsonDeployed * 2500;
  var screenDeployed = allVehicles.length;
  var screenStock = Math.floor(allVehicles.length * 0.08);
  var screenCost = screenDeployed * 250;
  var cameraDeployed = allVehicles.length;
  var cameraStock = Math.floor(allVehicles.length * 0.12);
  var cameraCost = cameraDeployed * 300;
  var totalCost = jetsonCost + screenCost + cameraCost;

  var sh = document.getElementById("hwStatRow");
  if (sh) sh.innerHTML =
    '<div class="order-stat"><div class="os-val">' + jetsonDeployed + '</div><div class="os-label">Jetson 已部署</div></div>' +
    '<div class="order-stat"><div class="os-val">' + screenDeployed + '</div><div class="os-label">触摸屏 已部署</div></div>' +
    '<div class="order-stat"><div class="os-val">' + cameraDeployed + '</div><div class="os-label">摄像头 已部署</div></div>' +
    '<div class="order-stat"><div class="os-val">¥' + totalCost.toLocaleString() + '</div><div class="os-label">硬件总成本</div></div>';

  var jd = document.getElementById("hwJetsonDetail");
  if (jd) jd.innerHTML =
    "🖥 <b>NVIDIA Jetson Orin Nano</b> (40 TOPS)<br>" +
    "已部署: <b>" + jetsonDeployed + " 台</b> · 库存: " + jetsonStock + " 台<br>" +
    "单价: ¥2,500 · 小计: <b>¥" + jetsonCost.toLocaleString() + "</b><br>" +
    "固件版本: JetPack 6.0 · 内存: 8GB 统一内存<br>" +
    "量化模型: Qwen2.5-7B INT4 (~5.2GB)";

  var pd = document.getElementById("hwPeriphDetail");
  if (pd) pd.innerHTML =
    "📱 <b>7寸 IPS 触摸屏</b> (1024×600)<br>" +
    "已部署: <b>" + screenDeployed + " 台</b> · 库存: " + screenStock + " 台<br>" +
    "单价: ¥250 · 小计: <b>¥" + screenCost.toLocaleString() + "</b><br>" +
    "📷 <b>USB 摄像头</b> (YOLOv8-Nano)<br>" +
    "已部署: <b>" + cameraDeployed + " 台</b> · 库存: " + cameraStock + " 台<br>" +
    "单价: ¥300 · 小计: <b>¥" + cameraCost.toLocaleString() + "</b><br>" +
    "<hr style='border-color:var(--border-default);margin:8px 0'>" +
    "💰 单车硬件成本: <b>¥3,050</b> · 总投入: <b>¥" + totalCost.toLocaleString() + "</b>";

  var snBase = 1000 + (currentOperator.id.charCodeAt(0) * 100);
  var h = "";
  for (var i = 0; i < allVehicles.length; i++) {
    var v = allVehicles[i];
    var jsn = "JSN-" + String(snBase + i).padStart(4,"0");
    var installDate = "2026-0" + Math.floor(Math.random() * 7 + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0");
    var healthStatus = v.status === "fault" ? "<span class='badge red'>异常</span>" : v.status === "offline" ? "<span class='badge orange'>离线</span>" : "<span class='badge green'>正常</span>";
    h += "<tr><td><b>" + jsn + "</b></td><td>" + v.id + "</td><td>" + installDate + "</td><td>" + v.hwVersion + "</td><td>" + v.swVersion + "</td><td>" + healthStatus + "</td><td>" + (v.npu ? v.npu + "%" : "-") + "</td></tr>";
  }
  var tb = document.getElementById("hwTableBody"); if (tb) tb.innerHTML = h;
}

// ═══ ═══ ═══ RENDER: CHAT ═══ ═══ ═══
function renderChat() {
  var cl = document.getElementById("chatConvList");
  if (!cl) return;
  var clh = "";
  for (var i = 0; i < chatConversations.length; i++) {
    var c = chatConversations[i];
    var lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1].text : "";
    var lastTime = c.messages.length > 0 ? c.messages[c.messages.length - 1].time : "";
    clh += "<div class='chat-conv-item" + (c.id === activeChat ? " active" : "") + "' data-cid='" + c.id + "' onclick='openChat(\"" + c.id + "\")'>" +
      "<div class='cci-avatar' style='background:" + currentOperator.color + "'>" + c.user.charAt(0) + "</div>" +
      "<div class='cci-info'><div class='cci-name'>" + c.user + "</div><div class='cci-preview'>" + lastMsg + "</div></div>" +
      "<div class='cci-time'>" + lastTime + "</div>" +
      (c.online ? "<div class='cci-dot'></div>" : "") +
      "</div>";
  }
  cl.innerHTML = clh;
  if (activeChat) openChat(activeChat);
}

function openChat(cid) {
  activeChat = cid;
  var c = null;
  for (var i = 0; i < chatConversations.length; i++) { if (chatConversations[i].id === cid) { c = chatConversations[i]; break; } }
  if (!c) return;
  var chH = document.getElementById("chatHeader");
  if (chH) chH.innerHTML = "<span style='font-size:14px;font-weight:700;color:var(--text-primary)'>👤 " + c.user + "</span><span style='font-size:10px;color:var(--text-tertiary)'>📱 " + c.phone + "</span><span style='font-size:10px'>" + (c.online ? "🟢 在线" : "⚫ 离线") + "</span>";
  var items = document.querySelectorAll("#chatConvList .chat-conv-item");
  for (var j = 0; j < items.length; j++) { items[j].classList.remove("active"); }
  var ci = document.querySelector("#chatConvList .chat-conv-item[data-cid='" + cid + "']");
  if (ci) ci.classList.add("active");
  var cm = document.getElementById("chatMessages");
  if (!cm) return;
  var mh = "";
  for (var k = 0; k < c.messages.length; k++) {
    var msg = c.messages[k];
    var sideClass = msg.from === "user" ? "user" : "operator";
    mh += "<div class='chat-msg " + sideClass + "'><div class='cm-bubble'>" + msg.text + "<div class='cm-time'>" + msg.time + "</div></div></div>";
  }
  cm.innerHTML = mh;
  cm.scrollTop = cm.scrollHeight;
}

function sendChatMsg() {
  if (!activeChat) return;
  var c = null;
  for (var i = 0; i < chatConversations.length; i++) { if (chatConversations[i].id === activeChat) { c = chatConversations[i]; break; } }
  if (!c) return;
  var input = document.getElementById("chatInput");
  if (!input) return;
  var msg = input.value.trim();
  if (!msg) return;
  var now = new Date();
  var time = String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");
  c.messages.push({ from: "operator", text: msg, time: time });
  var cm = document.getElementById("chatMessages");
  if (cm) {
    var div = document.createElement("div");
    div.className = "chat-msg operator";
    div.innerHTML = "<div class='cm-bubble'>" + msg + "<div class='cm-time'>" + time + "</div></div>";
    cm.appendChild(div);
    cm.scrollTop = cm.scrollHeight;
  }
  var ci = document.querySelector("#chatConvList .chat-conv-item[data-cid='" + activeChat + "']");
  if (ci) { var pv = ci.querySelector(".cci-preview"); if (pv) pv.textContent = msg; var tm = ci.querySelector(".cci-time"); if (tm) tm.textContent = time; }
  input.value = "";
  showToast("消息已发送");
}

// ═══ ═══ ═══ RENDER: REVIEWS ═══ ═══ ═══
function renderReviews() {
  var dist = [0,0,0,0,0];
  for (var i = 0; i < allOrders.length; i++) {
    var r = allOrders[i].rating;
    if (r >= 1 && r <= 5) dist[5 - r]++;
  }
  var totalRated = dist[0] + dist[1] + dist[2] + dist[3] + dist[4];
  var avgRating = 0;
  if (totalRated > 0) { avgRating = (dist[0]*5 + dist[1]*4 + dist[2]*3 + dist[3]*2 + dist[4]*1) / totalRated; }
  var elAvg = document.getElementById("reviewAvg"); if (elAvg) elAvg.textContent = "⭐ " + avgRating.toFixed(1);
  var elTotal = document.getElementById("reviewTotal"); if (elTotal) elTotal.textContent = totalRated + " 条评价";
  var bh = "";
  for (var j = 0; j < 5; j++) {
    var stars = 5 - j, cnt = dist[j];
    var pct = totalRated > 0 ? (cnt / totalRated * 100) : 0;
    bh += "<div class='vb-row'><span class='vb-label'>" + stars + " ★</span><div class='vb-track'><div class='vb-fill' style='width:" + pct + "%;background:" + (stars>=5?"#27ae60":stars>=4?"#4facfe":stars>=3?"#F5A623":"#e74c3c") + "'>" + cnt + " 条</div></div></div>";
  }
  var vb = document.getElementById("reviewBars"); if (vb) vb.innerHTML = bh;
  var rh = "";
  for (var k = 0; k < Math.min(10, reviewPool.length); k++) {
    var rv = reviewPool[k];
    var replied = k < 3;
    rh += "<div class='rv-item'><div class='rv-stars'>" + rv.stars + "</div><div class='rv-text'>" + rv.text + "</div><div class='rv-meta'>" + rv.name + " · " + rv.ago + (replied ? " <span class='rv-replied'>✅ 已回复</span>" : "") + "</div></div>";
  }
  var rl = document.getElementById("reviewFullList"); if (rl) rl.innerHTML = rh;
}

// ═══ ═══ ═══ RENDER: SETTINGS ═══ ═══ ═══
function renderSettings() {
  var onlineC = 0;
  for (var i = 0; i < allVehicles.length; i++) { if (allVehicles[i].status === "online") onlineC++; }
  var sel = document.getElementById("settingsProfile");
  if (sel) sel.innerHTML =
    "<div class='settings-row'><span class='sr-label'><b>运营商名称</b></span><span>" + currentOperator.name + "</span></div>" +
    "<div class='settings-row'><span class='sr-label'><b>运营商 ID</b></span><span>" + currentOperator.id + "</span></div>" +
    "<div class='settings-row'><span class='sr-label'><b>API Key</b></span><span style='font-family:monospace;font-size:11px;color:var(--orange)'>••••••••••••" + currentOperator.id.toLowerCase() + "key</span></div>" +
    "<div class='settings-row'><span class='sr-label'><b>车队规模</b></span><span>" + allVehicles.length + " 台车辆</span></div>" +
    "<div class='settings-row'><span class='sr-label'><b>在线车辆</b></span><span>" + onlineC + " 台</span></div>";
  var lo = document.getElementById("settingsLogout");
  if (lo) lo.onclick = handleLogout;
}

// ═══ ═══ ═══ INIT ═══ ═══ ═══
updateSidebar();
renderDashboard();
renderVehicles();
renderOrders();
renderRevenue();
renderOTA();
renderTickets();
renderReviews();
renderSettings();

console.log("CoRide Operator Admin v2.0 loaded — " + currentOperator.name + " (" + currentOperator.id + "), " + allVehicles.length + " vehicles, " + allOrders.length + " orders");

