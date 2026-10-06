import { useEffect, useMemo, useState } from 'react'
import { CabinetBackdrop, ShipCursor } from './AsteroidsApp.jsx'
import VectorText from './VectorText.jsx'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:10000' : '')

const apiUrl = (path) => `${apiBaseUrl.replace(/\/$/, '')}${path}`

function formatArchiveDate(value) {
  const date = new Date(value)
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .toUpperCase()

  return `${month} ${String(date.getUTCDate()).padStart(2, '0')} ${date.getUTCFullYear()}`
}

function VectorInput({ label, value, onChange, inputMode, maxLength }) {
  return (
    <label className="archive-control">
      <span><VectorText text={label} /></span>
      <span className={`archive-vector-input ${value ? '' : 'is-empty'}`}>
        <input value={value} onChange={onChange} inputMode={inputMode} maxLength={maxLength} aria-label={label} />
        <VectorText text={value} />
        <i className="vector-caret" />
      </span>
    </label>
  )
}

export default function ScoreArchiveApp() {
  const [pilots, setPilots] = useState([])
  const [pilotId, setPilotId] = useState('')
  const [search, setSearch] = useState('')
  const [minimumScore, setMinimumScore] = useState('')
  const [maximumScore, setMaximumScore] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ search: '', pilotId: '', minimumScore: '', maximumScore: '' })
  const [filterError, setFilterError] = useState('')
  const [sortBy, setSortBy] = useState('rank')
  const [sortDirection, setSortDirection] = useState('asc')
  const [page, setPage] = useState(1)
  const [archive, setArchive] = useState({ items: [], totalCount: 0, totalPages: 1 })
  const [status, setStatus] = useState('loading')

  const selectedPilot = useMemo(
    () => pilots.find((pilot) => pilot.id === pilotId),
    [pilotId, pilots],
  )

  useEffect(() => {
    fetch(apiUrl('/api/asteroids/pilots'))
      .then((response) => {
        if (!response.ok) throw new Error()
        return response.json()
      })
      .then(setPilots)
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      const parameters = new URLSearchParams({
        page: String(page),
        pageSize: '25',
        sortBy,
        sortDirection,
      })

      if (appliedFilters.search) parameters.set('search', appliedFilters.search)
      if (appliedFilters.pilotId) parameters.set('pilotId', appliedFilters.pilotId)
      if (appliedFilters.minimumScore) parameters.set('minimumScore', appliedFilters.minimumScore)
      if (appliedFilters.maximumScore) parameters.set('maximumScore', appliedFilters.maximumScore)

      try {
        const response = await fetch(apiUrl(`/api/asteroids/scores/archive?${parameters}`), {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error()
        setArchive(await response.json())
        setStatus('ready')
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('error')
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [appliedFilters, page, sortBy, sortDirection])

  const changeSort = (column) => {
    setPage(1)
    if (sortBy === column) {
      setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection(column === 'pilot' ? 'asc' : 'desc')
    }
  }

  const sortMarker = (column) => sortBy === column
    ? (sortDirection === 'asc' ? 'ASC ' : 'DESC')
    : '    '
  const updateDraft = (setter) => (event) => setter(event.target.value)

  const applyFilters = (event) => {
    event.preventDefault()

    if (minimumScore && maximumScore && Number(minimumScore) > Number(maximumScore)) {
      setFilterError('MIN SCORE CANNOT EXCEED MAX SCORE')
      return
    }

    setFilterError('')
    setPage(1)
    setAppliedFilters({ search, pilotId, minimumScore, maximumScore })
  }

  return (
    <div className="asteroids-app score-archive-app">
      <CabinetBackdrop />
      <ShipCursor />

      <header className="arcade-header">
        <a href="/asteroids/" className="back-link"><VectorText text="< HIGH SCORES" /></a>
      </header>

      <main className="archive-page">
        <div className="hero-kicker"><VectorText text="ORIGINAL CABINET // HOME LEAGUE" /></div>
        <h1><VectorText text="SCORE ARCHIVE" label="Score Archive" /></h1>
        <p className="archive-intro"><VectorText text="COMPLETE TRANSMISSION RECORD" /></p>

        <section className="archive-panel" aria-label="All registered scores">
          <form className="archive-filters" onSubmit={applyFilters}>
            <VectorInput label="SEARCH" value={search} maxLength="3" onChange={updateDraft((value) => setSearch(value.toUpperCase().replace(/[^A-Z ]/g, '')))} />

            <label className="archive-control">
              <span><VectorText text="PILOT" /></span>
              <span className="archive-select">
                <select value={pilotId} onChange={updateDraft(setPilotId)} aria-label="Filter by pilot">
                  <option value="">All pilots</option>
                  {pilots.map((pilot) => <option key={pilot.id} value={pilot.id}>{pilot.name}</option>)}
                </select>
                <VectorText text={selectedPilot?.name || 'ALL PILOTS'} />
                <i aria-hidden="true" />
              </span>
            </label>

            <VectorInput label="MIN SCORE" value={minimumScore} inputMode="numeric" maxLength="6" onChange={updateDraft((value) => setMinimumScore(value.replace(/\D/g, '')))} />
            <VectorInput label="MAX SCORE" value={maximumScore} inputMode="numeric" maxLength="6" onChange={updateDraft((value) => setMaximumScore(value.replace(/\D/g, '')))} />
            <button className="arcade-button archive-filter-button" type="submit"><VectorText text="FILTER" /></button>
            {filterError && <p className="archive-filter-error"><VectorText text={filterError} /></p>}
          </form>

          <div className="archive-table-wrap">
            <div className="archive-table" role="table" aria-label="Score archive">
              <div className="archive-table-header" role="row">
                <button type="button" onClick={() => changeSort('rank')}><VectorText text={`RANK ${sortMarker('rank')}`} /></button>
                <button type="button" onClick={() => changeSort('pilot')}><VectorText text={`PILOT ${sortMarker('pilot')}`} /></button>
                <button type="button" onClick={() => changeSort('score')}><VectorText text={`SCORE ${sortMarker('score')}`} /></button>
                <button type="button" onClick={() => changeSort('date')}><VectorText text={`DATE ${sortMarker('date')}`} /></button>
              </div>

              {archive.items.map((entry) => (
                <div className="archive-table-row" role="row" key={entry.id}>
                  <span className="archive-rank" role="cell"><VectorText text={`${entry.overallRank}.`} /></span>
                  <span role="cell"><VectorText text={entry.pilotName} /></span>
                  <span className="archive-score" role="cell"><VectorText text={String(entry.score)} /></span>
                  <span role="cell"><VectorText text={formatArchiveDate(entry.createdAtUtc)} /></span>
                </div>
              ))}

              {status === 'ready' && archive.items.length === 0 && (
                <div className="archive-empty"><VectorText text="NO MATCHING TRANSMISSIONS" /></div>
              )}
            </div>
          </div>

          <div className="archive-pagination">
            <button type="button" disabled={page <= 1 || status !== 'ready'} onClick={() => setPage((value) => value - 1)}><VectorText text="< PREV" /></button>
            <VectorText text={`PAGE ${page} OF ${archive.totalPages}`} />
            <button type="button" disabled={page >= archive.totalPages || status !== 'ready'} onClick={() => setPage((value) => value + 1)}><VectorText text="NEXT >" /></button>
          </div>
        </section>
      </main>

      <footer className="arcade-footer"><VectorText text={`(C) ${new Date().getFullYear()} GIPEDEV`} /><VectorText text="EVERY SCORE HAS A STORY" /></footer>
    </div>
  )
}
