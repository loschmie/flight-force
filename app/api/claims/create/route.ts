import { NextResponse } from 'next/server';
import { saveClaim, Claim } from '@/lib/storage';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const claim: Claim = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      flight_number: body.flightNumber,
      passenger_name: body.fullName,
      pnr: body.pnr,
      airline_email: body.airlineEmail || 'claims@getflightforce.com',
      status: 'pending'
    };

    await saveClaim(claim);

    return NextResponse.json({ success: true, claimId: claim.id });
  } catch (error: any) {
    console.error('Error creating claim:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
