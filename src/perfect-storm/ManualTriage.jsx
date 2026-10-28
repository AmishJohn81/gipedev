import { useRef, useState } from 'react'
import './manual-triage.css'

const teams = ['Identity & Access', 'Mobile App Development', 'Infrastructure & Network', 'Security', 'Desktop Support', 'Data & Reporting', 'Project Delivery']
const cases = [
  { id: 'WO-1041', time: '08:02', subject: 'New starters cannot access payroll', message: 'Several people in today’s class get access denied. Training starts shortly. Can someone check their accounts?', reflection: 'Identity & Access is a reasonable starting point under this company’s ownership rules. Usernames, the payroll system, and the exact error would help distinguish missing accounts from incorrect permissions. The application owner may still need to assist.' },
  { id: 'WO-1042', time: '08:04', subject: 'App crashes when I submit', message: 'Since this morning’s update, the mobile app closes when I submit a payment.', reflection: 'Mobile App Development owns the release, so the destination is relatively clear. Device, operating system, app version, and reproduction steps would make the handoff more useful. A release-day report alone does not confirm a shared incident.' },
  { id: 'WO-1043', time: '08:06', subject: 'Portal down?', message: 'Our customer portal will not load. Is anyone else seeing this?', reflection: 'Infrastructure & Network can investigate availability. The Cloudflare outage is a possible connection, not a confirmed cause. Ask for the portal URL, error, and affected users before treating it as part of the known outage.' },
  { id: 'WO-1044', time: '08:07', subject: 'PHP advisory — please review', message: 'A major PHP vulnerability has been reported. We need to know if we are exposed.', reflection: 'Security coordinates assessment in this fictional company. The advisory identifier, affected versions, and system inventory are needed; application and infrastructure owners may perform the patching. Missing information should not prevent Security from starting the assessment.' },
]

export default function ManualTriage() {
  const [decisions, setDecisions] = useState(() => cases.map(() => ({ destination: '', information: false, incident: false, note: '' })))
  const [reviewing, setReviewing] = useState(false)
  const reviewHeading = useRef(null)
  const exerciseHeading = useRef(null)
  const completed = decisions.filter(item => item.destination).length

  function update(index, field, value) {
    setDecisions(current => current.map((item, position) => position === index ? { ...item, [field]: value } : item))
  }

  function review(event) {
    event.preventDefault()
    setReviewing(true)
    requestAnimationFrame(() => reviewHeading.current?.focus())
  }

  function edit() {
    setReviewing(false)
    requestAnimationFrame(() => exerciseHeading.current?.focus())
  }

  return <section className="storm-section manual-triage" id="incoming">
    <p className="storm-kicker">Your turn / Manual triage</p>
    <h2 ref={exerciseHeading} tabIndex={-1}>Where would you send it?</h2>
    <p>You’re covering first-level support. Review four work orders and choose a destination, or hold a request for clarification. Flag missing information and possible incident connections as needed.</p>
    <p>This is a fictional exercise. Your choices stay on this page and do not route real tickets. There is no timer or score; the point is to experience the decisions.</p>
    <details className="triage-directory"><summary>Company context and team ownership</summary><div><p>A Cloudflare outage is known, the mobile release launched today, and new-hire onboarding is underway. None of that confirms the cause of an individual ticket.</p><ul><li><strong>Identity & Access:</strong> account provisioning and permissions.</li><li><strong>Mobile App Development:</strong> mobile defects and release issues.</li><li><strong>Infrastructure & Network:</strong> availability, connectivity, and external service incidents.</li><li><strong>Security:</strong> vulnerability assessment and remediation coordination.</li><li><strong>Desktop Support:</strong> workstations, printers, and peripherals.</li><li><strong>Data & Reporting:</strong> reports and data requests.</li><li><strong>Project Delivery:</strong> project tasks and status requests.</li></ul><p>These are the ownership rules for this scenario. Real organizations may divide responsibilities differently.</p></div></details>
    <form onSubmit={review} hidden={reviewing}>
      <div className="triage-progress" role="status">{completed} of {cases.length} work orders have a next step selected</div>
      <div className="triage-cases">{cases.map((ticket, index) => <fieldset className="triage-case" key={ticket.id}>
        <legend>{ticket.id} / {ticket.time}</legend>
        <h3>{ticket.subject}</h3><p className="triage-message">{ticket.message}</p>
        <label className="triage-destination" htmlFor={`destination-${index}`}><span>Your next step</span><select id={`destination-${index}`} value={decisions[index].destination} required onChange={event => update(index, 'destination', event.target.value)}><option value="">Choose a team or hold for clarification</option>{teams.map(team => <option key={team}>{team}</option>)}<option>Hold for clarification</option></select></label>
        <div className="triage-flags"><label><input type="checkbox" checked={decisions[index].information} onChange={event => update(index, 'information', event.target.checked)} /> Request more information</label><label><input type="checkbox" checked={decisions[index].incident} onChange={event => update(index, 'incident', event.target.checked)} /> Possibly related to a known incident</label></div>
        <label className="triage-destination" htmlFor={`note-${index}`}><span>What would you ask or check? <small>(optional)</small></span><textarea id={`note-${index}`} rows={2} maxLength={600} value={decisions[index].note} onChange={event => update(index, 'note', event.target.value)} placeholder="A missing detail, a possible connection, or a reason for your choice…" /></label>
      </fieldset>)}</div>
      <div className="triage-submit"><button className="button button-primary" type="submit">Reflect on my decisions →</button><span>Choose a next step for all four requests to continue.</span></div>
    </form>
    {reviewing && <div className="triage-reflection">
      <p className="storm-kicker">Your decisions / A moment to reflect</p><h2 tabIndex={-1} ref={reviewHeading}>The destination is<br />only part of the decision.</h2><p>You selected a next step for all four work orders. Compare your reasoning with the context below. These are suggested considerations, not a score or a single answer key.</p>
      {cases.map((ticket, index) => <article className="triage-review-card" key={ticket.id}><span className="storm-number">{ticket.id}</span><h3>{ticket.subject}</h3><dl><div><dt>Your next step</dt><dd>{decisions[index].destination}</dd></div><div><dt>Your flags</dt><dd>{[decisions[index].information && 'Request more information', decisions[index].incident && 'Possible incident connection'].filter(Boolean).join(' · ') || 'No flags selected'}</dd></div>{decisions[index].note.trim() && <div><dt>Your note</dt><dd className="triage-note">{decisions[index].note}</dd></div>}</dl><p>{ticket.reflection}</p></article>)}
      <div className="triage-takeaway"><h3>Four requests. Several judgment calls.</h3><p>Some owners were clear, but useful handoffs still needed more context. The portal request could share an incident with other reports; the security advisory needs coordinated ownership. Repeating these checks is where triage consumes the team’s time.</p><p>Next, explore how assistance could surface these details and explain a recommendation while leaving the final decision with the analyst.</p></div>
      <div className="triage-submit"><a className="button button-primary" href="/perfect-storm/solution/">Explore the solution →</a><button className="triage-edit" type="button" onClick={edit}>Review or change my choices</button></div>
    </div>}
  </section>
}
