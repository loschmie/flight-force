# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/e2e.spec.ts >> E2E claim submission on live Vercel URL
- Location: tests/e2e.spec.ts:3:5

# Error details

```
Error: expect(received).toBeTruthy()

Received: ""
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Your Compensation Estimate" [level=1] [ref=e6]
        - generic [ref=e7]:
          - generic [ref=e8]: 250€
          - paragraph [ref=e9]: Maximum cash compensation under EU261
        - button "PROCEED TO PAYMENT DETAILS" [disabled] [ref=e10]
        - paragraph [ref=e11]: "*Complete passenger details below to proceed."
      - separator [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]:
          - img [ref=e15]
          - paragraph [ref=e17]: Unesite podatke tačno sa vaše karte kako bi PDF bio pravno obavezujući.
        - generic [ref=e18]:
          - 'heading "Step 1: Passenger & Contact" [level=3] [ref=e19]'
          - generic [ref=e20]:
            - generic [ref=e21]: Full Name (As on passport)
            - textbox "Full Name (As on passport)" [ref=e22]:
              - /placeholder: John Doe
          - generic [ref=e23]:
            - generic [ref=e24]: Booking Reference (PNR)
            - textbox "Booking Reference (PNR)" [ref=e25]:
              - /placeholder: AZX2Y4
          - generic [ref=e26]:
            - generic [ref=e27]: Home Address
            - textbox "Home Address" [ref=e28]:
              - /placeholder: 123 Main St, London, UK
          - generic [ref=e29]:
            - generic [ref=e30]: Email Address
            - textbox "Email Address" [ref=e31]:
              - /placeholder: john@example.com
          - button "Proceed to Payment Details" [disabled] [ref=e32]:
            - text: Proceed to Payment Details
            - img [ref=e33]
      - separator [ref=e35]
      - generic [ref=e36]:
        - generic [ref=e37]:
          - heading "Analysis Details:" [level=3] [ref=e38]
          - list [ref=e39]:
            - listitem [ref=e40]:
              - text: "• Flight:"
              - strong [ref=e41]: JU0501
            - listitem [ref=e42]:
              - text: "• Delay:"
              - strong [ref=e43]: 4h 10min
            - listitem [ref=e44]: "• Region Status: VERIFIED"
        - generic [ref=e45]:
          - heading "Evidence Tracker" [level=3] [ref=e46]:
            - img [ref=e47]
            - text: Evidence Tracker
          - list [ref=e49]:
            - listitem [ref=e50]:
              - generic [ref=e51]: ✅
              - generic [ref=e52]: "Weather: Verified Clear (VFR Conditions)"
            - listitem [ref=e53]:
              - generic [ref=e54]: ✅
              - generic [ref=e55]: "Airport Ops: Normal Traffic Detected"
            - listitem [ref=e56]:
              - generic [ref=e57]: ✅
              - generic [ref=e58]: "Legality: Claim Strength: HIGH"
      - separator [ref=e59]
      - generic [ref=e60]:
        - heading "Too busy to fight the airline yourself?" [level=3] [ref=e61]
        - paragraph [ref=e62]: You can use our verified data to assign your claim to a specialized law firm. They handle everything and take a cut only if they win.
        - link "Let our partners handle it" [ref=e63] [cursor=pointer]:
          - /url: https://www.airhelp.com/
      - link "Return to Home" [ref=e65] [cursor=pointer]:
        - /url: /
      - paragraph [ref=e67]: "Disclaimer: GetFlightForce is a self-help tool providing legal information, not legal advice. We are not a law firm. Use of this service is at your own risk."
  - alert [ref=e68]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('E2E claim submission on live Vercel URL', async ({ page }) => {
  4  |   // Auto-accept any dialogs (like window.confirm)
  5  |   page.on('dialog', dialog => dialog.accept());
  6  | 
  7  |   await page.goto('https://flight-force-pqx31ceut-loschmie-4558s-projects.vercel.app/check');
  8  | 
  9  |   // Fill in the flight details (simulating barcode scan input)
  10 |   await page.fill('#flightNumber', 'JU0501');
  11 |   
  12 |   // Set date to today or a recent date
  13 |   const today = new Date().toISOString().split('T')[0];
  14 |   await page.fill('#date', today);
  15 | 
  16 |   // Click the 'Check Eligibility' button
  17 |   await page.click('button[type="submit"]');
  18 | 
  19 |   // Wait for the URL to change to the result page
  20 |   await page.waitForURL(/\/result/);
  21 |   
  22 |   // Verify that the URL contains a valid claimId
  23 |   const currentUrl = new URL(page.url());
  24 |   const claimId = currentUrl.searchParams.get('claimId');
  25 |   console.log('Claim ID from URL:', claimId);
> 26 |   expect(claimId).toBeTruthy();
     |                   ^ Error: expect(received).toBeTruthy()
  27 | 
  28 |   // STEP 1: Passenger & Contact
  29 |   await page.fill('#fullName', 'John Doe');
  30 |   await page.fill('#pnr', 'JU0501'); // Needs to be 6 chars
  31 |   await page.fill('#address', '123 Test St, Test City');
  32 |   await page.fill('#email', 'test@example.com');
  33 |   
  34 |   // Proceed to Step 2
  35 |   await page.getByRole('button', { name: /Proceed to Payment Details/i }).first().click();
  36 | 
  37 |   // STEP 2: Payout Details
  38 |   await page.fill('#bankName', 'Test Bank');
  39 |   await page.fill('#swift', 'TESTSWIFT');
  40 |   await page.fill('#iban', 'RS1234567890123456');
  41 | 
  42 |   // STEP 3: Legal Confirmation
  43 |   await page.check('input[type="checkbox"]');
  44 | 
  45 |   // Set up listener for the webhook POST request
  46 |   const webhookResponsePromise = page.waitForResponse(
  47 |     response => response.url().includes('/api/claims/webhook') && response.request().method() === 'POST'
  48 |   );
  49 | 
  50 |   const dispatchBtn = page.getByRole('button', { name: /DISPATCH LEGAL DEMAND/i }).first();
  51 |   await expect(dispatchBtn).toBeEnabled({ timeout: 5000 });
  52 |   await dispatchBtn.click();
  53 |   
  54 |   const webhookResponse = await webhookResponsePromise;
  55 |   
  56 |   // Check that the webhook response is not 500 (expecting 200 OK)
  57 |   expect(webhookResponse.status()).toBe(200);
  58 | 
  59 |   // Verify success screen is displayed
  60 |   await expect(page.locator('h1:has-text("Payment Successful")')).toBeVisible();
  61 | });
  62 | 
```