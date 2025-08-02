import React from 'react'
import { useTransactions } from '../contexts/TransactionContext'
import { calculateSummaryData, getBankPrice } from '../utils/calculations'

export default function SummaryGrid() {
  const { state } = useTransactions()
  const summary = calculateSummaryData(state)

  // 计算目标进度
  const calculateTargetProgress = () => {
    if (state.targetPrice > 0 && summary.weightedCurrentPrice > 0) {
      return ((summary.weightedCurrentPrice - summary.breakEvenPrice) / (state.targetPrice - summary.breakEvenPrice)) * 100
    }
    return 0
  }

  const targetProgress = calculateTargetProgress()
  const breakEvenDiff = summary.breakEvenPrice - summary.weightedCurrentPrice

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-8">
      {/* 总持仓 */}
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <h3 className="text-sm text-gray-300 mb-2 font-medium">总持仓</h3>
        <div className="text-2xl font-semibold text-dark">
          {parseFloat(summary.actualTotalWeight.toFixed(4))}
          <span className="text-sm text-gray-300 ml-1">克</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          均价: {parseFloat(summary.avgPrice.toFixed(4))}元/克
        </div>
      </div>

      {/* 保本线 */}
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <h3 className="text-sm text-gray-300 mb-2 font-medium">保本线</h3>
        <div className="text-2xl font-semibold text-dark">
          {parseFloat(summary.breakEvenPrice.toFixed(4))}
          <span className="text-sm text-gray-300 ml-1">元/克</span>
        </div>
        <div className={`text-xs mt-1 ${breakEvenDiff > 0 ? 'text-orange-500' : 'text-green-500'}`}>
          {breakEvenDiff > 0 
            ? `需上涨: ${parseFloat(breakEvenDiff.toFixed(4))}元/克`
            : `已超过: ${parseFloat(Math.abs(breakEvenDiff).toFixed(4))}元/克`
          }
        </div>
      </div>

      {/* 累计交易 */}
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <h3 className="text-sm text-gray-300 mb-2 font-medium">累计交易</h3>
        <div className="text-2xl font-semibold text-dark">
          {summary.totalTrades}
          <span className="text-sm text-gray-300 ml-1">笔</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          买入: {summary.buyTransactions} | 卖出: {summary.sellTransactions}
        </div>
      </div>

      {/* 已实现盈亏 */}
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <h3 className="text-sm text-gray-300 mb-2 font-medium">已实现盈亏</h3>
        <div className={`text-2xl font-semibold ${summary.realizedProfitLoss >= 0 ? 'text-red-500' : 'text-green-500'}`}>
          {parseFloat(summary.realizedProfitLoss.toFixed(4))}
          <span className="text-sm text-gray-300 ml-1">元</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          手续费: {parseFloat(summary.totalFeesAmount.toFixed(4))}元
        </div>
      </div>

      {/* 距离目标 */}
      <div className="bg-white rounded-xl p-5 shadow-sm text-center">
        <h3 className="text-sm text-gray-300 mb-2 font-medium">距离目标</h3>
        <div className="text-2xl font-semibold text-dark">
          {state.targetPrice > 0 ? `${parseFloat(targetProgress.toFixed(1))}` : '-'}
          <span className="text-sm text-gray-300 ml-1">%</span>
        </div>
        <div className="text-xs text-gray-300 mt-1">
          目标价: {state.targetPrice > 0 ? `${parseFloat(state.targetPrice.toFixed(4))}元/克` : '-'}
        </div>
      </div>
    </div>
  )
}