import fs from 'fs';

let css = fs.readFileSync('css/styles.css', 'utf8');

css += `
/* Mobile Icons Row Grouping */
.mobile-icons-row {
  display: flex !important;
  flex-direction: row;
  gap: 1rem;
  justify-content: center;
  width: 100%;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  /* Undo hide of sell/balance text in mobile menu */
  .navbar-links.active .btn-sell span,
  .navbar-links.active .balance-badge span {
    display: inline !important;
  }

  /* Make Pages Dropdown flat on mobile (like 3 original lines) */
  #pagesDropdown {
    display: contents; /* Strip out the dropdown container constraints */
  }
  
  #pagesDropdown .dropdown-btn {
    display: none !important;
  }

  #pagesDropdown .dropdown-menu {
    display: flex !important;
    flex-direction: column !important;
    position: static;
    visibility: visible;
    opacity: 1;
    box-shadow: none;
    border: none;
    background: transparent;
    padding: 0;
    transform: none;
    width: 100%;
  }
  
  #pagesDropdown .dropdown-item {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
`;

fs.writeFileSync('css/styles.css', css);
console.log('Appended mobile patches directly to styles.css!');
