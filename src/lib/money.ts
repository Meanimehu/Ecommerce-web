/**
 * Money (Document 3, section 7; Document 6, section 16). The backend sends whole paise. Amounts stay whole numbers;
 * they are turned into text only for display. Rupee sign, Indian grouping, Latin digits; whole rupees without decimals,
 * otherwise two decimals (₹1,499 and ₹1,499.50).
 */
const grouping = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0, useGrouping: true });

export function formatRupees(paise: number): string {
  if (!Number.isSafeInteger(paise)) throw new Error(`Money must be whole paise, got ${paise}`);
  const sign = paise < 0 ? '-' : '';
  const abs = Math.abs(paise);
  const rupees = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}₹${grouping.format(rupees)}${rest === 0 ? '' : `.${String(rest).padStart(2, '0')}`}`;
}
