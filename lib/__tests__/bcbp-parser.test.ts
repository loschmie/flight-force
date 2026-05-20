import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseBCBP } from '../bcbp-parser';

describe('BCBP Parser', () => {
  beforeEach(() => {
    // Mock the current date to January 2nd, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Scenario A.1: Julian Date Edge Case (Flight on Dec 31st, Current Date Jan 2nd)', () => {
    // Indices:
    // 0-1: M1
    // 2-21: Name (20 chars)
    // 22: Space or operating carrier PNR code (1 char) -> let's use ' '
    // 23-29: PNR (7 chars)
    // 30-32: From (3 chars)
    // 33-35: To (3 chars)
    // 36-38: Carrier (3 chars)
    // 39-43: Flight (5 chars)
    // 44-46: Julian Date (3 chars)
    const barcode = 'M1DOE/JOHN             ABCDEFGJFKCDGJU 0501 365';
    
    const result = parseBCBP(barcode);
    
    expect(result.date).toBe('2025-12-31');
    expect(result.flightNumber).toBe('JU0501');
    expect(result.pnr).toBe('ABCDEFG');
  });

  it('Scenario A.2: Name with Suffixes', () => {
    const barcode1 = 'M1TESLA/NIKOLA MR      ABCDEFGJFKCDGJU 0501 100';
    const result1 = parseBCBP(barcode1);
    expect(result1.fullName).toBe('Nikola Tesla');

    const barcode2 = 'M1MILANKOVIC/MILUTIN M ABCDEFGJFKCDGJU 0501 100'; // Actually, let's fix MRS. 'MILANKOVIC/MILUTIN MRS' is 22 chars!
    // M1 = 2 chars
    // MILANKOVIC/MILUTIN MRS = 22 chars. Wait, name field is only 20 chars!
    // So 'MILANKOVIC/MILUTIN MRS' is too long for 20 chars. Let's make it 20 chars:
    // 'MILANKOVIC/MILUTIN M' -> 20 chars. But we want to test MRS.
    // Let's use 'DOE/JANE MRS        ' (20 chars)
    const barcode3 = 'M1DOE/JANE MRS         ABCDEFGJFKCDGJU 0501 100';
    const result3 = parseBCBP(barcode3);
    expect(result3.fullName).toBe('Jane Doe');
    
    // Make sure non-suffixed names are fine
    const barcode4 = 'M1SAMR/ALEX            ABCDEFGJFKCDGJU 0501 100';
    const result4 = parseBCBP(barcode4);
    expect(result4.fullName).toBe('Alex Samr');
  });
});
