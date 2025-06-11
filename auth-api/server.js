// server.js
const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const HOST = '127.0.0.1';
const PORT = 4000;

// ✅ 設定 HTML 靜態網頁資料夾（你的 .html 檔）
app.use(express.static(path.join(__dirname, '../TempHumiWeb')));
app.use(express.json());

// ✅ PostgreSQL Sequelize 連線
const sequelize = new Sequelize('tsdb', 'postgres', 'fps114514YAN', {
  host: '127.0.0.1',
  dialect: 'postgres',
  logging: false,
});

// ✅ 定義 users 模型
const User = sequelize.define('users', {
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW,
  },
}, {
  timestamps: false,
  tableName: 'users',
});

// ✅ 匯入 alert_records 模型
const AlertRecord = require('./models/alert_record')(sequelize, DataTypes);

// ✅ API: 首頁
app.get('/', (req, res) => {
  res.send('API is working');
});

// ✅ API: 註冊
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hash });
    console.log(`[REGISTER] ${email} created`);
    res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('[ERROR]', err);
    res.status(400).json({ error: err.message });
  }
});

// ✅ API: 登入
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    console.log(`[LOGIN] ${email} success`);
    res.json({ message: 'Login successful', user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('[ERROR]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ API: 警報紀錄
app.get('/alerts', async (req, res) => {
  try {
    const alerts = await AlertRecord.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(alerts);
  } catch (err) {
    console.error('[ALERT API ERROR]', err.message);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});


// ✅ 啟動伺服器
async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // 若不存在自動建立資料表
    console.log('✅ Database connected and synced.');

    app.listen(PORT, HOST, () => {
      console.log(`🚀 Auth API running at http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
  }
}
startServer();
