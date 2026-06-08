import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppProviders } from './app/providers/AppProviders'

const rootElement = document.getElementById('root')!
createRoot(rootElement).render(
  <StrictMode>
    <AppProviders />
  </StrictMode>,
)
