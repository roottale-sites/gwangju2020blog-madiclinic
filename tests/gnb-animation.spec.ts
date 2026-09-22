import { expect, test } from '@playwright/test';

test('GNB가 최종 높이를 넘지 않고 펼쳐지며 끝에서 튀지 않는다', async ({ page }) => {
  await page.goto('/column');
  await expect(page.locator('#header .headerFix')).toHaveClass(/slideDown/);
  const heights = await page.evaluate(async () => {
    const anchor = document.querySelector<HTMLAnchorElement>('#gnb > li:last-child > a')!;
    const menu = anchor.nextElementSibling as HTMLElement;
    const samples: number[] = [];
    anchor.dispatchEvent(new MouseEvent('mouseenter'));
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function sample() {
        samples.push(menu.getBoundingClientRect().height);
        if (performance.now() - start < 350) requestAnimationFrame(sample);
        else resolve();
      }
      sample();
    });
    return samples;
  });
  const finalHeight = heights.at(-1)!;
  expect(finalHeight).toBeCloseTo(160, 1);
  expect(Math.max(...heights)).toBeLessThanOrEqual(finalHeight + 1);
  expect(heights[0]).toBeLessThanOrEqual(1);
  for (let index = 1; index < heights.length; index++) {
    expect(heights[index]).toBeGreaterThanOrEqual(heights[index - 1]! - 1);
  }
});

test('펼치는 도중 닫고 다시 열어도 현재 높이에서 이어지고 이전 완료가 끼어들지 않는다', async ({ page }) => {
  await page.goto('/column');
  await expect(page.locator('#header .headerFix')).toHaveClass(/slideDown/);
  const result = await page.evaluate(async () => {
    const anchor = document.querySelector<HTMLAnchorElement>('#gnb > li:last-child > a')!;
    const menu = anchor.nextElementSibling as HTMLElement;
    const nav = document.querySelector('#gnb')!;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const height = () => menu.getBoundingClientRect().height;
    anchor.dispatchEvent(new MouseEvent('mouseenter'));
    await wait(70);
    const beforeClose = height();
    nav.dispatchEvent(new MouseEvent('mouseleave'));
    const afterClose = height();
    await wait(50);
    const beforeReopen = height();
    anchor.dispatchEvent(new MouseEvent('mouseenter'));
    const afterReopen = height();
    const heights: number[] = [];
    const start = performance.now();
    await new Promise<void>((resolve) => {
      function sample() {
        heights.push(height());
        if (performance.now() - start < 350) requestAnimationFrame(sample);
        else resolve();
      }
      sample();
    });
    nav.dispatchEvent(new MouseEvent('mouseleave'));
    await wait(250);
    return { beforeClose, afterClose, beforeReopen, afterReopen, heights, closed: height() };
  });
  expect(result.beforeClose).toBeGreaterThan(0);
  expect(Math.abs(result.afterClose - result.beforeClose)).toBeLessThan(1);
  expect(Math.abs(result.afterReopen - result.beforeReopen)).toBeLessThan(1);
  expect(result.heights.at(-1)).toBeCloseTo(160, 1);
  expect(Math.max(...result.heights)).toBeLessThanOrEqual(161);
  for (let index = 1; index < result.heights.length; index++) {
    expect(result.heights[index]).toBeGreaterThanOrEqual(result.heights[index - 1]! - 1);
  }
  expect(result.closed).toBe(0);
});
