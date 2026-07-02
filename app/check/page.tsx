'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Provera() {
  const router = useRouter();
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Scanner states
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  
  const [pnr, setPnr] = useState('');
  const [fullName, setFullName] = useState('');

  const closeScanner = () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 /* SCANNING */ || state === 3 /* PAUSED */) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
            scannerRef.current = null;
          }).catch((err: unknown) => {
            console.error("Error stopping scanner", err);
          });
        } else {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
    }
    setIsLiveScanning(false);
    setScanStatus('');
  };

  useEffect(() => {
    if (isLiveScanning) {
      let isMounted = true;
      
      const initScanner = async () => {
        try {
          const { Html5Qrcode } = await import('html5-qrcode');
          
          if (!isMounted || scannerRef.current) return;
          
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          setScanStatus('Initializing camera...');
          
          // PDF417 is the standard for Boarding Passes, but sometimes Aztec or QR is used
          const config = { 
            fps: 10, 
            qrbox: { width: 300, height: 150 },
            aspectRatio: 1.0,
          };
          
          await html5QrCode.start(
            { facingMode: "environment" },
            config,
            async (decodedText: string) => {
              if (html5QrCode.getState() === 2) {
                html5QrCode.pause(); // Pause to prevent rapid-fire scanning
              }
              
              setScanStatus('Barcode recognized! Parsing...');
              
              try {
                const { parseBCBP } = await import('@/lib/bcbp-parser');
                const data = parseBCBP(decodedText);
                
                setFlightNumber(data.flightNumber);
                setDate(data.date);
                setPnr(data.pnr);
                setFullName(data.fullName);
                
                setScanStatus('Success! Closing scanner...');
                
                // Auto-close after a short delay for good UX
                setTimeout(() => {
                  closeScanner();
                }, 1000);
                
              } catch (err) {
                console.error('Parse Error:', err);
                setError('Barcode is not a valid Boarding Pass.');
                if (html5QrCode.getState() === 3) {
                  html5QrCode.resume(); // Resume scanning if invalid
                }
                setScanStatus('Scanning...');
              }
            },
            (errorMessage: string) => {
              // Ignore constant "no barcode found" errors
              if (isMounted) {
                // To avoid dependency warning, we don't check scanStatus here, 
                // just set it if we want to default to 'Scanning...'
              }
            }
          );
        } catch (err) {
          console.error("Camera start error", err);
          setError('Could not access camera. Please allow camera permissions.');
          closeScanner();
        }
      };

      initScanner();

      return () => {
        isMounted = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveScanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/flight-check?flightNumber=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(date)}`);
      
      const data = await res.json();

      if (data.error) {
        const proceed = window.confirm(data.message + "\n\nDo you want to proceed manually and generate a PDF with default parameters?");
        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }

      if (data.eligible || data.error) {
        
        // CREATE CLAIM AS PENDING IN DB (Capture Lead)
        let claimId = '';
        try {
          const createRes = await fetch('/api/claims/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              flightNumber, 
              fullName: fullName || 'Unknown Passenger', 
              pnr: pnr || 'UNKNOWN', 
              airlineEmail: 'claims@getflightforce.com' 
            })
          });
          const createData = await createRes.json();
          if (createData.success) {
            claimId = createData.claimId;
          }
        } catch (dbErr) {
          console.error("Failed to create claim lead:", dbErr);
        }

        const queryParams = new URLSearchParams({
          flightNumber,
          date,
          pnr,
          fullName,
          claimId,
          delay: data.arrivalDelay?.toString() || '240',
          from: data.departureAirport || 'BEG',
          to: data.arrivalAirport || 'CDG',
          weather: data.weatherClear !== false ? '1' : '0',
          ops: data.opsNormal !== false ? '1' : '0'
        }).toString();
        
        router.push(`/result?${queryParams}`);
      } else {
        setError('Delay too short for compensation.');
      }
    } catch (err) {
      console.error(err);
      setError('Flight not found.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans relative">
      
      {/* LIVE SCANNER MODAL */}
      {isLiveScanning && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative shadow-2xl flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center z-10 shadow-md">
              <h3 className="font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                Scan Boarding Pass
              </h3>
              <button onClick={closeScanner} className="text-slate-300 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            {/* SCANNER VIEWPORT */}
            <div className="relative bg-black w-full" style={{ minHeight: '300px' }}>
              <div id="reader" className="w-full h-full object-cover"></div>
              
              {/* TARGET OVERLAY (Visual only) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[300px] h-[150px] border-2 border-blue-500/50 rounded-xl relative">
                  {/* Scanning Animation Line */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] animate-[scan_2s_ease-in-out_infinite]"></div>
                  
                  {/* Corner Markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                </div>
              </div>
            </div>

            <div className="p-5 text-sm font-bold text-slate-700 bg-slate-50 flex items-center justify-center gap-3 border-t border-slate-100">
               {scanStatus === 'Initializing camera...' ? (
                 <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : scanStatus.includes('Success') ? (
                 <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
               ) : (
                 <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
               )}
               {scanStatus || 'Point camera at the barcode (PDF417 / QR)'}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 space-y-6 border border-slate-100">
        <div className="space-y-2">
          <Link href="/" className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
            Flight Details
          </h1>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Scan your boarding pass or enter details manually to check compensation eligibility.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2 flex items-start gap-3">
             <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="pb-4">
            <button 
              type="button"
              onClick={() => setIsLiveScanning(true)}
              className="w-full font-bold py-5 rounded-2xl border-2 border-dashed border-blue-200 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:border-blue-400 group"
              disabled={isLoading}
            >
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <span>Open Live Scanner</span>
            </button>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or enter manually</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="flightNumber" className="block text-sm font-bold text-slate-700">
              Flight Number
            </label>
            <input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-5 min-h-[56px] rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all uppercase disabled:opacity-50 disabled:bg-slate-50 text-lg font-medium"
              placeholder="e.g. JU501"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="date" className="block text-sm font-bold text-slate-700">
              Departure Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-5 min-h-[56px] rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all disabled:opacity-50 disabled:bg-slate-50 text-lg font-medium text-slate-700"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full mt-8 flex items-center justify-center gap-2 font-black min-h-[64px] rounded-2xl shadow-xl transition-all text-lg tracking-wide
              ${isLoading 
                ? 'bg-blue-400 text-white cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25 hover:-translate-y-1 active:translate-y-0'
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ANALYZING FLIGHT...
              </>
            ) : (
              'CHECK ELIGIBILITY'
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center max-w-md w-full px-4">
        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          Disclaimer: GetFlightForce is a self-help tool providing legal information, not legal advice. We are not a law firm. Use of this service is at your own risk.
        </p>
      </div>
    </main>
  );
}
