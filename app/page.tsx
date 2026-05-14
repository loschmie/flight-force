import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex-1 w-full bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Stop Being Milked by Airlines.
        </h1>
        <p className="text-lg text-slate-600">
          Our 2026 Justice Engine helps you reclaim up to €600 in cash for delayed or cancelled flights. Fast, automated, and legally forceful.
        </p>
        <Link href="/check" className="inline-block w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all text-xl">
          Start Your Claim Now →
        </Link>
      </div>

      <div className="mt-12 text-center max-w-md w-full px-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Disclaimer: GetFlightForce is a self-help tool providing legal information, not legal advice. We are not a law firm. Use of this service is at your own risk.
        </p>
      </div>
    </main>
  );
}
