import test from 'node:test'
import assert from 'node:assert/strict'
import { createTriageClient, validRecommendation } from './triage-api.js'

const request = { title: 'Portal unavailable', description: 'Two offices report a 502 error.', followUp: 'Which URL?', reply: 'portal.example.com' }
const recommendation = {
  team: 'Infrastructure & Network', reason: 'Availability needs investigation.', uncertain: true, alternatives: [],
  questions: 'When did it start?', assessment: 'The URL is known; timing needs confirmation.',
  handoff: { category: 'Service availability', priority: 'High', priorityReason: 'Reported disruption in two offices.', summary: 'Two offices report a 502 error.', incident: 'External connection unconfirmed.', remaining: 'Start time.', nextAction: 'Check dependencies and scope.' },
}

test('sends the actual request and clarification to the API, without a browser key', async () => {
  const client = createTriageClient({ baseUrl: 'https://example.test/', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://example.test/api/triage/analyze')
    assert.deepEqual(JSON.parse(options.body), request)
    assert.equal(options.method, 'POST')
    assert.equal(options.headers.Authorization, undefined)
    return Response.json(recommendation)
  } })
  assert.deepEqual(await client(request), recommendation)
})

test('missing configuration fails without making a request', async () => {
  const client = createTriageClient({ baseUrl: '', fetchImpl: () => assert.fail('must not fetch') })
  await assert.rejects(client(request), /not configured/)
})

test('rejects unrecognized or incomplete AI output including invalid uncertainty', async () => {
  assert.equal(validRecommendation({ ...recommendation, team: 'Invented' }), false)
  assert.equal(validRecommendation({ ...recommendation, team: '', uncertain: false }), false)
  assert.equal(validRecommendation({ ...recommendation, handoff: null }), false)
  assert.equal(validRecommendation({ ...recommendation, team: '', uncertain: true }), true)
  const client = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: async () => Response.json({ team: 'Invented' }) })
  await assert.rejects(client(request), /could not be verified/)
})

test('provider errors and rate limits produce safe messages rather than raw upstream text', async () => {
  for (const [status, code, expected] of [[503, 'triage_not_configured', /not configured/], [429, '', /request limit/], [504, 'triage_timeout', /too long/], [422, 'triage_unable_to_assess', /fictional/]]) {
    const client = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: async () => Response.json({ code, detail: 'private upstream data' }, { status }) })
    await assert.rejects(client(request), expected)
  }
})

test('network failures and malformed responses preserve the original request', async () => {
  const copy = structuredClone(request)
  const offline = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: async () => { throw new TypeError('offline') } })
  await assert.rejects(offline(request), /could not be reached/)
  const malformed = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: async () => new Response('not json') })
  await assert.rejects(malformed(request), /could not be verified/)
  assert.deepEqual(request, copy)
})

test('distinguishes API credits, quota, local throttles, and provider rate limits', async () => {
  for (const [code, expected] of [
    ['triage_credits_exhausted', /no available API credits/], ['triage_quota', /no available API quota/],
    ['triage_spend_limit', /spending limit/], ['triage_ip_limit', /six requests per ten minutes/],
    ['triage_capacity', /hourly request allowance/], ['triage_provider_rate_limit', /OpenAI temporarily limited/],
    ['triage_output_limit', /ended before the assessment was complete/],
  ]) {
    const client = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: async () => Response.json({ code }, { status: 429 }) })
    await assert.rejects(client(request), expected)
  }
})

test('timeouts and caller cancellation abort the outgoing request', async () => {
  const waitingFetch = async (_, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Cancelled', 'AbortError'))
    signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true })
  })
  const client = createTriageClient({ baseUrl: 'https://example.test', fetchImpl: waitingFetch, timeoutMs: 5 })
  await assert.rejects(client(request), /too long/)
  const cancel = new AbortController()
  const pending = client(request, cancel.signal)
  cancel.abort()
  await assert.rejects(pending, { name: 'AbortError' })
})
