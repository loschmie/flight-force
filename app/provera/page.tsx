'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Provera() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/flight-check?flightNumber=${encodeURIComponent(flightNumber)}&date=${encodeURIComponent(date)}`);
      
      if (!res.ok) {
        throw new Error('Let nije pronađen ili je došlo do greške na serveru.');
      }
      
      const data = await res.json();

      if (data.error) {
        // Ako API padne, pitamo korisnika da li zeli da nastavi rucno
        const proceed = window.confirm(data.message + "\n\nDa li želite da nastavite i ručno preuzmete PDF sa pretpostavljenim parametrima?");
        if (!proceed) return;
      }

      if (data.eligible || data.error) {
        const queryParams = new URLSearchParams({
          name,
          flightNumber,
          date,
          delay: data.arrivalDelay.toString(),
          from: data.departureAirport || 'BEG',
          to: data.arrivalAirport || 'CDG'
        }).toString();
        
        router.push(`/rezultat?${queryParams}`);
      } else {
        setError('Nažalost, ovaj let nije podoban za odštetu (kašnjenje je manje od 240 minuta).');
      }
    } catch (err: any) {
      setError(err.message || 'Došlo je do neočekivane greške prilikom provere leta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            ← Nazad
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Unesite podatke o letu
          </h1>
          <p className="text-sm text-slate-500">
            Proverite da li imate pravo na odštetu u nekoliko sekundi.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Ime i prezime
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-50"
              placeholder="Petar Petrović"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="flightNumber" className="block text-sm font-medium text-slate-700">
              Broj leta (npr. W6 4051)
            </label>
            <input
              type="text"
              id="flightNumber"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all uppercase disabled:opacity-50 disabled:bg-slate-50"
              placeholder="W6 4051"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="date" className="block text-sm font-medium text-slate-700">
              Datum leta
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-50"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full mt-6 flex items-center justify-center gap-2 font-bold py-4 rounded-xl shadow-lg transition-all text-lg
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
                Proveravamo bazu...
              </>
            ) : (
              'Proveri status leta'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
