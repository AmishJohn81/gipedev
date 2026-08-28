// Cabinet-style monoline glyphs. Every character occupies the same 8 x 10 cell.
const glyphs = {
  A: 'M0 10V3L3 0 6 3V10M0 5H6',
  B: 'M0 0V10H4L6 8V7L4 5H0M4 5L6 3V2L4 0H0',
  C: 'M6 0H0V10H6',
  D: 'M0 0V10H3L6 7V3L3 0H0',
  E: 'M6 0H0V10H6M0 5H5',
  F: 'M6 0H0V10M0 5H5',
  G: 'M6 3V0H0V10H6V6H3',
  H: 'M0 0V10M6 0V10M0 5H6',
  I: 'M0 0H6M3 0V10M0 10H6',
  J: 'M6 0V10H3L0 7',
  K: 'M0 0V10M4.5 0 0 5 4.5 10',
  L: 'M0 0V10H6',
  M: 'M0 10V0L3 4 6 0V10',
  N: 'M0 10V0L6 10V0',
  O: 'M0 0H6V10H0V0',
  P: 'M0 10V0H6V5H0',
  Q: 'M0 0H6V7L3 10H0V0M3 7 6 10',
  R: 'M0 10V0H6V5H0M0 5 6 10',
  S: 'M6 0H0V5H6V10H0',
  T: 'M0 0H6M3 0V10',
  U: 'M0 0V10H6V0',
  V: 'M0 0 3 10 6 0',
  W: 'M0 0V10L3 6 6 10V0',
  X: 'M0 0 6 10M6 0 0 10',
  Y: 'M0 0 3 5 6 0M3 5V10',
  Z: 'M0 0H6L0 10H6',
  0: 'M0 0H6V10H0V0',
  1: 'M3 0V10',
  2: 'M0 0H6V5H0V10H6',
  3: 'M0 0H6V10H0M2 5H6',
  4: 'M0 0V5H6M6 0V10',
  5: 'M6 0H0V5H6V10H0',
  6: 'M0 0V10H6V5H0',
  7: 'M0 0H6V10',
  8: 'M0 0H6V10H0V0M0 5H6',
  9: 'M6 10V0H0V5H6',
  '.': 'M3 9V10',
  ':': 'M3 3V4M3 8V9',
  '/': 'M0 10 6 0',
  '-': 'M0 5H6',
  '<': 'M6 0 0 5 6 10',
  '>': 'M0 0 6 5 0 10',
  '(': 'M4 0 2 2V8L4 10',
  ')': 'M2 0 4 2V8L2 10',
}

const advance = 9

export default function VectorText({ text, className = '', label }) {
  const characters = text.toUpperCase().split('')
  const width = Math.max(1, characters.length * advance - 2)

  return (
    <svg
      className={`vector-text ${className}`}
      viewBox={`-1 -1 ${width + 2} 12`}
      style={{ '--vector-ratio': width / 10 }}
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      preserveAspectRatio="xMidYMid meet"
    >
      {characters.map((character, index) => {
        const path = glyphs[character]
        if (!path) return null
        return <path key={`${character}-${index}`} d={path} transform={`translate(${index * advance} 0)`} />
      })}
    </svg>
  )
}
