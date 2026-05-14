export function parseBCBP(barcodeData: string) {
  if (!barcodeData.startsWith('M1')) {
    throw new Error('Invalid BCBP format. Make sure you are scanning a valid boarding pass.');
  }

  try {
    const nameField = barcodeData.substring(2, 22).trim();
    const pnrField = barcodeData.substring(23, 30).trim();
    const from = barcodeData.substring(30, 33).trim();
    const to = barcodeData.substring(33, 36).trim();
    const carrier = barcodeData.substring(36, 39).trim();
    const flight = barcodeData.substring(39, 44).trim();
    const julianDateStr = barcodeData.substring(44, 47).trim();

    // Parse Name (Format: LASTNAME/FIRSTNAME)
    let firstName = '';
    let lastName = '';
    if (nameField.includes('/')) {
      const parts = nameField.split('/');
      lastName = parts[0].trim();
      firstName = parts[1].trim();
    } else {
      lastName = nameField;
    }
    
    // Capitalize properly: DOE -> Doe
    const capitalize = (s: string) => {
      if (!s) return '';
      return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };
    
    // Remove title (MR/MRS/MS) if appended to first name without space
    let cleanFirstName = firstName;
    if (firstName.endsWith('MR')) cleanFirstName = firstName.slice(0, -2).trim();
    else if (firstName.endsWith('MRS')) cleanFirstName = firstName.slice(0, -3).trim();
    else if (firstName.endsWith('MS')) cleanFirstName = firstName.slice(0, -2).trim();
    else if (firstName.endsWith('MISS')) cleanFirstName = firstName.slice(0, -4).trim();

    const fullName = cleanFirstName && lastName ? `${capitalize(cleanFirstName)} ${capitalize(lastName)}` : capitalize(lastName);

    const flightNumber = `${carrier}${flight.padStart(4, '0')}`.replace(/\s+/g, '');

    // Parse Julian Date into YYYY-MM-DD
    const now = new Date();
    let currentYear = now.getFullYear();
    
    // Calculate current day of year (1-365/366)
    const startOfYear = new Date(currentYear, 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const currentDayOfYear = Math.floor(diff / 1000 / 60 / 60 / 24);

    let flightDate = '';
    const julianDays = parseInt(julianDateStr, 10);
    if (!isNaN(julianDays)) {
      // Year rollover heuristic:
      // If we are early in the year (e.g. Feb, day < 60) and flight is late in year (e.g. Dec, day > 300)
      // -> Flight happened last year
      if (currentDayOfYear < 60 && julianDays > 300) {
        currentYear -= 1;
      } 
      // If we are late in the year (day > 300) and flight is early (day < 60)
      // -> Flight is early next year
      else if (currentDayOfYear > 300 && julianDays < 60) {
        currentYear += 1;
      }

      const date = new Date(currentYear, 0); // Jan 1st
      date.setDate(julianDays);
      flightDate = date.toISOString().split('T')[0];
    }

    return {
      flightNumber,
      date: flightDate,
      pnr: pnrField,
      fullName,
      from,
      to
    };
  } catch (err) {
    console.error("BCBP Parsing Error", err);
    throw new Error('Failed to parse boarding pass data.');
  }
}
