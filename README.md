# FlightForce: Pravna Odšteta za Letove

FlightForce je moderan i ultra-brz Next.js (App Router) sistem koji pomaže putnicima da provere svoj let i generišu pravno obavezujući PDF zahtev za odštetu na osnovu EU Regulative 261/2004 i ECAA sporazuma.

## 🔥 Funkcionalnosti
- **Maksimalna brzina**: Optimizovano za LCP ispod 1.2s korišćenjem sistemskih fontova i Tailwind CSS-a.
- **Aviationstack Integracija**: Pretraga kašnjenja u realnom vremenu uz "Failover" mehanizam u slučaju zastoja API-ja.
- **Haversine Kalkulacija**: Automatsko merenje vazdušne linije između aerodroma zarad preciznog obračuna odštete (250€ ili 600€).
- **Liar Detector & Privatnost**: Puna klijentska generacija PDF zahteva u pretraživaču preko `jsPDF`. Svi unosi (poput IBAN-a i imena) nikada ne napuštaju korisnikov uređaj.
- **Monetizacija**: Ugrađen affiliate preusmerivač za AirHelp i slične partnere (No-Win-No-Fee).

## 🚀 Lokalno pokretanje
1. Otvorite terminal i instalirajte module: 
   ```bash
   npm install
   ```
2. Kreirajte fajl pod nazivom `.env.local` u root direktorijumu i ubacite svoj ključ:
   ```env
   AVIATIONSTACK_API_KEY=vaš_aviationstack_kljuc_ovde
   ```
3. Pokrenite lokalni server: 
   ```bash
   npm run dev
   ```

## 🌍 Vercel Deploy (Produkcija)
Projekat je savršeno optimizovan za **Vercel** platformu.

### Kako postaviti API ključ na Vercelu?
Kada prebacite kod na GitHub i povežete ga sa Vercel platformom, potrebno je da pre prvog bilda (ili nakon njega) podesite sigurnosne varijable kako bi backend rute funkcionisale.

1. Ulogujte se na [Vercel Dashboard](https://vercel.com/dashboard).
2. Otvorite vaš FlightForce projekat i idite na karticu **Settings**.
3. Sa leve strane izaberite **Environment Variables**.
4. U formi za dodavanje unesite sledeće:
   - **Key**: `AVIATIONSTACK_API_KEY`
   - **Value**: *[Unesite vaš stvarni Aviationstack Access Key]*
5. Ostavite obeležena polja za Production, Preview i Development okruženja i kliknite **Save**.
6. Idite na tab **Deployments** i kliknite **Redeploy** na vašem najnovijem komitu kako bi se ključ primenio na aktivan server.

Nakon ovoga, vaš Next.js backend će bezbedno komunicirati sa Aviationstack-om, a vaš ključ nikada neće biti vidljiv korisnicima u pretraživaču.
