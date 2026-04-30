import { NextResponse } from 'next/server';
import { checkWeather } from '@/lib/weather-check';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const flightNumber = searchParams.get('flightNumber');
  const date = searchParams.get('date');

  const apiKey = process.env.AVIATIONSTACK_API_KEY || 'YOUR_API_KEY';
  
  try {
    // SRE Optimization: Caching za 15 minuta (900 sekundi) kako bi se štedeli besplatni API krediti
    // Ako više korisnika pretražuje isti let, dobiće keširan odgovor
    const res = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${flightNumber}`, {
      next: { revalidate: 900 }
    });
    
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

    // 1. Weather Verification
    const weatherClear = await checkWeather(flight.departure.iata);

    // 2. Operational Verification (Pattern Recognition)
    let opsNormal = true; // Pretpostavljamo da je normalno dok ne dokažemo drugačije
    try {
      // Keširanje i za ops verifikaciju (900 sekundi)
      const opsRes = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${flight.departure.iata}`, {
        next: { revalidate: 900 }
      });
      if (opsRes.ok) {
        const opsData = await opsRes.json();
        const otherFlights = opsData.data || [];
        
        if (otherFlights.length > 0) {
          // Brojimo letove koji su otkazani ili aktivno u problemu
          let failedCount = 0;
          for (let i = 0; i < otherFlights.length; i++) {
            if (otherFlights[i].flight_status === 'cancelled') {
              failedCount++;
            }
          }
          const successRate = (otherFlights.length - failedCount) / otherFlights.length;
          
          // Ako je vise od 90% letova uspelo, ops je normalan
          if (successRate >= 0.90) {
            opsNormal = true;
          } else {
            opsNormal = false;
          }
        }
      }
    } catch (e) {
      console.error('Ops verification failed', e);
    }

    return NextResponse.json({
      arrivalDelay,
      status: flight.flight_status,
      departureAirport: flight.departure.iata,
      arrivalAirport: flight.arrival.iata,
      eligible: isEligible,
      weatherClear,
      opsNormal
    });

  } catch (error) {
    // Umesto "Internal Server Error" (500), vraćamo sigurnosnu poruku i statične fallback podatke
    // Kako frontend ne bi pukao i kako bi korisniku omogućio ručni nastavak generisanja dokumenta.
    return NextResponse.json({ 
      error: true,
      message: 'We are currently unable to automatically verify this flight. However, you can proceed manually to generate your demand letter.',
      // Vraćamo dummy podatke kako bi forma u check/page.tsx mogla da obradi ovo i ne pukne
      eligible: true, 
      arrivalDelay: 250, 
      departureAirport: 'BEG', 
      arrivalAirport: 'CDG',
      weatherClear: true,
      opsNormal: true
    }, { status: 200 }); 
    // Status 200 vraćamo namerno da bi React fetch blok to prepoznao kao validan JSON odgovor
    // a ne kao mrežno "pucanje". U realnoj aplikaciji ovde može ići 404 ili 429 status.
  }
}
