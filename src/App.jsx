import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import ProfitOverview from './components/ProfitOverview'
import SummaryGrid from './components/SummaryGrid'
import BankSummaryTable from './components/BankSummaryTable'
import TransactionTable from './components/TransactionTable'
import AddRecordModal from './components/AddRecordModal'
import ConfigModal from './components/ConfigModal'
import { TransactionProvider } from './contexts/TransactionContext'
import './App.css'

function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  return (
    <TransactionProvider>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Header 
            onAddRecord={() => setIsAddModalOpen(true)}
            onOpenConfig={() => setIsConfigModalOpen(true)}
          />
          
          <ProfitOverview />
          
          <SummaryGrid />
          
          <BankSummaryTable />
          
          <TransactionTable />
          
          <AddRecordModal 
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
          />
          
          <ConfigModal 
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
          />
        </div>
      </div>
    </TransactionProvider>
  )
}

export default App