import express from 'express'
import Config from '../models/Config.js'

const router = express.Router()

// 获取配置
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne({ userId: 'default' })
    
    if (!config) {
      // 创建默认配置
      const defaultConfig = new Config({ userId: 'default' })
      await defaultConfig.save()
      return res.json(defaultConfig)
    }
    
    res.json(config)
  } catch (error) {
    res.status(500).json({ message: '获取配置失败', error: error.message })
  }
})

// 更新配置
router.put('/', async (req, res) => {
  try {
    const config = await Config.findOneAndUpdate(
      { userId: 'default' },
      req.body,
      { new: true, upsert: true, runValidators: true }
    )
    
    res.json(config)
  } catch (error) {
    res.status(400).json({ message: '更新配置失败', error: error.message })
  }
})

// 更新当前金价
router.put('/current-price', async (req, res) => {
  try {
    const { price } = req.body
    
    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({ message: '价格必须是有效的正数' })
    }
    
    const config = await Config.findOneAndUpdate(
      { userId: 'default' },
      { currentGoldPrice: price },
      { new: true, upsert: true }
    )
    
    res.json({ message: '当前金价已更新', currentGoldPrice: config.currentGoldPrice })
  } catch (error) {
    res.status(400).json({ message: '更新金价失败', error: error.message })
  }
})

// 更新总资金
router.put('/total-funds', async (req, res) => {
  try {
    const { totalFunds } = req.body
    
    if (totalFunds === undefined || isNaN(totalFunds) || totalFunds < 0) {
      return res.status(400).json({ message: '总资金必须是有效的非负数' })
    }
    
    const config = await Config.findOneAndUpdate(
      { userId: 'default' },
      { totalFunds },
      { new: true, upsert: true }
    )
    
    res.json({ message: '总资金已更新', totalFunds: config.totalFunds })
  } catch (error) {
    res.status(400).json({ message: '更新总资金失败', error: error.message })
  }
})

// 更新目标价格
router.put('/target-price', async (req, res) => {
  try {
    const { targetPrice } = req.body
    
    if (targetPrice !== undefined && (isNaN(targetPrice) || targetPrice < 0)) {
      return res.status(400).json({ message: '目标价格必须是有效的非负数' })
    }
    
    const config = await Config.findOneAndUpdate(
      { userId: 'default' },
      { targetPrice: targetPrice || 0 },
      { new: true, upsert: true }
    )
    
    res.json({ message: '目标价格已更新', targetPrice: config.targetPrice })
  } catch (error) {
    res.status(400).json({ message: '更新目标价格失败', error: error.message })
  }
})

// 更新自动更新设置
router.put('/auto-update', async (req, res) => {
  try {
    const { autoUpdateEnabled, updateInterval } = req.body
    
    const updateData = {}
    
    if (autoUpdateEnabled !== undefined) {
      updateData.autoUpdateEnabled = Boolean(autoUpdateEnabled)
    }
    
    if (updateInterval !== undefined) {
      if (isNaN(updateInterval) || updateInterval < 5 || updateInterval > 60) {
        return res.status(400).json({ message: '更新间隔必须在5-60秒之间' })
      }
      updateData.updateInterval = updateInterval
    }
    
    const config = await Config.findOneAndUpdate(
      { userId: 'default' },
      updateData,
      { new: true, upsert: true }
    )
    
    res.json({ 
      message: '自动更新设置已更新', 
      autoUpdateEnabled: config.autoUpdateEnabled,
      updateInterval: config.updateInterval
    })
  } catch (error) {
    res.status(400).json({ message: '更新自动更新设置失败', error: error.message })
  }
})

// 重置配置为默认值
router.post('/reset', async (req, res) => {
  try {
    await Config.deleteOne({ userId: 'default' })
    const defaultConfig = new Config({ userId: 'default' })
    await defaultConfig.save()
    
    res.json({ message: '配置已重置为默认值', config: defaultConfig })
  } catch (error) {
    res.status(500).json({ message: '重置配置失败', error: error.message })
  }
})

export default router