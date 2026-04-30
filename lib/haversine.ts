export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radijus zemlje u kilometrima
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export interface Airport {
  iata: string;
  lat: number;
  lon: number;
}

// Baza najčešćih aerodroma za brzu frontend kalkulaciju (u produkciji bi se učitavao pun JSON fajl)
export const AIRPORT_DB: Record<string, Airport> = {
  BEG: { iata: 'BEG', lat: 44.8184, lon: 20.3091 }, // Beograd
  CDG: { iata: 'CDG', lat: 49.0097, lon: 2.5479 },  // Pariz
  FRA: { iata: 'FRA', lat: 50.0333, lon: 8.5705 },  // Frankfurt
  LHR: { iata: 'LHR', lat: 51.4700, lon: -0.4543 }, // London Heathrow
  VIE: { iata: 'VIE', lat: 48.1103, lon: 16.5697 }, // Bec
  JFK: { iata: 'JFK', lat: 40.6413, lon: -73.7781 }, // Njujork
  ZRH: { iata: 'ZRH', lat: 47.4647, lon: 8.5492 },  // Cirih
  MUC: { iata: 'MUC', lat: 48.3538, lon: 11.7861 }, // Minhen
  AMS: { iata: 'AMS', lat: 52.3086, lon: 4.7639 },  // Amsterdam
  MAD: { iata: 'MAD', lat: 40.4983, lon: -3.5676 }, // Madrid
  BCN: { iata: 'BCN', lat: 41.2974, lon: 2.0833 },  // Barselona
  FCO: { iata: 'FCO', lat: 41.8003, lon: 12.2389 }, // Rim FCO
  IST: { iata: 'IST', lat: 41.2753, lon: 28.7519 }, // Istanbul
  DXB: { iata: 'DXB', lat: 25.2532, lon: 55.3657 }, // Dubai
  LAX: { iata: 'LAX', lat: 33.9416, lon: -118.4085 }, // Los Andjeles
  // Dodati još po potrebi...
};

export function getDistanceByIata(iata1: string, iata2: string): number {
  const ap1 = AIRPORT_DB[iata1.toUpperCase()];
  const ap2 = AIRPORT_DB[iata2.toUpperCase()];
  
  if (ap1 && ap2) {
    return calculateHaversineDistance(ap1.lat, ap1.lon, ap2.lat, ap2.lon);
  }
  
  // Ukoliko aerodrom nije u DB, vraćamo podrazumevanih 2000km kao sigurnu sredinu 
  // za EU letove dok se baza ne proširi.
  return 2000;
}
