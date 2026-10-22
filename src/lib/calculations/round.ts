/** Rounds to two decimals, avoiding floating point noise in money maths. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Rounds to the given number of decimals. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

/** Keeps a percentage inside a sane range. */
export function normalizePercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}
