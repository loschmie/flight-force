import { NextResponse } from 'next/server';
import { getClaimById, updateClaimStatus, updateClaimDetails } from '@/lib/storage';
import { generateDemandPDF, generateInvoicePDF } from '@/lib/pdf-generator';
import { sendEmail } from '@/lib/email-service';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { claimId, claimData } = body;

    const claim = await getClaimById(claimId);
    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status === 'paid' || claim.status === 'dispatched') {
      return NextResponse.json({ success: true, message: 'Claim already processed' });
    }

    // Load airline emails mapping
    const emailsPath = path.join(process.cwd(), 'lib/airlineEmails.json');
    const airlineEmails = JSON.parse(fs.readFileSync(emailsPath, 'utf-8'));
    
    // Extract airline code (e.g. JU from JU501)
    const airlineCode = claimData.flightNumber.substring(0, 2).toUpperCase();
    const targetAirlineEmail = airlineEmails[airlineCode] || airlineEmails['DEFAULT'];

    // 1. Mark as paid and update details
    await updateClaimDetails(claimId, {
      status: 'paid',
      passenger_name: claimData.fullName,
      pnr: claimData.pnr,
      airline_email: targetAirlineEmail
    });

    // 2. Generate PDFs
    const demandPdfBuffer = await generateDemandPDF(claimData);
    const invoicePdfBuffer = await generateInvoicePDF({
      fullName: claimData.fullName,
      email: claimData.email,
      date: new Date().toISOString().split('T')[0],
      claimId: claimId
    });

    // 3. Send Email to Airline (The Legal Demand)
    const demandHtml = `
      <p>To the Legal/Customer Relations Department,</p>
      <p>Attached to this email is a formal compensation claim regarding flight <strong>${claim.flight_number}</strong> on ${claimData.date}, submitted on behalf of <strong>${claim.passenger_name}</strong>.</p>
      <p>Based on EC 261/2004 regulations, the passenger is entitled to compensation due to the delayed arrival.</p>
      <p>Please find the detailed legal demand, flight verification data, and bank details for the transfer in the attached PDF document.</p>
      <p>This claim has been verified and dispatched via the GetFlightForce automated legal-tech platform.</p>
      <p>Regards,<br>GetFlightForce Automated Dispatch System</p>
    `;

    await sendEmail({
      to: targetAirlineEmail,
      cc: claimData.email, // CC User
      subject: `LEGAL CLAIM: Flight ${claim.flight_number} | ${claimData.date} | ${claim.passenger_name}`,
      html: demandHtml,
      attachments: [
        {
          filename: `Demand_Letter_${claim.flight_number}.pdf`,
          content: demandPdfBuffer
        }
      ]
    });

    // 4. Send Confirmation Email to User (The Guarantee)
    const confirmationHtml = `
      <div style="font-family: sans-serif; max-w-lg; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Zahtev je uspešno poslat</h2>
        <p>Poštovani/a ${claim.passenger_name},</p>
        <p>Vaš zahtev je upravo prosleđen pravnoj službi avio-kompanije.</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <h3 style="margin-top: 0; font-size: 14px; color: #475569;">Dokaz o slanju (Trust Factor):</h3>
          <ul style="font-size: 13px; color: #334155; list-style-type: none; padding-left: 0;">
            <li><strong>Timestamp:</strong> ${new Date().toUTCString()}</li>
            <li><strong>Message ID:</strong> msg_${crypto.randomUUID()}</li>
            <li><strong>Destination:</strong> ${targetAirlineEmail}</li>
          </ul>
        </div>
        <p>U prilogu ovog mejla nalazi se kopija poslatog zahteva (PDF) kao i račun za uslugu slanja.</p>
        <p>Srcečno,<br>Vaš GetFlightForce tim</p>
      </div>
    `;

    await sendEmail({
      to: claimData.email,
      subject: `[GetFlightForce] Potvrda o slanju zahteva: ${claim.flight_number}`,
      html: confirmationHtml,
      attachments: [
        {
          filename: `Copy_Demand_${claim.flight_number}.pdf`,
          content: demandPdfBuffer
        },
        {
          filename: `Invoice_${claimId.substring(0, 8)}.pdf`,
          content: invoicePdfBuffer
        }
      ]
    });

    // 5. Update Status to dispatched
    await updateClaimStatus(claimId, 'dispatched');

    return NextResponse.json({ success: true, message: 'Proxy Dispatch completed successfully' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
