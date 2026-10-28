import { teams } from './triage-data.js'

export default function TicketHandoff({ current, update, route, next, allRouted }) {
  function field(name, value) {
    update({ handoff: { ...current.handoff, [name]: value } })
  }
  return <section className="ticket-handoff" aria-labelledby="handoff-heading">
    <p className="storm-kicker">Final review / Queue handoff</p><h4 id="handoff-heading">Give the next team a clear starting point.</h4>
    <p>Review the fields below before routing. You can move work forward while clarification is pending; the receiving team can continue gathering details.</p>
    <form onSubmit={event => { event.preventDefault(); route() }}>
      <fieldset disabled={current.routed} className="handoff-fields"><legend>Ticket assignment and handoff details</legend>
        <div className="handoff-grid"><label className="triage-destination"><span>Destination queue</span><select required value={current.team} onChange={event => update({ team: event.target.value })}>{teams.map(team => <option key={team}>{team}</option>)}</select></label>
        <label className="triage-destination"><span>Category</span><select value={current.handoff.category} onChange={event => field('category', event.target.value)}>{['Account access', 'Application defect', 'Service availability', 'Vulnerability assessment', 'Device support', 'Reporting request', 'Project task', 'Other'].map(category => <option key={category}>{category}</option>)}</select></label>
        <label className="triage-destination"><span>Priority</span><select value={current.handoff.priority} onChange={event => field('priority', event.target.value)}>{['Critical', 'High', 'Normal', 'Low'].map(priority => <option key={priority}>{priority}</option>)}</select></label>
        <label className="triage-destination"><span>Priority reason</span><textarea required rows={3} maxLength={800} value={current.handoff.priorityReason} onChange={event => field('priorityReason', event.target.value)} /></label></div>
        {[['summary', 'Handoff summary', 5], ['incident', 'Incident connection / uncertainty', 3], ['remaining', 'Outstanding information', 3], ['nextAction', 'Next action for the receiving team', 3]].map(([name, label, rows]) => <label className="triage-destination" key={name}><span>{label}</span><textarea required rows={rows} maxLength={3000} value={current.handoff[name]} onChange={event => field(name, event.target.value)} /></label>)}
      </fieldset>
      <p className="assisted-note">The original request and any approved follow-up and received reply stay attached. This summary supplements the conversation.</p>
      <button type="submit" className={`button button-primary ${current.routed ? 'action-complete' : ''}`} disabled={current.routed}>{current.routed ? <><span aria-hidden="true">✓</span> Routed to {current.team}</> : 'Confirm and route ticket'}</button>
    </form>
    {current.routed && <div className="handoff-receipt"><strong>✓ Assigned to {current.team}</strong><p>Status: Assigned · {current.handoff.category} · {current.handoff.priority} priority</p><p>{current.stage === 'sent' ? 'Clarification is pending. The receiving team can follow up.' : current.stage === 'draft' ? 'Routed with the available information. Outstanding questions are included in the handoff.' : 'The clarification exchange is included in the handoff.'}</p>{allRouted ? <p><strong>All four tickets have a destination. You’ve completed the walkthrough.</strong></p> : <button type="button" className="button button-primary" onClick={next}>Review next ticket →</button>}</div>}
  </section>
}
