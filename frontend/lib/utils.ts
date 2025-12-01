import { format, parseISO } from 'date-fns';

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateRange(start: string, end: string): string {
  try {
    const startDate = format(parseISO(start), 'MMM d');
    const endDate = format(parseISO(end), 'MMM d, yyyy');
    return `${startDate} - ${endDate}`;
  } catch {
    return `${start} - ${end}`;
  }
}

export function formatThemeName(themeId: string): string {
  return themeId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

