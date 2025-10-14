// =====================================
// i18n.js - Internationalization module
// =====================================
export const i18n = {
    lang: 'en', // default language
  
    // Translation dictionary
    strings: {
      en: {
        welcome: "Welcome",
        buy: "Buy",
        sell: "Sell",
        login: "Login",
        logout: "Logout",
        balance: "Balance",
        popularProducts: "Popular Products",
        topTrending: "Top trending items on the marketplace",
        featuredMarketplace: "Featured Marketplace",
        startShopping: "Start Shopping",
        learnMore: "Learn More",
        products: "Products",
        sellers: "Sellers",
        users: "Users",
        reserve: "Reserve",
        insufficientBalance: "Insufficient balance",
        loginFirst: "Please login first",
        purchaseComplete: "Purchase completed",
        addBalance: "Add Balance",
        settings: "Settings",
        username: "Username",
        save: "Save",
        saved: "Saved successfully",
        reserved: "Reserved",
        stock: "Stock",
        description: "Description",
        category: "Category",
        condition: "Condition",
        location: "Location",
        quickView: "Quick View",
        buyNow: "Buy Now",
        addToCart: "Add to Cart"
      },
      lv: {
        welcome: "Laipni lūdzam",
        buy: "Pirkt",
        sell: "Pārdot",
        login: "Pieslēgties",
        logout: "Izrakstīties",
        balance: "Bilance",
        popularProducts: "Populārākie produkti",
        topTrending: "Populārākie produkti tirgū",
        featuredMarketplace: "Izceltā tirgus vieta",
        startShopping: "Sākt iepirkties",
        learnMore: "Uzzināt vairāk",
        products: "Produkti",
        sellers: "Pārdevēji",
        users: "Lietotāji",
        reserve: "Rezervēt",
        insufficientBalance: "Nepietiekams bilances atlikums",
        loginFirst: "Lūdzu, vispirms pieslēdzieties",
        purchaseComplete: "Pirkums pabeigts",
        addBalance: "Pievienot bilanci",
        settings: "Iestatījumi",
        username: "Lietotājvārds",
        save: "Saglabāt",
        saved: "Veiksmīgi saglabāts",
        reserved: "Rezervēts",
        stock: "Krājums",
        description: "Apraksts",
        category: "Kategorija",
        condition: "Stāvoklis",
        location: "Atrašanās vieta",
        quickView: "Ātrā apskate",
        buyNow: "Pirkt tagad",
        addToCart: "Pievienot grozam"
      }
    },
  
    // Translate a key
    t(key) {
      return this.strings[this.lang]?.[key] || this.strings['en'][key] || key;
    },
  
    // Set current language and update all elements
    setLang(lang) {
      if (!this.strings[lang]) {
        console.warn(`Language ${lang} not found, defaulting to English`);
        lang = 'en';
      }
      this.lang = lang;
  
      // Translate all elements with data-i18n
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.innerText = this.t(key);
      });
  
      // Translate dynamic product cards
      document.querySelectorAll('.product-card-modern').forEach(card => {
        const catEl = card.querySelector('.product-category');
        const priceEl = card.querySelector('.price-amount');
        const buyBtn = card.querySelector('.btn-buy-now');
        const reserveBtn = card.querySelector('.product-badge-new');
  
        if (buyBtn) buyBtn.innerText = this.t('buyNow');
        if (reserveBtn && reserveBtn.dataset.status === 'reserved') reserveBtn.innerText = this.t('reserved');
      });
  
      // Translate modal if open
      const modal = document.getElementById('productModal');
      if(modal) {
        modal.querySelectorAll('[data-i18n]').forEach(el => {
          const key = el.dataset.i18n;
          el.innerText = this.t(key);
        });
      }
    },
  
    // Format currency
    formatCurrency(amount) {
      return new Intl.NumberFormat(this.lang, { style: 'currency', currency: 'EUR' }).format(amount);
    }
  };
  
  // Auto-apply translations on page load
  window.addEventListener('DOMContentLoaded', () => {
    i18n.setLang(i18n.lang);
  });
  