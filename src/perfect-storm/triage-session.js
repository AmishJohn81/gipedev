import { cases, teams } from './triage-data.js'

const key = 'gipedev-perfect-storm-manual-v1'
export function loadManualChoices() {
  try {
    const value = JSON.parse(sessionStorage.getItem(key))
    if (!Array.isArray(value) || value.length !== cases.length) return null
    return value.map(item => ({
      destination: teams.includes(item?.destination) || item?.destination === 'Hold for clarification' ? item.destination : '',
      information: item?.information === true,
      incident: item?.incident === true,
      note: typeof item?.note === 'string' ? item.note.slice(0, 600) : '',
    }))
  } catch { return null }
}

export function saveManualChoices(choices) {
  try { sessionStorage.setItem(key, JSON.stringify(choices)) } catch { /* The exercise still works when storage is unavailable. */ }
}

export function clearManualChoices() {
  try { sessionStorage.removeItem(key) } catch { /* Storage may be blocked. */ }
}
