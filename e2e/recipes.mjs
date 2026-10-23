import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport:{width:1280,height:1000} }), errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.APP_URL ?? 'http://127.0.0.1:3000');
  await page.locator('#recipe-results button').first().waitFor();
  const original = await page.evaluate(() => localStorage.getItem('daily-bites.records.v1'));
  assert.equal(await page.locator('#recipe-results button').count(), 12);
  await page.locator('[data-food-mode=online]').click();
  assert.equal(await page.locator('.recipe-filters').isVisible(), true);
  assert.equal(await page.locator('.food-discovery .food-filters').isHidden(), true);
  await page.locator('[data-food-mode=local]').click();
  const search = page.locator('#recipe-search');
  await search.fill('西红柿炒蛋');
  assert.equal(await page.locator('#recipe-results button').count(), 1);
  assert.equal(await page.locator('#recipe-current-title').textContent(), '番茄炒蛋');
  assert.equal(await page.locator('.recipe-steps li').count(), 4);
  await page.locator('#recipe-servings').selectOption('4');
  assert.match(await page.locator('.recipe-ingredients li').first().textContent(), /600 g/);
  await page.locator('#recipe-servings').selectOption('1');
  assert.match(await page.locator('.recipe-ingredients li').first().textContent(), /150 g/);
  await search.fill('没有收录的菜');
  assert.equal(await page.locator('#recipe-detail').isHidden(), true);
  await page.locator('#recipe-servings').selectOption('2');
  assert.equal(await page.locator('#recipe-detail').isHidden(), true);
  await page.locator('#recipe-reset').click();
  assert.equal(await search.inputValue(), '');
  await page.locator('[data-recipe-category=staple]').click();
  assert.equal(await page.locator('#recipe-results button').count(), 2);
  await page.locator('[data-recipe=fried-rice]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-recipe=fried-rice]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-recipe=fried-rice]').evaluate(el => el === document.activeElement), true);
  await page.locator('#recipe-reset').click();
  await page.locator('[data-recipe=chicken]').click();
  assert.match(await page.locator('.recipe-allergens').textContent(), /大豆/);
  assert.match(await page.locator('.recipe-steps').textContent(), /74°C/);
  for (const language of ['en','ja','ko','zh-CN']) {
    await page.locator('#language-select').selectOption(language);
    await page.setViewportSize({width:390,height:1000});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (language === 'en') {
      assert.equal(/[\u4e00-\u9fff]/.test(await page.locator('#cookbook').innerText()), false);
      await search.fill('BROCCOLI');
      assert.equal(await page.locator('#recipe-results button').count(), 1);
    }
    await page.locator('#recipe-reset').click();
  }
  for (const theme of ['green','white','black','blue']) {
    await page.evaluate(theme => {document.documentElement.dataset.theme=theme;document.documentElement.dataset.buttonStyle='glass';}, theme);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await search.focus();
    assert.notEqual(await search.locator('..').evaluate(el => getComputedStyle(el).boxShadow), 'none');
  }
  // The cookbook uses local assets only, so it continues to search without network access.
  await page.context().setOffline(true);
  await search.fill('鸡胸肉');
  assert.equal(await page.locator('#recipe-results button').count(), 1);
  assert.equal(await page.locator('#recipe-current-title').textContent(), '香菇炒鸡胸肉');
  assert.equal(await page.evaluate(() => localStorage.getItem('daily-bites.records.v1')), original);
  assert.deepEqual(errors, []);
  console.log('PASS cookbook: dish/ingredient search, steps, servings, categories, keyboard, allergens, four languages/themes, mobile and offline use; no diary mutations');
} finally { await browser.close(); }
