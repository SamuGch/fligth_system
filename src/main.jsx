import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './features/auth/providers/AuthProvider.jsx'
import SeatSelection from './pages/SeatSelection.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)
