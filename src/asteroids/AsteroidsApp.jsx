import { useEffect, useRef, useState } from 'react'
import VectorText from './VectorText.jsx'

const initialScores = [
  { rank: 1, player: 'JGI', score: 48290, date: 'AUG 18' },
  { rank: 2, player: 'MKW', score: 35760, date: 'AUG 09' },
  { rank: 3, player: 'ACE', score: 28440, date: 'JUL 27' },
  { rank: 4, player: 'RJM', score: 19980, date: 'JUL 12' },
  { rank: 5, player: 'KAT', score: 12560, date: 'JUN 30' },
]

function VectorShip({ className = '' }) {
  return (
    <svg className={className} viewBox="-22 -18 52 36" aria-hidden="true">
      <path className="ship-hull" d="M26 0-17-14-13 0-17 14 26 0Z" />
      <path className="ship-thrust" d="M-13-6.5-29 0-13 6.5Z" />
    </svg>
  )
}

function ShipCursor() {
  const cursorRef = useRef(null)
  const shotLayerRef = useRef(null)
  const fireTimer = useRef(null)
  const activeShots = useRef(0)
  const lastShotAt = useRef(0)
  const shotsInBurst = useRef(0)
  const cooldownUntil = useRef(0)
  const lastPoint = useRef({ x: 0, y: 0 })
  const target = useRef({ x: -100, y: -100, angle: 0 })
  const current = useRef({ x: -100, y: -100, angle: 0 })

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reducedMotion) return undefined

    document.body.classList.add('ship-cursor-active')
    let animationFrame
    let disposed = false

    const handleMove = (event) => {
      const dx = event.clientX - lastPoint.current.x
      const dy = event.clientY - lastPoint.current.y
      const speed = Math.hypot(dx, dy)
      if (speed > 2) target.current.angle = Math.atan2(dy, dx) * 180 / Math.PI
      target.current.x = event.clientX
      target.current.y = event.clientY
      lastPoint.current = { x: event.clientX, y: event.clientY }
      cursorRef.current?.style.setProperty('--thrust-length', Math.min(1.65, Math.max(.75, speed / 18)))
      cursorRef.current?.classList.add('is-thrusting')
      window.clearTimeout(handleMove.thrustTimer)
      handleMove.thrustTimer = window.setTimeout(() => cursorRef.current?.classList.remove('is-thrusting'), 90)
    }

    const fireShot = () => {
      if (!shotLayerRef.current || activeShots.current >= 4) return
      const firedAt = performance.now()
      if (firedAt < cooldownUntil.current) return
      if (lastShotAt.current && firedAt - lastShotAt.current < 290) return
      lastShotAt.current = firedAt
      shotsInBurst.current += 1
      if (shotsInBurst.current === 4) {
        shotsInBurst.current = 0
        cooldownUntil.current = firedAt + 2000
      }
      const angle = current.current.angle * Math.PI / 180
      const viewport = shotLayerRef.current.getBoundingClientRect()
      const viewportWidth = viewport.width || document.documentElement.clientWidth
      const viewportHeight = viewport.height || document.documentElement.clientHeight
      const startX = current.current.x + Math.cos(angle) * 22
      const startY = current.current.y + Math.sin(angle) * 22
      const shot = document.createElement('i')
      shot.className = 'cursor-projectile'
      shotLayerRef.current.appendChild(shot)
      activeShots.current += 1

      const startedAt = performance.now()
      const horizontalComponent = Math.abs(Math.cos(angle))
      const verticalComponent = Math.abs(Math.sin(angle))
      const horizontalShot = horizontalComponent >= verticalComponent
      const dominantDimension = horizontalShot ? viewportWidth : viewportHeight
      const travelDistance = dominantDimension * .85
      const flightDuration = travelDistance / .4
      const moveShot = (now) => {
        if (disposed) return
        const elapsed = Math.min(now - startedAt, flightDuration)
        const distance = elapsed * .4
        const rawX = startX + Math.cos(angle) * distance
        const rawY = startY + Math.sin(angle) * distance
        const wrappedX = ((rawX % viewportWidth) + viewportWidth) % viewportWidth
        const wrappedY = ((rawY % viewportHeight) + viewportHeight) % viewportHeight
        shot.style.transform = `translate3d(${Math.round(wrappedX)}px, ${Math.round(wrappedY)}px, 0)`

        if (elapsed < flightDuration) {
          requestAnimationFrame(moveShot)
        } else {
          shot.remove()
          activeShots.current = Math.max(0, activeShots.current - 1)
        }
      }
      requestAnimationFrame(moveShot)
    }

    const handleDown = (event) => {
      if (event.target instanceof Element && event.target.closest('button, input, select, textarea, a')) return
      if (fireTimer.current) return
      fireShot()
      fireTimer.current = window.setInterval(fireShot, 290)
    }
    const handleUp = () => {
      window.clearInterval(fireTimer.current)
      fireTimer.current = null
    }

    const animate = () => {
      current.current.x += (target.current.x - current.current.x) * 0.28
      current.current.y += (target.current.y - current.current.y) * 0.28
      let angleDelta = ((target.current.angle - current.current.angle + 540) % 360) - 180
      current.current.angle += angleDelta * 0.22
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) rotate(${current.current.angle}deg)`
      }
      animationFrame = requestAnimationFrame(animate)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointerup', handleUp)
    animate()

    return () => {
      disposed = true
      document.body.classList.remove('ship-cursor-active')
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
      window.clearTimeout(handleMove.thrustTimer)
      window.clearInterval(fireTimer.current)
      activeShots.current = 0
      shotLayerRef.current?.replaceChildren()
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <>
      <div className="shot-layer" ref={shotLayerRef} aria-hidden="true" />
      <div className="ship-cursor" ref={cursorRef} aria-hidden="true"><VectorShip /></div>
    </>
  )
}

function CabinetBackdrop() {
  return (
    <div className="cabinet-backdrop" aria-hidden="true">
      <svg className="space-lines" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <defs>
          <path id="rock-a" d="M-28-46-8-20 12-47 33-21 25 3 36 26 7 49-25 49-47 25-49-20Z" />
          <path id="rock-b" d="M-21-50 12-47 46-19 46-7 12 4 43 28 27 44 13 30-21 48-45 11-45-25-10-24Z" />
          <path id="rock-c" d="M-24-53 0-36 26-51 50-23 23-11 48 16 21 53-10 41-26 52-50 24-36-1-49-30Z" />
        </defs>
        <path d="M-80 780C240 560 380 490 680 445S1210 260 1690 20" />
        <path d="M-100 840C230 620 410 540 700 500S1260 310 1710 80" />
        <path d="M-130 690C180 500 380 420 650 390S1190 230 1660-40" />
        <circle cx="1300" cy="180" r="95" />
        <circle cx="1300" cy="180" r="61" />
        <circle cx="220" cy="720" r="68" />
        <path className="impact" d="m1300 65 12 66 42-52-22 66 67-21-57 39 67 15-70 2 48 48-58-38 12 69-29-65-31 64 12-69-59 36 49-46-70 1 68-17-58-37 67 19-25-65 45 53Z" />
        <g className="game-asteroids">
          <use href="#rock-a" transform="translate(150 160) scale(1.05) rotate(-8)" />
          <use href="#rock-a" transform="translate(1215 710) scale(.62) rotate(91)" />
          <use href="#rock-b" transform="translate(505 175) scale(.58) rotate(26)" />
          <use href="#rock-b" transform="translate(1450 435) scale(.94) rotate(-68)" />
          <use href="#rock-c" transform="translate(280 565) scale(.74) rotate(62)" />
          <use href="#rock-c" transform="translate(1060 115) scale(.46) rotate(-31)" />
        </g>
      </svg>
      <div className="color-ray ray-red" />
      <div className="color-ray ray-yellow" />
      <div className="color-ray ray-blue" />
    </div>
  )
}

function IntroFlyby() {
  return (
    <div className="intro-flyby" aria-hidden="true">
      <div className="intro-trails"><i /><i /><i /></div>
      <VectorShip className="intro-ship" />
    </div>
  )
}

function ScoreEntry({ onClose }) {
  const [pilot, setPilot] = useState('')
  const [score, setScore] = useState('')
  const [pilotMenuOpen, setPilotMenuOpen] = useState(false)
  const [addingPilot, setAddingPilot] = useState(false)
  const [newPilot, setNewPilot] = useState('')

  const choosePilot = (name) => {
    setPilot(name)
    setAddingPilot(false)
    setPilotMenuOpen(false)
  }

  return (
    <div className="score-entry-panel">
      <div className="panel-header">
        <span><VectorText text="NEW TRANSMISSION" /></span>
        <button type="button" onClick={onClose} aria-label="Close score entry"><VectorText text="X" /></button>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <fieldset className="pilot-field">
          <legend><VectorText text="PILOT" /></legend>
          <div className="pilot-select">
            <button className="pilot-select-trigger" type="button" onClick={() => setPilotMenuOpen((open) => !open)} aria-haspopup="listbox" aria-expanded={pilotMenuOpen}>
              <VectorText text={pilot || 'SELECT PILOT'} />
              <i aria-hidden="true" />
            </button>
            {pilotMenuOpen && (
              <div className="pilot-select-menu" role="listbox">
                {['JGI', 'MKW', 'ACE'].map((name) => <button type="button" role="option" aria-selected={pilot === name} key={name} onClick={() => choosePilot(name)}><VectorText text={name} /></button>)}
                <button type="button" role="option" aria-selected="false" onClick={() => { setAddingPilot(true); setPilotMenuOpen(false) }}><VectorText text="NEW PILOT" /></button>
              </div>
            )}
          </div>
          {addingPilot && <div className="new-pilot-entry"><span className={`vector-input ${newPilot ? '' : 'is-empty'}`}><input value={newPilot} onChange={(event) => setNewPilot(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} aria-label="New pilot name" autoFocus /><VectorText text={newPilot || 'PILOT NAME'} /><i className="vector-caret" /></span><button className="arcade-button" type="button" disabled={!newPilot} onClick={() => choosePilot(newPilot)}><VectorText text="ADD" /></button></div>}
        </fieldset>
        <label><span><VectorText text="SCORE" /></span><span className={`vector-input ${score ? '' : 'is-empty'}`}><input value={score} onChange={(event) => setScore(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" aria-label="Score" /><VectorText text={score || '00000'} /><i className="vector-caret" /></span></label>
        <button className="arcade-button" type="submit"><VectorText text="RECORD SCORE" /></button>
        <p><VectorText text="VISUAL PROTOTYPE // SCORE TRANSMISSION OFFLINE" /></p>
      </form>
    </div>
  )
}

export default function AsteroidsApp() {
  const [showEntry, setShowEntry] = useState(false)

  return (
    <div className="asteroids-app">
      <CabinetBackdrop />
      <IntroFlyby />
      <ShipCursor />

      <header className="arcade-header">
        <a href="/" className="back-link" aria-label="Back to GipeDev"><VectorText text="< GIPEDEV" /></a>
        <div className="cabinet-status"><i /><VectorText text="CABINET 001 ONLINE" /></div>
      </header>

      <main>
        <section className="score-hero">
          <div className="hero-kicker"><VectorText text="ORIGINAL CABINET // HOME LEAGUE" /></div>
          <h1><span>Asteroids</span><b><VectorText text="HIGH SCORES" label="High Scores" /></b></h1>
          <div className="hero-subtitle"><VectorText text="ONE MACHINE // A HANDFUL OF PILOTS // NO EXTRA LIVES" /></div>

          <div className="leaderboard-shell">
            <div className="leaderboard-topline"><span><VectorText text="RANK" /></span><span><VectorText text="PILOT" /></span><span><VectorText text="SCORE" /></span><span><VectorText text="DATE" /></span></div>
            <ol className="leaderboard">
              {initialScores.map((entry) => (
                <li key={entry.rank} className={entry.rank === 1 ? 'champion' : ''}>
                  <span className="rank"><VectorText text={`${entry.rank}.`} /></span>
                  <span className="pilot"><VectorText text={entry.player} /></span>
                  <span className="score"><VectorText text={String(entry.score)} /></span>
                  <span className="date"><VectorText text={entry.date} /></span>
                </li>
              ))}
            </ol>
            <div className="leaderboard-actions">
              <p><VectorText text="LAST TRANSMISSION 08.18.26 // 22:41" /></p>
              <button className="arcade-button" type="button" onClick={() => setShowEntry((value) => !value)}><VectorText text="ENTER A SCORE" /></button>
            </div>
          </div>

          {showEntry && <ScoreEntry onClose={() => setShowEntry(false)} />}
        </section>
      </main>

      <footer className="arcade-footer"><VectorText text={`(C) ${new Date().getFullYear()} GIPEDEV`} /><VectorText text="GAME OVER IS ONLY TEMPORARY" /></footer>
    </div>
  )
}
