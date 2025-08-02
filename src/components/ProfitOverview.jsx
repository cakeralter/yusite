import React from 'react'
import { useTransactions } from '../contexts/TransactionContext'
import { calculateSummaryData } from '../utils/calculations'

export default function ProfitOverview() {
  const { state } = useTransactions()
  const summary = calculateSummaryData(state)

  // 格式化为万单位
  const formatToWan = (amount) => {
    if (Math.abs(amount) >= 10000) {
      return `${(amount / 10000).toFixed(2)}万`
    }
    return amount.toFixed(2)
  }

  // 获取盈亏状态样式
  const getProfitBadgeClass = (profit) => {
    if (profit > 0) return 'bg-red-500 bg-opacity-80'
    if (profit < 0) return 'bg-green-500 bg-opacity-80'
    return 'bg-white bg-opacity-20'
  }

  const getProfitTextColor = (profit) => {
    if (profit > 0) return 'text-red-300'
    if (profit < 0) return 'text-green-300'
    return 'text-white'
  }

  // 获取进度条样式
  const getProgressBarClass = (usageRate) => {
    if (usageRate >= 90) return 'progress-fill danger'
    if (usageRate >= 70) return 'progress-fill warning'
    return 'progress-fill'
  }

  return (
    <div className="mb-8">
      <div className="profit-card-bg rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        {/* 标题和状态 */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold">总盈亏状况</h2>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getProfitBadgeClass(summary.totalProfitLoss)}`}>
            {summary.totalProfitLoss > 0 ? '盈利' : summary.totalProfitLoss < 0 ? '亏损' : '持平'}
          </div>
        </div>

        {/* 主要金额 */}
        <div className="flex items-baseline mb-2">
          <span className={`text-3xl sm:text-4xl font-bold mr-2 ${getProfitTextColor(summary.totalProfitLoss)}`}>
            {formatToWan(summary.totalProfitLoss)}
          </span>
          <span className="text-lg opacity-80">元</span>
        </div>

        {/* 收益率 */}
        <div className="mb-5">
          <span className="text-xl font-semibold mr-2">{summary.profitRate.toFixed(2)}%</span>
          <span className="text-sm opacity-80">总收益率</span>
        </div>

        {/* 详细信息网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-70 uppercase tracking-wider">总价值</span>
            <span className="text-base font-semibold">{formatToWan(summary.grossValue)}元</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-70 uppercase tracking-wider">净价值</span>
            <span className="text-base font-semibold">{formatToWan(summary.netValue)}元</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-70 uppercase tracking-wider">卖出手续费</span>
            <span className="text-base font-semibold">{formatToWan(summary.sellFees)}元</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs opacity-70 uppercase tracking-wider">投入本金</span>
            <span className="text-base font-semibold">{formatToWan(summary.totalInvested)}元</span>
          </div>
        </div>

        {/* 资金使用情况 */}
        <div className="pt-5 border-t border-white border-opacity-20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs opacity-70 uppercase tracking-wider">资金使用情况</span>
            <span className="text-sm font-semibold">
              {formatToWan(summary.totalInvested)} / {formatToWan(summary.actualTotalFunds)}
            </span>
          </div>
          
          <div className="progress-bar h-2 mb-2">
            <div 
              className={getProgressBarClass(summary.usageRate)}
              style={{ width: `${Math.min(summary.usageRate, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between text-xs opacity-80 gap-1">
            <span>剩余: {formatToWan(summary.remainingFunds)}元</span>
            <span>使用率: {summary.usageRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}