import { NextResponse } from 'next/server';
import { generateDemandPDF, generateInvoicePDF } from '@/lib/pdf-generator';
import { parseBCBP } from '@/lib/bcbp-parser';
import { calculateCompensation } from '@/lib/compensation-logic';
import { getDistanceByIata } from '@/lib/haversine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'demand';
  const nameSuffix = searchParams.get('name') || 'M1TESLA/NIKOLA MR      ABCDEFGJFKCDGJU 0501 100';
  
  // 1. Simulate parsing a boarding pass
  let parsedData;
  try {
    parsedData = parseBCBP(nameSuffix);
  } catch (e) {
    parsedData = {
      flightNumber: 'JU501',
      date: '2026-05-20',
      pnr: 'ABCDEF',
      fullName: 'Nikola Tesla',
      from: 'BEG',
      to: 'CDG'
    };
  }

  // 2. Simulate Compensation Logic
  const distance = getDistanceByIata(parsedData.from, parsedData.to);
  // Let's assume a 4 hour delay for the test
  const delayHours = 4;
  const compensation = calculateCompensation(distance, delayHours, 'EU_ECAA');

  // Combine data
  const claimData = {
    ...parsedData,
    delayHours,
    amount: compensation.amount,
    currency: compensation.currency,
    address: '123 Test Street, Belgrade, RS',
    email: 'nikola.tesla@example.com',
    bankName: 'Raiffeisen Bank',
    iban: 'RS352650000000000000',
    swift: 'RZBSCSBG',
    claimId: 'test-claim-uuid-1234'
  };

  try {
    let pdfBuffer;
    
    if (type === 'invoice') {
      pdfBuffer = await generateInvoicePDF({
        fullName: claimData.fullName,
        email: claimData.email,
        date: claimData.date,
        claimId: claimData.claimId
      });
    } else {
      pdfBuffer = await generateDemandPDF(claimData);
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="test_${type}.pdf"`
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
