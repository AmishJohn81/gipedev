const Arrow = () => <span aria-hidden="true">↗</span>

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
          <a className="nav-cta" href="mailto:hello@gipedev.com">Get in touch</a>
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
              <a className="text-link" href="mailto:hello@gipedev.com">Start a conversation <Arrow /></a>
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

          <a className="project-card" href="/5eTools/dev/index.html">
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
      </main>

      <footer>
        <div><p className="eyebrow">Have an idea?</p><h2>Let’s make something useful.</h2></div>
        <a className="button button-light" href="mailto:hello@gipedev.com">hello@gipedev.com <Arrow /></a>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} GipeDev</span><span>Designed & built with care.</span></div>
      </footer>
    </div>
  )
}

export default App
