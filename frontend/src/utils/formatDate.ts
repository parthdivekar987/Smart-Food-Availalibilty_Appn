import { LOCALE } from './formatCurrency';
export function formatDate(date: Date) {
  return date.toLocaleDateString(LOCALE);
}
