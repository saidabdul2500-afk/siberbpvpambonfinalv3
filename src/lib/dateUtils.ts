
/**
 * Safely formats a date string to a localized date and time.
 * Returns a fallback string if the date is invalid.
 */
export const formatSafeDateTime = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/**
 * Safely formats a date string to a localized date.
 * Returns a fallback string if the date is invalid.
 */
export const formatSafeDate = (dateStr: string | undefined | null, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', options);
};

/**
 * Safely gets the full year from a date string.
 * Returns a fallback string if the date is invalid.
 */
export const getSafeYear = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.getFullYear().toString();
};

export const formatSafeNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return '0';
  return parsed.toString();
};
