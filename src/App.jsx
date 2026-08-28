import { useState } from 'react'

const Arrow = () => <span aria-hidden="true">↗</span>
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:10000' : '')

function ContactForm() {
  const [status, setStatus] = useState('idle')
  const [feedback, setFeedback] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!apiBaseUrl) {
      setStatus('error')
      setFeedback('The contact form is not configured yet. Please use the email link below.')
      return
    }

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = Object.fromEntries(formData.entries())

    setStatus('submitting')
    setFeedback('')

    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 429) {
        throw new Error('Too many messages were sent recently. Please try again in a few minutes.')
      }

      if (!response.ok) {
        throw new Error('Your message could not be sent. Please check the form and try again.')
      }

      form.reset()
      setStatus('success')
      setFeedback('Thanks—your message is on its way. I’ll get back to you soon.')
    } catch (error) {
      setStatus('error')
      setFeedback(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label>
          <span>Name</span>
          <input name="name" type="text" maxLength="100" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" maxLength="254" autoComplete="email" required />
        </label>
      </div>
      <label>
        <span>Subject</span>
        <input name="subject" type="text" maxLength="150" required />
      </label>
      <label>
        <span>Message</span>
        <textarea name="message" minLength="10" maxLength="5000" rows="6" required />
      </label>
      <label className="form-honeypot" aria-hidden="true">
        <span>Company</span>
        <input name="company" type="text" maxLength="100" tabIndex="-1" autoComplete="off" />
      </label>
      <div className="form-submit">
        <button className="button button-light" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : <>Send message <Arrow /></>}
        </button>
        {feedback && (
          <p className={`form-feedback form-feedback-${status}`} role="status" aria-live="polite">
            {feedback}
          </p>
        )}
      </div>
    </form>
  )
}

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="GipeDev home">
          <span className="brand-mark">G</span>
          <span>GipeDev</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a className="nav-cta" href="#contact">Get in touch</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span /> Independent software development</p>
            <h1 id="hero-title">Thoughtful software.<br /><em>Built well.</em></h1>
            <p className="hero-intro">
              GipeDev turns useful ideas into simple, dependable digital experiences—
              with an eye for the details that make software feel effortless.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">Explore the work <Arrow /></a>
              <a className="text-link" href="#contact">Start a conversation <Arrow /></a>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="code-window">
              <div className="window-bar"><i /><i /><i /><span>gipedev / build</span></div>
              <div className="code-body">
                <p><b>01</b><span className="muted">const</span> idea = <span className="gold">'useful'</span></p>
                <p><b>02</b><span className="muted">const</span> approach = {'{'}</p>
                <p><b>03</b>&nbsp;&nbsp;simple: <span className="blue">true</span>,</p>
                <p><b>04</b>&nbsp;&nbsp;thoughtful: <span className="blue">true</span>,</p>
                <p><b>05</b>&nbsp;&nbsp;reliable: <span className="blue">true</span></p>
                <p><b>06</b>{'}'}</p>
                <p><b>07</b><span className="muted">export default</span> build(idea)</p>
              </div>
              <div className="build-status"><span>✓</span> Ready to ship</div>
            </div>
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
          </div>
        </section>

        <section className="work section" id="work" aria-labelledby="work-title">
          <div className="section-heading">
            <div><p className="eyebrow">Selected work</p><h2 id="work-title">Projects with purpose.</h2></div>
            <p>Practical tools built around real needs, explored with curiosity and crafted with care.</p>
          </div>

          <a className="project-card" href="/5eTools/dev/">
            <div className="project-preview">
              <span className="preview-label">Featured project</span>
              <div className="die" aria-hidden="true">20</div>
              <div className="preview-lines"><i /><i /><i /></div>
            </div>
            <div className="project-details">
              <div className="project-meta"><span>Web application</span><span>2026</span></div>
              <h3>5eTools</h3>
              <p>A growing collection of tools and resources designed to make tabletop sessions smoother and more enjoyable.</p>
              <span className="project-link">View project <Arrow /></span>
            </div>
          </a>

          <a className="project-card asteroid-project" href="/asteroids/">
            <div className="project-preview asteroid-preview">
              <span className="preview-label">In development</span>
              <svg viewBox="0 0 180 100" aria-hidden="true">
                <path d="m156 50-90-30 18 30-18 30 90-30Z" />
                <path className="asteroid-trail trail-red" d="M78 38 6 15" />
                <path className="asteroid-trail trail-yellow" d="M78 50 0 50" />
                <path className="asteroid-trail trail-blue" d="M78 62 6 85" />
              </svg>
            </div>
            <div className="project-details">
              <div className="project-meta"><span>Leaderboard</span><span>Prototype</span></div>
              <h3>Asteroids Home League</h3>
              <p>A cabinet-inspired high-score tracker for an original Asteroids machine and the pilots brave enough to play it.</p>
              <span className="project-link">Launch prototype <Arrow /></span>
            </div>
          </a>
        </section>

        <section className="about section" id="about" aria-labelledby="about-title">
          <p className="eyebrow">The approach</p>
          <div className="about-grid">
            <h2 id="about-title">Small details.<br /><em>Strong foundations.</em></h2>
            <div>
              <p>Good software should be clear, useful, and pleasant to use. GipeDev is a home for projects built on those principles—from the first sketch to the final release.</p>
              <div className="principles">
                <span>01 <b>Keep it clear</b></span>
                <span>02 <b>Build for people</b></span>
                <span>03 <b>Stay curious</b></span>
              </div>
            </div>
          </div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title">
          <div className="contact-inner">
            <div className="contact-copy">
              <p className="eyebrow">Have an idea?</p>
              <h2 id="contact-title">Let’s make something <em>useful.</em></h2>
              <p>Tell me a little about what you’re working on, what problem you want to solve, or where you could use a hand.</p>
              <p className="contact-fallback">Prefer email? <a href="mailto:support@gipedev.com">support@gipedev.com</a></p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} GipeDev</span><span>Designed & built with care.</span></div>
      </footer>
    </div>
  )
}

export default App
