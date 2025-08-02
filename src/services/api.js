const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Transactions API
  async getTransactions() {
    return this.request('/transactions')
  }

  async createTransaction(transaction) {
    return this.request('/transactions', {
      method: 'POST',
      body: transaction,
    })
  }

  async updateTransaction(id, transaction) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: transaction,
    })
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE',
    })
  }

  async importTransactions(transactions, clearExisting = false) {
    return this.request('/transactions/import', {
      method: 'POST',
      body: { transactions, clearExisting },
    })
  }

  async exportTransactions() {
    return this.request('/transactions/export')
  }

  async getTransactionStatistics() {
    return this.request('/transactions/statistics')
  }

  // Prices API
  async getBankPrices() {
    return this.request('/prices')
  }

  async updateBankPrice(bank, priceData) {
    return this.request(`/prices/${bank}`, {
      method: 'PUT',
      body: priceData,
    })
  }

  async fetchAllBankPrices() {
    return this.request('/prices/fetch-all', {
      method: 'POST',
    })
  }

  async fetchBankPrice(bank) {
    return this.request(`/prices/fetch/${bank}`)
  }

  // Config API
  async getConfig() {
    return this.request('/config')
  }

  async updateConfig(config) {
    return this.request('/config', {
      method: 'PUT',
      body: config,
    })
  }

  async updateCurrentPrice(price) {
    return this.request('/config/current-price', {
      method: 'PUT',
      body: { price },
    })
  }

  async updateTotalFunds(totalFunds) {
    return this.request('/config/total-funds', {
      method: 'PUT',
      body: { totalFunds },
    })
  }

  async updateTargetPrice(targetPrice) {
    return this.request('/config/target-price', {
      method: 'PUT',
      body: { targetPrice },
    })
  }

  async updateAutoUpdateSettings(autoUpdateEnabled, updateInterval) {
    return this.request('/config/auto-update', {
      method: 'PUT',
      body: { autoUpdateEnabled, updateInterval },
    })
  }

  async resetConfig() {
    return this.request('/config/reset', {
      method: 'POST',
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export default new ApiService()