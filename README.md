# 🚀 CoRide Robotaxi 智能座舱 Agent 演示套件

**CoRide** 是一个为 Robotaxi 设计的 AI 座舱 Agent 系统——不碰自动驾驶域、不抽票成，通过 Jetson Orin Nano 车端推理 + 云端偏好匹配，为运营商提供增量订单。

> 🔗 在线演示：**[patricktiu1205.github.io/coride-demo](https://patricktiu1205.github.io/coride-demo/)**

---

## 📂 Demo 清单

| # | Demo | 说明 | 技术亮点 |
|---|------|------|----------|
| 1 | 📱 **ClientGui** | 用户手机 App | 瘦客户端·蓝牙握手·6步流程 |
| 2 | 🚗 **InCarGui** | 车内交互界面 | 8阶段完整旅程·BLE握手·YOLO视觉·CAN双通道·预点单·数据擦除 |
| 3 | 🏛 **PlatformAdmin** | CoRide 运营后台 | KPI看板·订单流·评分·6个二级详情页 |
| 4 | 🤖 **OperatorAdmin** | 运营商后台 v2.0 | 登录页·侧边栏导航·7模块(仪表盘/车辆/订单/用户/客服/分析/设置)·详情弹窗 |
| 5 | 🏗 **SystemArch** | 系统架构全景图 | 四层架构·三色数据流·财务模型·6个二级详情页 |

---

## 🏗 系统架构

```
📱 用户手机 (瘦客户端)
  ↓ 🔵 蓝牙 5.0 — 偏好包加密传输
🚗 Jetson Orin Nano (车端)
  · SLM推理 (7B Q4) · 视觉感知 (YOLOv8) · CAN信号
  ↓ 🟢 5G — 行程日志脱敏上传
☁️ CoRide 云端
  · 用户偏好 (Qdrant) · 聚合匹配引擎 · LLM兜底
  ↓ 🟠 RESTful API — 叫车/派单
🏢 Robotaxi 运营商
  小马智行 · 文远知行 · 滴滴 · 哈啰
```

### 三色数据流
- 🔵 **语音流**：SenseVoice → SLM → CosyVoice → A2DP，全程本地
- 🟢 **视觉流**：摄像头 → YOLOv8 → Jetson 本地，图像不出车
- 🟠 **控制流**：CAN 只读驾驶信号 + 读写舒适/IVI，物理隔离

---

## 📊 关键指标

| 指标 | 数值 |
|------|------|
| 单车年营收 | ¥33,176 |
| 毛利率 | 75.6% |
| 回本周期 | 7.1 月 |
| 首年目标 | 500 台 |
| 运营商订单增幅 | +206%（45→138单/天） |

