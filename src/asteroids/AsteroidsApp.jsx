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
      <path className="ship-hull" d="M26 0-17-14-9 0-17 14 26 0Z" />
      <path className="ship-thrust thrust-top" d="M-12-6-27-9" />
      <path className="ship-thrust thrust-center" d="M-9 0-31 0" />
      <path className="ship-thrust thrust-bottom" d="M-12 6-27 9" />
    </svg>
  )
}

function ShipCursor() {
  const cursorRef = useRef(null)
  const lastPoint = useRef({ x: 0, y: 0 })
  const target = useRef({ x: -100, y: -100, angle: 0 })
  const current = useRef({ x: -100, y: -100, angle: 0 })

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reducedMotion) return undefined

    document.body.classList.add('ship-cursor-active')
    let animationFrame

    const handleMove = (event) => {
      const dx = event.clientX - lastPoint.current.x
      const dy = event.clientY - lastPoint.current.y
      const speed = Math.hypot(dx, dy)
      if (speed > 2) target.current.angle = Math.atan2(dy, dx) * 180 / Math.PI
      target.current.x = event.clientX
      target.current.y = event.clientY
      lastPoint.current = { x: event.clientX, y: event.clientY }
      cursorRef.current?.style.setProperty('--thrust-length', Math.min(3.4, Math.max(.7, speed / 9)))
      cursorRef.current?.classList.add('is-thrusting')
      window.clearTimeout(handleMove.thrustTimer)
      handleMove.thrustTimer = window.setTimeout(() => cursorRef.current?.classList.remove('is-thrusting'), 90)
    }

    const handleDown = () => cursorRef.current?.classList.add('is-firing')
    const handleUp = () => cursorRef.current?.classList.remove('is-firing')

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
      document.body.classList.remove('ship-cursor-active')
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
      window.clearTimeout(handleMove.thrustTimer)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div className="ship-cursor" ref={cursorRef} aria-hidden="true">
      <VectorShip />
      <span className="cursor-shot" />
    </div>
  )
}

function CabinetBackdrop() {
  return (
    <div className="cabinet-backdrop" aria-hidden="true">
      <svg className="space-lines" viewBox="0 0 1600 900" preserveAspectRatio="none">
        <path d="M-80 780C240 560 380 490 680 445S1210 260 1690 20" />
        <path d="M-100 840C230 620 410 540 700 500S1260 310 1710 80" />
        <path d="M-130 690C180 500 380 420 650 390S1190 230 1660-40" />
        <circle cx="1300" cy="180" r="95" />
        <circle cx="1300" cy="180" r="61" />
        <circle cx="220" cy="720" r="68" />
        <path className="impact" d="m1300 65 12 66 42-52-22 66 67-21-57 39 67 15-70 2 48 48-58-38 12 69-29-65-31 64 12-69-59 36 49-46-70 1 68-17-58-37 67 19-25-65 45 53Z" />
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
  return (
    <div className="score-entry-panel">
      <div className="panel-header">
        <span><VectorText text="NEW TRANSMISSION" /></span>
        <button type="button" onClick={onClose} aria-label="Close score entry">×</button>
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <label><span><VectorText text="PILOT" /></span><select defaultValue=""><option value="" disabled>Select player</option><option>JGI</option><option>MKW</option><option>ACE</option></select></label>
        <label><span><VectorText text="SCORE" /></span><input inputMode="numeric" placeholder="00000" /></label>
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
          <div className="vector-specimen" aria-label="Vector font specimen">
            <VectorText text="ABCDEFGHIJKLMNOPQRSTUVWXYZ" label="A through Z" />
            <VectorText text="0123456789" label="Zero through nine" />
          </div>
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
