/** Occupancy thresholds — aligned with backend constants */
export const OCCUPANCY_THRESHOLDS = Object.freeze({
  CRITICAL: 90,
  HIGH:     80,
  MEDIUM:   65,
});

/** @returns {'critical'|'high'|'medium'|'low'} */
export function getOccupancyLevel(pct) {
  if (pct >= OCCUPANCY_THRESHOLDS.CRITICAL) return 'critical';
  if (pct >= OCCUPANCY_THRESHOLDS.HIGH)     return 'high';
  if (pct >= OCCUPANCY_THRESHOLDS.MEDIUM)   return 'medium';
  return 'low';
}

/** Tailwind bar colour class for occupancy percentage */
export function getOccupancyBarClass(pct) {
  const level = getOccupancyLevel(pct);
  return {
    critical: 'bg-red-500',
    high:     'bg-yellow-500',
    medium:   'bg-blue-500',
    low:      'bg-green-500',
  }[level];
}

/** Tailwind text colour class for occupancy percentage */
export function getOccupancyTextClass(pct) {
  const level = getOccupancyLevel(pct);
  return {
    critical: 'text-red-400',
    high:     'text-yellow-400',
    medium:   'text-blue-400',
    low:      'text-green-400',
  }[level];
}
