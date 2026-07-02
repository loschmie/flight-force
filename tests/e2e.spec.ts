import { test, expect } from '@playwright/test';

test('E2E claim submission on live Vercel URL', async ({ page }) => {
  // Auto-accept any dialogs (like window.confirm)
  page.on('dialog', dialog => dialog.accept());

  await page.goto('https://flight-force-pqx31ceut-loschmie-4558s-projects.vercel.app/check');

  // Fill in the flight details (simulating barcode scan input)
  await page.fill('#flightNumber', 'JU0501');
  
  // Set date to today or a recent date
  const today = new Date().toISOString().split('T')[0];
  await page.fill('#date', today);

  // Click the 'Check Eligibility' button
  await page.click('button[type="submit"]');

  // Wait for the URL to change to the result page
  await page.waitForURL(/\/result/);
  
  // Verify that the URL contains a valid claimId
  const currentUrl = new URL(page.url());
  const claimId = currentUrl.searchParams.get('claimId');
  console.log('Claim ID from URL:', claimId);
  expect(claimId).toBeTruthy();

  // STEP 1: Passenger & Contact
  await page.fill('#fullName', 'John Doe');
  await page.fill('#pnr', 'JU0501'); // Needs to be 6 chars
  await page.fill('#address', '123 Test St, Test City');
  await page.fill('#email', 'test@example.com');
  
  // Proceed to Step 2
  await page.getByRole('button', { name: /Proceed to Payment Details/i }).first().click();

  // STEP 2: Payout Details
  await page.fill('#bankName', 'Test Bank');
  await page.fill('#swift', 'TESTSWIFT');
  await page.fill('#iban', 'RS1234567890123456');

  // STEP 3: Legal Confirmation
  await page.check('input[type="checkbox"]');

  // Set up listener for the webhook POST request
  const webhookResponsePromise = page.waitForResponse(
    response => response.url().includes('/api/claims/webhook') && response.request().method() === 'POST'
  );

  const dispatchBtn = page.getByRole('button', { name: /DISPATCH LEGAL DEMAND/i }).first();
  await expect(dispatchBtn).toBeEnabled({ timeout: 5000 });
  await dispatchBtn.click();
  
  const webhookResponse = await webhookResponsePromise;
  
  // Check that the webhook response is not 500 (expecting 200 OK)
  expect(webhookResponse.status()).toBe(200);

  // Verify success screen is displayed
  await expect(page.locator('h1:has-text("Payment Successful")')).toBeVisible();
});
