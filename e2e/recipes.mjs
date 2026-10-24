import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox'] });
try {
  const page = await browser.newPage({ serviceWorkers:'block', viewport:{width:1280,height:1000} }), errors=[];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.APP_URL ?? 'http://127.0.0.1:3000');
  const settle = () => page.waitForFunction(() => document.querySelector('#recipe-results').getAttribute('aria-busy') === 'false' && document.querySelector('#recipe-database-status').dataset.state === 'ready');
  await settle();
  assert.equal(await page.locator('#recipe-database-status').getAttribute('data-source'), 'sqlite-network');
  const original = await page.evaluate(() => localStorage.getItem('daily-bites.records.v1'));
  assert.equal(await page.locator('#recipe-results button').count(), 12);
  await page.locator('[data-food-mode=online]').click();
  await settle();
  assert.equal(await page.locator('.recipe-filters').isVisible(), true);
  assert.equal(await page.locator('.food-discovery .food-filters').isHidden(), true);
  await page.locator('[data-food-mode=local]').click();
  await settle();
  const cuisines = ['home','lu','chuan','yue','su','min','zhe','xiang','hui'];
  const seen = new Set();
  for (const cuisine of cuisines) {
    await page.locator(`[data-recipe-cuisine=${cuisine}]`).click();
    await settle();
    assert.equal(await page.locator('#recipe-results button').count(), 12);
    assert.equal(await page.locator('#recipe-pages').isHidden(), true);
    for (const button of await page.locator('#recipe-results button').all()) {
      seen.add(await button.getAttribute('data-recipe'));
      await button.click();
      await settle();
      assert.ok((await page.locator('.recipe-steps li').count()) >= 4);
      assert.ok((await page.locator('.recipe-ingredients li').count()) >= 3);
      assert.ok((await page.locator('#recipe-current-title').textContent()).trim());
    }
  }
  assert.equal(seen.size, 108);
  await page.locator('[data-recipe-cuisine=all]').click();
  await settle();
  assert.match(await page.locator('#recipe-status').textContent(), /108/);
  assert.equal(await page.locator('#recipe-previous').isDisabled(), true);
  const paged = new Set();
  for (let i = 1; i <= 9; i++) {
    assert.match(await page.locator('#recipe-page-status').textContent(), new RegExp(`${i} / 9`));
    for (const id of await page.locator('#recipe-results button').evaluateAll(nodes => nodes.map(n => n.dataset.recipe))) paged.add(id);
    if (i < 9) await page.locator('#recipe-next').click();
    await settle();
  }
  assert.equal(paged.size, 108);
  assert.equal(await page.locator('#recipe-next').isDisabled(), true);
  await page.locator('#recipe-previous').click();
  await settle();
  assert.match(await page.locator('#recipe-page-status').textContent(), /8 \/ 9/);
  await page.locator('#recipe-search').fill('宫保鸡丁');
  await settle();
  assert.equal(await page.locator('#recipe-current-title').textContent(), '宫保鸡丁');
  assert.equal(await page.locator('#recipe-pages').isHidden(), true);
  assert.match(await page.locator('.recipe-allergens').textContent(), /花生/);
  await page.locator('#recipe-servings').selectOption('4');
  await settle();
  assert.match(await page.locator('.recipe-ingredients li').first().textContent(), /500 g/);
  await page.locator('#recipe-servings').selectOption('2');
  await settle();
  await page.locator('[data-recipe-cuisine=yue]').click();
  await settle();
  assert.equal(await page.locator('#recipe-detail').isHidden(), true);
  await page.locator('#recipe-search').fill('');
  await settle();
  await page.locator('[data-recipe-category=plant]').click();
  await settle();
  assert.equal(await page.locator('#recipe-results button').count(), 2);
  await page.locator('#recipe-reset').click();
  await settle();
  const search = page.locator('#recipe-search');
  await search.fill('西红柿炒蛋');
  await settle();
  assert.equal(await page.locator('#recipe-results button').count(), 1);
  assert.equal(await page.locator('#recipe-current-title').textContent(), '番茄炒蛋');
  assert.equal(await page.locator('.recipe-steps li').count(), 4);
  await page.locator('#recipe-servings').selectOption('4');
  await settle();
  assert.match(await page.locator('.recipe-ingredients li').first().textContent(), /600 g/);
  await page.locator('#recipe-servings').selectOption('1');
  await settle();
  assert.match(await page.locator('.recipe-ingredients li').first().textContent(), /150 g/);
  await search.fill('没有收录的菜');
  await settle();
  assert.equal(await page.locator('#recipe-detail').isHidden(), true);
  await page.locator('#recipe-servings').selectOption('2');
  await settle();
  assert.equal(await page.locator('#recipe-detail').isHidden(), true);
  await page.locator('#recipe-reset').click();
  await settle();
  assert.equal(await search.inputValue(), '');
  await page.locator('[data-recipe-category=staple]').click();
  await settle();
  assert.equal(await page.locator('#recipe-results button').count(), 2);
  await page.locator('[data-recipe=fried-rice]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-recipe=fried-rice]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-recipe=fried-rice]').evaluate(el => el === document.activeElement), true);
  await page.locator('#recipe-reset').click();
  await settle();
  await page.locator('[data-recipe=chicken]').click();
  await settle();
  assert.match(await page.locator('.recipe-allergens').textContent(), /大豆/);
  assert.match(await page.locator('.recipe-steps').textContent(), /74°C/);
  for (const language of ['en','ja','ko','zh-CN']) {
    await page.locator('#language-select').selectOption(language);
    await settle();
    await page.setViewportSize({width:320,height:1000});
    for (const cuisine of cuisines) {
      await page.locator(`[data-recipe-cuisine=${cuisine}]`).click();
      await settle();
      assert.equal(await page.locator('#recipe-results button').count(), 12);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (language === 'en') assert.equal(/[\u4e00-\u9fff]/.test(await page.locator('#cookbook').innerText()), false);
    }
    await page.locator('#recipe-reset').click();
    await settle();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (language === 'en') {
      assert.equal(/[\u4e00-\u9fff]/.test(await page.locator('#cookbook').innerText()), false);
      await search.fill('BROCCOLI');
      await settle();
      assert.equal(await page.locator('#recipe-results button').count(), 1);
    }
    await page.locator('#recipe-reset').click();
    await settle();
  }
  for (const theme of ['green','white','black','blue']) {
    await page.evaluate(theme => {document.documentElement.dataset.theme=theme;document.documentElement.dataset.buttonStyle='glass';}, theme);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('.recipe-filters [aria-pressed=true]').evaluate(el => getComputedStyle(el).color), await page.locator('.recipe-cuisine[aria-pressed=true]').evaluate(el => getComputedStyle(el).color));
    await search.focus();
    assert.notEqual(await search.locator('..').evaluate(el => getComputedStyle(el).boxShadow), 'none');
  }
  // The cookbook uses local assets only, so it continues to search without network access.
  await page.context().setOffline(true);
  await search.fill('鸡胸肉');
  await settle();
  assert.equal(await page.locator('#recipe-results button').count(), 1);
  assert.equal(await page.locator('#recipe-current-title').textContent(), '香菇炒鸡胸肉');
  await page.locator('[data-recipe-cuisine=all]').click();
  await settle();
  await search.fill('宫保');
  await settle();
  assert.equal(await page.locator('#recipe-current-title').textContent(), '宫保鸡丁');
  assert.equal(await page.evaluate(() => localStorage.getItem('daily-bites.records.v1')), original);
  assert.deepEqual(errors, []);
  console.log('PASS 108 recipes / nine collections, all details, cuisine search and pagination; cookbook: dish/ingredient search, steps, servings, categories, keyboard, allergens, four languages/themes, mobile and offline use; no diary mutations');
} finally { await browser.close(); }
