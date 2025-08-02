import React from 'react'
import { useTransactions } from '../contexts/TransactionContext'
import { calculateCurrentBankAvgPrice, getBankPrice } from '../utils/calculations'

export default function BankSummaryTable() {
  const { state } = useTransactions()
  const { transactions, bankPrices } = state

  // 计算各银行数据
  const calculateBankData = () => {
    const banks = ['民生银行', '民生银行(JD)', '浙商银行(JD)']
    const bankData = {}
    
    // 初始化银行数据
    banks.forEach(bank => {
      bankData[bank] = {
        weight: 0,
        totalCost: 0,       // 总成本（买入成本-卖出净收入）
        avgPrice: 0,        // 成本均价
        breakEvenPrice: 0,
        grossValue: 0,      // 总价值
        sellFee: 0,         // 手续费
        netValue: 0,        // 净价值
        profitLoss: 0,      // 未实现盈亏
        historicalProfitLoss: 0  // 历史盈亏
      }
    })

    // 计算各银行数据
    transactions.forEach(t => {
      if (bankData[t.bank]) {
        bankData[t.bank].weight += t.weight
        if (t.type === 'buy') {
          // 买入增加总成本
          bankData[t.bank].totalCost += t.amount
        } else if (t.type === 'sell') {
          // 卖出减少总成本（减去净收入：卖出金额-手续费）
          const sellNetIncome = Math.abs(t.amount) - t.fee
          bankData[t.bank].totalCost -= sellNetIncome
          
          // 累计历史盈亏
          if (t.realizedProfitLoss !== undefined) {
            bankData[t.bank].historicalProfitLoss += t.realizedProfitLoss
          } else {
            // 兼容旧数据：简单计算
            bankData[t.bank].historicalProfitLoss += sellNetIncome
          }
        }
      }
    })

    // 计算均价和保本均价
    Object.keys(bankData).forEach(bank => {
      const data = bankData[bank]
      if (data.weight > 0) {
        // 均价 = 总成本 / 当前持仓克数
        data.avgPrice = data.totalCost / data.weight
        
        // 不同银行的保本均价
        if (bank === '民生银行') {
          data.breakEvenPrice = data.avgPrice + 3 // 3元每克
        } else if (bank.includes('(JD)')) {
          data.breakEvenPrice = data.avgPrice / (1 - 0.004) // 千分之四手续费
        }
        
        // 使用对应银行的价格计算总价值
        const bankPrice = getBankPrice(bank, bankPrices, state.currentGoldPrice)
        data.grossValue = data.weight * bankPrice
        
        // 计算该银行的卖出手续费
        if (bank === '民生银行') {
          data.sellFee = data.weight * 3 // 3元每克
        } else if (bank.includes('(JD)')) {
          data.sellFee = data.grossValue * 0.004 // 千分之四
        } else {
          data.sellFee = 0
        }
        
        // 净价值 = 总价值 - 手续费
        data.netValue = data.grossValue - data.sellFee
        
        // 盈亏 = 净价值 - 总成本
        data.profitLoss = data.netValue - data.totalCost
      }
    })

    return bankData
  }

  const bankData = calculateBankData()
  
  // 检查是否有任何交易数据（包括历史）
  const hasAnyData = Object.values(bankData).some(data => data.weight !== 0 || data.historicalProfitLoss !== 0)

  if (!hasAnyData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-5 text-dark">分银行持仓详情</h2>
        <div className="text-center py-12 text-gray-300">
          <p className="italic">暂无交易记录，请先添加交易</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
      <h2 className="text-xl font-semibold mb-5 text-dark">分银行持仓详情</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-dark">银行</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">持仓克数</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">总成本</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">成本均价</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">当前价格</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">保本均价</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">总价值</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">手续费</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">净价值</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">未实现盈亏</th>
              <th className="text-left py-3 px-2 font-semibold text-dark">历史盈亏</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(bankData).map(bank => {
              const data = bankData[bank]
              
              // 只显示有持仓或有历史盈亏的银行
              if (data.weight === 0 && data.historicalProfitLoss === 0) {
                return null
              }

              const bankPrice = getBankPrice(bank, bankPrices, state.currentGoldPrice)
              const lastUpdate = bankPrices[bank]?.lastUpdate || ''
              const priceStyle = lastUpdate ? 'text-green-600 font-semibold' : 'text-gray-300'
              
              return (
                <tr key={bank} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium">{bank}</td>
                  
                  {data.weight > 0 ? (
                    <>
                      <td className="py-3 px-2">{parseFloat(data.weight.toFixed(4))}</td>
                      <td className="py-3 px-2 font-semibold text-primary">{parseFloat(data.totalCost.toFixed(4))}</td>
                      <td className="py-3 px-2">{parseFloat(data.avgPrice.toFixed(4))}</td>
                      <td className={`py-3 px-2 ${priceStyle}`}>
                        <div>{parseFloat(bankPrice.toFixed(4))}</div>
                        <div className="text-xs text-gray-300">
                          {lastUpdate ? lastUpdate.slice(-8) : '未更新'}
                        </div>
                      </td>
                      <td className="py-3 px-2">{parseFloat(data.breakEvenPrice.toFixed(4))}</td>
                      <td className="py-3 px-2">{parseFloat(data.grossValue.toFixed(4))}</td>
                      <td className="py-3 px-2 text-red-500">{parseFloat(data.sellFee.toFixed(4))}</td>
                      <td className="py-3 px-2 font-semibold">{parseFloat(data.netValue.toFixed(4))}</td>
                      <td className={`py-3 px-2 ${data.profitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {parseFloat(data.profitLoss.toFixed(4))}
                      </td>
                      <td className={`py-3 px-2 font-semibold ${data.historicalProfitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {parseFloat(data.historicalProfitLoss.toFixed(4))}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className="py-3 px-2 text-gray-300">-</td>
                      <td className="py-3 px-2 text-gray-300">-</td>
                      <td className="py-3 px-2 text-gray-300">-</td>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className="py-3 px-2 text-gray-300">0</td>
                      <td className={`py-3 px-2 font-semibold ${data.historicalProfitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {parseFloat(data.historicalProfitLoss.toFixed(4))}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-gray-300 sm:hidden">
        ← 滑动查看更多 →
      </div>
    </div>
  )
}