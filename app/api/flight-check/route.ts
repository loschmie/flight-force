import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flightNumber = searchParams.get('flightNumber');
  const date = searchParams.get('date');

  const apiKey = process.env.AVIATIONSTACK_API_KEY || 'YOUR_API_KEY';
  
  try {
    const res = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}`);
    
    // Ako API baci HTTP grešku (npr. limit prekoračen)
    if (!res.ok) {
      throw new Error('Aviationstack API Error');
    }

    const data = await res.json();
    const flight = data.data?.[0];

    // Ako API ne vrati podatke za dati let
    if (!flight) {
      throw new Error('Flight not found in API');
    }

    const arrivalDelay = flight.arrival.delay || 0;
    const isEligible = arrivalDelay > 240;

    return NextResponse.json({
      arrivalDelay,
      status: flight.flight_status,
      departureAirport: flight.departure.iata,
      arrivalAirport: flight.arrival.iata,
      eligible: isEligible
    });

  } catch (error) {
    // Umesto "Internal Server Error" (500), vraćamo sigurnosnu poruku i statične fallback podatke
    // Kako frontend ne bi pukao i kako bi korisniku omogućio ručni nastavak generisanja dokumenta.
    return NextResponse.json({ 
      error: true,
      message: 'Trenutno ne možemo automatski da potvrdimo let, ali možete ručno uneti podatke da biste generisali dokument.',
      // Vraćamo dummy podatke kako bi forma u provera/page.tsx mogla da obradi ovo i ne pukne
      eligible: true, 
      arrivalDelay: 250, 
      departureAirport: 'BEG', 
      arrivalAirport: 'CDG'
    }, { status: 200 }); 
    // Status 200 vraćamo namerno da bi React fetch blok to prepoznao kao validan JSON odgovor
    // a ne kao mrežno "pucanje". U realnoj aplikaciji ovde može ići 404 ili 429 status.
  }
}
