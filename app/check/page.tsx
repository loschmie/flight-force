'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Provera() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setError('');
    setScanStatus('Loading OCR engine...');

    try {
      const Tesseract = (await import('tesseract.js')).default;
      setScanStatus('Analyzing image locally...');
      
      const result = await Tesseract.recognize(file, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setScanStatus(`Analyzing... ${Math.floor(m.progress * 100)}%`);
          }
        }
      });
      
      const text = result.data.text;
      
      const flightRegex = /\b([A-Z]{2}|[A-Z][0-9]|[0-9][A-Z])\s*(\d{3,4})\b/i;
      const flightMatch = text.match(flightRegex);
      
      if (flightMatch) {
        const cleanedFlight = (flightMatch[1] + flightMatch[2]).toUpperCase();
        setFlightNumber(cleanedFlight);
      } else {
        setError('Could not automatically detect flight number. Please check the image or enter manually.');
      }

      const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4}?)\b/i;
      const dateMatch = text.match(dateRegex);
      
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          const formattedDate = parsedDate.toISOString().split('T')[0];
          setDate(formattedDate);
        }
      }
      
    } catch (err) {
      console.error('OCR Error:', err);
      setError('An error occurred during image scan. Please enter details manually.');
    } finally {
      setIsScanning(false);
      setScanStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
        const queryParams = new URLSearchParams({
          name,
          flightNumber,
          date,
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
    } catch (err: any) {
      setError('Flight not found.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Enter Flight Details
          </h1>
          <p className="text-sm text-slate-500">
            Check if you're eligible for compensation in seconds.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isScanning && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100 flex items-center justify-center gap-3 animate-pulse">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {scanStatus}
            </div>
          )}

          <div className="border-b border-slate-100 pb-6 mb-6">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              ref={fileInputRef} 
              onChange={handleImageScan} 
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isScanning}
              className="w-full bg-slate-100 text-slate-800 font-bold py-4 rounded-xl border border-slate-300 hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Scan Boarding Pass
            </button>
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-50"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="flightNumber" className="block text-sm font-medium text-slate-700">
              Flight Number (e.g. JU501)
            </label>
            <input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase disabled:opacity-50 disabled:bg-slate-50"
              placeholder="JU501"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-slate-700">
              Departure Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 min-h-[48px] rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || isScanning}
            className={`w-full mt-6 flex items-center justify-center gap-2 font-bold min-h-[56px] rounded-xl shadow-lg transition-all text-lg
              ${isLoading 
                ? 'bg-blue-400 text-white cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25 hover:-translate-y-0.5 active:translate-y-0'
              }
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing flight data from 2026 database...
              </>
            ) : (
              'CHECK ELIGIBILITY'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
