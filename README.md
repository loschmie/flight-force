# FlightForce: 2026 Flight Compensation & Refund Tool ✈️⚖️

FlightForce is a high-performance Next.js (App Router) LegalTech application designed to help passengers fight back against airlines. It automatically verifies flight data, checks historical weather conditions, analyzes airport traffic, and generates legally forceful PDF demand letters based on the EC 261/2004 Regulation and US DOT mandates.

## 🔥 The "Truth Engine" Features
- **Weather Verification (METAR)**: Automatically fetches raw historical pilot weather data (VFR conditions) via CheckWX to aggressively counter false "adverse weather" airline excuses.
- **Operational Pattern Recognition**: Analyzes overall airport departure traffic. If 90%+ of flights departed successfully, it flags the delay as a specific internal carrier failure.
- **Evidence Tracker & Client-Side PDF Generation**: Provides users with an Evidence Tracker UI and uses `jsPDF` to generate authoritative demand letters directly in the browser. Sensitive IBAN and personal data **never** touch the server.
- **SRE-Level Resilience**: Built-in 15-minute SWR caching to save API limits and robust fail-safe `try/catch` fallbacks to ensure the app never crashes, even if third-party APIs go down.
- **Built-in Monetization**: Includes an integrated "No Win - No Fee" affiliate section (e.g., AirHelp) for users who prefer legal partners to handle the lawsuit.

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

Next.js will automatically compile the application and securely use these environment variables on the server-side API routes, keeping them completely completely hidden from frontend users.
