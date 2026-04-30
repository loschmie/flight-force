export async function checkWeather(airportIata: string): Promise<boolean> {
  const apiKey = process.env.CHECKWX_API_KEY;
  if (!apiKey) return true; // Fallback to true if API key is missing

  try {
    const res = await fetch(`https://api.checkwx.com/metar/${airportIata}/decoded`, {
      headers: {
        'X-API-Key': apiKey
      },
      next: { revalidate: 3600 } // Cache for 1 hour to save API calls
    });

    if (!res.ok) {
      console.error('CheckWX API error:', res.statusText);
      return true; // Fallback
    }

    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      const flightCategory = data.data[0].flight_category;
      // VFR means Visual Flight Rules (clear weather)
      if (flightCategory === 'VFR') {
        return true; // Weather is clear
      }
      return false; // Weather is problematic (IFR, LIFR, etc.)
    }

    return true; // Fallback if no METAR data
  } catch (err) {
    console.error('Failed to fetch METAR:', err);
    // Always return true (Clear) as fallback so we don't accidentally excuse the airline
    return true; 
  }
}
