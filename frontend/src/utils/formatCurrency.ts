/**
 * Single source of truth for money display and tax across the app.
 * Configure with VITE_CURRENCY (ISO code, default INR), VITE_LOCALE (default en-IN)
 * and VITE_TAX_RATE (decimal, default 0.05). Keep VITE_TAX_RATE in sync with the backend TAX_RATE.
 */
export const CURRENCY: string = (import.meta.env.VITE_CURRENCY as string) || "INR";
export const LOCALE: string = (import.meta.env.VITE_LOCALE as string) || "en-IN";
export const TAX_RATE: number = Number(import.meta.env.VITE_TAX_RATE ?? 0.05);

const formatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatCurrency(amount: number | null | undefined): string {
  return formatter.format(Number(amount) || 0);
}

/** Bill totals for a pre-tax subtotal. Tax is applied after discounts. */
export function computeBill(subtotal: number, discountAmount = 0) {
  const discounted = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(discounted * TAX_RATE * 100) / 100;
  return { subtotal, discountAmount, tax, total: Math.round((discounted + tax) * 100) / 100 };
}
