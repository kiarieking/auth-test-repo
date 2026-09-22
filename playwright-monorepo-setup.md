# Playwright Automation Monorepo Setup Guide

This repository layout organizes automated testing into dedicated packages for **Web UI**, **API**, and **Mobile Web** tests, while maintaining a single source of truth for global configurations, helpers, and dependencies.

## 📂 Directory Tree
```text
playwright-monorepo/
├── packages/
│   ├── api-tests/
│   │   ├── tests/
│   │   │   └── example.api.spec.ts
│   │   ├── package.json
│   │   └── playwright.config.ts
│   ├── mobile-tests/
│   │   ├── tests/
│   │   │   └── example.mobile.spec.ts
│   │   ├── package.json
│   │   └── playwright.config.ts
│   └── web-tests/
│       ├── tests/
│       │   └── example.web.spec.ts
│       ├── package.json
│       └── playwright.config.ts
├── shared/
│   ├── auth-helpers.ts      # Shared authentication logic
│   └── test-data.ts         # Global test environments and variables
├── package.json             # Root workspace configuration
└── playwright.config.base.ts # Global baseline Playwright configuration
```

---

## ⚙️ Core Configuration Files

### 1. Root Workspace Setup (`package.json`)
```json
{
  "name": "playwright-automation-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "test:web": "npm run test --workspace=packages/web-tests",
    "test:api": "npm run test --workspace=packages/api-tests",
    "test:mobile": "npm run test --workspace=packages/mobile-tests",
    "test:all": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "typescript": "^5.0.0"
  }
}
```

### 2. Base Configuration (`playwright.config.base.ts`)
```typescript
import { defineConfig } from '@playwright/test';

export const baseConfig = defineConfig({
  timeout: 30000,
  retries: 2,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

---

## 🛠️ Sub-Package Configuration Details

### Web UI Tests Config (`packages/web-tests/playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';
import { baseConfig } from '../../playwright.config.base';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'https://staging.example.com',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

### API Tests Config (`packages/api-tests/playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test';
import { baseConfig } from '../../playwright.config.base';

export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: 'https://api.staging.example.com',
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  projects: [{ name: 'api' }], // Bypasses browser initialization
});
```

### Mobile Web Tests Config (`packages/mobile-tests/playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';
import { baseConfig } from '../../playwright.config.base';

export default defineConfig({
  ...baseConfig,
  projects: [
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
  ],
});
```

---

## 🚀 Running Your Tests From Root

Run scripts from the repository root folder to kick off specific test suites or execute everything together:

* **Run Web UI Tests Only:**
  ```bash
  npm run test:web
  ```
* **Run API Tests Only:**
  ```bash
  npm run test:api
  ```
* **Run Mobile Emulation Tests Only:**
  ```bash
  npm run test:mobile
  ```
* **Run Entire Suite (All Packages):**
  ```bash
  npm run test:all
  ```