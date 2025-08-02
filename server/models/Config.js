import mongoose from 'mongoose'

const configSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'default',
    unique: true
  },
  currentGoldPrice: {
    type: Number,
    default: 520
  },
  totalFunds: {
    type: Number,
    default: 0
  },
  targetPrice: {
    type: Number,
    default: 0
  },
  autoUpdateEnabled: {
    type: Boolean,
    default: true
  },
  updateInterval: {
    type: Number,
    default: 10,
    min: 5,
    max: 60
  },
  bankPrices: {
    type: Map,
    of: {
      price: Number,
      lastUpdate: String
    },
    default: {
      '民生银行': { price: 520, lastUpdate: '' },
      '民生银行(JD)': { price: 520, lastUpdate: '' },
      '浙商银行(JD)': { price: 520, lastUpdate: '' }
    }
  },
  lastUpdateTime: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

const Config = mongoose.model('Config', configSchema)

export default Config