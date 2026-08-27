import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AsteroidsApp from './AsteroidsApp.jsx'
import './asteroids.css'

createRoot(document.getElementById('asteroids-root')).render(
  <StrictMode>
    <AsteroidsApp />
  </StrictMode>,
)
