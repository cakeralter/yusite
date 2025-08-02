import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['buy', 'sell']
  },
  bank: {
    type: String,
    required: true,
    enum: ['民生银行', '民生银行(JD)', '浙商银行(JD)']
  },
  weight: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  fee: {
    type: Number,
    default: 0
  },
  date: {
    type: String,
    required: true
  },
  realizedProfitLoss: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 添加索引
transactionSchema.index({ bank: 1, type: 1 })
transactionSchema.index({ date: -1 })
transactionSchema.index({ createdAt: -1 })

const Transaction = mongoose.model('Transaction', transactionSchema)

export default Transaction