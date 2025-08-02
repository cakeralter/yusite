import React, { useRef } from 'react'
import { Download, Upload, Settings, Plus, Wifi, WifiOff } from 'lucide-react'
import { useTransactions } from '../contexts/TransactionContext'

export default function Header({ onAddRecord, onOpenConfig }) {
  const { state, actions } = useTransactions()
  const fileInputRef = useRef(null)

  // 导出数据
  const exportData = async () => {
    try {
      const data = await actions.exportData()
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gold_data_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      alert('导出数据失败：' + error.message)
    }
  }

  // 导入数据
  const importData = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        
        await actions.importData(data)
        alert('数据导入成功！页面将刷新以应用新数据。')
        window.location.reload()
      } catch (err) {
        alert('导入失败：' + err.message)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark">积存金交易记录</h1>
        
        {/* 连接状态指示器 */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          state.isOnline 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {state.isOnline ? (
            <>
              <Wifi size={12} />
              <span>在线</span>
            </>
          ) : (
            <>
              <WifiOff size={12} />
              <span>离线</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
        <button
          onClick={onAddRecord}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          <Plus size={16} />
          添加记录
        </button>
        
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
          disabled={state.loading}
        >
          <Download size={16} />
          导出数据
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          <Upload size={16} />
          导入数据
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={importData}
          className="hidden"
        />
        
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
        >
          <Settings size={16} />
          系统配置
        </button>
      </div>
      
      {/* 错误提示 */}
      {state.error && (
        <div className="w-full mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {state.error}
        </div>
      )}
      
      {/* 加载状态 */}
      {state.loading && (
        <div className="w-full mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          正在加载数据...
        </div>
      )}
    </div>
  )
}