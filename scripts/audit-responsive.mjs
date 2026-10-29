import { measure } from './responsive-measure.mjs';
﻿// Usage: PLAYWRIGHT_PATH=<installed playwright package> node scripts/audit-responsive.mjs
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixture, baseURL } from './responsive-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const output = process.env.RESPONSIVE_OUTPUT || '.cache/responsive-audit';
await mkdir(output, { recursive: true });
const widths = (process.env.RESPONSIVE_WIDTHS || '320,375,430,600,768,1024,1280,1440,1920,2560,3440').split(',').map(Number);
const viewports = [...widths.map(width => ({ width, height: width <= 768 ? 844 : 1000 })), { width: 844, height: 390 }, { width: 1024, height: 600 }];
const names = ['index','login','register','sell','product','orders','balance','chat','settings','admin','terms','terms-lv','resend-verification'];
const variants = process.env.RESPONSIVE_QUICK ? [['en','light']] : [['en','light'],['lv','light'],['en','dark'],['lv','dark']];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const name of names) {
    for (const [lang,theme] of variants) {
      const f=await fixture(browser,{signedIn:!['login','register','resend-verification'].includes(name),lang,theme,mobile:process.env.RESPONSIVE_TOUCH==='1'});
      try {
        await f.page.goto(`${baseURL}/${name}.html`,{waitUntil:'domcontentloaded'});
        await f.page.waitForTimeout(350);
        await f.page.evaluate(async ({lang,theme})=>{ document.documentElement.dataset.theme=theme; document.documentElement.classList.remove('light','dark'); document.documentElement.classList.add(theme); const {i18n}=await import('/src/i18n.js'); i18n.setLang(lang); },{lang,theme});
        for(const viewport of viewports) {
          await f.page.setViewportSize(viewport); await f.page.waitForTimeout(45);
          const result={page:name,lang,theme,...viewport,...await measure(f.page)};
          result.finalPath=new URL(f.page.url()).pathname;
          result.errors=[...new Set(f.errors)]; results.push(result);
          if ([320,768,1440].includes(viewport.width) && viewport.height!==600 && ((lang==='en'&&theme==='light')||(lang==='lv'&&theme==='dark'))) await f.page.screenshot({path:`${output}/${name}-${lang}-${theme}-${viewport.width}.png`,fullPage:true});
        }
      } catch(e) { results.push({page:name,lang,theme,error:e.message}); }
      finally {await f.context.close();}
    }
    const bad=results.filter(r=>r.page===name&&(r.overlaps?.length||r.overflow||r.outside?.length||r.clippedControls?.length||r.errors?.length||r.error));
    console.log(JSON.stringify({page:name,checks:results.filter(r=>r.page===name).length,issues:bad.length,first:bad[0]}));
  }
} finally {await browser.close(); await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));}
console.log(JSON.stringify({checks:results.length,failures:results.filter(r=>r.overlaps?.length||r.overflow||r.outside?.length||r.clippedControls?.length||r.errors?.length||r.error).length,output}));

process.exitCode = results.some(r => r.overlaps?.length || r.overflow || r.outside?.length || r.clippedControls?.length || r.errors?.length || r.error) ? 1 : 0;
