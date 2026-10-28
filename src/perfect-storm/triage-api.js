import { teams } from './triage-data.js'

const categories = ['Account access', 'Application defect', 'Service availability', 'Vulnerability assessment', 'Device support', 'Reporting request', 'Project task', 'Other']
const priorities = ['Critical', 'High', 'Normal', 'Low']

export function validRecommendation(value) {
  const text = (value, limit) => typeof value === 'string' && !!value.trim() && value.length <= limit
  return !!value && typeof value.team === 'string' && (value.team === '' || teams.includes(value.team))
    && typeof value.uncertain === 'boolean' && (value.team !== '' || value.uncertain)
    && Array.isArray(value.alternatives) && value.alternatives.length <= 3 && value.alternatives.every(team => teams.includes(team))
    && ['reason', 'questions', 'assessment'].every(key => text(value[key], 1500))
    && !!value.handoff && categories.includes(value.handoff.category) && priorities.includes(value.handoff.priority)
    && text(value.handoff.priorityReason, 800) && text(value.handoff.summary, 3000)
    && ['incident', 'remaining', 'nextAction'].every(key => text(value.handoff[key], 1500))
}

export function createTriageClient({ baseUrl, fetchImpl = globalThis.fetch, timeoutMs = 50000 }) {
  return async function analyze(request, signal) {
    if (!baseUrl) throw new Error('Live triage is not configured yet. You can explore the guided examples in chapter three.')
    const controller = new AbortController()
    const cancel = () => controller.abort()
    signal?.addEventListener('abort', cancel, { once: true })
    if (signal?.aborted) controller.abort()
    const timeout = setTimeout(cancel, timeoutMs)
    try {
      const response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}/api/triage/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request), signal: controller.signal,
      })
      if (!response.ok) {
        // Use bounded, known messages rather than displaying proxy/provider response bodies.
        const problem = await response.json().catch(() => null)
        const messages = {
          triage_not_configured: 'Live triage is not configured yet. Please try the guided examples in chapter three.',
          triage_busy: 'The demo is handling other requests. Your text is still here; please wait a moment and try again.',
          triage_capacity: 'The demo has reached its hourly request allowance. Your text is still here; please try again later.',
          triage_ip_limit: 'This connection has reached the demo’s limit of six requests per ten minutes. Your text is still here; please wait before trying again.',
          triage_provider_rate_limit: 'OpenAI temporarily limited requests for this API project. Your text is still here; please wait and try again.',
          triage_credits_exhausted: 'The AI service has no available API credits. The demo owner needs to review OpenAI API billing.',
          triage_spend_limit: 'The AI service has reached a configured spending limit. The demo owner needs to review API project or organization limits.',
          triage_quota: 'The AI service has no available API quota. The demo owner needs to review API billing, credits, and usage limits.',
          triage_timeout: 'The analysis took too long. Your text is still here; please try again.',
          triage_invalid_response: 'The AI response could not be verified. Your text is still here; please try again.',
          triage_output_limit: 'The AI response ended before the assessment was complete. Your text is still here; please try a shorter request.',
          triage_unable_to_assess: 'The service could not assess this request. Please use a fictional helpdesk work order.',
        }
        throw new Error(messages[problem?.code] || (response.status === 429
          ? 'The demo is busy or has reached its request limit. Your text is still here; please try again later.'
          : response.status === 400 || response.status === 413
            ? 'Check the field lengths and include a subject, description, and approved follow-up with any reply.'
            : 'The AI service is temporarily unavailable. Your text is still here; please try again later.'))
      }
      const result = await response.json()
      if (!validRecommendation(result)) throw new Error('The AI response could not be verified. Your text is still here; please try again.')
      return result
    } catch (failure) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError')
      if (controller.signal.aborted) throw new Error('The analysis took too long. Your text is still here; please try again.')
      if (failure instanceof SyntaxError) throw new Error('The AI response could not be verified. Your text is still here; please try again.')
      if (failure instanceof TypeError) throw new Error('The triage API could not be reached. Your text is still here; please try again later.')
      throw failure
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', cancel)
    }
  }
}

export const analyzeTriage = createTriageClient({
  baseUrl: import.meta.env?.VITE_API_BASE_URL || (import.meta.env?.DEV ? 'http://localhost:10000' : ''),
})
