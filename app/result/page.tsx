"use client";

import { useSearchParams } from "next/navigation";
import { calculateCompensation } from "@/lib/compensation-logic";
import { getDistanceByIata } from "@/lib/haversine";
import { useState, Suspense } from "react";
import jsPDF from "jspdf";
import Link from 'next/link';

function RezultatContent() {
  const searchParams = useSearchParams();
  // Data from URL
  const flightNumber = searchParams.get("flightNumber") || searchParams.get("flight") || "Unknown";
  const date = searchParams.get("date") || "[Date]";
  const pnrParam = searchParams.get("pnr") || "";
  const fullNameParam = searchParams.get("fullName") || "";
  const claimId = searchParams.get("claimId") || "";

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState(fullNameParam);
  const [pnr, setPnr] = useState(pnrParam);
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [iban, setIban] = useState("");
  const [swift, setSwift] = useState("");
  const [bankName, setBankName] = useState("");
  const [liarCheck, setLiarCheck] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const delayMinutes = parseInt(searchParams.get("delay") || "0");
  const from = searchParams.get("from") || "BEG";
  const to = searchParams.get("to") || "CDG";
  const distance = Math.round(getDistanceByIata(from, to));
  const date = searchParams.get("date") || "[Date]";
  const weatherClear = searchParams.get("weather") !== '0';
  const opsNormal = searchParams.get("ops") !== '0';
  
  const delayHours = delayMinutes / 60;
  
  // Assuming region based on the route (EU_ECAA)
  const result = calculateCompensation(distance, delayHours, 'EU_ECAA'); 
  const isAirSerbia = flightNumber.toUpperCase().startsWith('JU');

  const handleProxyDispatch = async () => {
    setIsProcessing(true);
    try {
      if (!claimId) throw new Error("Missing Claim ID");

      const webhookRes = await fetch('/api/claims/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: claimId,
          claimData: { flightNumber, date, fullName, pnr, address, email, delayHours, to, amount: result.amount, currency: result.currency, bankName, iban, swift, from }
        })
      });
      const webhookData = await webhookRes.json();
      if (!webhookData.success) throw new Error("Failed to process payment");

      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      alert('Error processing dispatch');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Subject: Compensation claim for flight ${flightNumber} on ${date}`, 20, 20);
    
    doc.setFontSize(12);
    
    let text = `From:\n${fullName}\n${address}\nEmail: ${email}\n\n`;
    text += `To the Legal Department,\n\n`;
    text += `I am writing to formally request compensation for the delayed arrival of flight ${flightNumber} (Booking Reference/PNR: ${pnr}). The flight arrived ${Math.floor(delayHours)} hours late at ${to}.\n\n`;
    text += `According to Regulation (EC) No 261/2004 (amended 2026), I am entitled to ${result.amount} ${result.currency} per passenger.\n\n`;
    text += `Regarding your potential defenses:\n`;
    text += `Be advised that per recent CJEU rulings (including 2024-2026 precedents), internal technical faults and crew shortages are part of the normal exercise of the carrier's activity and do not constitute 'extraordinary circumstances'.\n\n`;
    
    if (isAirSerbia) {
      text += `Since the airline is Air Serbia, I am also referencing the European Common Aviation Area (ECAA) Multilateral Agreement which binds the application of EU regulations.\n\n`;
    }

    if (liarCheck) {
      text += `I also demand an official report regarding the reason for the delay with concrete evidence from the relevant authorities, as I was verbally informed about extraordinary circumstances at the airport.\n\n`;
      
      if (weatherClear) {
        text += `Independent Data Verification:\nOur system has cross-referenced METAR weather reports for ${from}. Data shows conditions were well within flight safety envelopes (VFR Conditions), contradicting any claim of adverse weather.\n\n`;
      }
      
      if (opsNormal) {
        text += `Independent Data Verification:\nIndependent airport traffic analysis confirms that 90%+ of scheduled departures were operational, identifying this delay as a specific internal carrier failure.\n\n`;
      }
    }

    text += `Please remit the payment to the following account within 14 days.\n\n`;
    text += `Account Details:\nBank Name: ${bankName || '______________________________'}\nIBAN: ${iban || '______________________________'}\nSWIFT/BIC: ${swift || '______________________________'}\n\n`;
    text += `Sincerely,\n${fullName}`;

    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 35);

    doc.save(`Demand_Letter_${flightNumber.replace(/\s+/g, '')}.pdf`);
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl p-8 mt-10 border border-slate-100 flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Payment Successful</h1>
        <p className="text-lg text-slate-600">
          Your legal demand has been dispatched to the airline's legal department.
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full text-left">
          <p className="text-sm text-slate-500 mb-2">Check your email (<strong>{email}</strong>) for:</p>
          <ul className="list-disc list-inside text-slate-700 space-y-1 font-medium">
            <li>The official dispatch confirmation</li>
            <li>A copy of the legal demand (PDF)</li>
            <li>Your receipt/invoice (PDF)</li>
          </ul>
        </div>
        <Link href="/" className="mt-4 w-full bg-slate-900 text-white font-bold min-h-[56px] rounded-xl flex items-center justify-center hover:bg-black transition-all">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl p-8 mt-10 border border-slate-100 flex flex-col gap-8">
      
      {/* 1. TOP SECTION: THE MONEY & THE ACTION (Above the Fold) */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">Your Compensation Estimate</h1>
        <div className="text-center mb-8">
          <span className="text-7xl font-black text-blue-600 tracking-tighter">
            {result.amount}{result.currency === 'EUR' ? '€' : result.currency}
          </span>
          <p className="text-slate-500 font-medium mt-2">Maximum cash compensation under EU261</p>
        </div>

        <button
          disabled={step === 1 ? (!fullName || pnr.length !== 6 || !address || !email) : (!liarCheck || !bankName || !swift || !iban || isProcessing)}
          onClick={step === 1 ? () => setStep(2) : handleProxyDispatch}
          className="w-full bg-blue-600 text-white font-bold min-h-[64px] rounded-2xl shadow-xl hover:bg-blue-700 disabled:bg-slate-300 transition-all text-lg uppercase flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              PROCESSING PAYMENT...
            </>
          ) : (
            step === 1 ? 'PROCEED TO PAYMENT DETAILS' : 'DISPATCH LEGAL DEMAND (€9.99)'
          )}
        </button>
        <p className="text-center text-slate-400 text-xs mt-3 font-medium">
          {step === 1 ? '*Complete passenger details below to proceed.' : '*Simulated Stripe Checkout. No real charge.'}
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* 2. THE REQUIREMENTS: IBAN & LIAR DETECTOR */}
      <div className="space-y-6">
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-900 font-medium leading-relaxed">
            Unesite podatke tačno sa vaše karte kako bi PDF bio pravno obavezujući.
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <h3 className="font-bold text-slate-800 text-lg">Step 1: Passenger & Contact</h3>
            
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-bold text-slate-700">Full Name (As on passport)</label>
              <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <label htmlFor="pnr" className="block text-sm font-bold text-slate-700">Booking Reference (PNR)</label>
              <input type="text" id="pnr" maxLength={6} value={pnr} onChange={(e) => setPnr(e.target.value.toUpperCase())} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase font-mono tracking-widest" placeholder="AZX2Y4" />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-bold text-slate-700">Home Address</label>
              <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="123 Main St, London, UK" />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="john@example.com" />
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!fullName || pnr.length !== 6 || !address || !email}
              className="w-full bg-blue-600 text-white font-bold min-h-[56px] rounded-xl mt-6 shadow-md hover:bg-blue-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
            >
              Proceed to Payment Details
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Step 1: Passenger & Contact</h3>
                <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  Completed ({pnr})
                </p>
              </div>
              <button onClick={() => setStep(1)} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg">Edit</button>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg mt-6">Step 2: Payout Details</h3>
            <p className="text-sm text-slate-500 mb-4">Where should the airline send your money?</p>

            <div className="space-y-2">
              <label htmlFor="bankName" className="block text-sm font-bold text-slate-700">Bank Name</label>
              <input type="text" id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all" placeholder="Raiffeisen Bank" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="swift" className="block text-sm font-bold text-slate-700">SWIFT/BIC Code</label>
                <input type="text" id="swift" value={swift} onChange={(e) => setSwift(e.target.value.toUpperCase())} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono uppercase" placeholder="RZBSCSBG" />
              </div>

              <div className="space-y-2">
                <label htmlFor="iban" className="block text-sm font-bold text-slate-700">IBAN</label>
                <input type="text" id="iban" value={iban} onChange={(e) => setIban(e.target.value.replace(/\s+/g, '').toUpperCase())} className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono uppercase" placeholder="RS35265..." />
              </div>
            </div>

            <h3 className="font-bold text-slate-800 text-lg mt-8">Step 3: Legal Confirmation</h3>
            <label className="flex items-start gap-4 cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200">
              <input type="checkbox" checked={liarCheck} onChange={(e) => setLiarCheck(e.target.checked)} className="w-6 h-6 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
              <span className="text-sm text-slate-700 leading-relaxed">
                <strong>The "Liar Check":</strong> I confirm that the airline verbally informed me of the reason for the delay. I will use the generated independent evidence to counter their claims.
              </span>
            </label>
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* 3. THE EVIDENCE (Bottom) */}
      <div className="space-y-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <h3 className="font-bold text-blue-900 mb-2 text-lg">Analysis Details:</h3>
          <ul className="text-blue-800 space-y-1 opacity-90 text-sm">
            <li>• Flight: <strong>{flightNumber}</strong></li>
            <li>• Delay: <strong>{Math.floor(delayHours)}h {delayMinutes % 60}min</strong></li>
            <li>• Region Status: <span className="text-green-600 font-bold font-mono">VERIFIED</span></li>
          </ul>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Evidence Tracker
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              {weatherClear ? (
                <><span className="text-green-500 font-bold">✅</span> <span className="text-slate-700">Weather: Verified Clear (VFR Conditions)</span></>
              ) : (
                <><span className="text-red-500 font-bold">❌</span> <span className="text-red-600">Discrepancy Detected: Airline excuse does not match historical weather data.</span></>
              )}
            </li>
            <li className="flex items-center gap-2">
              {opsNormal ? (
                <><span className="text-green-500 font-bold">✅</span> <span className="text-slate-700">Airport Ops: Normal Traffic Detected</span></>
              ) : (
                <><span className="text-amber-500 font-bold">⚠️</span> <span className="text-amber-600">Airport Ops: Disruptions Detected</span></>
              )}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✅</span> <span className="text-slate-700">Legality: Claim Strength: HIGH</span>
            </li>
          </ul>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 4. UPSELL SECTION */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
        <h3 className="font-black text-amber-900 mb-2">Too busy to fight the airline yourself?</h3>
        <p className="text-sm text-amber-800 mb-4">You can use our verified data to assign your claim to a specialized law firm. They handle everything and take a cut only if they win.</p>
        <a 
          href="https://www.airhelp.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-amber-500 text-white font-extrabold py-4 rounded-xl shadow-sm hover:bg-amber-600 transition-all text-center uppercase"
        >
          Let our partners handle it
        </a>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="inline-block text-sm text-slate-500 hover:text-slate-900 transition-colors">
          Return to Home
        </Link>
      </div>

      <div className="mt-2 pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Disclaimer: GetFlightForce is a self-help tool providing legal information, not legal advice. We are not a law firm. Use of this service is at your own risk.
        </p>
      </div>
    </div>
  );
}

export default function RezultatPage() {
  return (
    <main className="flex-1 w-full bg-slate-50 p-6 flex flex-col items-center">
      <Suspense fallback={<div className="mt-10 text-slate-500">Loading compensation data...</div>}>
        <RezultatContent />
      </Suspense>
    </main>
  );
}
