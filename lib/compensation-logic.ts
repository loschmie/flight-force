// lib/compensation-logic.ts
export type FlightRegion = 'EU_ECAA' | 'UK' | 'USA';

export function calculateCompensation(distance: number, delayHours: number, region: FlightRegion) {
  if (region === 'EU_ECAA') {
    if (distance <= 3500 && delayHours >= 4) return { amount: 250, currency: 'EUR', rule: 'EC 261/2004 (2026 Reform)' };
    if (distance > 3500 && delayHours >= 6) return { amount: 600, currency: 'EUR', rule: 'EC 261/2004 (2026 Reform)' };
  }
  if (region === 'UK') {
    if (distance <= 1500 && delayHours >= 3) return { amount: 220, currency: 'GBP', rule: 'UK 261' };
    if (distance > 3500 && delayHours >= 4) return { amount: 520, currency: 'GBP', rule: 'UK 261' };
  }
  if (region === 'USA') {
    if (delayHours >= 3) return { amount: 100, currency: '% REFUND', rule: '14 CFR Part 260' };
  }
  return { amount: 0, currency: '', rule: 'Nema osnova za odštetu' };
}
