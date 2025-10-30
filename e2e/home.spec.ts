import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/PRD & Test Case Generator/);

    // Check main heading
    await expect(page.locator('h1')).toContainText('PRD & Test Case');
    await expect(page.locator('h1')).toContainText('Generator');

    // Check hero description
    await expect(page.getByText('AI를 활용한 자동화된 PRD 작성')).toBeVisible();
  });

  test('should navigate to PRD page', async ({ page }) => {
    await page.goto('/');

    // Click "지금 시작하기" button
    await page.getByRole('link', { name: /지금 시작하기/ }).click();

    // Should navigate to PRD page
    await expect(page).toHaveURL('/prd');
    await expect(page.locator('h1')).toContainText('PRD');
    await expect(page.locator('h1')).toContainText('생성기');
  });

  test('should navigate to admin page', async ({ page }) => {
    await page.goto('/');

    // Click "관리자 페이지" button
    await page.getByRole('link', { name: /관리자 페이지/ }).click();

    // Should navigate to admin page
    await expect(page).toHaveURL('/admin');
  });

  test('should have navigation header', async ({ page }) => {
    await page.goto('/');

    // Check header links
    await expect(page.getByRole('link', { name: /PRD 생성/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /GitHub 분석/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /테스트 케이스/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /관리자/ })).toBeVisible();
  });

  test('should display public access badge', async ({ page }) => {
    await page.goto('/');

    // Check for public access badge in header
    await expect(page.getByText('Public Access').or(page.getByText('공개 접근'))).toBeVisible();
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/');

    // Check for feature sections
    await expect(page.getByText('PRD 자동 생성')).toBeVisible();
    await expect(page.getByText('GitHub PR 분석')).toBeVisible();
    await expect(page.getByText('테스트 케이스 생성')).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /지금 시작하기/ })).toBeVisible();
  });
});
