import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, getDistanceByIata } from '../haversine';

describe('Haversine Distance Logic', () => {
  it('calculates the correct distance between two known coordinates', () => {
    // BEG (44.8184, 20.3091) to CDG (49.0097, 2.5479)
    const distance = calculateHaversineDistance(44.8184, 20.3091, 49.0097, 2.5479);
    
    // Distance BEG -> CDG is roughly 1400-1450 km.
    // Let's check if it falls in the expected range.
    expect(distance).toBeGreaterThan(1400);
    expect(distance).toBeLessThan(1500);
  });

  it('calculates distance correctly using IATA codes', () => {
    const distance = getDistanceByIata('BEG', 'CDG');
    expect(distance).toBeGreaterThan(1400);
    expect(distance).toBeLessThan(1500);
  });

  it('returns default 2000 if an IATA code is missing', () => {
    const distance = getDistanceByIata('BEG', 'UNKNOWN');
    expect(distance).toBe(2000);
  });
});
