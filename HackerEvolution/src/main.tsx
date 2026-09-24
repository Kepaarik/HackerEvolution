import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { gameLoop } from './core/GameLoop'
import { registerServiceWorker } from './pwa'
import './index.css'

// Запуск единого игрового цикла (Этап 1)
gameLoop.start()

// Регистрация Service Worker для оффлайн-режима (PWA)
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
