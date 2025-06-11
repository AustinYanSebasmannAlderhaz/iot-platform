// tcp_server.js

const net = require('net');
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Telegram config
const BOT_TOKEN = '7505999019:AAEMgXCZz5ElQGMVh90BTroLefd4ScSywSo';
const CHAT_ID = '7856542833';

// 警報冷卻時間（秒）
const ALERT_COOLDOWN_SECONDS = 5;
let lastAlertTime = 0;

async function sendTelegramAlert(message) {
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
    });
  } catch (err) {
    console.error('[TELEGRAM ERROR]', err.message);
  }
}


// ✅ Sequelize 要先宣告！
// PostgreSQL Sequelize Init
const sequelize = new Sequelize('tsdb', 'postgres', 'fps114514YAN', {
  host: '127.0.0.1',
  dialect: 'postgres',
  logging: false,
});

// ✅ 再來匯入模型
// 匯入模型 (絕對路徑)
const temp_humi_record = require('/home/austin/models/temp_humi_record')(sequelize, DataTypes);
const alert_record = require('/home/austin/IOT_Sensor/auth-api/models/alert_record')(sequelize, DataTypes);


// Timestamp 用於 Console log
function getTimestamp() {
  return new Date().toTimeString().split(' ')[0];
}

// TCP Server 初始化
const HOST = '172.20.10.6';
const PORT = 4000;

const server = net.createServer((socket) => {
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[CONNECT] Client connected: ${clientAddress}`);

  socket.on('data', async (data) => {
    const raw = data.toString().trim();
    if (raw.length === 0) return;

    const ts = getTimestamp();
    const cleaned = raw.replace(/^\[\d{2}:\d{2}:\d{2}\]\s*/, '');
    console.log(`[${ts}] [RECEIVED] From ${clientAddress}: ${cleaned}`);

    // 解析溫度與濕度 (格式為: Temp:27.08 Humidity:64.89)
    const tempMatch = cleaned.match(/Temp:([\d.]+)/);
    const humiMatch = cleaned.match(/Humidity:([\d.]+)/);

    if (tempMatch && humiMatch) {
      const temperature = parseFloat(tempMatch[1]);
      const humidity = parseFloat(humiMatch[1]);

      try {
        await sequelize.authenticate();
        await temp_humi_record.create({ temperature, humidity });
        console.log(`[DB] Saved: Temp=${temperature}, Humidity=${humidity}`);

        const now = Date.now();
        const secondsSinceLastAlert = (now - lastAlertTime) / 1000;

        if ((temperature > 38 || humidity < 52) && secondsSinceLastAlert >= ALERT_COOLDOWN_SECONDS) {
          //await sendTelegramAlert(`🚨 異常警報：溫度=${temperature}°C 濕度=${humidity}%`);
          const alertMsg = `🚨 異常警報：溫度=${temperature}°C 濕度=${humidity}%`;
          await sendTelegramAlert(alertMsg);
          await alert_record.create({ message: alertMsg});

          lastAlertTime = now;
          console.log(`[ALERT] 發送警報並寫入資料表`);
        }
      } catch (err) {
        console.error(`[DB ERROR] Failed to insert data:`, err.message);
      }
    } else {
      console.warn(`[WARN] Invalid data format received.`);
    }

    socket.write(`Server received\n`);
  });

  socket.on('end', () => {
    console.log(`[DISCONNECT] Client disconnected: ${clientAddress}`);
  });

  socket.on('error', (err) => {
    console.error(`[ERROR] ${clientAddress}:`, err.message);
  });
});

server.on('error', (err) => {
  console.error('[SERVER ERROR]:', err);
});

server.listen(PORT, HOST, () => {
  console.log(`[START] TCP Server listening on ${HOST}:${PORT}`);
});

