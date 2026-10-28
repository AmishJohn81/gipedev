import { useRef, useState } from 'react'
import { cases, teams } from './triage-data.js'
import { recommendations } from './recommendations.js'
import { loadManualChoices, clearManualChoices } from './triage-session.js'
import './manual-triage.css'
import './assisted-triage.css'
import TicketHandoff from './TicketHandoff.jsx'
import { buildHandoff, createWorkItem } from './handoff.js'

export default function AssistedTriage() {
  const [selected, setSelected] = useState(0)
  const [manual, setManual] = useState(loadManualChoices)
  const [cleared, setCleared] = useState(false)
  const [work, setWork] = useState(() => recommendations.map((_, index) => createWorkItem(index)))
  const ticketHeading = useRef(null)
  const ticket = cases[selected]
  const recommendation = recommendations[selected]
  const current = work[selected]
  const previous = manual?.[selected]

  function update(change) {
    setWork(items => items.map((item, index) => index === selected ? { ...item, reset: false, ...change } : item))
  }

  function route() {
    if (current.routed) return
    const message = `Routed to ${current.team}. Status: Assigned.`
    update({ routed: true, status: message, history: [...current.history, message] })
  }

  function reviewNext() {
    const nextIndex = work.findIndex((item, index) => index > selected && !item.routed)
    const fallback = work.findIndex(item => !item.routed)
    if (fallback < 0) return
    setSelected(nextIndex >= 0 ? nextIndex : fallback)
    requestAnimationFrame(() => ticketHeading.current?.focus())
  }

  return <section className="storm-section assisted-triage" id="demo-direction">
    <p className="storm-kicker">Interactive walkthrough / Predefined recommendations</p>
    <h2>The same requests.<br />More context to act on.</h2>
    <div className="assisted-disclosure"><strong>Guided demo · Predefined recommendations</strong><p>Explore the workflow using example recommendations and scripted replies. Try the actions, review the context, and make the final call. An AI service is not connected in this version.</p></div>
    <div className="assisted-layout">
      <nav className="assisted-queue" aria-label="Select a work order">{cases.map((item, index) => <button type="button" key={item.id} aria-pressed={index === selected} onClick={() => setSelected(index)}><small>{item.id} / {item.time}</small><strong>{item.subject}</strong><span>{work[index].routed ? '✓ Assigned to ' + work[index].team : work[index].status || 'Awaiting review'}</span></button>)}</nav>
      <div className="assisted-detail" key={ticket.id}>
        <span className="storm-number">{ticket.id} / Original request</span><h3 ref={ticketHeading} tabIndex={-1}>{ticket.subject}</h3><p className="triage-message">{ticket.message}</p>
        <aside className="assisted-comparison"><strong>Your manual decision</strong>{previous?.destination ? <><p>{previous.destination}</p><p>{[previous.information && 'Request more information', previous.incident && 'Possible incident connection'].filter(Boolean).join(' · ') || 'No flags selected'}</p>{previous.note && <p className="triage-note">{previous.note}</p>}</> : <p>No manual choice saved for this request. You can explore directly or <a href="/perfect-storm/experience/">try manual triage first</a>.</p>}</aside>
        <div className="assisted-recommendation"><p className="storm-kicker">Predefined recommendation</p><h4>{recommendation.team}</h4><dl><dt>Why this team</dt><dd>{recommendation.reason}</dd><dt>Missing information</dt><dd>{recommendation.missing}</dd><dt>Incident context and uncertainty</dt><dd>{recommendation.incident}</dd></dl></div>
        <p className="assisted-note">Review the recommendation, clarify if needed, then confirm the assignment in the final handoff below.</p>
        <section className="assisted-conversation" aria-labelledby="clarification-heading"><p className="storm-kicker">Clarification / Follow-up conversation</p><h4 id="clarification-heading">Get the details that move work forward.</h4>
          {current.stage === 'draft' ? <><label className="triage-destination" htmlFor="clarification-draft"><span>Review or edit the follow-up</span><textarea id="clarification-draft" rows={5} maxLength={1200} value={current.draft} disabled={current.routed} onChange={event => update({ draft: event.target.value })} /></label><p className="assisted-note">This guided example uses a scripted reply, even if you edit the follow-up.</p></> : <div className="assisted-message"><strong>Analyst follow-up</strong><p>{current.draft}</p></div>}
          <button type="button" className={`button button-primary ${current.stage !== 'draft' ? 'action-complete' : ''}`} disabled={current.routed || current.stage !== 'draft' || !current.draft.trim()} onClick={() => update({ stage: 'sent', status: 'Follow-up approved. Ready to review the reply.', history: [...current.history, 'Follow-up approved.'] })}>{current.stage !== 'draft' ? <><span aria-hidden="true">✓</span> Follow-up approved</> : 'Approve follow-up'}</button>
          {current.stage !== 'draft' && <div className="assisted-reply-step"><button type="button" className={`button button-primary ${current.stage === 'replied' ? 'action-complete' : ''}`} disabled={current.routed || current.stage === 'replied'} onClick={() => update({ handoff: buildHandoff(selected, true), stage: 'replied', status: 'Reply reviewed. Updated context is ready.', history: [...current.history, 'Reply reviewed; context updated.'] })}>{current.stage === 'replied' ? <><span aria-hidden="true">✓</span> Reply reviewed</> : 'Review submitter reply'}</button>{current.stage === 'replied' && <><div className="assisted-message assisted-reply"><strong>Submitter reply</strong><p>{recommendation.reply}</p></div><div className="assisted-update"><strong>Updated assessment</strong><p>{recommendation.updated}</p><p>The suggested team remains {recommendation.team}. Review the updated fields below before confirming the handoff.</p></div></>}</div>}
        </section>
        <TicketHandoff current={current} update={update} route={route} next={reviewNext} allRouted={work.every(item => item.routed)} />
        <p className="assisted-status" role="status">{current.status || 'Review the recommendation or clarify the request before making a decision.'}</p>
        {current.history.length > 0 && <details className="triage-directory"><summary>Activity history ({current.history.length})</summary><ol>{current.history.map((message, index) => <li key={index}>{message}</li>)}</ol></details>}
        <button type="button" className={`triage-edit ${current.reset ? 'action-reset-complete' : ''}`} disabled={current.reset} onClick={() => update({ ...createWorkItem(selected), status: 'Ticket reset. Ready for a fresh review.', reset: true })}>{current.reset ? <><span aria-hidden="true">✓</span> Ticket reset</> : 'Reset this ticket'}</button>
      </div>
    </div>
    <div className="assisted-storage"><p>Your manual choices stay in this browser tab for comparison. Walkthrough actions reset when you reload the page.</p><button className={`triage-edit ${cleared ? 'action-reset-complete' : ''}`} type="button" disabled={cleared} onClick={() => { clearManualChoices(); setManual(null); setCleared(true) }}>{cleared ? <><span aria-hidden="true">✓</span> Saved choices cleared</> : 'Clear saved manual choices'}</button></div>
  </section>
}
