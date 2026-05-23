export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export function getDayName(startDay: number, dayIndex: number): string {
  return DAY_NAMES_SHORT[(startDay + dayIndex) % 7]
}

export function getDayNameFull(startDay: number, dayIndex: number): string {
  return DAY_NAMES_FULL[(startDay + dayIndex) % 7]
}
