export async function measure(page) {
  return page.evaluate(() => {
    const visible = el => { const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return r.width>0 && r.height>0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const label = el => el.tagName.toLowerCase() + (el.id ? '#'+el.id : '') + '.' + [...el.classList].slice(0,2).join('.');
    const outside = [...document.querySelectorAll('body *')].filter(visible).filter(el => {
      const r=el.getBoundingClientRect();
      if (r.right <= innerWidth+1 && r.left >= -1) return false;
      // Overflow inside deliberately scrollable tables, tabs and image carousels is local.
      for(let p=el.parentElement;p && p!==document.body;p=p.parentElement) {
        if (['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX) && p.getBoundingClientRect().right<=innerWidth+1 && p.getBoundingClientRect().left>=-1) return false;
      }
      return true;
    }).slice(0,12).map(label);
    const clippedControls = [...document.querySelectorAll('main input, main select, main textarea, main button')].filter(visible).filter(el => {
      const r=el.getBoundingClientRect();
      for(let p=el.parentElement;p && p!==document.body;p=p.parentElement) {
        const pr=p.getBoundingClientRect();
        if (getComputedStyle(p).overflowX==='hidden' && (r.right>pr.right+1 || r.left<pr.left-1)) return true;
      }
      return false;
    }).slice(0,8).map(label);
    const overlaps = [];
    const groups = '.navbar-container, .navbar-links, .form-grid, .product-grid-modern, .settings-layout, .balance-section, .chat-input-area, .chat-header-bar';
    for (const group of document.querySelectorAll(groups)) {
      const children = [...group.children].filter(visible).filter(el => !['absolute','fixed'].includes(getComputedStyle(el).position));
      for (let i=0; i<children.length; i++) for(let j=i+1; j<children.length; j++) {
        const a=children[i].getBoundingClientRect(), b=children[j].getBoundingClientRect();
        if (Math.min(a.right,b.right)-Math.max(a.left,b.left)>2 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2) overlaps.push([label(children[i]),label(children[j])]);
      }
    }
    return { overlaps, documentWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth>innerWidth+1, outside, clippedControls };
  });
}
