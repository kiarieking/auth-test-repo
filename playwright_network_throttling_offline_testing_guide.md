# Testing Poor Network & Low Connectivity in Playwright

Testing your application under realistic network conditions—such as high latency, limited bandwidth, intermittent request drops, or full offline states—is essential for ensuring resilient UX, proper error handling, and robust caching/PWA behavior.

This guide details four primary approaches to simulating low connectivity using Playwright.

---

## Summary of Techniques

| Approach | Best Used For | Browser Support |
| :--- | :--- | :--- |
| **CDP Sessions (`Network.emulateNetworkConditions`)** | Realistically throttling overall browser throughput (Slow 3G, Fast 3G, custom latency). | Chromium-based browsers (Chrome, Edge) |
| **Context Offline State (`context.setOffline`)** | Toggling full offline mode mid-test to verify PWAs, caching, local storage, and reconnect logic. | Cross-browser (Chromium, Firefox, WebKit) |
| **Route Interception (`page.route`)** | Adding targeted delays to specific API endpoints without slowing down static assets. | Cross-browser |
| **Request Abort / Flaky Simulation** | Simulating dropped connections, network resets, and verifying retry mechanism logic. | Cross-browser |

---

## 1. Simulating Network Throttling via CDP (Chromium)

The most accurate way to throttle download/upload speeds and simulate network latency across the entire browser is by opening a Chrome DevTools Protocol (`CDPSession`).

```typescript
import { test, expect } from '@playwright/test';

// Define standardized network presets
const NETWORK_PRESETS = {
  Slow3G: {
    offline: false,
    downloadThroughput: ((500 * 1024) / 8), // 500 kbps
    uploadThroughput: ((500 * 1024) / 8),   // 500 kbps
    latency: 400,                           // 400 ms RTT latency
  },
  Fast3G: {
    offline: false,
    downloadThroughput: ((1.6 * 1024 * 1024) / 8), // 1.6 Mbps
    uploadThroughput: ((750 * 1024) / 8),          // 750 kbps
    latency: 150,                                  // 150 ms RTT latency
  },
};

test('app displays loading indicators on Slow 3G', async ({ context, page }) => {
  // 1. Establish a CDP Session with the target context/page
  const cdpSession = await context.newCDPSession(page);

  // 2. Enable the DevTools Network domain
  await cdpSession.send('Network.enable');

  // 3. Emulate network conditions using a preset
  await cdpSession.send('Network.emulateNetworkConditions', NETWORK_PRESETS.Slow3G);

  await page.goto('/dashboard');

  // 4. Assert that skeleton screens or loaders appear during prolonged loading
  await expect(page.getByTestId('loading-skeleton')).toBeVisible();
});
```

---

## 2. Testing Offline Mode & Recovery

Use `context.setOffline(true)` to simulate turning off Wi-Fi or losing internet connectivity entirely. This works across all supported browser engines.

```typescript
import { test, expect } from '@playwright/test';

test('recovers gracefully when internet connection drops mid-session', async ({ context, page }) => {
  await page.goto('/editor');

  // Enter initial input
  await page.getByLabel('Document Title').fill('My Offline Draft');

  // 1. Simulate complete network disconnection
  await context.setOffline(true);

  // 2. Perform an action dependent on API connectivity
  await page.getByRole('button', { name: 'Save' }).click();

  // 3. Verify optimistic updates or offline fallback UI
  await expect(page.getByText('You are offline. Changes saved locally.')).toBeVisible();

  // 4. Restore internet connection
  await context.setOffline(false);

  // 5. Ensure background sync triggers and UI updates accordingly
  await expect(page.getByText('All changes synced to cloud')).toBeVisible();
});
```

---

## 3. Targeted API Latency & Delay Simulation

Instead of slowing down the entire browser (including local images, CSS, and JS files), use `page.route()` to delay specific heavy or critical API endpoints.

```typescript
import { test, expect } from '@playwright/test';

test('handles slow backend API response timeouts gracefully', async ({ page }) => {
  // Intercept specific API request patterns and artificially delay the response
  await page.route('**/api/v1/checkout', async (route) => {
    // Inject a 5-second artificial delay
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await route.continue();
  });

  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Pay Now' }).click();

  // Verify timeout notifications or extended waiting spinners
  await expect(page.getByText('Request is taking longer than expected...')).toBeVisible();
  
  // Ensure submit button is disabled to prevent duplicate submissions
  await expect(page.getByRole('button', { name: 'Pay Now' })).toBeDisabled();
});
```

---

## 4. Simulating Flaky Networks & Intermittent Failures

To verify that your app properly handles dropped packets, connection resets, and auto-retry logic (such as exponential backoff), you can selectively fail requests using `route.abort()`.

```typescript
import { test, expect } from '@playwright/test';

test('retries failed network requests automatically on spotty connection', async ({ page }) => {
  let attemptCount = 0;

  // Intercept endpoint and abort the first request while allowing subsequent attempts
  await page.route('**/api/v1/user/profile', async (route) => {
    attemptCount++;
    if (attemptCount === 1) {
      // Simulate network level interruption
      await route.abort('failed'); 
    } else {
      await route.continue();
    }
  });

  await page.goto('/profile');

  // Validate that the application auto-retried the failed request and rendered state properly
  await expect(page.getByText('Welcome back, User!')).toBeVisible();
  expect(attemptCount).toBe(2);
});
```

---

## Checklist: Key UI & UX Behaviors to Validate

When running network resilience tests, ensure your test assertions cover these crucial states:

1. **Skeleton / Loading States:**
   - Skeleton loaders display when initial fetch takes longer than $200\text{ ms}$.
   - Buttons enter loading states and are disabled against double-clicks.
2. **Offline Detection & Banners:**
   - An offline notification bar/banner appears when `navigator.onLine` toggles to `false`.
   - Forms transition to saving drafts locally (IndexedDB or LocalStorage).
3. **Error Boundaries & Retry Mechanisms:**
   - Failed API requests display friendly error toasts rather than blank screens or uncaught runtime exceptions.
   - Exponential backoff retry logic is triggered for transient `$5xx$` or network failures.
4. **Optimistic UI Rollbacks:**
   - If an action (e.g., toggling a checkbox or deleting an item) fails due to connection drop, the UI cleanely reverts back to its original state.