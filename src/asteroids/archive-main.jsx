import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ScoreArchiveApp from './ScoreArchiveApp.jsx'
import './asteroids.css'
import './score-archive.css'

createRoot(document.getElementById('asteroids-scores-root')).render(
  <StrictMode>
    <ScoreArchiveApp />
  </StrictMode>,
)
