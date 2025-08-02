import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb+srv://mogocode:<db_password>@cluster0.swc6y1f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    
    // 在生产环境中，确保从环境变量获取密码
    const mongoUri = uri.replace('<db_password>', process.env.DB_PASSWORD || 'your_password_here')
    
    const conn = await mongoose.connect(mongoUri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    })

    console.log(`✅ MongoDB连接成功: ${conn.connection.host}`)
    
    // 发送ping以确认连接
    await mongoose.connection.db.admin().command({ ping: 1 })
    console.log("📡 Pinged your deployment. You successfully connected to MongoDB!")
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error.message)
    process.exit(1)
  }
}

export default connectDB