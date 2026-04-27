const fs = require('fs');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('<button class="dropdown-btn">☰</button>')) {
    content = content.replace(
      /<button class="dropdown-btn">☰<\/button>/g,
      '<button class="dropdown-btn" style="display:flex; align-items:center; gap:4px;"><span data-i18n="pages_menu">Pages</span> ▾</button>'
    );
    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
}
