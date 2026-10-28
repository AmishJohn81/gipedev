import { useEffect, useRef, useState } from 'react'
import TicketHandoff from './TicketHandoff.jsx'
import { starters } from './triage-examples.js'
import { analyzeTriage } from './triage-api.js'
import './manual-triage.css'
import './assisted-triage.css'
import './live-triage.css'

const steps = ['Describe the request', 'Review and clarify', 'Prepare the handoff', 'Complete the handoff']

export default function LiveTriagePage() {
  const [request, setRequest] = useState({ title: '', description: '' })
  const [result, setResult] = useState(null)
  const [current, setCurrent] = useState(null)
  const [reply, setReply] = useState('')
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [reassessed, setReassessed] = useState(false)
  const [busy, setBusy] = useState(false)
  const pending = useRef(null)
  const initialResult = useRef(null)
  const heading = useRef(null)
  useEffect(() => () => pending.current?.abort(), [])

  function focusNext() { requestAnimationFrame(() => heading.current?.focus()) }
  async function analyze(event) {
    event.preventDefault()
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller; setBusy(true); setError('')
    try {
      const next = await analyzeTriage(request, controller.signal)
      initialResult.current = next
      setResult(next)
      setCurrent({ team: next.team, handoff: next.handoff, draft: next.questions, stage: 'draft', routed: false })
      setStep(1); setError(''); focusNext()
    } catch (failure) { if (!controller.signal.aborted) setError(failure.message || 'Unable to review this request. Your text is still here; please try again.') }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false) } }
  }
  async function reassess(event) {
    event.preventDefault()
    if (pending.current) return
    const controller = new AbortController()
    pending.current = controller; setBusy(true); setError('')
    try {
      const next = await analyzeTriage({ ...request, followUp: current.draft, reply }, controller.signal)
      setResult(next); setCurrent(item => ({ ...item, team: next.team, handoff: next.handoff, stage: 'replied' })); setReassessed(true); setError('')
    } catch (failure) { if (!controller.signal.aborted) setError(failure.message || 'Unable to reassess. Your reply is still here; please try again.') }
    finally { if (pending.current === controller) { pending.current = null; setBusy(false) } }
  }
  function reset() {
    pending.current?.abort(); pending.current = null; setBusy(false); initialResult.current = null
    setRequest({ title: '', description: '' }); setResult(null); setCurrent(null); setReply(''); setStep(0); setError(''); setReassessed(false); focusNext()
  }
  function changeReply(value) {
    setReply(value); setReassessed(false)
    setCurrent(item => ({ ...item, stage: 'sent' }))
    if (!value.trim()) {
      const original = initialResult.current
      setResult(original)
      setCurrent(item => ({ ...item, team: original.team, handoff: original.handoff, stage: 'sent' }))
    }
  }

  const guidance = [
    ['Start with what you know.', 'Describe the symptom and the people affected. You do not need to diagnose the cause. A starter request can help you get moving.', 'Next: review an initial suggestion and the details needed for a useful handoff.'],
    ['You have a starting point.', 'Check the suggested owner and its reasoning. Clarification can help, but urgent work can move forward using the information available.', 'Next: approve a follow-up and add a reply, or go straight to the handoff review.'],
    ['Make the handoff useful.', 'Review the destination, category, priority, and outstanding questions. You can change every proposed field before confirming.', 'Next: confirm the assignment when the receiving team has a clear next action.'],
    ['The work has a destination.', 'The assignment now includes the reviewed summary and context. First-level support can move to the next request without losing the conversation.', 'Next: inspect the completed handoff or start another request.'],
  ][step]

  return <>
    <section className="storm-hero"><div className="storm-hero-inner"><p className="storm-kicker">Chapter 04 / Your own work order</p><h1>A new request.<br /><em>The same clear course.</em></h1><p className="storm-deck">Bring a work order, explore its next steps, and prepare a handoff with guidance along the way.</p><div className="storm-hero-bottom"><span>Live assessment / Human review</span><a href="#live-workspace">Start your walkthrough ↓</a></div></div></section>
    <section className="storm-section live-workspace" id="live-workspace">
      <div className="assisted-disclosure"><strong>AI-assisted triage / Your decision, with context</strong><p>Use fictional details. When you request an assessment, your work order and any approved clarification exchange are sent to the AI service through the GipeDev API. Recommendations need your review; assignments stay in this walkthrough. If the service is not configured, the guided examples in chapter three remain available.</p></div>
      <div className="live-layout"><fieldset disabled={busy} className="live-main" aria-busy={busy}>
        <p className="storm-kicker">Step {step + 1} of 4</p><h2 ref={heading} tabIndex={-1}>{steps[step]}</h2>
        {busy && <p className="live-progress" role="status">{step === 0 ? "Reviewing your request…" : "Updating the assessment…"} Your details are preserved while we wait.</p>}{error && <p className="live-error" role="alert">{error} <a href="/perfect-storm/solution/">Explore guided examples</a></p>}
        {step === 0 ? <>
          <div className="live-starters"><span>Start with an example, or write your own:</span>{starters.map(item => <button className="live-starter" type="button" key={item.title} onClick={() => setRequest({ title: item.title, description: item.description })}>{request.title === item.title && request.description === item.description ? '✓ ' : ''}{item.title}</button>)}</div>
          <form className="live-form" onSubmit={analyze}><label className="triage-destination"><span>Work order subject</span><input required maxLength={120} value={request.title} onChange={event => setRequest({ ...request, title: event.target.value })} /></label><label className="triage-destination"><span>What is happening?</span><textarea required rows={7} maxLength={3000} value={request.description} onChange={event => setRequest({ ...request, description: event.target.value })} placeholder="Describe the problem, affected service, and business impact…" /></label><small>{request.description.length} / 3000 characters</small><button className="button button-primary" type="submit">Review this request →</button></form>
        </> : <>
          <details className="triage-directory"><summary>Original work order and company context</summary><div><h3>{request.title}</h3><p className="triage-note">{request.description}</p><p>This fictional company assigns accounts to Identity & Access, mobile defects to Mobile App Development, availability to Infrastructure & Network, security assessment to Security, devices to Desktop Support, reports to Data & Reporting, and project work to Project Delivery. The scenario includes onboarding problems, a mobile release, a Cloudflare outage, and a PHP advisory; these do not establish the cause of a new request.</p></div></details>
          {step === 1 && <><div className="live-result"><p className="storm-kicker">AI-generated suggestion</p><h3>{result.team || 'Ownership needs clarification'}</h3><p>{result.reason}</p>{result.uncertain && <p className="live-caution"><strong>Owner needs review.</strong> {result.alternatives.length ? `Other possible owners: ${result.alternatives.join(', ')}. Review the available context before choosing an owner.` : 'The owner is not yet clear. Choose the correct destination in the handoff review; a destination must be selected before routing.'}</p>}<p><strong>Incident context:</strong> {result.handoff.incident}</p></div>
            <section className="live-clarification"><h3>Clarify if needed.</h3><p>You can prepare a follow-up or continue without waiting. The original request and any approved exchange stay with the handoff.</p>
              {current.stage === 'draft' ? <label className="triage-destination"><span>Review or edit the follow-up</span><textarea rows={5} maxLength={1500} value={current.draft} onChange={event => setCurrent({ ...current, draft: event.target.value })} /></label> : <div className="assisted-message"><strong>Approved follow-up</strong><p>{current.draft}</p></div>}
              <button className={`button button-primary ${current.stage !== 'draft' ? 'action-complete' : ''}`} type="button" disabled={current.stage !== 'draft' || !current.draft.trim()} onClick={() => setCurrent({ ...current, stage: 'sent' })}>{current.stage !== 'draft' ? '✓ Follow-up approved' : 'Approve follow-up'}</button>
              {current.stage !== 'draft' && <form className="live-form" onSubmit={reassess}><label className="triage-destination"><span>Add the submitter’s reply</span><textarea required rows={5} maxLength={1500} value={reply} onChange={event => changeReply(event.target.value)} /></label><button className={`button button-primary ${reassessed ? 'action-complete' : ''}`} disabled={reassessed || !reply.trim()} type="submit">{reassessed ? '✓ Reply included in assessment' : 'Update assessment'}</button>{reassessed && <p role="status">{result.assessment}</p>}</form>}
            </section><button className="button button-primary live-continue" type="button" disabled={!!reply.trim() && !reassessed} onClick={() => { setStep(2); focusNext() }}>Review handoff {reassessed ? '' : 'with available information'} →</button>{!!reply.trim() && !reassessed && <p>Update the assessment to include your reply before continuing, or clear the reply to proceed without it.</p>}
          </>}
          {step >= 2 && <>{current.stage !== 'draft' && <details className="triage-directory"><summary>Clarification conversation</summary><div><strong>Approved follow-up</strong><p className="triage-note">{current.draft}</p>{current.stage === 'replied' ? <><strong>Submitter reply</strong><p className="triage-note">{reply}</p></> : <p>Reply pending.</p>}</div></details>}<TicketHandoff current={current} update={change => setCurrent(item => ({ ...item, ...change }))} route={() => { setCurrent(item => ({ ...item, routed: true })); setStep(3); focusNext() }} next={reset} allRouted={true} completionMessage="Your work order has a destination. The walkthrough is complete." />{step === 2 && <button className="triage-edit" type="button" onClick={() => { setStep(1); focusNext() }}>← Return to clarification</button>}</>}
          <button className="triage-edit live-reset" type="button" onClick={reset}>{step === 3 ? 'Start another request →' : 'Start over with a new request'}</button>
        </>}
      </fieldset><aside className="live-guide" aria-label="Walkthrough guide"><p className="storm-kicker">Your course through the demo</p><ol>{steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined}><span>{index < step || step === 3 ? '✓' : `0${index + 1}`}</span>{label}</li>)}</ol><div aria-live="polite"><h3>{guidance[0]}</h3><p>{guidance[1]}</p><p className="live-guide-next">{guidance[2]}</p>{reassessed && step === 1 && <p>✓ Your reply is included. You’re ready to review the handoff.</p>}</div><small>You make the final decision. Suggestions and priorities are starting points for your review.</small></aside></div>
    </section>
  </>
}
