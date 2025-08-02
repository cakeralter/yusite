import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import apiService from '../services/api'

const TransactionContext = createContext()

// 初始状态
const initialState = {
  transactions: [],
  bankPrices: {
    '民生银行': { price: 520, lastUpdate: '' },
    '民生银行(JD)': { price: 520, lastUpdate: '' },
    '浙商银行(JD)': { price: 520, lastUpdate: '' }
  },
  currentGoldPrice: 520,
  totalFunds: 0,
  targetPrice: 0,
  autoUpdateEnabled: true,
  updateInterval: 10,
  lastUpdateTime: '',
  loading: false,
  error: null
}

// Action类型
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TRANSACTIONS: 'SET_TRANSACTIONS',
  ADD_TRANSACTION: 'ADD_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',
  UPDATE_BANK_PRICE: 'UPDATE_BANK_PRICE',
  UPDATE_CURRENT_PRICE: 'UPDATE_CURRENT_PRICE',
  UPDATE_TOTAL_FUNDS: 'UPDATE_TOTAL_FUNDS',
  UPDATE_TARGET_PRICE: 'UPDATE_TARGET_PRICE',
  UPDATE_AUTO_SETTINGS: 'UPDATE_AUTO_SETTINGS',
  SET_LAST_UPDATE_TIME: 'SET_LAST_UPDATE_TIME',
  SET_CONFIG: 'SET_CONFIG'
}

// Reducer函数
function transactionReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload }
    
    case ActionTypes.SET_TRANSACTIONS:
      return { ...state, transactions: action.payload }
    
    case ActionTypes.ADD_TRANSACTION:
      return { ...state, transactions: [action.payload, ...state.transactions] }
    
    case ActionTypes.DELETE_TRANSACTION:
      return { 
        ...state, 
        transactions: state.transactions.filter(t => t._id !== action.payload) 
      }
    
    case ActionTypes.UPDATE_BANK_PRICE:
      return { 
        ...state, 
        bankPrices: { 
          ...state.bankPrices, 
          [action.payload.bank]: action.payload.data 
        } 
      }
    
    case ActionTypes.UPDATE_CURRENT_PRICE:
      return { ...state, currentGoldPrice: action.payload }
    
    case ActionTypes.UPDATE_TOTAL_FUNDS:
      return { ...state, totalFunds: action.payload }
    
    case ActionTypes.UPDATE_TARGET_PRICE:
      return { ...state, targetPrice: action.payload }
    
    case ActionTypes.UPDATE_AUTO_SETTINGS:
      return { 
        ...state, 
        autoUpdateEnabled: action.payload.enabled,
        updateInterval: action.payload.interval 
      }
    
    case ActionTypes.SET_LAST_UPDATE_TIME:
      return { ...state, lastUpdateTime: action.payload }
    
    case ActionTypes.SET_CONFIG:
      return { 
        ...state,
        ...action.payload
      }
    
    default:
      return state
  }
}

// Provider组件
export function TransactionProvider({ children }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState)
  const [isOnline, setIsOnline] = useState(true)

  // 检查网络连接状态
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiService.healthCheck()
        setIsOnline(true)
      } catch (error) {
        setIsOnline(false)
        console.warn('后端服务连接失败，将使用本地存储模式')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // 每30秒检查一次
    
    return () => clearInterval(interval)
  }, [])

  // 从本地存储加载数据（离线模式）
  const loadLocalData = () => {
    try {
      const transactions = JSON.parse(localStorage.getItem('goldTransactions')) || []
      const bankPrices = JSON.parse(localStorage.getItem('bankPrices')) || initialState.bankPrices
      const currentGoldPrice = parseFloat(localStorage.getItem('currentGoldPrice')) || 520
      const totalFunds = parseFloat(localStorage.getItem('totalFunds')) || 0
      const targetPrice = parseFloat(localStorage.getItem('targetPrice')) || 0
      const autoUpdateEnabled = localStorage.getItem('autoUpdateEnabled') !== 'false'
      const updateInterval = parseInt(localStorage.getItem('updateInterval')) || 10
      const lastUpdateTime = localStorage.getItem('lastUpdateTime') || ''

      dispatch({ type: ActionTypes.SET_TRANSACTIONS, payload: transactions })
      dispatch({ type: ActionTypes.UPDATE_CURRENT_PRICE, payload: currentGoldPrice })
      dispatch({ type: ActionTypes.UPDATE_TOTAL_FUNDS, payload: totalFunds })
      dispatch({ type: ActionTypes.UPDATE_TARGET_PRICE, payload: targetPrice })
      dispatch({ 
        type: ActionTypes.UPDATE_AUTO_SETTINGS, 
        payload: { enabled: autoUpdateEnabled, interval: updateInterval } 
      })
      dispatch({ type: ActionTypes.SET_LAST_UPDATE_TIME, payload: lastUpdateTime })

      Object.keys(bankPrices).forEach(bank => {
        dispatch({ 
          type: ActionTypes.UPDATE_BANK_PRICE, 
          payload: { bank, data: bankPrices[bank] } 
        })
      })
    } catch (error) {
      console.error('加载本地数据失败:', error)
    }
  }

  // 从服务器加载数据（在线模式）
  const loadServerData = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true })
      
      // 加载配置
      const config = await apiService.getConfig()
      dispatch({ type: ActionTypes.SET_CONFIG, payload: config })
      
      // 加载交易记录
      const transactions = await apiService.getTransactions()
      dispatch({ type: ActionTypes.SET_TRANSACTIONS, payload: transactions })
      
      // 加载银行价格
      const priceData = await apiService.getBankPrices()
      if (priceData.bankPrices) {
        Object.keys(priceData.bankPrices).forEach(bank => {
          dispatch({ 
            type: ActionTypes.UPDATE_BANK_PRICE, 
            payload: { bank, data: priceData.bankPrices[bank] } 
          })
        })
      }
      
      dispatch({ type: ActionTypes.SET_ERROR, payload: null })
    } catch (error) {
      console.error('加载服务器数据失败:', error)
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
      // 降级到本地存储
      loadLocalData()
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false })
    }
  }

  // 初始化数据加载
  useEffect(() => {
    if (isOnline) {
      loadServerData()
    } else {
      loadLocalData()
    }
  }, [isOnline])

  // 保存数据到localStorage（离线模式备份）
  const saveToLocalStorage = (key, value) => {
    try {
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value)
    } catch (error) {
      console.error('保存本地数据失败:', error)
    }
  }

  // Actions
  const actions = {
    addTransaction: async (transaction) => {
      try {
        if (isOnline) {
          const newTransaction = await apiService.createTransaction(transaction)
          dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: newTransaction })
        } else {
          // 离线模式
          const newTransaction = {
            ...transaction,
            _id: Date.now().toString(),
            createdAt: new Date().toISOString()
          }
          dispatch({ type: ActionTypes.ADD_TRANSACTION, payload: newTransaction })
          const updatedTransactions = [newTransaction, ...state.transactions]
          saveToLocalStorage('goldTransactions', updatedTransactions)
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    deleteTransaction: async (id) => {
      try {
        if (isOnline) {
          await apiService.deleteTransaction(id)
          dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: id })
        } else {
          // 离线模式
          dispatch({ type: ActionTypes.DELETE_TRANSACTION, payload: id })
          const updatedTransactions = state.transactions.filter(t => t._id !== id)
          saveToLocalStorage('goldTransactions', updatedTransactions)
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateBankPrice: async (bank, priceData) => {
      try {
        if (isOnline) {
          await apiService.updateBankPrice(bank, priceData)
        }
        dispatch({ type: ActionTypes.UPDATE_BANK_PRICE, payload: { bank, data: priceData } })
        
        // 总是保存到本地作为备份
        const updatedBankPrices = { ...state.bankPrices, [bank]: priceData }
        saveToLocalStorage('bankPrices', updatedBankPrices)
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateCurrentPrice: async (price) => {
      try {
        if (isOnline) {
          await apiService.updateCurrentPrice(price)
        }
        dispatch({ type: ActionTypes.UPDATE_CURRENT_PRICE, payload: price })
        saveToLocalStorage('currentGoldPrice', price)
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateTotalFunds: async (funds) => {
      try {
        if (isOnline) {
          await apiService.updateTotalFunds(funds)
        }
        dispatch({ type: ActionTypes.UPDATE_TOTAL_FUNDS, payload: funds })
        saveToLocalStorage('totalFunds', funds)
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateTargetPrice: async (price) => {
      try {
        if (isOnline) {
          await apiService.updateTargetPrice(price)
        }
        dispatch({ type: ActionTypes.UPDATE_TARGET_PRICE, payload: price })
        saveToLocalStorage('targetPrice', price)
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    updateAutoSettings: async (enabled, interval) => {
      try {
        if (isOnline) {
          await apiService.updateAutoUpdateSettings(enabled, interval)
        }
        dispatch({ type: ActionTypes.UPDATE_AUTO_SETTINGS, payload: { enabled, interval } })
        saveToLocalStorage('autoUpdateEnabled', enabled)
        saveToLocalStorage('updateInterval', interval)
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    setLastUpdateTime: (time) => {
      dispatch({ type: ActionTypes.SET_LAST_UPDATE_TIME, payload: time })
      saveToLocalStorage('lastUpdateTime', time)
    },

    fetchAllBankPrices: async () => {
      try {
        if (isOnline) {
          const result = await apiService.fetchAllBankPrices()
          
          // 更新银行价格
          if (result.results) {
            result.results.forEach(item => {
              if (item.success) {
                dispatch({ 
                  type: ActionTypes.UPDATE_BANK_PRICE, 
                  payload: { 
                    bank: item.bank, 
                    data: { price: item.price, lastUpdate: item.lastUpdate }
                  } 
                })
              }
            })
          }
          
          if (result.lastUpdateTime) {
            dispatch({ type: ActionTypes.SET_LAST_UPDATE_TIME, payload: result.lastUpdateTime })
          }
          
          return result
        } else {
          throw new Error('网络连接不可用，无法获取实时价格')
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    importData: async (data) => {
      try {
        if (isOnline && data.transactions) {
          await apiService.importTransactions(data.transactions, true)
        }
        
        // 重新加载数据
        if (isOnline) {
          await loadServerData()
        } else {
          // 离线模式直接更新本地存储
          if (data.transactions) {
            localStorage.setItem('goldTransactions', JSON.stringify(data.transactions))
          }
          if (data.currentGoldPrice) {
            localStorage.setItem('currentGoldPrice', data.currentGoldPrice)
          }
          // ... 其他配置项
          loadLocalData()
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    },

    exportData: async () => {
      try {
        if (isOnline) {
          return await apiService.exportTransactions()
        } else {
          // 离线模式从本地存储导出
          return {
            exportDate: new Date().toISOString(),
            transactions: state.transactions,
            config: {
              currentGoldPrice: state.currentGoldPrice,
              totalFunds: state.totalFunds,
              targetPrice: state.targetPrice,
              bankPrices: state.bankPrices,
              autoUpdateEnabled: state.autoUpdateEnabled,
              updateInterval: state.updateInterval
            }
          }
        }
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message })
        throw error
      }
    }
  }

  return (
    <TransactionContext.Provider value={{ state: { ...state, isOnline }, actions }}>
      {children}
    </TransactionContext.Provider>
  )
}

// Hook
export function useTransactions() {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactions必须在TransactionProvider内使用')
  }
  return context
}