# GetFlightForce: 2026 Flight Compensation & Refund Tool ✈️⚖️

GetFlightForce is a high-performance Next.js (App Router) LegalTech application designed to help passengers fight back against airlines. It automatically verifies flight data, checks historical weather conditions, analyzes airport traffic, and generates legally forceful PDF demand letters based on the EC 261/2004 Regulation and US DOT mandates.

## 🔥 Key Features

### 1. The "Truth Engine"
- **Weather Verification (METAR)**: Automatically fetches raw historical pilot weather data (VFR conditions) via CheckWX to aggressively counter false "adverse weather" airline excuses.
- **Operational Pattern Recognition**: Analyzes overall airport departure traffic. If 90%+ of flights departed successfully, it flags the delay as a specific internal carrier failure.

### 2. OCR Boarding Pass Scanner
- Uses **Tesseract.js** (WebAssembly) to allow users to scan their physical or digital boarding pass using their phone's camera.
- Automatically extracts the IATA Flight Number and Date using regular expressions.
- **100% Private**: Image processing happens strictly in the client's browser—images never touch our servers.

### 3. PWA & "Airport Mode" UX
- **Progressive Web App (PWA)**: Users can install GetFlightForce directly to their iOS/Android home screens. A built-in Service Worker (`sw.js`) caches the core app shell to ensure the app loads even if the airport Wi-Fi drops.
- **Thumb-Friendly Design**: Touch targets (buttons, inputs) are oversized (min 48px-64px) for easy tapping while walking through an airport with luggage.
- **Safe Area Support**: Fully optimized for the iPhone notch and bottom home indicator.

### 4. Client-Side Legal Document Generator
- Provides an **Evidence Tracker** UI to summarize the strength of the claim.
- Uses `jsPDF` to generate an authoritative legal demand letter directly in the browser. 
- Sensitive IBAN and personal data **never** touch the server (GDPR compliant).

### 5. Built-in Monetization
- Includes an integrated "No Win - No Fee" affiliate section (e.g., AirHelp) positioned strategically for users who prefer legal partners to handle the lawsuit through litigation.

## 🚀 Local Development Setup

1. Open your terminal and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the root directory and add your API keys:
   ```env
   AVIATIONSTACK_API_KEY=your_aviationstack_key
   CHECKWX_API_KEY=your_checkwx_key
   ```
   *You can get free API keys by registering at [Aviationstack](https://aviationstack.com/) and [CheckWX](https://www.checkwxapi.com/).*

3. Start the local server:
   ```bash
   npm run dev
   ```

## 🌍 Vercel Deployment (Production)

This project is heavily optimized for global **Vercel** deployment (Edge CDN).

1. Push your code to your GitHub repository.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Import Project**.
3. Under the **Environment Variables** section, you **MUST** add both keys securely:
   - `AVIATIONSTACK_API_KEY`
   - `CHECKWX_API_KEY`
4. Click **Deploy**.

Next.js will automatically compile the application and securely use these environment variables on the server-side API routes, keeping them completely hidden from frontend users.
