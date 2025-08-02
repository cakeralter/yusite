import React from 'react'
import { Trash2 } from 'lucide-react'
import { useTransactions } from '../contexts/TransactionContext'

export default function TransactionTable() {
  const { state, actions } = useTransactions()
  const { transactions } = state

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条交易记录吗？')) {
      try {
        await actions.deleteTransaction(id)
      } catch (error) {
        alert('删除失败：' + error.message)
      }
    }
  }

  // 按创建时间排序（最新的在前）
  const sortedTransactions = [...transactions].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.date).getTime()
    const timeB = new Date(b.createdAt || b.date).getTime()
    return timeB - timeA
  })

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-5 text-dark">交易记录</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-300">
          <p className="italic">暂无交易记录，请先添加交易</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-dark">日期</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">类型</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">银行</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">克数</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">单价</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">金额</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">手续费</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">净盈亏</th>
                <th className="text-left py-3 px-2 font-semibold text-dark">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map(transaction => {
                // 计算净盈亏显示
                let profitLossDisplay = '-'
                let profitLossClass = ''
                if (transaction.type === 'sell') {
                  const profitLoss = transaction.realizedProfitLoss !== undefined ? 
                    transaction.realizedProfitLoss : 
                    (Math.abs(transaction.amount) - transaction.fee)
                  profitLossDisplay = parseFloat(profitLoss.toFixed(4))
                  profitLossClass = profitLoss >= 0 ? 'text-red-500' : 'text-green-500'
                }

                return (
                  <tr key={transaction._id || transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2">{transaction.date}</td>
                    <td className={`py-3 px-2 font-semibold ${transaction.type === 'buy' ? 'text-red-500' : 'text-green-500'}`}>
                      {transaction.type === 'buy' ? '买入' : '卖出'}
                    </td>
                    <td className="py-3 px-2">{transaction.bank}</td>
                    <td className="py-3 px-2">{parseFloat(Math.abs(transaction.weight).toFixed(4))}</td>
                    <td className="py-3 px-2">{parseFloat(transaction.price.toFixed(4))}</td>
                    <td className="py-3 px-2">{parseFloat(Math.abs(transaction.amount).toFixed(4))}</td>
                    <td className="py-3 px-2">{parseFloat(transaction.fee.toFixed(4))}</td>
                    <td className={`py-3 px-2 ${profitLossClass}`}>{profitLossDisplay}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleDelete(transaction._id || transaction.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除交易"
                        disabled={state.loading}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {transactions.length > 0 && (
        <div className="mt-4 text-xs text-gray-300 sm:hidden">
          ← 滑动查看更多 →
        </div>
      )}
    </div>
  )
}