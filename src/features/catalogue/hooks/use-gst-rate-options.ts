'use client';

import { useMessages } from '@/lib/messages-context';
import { formatRate } from '@/utils/format';
import { useActiveGstRates } from './use-catalogue';

/**
 * The GST-rate choices of a form: "None", the active rates, and the entry's current rate when it
 * has since been switched off, so the form still shows it.
 */
export function useGstRateOptions(currentRateBps: number | null | undefined) {
  const messages = useMessages();
  const activeGstRates = useActiveGstRates();
  const rates = activeGstRates.data?.items ?? [];
  const options = rates.map((rate) => ({ value: String(rate.rateBps), label: rate.label }));
  const isCurrentListed = rates.some((rate) => rate.rateBps === currentRateBps);
  if (currentRateBps !== null && currentRateBps !== undefined && !isCurrentListed) {
    options.push({ value: String(currentRateBps), label: formatRate(currentRateBps) });
  }
  return [{ value: '', label: messages.catalogue.none }, ...options];
}
