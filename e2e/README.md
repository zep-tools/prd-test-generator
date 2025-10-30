# E2E Tests

This directory contains end-to-end tests for the PRD & Test Case Generator application using Playwright.

## Setup

Tests are automatically configured to run with the dev server. Playwright will start the dev server before running tests.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

### Home Page Tests (`home.spec.ts`)
- Page loading and navigation
- Header and navigation links
- Feature cards display
- Responsive design

### PRD Generation Tests (`prd-generation.spec.ts`)
- Form rendering and validation
- Feature input management
- PRD generation flow
- LocalStorage persistence
- Mobile responsiveness

### GitHub PR Analysis Tests (`github-analysis.spec.ts`)
- Page loading
- URL input validation
- Analysis button functionality
- Error handling
- Mobile responsiveness

### Test Case Generation Tests (`test-case-generation.spec.ts`)
- Page loading
- Test type selection
- PRD and PR content integration
- Figma URL input
- Test case display
- Export functionality
- Mobile responsiveness

## CI/CD Integration

Tests run automatically on GitHub Actions for:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

See `.github/workflows/playwright.yml` for CI configuration.

## Test Reports

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

Reports include:
- Test results summary
- Screenshots of failures
- Video recordings of failed tests
- Error context and stack traces

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e` directory
2. Import test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Write test suites using `test.describe()` and individual tests using `test()`
4. Use Playwright's locator API for element selection
5. Add assertions using `expect()`

## Best Practices

- Use semantic selectors (role, label, placeholder, text)
- Avoid tight coupling to implementation details
- Write descriptive test names
- Use `test.beforeEach()` for common setup
- Keep tests focused and independent
- Test user flows, not implementation

## Troubleshooting

### Tests fail locally but pass in CI
- Ensure dev server is not already running
- Check that environment variables are set correctly

### Timeout errors
- Increase timeout in `playwright.config.ts` if needed
- Check if the app is running slowly
- Verify network requests complete

### Element not found errors
- Check if selectors match actual page content
- Use Playwright Inspector (`npm run test:e2e:debug`) to debug selectors
- Verify page navigation completes before interacting

## Configuration

Test configuration is in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Browser: Chromium
- Retry: 2 times on CI
- Screenshots: On failure
- Videos: On failure
- Traces: On first retry
