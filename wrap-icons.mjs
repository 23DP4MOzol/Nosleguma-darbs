import fs from 'fs';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Wrap the three specific icons inside a new div `<div class="mobile-icons-row">`
  // We match from settings to theme toggle
  const startPattern = '<a href="settings.html" class="icon-btn">⚙️</a>';
  const notificationsPattern = '<!-- Notifications -->\n      <button class="icon-btn" id="notificationsBtn"';
  
  if (content.includes(startPattern) && !content.includes('class="mobile-icons-row"')) {
    content = content.replace(
      '<a href="settings.html" class="icon-btn">⚙️</a>',
      '<div class="mobile-icons-row">\n      <a href="settings.html" class="icon-btn">⚙️</a>'
    );
    
    content = content.replace(
      '<button class="icon-btn" id="themeToggle">🌙</button>',
      '<button class="icon-btn" id="themeToggle">🌙</button>\n      </div>'
    );

    fs.writeFileSync(f, content);
    console.log('Fixed', f);
  }
}
