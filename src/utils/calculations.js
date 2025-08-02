// 计算手续费
export function calculateFee(type, bank, weight, amount) {
  if (type === 'buy') return 0
  
  if (bank === '民生银行') {
    return Math.abs(weight) * 3 // 3元每克
  } else if (bank.includes('(JD)')) {
    return amount * 0.004 // 千分之四
  }
  return 0
}

// 计算指定银行的买入均价（用于卖出时的盈亏计算）
export function calculateBankAvgPrice(bank, transactions) {
  const bankBuyTransactions = transactions.filter(t => t.bank === bank && t.type === 'buy')
  if (bankBuyTransactions.length === 0) return 0
  
  const totalCost = bankBuyTransactions.reduce((sum, t) => sum + t.amount, 0)
  const totalWeight = bankBuyTransactions.reduce((sum, t) => sum + t.weight, 0)
  
  return totalWeight > 0 ? totalCost / totalWeight : 0
}

// 计算指定银行的当前成本均价（总成本/总重量）
export function calculateCurrentBankAvgPrice(bank, transactions) {
  const bankTransactions = transactions.filter(t => t.bank === bank)
  let totalCost = 0
  let totalWeight = 0
  
  bankTransactions.forEach(t => {
    totalWeight += t.weight
    if (t.type === 'buy') {
      totalCost += t.amount
    } else if (t.type === 'sell') {
      // 卖出减少总成本（减去净收入）
      const sellNetIncome = Math.abs(t.amount) - t.fee
      totalCost -= sellNetIncome
    }
  })
  
  return totalWeight > 0 ? totalCost / totalWeight : 0
}

// 获取银行对应的当前价格
export function getBankPrice(bank, bankPrices, currentGoldPrice) {
  return bankPrices[bank]?.price || currentGoldPrice || 520
}

// 获取当前活跃的银行列表（有交易记录的银行）
export function getActiveBanks(transactions) {
  const activeBanks = [...new Set(transactions.map(t => t.bank))]
  return activeBanks.length > 0 ? activeBanks : ['民生银行'] // 默认至少包含民生银行
}

// 计算汇总数据
export function calculateSummaryData(state) {
  const { transactions, bankPrices, currentGoldPrice, totalFunds } = state
  
  // 基础数据计算
  const recordedWeight = transactions.reduce((sum, t) => sum + t.weight, 0)
  const totalInvested = transactions.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0)
  const totalSold = Math.abs(transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0))
  const totalFeesAmount = transactions.reduce((sum, t) => sum + t.fee, 0)
  const buyTransactions = transactions.filter(t => t.type === 'buy').length
  const sellTransactions = transactions.filter(t => t.type === 'sell').length
  
  // 计算总体统计
  let totalRemainingCost = 0
  let totalRemainingWeight = 0
  
  // 计算所有银行的总成本和总重量
  transactions.forEach(t => {
    totalRemainingWeight += t.weight
    if (t.type === 'buy') {
      totalRemainingCost += t.amount
    } else if (t.type === 'sell') {
      // 卖出减少总成本（减去净收入）
      const sellNetIncome = Math.abs(t.amount) - t.fee
      totalRemainingCost -= sellNetIncome
    }
  })
  
  const avgPrice = totalRemainingWeight > 0 ? totalRemainingCost / totalRemainingWeight : 0
  const actualTotalFunds = totalFunds || totalInvested
  
  // 总持仓就是记录的实际持仓重量
  const actualTotalWeight = recordedWeight
  
  // 重新设计价值计算：总价值、净价值、手续费
  let grossValue = 0  // 总价值（不考虑手续费）
  let totalSellFees = 0  // 全部卖出需要的手续费
  const bankWeights = {}
  
  // 计算各银行的持仓重量
  transactions.forEach(t => {
    if (!bankWeights[t.bank]) bankWeights[t.bank] = 0
    bankWeights[t.bank] += t.weight
  })
  
  // 计算总价值和卖出手续费
  Object.keys(bankWeights).forEach(bank => {
    if (bankWeights[bank] > 0) {
      const bankPrice = getBankPrice(bank, bankPrices, currentGoldPrice)
      const bankGrossValue = bankWeights[bank] * bankPrice
      grossValue += bankGrossValue
      
      // 计算如果现在全部卖出这个银行的黄金需要的手续费
      if (bank === '民生银行') {
        totalSellFees += bankWeights[bank] * 3 // 3元每克
      } else if (bank.includes('(JD)')) {
        totalSellFees += bankGrossValue * 0.004 // 千分之四
      }
    }
  })
  
  // 净价值 = 总价值 - 卖出手续费
  const netValue = grossValue - totalSellFees
  const currentValue = netValue // 使用净价值作为当前价值
  
  // 剩余资金 = 总资金 - 已投入资金 + 卖出收入 - 卖出手续费
  const totalSellIncome = Math.abs(transactions.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0))
  const remainingFunds = actualTotalFunds - totalInvested + totalSellIncome - totalFeesAmount
  
  // 总盈亏 = 当前价值 - 已投入资金 + 卖出收入 - 手续费
  const totalProfitLoss = currentValue - totalInvested + totalSold - totalFeesAmount
  const profitRate = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0
  
  // 计算加权平均保本均价（使用总成本法）
  let breakEvenPrice = 0
  let totalBreakEvenValue = 0
  let totalWeight = 0
  
  Object.keys(bankWeights).forEach(bank => {
    if (bankWeights[bank] > 0) {
      // 使用总成本法计算成本均价
      const bankCurrentAvgPrice = calculateCurrentBankAvgPrice(bank, transactions)
      
      let bankBreakEvenPrice = 0
      if (bank === '民生银行') {
        bankBreakEvenPrice = bankCurrentAvgPrice + 3 // 3元每克
      } else if (bank.includes('(JD)')) {
        bankBreakEvenPrice = bankCurrentAvgPrice / (1 - 0.004) // 千分之四手续费
      } else {
        bankBreakEvenPrice = bankCurrentAvgPrice
      }
      
      totalBreakEvenValue += bankBreakEvenPrice * bankWeights[bank]
      totalWeight += bankWeights[bank]
    }
  })
  
  if (totalWeight > 0) {
    breakEvenPrice = totalBreakEvenValue / totalWeight
  }
  
  // 计算已实现盈亏（使用新的净盈亏字段）
  const realizedProfitLoss = transactions
    .filter(t => t.type === 'sell')
    .reduce((sum, t) => {
      // 兼容旧数据：如果没有realizedProfitLoss字段，使用旧计算方法
      if (t.realizedProfitLoss !== undefined) {
        return sum + t.realizedProfitLoss
      } else {
        // 旧数据兼容：简单的卖出金额减去手续费
        return sum + Math.abs(t.amount) - t.fee
      }
    }, 0)
  
  // 计算加权平均当前价格
  let weightedCurrentPrice = 0
  if (totalWeight > 0) {
    Object.keys(bankWeights).forEach(bank => {
      if (bankWeights[bank] > 0) {
        const bankPrice = getBankPrice(bank, bankPrices, currentGoldPrice)
        weightedCurrentPrice += bankPrice * bankWeights[bank] / totalWeight
      }
    })
  }
  
  // 计算使用率
  const usageRate = actualTotalFunds > 0 ? (totalInvested / actualTotalFunds) * 100 : 0
  
  return {
    // 核心指标
    totalProfitLoss,
    profitRate,
    grossValue,
    netValue,
    sellFees: totalSellFees,
    totalInvested,
    actualTotalFunds,
    remainingFunds,
    usageRate,
    
    // 统计数据
    actualTotalWeight,
    avgPrice,
    breakEvenPrice,
    weightedCurrentPrice,
    buyTransactions,
    sellTransactions,
    totalTrades: buyTransactions + sellTransactions,
    realizedProfitLoss,
    totalFeesAmount,
    
    // 银行数据
    bankWeights
  }
}