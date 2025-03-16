// server.js
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('path'); // 导入 path 模块
const fs = require('fs').promises; // 导入 fs 模块的 Promise 版本

const app = express();
app.use(bodyParser.json());

// 配置密钥，建议在生产环境中通过环境变量设置
const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key';

// 连接到 MongoDB 数据库
mongoose.connect('mongodb://localhost:27017/yourdbname')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB 连接失败：", err));

// 定义管理员用户的 Schema 与 Model
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

// 如果数据库中不存在默认管理员，则创建一个
Admin.findOne({ username: 'admin' })
  .then(admin => {
    if (!admin) {
      const newAdmin = new Admin({
        username: 'admin',
        // 默认密码为 "123456"，请根据需要修改；使用 bcrypt 加密
        passwordHash: bcrypt.hashSync("123456", 10)
      });
      newAdmin.save()
        .then(() => console.log("默认管理员已创建：admin / 123456"))
        .catch(err => console.error("创建管理员失败：", err));
    }
  })
  .catch(err => console.error(err));

/**
 * POST /api/login
 * 接收用户名和密码，验证成功后返回 JWT 令牌
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // 从数据库中查找管理员用户
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ code: 401, msg: '用户名无效' });
    }
    // 验证密码
    if (!bcrypt.compareSync(password, admin.passwordHash)) {
      return res.status(401).json({ code: 401, msg: '密码错误' });
    }
    
    // 验证通过，生成 JWT 令牌，有效期 2 小时
    const token = jwt.sign({ username: admin.username }, SECRET_KEY, { expiresIn: '2h' });
    return res.json({ code: 200, token, username: admin.username, msg: '登录成功' });
  } catch (error) {
    console.error("登录接口错误：", error);
    return res.status(500).json({ code: 500, msg: '服务器错误' });
  }
});

/**
 * GET /api/protected
 * 示例受保护接口，要求在请求头中携带 token
 */
app.get('/api/protected', (req, res) => {
  // 获取 Authorization 头部，格式为 "Bearer <token>"
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ code: 401, msg: '未提供 token' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ code: 401, msg: '无效 token' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ code: 401, msg: 'token 验证失败' });
    }
    // token 有效，返回受保护数据
    res.json({ code: 200, msg: '访问受保护接口成功', data: decoded });
  });
});

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCT_DATA_PATH = path.join(DATA_DIR, 'productData.json');
const BANNER_DATA_PATH = path.join(DATA_DIR, 'bannerimages.json');

// 统一读取JSON文件的工具函数
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw new Error(`读取文件失败: ${filePath}`);
  }
}

// 统一写入JSON文件的工具函数
async function writeJsonFile(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error(`写入文件失败: ${filePath}`);
  }
}

// 获取所有产品
app.get('/api/products', async (req, res) => {
  try {
    const data = await readJsonFile(PRODUCT_DATA_PATH);
    res.json(data.products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加新产品
app.post('/api/products', async (req, res) => {
  try {
    const data = await readJsonFile(PRODUCT_DATA_PATH);
    const newProduct = { id: Date.now(), ...req.body };
    data.products.push(newProduct);
    await writeJsonFile(PRODUCT_DATA_PATH, data);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 修改产品
app.put('/api/products/:id', async (req, res) => {
  try {
    const data = await readJsonFile(PRODUCT_DATA_PATH);
    const index = data.products.findIndex(p => p.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: "产品不存在" });
    data.products[index] = { ...data.products[index], ...req.body };
    await writeJsonFile(PRODUCT_DATA_PATH, data);
    res.json(data.products[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除产品
app.delete('/api/products/:id', async (req, res) => {
  try {
    const data = await readJsonFile(PRODUCT_DATA_PATH);
    data.products = data.products.filter(p => p.id != req.params.id);
    await writeJsonFile(PRODUCT_DATA_PATH, data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取横幅图片
app.get('/api/banners', async (req, res) => {
  try {
    const data = await readJsonFile(BANNER_DATA_PATH);
    res.json(data.images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
