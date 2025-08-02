import express from 'express'
import Transaction from '../models/Transaction.js'

const router = express.Router()

// 获取所有交易记录
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 })
    res.json(transactions)
  } catch (error) {
    res.status(500).json({ message: '获取交易记录失败', error: error.message })
  }
})

// 创建新交易记录
router.post('/', async (req, res) => {
  try {
    const transaction = new Transaction(req.body)
    await transaction.save()
    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ message: '创建交易记录失败', error: error.message })
  }
})

// 更新交易记录
router.put('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    
    if (!transaction) {
      return res.status(404).json({ message: '交易记录不存在' })
    }
    
    res.json(transaction)
  } catch (error) {
    res.status(400).json({ message: '更新交易记录失败', error: error.message })
  }
})

// 删除交易记录
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ message: '交易记录不存在' })
    }
    
    res.json({ message: '交易记录已删除' })
  } catch (error) {
    res.status(500).json({ message: '删除交易记录失败', error: error.message })
  }
})

// 批量导入交易记录
router.post('/import', async (req, res) => {
  try {
    const { transactions } = req.body
    
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: '交易数据格式错误' })
    }
    
    // 清空现有数据（可选）
    if (req.body.clearExisting) {
      await Transaction.deleteMany({})
    }
    
    const result = await Transaction.insertMany(transactions)
    
    res.json({ 
      message: `成功导入 ${result.length} 条交易记录`,
      count: result.length
    })
  } catch (error) {
    res.status(400).json({ message: '导入交易记录失败', error: error.message })
  }
})

// 导出交易记录
router.get('/export', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 })
    
    // 设置下载headers
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.json')
    
    res.json({
      exportDate: new Date().toISOString(),
      count: transactions.length,
      transactions
    })
  } catch (error) {
    res.status(500).json({ message: '导出交易记录失败', error: error.message })
  }
})

// 获取统计数据
router.get('/statistics', async (req, res) => {
  try {
    const totalTransactions = await Transaction.countDocuments()
    const buyTransactions = await Transaction.countDocuments({ type: 'buy' })
    const sellTransactions = await Transaction.countDocuments({ type: 'sell' })
    
    // 按银行统计
    const bankStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$bank',
          totalWeight: { $sum: '$weight' },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ])
    
    // 最近交易
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
    
    res.json({
      total: totalTransactions,
      buy: buyTransactions,
      sell: sellTransactions,
      bankStats,
      recentTransactions
    })
  } catch (error) {
    res.status(500).json({ message: '获取统计数据失败', error: error.message })
  }
})

export default router