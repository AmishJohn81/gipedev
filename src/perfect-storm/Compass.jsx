export default function Compass({ step = 0 }) {
  return <svg className="course-compass" viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M32 3v9M32 52v9M3 32h9M52 32h9M13 13l5 5M46 46l5 5M13 51l5-5M46 18l5-5" fill="none" stroke="currentColor" strokeWidth="1" />
    <g className="course-needle" style={{ transform: `rotate(${[25, 65, 110, 155][step] ?? 25}deg)` }}><path d="M32 12 39 39 32 35 25 39Z" fill="currentColor" /><path d="m32 52-7-27 7 4 7-4Z" fill="none" stroke="currentColor" /></g>
    <circle cx="32" cy="32" r="2" fill="currentColor" />
  </svg>
}
