import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  saveClaim: vi.fn()
}));

describe('Create Claim API - Race Condition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario B: Returns the same ID or new ID via saveClaim upsert logic', async () => {
    const fakeClaimId = '1234-abcd';
    // Mock saveClaim to return the same ID
    (storage.saveClaim as any).mockResolvedValue({ id: fakeClaimId, status: 'pending' });

    const reqData = { flightNumber: 'JU500', fullName: 'Nikola Tesla', pnr: 'ABCDEF' };
    
    // Simulate two concurrent requests
    const req1 = new Request('http://localhost/api/claims/create', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });
    const req2 = new Request('http://localhost/api/claims/create', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });

    const [res1, res2] = await Promise.all([POST(req1), POST(req2)]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    expect(data1.success).toBe(true);
    expect(data2.success).toBe(true);
    expect(data1.claimId).toBe(fakeClaimId);
    expect(data2.claimId).toBe(fakeClaimId);

    // saveClaim should be called twice (the upsert logic inside it handles DB constraints)
    expect(storage.saveClaim).toHaveBeenCalledTimes(2);
  });
});
