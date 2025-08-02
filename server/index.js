import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import connectDB from './config/database.js'
import transactionRoutes from './routes/transactions.js'
import priceRoutes from './routes/prices.js'
import configRoutes from './routes/config.js'

// 加载环境变量
dotenv.config()

// 连接数据库
connectDB()

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(helmet())
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 路由
app.use('/api/transactions', transactionRoutes)
app.use('/api/prices', priceRoutes)
app.use('/api/config', configRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ message: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`)
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`)
})