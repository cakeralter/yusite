import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useTransactions } from '../contexts/TransactionContext'
import { calculateFee, calculateBankAvgPrice } from '../utils/calculations'

export default function AddRecordModal({ isOpen, onClose }) {
  const { state, actions } = useTransactions()
  const [formData, setFormData] = useState({
    type: 'buy',
    bank: '民生银行',
    inputMode: 'byWeight',
    weight: '',
    amount: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  })
  
  const [bankInfo, setBankInfo] = useState('')
  const [expectedProfit, setExpectedProfit] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // 重置表单
      setFormData({
        type: 'buy',
        bank: '民生银行',
        inputMode: 'byWeight',
        weight: '',
        amount: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      })
      setBankInfo('')
      setExpectedProfit('')
    }
  }, [isOpen])

  useEffect(() => {
    updateBankInfo()
    calculateExpectedProfit()
  }, [formData.type, formData.bank, formData.weight, formData.price, state.transactions])

  const updateBankInfo = () => {
    if (formData.type === 'sell') {
      const avgPrice = calculateBankAvgPrice(formData.bank, state.transactions)
      const bankWeight = state.transactions
        .filter(t => t.bank === formData.bank)
        .reduce((sum, t) => sum + t.weight, 0)
      
      if (avgPrice > 0 && bankWeight > 0) {
        setBankInfo(
          `${formData.bank} 持仓信息：当前持仓 ${parseFloat(bankWeight.toFixed(4))}克，买入均价 ${parseFloat(avgPrice.toFixed(4))}元/克`
        )
      } else {
        setBankInfo(`注意: ${formData.bank} 暂无持仓或买入记录`)
      }
    } else {
      setBankInfo('')
    }
  }

  const calculateExpectedProfit = () => {
    if (formData.type === 'sell' && formData.weight && formData.price) {
      const weight = parseFloat(formData.weight)
      const price = parseFloat(formData.price)
      
      if (weight > 0 && price > 0) {
        const avgPrice = calculateBankAvgPrice(formData.bank, state.transactions)
        const currentWeight = state.transactions
          .filter(t => t.bank === formData.bank)
          .reduce((sum, t) => sum + t.weight, 0)
        
        if (avgPrice > 0 && currentWeight >= weight) {
          const amount = weight * price
          const fee = calculateFee('sell', formData.bank, weight, amount)
          const profit = (price - avgPrice) * weight - fee
          const profitRate = ((price - avgPrice) / avgPrice * 100)
          
          setExpectedProfit(
            `预期${profit >= 0 ? '盈利' : '亏损'}: ${Math.abs(profit).toFixed(4)}元 (${profitRate.toFixed(2)}%)`
          )
        } else if (currentWeight < weight) {
          setExpectedProfit(`⚠️ 卖出数量超过持仓 (当前持仓: ${currentWeight}克)`)
        } else {
          setExpectedProfit('⚠️ 该银行暂无持仓记录')
        }
      }
    } else {
      setExpectedProfit('')
    }
  }

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value }
    
    // 处理输入模式变化
    if (field === 'type' && value === 'sell') {
      newFormData.inputMode = 'byWeight'
    }
    
    // 处理数值计算
    if (field === 'weight' || field === 'price') {
      const weight = parseFloat(newFormData.weight || 0)
      const price = parseFloat(newFormData.price || 0)
      
      if (newFormData.inputMode === 'byWeight' && weight > 0 && price > 0) {
        newFormData.amount = (weight * price).toFixed(2)
      }
    }
    
    if (field === 'amount' || field === 'price') {
      const amount = parseFloat(newFormData.amount || 0)
      const price = parseFloat(newFormData.price || 0)
      
      if (newFormData.inputMode === 'byAmount' && amount > 0 && price > 0) {
        newFormData.weight = (amount / price).toFixed(4)
      }
    }
    
    setFormData(newFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const { type, bank, price, date } = formData
    let { weight, amount } = formData
    
    // 数据验证
    if (type === 'buy') {
      if (formData.inputMode === 'byWeight') {
        weight = parseFloat(weight)
        amount = parseFloat((weight * parseFloat(price)).toFixed(2))
      } else {
        amount = parseFloat(amount)
        weight = parseFloat((amount / parseFloat(price)).toFixed(4))
      }
    } else {
      weight = parseFloat(weight)
      amount = parseFloat((weight * parseFloat(price)).toFixed(2))
    }
    
    if (!weight || !parseFloat(price) || !date || (type === 'buy' && !amount)) {
      alert('请填写完整信息')
      return
    }
    
    const fee = calculateFee(type, bank, weight, amount)
    let realizedProfitLoss = 0
    
    // 如果是卖出，计算净盈亏
    if (type === 'sell') {
      const avgPrice = calculateBankAvgPrice(bank, state.transactions)
      realizedProfitLoss = (parseFloat(price) - avgPrice) * weight - fee
    }
    
    const transaction = {
      type,
      bank,
      weight: type === 'sell' ? -weight : weight,
      price: parseFloat(price),
      amount: type === 'sell' ? -amount : amount,
      fee,
      date,
      realizedProfitLoss
    }
    
    setLoading(true)
    try {
      await actions.addTransaction(transaction)
      onClose()
    } catch (error) {
      alert('添加记录失败：' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto modal-slide-in">
        {/* 标题 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-dark">添加交易记录</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} className="text-gray-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 交易类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">交易类型</label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="buy">买入</option>
              <option value="sell">卖出</option>
            </select>
          </div>

          {/* 银行 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">银行</label>
            <select
              value={formData.bank}
              onChange={(e) => handleInputChange('bank', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              disabled={loading}
            >
              <option value="民生银行">民生银行</option>
              <option value="民生银行(JD)">民生银行(JD)</option>
              <option value="浙商银行(JD)">浙商银行(JD)</option>
            </select>
          </div>

          {/* 录入方式 */}
          {formData.type === 'buy' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">录入方式</label>
              <select
                value={formData.inputMode}
                onChange={(e) => handleInputChange('inputMode', e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                disabled={loading}
              >
                <option value="byWeight">按克数</option>
                <option value="byAmount">按总价</option>
              </select>
            </div>
          )}

          {/* 克数/总价 */}
          {(formData.inputMode === 'byWeight' || formData.type === 'sell') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                克数 (最多4位小数)
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="10.0000"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                disabled={loading}
              />
            </div>
          )}

          {formData.inputMode === 'byAmount' && formData.type === 'buy' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                总价 (元，最多2位小数)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="1000.00"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                disabled={loading}
              />
            </div>
          )}

          {/* 单价 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              单价 (元/克，最多4位小数)
            </label>
            <input
              type="number"
              step="0.0001"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="520.0000"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              disabled={loading}
            />
          </div>

          {/* 交易日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">交易日期</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              disabled={loading}
            />
          </div>

          {/* 银行信息 */}
          {bankInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              {bankInfo}
            </div>
          )}

          {/* 预期盈亏 */}
          {expectedProfit && (
            <div className={`p-3 rounded-lg text-sm ${
              expectedProfit.includes('⚠️') 
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-gray-50 border border-gray-200 text-gray-800'
            }`}>
              {expectedProfit}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '添加中...' : '添加记录'}
          </button>
        </form>

        {/* 说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-dark mb-2">添加记录说明：</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div>* 选择正确的银行和交易类型</div>
            <div>* 重量精度：最多4位小数，金额精度：最多2位小数</div>
            <div>* 系统会自动计算手续费（民生银行：3元/克，JD平台：千分之四）</div>
            <div>* 卖出时会根据该银行的买入均价自动计算净盈亏</div>
            <div>* 添加后会自动更新所有统计数据</div>
          </div>
        </div>
      </div>
    </div>
  )
}