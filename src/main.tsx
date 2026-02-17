import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' // Assegura't que importes els estils globals (Tailwind)

// Muntatge de l'aplicació React al DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)