/**
 * Returns the current local date as YYYY-MM-DD string.
 * Unlike toISOString().split('T')[0], this uses local timezone
 * so at 11 PM in UTC-6, it correctly returns today's date, not tomorrow's.
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns a greeting based on the current hour.
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};
