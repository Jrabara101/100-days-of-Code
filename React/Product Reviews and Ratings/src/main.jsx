import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { TrustStoreProvider } from './context/TrustStoreContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TrustStoreProvider>
      <App />
    </TrustStoreProvider>
  </React.StrictMode>
)

