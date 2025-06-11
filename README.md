# IoT 資料平台：前後端與 UI 整合實作

本專案整合 AMB82 Edge 裝置、SHT40 感測器、Raspberry Pi TCP Server、PostgreSQL 資料庫，以及 Grafana 與 Bootstrap 前端，完成一套 IoT 溫溼度監控平台。

---

## 📦 專案功能

- 📡 SHT40 感測器讀取溫度與濕度資料
- 🌐 AMB82 WiFi TCP Client 傳送至 Raspberry Pi
- 🗄️ TCP Server 儲存資料至 PostgreSQL TimescaleDB
- 📈 Grafana 雙折線圖視覺化
- 🔐 註冊/登入系統與資料權限保護
- 🚨 Telegram Bot 發送異常警報並儲存紀錄

---

## 🖥️ 系統架構圖

## 🖥️ 系統架構圖

```txt
[SHT40 Sensor] --(I2C)--> [AMB82 MCU] --(TCP/WiFi)--> [Raspberry Pi Server] --(Sequelize ORM)--> [PostgreSQL Database]
                                                                                                           │
                                                                                                           ▼
                              ┌──────────────────────┬───────────────────────┬
                              │                      │                       │                     
                              ▼                      ▼                       ▼                   
                       [Grafana Dashboard]   [Web Dashboard (Bootstrap)]   [Telegram Bot]

```


## ⚙️ 系統需求

- AMB82 Mini Board
- Raspberry Pi 4
- PostgreSQL 14+ (TimescaleDB 插件可選)
- Node.js 18+
- Grafana 10+
- Bootstrap 5
