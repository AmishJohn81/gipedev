import { cases } from './triage-data.js'
import { recommendations } from './recommendations.js'

const defaults = [
  { category: 'Account access', priority: 'High', priorityReason: 'Multiple new starters are blocked from scheduled onboarding.', nextAction: 'Verify the named accounts and payroll entitlements; involve the application owner where needed.', remaining: 'Confirm account provisioning, approved entitlements, and whether any other starters are affected.' },
  { category: 'Application defect', priority: 'High', priorityReason: 'A payment workflow is blocked after a release; the full impact still needs verification.', nextAction: 'Reproduce the crash, review release diagnostics, and establish the scope of impact.', remaining: 'Verify reproduction and impact on other devices and users.' },
  { category: 'Service availability', priority: 'High', priorityReason: 'The portal is reported unavailable; investigate scope and business impact promptly.', nextAction: 'Check portal availability and correlate symptoms with the known external outage without assuming causation.', remaining: 'Confirm service ownership, cause, overall impact, and any available workaround.' },
  { category: 'Vulnerability assessment', priority: 'High', priorityReason: 'A major advisory needs timely exposure assessment; affected versions and exposure are not confirmed.', nextAction: 'Assign an assessment owner, verify PHP versions and advisory applicability, and coordinate any required remediation.', remaining: 'Verify the advisory reference, deployed versions, service owners, and exposure before establishing patch requirements.' },
]

export function buildHandoff(index, replied = false) {
  const ticket = cases[index]
  const recommendation = recommendations[index]
  return {
    ...defaults[index],
    summary: replied ? `${ticket.message}\n\nClarification: ${recommendation.reply}` : ticket.message,
    incident: recommendation.incident,
    remaining: replied ? defaults[index].remaining : recommendation.missing,
  }
}

export function createWorkItem(index) {
  const item = recommendations[index]
  return { team: item.team, draft: item.draft, stage: 'draft', status: '', history: [], reset: false, routed: false, handoff: buildHandoff(index) }
}
