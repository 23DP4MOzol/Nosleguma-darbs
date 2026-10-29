import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fixture, baseURL, product, user } from './responsive-fixture.mjs';
import { measure } from './responsive-measure.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true});
const output=process.env.RESPONSIVE_STATES_OUTPUT||'.cache/responsive-states'; await mkdir(output,{recursive:true});
const widths=[320,375,430,600,768,1024,1280,1440,1920,2560,3440];
const viewports=[...widths.map(width=>({width,height:width<=768?844:1000})),{width:844,height:390},{width:1024,height:600}];
const results=[];
const otherProduct={...product,id:'55555555-5555-4555-8555-555555555555',seller_id:'44444444-4444-4444-8444-444444444444'};
async function checkState(page,name,lang,theme) {
  for(const viewport of viewports) {
    await page.setViewportSize(viewport); await page.waitForTimeout(160);
    const measurement=await measure(page);
    const localOverflows=await page.evaluate(()=>[...document.querySelectorAll('.modal-content, #globalConfirmContent, .chat-messages-area, .chat-main')].filter(el=>el.getBoundingClientRect().height>0&&el.scrollWidth>el.clientWidth+1).map(el=>el.id||el.className));
    const result={state:name,lang,theme,...viewport,...measurement,localOverflows};results.push(result);
    if([320,1440].includes(viewport.width)) await page.screenshot({path:`${output}/${name}-${lang}-${theme}-${viewport.width}.png`,fullPage:true});
  }
}
const cases=[
  {name:'product-dialog',path:'index.html',open:async p=>p.evaluate(async product=>{const m=await import('/src/product-modal.js');await m.showProductModal(product);},otherProduct)},
  {name:'checkout-dialog',path:'index.html',open:async p=>p.evaluate(async product=>{const m=await import('/src/checkout-modal.js');await m.showCheckoutModal(product);},otherProduct)},
  {name:'confirmation-dialog',path:'index.html',open:async p=>p.evaluate(async()=>{const m=await import('/src/ui/modal.js');void m.showInfoModal('Long confirmation message '.repeat(120),'Long dialog title '.repeat(6));})},
  {name:'profile-preview',path:'settings.html',open:async p=>{await p.locator('#previewProfileBtn').click();await p.locator('#profilePreviewModal').waitFor({state:'visible'});}},
  {name:'listing-edit',path:`sell.html?edit=${product.id}`,open:async p=>{await p.waitForFunction(()=>document.querySelector('#productNameInput').value.length>0);}},
  {name:'checkout-meetup',path:`orders.html?product=${otherProduct.id}`,open:async p=>{await p.locator('#checkoutView').waitFor({state:'visible'});assert(new URL(p.url()).searchParams.has('product'));}},
  {name:'checkout-shipping',path:`orders.html?product=${otherProduct.id}`,open:async p=>{await p.locator('#tabShipping').click();await p.locator('#shippingOptions').waitFor({state:'visible'});}},
  {name:'order-detail',path:'orders.html',open:async p=>{await p.locator('.order-card').first().waitFor();await p.evaluate(()=>window.viewOrderDetails('66666666-6666-4666-8666-666666666666'));}},
  {name:'chat-conversation',path:'chat.html',open:async p=>{await p.locator('.chat-list-item:not(.support-item)').first().click();await p.locator('.message-bubble-modern').waitFor();}},
  {name:'new-conversation',path:'chat.html',open:async p=>{await p.locator('.chat-list-header .btn-icon-small').click();await p.locator('#newChatUsernameInput').waitFor();}},
  ...['users','products','transactions','orders','chats','tickets','analytics','settings'].map(tab=>({name:`admin-${tab}`,path:'admin.html',open:async p=>{await p.locator(`.admin-nav-btn[data-tab=${tab}]`).click();await p.waitForTimeout(200);}})),
  {name:'support-thread',path:'chat.html',open:async p=>{await p.locator('#supportShortcutBtn').click();await p.locator('#chatMessages .admin-card').waitFor();}},
  {name:'cancel-order-dialog',path:'orders.html',open:async p=>{await p.evaluate(()=>window.cancelOrder('66666666-6666-4666-8666-666666666666'));}},
  {name:'tracking-dialog',path:'orders.html',open:async p=>{await p.evaluate(()=>window.addTrackingNumber('66666666-6666-4666-8666-666666666666'));}},
  {name:'admin-product-dialog',path:'admin.html',open:async p=>{await p.evaluate(id=>window.viewProductDetails(id),'22222222-2222-4222-8222-222222222222');await p.locator('#adminDataModal').waitFor({state:'visible'});}},
  {name:'admin-user-dialog',path:'admin.html',open:async p=>{await p.evaluate(id=>window.viewUserDetails(id),user.id);await p.locator('#userDetailModal').waitFor({state:'visible'});}}
];
try {
 for(const [lang,theme] of [['en','light'],['lv','dark']]) {
  for(const item of cases.filter(item => !process.env.RESPONSIVE_STATE_FILTER || item.name.includes(process.env.RESPONSIVE_STATE_FILTER))) {
   const f=await fixture(browser,{lang,theme});
   try {
    await f.page.goto(`${baseURL}/${item.path}`,{waitUntil:'domcontentloaded'});await f.page.waitForTimeout(450);
    await f.page.evaluate(async({lang,theme})=>{const {i18n}=await import('/src/i18n.js');i18n.setLang(lang);document.documentElement.dataset.theme=theme;document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(theme);},{lang,theme});
    await item.open(f.page);await f.page.waitForTimeout(120);
    await checkState(f.page,item.name,lang,theme);
    if(item.name==='chat-conversation') {
      await f.page.setViewportSize({width:375,height:500});await f.page.locator('#messageInput').focus();
      const composer=await f.page.locator('.chat-input-area').boundingBox();assert(composer.y+composer.height<=501,'Composer is below the shortened viewport');
      await f.page.locator('#chatBackBtn').click();assert(await f.page.locator('.chat-sidebar.mobile-visible').isVisible());
    }
    const bad=results.filter(r=>r.state===item.name&&r.lang===lang&&(r.overlaps?.length||r.overflow||r.outside.length||r.clippedControls.length||r.localOverflows.length));
    console.log(JSON.stringify({state:item.name,lang,issues:bad.length,first:bad[0],errors:[...new Set(f.errors)]}));
    if(f.errors.length)results.push({state:item.name,lang,errors:f.errors});
   }catch(e){results.push({state:item.name,lang,error:e.message});console.log(JSON.stringify({state:item.name,lang,error:e.message}));}
   finally{await f.context.close();}
  }
 }
 // Navigation interaction checks on every page that offers the full menu.
 if(!process.env.RESPONSIVE_STATE_FILTER) for(const name of ['index','login','register','sell','product','orders','balance','chat','settings','admin','resend-verification']) {
  const f=await fixture(browser,{signedIn:!['login','register','resend-verification'].includes(name),lang:'lv'});
  try {
   await f.page.goto(`${baseURL}/${name}.html`);await f.page.waitForTimeout(300);
   for(const width of [320,600,768,844,1024,1280,1440]) {
    await f.page.setViewportSize({width,height:width===844?390:844});await f.page.waitForTimeout(80);
    if(width<=1024) {
      await f.page.locator('#hamburgerBtn').click();await f.page.waitForTimeout(280);
      assert.equal(await f.page.locator('#hamburgerBtn').getAttribute('aria-expanded'),'true');
      await f.page.locator('#pagesDropdownMenu a[href="product.html"]').scrollIntoViewIfNeeded();
      assert(await f.page.locator('#pagesDropdownMenu a[href="product.html"]').isVisible());
    }else{await f.page.locator('#pagesDropdownBtn').click();}
    await f.page.locator('#pagesDropdownMenu a[href="product.html"]').waitFor({state:'visible'});
    assert.equal(await f.page.locator('#pagesDropdownMenu a[href="product.html"]').innerText(),'Mani produkti');
    const label=await f.page.locator('#pagesDropdownMenu a[href="product.html"]').boundingBox();assert(label.x>=0&&label.x+label.width<=width+1);
    await f.page.locator('#notificationsBtn').click();await f.page.locator('#notificationsDropdown').waitFor({state:'visible'});
    const popover=await f.page.locator('#notificationsDropdown').boundingBox();assert(popover.x>=0&&popover.x+popover.width<=width+1);
    await f.page.keyboard.press('Escape');await f.page.waitForTimeout(280);
    results.push({state:'navigation',page:name,width,passed:true});
   }
  }catch(e){results.push({state:'navigation',page:name,error:e.message});console.log(JSON.stringify({state:'navigation',page:name,error:e.message}));}
  finally{await f.context.close();}
 }
}finally{await browser.close();await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));}
const failed=results.filter(r=>r.error||r.errors?.length||r.overlaps?.length||r.overflow||r.outside?.length||r.clippedControls?.length||r.localOverflows?.length);
console.log(JSON.stringify({checks:results.length,failures:failed.length,output}));process.exitCode=failed.length?1:0;
