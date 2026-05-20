import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import * as storage from '@/lib/storage';
import * as emailService from '@/lib/email-service';
import * as pdfGenerator from '@/lib/pdf-generator';

vi.mock('@/lib/storage', () => ({
  getClaimById: vi.fn(),
  updateClaimStatus: vi.fn(),
  updateClaimDetails: vi.fn()
}));

vi.mock('@/lib/email-service', () => ({
  sendEmail: vi.fn()
}));

vi.mock('@/lib/pdf-generator', () => ({
  generateDemandPDF: vi.fn().mockResolvedValue(Buffer.from('pdf')),
  generateInvoicePDF: vi.fn().mockResolvedValue(Buffer.from('pdf'))
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue(JSON.stringify({ 'DEFAULT': 'test@airline.com' }))
  }
}));

describe('Webhook API - Idempotency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Scenario C: Does not send email twice for the same claim if already paid/dispatched', async () => {
    const claimId = '1234-abcd';
    const reqData = { claimId, claimData: { flightNumber: 'JU500', fullName: 'Nikola Tesla', pnr: 'ABCDEF' } };

    // First call: Claim is pending
    (storage.getClaimById as any).mockResolvedValueOnce({
      id: claimId,
      status: 'pending',
      flight_number: 'JU500',
      passenger_name: 'Nikola Tesla'
    });

    const req1 = new Request('http://localhost/api/claims/webhook', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });
    const res1 = await POST(req1);
    const data1 = await res1.json();
    
    expect(data1.success).toBe(true);
    expect(emailService.sendEmail).toHaveBeenCalledTimes(2); // One to airline, one to user

    // Second call: Claim is already paid (or dispatched)
    (storage.getClaimById as any).mockResolvedValueOnce({
      id: claimId,
      status: 'paid', // Simulating the updated status
      flight_number: 'JU500',
      passenger_name: 'Nikola Tesla'
    });

    const req2 = new Request('http://localhost/api/claims/webhook', {
      method: 'POST',
      body: JSON.stringify(reqData)
    });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(data2.success).toBe(true);
    expect(data2.message).toBe('Claim already processed');
    // Important: sendEmail should STILL be 2 from the FIRST request, no new emails sent!
    expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
  });
});
