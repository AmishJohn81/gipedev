import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles.css'
import './storm.css'
import ManualTriage from './ManualTriage.jsx'
import AssistedTriage from './AssistedTriage.jsx'
import IntendedOutcome from './IntendedOutcome.jsx'
import LiveTriagePage from './LiveTriagePage.jsx'

const fronts = [
  ['01', 'People, waiting to begin.', 'The largest new-hire class in years arrives for the monthly start date. Several account setups were missed entirely; others have the wrong privileges. New colleagues cannot access the common systems they need. Managers and trainers are asking for help, and a first day is slipping away.'],
  ['02', 'A release under pressure.', 'A major mobile app release goes live today. Break-fix reports begin arriving from multiple directions. The app development team needs clear, actionable reports, but the helpdesk must first work out which requests belong together and which need immediate attention.'],
  ['03', 'An outage beyond the walls.', 'In this fictional scenario, Cloudflare is experiencing a major outage. Reports of unavailable services pour in. Some may share that external cause; others may be unrelated. Every new ticket asks the same question: is this part of the outage, or another problem entirely?'],
  ['04', 'A security concern that cannot wait.', 'An advisory describes a major PHP vulnerability. The organization needs to establish which systems are affected, who owns them, and how evaluation and patching will be coordinated. Its relevance to the environment is still unknown, but it cannot disappear into the general queue.'],
]

const chapters = [
  { href: '/perfect-storm/', label: 'Understand the situation', short: 'The scenario' },
  { href: '/perfect-storm/experience/', label: 'Experience the problem', short: 'The queue' },
  { href: '/perfect-storm/solution/', label: 'Explore the solution', short: 'The solution demo' },
  { href: '/perfect-storm/live/', label: 'Chart your own course.', short: 'Live AI triage' },
]
const path = window.location.pathname.replace(/\/+$/, '')
const chapter = path.endsWith('/experience') ? 1 : path.endsWith('/solution') ? 2 : path.endsWith('/live') ? 3 : 0

function ChapterNavigation() {
  const [visited] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('perfect-storm-chapters'))
      return Array.isArray(saved) ? saved.filter(index => Number.isInteger(index) && index >= 0 && index < chapters.length) : []
    } catch { return [] }
  })
  useEffect(() => {
    const next = [...new Set([...visited, chapter])]
    try { sessionStorage.setItem('perfect-storm-chapters', JSON.stringify(next)) } catch { /* Navigation works without storage. */ }
  }, [visited])
  return <nav className="storm-chapters" aria-label="Project chapters"><ol>{chapters.map((item, index) => <li key={item.href} data-visited={visited.includes(index)}><a href={item.href} aria-current={index === chapter ? 'page' : undefined}><span className="chapter-number" title={visited.includes(index) && index !== chapter ? 'Visited chapter' : `Chapter ${index + 1}`}>{visited.includes(index) && index !== chapter ? '✓' : `0${index + 1}`}</span><span><small>{item.short}</small><strong>{item.label}</strong></span><span aria-hidden="true">→</span></a></li>)}</ol></nav>
}

function ChapterLinks() {
  return <nav className="storm-page-turn" aria-label="Continue through the project">
    {chapter > 0 ? <a className="storm-previous" href={chapters[chapter - 1].href}><small>← Previous chapter</small><span>{chapters[chapter - 1].label}</span></a> : <a className="storm-previous" href="/#work"><small>← Portfolio</small><span>Back to selected work</span></a>}
    {chapter < chapters.length - 1 ? <a className="storm-next" href={chapters[chapter + 1].href}><small>Next chapter / 0{chapter + 2}</small><strong>{chapters[chapter + 1].label} →</strong><span>{chapter === 0 ? 'Step into the helpdesk and open the incoming work orders.' : chapter === 1 ? 'See how a clearer triage process could help.' : 'Move beyond the guided examples toward live AI triage.'}</span></a> : <a className="storm-next" href="/#contact"><small>Continue the conversation</small><strong>Discuss this approach →</strong><span>Bring a business problem. Let’s find a clear course.</span></a>}
  </nav>
}

function ExperiencePage() {
  return <>
    <section className="storm-hero"><div className="storm-hero-inner"><p className="storm-kicker">Chapter 02 / Experience the problem</p><p className="storm-bearing-subtitle">Take the helm.</p><h1>You’re on<br /><em>the helpdesk.</em></h1><p className="storm-deck">The requests arrive together. The context does not.<br />Open a work order. Decide what you would need to know before routing it.</p><div className="storm-hero-bottom"><span>Fictional work orders · All awaiting triage</span><a href="#incoming">Open the queue ↓</a></div></div></section>
    <ManualTriage />
    <section className="storm-approach"><div className="storm-section"><p className="storm-kicker">Pause before the solution</p><h2>Every handoff<br /><em>starts with a decision.</em></h2><p className="storm-approach-intro">Which team owns this? Is it part of a known incident? What information is missing? An analyst repeats these decisions for every request while the queue continues to grow.</p><p className="storm-approach-intro">The next chapter frames how assistance could reduce that effort while keeping the analyst in control.</p></div></section>
  </>
}

function SolutionPage() {
  return <>
    <section className="storm-hero"><div className="storm-hero-inner"><p className="storm-kicker">Chapter 03 / The solution demo</p><p className="storm-bearing-subtitle">A clearer bearing.</p><h1>A clearer course<br /><em>for every request.</em></h1><p className="storm-deck">Help the analyst understand the request, find its owner, and make a confident handoff.</p><div className="storm-hero-bottom"><span>Interactive walkthrough · Predefined recommendations</span><a href="#demo-direction">Try assisted triage ↓</a></div></div></section>
    <AssistedTriage />
    <IntendedOutcome />
  </>
}

function StormPage() {
  return <div className="storm-page">
    <a className="storm-skip" href="#scenario">Skip to content</a>
    <header className="site-header">
      <a className="brand" href="/"><span className="brand-mark">G</span><span>GipeDev</span></a>
      <nav aria-label="Main navigation"><a href="/#work">All work ↗</a><a href="/john-gipe-resume.pdf" target="_blank" rel="noreferrer">Résumé ↗</a></nav>
    </header>
    <ChapterNavigation />
    <main id="scenario">
      {chapter === 0 ? <>
      <section className="storm-hero">
        <div className="storm-hero-inner">
          <p className="storm-kicker">Scenario study / 01 · Helpdesk triage</p><p className="storm-bearing-subtitle">Four fronts. One crew.</p>
          <h1>The perfect storm.<br /><em>How to navigate it.</em></h1>
          <p className="storm-deck">An overwhelmed helpdesk. Competing priorities.<br />A clearer course starts with understanding the people in the queue.</p>
          <div className="storm-hero-bottom"><span>By John Gipe</span><a href="#backstory">Read the scenario ↓</a></div>
        </div>
        <div className="storm-chart" aria-hidden="true"><span className="chart-north">N</span><span className="chart-course" /><span className="chart-label">A clear course through competing demands</span></div>
      </section>

      <div className="storm-disclosure"><span>Fictional scenario</span><p>This is a portfolio exercise, not a client engagement or an account of my professional experience. The incidents, outage, and security advisory are imagined conditions, not current event reports.</p></div>

      <section className="storm-section storm-opening" id="backstory">
        <p className="storm-kicker">The situation</p>
        <div className="storm-two-column"><h2>One morning.<br />Every front arrives.</h2><div><p>The helpdesk is already understaffed. On a normal day, the team balances incoming work orders, answers questions, and gets requests to the people who can resolve them.</p><p>Today, the normal queue has company. Four competing demands arrive at once, each carrying real consequences for the people waiting on the other end.</p><p className="storm-emphasis">The team is working hard. The queue is growing faster than they can make sense of it.</p></div></div>
      </section>

      <section className="storm-section storm-fronts" aria-labelledby="fronts-title">
        <div className="storm-section-heading"><p className="storm-kicker">Four converging fronts</p><h2 id="fronts-title">Everything feels urgent.<br />Each needs a different response.</h2></div>
        <div className="storm-front-grid">{fronts.map(([number, title, description]) => <article className="storm-front" key={number}><span className="storm-number">{number} /</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        <aside className="storm-normal"><h3>And the everyday work keeps coming.</h3><p>A printer is out of ink. Someone needs information. A reporting request is due. Project tasks are waiting for an update. These requests do not stop mattering because something bigger has happened.</p></aside>
      </section>

      <section className="storm-section storm-two-column storm-cost">
        <div><p className="storm-kicker">The human cost</p><h2>Routing work<br />becomes the work.</h2></div>
        <div><p>A first-level analyst opens a work order, reads through an incomplete description, searches for context, and decides where it belongs. Then does it again. And again.</p><p>A misrouted ticket comes back. A duplicate starts another investigation. A vague request requires another conversation. Meanwhile, new hires wait, specialists lack the details they need, and the helpdesk absorbs the frustration.</p><blockquote>Before anyone can solve the problem, someone has to understand it well enough to get it to the right people.</blockquote></div>
      </section>

      <section className="storm-approach" aria-labelledby="approach-title"><div className="storm-section">
        <p className="storm-kicker">My approach to this scenario</p><h2 id="approach-title">Create clarity.<br /><em>Give people room to act.</em></h2>
        <p className="storm-approach-intro">I would start with the team’s decisions: what they need to know, where ownership is unclear, and what keeps a work order moving. The goal is to reduce the effort of triage so the helpdesk can focus on helping people.</p>
        <div className="storm-principles">
          <article><span>01 / Understand</span><h3>Listen before prescribing.</h3><p>Learn how the helpdesk and specialist teams actually work. Clarify ownership, escalation expectations, and the information each team needs.</p></article>
          <article><span>02 / Navigate</span><h3>Make the next step clear.</h3><p>Help distinguish related incidents, identify missing details, and recommend the right destination. Explain the reasoning so an analyst can make an informed decision.</p></article>
          <article><span>03 / Support</span><h3>Keep judgment with people.</h3><p>Make uncertainty visible and corrections easy. An unusual request should reach someone who can assess it, rather than be routed with false certainty.</p></article>
        </div>
      </div></section>

      <section className="storm-section storm-two-column storm-destination"><div><p className="storm-kicker">What better looks like</p><h2>A team with<br />a clearer heading.</h2></div><div><p>New hires reach the teams that can restore their access. App developers receive useful break-fix reports. Outage-related requests share context. The PHP advisory has an accountable owner. Everyday requests remain visible.</p><p>Success would mean less time spent deciding where work belongs, fewer tickets bouncing between teams, and a clearer next step for everyone involved.</p><p className="storm-emphasis">This is the starting brief. The next chapter is turning these needs into a helpdesk triage experience.</p></div></section>
      </> : chapter === 1 ? <ExperiencePage /> : chapter === 2 ? <SolutionPage /> : <LiveTriagePage />}
      <ChapterLinks />
    </main>
    <footer><div className="footer-bottom"><span>© {new Date().getFullYear()} GipeDev</span><a href="/#work">Back to selected work ↗</a><span>Fictional scenario · Real engineering judgment</span></div></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<StrictMode><StormPage /></StrictMode>)
