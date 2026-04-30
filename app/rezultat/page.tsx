"use client";

import { useSearchParams } from "next/navigation";
import { calculateCompensation } from "@/lib/compensation-logic";
import { getDistanceByIata } from "@/lib/haversine";
import { useState, Suspense } from "react";
import jsPDF from "jspdf";

function RezultatContent() {
  const searchParams = useSearchParams();
  const [liarCheck, setLiarCheck] = useState(false);
  const [iban, setIban] = useState("");

  // Podaci iz URL-a
  const flightNumber = searchParams.get("flightNumber") || searchParams.get("flight") || "Nepoznat";
  const delayMinutes = parseInt(searchParams.get("delay") || "0");
  const from = searchParams.get("from") || "BEG";
  const to = searchParams.get("to") || "CDG";
  const distance = Math.round(getDistanceByIata(from, to));
  const name = searchParams.get("name") || "[Ime Korisnika]";
  const date = searchParams.get("date") || "[Datum]";
  
  const delayHours = delayMinutes / 60;
  
  // Pretpostavljamo regiju na osnovu rute (EU_ECAA)
  const result = calculateCompensation(distance, delayHours, 'EU_ECAA'); 
  const isAirSerbia = flightNumber.toUpperCase().startsWith('JU');

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Subject: Compensation claim for flight ${flightNumber} on ${date}`, 20, 20);
    
    doc.setFontSize(12);
    
    let text = `To the Legal Department,\n\n`;
    text += `I am writing to formally request compensation for the delayed arrival of flight ${flightNumber}. The flight arrived ${Math.floor(delayHours)} hours late at ${to}.\n\n`;
    text += `According to Regulation (EC) No 261/2004 (amended 2026), I am entitled to ${result.amount} ${result.currency} per passenger.\n\n`;
    text += `Regarding your potential defenses:\n`;
    text += `Be advised that per recent CJEU rulings (including 2024-2026 precedents), internal technical faults and crew shortages are part of the normal exercise of the carrier's activity and do not constitute 'extraordinary circumstances'.\n\n`;
    
    if (isAirSerbia) {
      text += `Since the airline is Air Serbia, I am also referencing the European Common Aviation Area (ECAA) Multilateral Agreement which binds the application of EU regulations.\n\n`;
    }

    if (liarCheck) {
      text += `I also demand an official report regarding the reason for the delay with concrete evidence from the relevant authorities, as I was verbally informed about extraordinary circumstances at the airport.\n\n`;
    }

    text += `Please remit the payment to the following account within 14 days.\n\n`;
    text += `Account Details (IBAN/SWIFT):\n${iban || '______________________________'}\n\n`;
    text += `Sincerely,\n${name}`;

    const splitText = doc.splitTextToSize(text, 170);
    doc.text(splitText, 20, 35);

    doc.save(`Zahtev_Odsteta_${flightNumber.replace(/\s+/g, '')}.pdf`);
  };

  return (
    <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl p-8 mt-10 border border-slate-100">
      <h1 className="text-2xl font-bold text-slate-800 text-center">Vaša procenjena odšteta</h1>
      
      <div className="my-8 text-center">
        <span className="text-7xl font-black text-blue-600 tracking-tighter">
          {result.amount}{result.currency === 'EUR' ? '€' : result.currency}
        </span>
        <p className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-sm">
          Po regulativi {result.rule}
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 mb-8">
        <h3 className="font-bold text-blue-900 mb-2">Detalji analize:</h3>
        <ul className="text-blue-800 space-y-1 opacity-90">
          <li>• Let: <strong>{flightNumber}</strong></li>
          <li>• Udaljenost: <strong>{distance} km</strong></li>
          <li>• Kašnjenje: <strong>{Math.floor(delayHours)}h {delayMinutes % 60}min</strong></li>
          <li>• Status: <span className="text-green-600 font-bold font-mono">POTVRĐENO</span></li>
        </ul>
      </div>

      {/* LIAR DETECTOR I IBAN SEKCIJA */}
      <div className="border-t border-b border-slate-100 py-6 mb-8 space-y-6">
        <label className="flex items-start gap-4 cursor-pointer">
          <input 
            type="checkbox" 
            checked={liarCheck}
            onChange={() => setLiarCheck(!liarCheck)}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
          />
          <span className="text-slate-600 text-sm">
            Potvrđujem da mi je avio-kompanija usmeno saopštila razlog kašnjenja (npr. štrajk, vreme ili kvar) i želim da sistem proveri istinitost te tvrdnje u zahtevu.
          </span>
        </label>

        <div className="space-y-2">
          <label htmlFor="iban" className="block text-sm font-bold text-slate-700">
            Gde želite da vam legne novac? (IBAN/SWIFT)
          </label>
          <input
            type="text"
            id="iban"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono text-sm uppercase"
            placeholder="RS35 1600 0000 0000 00"
          />
          <p className="text-xs text-slate-400">*Podatak se ne čuva na serveru i koristi se ISKLJUČIVO za generisanje PDF-a na vašem uređaju.</p>
        </div>
      </div>

      <button
        disabled={!liarCheck}
        onClick={generatePDF}
        className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-black disabled:bg-slate-300 transition-all text-lg"
      >
        GENERISI PRAVNI ZAHTEV (PDF)
      </button>
      
      <p className="text-center text-slate-400 text-xs mt-6">
        *Ovaj dokument je generisan na osnovu zvaničnih pravila za 2026. godinu. 
        Niste u obavezi da prihvatite vaučere umesto ovog iznosa.
      </p>

      {/* UPSELL / AFFILIATE SEKCIJA */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 border border-blue-100 rounded-3xl p-8 mt-8 shadow-inner relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 group-hover:opacity-30 transition-all"></div>
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Too busy to fight the airline yourself?</h3>
        <p className="text-sm text-slate-600 text-center mb-6 px-2">
          Kompanije često ignorišu zahteve mesecima. Pusti naše pravne partnere da završe posao za tebe kroz sudski proces.
        </p>
        <a 
          href="https://www.airhelp.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-white border-2 border-blue-600 text-blue-700 font-extrabold py-4 rounded-xl shadow-sm hover:bg-blue-50 hover:shadow-md transition-all text-center"
        >
          Let our partners handle it
          <span className="bg-blue-100 text-blue-800 text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ml-1">No Win - No Fee</span>
        </a>
      </div>
    </div>
  );
}

export default function RezultatPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <Suspense fallback={<div className="mt-10 text-slate-500">Učitavanje podataka o odšteti...</div>}>
        <RezultatContent />
      </Suspense>
    </main>
  );
}
