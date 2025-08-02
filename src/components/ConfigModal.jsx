import React, { useState, useEffect, useRef } from 'react'
import { X, RefreshCw } from 'lucide-react'
import { useTransactions } from '../contexts/TransactionContext'
import { getActiveBanks, getBankPrice } from '../utils/calculations'

export default function ConfigModal({ isOpen, onClose }) {
  const { state, actions } = useTransactions()
  const [localConfig, setLocalConfig] = useState({
    currentGoldPrice: 520,
    totalFunds: 0,
    targetPrice: 0,
    autoUpdateEnabled: true,
    updateInterval: 10
  })
  
  const updateTimerRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setLocalConfig({
        currentGoldPrice: state.currentGoldPrice,
        totalFunds: state.totalFunds,
        targetPrice: state.targetPrice,
        autoUpdateEnabled: state.autoUpdateEnabled,
        updateInterval: state.updateInterval
      })
    }
  }, [isOpen, state])

  // 自动更新价格
  useEffect(() => {
    if (localConfig.autoUpdateEnabled && isOpen) {
      startAutoUpdate()
    } else {
      stopAutoUpdate()
    }
    
    return () => stopAutoUpdate()
  }, [localConfig.autoUpdateEnabled, localConfig.updateInterval, isOpen])

  const startAutoUpdate = () => {
    stopAutoUpdate()
    fetchAllBankPrices()
    updateTimerRef.current = setInterval(() => {
      fetchAllBankPrices()
    }, localConfig.updateInterval * 1000)
  }

  const stopAutoUpdate = () => {
    if (updateTimerRef.current) {
      clearInterval(updateTimerRef.current)
      updateTimerRef.current = null
    }
  }

  const fetchAllBankPrices = async () => {
    const activeBanks = getActiveBanks(state.transactions)
    let successCount = 0
    
    for (const bank of activeBanks) {
      try {
        const price = await fetchBankPrice(bank)
        if (price) {
          const currentTime = new Date().toLocaleString()
          actions.updateBankPrice(bank, { price, lastUpdate: currentTime })
          successCount++
        }
      } catch (error) {
        console.error(`获取${bank}价格失败:`, error)
      }
    }
    
    if (successCount > 0) {
      actions.setLastUpdateTime(new Date().toLocaleString())
    }
  }

  const fetchBankPrice = async (bank) => {
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

      // 使用代理服务
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`
      const response = await fetch(proxyUrl)
      
      if (response.ok) {
        const proxyData = await response.json()
        const data = JSON.parse(proxyData.contents)
        
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

  const handleConfigChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }))
  }

  const updateCurrentPrice = () => {
    actions.updateCurrentPrice(localConfig.currentGoldPrice)
    alert('金价已更新')
  }

  const updateTotalFunds = () => {
    actions.updateTotalFunds(localConfig.totalFunds)
    alert('总资金已更新')
  }

  const updateTargetPrice = () => {
    actions.updateTargetPrice(localConfig.targetPrice)
    alert('目标价格已更新')
  }

  const updateAutoSettings = () => {
    actions.updateAutoSettings(localConfig.autoUpdateEnabled, localConfig.updateInterval)
  }

  const getActiveBankCards = () => {
    const activeBanks = getActiveBanks(state.transactions)
    
    return activeBanks.map(bank => {
      const bankPrice = getBankPrice(bank, state.bankPrices, state.currentGoldPrice)
      const lastUpdate = state.bankPrices[bank]?.lastUpdate || ''
      
      return (
        <div key={bank} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-500 mb-1">{bank}</div>
          <div className="text-lg font-semibold text-dark">¥{parseFloat(bankPrice.toFixed(2))}/克</div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${lastUpdate ? 'bg-green-500 pulse' : 'bg-gray-300'}`}></div>
            <span className="text-xs text-gray-300">
              {lastUpdate ? lastUpdate.slice(-8) : '未更新'}
            </span>
          </div>
        </div>
      )
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-slide-in">
        {/* 标题 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-dark">系统配置</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        <div className="space-y-6">
          {/* 自动更新设置 */}
          <div>
            <h4 className="text-lg font-semibold text-dark mb-4 pb-2 border-b border-gray-100">
              🔄 自动更新设置
            </h4>
            
            {/* 主开关 */}
            <div className="flex items-center justify-between mb-4 p-3">
              <span className="text-base font-medium text-dark">启用自动更新</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={localConfig.autoUpdateEnabled}
                  onChange={(e) => {
                    handleConfigChange('autoUpdateEnabled', e.target.checked)
                    setTimeout(updateAutoSettings, 100)
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* 银行价格展示 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {getActiveBankCards()}
            </div>

            {/* 更新间隔设置 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                更新间隔: {localConfig.updateInterval}秒
              </label>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={localConfig.updateInterval}
                onChange={(e) => {
                  handleConfigChange('updateInterval', parseInt(e.target.value))
                  setTimeout(updateAutoSettings, 100)
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>5秒</span>
                <span>60秒</span>
              </div>
            </div>

            {/* 快速操作 */}
            <div className="flex gap-3">
              <button
                onClick={fetchAllBankPrices}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                立即更新
              </button>
              <button
                onClick={updateCurrentPrice}
                className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                手动设置
              </button>
            </div>

            {state.lastUpdateTime && (
              <div className="text-xs text-gray-300 text-center mt-2">
                最后更新: {state.lastUpdateTime}
              </div>
            )}
          </div>

          {/* 手动金价设置 */}
          <div>
            <h4 className="text-lg font-semibold text-dark mb-4 pb-2 border-b border-gray-100">
              💰 手动金价设置
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  当前金价 (元/克)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localConfig.currentGoldPrice}
                  onChange={(e) => handleConfigChange('currentGoldPrice', parseFloat(e.target.value) || 0)}
                  placeholder="520.00"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={updateCurrentPrice}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                应用价格
              </button>
            </div>
          </div>

          {/* 总资金配置 */}
          <div>
            <h4 className="text-lg font-semibold text-dark mb-4 pb-2 border-b border-gray-100">
              💼 总资金配置
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  总资金 (元)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localConfig.totalFunds}
                  onChange={(e) => handleConfigChange('totalFunds', parseFloat(e.target.value) || 0)}
                  placeholder="包含线下等其他投资资金"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={updateTotalFunds}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                更新总资金
              </button>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="font-medium text-dark mb-1">资金配置说明：</div>
                <div className="text-gray-300">
                  设置总资金：{localConfig.totalFunds.toFixed(2)}元 | 
                  已记录投入：{state.transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}元
                </div>
                <div className="text-xs text-gray-300 mt-2">
                  * 总资金包含所有黄金投资（线上记录 + 线下投资）<br/>
                  * 用于更准确计算整体投资收益情况
                </div>
              </div>
            </div>
          </div>

          {/* 投资目标设置 */}
          <div>
            <h4 className="text-lg font-semibold text-dark mb-4 pb-2 border-b border-gray-100">
              🎯 投资目标设置
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  目标价格 (元/克)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localConfig.targetPrice}
                  onChange={(e) => handleConfigChange('targetPrice', parseFloat(e.target.value) || 0)}
                  placeholder="设置您的盈利目标价格"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={updateTargetPrice}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                设置目标
              </button>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="font-medium text-dark mb-1">目标设置说明：</div>
                <div className="text-xs text-gray-300">
                  * 设置目标价格后可查看距离目标的进度<br/>
                  * 系统将根据目标计算建议操作策略
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}