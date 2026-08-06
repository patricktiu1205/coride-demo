// ═══ CoRide Operator Admin v2.0 ═══
// Auth guard
if (!sessionStorage.getItem("coride_logged_in")) { window.location.href = "login.html"; }

// ═══ NAVIGATION ═══
var currentPage = "dashboard";
var pageLabels = {dashboard:"仪表盘",operators:"运营商管理",vehicles:"车辆管理",orders:"订单管理",users:"用户管理",members:"会员管理",revenue:"营收分析",ota:"OTA 升级",hardware:"硬件资产",chat:"在线客服",tickets:"工单管理",analytics:"数据分析",settings:"系统设置"};

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
  if (page === "operators") renderOperators();
  if (page === "vehicles") { renderVehicles(); updateSortArrows("vehicles"); }
  if (page === "orders") { renderOrders(); updateSortArrows("orders"); }
  if (page === "users") { renderUsers(); updateSortArrows("users"); }
  if (page === "members") { renderMembers(); updateSortArrows("members"); }
  if (page === "revenue") renderRevenue();
  if (page === "ota") renderOTA();
  if (page === "hardware") renderHardware();
  if (page === "chat") renderChatConvs();
}

// ═══ TABLE SORTING ═══
var sortState = {
  vehicles: {col:"id", dir:"asc"},
  orders: {col:"time", dir:"desc"},
  users: {col:"regDate", dir:"desc"},
  members: {col:"since", dir:"desc"}
};

function sortTable(table, col) {
  var ss = sortState[table];
  if (ss.col === col) { ss.dir = ss.dir === "asc" ? "desc" : "asc"; }
  else { ss.col = col; ss.dir = "asc"; }
  // Update arrow markers in headers
  updateSortArrows(table);
  // Re-render
  if (table === "vehicles") renderVehicles();
  else if (table === "orders") renderOrders();
  else if (table === "users") renderUsers();
  else if (table === "members") renderMembers();
}

function updateSortArrows(table) {
  var ss = sortState[table];
  var prefix = table === "vehicles" ? "vehTh" : table === "orders" ? "ordTh" : table === "members" ? "memTh" : "usrTh";
  // Column to header ID suffix mapping (handle special cases)
  var colMap = {regDate:"Reg"};
  var suffix = colMap[ss.col] || (ss.col.charAt(0).toUpperCase() + ss.col.slice(1));
  // Clear all arrows in this table's sortable headers
  var allTh = document.querySelectorAll("#page-" + table + " th.sortable");
  for (var i = 0; i < allTh.length; i++) {
    var arr = allTh[i].querySelector(".sort-arrow");
    if (arr) { arr.textContent = ""; arr.className = "sort-arrow"; }
  }
  // Set the active arrow
  var thId = prefix + suffix;
  var activeTh = document.getElementById(thId);
  if (activeTh) {
    var arrow = activeTh.querySelector(".sort-arrow");
    if (!arrow) {
      // Create arrow span if not present
      arrow = document.createElement("span");
      arrow.className = "sort-arrow";
      activeTh.appendChild(arrow);
    }
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
    // Numeric extraction helpers
    function numVal(s) { var m = s.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }
    function platformOrder(pid) { return ["PX","WR","AP","AX"].indexOf(pid); }
    var tierOrder = {plus:1,regular:2,new:3};
    var statusOrder = {online:1,completed:1,ongoing:2,processing:2,offline:3,open:3,cancelled:4,fault:4,closed:5};

    if (col === "id" && table === "vehicles") {
      va = platformOrder(a.platform); vb = platformOrder(b.platform);
      if (va !== vb) return dir === "asc" ? va - vb : vb - va;
      va = numVal(a.id); vb = numVal(b.id);
      return dir === "asc" ? va - vb : vb - va;
    }
    if (col === "id" && table === "orders") {
      va = numVal(a.id); vb = numVal(b.id);
      return dir === "asc" ? va - vb : vb - va;
    }
    if (col === "platform") {
      va = platformOrder(a.platform); vb = platformOrder(b.platform);
      return dir === "asc" ? va - vb : vb - va;
    }
    if (col === "status") {
      va = statusOrder[a.status] || 9; vb = statusOrder[b.status] || 9;
      return dir === "asc" ? va - vb : vb - va;
    }
    if (col === "tier") {
      va = tierOrder[a.tier] || 9; vb = tierOrder[b.tier] || 9;
      return dir === "asc" ? va - vb : vb - va;
    }
    // Numeric columns
    if (["npu","orders","revenue","amount","trips","spend"].indexOf(col) >= 0) {
      va = Number(a[col]) || 0; vb = Number(b[col]) || 0;
      return dir === "asc" ? va - vb : vb - va;
    }
    // Default: string compare
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
  document.getElementById("liveClock").textContent = h + ":" + m + ":" + s + " CST";
}
setInterval(updateClock, 1000); updateClock();

// ═══ THEME TOGGLE ═══
function applyTheme(theme) {
  document.body.classList.toggle("light-theme", theme === "light");
  document.getElementById("themeToggle").textContent = theme === "light" ? "☀️" : "🌙";
  localStorage.setItem("coride_theme", theme);
}
function toggleTheme() {
  var current = document.body.classList.contains("light-theme") ? "dark" : "light";
  applyTheme(current);
}
// Load saved theme on init
(function(){
  var saved = localStorage.getItem("coride_theme") || "dark";
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
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalOverlay").style.display = "flex";
}
function closeModal() { document.getElementById("modalOverlay").style.display = "none"; }

// ═══ LOGOUT ═══
function handleLogout() {
  sessionStorage.removeItem("coride_logged_in");
  window.location.href = "login.html";
}

// ═══ GLOBAL SEARCH ═══
function handleGlobalSearch(e) {
  if (e.key !== "Enter") return;
  var q = e.target.value.trim().toLowerCase();
  if (!q) return;
  if (q.indexOf("a") === 0 || q.indexOf("b") === 0 || q.indexOf("#") === 0) { navTo("vehicles"); document.getElementById("vehSearch").value = q; renderVehicles(); }
  else if (q.indexOf("tk-") === 0) { navTo("tickets"); renderTickets(); }
  else { navTo("orders"); document.getElementById("orderSearch").value = q; renderOrders(); }
}

// ═══ ═══ ═══ DASHBOARD ═══ ═══ ═══
// Sparkline animation (live, cosmetic only)
var sparkChars = ["▁","▂","▃","▄","▅","▆","▇","█"];
var sparkIdx = 0;
setInterval(function(){
  var line = "";
  for (var i = 0; i < 30; i++) { var v = Math.floor(Math.abs(Math.sin((i + sparkIdx) * 0.25)) * 7); line += sparkChars[Math.min(7, v)]; }
  document.getElementById("sparkline").textContent = line;
  sparkIdx++;
}, 5000);


// ═══ ═══ ═══ VEHICLE MANAGEMENT ═══ ═══ ═══
var allVehicles = [];
var vehModels = ["PonyAlpha X","PonyAlpha S","WeRide Robovan","丰田 Mirai","现代 IONIQ 5","百度 Apollo RT6","AutoX Gen5","雷克萨斯 RX"];
// 4 platforms with vehicle ID prefixes
var platforms = [
  {id:"PX",name:"小马智行",color:"#F5A623",vehCount:15,onlineCount:14,dailyOrders:345,dailyRevenue:107000,avgPrice:25.80,rating:4.9},
  {id:"WR",name:"文远知行",color:"#4facfe",vehCount:12,onlineCount:11,dailyOrders:276,dailyRevenue:87200,avgPrice:26.30,rating:4.8},
  {id:"AP",name:"百度Apollo",color:"#2ecc71",vehCount:13,onlineCount:13,dailyOrders:299,dailyRevenue:94200,avgPrice:26.20,rating:4.9},
  {id:"AX",name:"AutoX 安途",color:"#e74c3c",vehCount:10,onlineCount:9,dailyOrders:230,dailyRevenue:69400,avgPrice:25.10,rating:4.7}
];
var platformById = {};
platforms.forEach(function(p){ platformById[p.id] = p; });

// Exactly 47 online, 2 offline, 1 fault to match dashboard KPI
var vehStatuses = [];
for (var i = 0; i < 47; i++) vehStatuses.push("online");
vehStatuses.push("offline","offline","fault");
for (var i = vehStatuses.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = vehStatuses[i]; vehStatuses[i] = vehStatuses[j]; vehStatuses[j] = tmp; }

// Distribute vehicles across platforms
var platDist = [];
platforms.forEach(function(p){ for (var k = 0; k < p.vehCount; k++) platDist.push(p.id); });
// ═══ HW/SW version model ═══
var hwSwMap = [
  { hw: "HW 1.0", maxSw: [2,4], desc: "早期算力平台" },
  { hw: "HW 2.0", maxSw: [3,8], desc: "主流算力平台" },
  { hw: "HW 3.0", maxSw: [5,2], desc: "旗舰算力平台" }
];

for (var i = 0; i < 50; i++) {
  var pid = platDist[i];
  var pfx = pid + "-";
  var num = String(i + 1).padStart(3,"0");
  var st = vehStatuses[i];
  // HW 3.0 for newest 20%, HW 2.0 for middle 50%, HW 1.0 for oldest 30%
  var hwIdx = i < 10 ? 2 : i < 35 ? 1 : 0;
  var hwInfo = hwSwMap[hwIdx];
  // Bias: ~70% vehicles are at latest or nearly latest version
  var swMajor;
  var roll = Math.random();
  if (roll < 0.55)      { swMajor = hwInfo.maxSw[0]; }                          // 55% at latest major
  else if (roll < 0.80) { swMajor = Math.max(1, hwInfo.maxSw[0] - 1); }          // 25% one major behind
  else                   { swMajor = Math.max(1, hwInfo.maxSw[0] - 2); }          // 20% two majors behind
  var swMinorMax = swMajor >= hwInfo.maxSw[0] ? hwInfo.maxSw[1] : 9;
  var swMinor;
  if (swMajor >= hwInfo.maxSw[0] && Math.random() < 0.55) {
    swMinor = hwInfo.maxSw[1]; // 55% at latest minor too → fully up-to-date
  } else if (swMajor >= hwInfo.maxSw[0]) {
    swMinor = Math.max(0, hwInfo.maxSw[1] - Math.floor(Math.random() * 2) - 1); // near latest, minor behind
  } else {
    swMinor = Math.floor(Math.random() * (swMinorMax + 1));
  }
  var swVersion = "v" + swMajor + "." + swMinor;
  allVehicles.push({
    id: pfx + num,
    platform: pid,
    model: vehModels[Math.floor(Math.random() * vehModels.length)],
    status: st,
    npu: st === "online" ? Math.floor(Math.random() * 40) + 35 : 0,
    orders: st === "online" ? Math.floor(Math.random() * 7) + 20 : 0,
    revenue: st === "online" ? Math.floor(Math.random() * 200) + 500 : 0,
    hwVersion: hwInfo.hw,
    swVersion: swVersion,
    swMax: "v" + hwInfo.maxSw[0] + "." + hwInfo.maxSw[1],
    canStatus: st === "online" ? (Math.random() > 0.2 ? "正常" : "延迟") : "-",
    lastMaint: "2026-0" + Math.floor(Math.random() * 8 + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0")
  });
}

function renderVehicles() {
  var filter = document.getElementById("vehFilter").value;
  var search = document.getElementById("vehSearch").value.toLowerCase();
  var filtered = allVehicles.filter(function(v){
    if (filter !== "all" && v.status !== filter) return false;
    if (search && v.id.toLowerCase().indexOf(search) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "vehicles");
  document.getElementById("vehCount").textContent = "共 " + filtered.length + " 台";
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var v = filtered[i];
    var pBadge = "<span class='badge' style='background:" + (platformById[v.platform] ? platformById[v.platform].color : "#888") + ";color:#fff;font-size:10px'>" + (platformById[v.platform] ? platformById[v.platform].name : v.platform) + "</span>";
    var stBadge = v.status === "online" ? "<span class='badge green'>在线</span>" : v.status === "offline" ? "<span class='badge orange'>离线</span>" : "<span class='badge red'>故障</span>";
    var hwBadge = v.hwVersion === "HW 3.0" ? "<span style='color:#2ecc71;font-weight:600'>" + v.hwVersion + "</span>" : v.hwVersion === "HW 2.0" ? "<span style='color:#4facfe;font-weight:600'>" + v.hwVersion + "</span>" : "<span style='color:var(--text-tertiary)'>" + v.hwVersion + "</span>";
    var swLabel = v.swVersion + " / " + v.swMax;
    var needUpgrade = v.swVersion !== v.swMax;
    var swDisplay = needUpgrade ? swLabel + " <span class='badge orange' style='font-size:9px;padding:1px 4px'>可升级</span>" : swLabel;
    h += "<tr><td><b>" + v.id + "</b></td><td>" + pBadge + "</td><td>" + v.model + "</td><td>" + stBadge + "</td><td>" + (v.npu ? v.npu + "%" : "-") + "</td><td>" + v.orders + "</td><td>¥" + v.revenue.toFixed(2) + "</td><td>" + hwBadge + "</td><td>" + swDisplay + "</td><td><button class='dt-btn view' onclick='viewVehicle(\"" + v.id + "\")'>详情</button></td></tr>";
  }
  document.getElementById("vehTableBody").innerHTML = h;
}

function viewVehicle(vid) {
  var v = allVehicles.find(function(x){ return x.id === vid; });
  if (!v) return;
  var stBadge = v.status === "online" ? "<span class='badge green'>在线</span>" : v.status === "offline" ? "<span class='badge orange'>离线</span>" : "<span class='badge red'>故障</span>";
  var pName = platformById[v.platform] ? platformById[v.platform].name : v.platform;
  var pBadge = "<span class='badge' style='background:" + (platformById[v.platform] ? platformById[v.platform].color : "#888") + ";color:#fff'>" + pName + "</span>";
  openModal("<div class='modal-header'><span class='mh-title'>🚗 " + v.id + " 车辆详情</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>车辆 ID</div><div class='mb-val'>" + v.id + "</div></div><div class='mb-item'><div class='mb-label'>所属平台</div><div class='mb-val'>" + pBadge + "</div></div><div class='mb-item'><div class='mb-label'>车型</div><div class='mb-val'>" + v.model + "</div></div></div>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>状态</div><div class='mb-val'>" + stBadge + "</div></div><div class='mb-item'><div class='mb-label'>NPU 负载</div><div class='mb-val'>" + (v.npu ? v.npu + "%" : "-") + "</div></div><div class='mb-item'><div class='mb-label'>CAN 通信</div><div class='mb-val'>" + (v.canStatus || "-") + "</div></div></div>" +
    "<div class='mb-section-title'>🖥 硬件/软件版本</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>硬件版本</div><div class='mb-val'>" + v.hwVersion + " <span style='font-size:11px;color:var(--text-tertiary)'>（不可升级）</span></div></div><div class='mb-item'><div class='mb-label'>软件版本</div><div class='mb-val'>" + v.swVersion + " / 上限 " + v.swMax + (v.swVersion !== v.swMax ? " <span class='badge orange' style='font-size:9px'>可升级</span>" : " <span class='badge green' style='font-size:9px'>最新</span>") + "</div></div></div>" +
    "<div class='mb-section-title'>📊 运营数据</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>今日订单</div><div class='mb-val'>" + v.orders + " 单</div></div><div class='mb-item'><div class='mb-label'>今日流水</div><div class='mb-val'>¥" + v.revenue.toFixed(2) + "</div></div><div class='mb-item'><div class='mb-label'>最近维护</div><div class='mb-val'>" + v.lastMaint + "</div></div></div>" +
    "</div>");
}
 

// ═══ ═══ ═══ OPERATOR MANAGEMENT ═══ ═══ ═══
function renderOperators() {
  // Update summary from real data
  var totalVeh = allVehicles.length;
  var onlineVeh = 0;
  for (var vi = 0; vi < allVehicles.length; vi++) { if (allVehicles[vi].status === "online") onlineVeh++; }
  var el1 = document.getElementById("opTotalVehicles"); if (el1) el1.textContent = totalVeh;
  var el2 = document.getElementById("opOnlineRate"); if (el2) el2.textContent = Math.round(onlineVeh/totalVeh*100) + "%（" + onlineVeh + "/" + totalVeh + "）";
  var el3 = document.getElementById("opDailyOrders"); if (el3) el3.textContent = allOrders.length;
  // Platform table
  var h = "";
  for (var i = 0; i < platforms.length; i++) {
    var p = platforms[i];
    var onlineRate = p.onlineCount / p.vehCount;
    var ratePct = Math.round(onlineRate * 100);
    var statusLabel = ratePct >= 95 ? "正常" : (ratePct >= 80 ? "部分离线" : "异常");
    var statusBadge = ratePct >= 95 ? "<span class='badge green'>正常</span>" : (ratePct >= 80 ? "<span class='badge orange'>部分离线</span>" : "<span class='badge red'>异常</span>");
    h += "<tr>" +
      "<td><b style='color:" + p.color + "'>" + p.name + "</b></td>" +
      "<td>" + p.vehCount + " 台</td>" +
      "<td><div style='display:flex;align-items:center;gap:6px'><div style='flex:1;height:4px;background:var(--bg-secondary);border-radius:2px'><div style='width:" + ratePct + "%;height:4px;background:" + p.color + ";border-radius:2px'></div></div>" + ratePct + "%</div></td>" +
      "<td>" + p.dailyOrders + " 单</td>" +
      "<td>¥" + p.dailyRevenue.toLocaleString(undefined, {minimumFractionDigits: 2}) + "</td>" +
      "<td>¥" + p.avgPrice + "</td>" +
      "<td>⭐ " + p.rating + "</td>" +
      "<td>" + statusBadge + "</td>" +
      "<td><button class='dt-btn view' onclick='viewOperator(\"" + p.id + "\")'>详情</button></td>" +
      "</tr>";
  }
  document.getElementById("operatorTableBody").innerHTML = h;
}

function viewOperator(pid) {
  var p = platformById[pid];
  if (!p) return;
  var onlineRate = Math.round(p.onlineCount / p.vehCount * 100);
  var statusLabel = onlineRate >= 95 ? "正常" : (onlineRate >= 80 ? "部分离线" : "异常");
  var stBadge = onlineRate >= 95 ? "<span class='badge green'>正常</span>" : (onlineRate >= 80 ? "<span class='badge orange'>部分离线</span>" : "<span class='badge red'>异常</span>");
  openModal("<div class='modal-header'><span class='mh-title'>🏢 " + p.name + " 运营商详情</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>平台名称</div><div class='mb-val' style='color:" + p.color + ";font-weight:700'>" + p.name + "</div></div><div class='mb-item'><div class='mb-label'>车辆总数</div><div class='mb-val'>" + p.vehCount + " 台</div></div><div class='mb-item'><div class='mb-label'>在线率</div><div class='mb-val'>" + onlineRate + "%（" + p.onlineCount + " 台在线）</div></div></div>" +
    "<div class='mb-section-title'>📊 今日运营数据</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>今日订单</div><div class='mb-val'>" + p.dailyOrders + " 单</div></div><div class='mb-item'><div class='mb-label'>今日流水</div><div class='mb-val'>¥" + p.dailyRevenue.toLocaleString(undefined, {minimumFractionDigits: 2}) + "</div></div><div class='mb-item'><div class='mb-label'>均单价</div><div class='mb-val'>¥" + p.avgPrice.toFixed(2) + "</div></div></div>" +
    "<div class='mb-section-title'>📋 接入信息</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>接入状态</div><div class='mb-val'>" + stBadge + "</div></div><div class='mb-item'><div class='mb-label'>用户评分</div><div class='mb-val'>⭐ " + p.rating + "</div></div><div class='mb-item'><div class='mb-label'>API 接入</div><div class='mb-val'><span class='badge green'>已接入</span></div></div></div>" +
    "</div>");
}

// ═══ ═══ ═══ USER MANAGEMENT (must be before orders for cross-reference) ═══ ═══ ═══
var allUsers = [];
var surnames = ["陈","李","王","赵","刘","张","黄","周","吴","孙","马","林","何","郭","郑","钱","冯","曹","蒋","沈","杨","朱","秦","许","徐","沈","韩","魏","谢","苏","潘","范","邓","董","梁","宋","唐","于","罗","高"];
var givenNames = ["小明","婷婷","建国","丽华","伟","敏","志强","雪","磊","雨桐","超","婷","勇","美玲","浩","蕾","军","芳","涛","琳","文","杰","宇","涵","博","静","晨","阳","宁","悦","峰","毅","鹏","慧","彬","然","睿","萱","怡","嘉","瑞","泽","琳","欣","凯","铭"];
var userTags = ["商务出行","高频通勤","家庭出行","音乐偏好","安静模式","座椅加热","暖色灯光","咖啡爱好者","出差党","周末出游"];
// 200 users (~5.75 rides/user/day with 1,150 daily orders)
for (var ui = 0; ui < 200; ui++) {
  var sName = surnames[Math.floor(Math.random() * surnames.length)];
  var gName = givenNames[Math.floor(Math.random() * givenNames.length)];
  var fullName = sName + gName;
  var dupCheck = allUsers.filter(function(u){ return u.name === fullName; });
  var retries = 0;
  while (dupCheck.length > 0 && retries < 20) { sName = surnames[Math.floor(Math.random() * surnames.length)]; gName = givenNames[Math.floor(Math.random() * givenNames.length)]; fullName = sName + gName; dupCheck = allUsers.filter(function(u){ return u.name === fullName; }); retries++; }
  var trips = Math.floor(Math.random() * 120) + 10;
  var spend = trips * (Math.floor(Math.random() * 28) + 18);
  var rand = Math.random();
  var tier;
  if (rand < 0.35) { tier = "plus"; spend = Math.max(spend, 2001); trips = Math.max(trips, 60); }
  else if (rand < 0.75) { tier = "regular"; spend = Math.max(Math.min(spend, 2000), 801); }
  else { tier = "new"; spend = Math.min(spend, 800); }
  var tags = [];
  var shuffledTags = userTags.slice().sort(function(){ return Math.random() - 0.5; });
  for (var j = 0; j < Math.floor(Math.random() * 3) + 2; j++) { tags.push(shuffledTags[j]); }
  tags = tags.filter(function(v,idx,s){ return s.indexOf(v) === idx; });
  var memberSince = tier === "plus" ? "2025-" + String(Math.floor(Math.random() * 12) + 1).padStart(2,"0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0") : null;
  var mStatus = null;
  if (tier === "plus") {
    var r2 = Math.random();
    mStatus = r2 < 0.85 ? "active" : r2 < 0.95 ? "expiring" : "expired";
  }
  allUsers.push({
    id: "U-" + String(ui + 100).padStart(3,"0"),
    name: fullName,
    phone: "138" + String(Math.floor(Math.random() * 90000000) + 10000000),
    tier: tier,
    trips: trips,
    spend: spend,
    tags: tags,
    regDate: "2025-" + String(Math.floor(Math.random() * 12) + 1).padStart(2,"0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0"),
    prefTemp: Math.floor(Math.random() * 6) + 21,
    prefMusic: ["古典","流行","爵士","电子","安静"][Math.floor(Math.random() * 5)],
    prefLight: ["暖色","冷色","紫色","自动"][Math.floor(Math.random() * 4)],
    memberSince: memberSince,
    memberStatus: mStatus,
    memberPlan: tier === "plus" ? "¥12/月" : null
  });
}

// ═══ ═══ ═══ ORDER GENERATION — linked to real users & vehicles ═══ ═══ ═══
var allOrders = [];
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
// 50 vehicles × 23 orders/day = 1,150
for (var oi = 1; oi <= 1150; oi++) {
  var rt = orderRoutes[Math.floor(Math.random() * orderRoutes.length)];
  var dist = rt.dist + Math.floor(Math.random() * 6) - 3;
  if (dist < 3) dist = 3;
  var hh = Math.floor(Math.random() * 14) + 8;   // 08:00–21:59
  var mm = Math.floor(Math.random() * 60);
  var timeStr = "2026-08-06 " + String(hh).padStart(2,"0") + ":" + String(mm).padStart(2,"0");
  var minutesAgo = (21 - hh) * 60 + (54 - mm);     // current ≈ 21:54
  var st;
  if (minutesAgo <= 30)      { st = Math.random() < 0.7 ? "ongoing" : "completed"; }
  else if (minutesAgo <= 90) { st = Math.random() < 0.25 ? "ongoing" : (Math.random() < 0.08 ? "cancelled" : "completed"); }
  else                       { st = Math.random() < 0.06 ? "cancelled" : "completed"; }
  // Pick real user & vehicle from pools
  var user = allUsers[Math.floor(Math.random() * allUsers.length)];
  var veh  = allVehicles[Math.floor(Math.random() * allVehicles.length)];
  var isMember = user.tier === "plus";
  var interactions = st === "cancelled" ? 0 : Math.floor(Math.random() * 3);
  // CoRide three-tier service fee (store components for revenue breakdown)
  var baseFee = 2.50;
  var mileageFee = isMember ? 0 : Math.round(dist * 0.15 * 100) / 100;
  var interactionFee = isMember ? 0 : interactions * 1.00;
  var corideFee = Math.round((baseFee + mileageFee + interactionFee) * 100) / 100;
  // Ride fare (operator earnings, not CoRide share)
  var farePerKm = 1.80 + Math.random() * 0.70;
  var amount = Math.round(dist * farePerKm * 100) / 100;
  if (amount < 12) amount = 12;
  var pName = platformById[veh.platform] ? platformById[veh.platform].name : veh.platform;
  allOrders.push({
    id: "CO" + String(oi).padStart(6,"0"),
    passenger: user.name,
    userId: user.id,
    userPhone: user.phone,
    vehicle: veh.id,
    from: rt.from,
    to: rt.to,
    distance: dist,
    amount: amount,
    corideFee: corideFee,
    baseFee: baseFee,
    mileageFee: mileageFee,
    interactionFee: interactionFee,
    isMember: isMember,
    interactions: interactions,
    channel: pName,
    status: st,
    time: timeStr,
    duration: Math.floor(Math.random() * 40) + 15,
    payment: Math.random() > 0.3 ? "微信支付" : "支付宝",
    rating: Math.random() > 0.1 ? 5 : 4
  });
}
// Derive per-vehicle stats from actual orders
for (var vi = 0; vi < allVehicles.length; vi++) {
  var vid = allVehicles[vi].id;
  var vOrders = 0, vRevenue = 0;
  for (var oi2 = 0; oi2 < allOrders.length; oi2++) {
    if (allOrders[oi2].vehicle === vid && allOrders[oi2].status !== "cancelled") {
      vOrders++;
      vRevenue += allOrders[oi2].amount;
    }
  }
  allVehicles[vi].orders = vOrders;
  allVehicles[vi].revenue = Math.round(vRevenue);
}

// Derive platform stats from actual order data (align operator & analytics pages)
for (var pk in platformById) {
  var pVehicles = allVehicles.filter(function(v){ return v.platform === pk; });
  var pOrders = 0, pRevenue = 0, pOnline = 0;
  for (var pvi = 0; pvi < pVehicles.length; pvi++) {
    pOrders += pVehicles[pvi].orders;
    pRevenue += pVehicles[pvi].revenue;
    if (pVehicles[pvi].status === "online") pOnline++;
  }
  platformById[pk].dailyOrders = pOrders;
  platformById[pk].dailyRevenue = pRevenue;
  platformById[pk].onlineCount = pOnline;
  platformById[pk].avgPrice = pOrders > 0 ? Math.round(pRevenue / pOrders * 100) / 100 : 0;
}
// Sync back to platforms array for renderOperators()
platforms.forEach(function(p){ 
  p.dailyOrders = platformById[p.id].dailyOrders;
  p.dailyRevenue = platformById[p.id].dailyRevenue;
  p.onlineCount = platformById[p.id].onlineCount;
  p.avgPrice = platformById[p.id].avgPrice;
});

// Derive user stats from actual orders (align user & member pages)
var userStats = {};
for (var uoi = 0; uoi < allOrders.length; uoi++) {
  var o2 = allOrders[uoi];
  var uid2 = o2.userId;
  if (!userStats[uid2]) userStats[uid2] = { trips: 0, spend: 0 };
  userStats[uid2].trips++;
  userStats[uid2].spend += o2.amount;
}
for (var uui = 0; uui < allUsers.length; uui++) {
  var uid = allUsers[uui].id;
  if (userStats[uid]) {
    allUsers[uui].trips = userStats[uid].trips;
    allUsers[uui].spend = Math.round(userStats[uid].spend * 100) / 100;
  }
}

function renderOrders() {
  var filter = document.getElementById("orderFilter").value;
  var search = document.getElementById("orderSearch").value.toLowerCase();
  var filtered = allOrders.filter(function(o){
    if (filter !== "all" && o.status !== filter) return false;
    if (search && o.id.toLowerCase().indexOf(search) === -1 && o.vehicle.toLowerCase().indexOf(search) === -1 && o.passenger.toLowerCase().indexOf(search) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "orders");
  document.getElementById("orderCount").textContent = "共 " + filtered.length + " 单";
  // Stat bar (CoRide three-tier fee: base ¥2.50 + ¥0.15/km + ¥1.00/interaction)
  var totalRevenue = 0, completedCount = 0, corideActual = 0, corideProjected = 0;
  for (var i = 0; i < allOrders.length; i++) {
    var o = allOrders[i];
    totalRevenue += o.amount;
    if (o.status === "completed") { completedCount++; corideActual += o.corideFee; }
    if (o.status === "ongoing")   { corideProjected += o.corideFee; }
  }
  var totalCorideFee = corideActual + corideProjected;
  document.getElementById("osToday").textContent = allOrders.length;
  document.getElementById("osRevenue").textContent = "¥" + totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2});
  document.getElementById("osCorideShare").textContent = "¥" + totalCorideFee.toLocaleString(undefined, {minimumFractionDigits: 2});
  var avgPrice = allOrders.length > 0 ? (totalRevenue / allOrders.length) : 0;
  document.getElementById("osAvgPrice").textContent = "¥" + avgPrice.toFixed(2);
  document.getElementById("osCompleteRate").textContent = (allOrders.length > 0 ? (completedCount / allOrders.length * 100).toFixed(1) : "0") + "%";
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var o = filtered[i];
    var stBadge = o.status === "completed" ? "<span class='badge green'>已完成</span>" : o.status === "ongoing" ? "<span class='badge blue'>进行中</span>" : "<span class='badge gray'>已取消</span>";
    var chColors = {"小马智行":"#F5A623","文远知行":"#4facfe","百度Apollo":"#2ecc71","AutoX":"#e74c3c"};
    var chBadge = "<span class='badge' style='background:" + (chColors[o.channel] || "#888") + ";color:#fff;font-size:10px'>" + o.channel + "</span>";
    var feeLabel = o.status === "completed"
      ? "¥" + o.corideFee.toFixed(2)
      : o.status === "ongoing"
        ? "<span style='color:var(--accent-blue)'>预计 ¥" + o.corideFee.toFixed(2) + "</span>"
        : "-";
    var memberBadge = o.isMember ? " <span style='font-size:9px;color:#f0a500'>👑</span>" : "";
    h += "<tr><td><b>" + o.id + "</b></td><td>" + o.passenger + memberBadge + "</td><td>" + o.vehicle + "</td><td>" + o.from + " → " + o.to + "</td><td>¥" + o.amount.toFixed(2) + "</td><td>" + feeLabel + "</td><td>" + chBadge + "</td><td>" + stBadge + "</td><td>" + o.time + "</td><td><button class='dt-btn view' onclick='viewOrder(\"" + o.id + "\")'>详情</button></td></tr>";
  }
  document.getElementById("orderTableBody").innerHTML = h;
}

function viewOrder(oid) {
  var o = allOrders.find(function(x){ return x.id === oid; });
  if (!o) return;
  var stBadge = o.status === "completed" ? "<span class='badge green'>已完成</span>" : o.status === "ongoing" ? "<span class='badge blue'>进行中</span>" : "<span class='badge gray'>已取消</span>";
  var feeBreakdown = "基础 ¥" + o.baseFee.toFixed(2);
  feeBreakdown += " + 里程 ¥" + o.mileageFee.toFixed(2) + " (" + o.distance + "km × ¥0.15" + (o.isMember ? " 会员全免" : "") + ")";
  feeBreakdown += " + 交互 ¥" + o.interactionFee.toFixed(2) + " (" + o.interactions + "次 × ¥1.00" + (o.isMember && o.interactions > 0 ? " 会员全免" : "") + ")";
  var feeLabel = o.status === "completed" ? "¥" + o.corideFee.toFixed(2) + " (已入账)" : o.status === "ongoing" ? "预计 ¥" + o.corideFee.toFixed(2) + " (待完成)" : "-";
  openModal("<div class='modal-header'><span class='mh-title'>📋 订单详情 " + o.id + "</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>乘客</div><div class='mb-val'>" + o.passenger + (o.isMember ? " 👑会员" : "") + "</div></div><div class='mb-item'><div class='mb-label'>车辆</div><div class='mb-val'>" + o.vehicle + "</div></div><div class='mb-item'><div class='mb-label'>状态</div><div class='mb-val'>" + stBadge + "</div></div></div>" +
    "<div class='mb-section-title'>🗺 行程信息</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>起点</div><div class='mb-val'>" + o.from + "</div></div><div class='mb-item'><div class='mb-label'>终点</div><div class='mb-val'>" + o.to + "</div></div><div class='mb-item'><div class='mb-label'>距离 / 时长</div><div class='mb-val'>" + o.distance + "km / " + o.duration + "分钟</div></div></div>" +
    "<div class='mb-section-title'>💰 费用明细</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>车费（付运营商）</div><div class='mb-val'>¥" + o.amount.toFixed(2) + "</div></div><div class='mb-item'><div class='mb-label'>CoRide 服务费</div><div class='mb-val' style='color:var(--accent-blue);font-weight:700'>" + feeLabel + "</div></div>" + "<div class='mb-item'><div class='mb-label'>支付方式</div><div class='mb-val'>" + o.payment + "</div></div></div>" +
    "<div class='mb-section-title'>🧾 服务费明细</div><div class='mb-row'><div class='mb-item' style='grid-column:1/-1'><div class='mb-label'>费用构成</div><div class='mb-val' style='font-size:12px;color:var(--text-secondary)'>" + feeBreakdown + "</div></div></div>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>来源平台</div><div class='mb-val'>" + o.channel + "</div></div><div class='mb-item'><div class='mb-label'>下单时间</div><div class='mb-val'>" + o.time + "</div></div><div class='mb-item'><div class='mb-label'>用户评分</div><div class='mb-val'>" + "⭐".repeat(o.rating) + "</div></div></div></div>");
}

function renderUsers() {
  var filter = document.getElementById("userFilter").value;
  var search = document.getElementById("userSearch").value.toLowerCase();
  var filtered = allUsers.filter(function(u){
    if (filter !== "all" && u.tier !== filter) return false;
    if (search && u.name.toLowerCase().indexOf(search) === -1 && u.phone.indexOf(search) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "users");
  document.getElementById("userCount").textContent = "共 " + filtered.length + " 人";
  var colors = {plus:"#F5A623",regular:"#4facfe",new:"#27ae60"};
  var tierNames = {plus:"Plus 会员",regular:"普通用户",new:"新用户"};
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var u = filtered[i];
    var avatar = "<span class='user-avatar-sm' style='background:" + colors[u.tier] + "'>" + u.name.charAt(0) + "</span>";
    var tierBadge = "<span class='badge " + (u.tier === "plus" ? "orange" : u.tier === "regular" ? "blue" : "green") + "'>" + tierNames[u.tier] + "</span>";
    h += "<tr><td><div class='user-cell'>" + avatar + "<b>" + u.name + "</b></div></td><td>" + u.phone + "</td><td>" + tierBadge + "</td><td>" + u.trips + " 次</td><td>¥" + u.spend.toLocaleString() + "</td><td><span style='font-size:9px;color:#888'>" + u.tags.slice(0,3).join(" · ") + "</span></td><td>" + u.regDate + "</td><td><button class='dt-btn view' onclick='viewUser(\"" + u.id + "\")'>详情</button></td></tr>";
  }
  document.getElementById("userTableBody").innerHTML = h;
}

function viewUser(uid) {
  var u = allUsers.find(function(x){ return x.id === uid; });
  if (!u) return;
  var tierBadge = "<span class='badge " + (u.tier === "plus" ? "orange" : u.tier === "regular" ? "blue" : "green") + "'>" + (u.tier === "plus" ? "Plus 会员" : u.tier === "regular" ? "普通用户" : "新用户") + "</span>";
  openModal("<div class='modal-header'><span class='mh-title'>👤 " + u.name + " 用户详情</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>用户 ID</div><div class='mb-val'>" + u.id + "</div></div><div class='mb-item'><div class='mb-label'>手机号</div><div class='mb-val'>" + u.phone + "</div></div><div class='mb-item'><div class='mb-label'>会员等级</div><div class='mb-val'>" + tierBadge + "</div></div></div>" +
    "<div class='mb-section-title'>📊 消费数据</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>累计行程</div><div class='mb-val'>" + u.trips + " 次</div></div><div class='mb-item'><div class='mb-label'>累计消费</div><div class='mb-val'>¥" + u.spend.toLocaleString() + "</div></div><div class='mb-item'><div class='mb-label'>注册时间</div><div class='mb-val'>" + u.regDate + "</div></div></div>" +
    "<div class='mb-section-title'>🎯 CoRide 偏好向量</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>温度偏好</div><div class='mb-val'>" + u.prefTemp + "°C</div></div><div class='mb-item'><div class='mb-label'>音乐偏好</div><div class='mb-val'>" + u.prefMusic + "</div></div><div class='mb-item'><div class='mb-label'>灯光偏好</div><div class='mb-val'>" + u.prefLight + "</div></div></div>" +
    "<div class='mb-section-title'>🏷 用户标签</div><div class='mb-val'>" + u.tags.map(function(t){ return "<span class='badge orange' style='margin:2px'>" + t + "</span>"; }).join(" ") + "</div>" +
    "</div>");
}


// ═══ ═══ ═══ TICKET MANAGEMENT ═══ ═══ ═══
var allTickets = (function(){
  var u = allUsers, v = allVehicles, o = allOrders;
  return [
    {id:"TK-045",subject:"车辆 " + v[0].id + " CAN 信号断连",user:u[0].name,type:"故障报修",priority:"high",status:"open",time:"2026-08-06 17:20"},
    {id:"TK-044",subject:"订单 " + (o.find(function(x){return x.status==="completed"})||o[0]).id + " 费用争议",user:u[1].name,type:"投诉",priority:"high",status:"processing",time:"2026-08-06 16:45"},
    {id:"TK-043",subject:"蓝牙连接不上车机",user:u[2].name,type:"技术问题",priority:"medium",status:"processing",time:"2026-08-06 15:30"},
    {id:"TK-042",subject:"建议增加夜间模式",user:u[3].name,type:"功能建议",priority:"low",status:"closed",time:"2026-08-06 14:10"},
    {id:"TK-041",subject:"车辆 " + v[1].id + " 空调不制冷",user:u[4].name,type:"故障报修",priority:"medium",status:"processing",time:"2026-08-06 13:20"},
    {id:"TK-040",subject:"APP 闪退问题反馈",user:u[5].name,type:"Bug反馈",priority:"high",status:"open",time:"2026-08-06 11:50"},
    {id:"TK-039",subject:"车内音量无法调节",user:u[6].name,type:"技术问题",priority:"medium",status:"closed",time:"2026-08-06 10:15"},
    {id:"TK-038",subject:"座椅按摩功能异常",user:u[7].name,type:"故障报修",priority:"low",status:"closed",time:"2026-08-05 18:30"},
    {id:"TK-037",subject:"建议增加外卖配送功能",user:u[8].name,type:"功能建议",priority:"low",status:"open",time:"2026-08-05 16:00"},
    {id:"TK-036",subject:"支付成功但未扣款",user:u[9].name,type:"支付问题",priority:"high",status:"processing",time:"2026-08-05 14:20"}
  ];
})();

function renderTickets() {
  var filter = document.getElementById("ticketFilter").value;
  var priority = document.getElementById("ticketPriority").value;
  var filtered = allTickets.filter(function(t){
    if (filter !== "all" && t.status !== filter) return false;
    if (priority !== "all" && t.priority !== priority) return false;
    return true;
  });
  var h = "";
  for (var i = 0; i < filtered.length; i++) {
    var t = filtered[i];
    var stBadge = t.status === "open" ? "<span class='badge red'>待处理</span>" : t.status === "processing" ? "<span class='badge orange'>处理中</span>" : "<span class='badge gray'>已关闭</span>";
    var priClass = t.priority === "high" ? "high" : t.priority === "medium" ? "medium" : "low";
    h += "<tr><td><b>" + t.id + "</b></td><td>" + t.subject + "</td><td>" + t.user + "</td><td>" + t.type + "</td><td><span class='ticket-priority " + priClass + "'>" + (t.priority === "high" ? "🔴 高" : t.priority === "medium" ? "🟡 中" : "🟢 低") + "</span></td><td>" + stBadge + "</td><td>" + t.time + "</td><td><button class='dt-btn view' onclick='viewTicket(\"" + t.id + "\")'>详情</button></td></tr>";
  }
  document.getElementById("ticketTableBody").innerHTML = h;
}

function viewTicket(tid) {
  var t = allTickets.find(function(x){ return x.id === tid; });
  if (!t) return;
  openModal("<div class='modal-header'><span class='mh-title'>🎧 工单 " + t.id + "</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>主题</div><div class='mb-val'>" + t.subject + "</div></div><div class='mb-item'><div class='mb-label'>用户</div><div class='mb-val'>" + t.user + "</div></div></div>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>类型</div><div class='mb-val'>" + t.type + "</div></div><div class='mb-item'><div class='mb-label'>优先级</div><div class='mb-val'>" + (t.priority === "high" ? "🔴 高" : t.priority === "medium" ? "🟡 中" : "🟢 低") + "</div></div><div class='mb-item'><div class='mb-label'>状态</div><div class='mb-val'>" + (t.status === "open" ? "待处理" : t.status === "processing" ? "处理中" : "已关闭") + "</div></div></div>" +
    "<div class='mb-section-title'>💬 处理记录</div>" +
    "<div style='padding:12px;background:#0d1117;border-radius:8px;font-size:12px;color:#888'><div style='margin-bottom:8px'><span style='color:#4facfe'>系统</span> · " + t.time + "<br>" + t.subject + " — 已创建工单</div>" +
    (t.status !== "open" ? "<div style='margin-bottom:8px'><span style='color:#F5A623'>张运营</span> · " + t.time + "<br>已接单，正在排查处理中…</div>" : "") +
    (t.status === "closed" ? "<div><span style='color:#27ae60'>系统</span> · " + t.time + "<br>工单已关闭 ✓</div>" : "") + "</div>" +
    "</div>");
}

function createTicket() {
  showToast("工单创建功能已触发（Demo）");
}


// ═══ ═══ ═══ ANALYTICS (guarded — page may not exist) ═══ ═══ ═══
function renderAnalytics() {
  var cc = document.getElementById("channelChart");
  var hg = document.getElementById("heatGrid");
  var fc = document.getElementById("funnelChart");
  if (!cc && !hg && !fc) return; // page not in DOM, skip

  if (cc) {
    var days = ["8/1","8/2","8/3","8/4","8/5","8/6","8/7"];
    // Derive chart data from actual platform stats (today = real data, past days = scaled)
    var platData = [];
    platforms.forEach(function(p, pi) {
      var todayVal = p.dailyOrders;
      var seed = (p.id.charCodeAt(0) + p.id.charCodeAt(1) + pi) % 10;
      var scales = [0.85, 0.89, 0.92, 0.88, 0.94, 0.97, 1.00]; // ramp up to today
      var data = [];
      for (var d7 = 0; d7 < 7; d7++) {
        data.push(Math.round(todayVal * scales[d7] * (0.95 + (seed + d7 * 3) % 10 / 100)));
      }
      platData.push({name: p.name, color: p.color, data: data});
    });
    var maxVal = 0;
    platData.forEach(function(pd){ pd.data.forEach(function(v){ if (v > maxVal) maxVal = v; }); });
    var barW = String(Math.floor(90 / platData.length)) + "px";
    var h = "";
    for (var i = 0; i < days.length; i++) {
      h += "<div style='display:flex;align-items:flex-end;gap:3px;flex:1;justify-content:center'>";
      for (var j = 0; j < platData.length; j++) {
        var ht = (platData[j].data[i] / maxVal * 100);
        h += "<div style='width:" + barW + ";background:" + platData[j].color + ";border-radius:3px 3px 0 0;height:" + ht + "px;position:relative' title='" + platData[j].name + "'>";
        if (ht > 20) h += "<span class='cb-val' style='font-size:7px'>" + platData[j].data[i] + "</span>";
        h += "</div>";
      }
      h += "<span class='cb-label' style='font-size:9px'>" + days[i] + "</span></div>";
    }
    cc.innerHTML = h;
    var legH = "<div style='display:flex;gap:16px;justify-content:center;margin-bottom:12px;flex-wrap:wrap' id='chartLegend'>";
    platData.forEach(function(pd){ legH += "<span style='font-size:10px;color:var(--text-dim)'><span style='display:inline-block;width:10px;height:10px;background:" + pd.color + ";border-radius:2px;margin-right:4px;vertical-align:middle'></span>" + pd.name + "</span>"; });
    legH += "</div>";
    var existLeg = document.getElementById("chartLegend"); if (existLeg) existLeg.remove();
    cc.insertAdjacentHTML("beforebegin", legH);
  }
  if (hg) {
    var hours = ["0-4","4-8","8-12","12-16","16-20","20-24"];
    var heatH = "";
    for (var j2 = 0; j2 < hours.length; j2++) {
      var intensity = Math.floor(Math.random() * 200) + 100;
      var alpha = Math.min(1, intensity / 350);
      heatH += "<div style='padding:8px 6px;border-radius:4px;text-align:center;font-size:9px;background:rgba(245,166,35," + alpha.toFixed(2) + ");color:" + (alpha > 0.6 ? "#111" : "#aaa") + "'>" + hours[j2] + "<br>" + intensity + "单</div>";
    }
    hg.innerHTML = heatH;
  }
  if (fc) {
    var funnel = [
      {label:"浏览 CoRide 服务",val:"3,500",pct:100},
      {label:"选择 CoRide 车辆",val:"2,400",pct:69},
      {label:"确认订单",val:"1,450",pct:41},
      {label:"完成支付",val:"1,350",pct:39},
      {label:"完成行程",val:"1,150",pct:33}
    ];
    var fh = "";
    for (var k = 0; k < funnel.length; k++) {
      var f = funnel[k];
      fh += "<div style='display:flex;align-items:center;gap:12px'><span style='font-size:12px;color:#bbb;width:140px;text-align:right'>" + f.label + "</span><div style='flex:1;height:24px;background:#1a1a2a;border-radius:6px;overflow:hidden'><div style='height:100%;width:" + f.pct + "%;background:linear-gradient(90deg,#F5A623,#e6951a);border-radius:6px;display:flex;align-items:center;padding-left:10px;font-size:10px;color:#111;font-weight:700'>" + f.val + "</div></div><span style='font-size:10px;color:#555;width:40px'>" + f.pct + "%</span></div>";
    }
    fc.innerHTML = fh;
  }
}

// ═══ INIT ═══
renderDashboard();
renderVehicles();
renderOrders();
renderUsers();
renderMembers();
renderTickets();
renderAnalytics();

// Update sidebar user name
var loginUser = sessionStorage.getItem("coride_user") || "admin@coride.cn";
if (loginUser.indexOf("@") > 0) loginUser = loginUser.split("@")[0];
var userNameEl = document.getElementById("sidebarUserName"); if (userNameEl) userNameEl.textContent = loginUser;

// Quick self-test: verify chat data loaded
console.log("CoRide Admin v2.0 loaded — chat: HTML-driven");


// ═══ ═══ ═══ ONLINE CHAT ═══ ═══ ═══
function syncChatUsers() {
  // Pick 5 random users (prioritize plus-tier for realistic support scenarios)
  var plusUsers = allUsers.filter(function(u){ return u.tier === "plus"; });
  var otherUsers = allUsers.filter(function(u){ return u.tier !== "plus"; });
  var cand = plusUsers.slice(0, 3).concat(otherUsers.slice(0, 2));
  if (cand.length < 5) cand = allUsers.slice(0, 5);
  chatUserInfo = {
    "C001":{name:cand[0].name, phone:cand[0].phone, online:true},
    "C002":{name:cand[1].name, phone:cand[1].phone, online:true},
    "C003":{name:cand[2].name, phone:cand[2].phone, online:false},
    "C004":{name:cand[3].name, phone:cand[3].phone, online:true},
    "C005":{name:cand[4].name, phone:cand[4].phone, online:false}
  };
  // Update sidebar chat list names
  var cids = ["C001","C002","C003","C004","C005"];
  for (var ci = 0; ci < cids.length; ci++) {
    var item = document.querySelector(".chat-conv-item[data-cid='" + cids[ci] + "']");
    if (item) {
      var nameEl = item.querySelector(".cci-name");
      if (nameEl) nameEl.textContent = chatUserInfo[cids[ci]].name;
      var avatarEl = item.querySelector(".cci-avatar");
      if (avatarEl) avatarEl.textContent = chatUserInfo[cids[ci]].name.charAt(0);
      var dotEl = item.querySelector(".cci-dot");
      if (dotEl) dotEl.style.display = chatUserInfo[cids[ci]].online ? "" : "none";
    }
  }
}
var chatUserInfo = {};
syncChatUsers();
var activeChatConv = "C001"; // Start with C001 open

function renderChatConvs() { openChatConv(activeChatConv); }

function openChatConv(cid) {
  activeChatConv = cid;
  var c = chatUserInfo[cid];
  if (!c) return;

  // Update header (include online badge in innerHTML to avoid destroying it)
  document.getElementById("chatHeader").innerHTML = "<span style='font-size:14px;font-weight:700;color:var(--text-primary)'>👤 " + c.name + "</span><span style='font-size:10px;color:var(--text-tertiary)'>📱 " + c.phone + "</span><span style='font-size:10px' id='chatOnlineBadge'>" + (c.online ? "🟢 在线" : "⚫ 离线") + "</span>";

  // Show/hide message groups via class
  var allCids = ["C001","C002","C003","C004","C005"];
  for (var i = 0; i < allCids.length; i++) {
    var el = document.getElementById("chatMsgs" + allCids[i]);
    if (!el) continue;
    if (allCids[i] === cid) { el.classList.add("active"); }
    else { el.classList.remove("active"); }
  }
  // Scroll to bottom
  var msgEl = document.getElementById("chatMessages");
  if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;

  // Highlight active conv item
  var items = document.querySelectorAll("#chatConvList .chat-conv-item");
  for (var j = 0; j < items.length; j++) { items[j].classList.remove("active"); }
  var ci = document.querySelector("#chatConvList .chat-conv-item[data-cid='" + cid + "']");
  if (ci) ci.classList.add("active");
}

function sendChatMsg() {
  if (!activeChatConv) return;
  var input = document.getElementById("chatInput");
  var msg = input.value.trim();
  if (!msg) return;
  var now = new Date();
  var time = String(now.getHours()).padStart(2,"0") + ":" + String(now.getMinutes()).padStart(2,"0");

  // Append new message to pre-rendered div
  var groupEl = document.getElementById("chatMsgs" + activeChatConv);
  if (groupEl) {
    var div = document.createElement("div");
    div.className = "chat-msg operator";
    div.innerHTML = "<div class='cm-bubble'>" + msg + "<div class='cm-time'>" + time + "</div></div>";
    groupEl.appendChild(div);
    var msgEl = document.getElementById("chatMessages");
    if (msgEl) msgEl.scrollTop = msgEl.scrollHeight;
  }

  // Update sidebar preview
  var ci = document.querySelector("#chatConvList .chat-conv-item[data-cid='" + activeChatConv + "']");
  if (ci) {
    var pv = ci.querySelector(".cci-preview"); if (pv) pv.textContent = msg;
    var tm = ci.querySelector(".cci-time"); if (tm) tm.textContent = time;
  }

  input.value = "";
  showToast("消息已发送");
}

// ═══ ═══ ═══ DASHBOARD UPDATE ═══ ═══ ═══
function renderDashboard() {
  var h = "";
  var onlineCount = 0;
  for (var i = 0; i < allVehicles.length; i++) {
    var v = allVehicles[i];
    if (v.status === "online") onlineCount++;
    h += "<div class='veh-item'><div class='vi-id'>" + v.id + "</div><div class='vi-status " + v.status + "'>" + (v.status==="online"?"🟢 在线":v.status==="offline"?"🟡 离线":"🔴 故障") + "</div><div class='vi-npu'>NPU " + (v.npu || 0) + "%</div></div>";
  }
  var el = document.getElementById("vehGrid"); if (el) el.innerHTML = h;
  // Update KPI from actual data
  var totalRev = 0, totalCFee = 0, memberCount = 0;
  for (var j = 0; j < allOrders.length; j++) { totalRev += allOrders[j].amount; if (allOrders[j].status !== "cancelled") totalCFee += allOrders[j].corideFee; }
  var members = getMembers();
  for (var k = 0; k < members.length; k++) { if (members[k].status === "active") memberCount++; }
  var kpiO = document.getElementById("kpiOrders"); if (kpiO) kpiO.textContent = allOrders.length;
  var kpiR = document.getElementById("kpiRevenue"); if (kpiR) kpiR.textContent = "¥" + totalRev.toLocaleString(undefined, {minimumFractionDigits: 2});
  var kpiF = document.getElementById("kpiFleet"); if (kpiF) kpiF.textContent = onlineCount;
  // Add member KPI if exists
  var kpiM = document.getElementById("kpiMembers");
  if (kpiM) kpiM.textContent = memberCount;
  var kpiCF = document.getElementById("kpiCorideFee");
  if (kpiCF) kpiCF.textContent = "¥" + totalCFee.toLocaleString(undefined, {minimumFractionDigits: 2});
  // Jet health
  if (onlineCount === 50) { var jv = document.querySelector(".js-val.good"); if (jv) jv.textContent = "100%"; }
  else { var jv2 = document.querySelector(".js-val.good"); if (jv2) jv2.textContent = Math.round(onlineCount/50*100) + "%"; }
}

// ═══ ═══ ═══ REVENUE ANALYSIS ═══ ═══ ═══
function renderRevenue() {
  // Per-platform breakdown from ALL orders using actual stored fee components
  var platData = {};
  var platAllCount = {};
  var platCompletedCount = {};
  platforms.forEach(function(p){
    platData[p.id] = {name:p.name, color:p.color, base:0, mileage:0, interact:0, corideActual:0, corideProjected:0, rideFare:0};
    platAllCount[p.id] = 0;
    platCompletedCount[p.id] = 0;
  });
  var totalBase = 0, totalMile = 0, totalInter = 0;
  var actualCoride = 0, projectedCoride = 0, totalRideFare = 0;
  var completedTotal = 0, ongoingTotal = 0, cancelledTotal = 0;

  for (var i = 0; i < allOrders.length; i++) {
    var o = allOrders[i];
    totalRideFare += o.amount;
    // Match platform by channel name
    var pk = null;
    for (var k in platData) { if (o.channel === platData[k].name) { pk = k; break; } }
    if (pk) platAllCount[pk]++;

    if (o.status === "completed") {
      completedTotal++;
      actualCoride += o.corideFee;
      if (pk) {
        platCompletedCount[pk]++;
        platData[pk].base       += o.baseFee;
        platData[pk].mileage    += o.mileageFee;
        platData[pk].interact   += o.interactionFee;
        platData[pk].corideActual += o.corideFee;
        platData[pk].rideFare   += o.amount;
        totalBase   += o.baseFee;
        totalMile   += o.mileageFee;
        totalInter  += o.interactionFee;
      }
    } else if (o.status === "ongoing") {
      ongoingTotal++;
      projectedCoride += o.corideFee;
      if (pk) platData[pk].corideProjected += o.corideFee;
    } else { cancelledTotal++; }
  }

  // Member subscription revenue (daily amortized)
  var members = getMembers();
  var activeMemberCount = members.filter(function(m){return m.status==="active"}).length;
  var memberDailyRev = activeMemberCount * (12 / 30);

  // Grand total: completed corideFee (actual) + member subscription
  var grandTotal = actualCoride + memberDailyRev;

  // ═══ KPI Cards (5-col layout) ═══
  var kh = '';
  // Compute historical total (platform launched Jan 2026, growth from ~200 to 1,150 orders/day)
  var monthlyGrowth = [0.39, 0.48, 0.57, 0.65, 0.74, 0.83, 0.91, 1.00]; // Jan→Aug, ~2.5× growth
  var monthNames = ["1月","2月","3月","4月","5月","6月","7月","8月"];
  var monthlyRev = [];
  var histTotal = 0;
  var todayDaily = actualCoride + projectedCoride; // today's daily corideFee baseline
  for (var mi = 0; mi < 8; mi++) {
    var mRev = Math.round(todayDaily * monthlyGrowth[mi] * 30); // monthly = daily × 30 days × scale
    monthlyRev.push(mRev);
    histTotal += mRev;
  }
  // Adjust Aug to use actual+projected from today
  histTotal = histTotal - monthlyRev[7] + Math.round(todayDaily * 30);
  monthlyRev[7] = Math.round(todayDaily * 30);
  kh += '<div class="kpi-card" style="grid-column:span 2"><div class="kc-icon" style="background:rgba(245,166,35,.15);font-size:28px">💰</div><div class="kc-body"><div class="kc-val">¥' + grandTotal.toLocaleString(undefined,{minimumFractionDigits:2}) + '</div><div class="kc-label">CoRide 当日总收入</div><div class="kc-change up">已入账 ¥' + actualCoride.toLocaleString(undefined,{minimumFractionDigits:2}) + ' + 会员订阅 ¥' + memberDailyRev.toFixed(2) + '</div></div></div>';
  kh += '<div class="kpi-card"><div class="kc-icon" style="background:rgba(79,172,254,.15)">✅</div><div class="kc-body"><div class="kc-val">¥' + actualCoride.toLocaleString(undefined,{minimumFractionDigits:2}) + '</div><div class="kc-label">服务费已入账</div><div class="kc-change">' + completedTotal + ' 单已完成</div></div></div>';
  kh += '<div class="kpi-card"><div class="kc-icon" style="background:rgba(39,174,96,.15)">📊</div><div class="kc-body"><div class="kc-val">¥' + projectedCoride.toLocaleString(undefined,{minimumFractionDigits:2}) + '</div><div class="kc-label">服务费预计</div><div class="kc-change">' + ongoingTotal + ' 单进行中</div></div></div>';
  kh += '<div class="kpi-card"><div class="kc-icon" style="background:rgba(155,89,182,.15)">👑</div><div class="kc-body"><div class="kc-val">¥' + memberDailyRev.toFixed(2) + '</div><div class="kc-label">会员订阅日均</div><div class="kc-change">' + activeMemberCount + ' 位会员 × ¥0.40</div></div></div>';
  kh += '<div class="kpi-card"><div class="kc-icon" style="background:rgba(26,188,156,.15)">🏦</div><div class="kc-body"><div class="kc-val">¥' + totalRideFare.toLocaleString(undefined,{minimumFractionDigits:2}) + '</div><div class="kc-label">平台交易总额</div><div class="kc-change">' + (completedTotal+ongoingTotal) + ' 单有效订单</div></div></div>';
  kh += '<div class="kpi-card"><div class="kc-icon" style="background:rgba(231,76,60,.15);font-size:22px">🏛</div><div class="kc-body"><div class="kc-val">¥' + histTotal.toLocaleString(undefined,{minimumFractionDigits:2}) + '</div><div class="kc-label">历史总营收</div><div class="kc-change up">2026年1-8月 累计服务费</div></div></div>';
  document.getElementById("revKpiGrid").innerHTML = kh;
  document.getElementById("revKpiGrid").style.gridTemplateColumns = "2fr 1fr 1fr 1fr 1fr 1fr";

  // ═══ Stacked Horizontal Bar Chart (completed only, by fee component) ═══
  var maxStack = 0;
  for (var pk2 in platData) { var s = platData[pk2].base + platData[pk2].mileage + platData[pk2].interact; if (s > maxStack) maxStack = s; }
  var stackHtml = "";
  for (var pk3 in platData) {
    var pd = platData[pk3];
    var pTotal = pd.base + pd.mileage + pd.interact;
    var pctBase = maxStack > 0 ? (pd.base / maxStack * 100) : 0;
    var pctMile = maxStack > 0 ? (pd.mileage / maxStack * 100) : 0;
    var pctInter = maxStack > 0 ? (pd.interact / maxStack * 100) : 0;
    stackHtml += '<div class="rev-sb-row">' +
      '<span class="rev-sb-label">' + pd.name + ' <small>(' + platCompletedCount[pk3] + '单)</small></span>' +
      '<div class="rev-sb-track">' +
        '<span class="rev-sb-seg" style="width:' + pctBase.toFixed(1) + '%;background:var(--orange)" title="基础费 ¥' + pd.base.toFixed(2) + '"></span>' +
        '<span class="rev-sb-seg" style="width:' + pctMile.toFixed(1) + '%;background:var(--blue)" title="里程费 ¥' + pd.mileage.toFixed(2) + '"></span>' +
        '<span class="rev-sb-seg" style="width:' + pctInter.toFixed(1) + '%;background:#2ecc71" title="交互费 ¥' + pd.interact.toFixed(2) + '"></span>' +
      '</div>' +
      '<span class="rev-sb-val">¥' + pTotal.toLocaleString(undefined,{minimumFractionDigits:2}) + '</span>' +
      '</div>';
  }
  document.getElementById("revStackedBars").innerHTML = stackHtml || '<div style="color:var(--text-secondary);padding:8px">暂无已完成订单</div>';

  // ═══ CSS Donut Chart (3 fee components) ═══
  var donutColors = ["var(--orange)", "var(--blue)", "#2ecc71"];
  var donutLabels = ["基础费 ¥2.50", "里程费 ¥0.15/km", "交互费 ¥1.00/次"];
  var donutVals = [totalBase, totalMile, totalInter];
  var donutTotal = totalBase + totalMile + totalInter;
  var donutParts = [];
  var donutAccum = 0;
  for (var di = 0; di < donutVals.length; di++) {
    if (donutTotal > 0 && donutVals[di] > 0) {
      var startPct = donutAccum / donutTotal * 100;
      var segPct = donutVals[di] / donutTotal * 100;
      donutParts.push(donutColors[di] + " " + startPct.toFixed(1) + "% " + (startPct + segPct).toFixed(1) + "%");
      donutAccum += donutVals[di];
    }
  }
  var donutGradient = donutParts.length > 0 ? "conic-gradient(" + donutParts.join(", ") + ")" : "#1a1a2a";
  document.getElementById("revDonut").style.background = donutGradient;
  document.getElementById("revDonutTotal").textContent = "¥" + donutTotal.toLocaleString(undefined,{minimumFractionDigits:2});

  // Donut legend
  var donutContainer = document.getElementById("revDonut").parentNode;
  var existingLegend = donutContainer.querySelector(".rev-donut-legend");
  if (existingLegend) existingLegend.remove();
  var legendDiv = document.createElement("div");
  legendDiv.className = "rev-donut-legend";
  var donutLegend = "";
  for (var dl = 0; dl < donutVals.length; dl++) {
    var dpct = donutTotal > 0 ? (donutVals[dl] / donutTotal * 100) : 0;
    donutLegend += '<div class="rev-donut-legend-item"><span class="rev-donut-dot" style="background:' + donutColors[dl] + '"></span>' + donutLabels[dl] + ' <b>' + dpct.toFixed(1) + '%</b></div>';
  }
  legendDiv.innerHTML = donutLegend;
  donutContainer.appendChild(legendDiv);

  // ═══ 7-Day Trend (derived from today's per-platform actual data) ═══
  var trendHtml = '<div class="rev-trend-table"><div class="rev-trend-header"><span>平台</span><span>7/31</span><span>8/1</span><span>8/2</span><span>8/3</span><span>8/4</span><span>8/5</span><span>8/6 今日</span><span>7天合计</span></div>';
  var weekGrand = 0;
  for (var ti = 0; ti < platforms.length; ti++) {
    var tp = platforms[ti];
    var pd2 = platData[tp.id];
    var todayFee = pd2.corideActual + pd2.corideProjected;
    // Day 1-6: scale from today's value with slight variation (weekday/weekend pattern)
    var scales = [0.82, 0.88, 0.91, 0.78, 0.85, 0.93]; // Mon-Sat pattern before today (Sun)
    var weekTotal = 0;
    var row = '<div class="rev-trend-row"><span class="rev-trend-name" style="color:' + tp.color + ';font-weight:600">' + tp.name + '</span>';
    for (var td = 0; td < 6; td++) {
      var daySeed = (tp.id.charCodeAt(0) * 7 + ti * 11 + td * 3) % 20;
      var variation = 0.92 + daySeed / 100;
      var dayVal = Math.round(todayFee * scales[td] * variation);
      weekTotal += dayVal;
      row += '<span>¥' + dayVal.toLocaleString() + '</span>';
    }
    weekTotal += todayFee;
    weekGrand += weekTotal;
    row += '<span class="rev-trend-today">¥' + todayFee.toLocaleString(undefined,{minimumFractionDigits:2}) + '</span>';
    row += '<span class="rev-trend-sum"><b>¥' + weekTotal.toLocaleString(undefined,{minimumFractionDigits:2}) + '</b></span></div>';
    trendHtml += row;
  }
  trendHtml += '<div class="rev-trend-row" style="font-weight:700;background:var(--bg-secondary)"><span class="rev-trend-name">合计</span>';
  for (var td2 = 0; td2 < 6; td2++) {
    var dSum = 0;
    for (var ti2 = 0; ti2 < platforms.length; ti2++) {
      var tp2 = platforms[ti2];
      var pd3 = platData[tp2.id];
      var tv = pd3.corideActual + pd3.corideProjected;
      var daySeed2 = (tp2.id.charCodeAt(0) * 7 + ti2 * 11 + td2 * 3) % 20;
      dSum += Math.round(tv * [0.82,0.88,0.91,0.78,0.85,0.93][td2] * (0.92 + daySeed2/100));
    }
    trendHtml += '<span>¥' + dSum.toLocaleString() + '</span>';
  }
  var todaySum = actualCoride + projectedCoride;
  trendHtml += '<span class="rev-trend-today">¥' + todaySum.toLocaleString(undefined,{minimumFractionDigits:2}) + '</span>';
  trendHtml += '<span class="rev-trend-sum"><b>¥' + weekGrand.toLocaleString(undefined,{minimumFractionDigits:2}) + '</b></span></div>';
  trendHtml += '</div>';
  document.getElementById("revTrendGrid").innerHTML = trendHtml;

  // ═══ Detail Table (completed orders breakdown + projected) ═══
  var dh = "";
  for (var pk4 in platData) {
    var pd4 = platData[pk4];
    var completedFee = pd4.base + pd4.mileage + pd4.interact;
    dh += "<tr><td><b style='color:" + pd4.color + "'>" + pd4.name + "</b></td>" +
      "<td>" + platAllCount[pk4] + " 单</td>" +
      "<td>" + platCompletedCount[pk4] + " 单</td>" +
      "<td>¥" + pd4.base.toFixed(2) + "</td>" +
      "<td>¥" + pd4.mileage.toFixed(2) + "</td>" +
      "<td>¥" + pd4.interact.toFixed(2) + "</td>" +
      "<td>¥" + pd4.corideActual.toFixed(2) + "</td>" +
      "<td style='color:var(--accent-blue)'>预计 ¥" + pd4.corideProjected.toFixed(2) + "</td>" +
      "<td class='rev-total-cell'><b>¥" + (pd4.corideActual + pd4.corideProjected).toFixed(2) + "</b></td></tr>";
  }
  dh += "<tr style='font-weight:700;background:var(--bg-secondary)'><td><b>合计</b></td>" +
    "<td>" + (completedTotal + ongoingTotal + cancelledTotal) + " 单</td>" +
    "<td>" + completedTotal + " 单</td>" +
    "<td>¥" + totalBase.toFixed(2) + "</td>" +
    "<td>¥" + totalMile.toFixed(2) + "</td>" +
    "<td>¥" + totalInter.toFixed(2) + "</td>" +
    "<td>¥" + actualCoride.toFixed(2) + "</td>" +
    "<td style='color:var(--accent-blue)'>预计 ¥" + projectedCoride.toFixed(2) + "</td>" +
    "<td class='rev-total-cell'><b>¥" + (actualCoride + projectedCoride).toFixed(2) + "</b></td></tr>";
  document.getElementById("revDetailBody").innerHTML = dh;

  // ═══ Monthly Report (Jan-Aug 2026 with growth trend) ═══
  var mChart = document.getElementById("revMonthlyChart");
  var mSummary = document.getElementById("revMonthlySummary");
  if (mChart && mSummary) {
    var maxMRev = monthlyRev[7];
    var pad = {top:20, right:20, bottom:30, left:50};
    var w = 560, h = 200;
    var pw = w - pad.left - pad.right;
    var ph = h - pad.top - pad.bottom;
    // Build SVG line + area + dots
    var points = "";
    var areaPoints = "";
    for (var mi2 = 0; mi2 < 8; mi2++) {
      var x = pad.left + (mi2 / 7) * pw;
      var y = pad.top + ph - (maxMRev > 0 ? (monthlyRev[mi2] / maxMRev) * ph : 0);
      points += (mi2 > 0 ? " " : "") + x.toFixed(1) + "," + y.toFixed(1);
      areaPoints += (mi2 > 0 ? " " : "") + x.toFixed(1) + "," + y.toFixed(1);
    }
    // Close area path
    areaPoints += " " + (pad.left + pw).toFixed(1) + "," + (pad.top + ph).toFixed(1);
    areaPoints += " " + pad.left.toFixed(1) + "," + (pad.top + ph).toFixed(1);
    var yGrid = "";
    for (var gy = 0; gy <= 4; gy++) {
      var gyVal = Math.round(maxMRev * (4 - gy) / 4);
      var gyY = pad.top + (gy / 4) * ph;
      yGrid += '<line x1="' + pad.left + '" y1="' + gyY.toFixed(1) + '" x2="' + (pad.left + pw) + '" y2="' + gyY.toFixed(1) + '" stroke="var(--border-subtle)" stroke-dasharray="4,4"/>';
      yGrid += '<text x="' + (pad.left - 6) + '" y="' + (gyY + 4).toFixed(1) + '" text-anchor="end" font-size="9" fill="var(--text-dim)">¥' + (gyVal/1000).toFixed(0) + 'k</text>';
    }
    // X-axis labels
    var xLabels = "";
    for (var mi3 = 0; mi3 < 8; mi3++) {
      var lx = pad.left + (mi3 / 7) * pw;
      xLabels += '<text x="' + lx.toFixed(1) + '" y="' + (pad.top + ph + 16) + '" text-anchor="middle" font-size="10" fill="var(--text-secondary)">' + monthNames[mi3] + '</text>';
    }
    // Dots with tooltip
    var dots = "";
    for (var mi4 = 0; mi4 < 8; mi4++) {
      var dx = pad.left + (mi4 / 7) * pw;
      var dy = pad.top + ph - (maxMRev > 0 ? (monthlyRev[mi4] / maxMRev) * ph : 0);
      dots += '<circle cx="' + dx.toFixed(1) + '" cy="' + dy.toFixed(1) + '" r="4" fill="var(--orange)" stroke="#fff" stroke-width="2">';
      dots += '<title>' + monthNames[mi4] + ': ¥' + monthlyRev[mi4].toLocaleString() + '</title></circle>';
      // Value label above dot
      dots += '<text x="' + dx.toFixed(1) + '" y="' + (dy - 8).toFixed(1) + '" text-anchor="middle" font-size="9" font-weight="600" fill="var(--orange)">¥' + (monthlyRev[mi4]/1000).toFixed(1) + 'k</text>';
    }
    var svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' +
      yGrid + xLabels +
      '<polygon points="' + areaPoints + '" fill="rgba(245,166,35,0.08)"/>' +
      '<polyline points="' + points + '" fill="none" stroke="var(--orange)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots +
      '</svg>';
    mChart.innerHTML = svg;
    // Summary sidebar
    var avgMonthly = Math.round(histTotal / 8);
    var momGrowth = monthlyRev[6] > 0 ? Math.round((monthlyRev[7] - monthlyRev[6]) / monthlyRev[6] * 100) : 0;
    mSummary.innerHTML =
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">📅 累计月份</span><span class="rev-ms-val">8 个月</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">🏛 历史总营收</span><span class="rev-ms-val primary">¥' + histTotal.toLocaleString(undefined,{minimumFractionDigits:2}) + '</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">📊 月均营收</span><span class="rev-ms-val">¥' + avgMonthly.toLocaleString(undefined,{minimumFractionDigits:2}) + '</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">📈 环比增长</span><span class="rev-ms-val up">+' + momGrowth + '%</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">🚀 年初至今增长</span><span class="rev-ms-val up">' + (monthlyRev[0] > 0 ? Math.round((monthlyRev[7] - monthlyRev[0]) / monthlyRev[0] * 100) : 0) + '%</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">🎯 年度目标</span><span class="rev-ms-val primary">¥1,659,000.00</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">📊 目标达成率</span><span class="rev-ms-val up">' + Math.round(histTotal / 1659000 * 100) + '%</span></div>' +
      '<div class="rev-monthly-summary-item"><span class="rev-ms-label">📋 累计订单</span><span class="rev-ms-val">' + (allOrders.length * 8 * 0.58).toLocaleString(undefined,{maximumFractionDigits:0}) + ' 单</span></div>';
  }
}

// ═══ ═══ ═══ MEMBER MANAGEMENT (derived from allUsers) ═══ ═══ ═══
function getMembers() {
  // Members = users with tier "plus", enriched with computed savings from orders
  var memberUsers = allUsers.filter(function(u){ return u.tier === "plus"; });
  // Compute actual savings per member from orders
  var memberSavings = {};
  for (var i = 0; i < allOrders.length; i++) {
    var o = allOrders[i];
    if (!o.isMember || o.status === "cancelled") continue;
    // Savings = mileage fee they would have paid + interaction fee they would have paid
    var saved = o.distance * 0.15 + o.interactions * 1.00;
    memberSavings[o.passenger] = (memberSavings[o.passenger] || 0) + saved;
  }
  return memberUsers.map(function(u, idx){
    var saved = memberSavings[u.name] || (u.trips * 2.50); // fallback: estimate ¥2.50/trip
    return {
      id: "M-" + String(idx + 1).padStart(3,"0"),
      userId: u.id,
      name: u.name,
      phone: u.phone,
      trips: u.trips,
      spend: u.spend,
      saved: Math.round(saved * 100) / 100,
      since: u.memberSince || u.regDate,
      status: u.memberStatus || "active",
      plan: "¥12/月"
    };
  });
}

function renderMembers() {
  var allMembers = getMembers();
  var filter = document.getElementById("memberFilter").value;
  var search = document.getElementById("memberSearch").value.toLowerCase();
  var filtered = allMembers.filter(function(m){
    if (filter !== "all" && m.status !== filter) return false;
    if (search && m.name.toLowerCase().indexOf(search) === -1 && m.phone.indexOf(search) === -1) return false;
    return true;
  });
  filtered = applySort(filtered, "members");
  document.getElementById("memberCount").textContent = "共 " + filtered.length + " 人";
  // Stats
  var activeCount = 0; for (var i = 0; i < allMembers.length; i++) { if (allMembers[i].status === "active") activeCount++; }
  var totalSaved = 0; for (var j = 0; j < allMembers.length; j++) { totalSaved += allMembers[j].saved; }
  var totalTrips = 0; for (var k = 0; k < allMembers.length; k++) { totalTrips += allMembers[k].trips; }
  var msH = '<div class="order-stat"><div class="os-val">' + allMembers.length + '</div><div class="os-label">会员总数</div></div>';
  msH += '<div class="order-stat"><div class="os-val">' + activeCount + '</div><div class="os-label">活跃会员</div></div>';
  msH += '<div class="order-stat"><div class="os-val">' + Math.round(activeCount/Math.max(1,allMembers.length)*100) + '%</div><div class="os-label">活跃率</div></div>';
  msH += '<div class="order-stat"><div class="os-val">¥' + (activeCount * 12).toLocaleString() + '</div><div class="os-label">月费收入</div></div>';
  msH += '<div class="order-stat"><div class="os-val">¥' + totalSaved.toLocaleString(undefined, {minimumFractionDigits:2}) + '</div><div class="os-label">累计用户节省</div></div>';
  document.getElementById("memberStatRow").innerHTML = msH;
  var h = "";
  for (var m = 0; m < filtered.length; m++) {
    var mb = filtered[m];
    var stBadge = mb.status === "active" ? "<span class='badge green'>活跃</span>" : mb.status === "expiring" ? "<span class='badge orange'>即将到期</span>" : "<span class='badge gray'>已过期</span>";
    h += "<tr><td><b>" + mb.id + "</b></td><td>" + mb.name + " 👑</td><td>" + mb.phone + "</td><td>" + mb.trips + " 次</td><td>¥" + mb.saved.toFixed(2) + "</td><td>" + mb.since + "</td><td>" + stBadge + "</td><td><button class='dt-btn view' onclick='viewMember(\"" + mb.id + "\")'>详情</button></td></tr>";
  }
  document.getElementById("memberTableBody").innerHTML = h;
}

function viewMember(mid) {
  var allMembers = getMembers();
  var m = allMembers.find(function(x){ return x.id === mid; });
  if (!m) return;
  var stBadge = m.status === "active" ? "<span class='badge green'>活跃</span>" : m.status === "expiring" ? "<span class='badge orange'>即将到期</span>" : "<span class='badge gray'>已过期</span>";
  var user = allUsers.find(function(u){ return u.id === m.userId; });
  openModal("<div class='modal-header'><span class='mh-title'>👑 " + m.name + " 会员详情</span><span class='mh-close' onclick='closeModal()'>✕</span></div><div class='modal-body'>" +
    "<div class='mb-row'><div class='mb-item'><div class='mb-label'>会员 ID</div><div class='mb-val'>" + m.id + "</div></div><div class='mb-item'><div class='mb-label'>用户 ID</div><div class='mb-val'>" + m.userId + "</div></div><div class='mb-item'><div class='mb-label'>状态</div><div class='mb-val'>" + stBadge + "</div></div></div>" +
    "<div class='mb-section-title'>📊 消费与节省</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>累计行程</div><div class='mb-val'>" + m.trips + " 次</div></div><div class='mb-item'><div class='mb-label'>累计消费</div><div class='mb-val'>¥" + m.spend.toLocaleString() + "</div></div><div class='mb-item'><div class='mb-label'>累计节省</div><div class='mb-val' style='color:var(--green);font-weight:700'>¥" + m.saved.toFixed(2) + "</div></div></div>" +
    "<div class='mb-section-title'>💳 订阅信息</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>会员方案</div><div class='mb-val'>" + m.plan + "</div></div><div class='mb-item'><div class='mb-label'>开通日期</div><div class='mb-val'>" + m.since + "</div></div><div class='mb-item'><div class='mb-label'>权益说明</div><div class='mb-val' style='font-size:11px;color:var(--text-tertiary)'>里程费全免 · 月免50次交互 · 专属偏好向量</div></div></div>" +
    (user ? "<div class='mb-section-title'>🎯 偏好向量</div><div class='mb-row'><div class='mb-item'><div class='mb-label'>温度</div><div class='mb-val'>" + user.prefTemp + "°C</div></div><div class='mb-item'><div class='mb-label'>音乐</div><div class='mb-val'>" + user.prefMusic + "</div></div><div class='mb-item'><div class='mb-label'>灯光</div><div class='mb-val'>" + user.prefLight + "</div></div></div>" : "") +
    "</div>");
}

// ═══ ═══ ═══ OTA UPGRADE MANAGEMENT ═══ ═══ ═══
var otaHistory = [
  {time:"2026-08-05 22:30", vehicle:"PX-005", from:"v2.3", to:"v2.4", status:"成功", operator:"自动推送"},
  {time:"2026-08-04 18:15", vehicle:"WR-008", from:"v3.5", to:"v3.8", status:"成功", operator:"张运营"},
  {time:"2026-08-04 10:00", vehicle:"AP-012", from:"v4.0", to:"v5.2", status:"成功", operator:"自动推送"},
  {time:"2026-08-03 14:20", vehicle:"AX-003", from:"v2.0", to:"v2.1", status:"回滚", operator:"自动推送"},
  {time:"2026-08-02 09:00", vehicle:"PX-010", from:"v1.8", to:"v2.4", status:"成功", operator:"张运营"}
];

function renderOTA() {
  var filter = document.getElementById("otaFilter").value;
  var search = document.getElementById("otaSearch").value.toLowerCase();
  var needUpgrade = 0, upToDate = 0;
  var filtered = allVehicles.filter(function(v){
    var match = true;
    if (filter === "pending") match = v.swVersion !== v.swMax;
    else if (filter === "latest") match = v.swVersion === v.swMax;
    if (search && v.id.toLowerCase().indexOf(search) === -1) match = false;
    return match;
  });
  for (var i = 0; i < allVehicles.length; i++) {
    if (allVehicles[i].swVersion !== allVehicles[i].swMax) needUpgrade++;
    else upToDate++;
  }
  document.getElementById("otaCount").textContent = "共 " + filtered.length + " 台";
  var osH = '<div class="order-stat"><div class="os-val">' + needUpgrade + '</div><div class="os-label">待升级</div></div>';
  osH += '<div class="order-stat"><div class="os-val">' + upToDate + '</div><div class="os-label">已最新</div></div>';
  osH += '<div class="order-stat"><div class="os-val">' + Math.round(upToDate/allVehicles.length*100) + '%</div><div class="os-label">升级覆盖率</div></div>';
  document.getElementById("otaStatRow").innerHTML = osH;
  var h = "";
  for (var j = 0; j < filtered.length; j++) {
    var v = filtered[j];
    var pBadge = "<span style='color:" + (platformById[v.platform] ? platformById[v.platform].color : "#888") + ";font-weight:600'>" + (platformById[v.platform] ? platformById[v.platform].name : v.platform) + "</span>";
    var needUp = v.swVersion !== v.swMax;
    var stBadge = needUp ? "<span class='badge orange'>可升级</span>" : "<span class='badge green'>已最新</span>";
    var btn = needUp ? "<button class='dt-btn' style='background:var(--orange);color:#fff;font-size:11px;padding:4px 12px' onclick='showToast(\"已推送升级: " + v.id + " " + v.swVersion + " → " + v.swMax + "\")'>⬆ 升级</button>" : "<span style='color:var(--text-tertiary);font-size:11px'>—</span>";
    h += "<tr><td><b>" + v.id + "</b></td><td>" + pBadge + "</td><td>" + v.hwVersion + "</td><td>" + v.swVersion + "</td><td>" + v.swMax + "</td><td>" + stBadge + "</td><td>" + btn + "</td></tr>";
  }
  document.getElementById("otaTableBody").innerHTML = h;
  // History
  var histH = "";
  for (var k = 0; k < otaHistory.length; k++) {
    var oh = otaHistory[k];
    var stB = oh.status === "成功" ? "<span class='badge green'>成功</span>" : "<span class='badge red'>回滚</span>";
    histH += "<tr><td>" + oh.time + "</td><td>" + oh.vehicle + "</td><td>" + oh.from + "</td><td>" + oh.to + "</td><td>" + stB + "</td><td>" + oh.operator + "</td></tr>";
  }
  document.getElementById("otaHistoryBody").innerHTML = histH;
}

// ═══ ═══ ═══ HARDWARE ASSET TRACKING ═══ ═══ ═══
function renderHardware() {
  var totalVeh = allVehicles.length;
  var jetsonDeployed = totalVeh;
  var jetsonStock = Math.floor(totalVeh * 0.1); // 10% spare
  var screenDeployed = totalVeh;
  var screenStock = Math.floor(totalVeh * 0.08);
  var cameraDeployed = totalVeh;
  var cameraStock = Math.floor(totalVeh * 0.12);
  var jetsonCost = jetsonDeployed * 2500;
  var screenCost = screenDeployed * 250;
  var cameraCost = cameraDeployed * 300;
  var totalCost = jetsonCost + screenCost + cameraCost;
  // Stats
  var sh = '<div class="order-stat"><div class="os-val">' + jetsonDeployed + '</div><div class="os-label">Jetson 已部署</div></div>';
  sh += '<div class="order-stat"><div class="os-val">' + screenDeployed + '</div><div class="os-label">触摸屏 已部署</div></div>';
  sh += '<div class="order-stat"><div class="os-val">' + cameraDeployed + '</div><div class="os-label">摄像头 已部署</div></div>';
  sh += '<div class="order-stat"><div class="os-val">¥' + totalCost.toLocaleString() + '</div><div class="os-label">硬件总成本</div></div>';
  sh += '<div class="order-stat"><div class="os-val">100%</div><div class="os-label">部署覆盖率</div></div>';
  document.getElementById("hwStatRow").innerHTML = sh;
  // Jetson detail
  document.getElementById("hwJetsonDetail").innerHTML =
    "🖥 <b>NVIDIA Jetson Orin Nano</b> (40 TOPS)<br>" +
    "已部署: <b>" + jetsonDeployed + " 台</b> · 库存: " + jetsonStock + " 台<br>" +
    "单价: ¥2,500 · 小计: <b>¥" + jetsonCost.toLocaleString() + "</b><br>" +
    "固件版本: JetPack 6.0 · 内存: 8GB 统一内存<br>" +
    "量化模型: Qwen2.5-7B INT4 (~5.2GB)";
  // Peripherals
  document.getElementById("hwPeriphDetail").innerHTML =
    "📱 <b>7寸 IPS 触摸屏</b> (1024×600)<br>" +
    "已部署: <b>" + screenDeployed + " 台</b> · 库存: " + screenStock + " 台<br>" +
    "单价: ¥250 · 小计: <b>¥" + screenCost.toLocaleString() + "</b><br>" +
    "📷 <b>USB 摄像头</b> (YOLOv8-Nano)<br>" +
    "已部署: <b>" + cameraDeployed + " 台</b> · 库存: " + cameraStock + " 台<br>" +
    "单价: ¥300 · 小计: <b>¥" + cameraCost.toLocaleString() + "</b><br>" +
    "<hr style='border-color:#222;margin:8px 0'>" + 
    "💰 单车硬件成本: <b>¥3,050</b> · 总投入: <b>¥" + totalCost.toLocaleString() + "</b>";
  // Deployment table
  var dh = "";
  var snCounter = 1000;
  for (var i = 0; i < allVehicles.length; i++) {
    var v = allVehicles[i];
    var jsn = "JSN-" + String(snCounter + i).padStart(4,"0");
    var scn = "SCR-" + String(snCounter + i + 500).padStart(4,"0");
    var can = "CAM-" + String(snCounter + i + 1000).padStart(4,"0");
    var installDate = "2026-0" + Math.floor(Math.random() * 7 + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2,"0");
    dh += "<tr><td><b>" + v.id + "</b></td><td>" + jsn + "</td><td>" + scn + "</td><td>" + can + "</td><td>" + v.hwVersion + "</td><td>" + installDate + "</td><td><span class='badge green'>正常</span></td></tr>";
  }
  document.getElementById("hwDeployBody").innerHTML = dh;
}

