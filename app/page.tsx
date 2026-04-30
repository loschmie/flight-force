import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          Pobedite avio-kompanije. <span className="text-blue-600">Uzmite svoj novac.</span>
        </h1>
        <p className="text-lg text-slate-600">
          Besplatni alat za generisanje pravnih zahteva za odštetu (EU 261 / 2026 Reform).
        </p>
        <Link href="/provera" className="inline-block w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all text-xl">
          Proveri svoj let →
        </Link>
      </div>
    </main>
  );
}
