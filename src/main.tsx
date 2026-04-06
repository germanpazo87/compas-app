import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ExportPage } from './pages/ExportPage'
import { TalesTestPage } from './pages/TalesTestPage'
import { PythagorasTestPage } from './pages/PythagorasTestPage'
import './index.css'

const pathname = window.location.pathname;

function Root() {
  if (pathname === '/export')          return <ExportPage />;
  if (pathname === '/tales-test')      return <TalesTestPage />;
  if (pathname === '/pythagoras-test') return <PythagorasTestPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)