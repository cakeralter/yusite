import express from 'express'
import fetch from 'node-fetch'
import Config from '../models/Config.js'

const router = express.Router()

// 获取所有银行价格
router.get('/', async (req, res) => {
  try {
    const config = await Config.findOne({ userId: 'default' }) || new Config()
    res.json({
      bankPrices: config.bankPrices,
      currentGoldPrice: config.currentGoldPrice,
      lastUpdateTime: config.lastUpdateTime
    })
  } catch (error) {
    res.status(500).json({ message: '获取价格失败', error: error.message })
  }
})

// 更新单个银行价格
router.put('/:bank', async (req, res) => {
  try {
    const { bank } = req.params
    const { price, lastUpdate } = req.body
    
    const config = await Config.findOne({ userId: 'default' }) || new Config()
    
    if (!config.bankPrices) {
      config.bankPrices = new Map()
    }
    
    config.bankPrices.set(bank, { price, lastUpdate })
    
    await config.save()
    
    res.json({ message: `${bank}价格已更新`, price, lastUpdate })
  } catch (error) {
    res.status(500).json({ message: '更新价格失败', error: error.message })
  }
})

// 自动获取所有银行价格
router.post('/fetch-all', async (req, res) => {
  try {
    const config = await Config.findOne({ userId: 'default' }) || new Config()
    const banks = ['民生银行', '民生银行(JD)', '浙商银行(JD)']
    const results = []
    
    for (const bank of banks) {
      try {
        const price = await fetchBankPrice(bank)
        if (price) {
          const currentTime = new Date().toLocaleString()
          config.bankPrices.set(bank, { price, lastUpdate: currentTime })
          results.push({ bank, price, success: true, lastUpdate: currentTime })
        } else {
          results.push({ bank, success: false, error: '获取价格失败' })
        }
      } catch (error) {
        results.push({ bank, success: false, error: error.message })
      }
    }
    
    config.lastUpdateTime = new Date().toLocaleString()
    await config.save()
    
    const successCount = results.filter(r => r.success).length
    
    res.json({
      message: `价格更新完成，成功 ${successCount}/${banks.length} 个银行`,
      results,
      lastUpdateTime: config.lastUpdateTime
    })
  } catch (error) {
    res.status(500).json({ message: '批量获取价格失败', error: error.message })
  }
})

// 获取单个银行的实时价格
router.get('/fetch/:bank', async (req, res) => {
  try {
    const { bank } = req.params
    const price = await fetchBankPrice(bank)
    
    if (price) {
      // 更新数据库
      const config = await Config.findOne({ userId: 'default' }) || new Config()
      const currentTime = new Date().toLocaleString()
      config.bankPrices.set(bank, { price, lastUpdate: currentTime })
      await config.save()
      
      res.json({ bank, price, lastUpdate: currentTime })
    } else {
      res.status(400).json({ message: '获取价格失败' })
    }
  } catch (error) {
    res.status(500).json({ message: '获取价格失败', error: error.message })
  }
})

// 私有函数：获取银行价格
async function fetchBankPrice(bank) {
  try {
    let apiUrl
    let isMinsheng = false

    if (bank === '民生银行' || bank === '民生银行(JD)') {
      apiUrl = 'https://ms.jr.jd.com/gw2/generic/CreatorSer/newh5/m/getFirstRelatedProductInfo?reqData=%7B%22circleId%22%3A%2213245%22%2C%22invokeSource%22%3A5%2C%22productId%22%3A%2221001001000001%22%7D'
      isMinsheng = true
    } else if (bank === '浙商银行(JD)') {
      apiUrl = 'https://api.jdjygold.com/gw2/generic/produTools/h5/m/getGoldPrice?goldCode=CZB-JCJ'
      isMinsheng = false
    } else {
      throw new Error(`不支持的银行类型: ${bank}`)
    }

    // 直接请求API
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'nonceStr': Date.now().toString()
      },
      timeout: 10000
    })

    if (response.ok) {
      const data = await response.json()
      
      let price
      if (isMinsheng) {
        price = parseFloat(data.resultData?.data?.minimumPriceValue)
      } else {
        price = parseFloat(data.resultData?.data?.lastPrice)
      }

      if (price && !isNaN(price) && price > 0) {
        return price
      }
    }
    
    throw new Error('价格数据无效')
  } catch (error) {
    console.error(`获取${bank}价格失败:`, error)
    return null
  }
}

export default router