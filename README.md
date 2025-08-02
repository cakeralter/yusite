# 积存金交易记录系统

一个现代化的黄金交易记录管理系统，使用React + Node.js + MongoDB构建。

## 功能特点

- ✨ 现代化的React界面，支持移动端
- 📊 详细的盈亏计算和统计分析
- 🏦 多银行支持（民生银行、浙商银行等）
- 💰 实时金价获取和自动更新
- 📱 响应式设计，移动端友好
- 🔄 在线/离线双模式运行
- 📈 可视化数据展示
- 💾 数据导入导出功能

## 技术栈

### 前端
- React 18
- Tailwind CSS
- Lucide React (图标)
- Vite (构建工具)

### 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- CORS, Helmet (安全中间件)

## 快速开始

### 环境要求
- Node.js 16+
- MongoDB 5.0+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd yusite
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
创建 `.env` 文件：
```env
# MongoDB配置
MONGODB_URI=mongodb+srv://mogocode:<db_password>@cluster0.swc6y1f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
DB_PASSWORD=your_mongodb_password_here

# 服务器配置
PORT=5000
NODE_ENV=development

# 前端URL（用于CORS）
FRONTEND_URL=http://localhost:3000
```

### 4. 启动开发服务器

#### 启动后端服务（终端1）
```bash
npm run server:dev
```

#### 启动前端开发服务器（终端2）
```bash
npm run dev
```

### 5. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:5000

## 项目结构

```
yusite/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── contexts/           # React Context
│   ├── services/           # API服务
│   ├── utils/              # 工具函数
│   └── main.jsx            # 入口文件
├── server/                 # 后端源码
│   ├── config/             # 配置文件
│   ├── models/             # 数据模型
│   ├── routes/             # API路由
│   └── index.js            # 服务器入口
├── package.json            # 项目配置
└── README.md               # 说明文档
```

## API 接口

### 交易记录 API
- `GET /api/transactions` - 获取所有交易记录
- `POST /api/transactions` - 创建交易记录
- `PUT /api/transactions/:id` - 更新交易记录
- `DELETE /api/transactions/:id` - 删除交易记录
- `POST /api/transactions/import` - 批量导入
- `GET /api/transactions/export` - 导出数据

### 价格 API
- `GET /api/prices` - 获取银行价格
- `POST /api/prices/fetch-all` - 获取所有银行实时价格
- `PUT /api/prices/:bank` - 更新银行价格

### 配置 API
- `GET /api/config` - 获取配置
- `PUT /api/config` - 更新配置
- `PUT /api/config/current-price` - 更新当前金价
- `PUT /api/config/total-funds` - 更新总资金

## 部署

### 生产环境构建
```bash
npm run build
```

### 启动生产服务器
```bash
npm run server
```

## 数据迁移

如果你有旧版本的本地存储数据，系统会自动检测并提供迁移选项。你也可以：

1. 使用导出功能备份现有数据
2. 在新系统中使用导入功能恢复数据

## 离线支持

系统支持离线模式运行：
- 当网络连接不可用时，自动切换到本地存储模式
- 数据会保存在浏览器的 localStorage 中
- 网络恢复后，可以手动同步数据到服务器

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License