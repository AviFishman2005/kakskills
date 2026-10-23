// Screenshot + overflow + error pass over a built study page.
// Usage: NODE_PATH=$(npm root -g) node check_page.js <page.html> [routes] [outdir]
//   routes: comma-separated hash routes, default "exams,study,stats,path"
// The page file should be a full document (doctype, <html lang="he" dir="rtl">, <body>).
// Prints one line per route and width: overflow in px (must be 0) and page/console errors.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]);
  const routes = (process.argv[3] || 'exams,study,stats,path').split(',');
  const out = process.argv[4] || '.';
  const b = await chromium.launch();
  let bad = 0;
  for (const [w, scheme] of [[1280, 'light'], [390, 'dark']]) {
    const p = await b.newPage({viewport: {width: w, height: 900}, colorScheme: scheme});
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    for (const r of routes) {
      await p.goto('file://' + file + '#' + r); await p.reload(); await p.waitForTimeout(500);
      const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      await p.screenshot({path: `${out}/check_${r}_${w}.png`, fullPage: true});
      console.log(`${w} ${scheme} #${r} overflow=${ow}${errs.length ? ' errors=' + JSON.stringify(errs.splice(0)) : ''}`);
      if (ow > 0) bad++;
    }
    await p.close();
  }
  await b.close();
  console.log(bad ? `FAIL: ${bad} views overflow` : 'OK');
  process.exit(bad ? 1 : 0);
})();
