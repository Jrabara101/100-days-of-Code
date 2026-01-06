import { useState, useEffect } from 'react'
import api from './services/api'
import './App.css'

function App() {
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dbInitialized, setDbInitialized] = useState(null)
  const [initializing, setInitializing] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [transactionForm, setTransactionForm] = useState({
    budget_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    limit_amount: '',
    parent_id: ''
  })

  useEffect(() => {
    checkDatabaseStatus()
    checkHealth()
  }, [])

  useEffect(() => {
    if (dbInitialized === true) {
      loadBudgets()
    }
  }, [dbInitialized])

  const checkHealth = async () => {
    try {
      const health = await api.healthCheck()
      console.log('API Health:', health)
    } catch (err) {
      console.error('Health check failed:', err)
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      const status = await api.checkDatabaseStatus()
      setDbInitialized(status.initialized)
      if (!status.initialized) {
        setError(status.message || 'Database not initialized')
      }
    } catch (err) {
      console.error('Failed to check database status:', err)
      setDbInitialized(false)
    } finally {
      setLoading(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      setInitializing(true)
      setError(null)
      const result = await api.initializeDatabase()
      if (result.success) {
        setDbInitialized(true)
        setError(null)
        await loadBudgets()
        alert('Database initialized successfully!')
      } else {
        setError(result.error || 'Failed to initialize database')
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize database')
      console.error('Error initializing database:', err)
    } finally {
      setInitializing(false)
    }
  }

  const loadBudgets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getBudgets()
      setBudgets(response.data || [])
      // If we got here, database is working
      if (dbInitialized === false) {
        setDbInitialized(true)
      }
    } catch (err) {
      // Check if error is about database not being initialized
      if (err.message && err.message.includes('not initialized')) {
        setDbInitialized(false)
        setError(err.message)
      } else {
        setError(err.message || 'Failed to load budgets')
      }
      console.error('Error loading budgets:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadBudgetDetails = async (id) => {
    try {
      const response = await api.getBudget(id)
      setSelectedBudget(response)
    } catch (err) {
      setError(err.message || 'Failed to load budget details')
      console.error('Error loading budget:', err)
    }
  }

  const handleSubmitBudget = async (e) => {
    e.preventDefault()
    
    if (!budgetForm.name.trim()) {
      setError('Budget name is required')
      return
    }

    if (!budgetForm.limit_amount || parseFloat(budgetForm.limit_amount) <= 0) {
      setError('Limit amount must be a positive number')
      return
    }

    try {
      setError(null)
      const budgetData = {
        name: budgetForm.name.trim(),
        limit_amount: parseFloat(budgetForm.limit_amount),
        ...(budgetForm.parent_id ? { parent_id: parseInt(budgetForm.parent_id) } : {})
      }
      
      const result = await api.createBudget(budgetData)
      
      alert(`Budget "${result.budget.name}" created successfully!`)
      
      // Reset form
      setBudgetForm({
        name: '',
        limit_amount: '',
        parent_id: ''
      })
      setShowBudgetForm(false)
      
      // Reload budgets
      await loadBudgets()
    } catch (err) {
      let errorMessage = err.message || 'Failed to create budget'
      
      if (errorMessage.includes('Parent budget not found') || errorMessage.includes('does not exist')) {
        errorMessage = 'The selected parent budget does not exist. Please select a valid parent budget or leave it empty.'
      }
      
      setError(errorMessage)
      console.error('Error creating budget:', err)
    }
  }

  const handleSubmitTransaction = async (e) => {
    e.preventDefault()
    
    // Validate budget is selected
    if (!transactionForm.budget_id) {
      setError('Please select a budget')
      return
    }

    try {
      setError(null)
      const result = await api.createTransaction({
        budget_id: parseInt(transactionForm.budget_id),
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        date: transactionForm.date
      })
      
      // Show success message - find budget in flattened list
      const flattenBudgets = (budgetList) => {
        let result = []
        budgetList.forEach(budget => {
          if (budget && budget.id) {
            result.push(budget)
            if (budget.children && Array.isArray(budget.children) && budget.children.length > 0) {
              result = result.concat(flattenBudgets(budget.children))
            }
          }
        })
        return result
      }
      const allBudgets = flattenBudgets(budgets)
      const budgetName = allBudgets.find(b => b.id === parseInt(transactionForm.budget_id))?.name || 
                        (selectedBudget?.budget?.name) || 
                        `Budget ID ${transactionForm.budget_id}`
      alert(`Transaction created successfully for ${budgetName}!`)
      
      // Reset form
      const selectedBudgetId = transactionForm.budget_id
      setTransactionForm({
        budget_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      
      // Reload data
      loadBudgets()
      if (selectedBudgetId) {
        loadBudgetDetails(parseInt(selectedBudgetId))
      }
    } catch (err) {
      // Extract user-friendly error message
      let errorMessage = err.message || 'Failed to create transaction'
      
      // Check for specific error types
      if (errorMessage.includes('Budget not found') || errorMessage.includes('does not exist')) {
        errorMessage = `The selected budget does not exist. Please select a valid budget from the list.`
      } else if (errorMessage.includes('Invalid budget')) {
        errorMessage = `Invalid budget selected. Please choose a budget from the dropdown.`
      }
      
      setError(errorMessage)
      console.error('Error creating transaction:', err)
    }
  }

  const renderBudgetTree = (budgetList, parentId = null, level = 0) => {
    return budgetList
      .filter(budget => budget.parent_id === parentId)
      .map(budget => (
        <div key={budget.id} style={{ marginLeft: `${level * 20}px`, marginBottom: '10px' }}>
          <div 
            style={{ 
              padding: '10px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: selectedBudget?.budget?.id === budget.id ? '#e3f2fd' : '#f5f5f5'
            }}
            onClick={() => loadBudgetDetails(budget.id)}
          >
            <strong>{budget.name}</strong>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              Limit: ${parseFloat(budget.limit_amount).toFixed(2)} | 
              Spent: ${parseFloat(budget.direct_spend || 0).toFixed(2)} | 
              Remaining: ${parseFloat(budget.remaining_balance || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8em', color: '#999' }}>
              Burn Rate: {parseFloat(budget.burn_rate_percentage || 0).toFixed(1)}%
            </div>
          </div>
          {budget.children && budget.children.length > 0 && (
            <div style={{ marginTop: '5px' }}>
              {renderBudgetTree(budget.children, budget.id, level + 1)}
            </div>
          )}
        </div>
      ))
  }

  // Show database setup screen if not initialized
  if (dbInitialized === false) {
    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1>FiscalNode — Budget Management</h1>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h2 style={{ color: '#856404', marginTop: 0 }}>Database Not Initialized</h2>
          <p style={{ color: '#856404', marginBottom: '20px' }}>
            The database tables need to be created before you can use the application.
          </p>
          {error && (
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#ffebee', 
              color: '#c62828', 
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}
          <button 
            onClick={initializeDatabase}
            disabled={initializing}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: initializing ? '#ccc' : '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: initializing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {initializing ? 'Initializing...' : 'Initialize Database'}
          </button>
          <p style={{ marginTop: '20px', fontSize: '0.9em', color: '#666' }}>
            This will create the necessary tables (budgets, transactions, budget_history) and views.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>FiscalNode — Budget Management</h1>
      
      {error && !error.includes('not initialized') && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          Error: {error}
        </div>
      )}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setShowBudgetForm(!showBudgetForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: showBudgetForm ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {showBudgetForm ? 'Cancel' : '+ Create Budget'}
        </button>
      </div>

      {showBudgetForm && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h2 style={{ marginTop: 0 }}>Create New Budget</h2>
          <form onSubmit={handleSubmitBudget} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Budget Name: *
              </label>
              <input
                type="text"
                value={budgetForm.name}
                onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                placeholder="e.g., Housing, Food, Transportation"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Monthly Limit ($): *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={budgetForm.limit_amount}
                onChange={(e) => setBudgetForm({ ...budgetForm, limit_amount: e.target.value })}
                placeholder="e.g., 1000.00"
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Parent Budget (Optional):
              </label>
              <select
                value={budgetForm.parent_id}
                onChange={(e) => setBudgetForm({ ...budgetForm, parent_id: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">-- None (Top Level Budget) --</option>
                {budgets.length > 0 && (
                  (() => {
                    const flattenBudgets = (budgetList) => {
                      let result = []
                      budgetList.forEach(budget => {
                        if (budget && budget.id) {
                          result.push(budget)
                          if (budget.children && Array.isArray(budget.children) && budget.children.length > 0) {
                            result = result.concat(flattenBudgets(budget.children))
                          }
                        }
                      })
                      return result
                    }
                    const allBudgets = flattenBudgets(budgets)
                    return allBudgets.map(budget => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name} (ID: {budget.id})
                      </option>
                    ))
                  })()
                )}
              </select>
              <p style={{ fontSize: '0.85em', color: '#666', marginTop: '5px' }}>
                Select a parent budget to create a sub-budget (e.g., "Housing" → "Rent")
              </p>
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Create Budget
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Budget List */}
        <div>
          <h2>Budgets</h2>
          {loading ? (
            <p>Loading budgets...</p>
          ) : (
            <div>
              {budgets.length === 0 ? (
                <p>No budgets found. Create your first budget using the button above.</p>
              ) : (
                renderBudgetTree(budgets)
              )}
            </div>
          )}
        </div>

        {/* Budget Details & Transaction Form */}
        <div>
          {selectedBudget ? (
            <div>
              <h2>Budget Details: {selectedBudget.budget.name}</h2>
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                <p><strong>Limit:</strong> ${parseFloat(selectedBudget.budget.limit_amount).toFixed(2)}</p>
                <p><strong>Spent:</strong> ${parseFloat(selectedBudget.budget.direct_spend || 0).toFixed(2)}</p>
                <p><strong>Remaining:</strong> ${parseFloat(selectedBudget.budget.remaining_balance || 0).toFixed(2)}</p>
                {selectedBudget.prediction && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', borderRadius: '4px' }}>
                    <h3>Prediction</h3>
                    <p>Status: <strong>{selectedBudget.prediction.status}</strong></p>
                    <p>Month Progress: {selectedBudget.prediction.month_progress_pct}%</p>
                    <p>Spend Progress: {selectedBudget.prediction.spend_pct}%</p>
                    <p>Projected Total: ${selectedBudget.prediction.projected_total.toFixed(2)}</p>
                    {selectedBudget.prediction.projected_overage > 0 && (
                      <p style={{ color: '#c62828' }}>
                        Projected Overage: ${selectedBudget.prediction.projected_overage.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <h3>Recent Transactions</h3>
              {selectedBudget.transactions && selectedBudget.transactions.length > 0 ? (
                <ul>
                  {selectedBudget.transactions.map(trans => (
                    <li key={trans.id}>
                      ${parseFloat(trans.amount).toFixed(2)} - {trans.description || 'No description'} 
                      ({new Date(trans.transaction_date).toLocaleDateString()})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No transactions yet.</p>
              )}
            </div>
          ) : (
            <div>
              <p>Select a budget to view details</p>
            </div>
          )}

          {/* Transaction Form */}
          <div style={{ marginTop: '30px' }}>
            <h2>Add Transaction</h2>
            <form onSubmit={handleSubmitTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label>Budget:</label>
                <select
                  value={transactionForm.budget_id}
                  onChange={(e) => {
                    setTransactionForm({ ...transactionForm, budget_id: e.target.value })
                    // Auto-select the budget details when a budget is selected
                    if (e.target.value) {
                      loadBudgetDetails(parseInt(e.target.value))
                    }
                  }}
                  required
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">-- Select a Budget --</option>
                  {budgets.length > 0 ? (
                    (() => {
                      // Flatten the tree to get all budgets (handles nested structure)
                      const flattenBudgets = (budgetList) => {
                        let result = []
                        budgetList.forEach(budget => {
                          if (budget && budget.id) {
                            result.push(budget)
                            if (budget.children && Array.isArray(budget.children) && budget.children.length > 0) {
                              result = result.concat(flattenBudgets(budget.children))
                            }
                          }
                        })
                        return result
                      }
                      const allBudgets = flattenBudgets(budgets)
                      return allBudgets.map(budget => (
                        <option key={budget.id} value={budget.id}>
                          {budget.name} (ID: {budget.id}) - Limit: ${parseFloat(budget.limit_amount || 0).toFixed(2)}
                        </option>
                      ))
                    })()
                  ) : (
                    <option disabled>No budgets available. Create a budget first.</option>
                  )}
                </select>
                {budgets.length === 0 && (
                  <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
                    You need to create budgets first. Insert them directly into the database or use the API.
                  </p>
                )}
              </div>
              <div>
                <label>Amount:</label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div>
                <label>Description:</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <div>
                <label>Date:</label>
                <input
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              <button 
                type="submit" 
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Create Transaction
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
