// lib/compensation-logic.ts
export type FlightRegion = 'EU_ECAA' | 'UK' | 'USA';

export function calculateCompensation(distance: number, delayHours: number, region: FlightRegion) {
  if (region === 'EU_ECAA') {
    if (distance <= 1500 && delayHours >= 3) return { amount: 250, currency: 'EUR', rule: 'EC 261/2004' };
    if (distance > 1500 && distance <= 3500 && delayHours >= 3) return { amount: 400, currency: 'EUR', rule: 'EC 261/2004' };
    if (distance > 3500 && delayHours >= 4) return { amount: 600, currency: 'EUR', rule: 'EC 261/2004' };
  }
  if (region === 'UK') {
    if (distance <= 1500 && delayHours >= 3) return { amount: 220, currency: 'GBP', rule: 'UK 261' };
    if (distance > 3500 && delayHours >= 4) return { amount: 520, currency: 'GBP', rule: 'UK 261' };
  }
  if (region === 'USA') {
    if (delayHours >= 6) return { amount: 100, currency: '% REFUND', rule: 'US DOT Mandates' };
  }
  return { amount: 0, currency: '', rule: 'Nema osnova za odštetu' };
}
