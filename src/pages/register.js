import { supabase } from '../supabase.js';
import { i18n } from '../i18n.js';

// ============================
// Terms Content (English)
// ============================
const termsContentEN = `
  <div class="terms-section">
    <h3>⚠️ IMPORTANT WARNING - ANTI-SCAM POLICY</h3>
    
    <div class="warning-box">
      <h4>🚨 Zero Tolerance for Scams</h4>
      <p>Vendly has a ZERO TOLERANCE policy for fraudulent activity, scams, and deceptive practices. Any user found engaging in scamming activities will be immediately banned, reported to authorities, and may face legal action.</p>
    </div>
    
    <div class="danger-box">
      <h4>⚖️ Legal Consequences</h4>
      <p>By using Vendly, you acknowledge that scamming activities are illegal and may result in criminal prosecution, civil lawsuits, and substantial financial penalties. We actively cooperate with law enforcement agencies worldwide to prosecute scammers.</p>
    </div>
  </div>
  
  <div class="terms-section">
    <h3>📜 1. ACCEPTANCE OF TERMS</h3>
    <p>By creating an account on Vendly, you agree to be bound by these Terms of Service, our Privacy Policy, and our Anti-Scam Policy. If you do not agree to these terms, you must not use our platform.</p>
    
    <h4>1.1 Age Requirements</h4>
    <p>You must be at least 18 years old to use Vendly. By using our platform, you represent and warrant that you have the legal capacity to enter into a binding contract.</p>
    
    <h4>1.2 Account Responsibility</h4>
    <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
  </div>
  
  <div class="terms-section">
    <h3>🛡️ 2. ANTI-SCAM COMMITMENTS</h3>
    
    <div class="legal-box">
      <h4>📝 User Anti-Scam Agreement</h4>
      <p>As a condition of using Vendly, you hereby agree to the following:</p>
    </div>
    
    <ul>
      <li><strong>I will NOT</strong> engage in any fraudulent transactions or deceptive practices</li>
      <li><strong>I will NOT</strong> sell counterfeit, stolen, or illegal goods</li>
      <li><strong>I will NOT</strong> use fake identities or impersonate others</li>
      <li><strong>I will NOT</strong> manipulate prices or ratings through fake reviews</li>
      <li><strong>I will NOT</strong> attempt to take payments outside of the Vendly platform</li>
      <li><strong>I will NOT</strong> engage in phishing, hacking, or unauthorized access</li>
      <li><strong>I will NOT</strong> launder money through the platform</li>
      <li><strong>I will NOT</strong> threaten, harass, or intimidate other users</li>
      <li><strong>I will NOT</strong> provide false or misleading product information</li>
      <li><strong>I will NOT</strong> fail to deliver products after receiving payment</li>
    </ul>
  </div>
  
  <div class="terms-section">
    <h3>🚫 3. PROHIBITED ACTIVITIES (SCAM TYPES)</h3>
    
    <div class="scam-item">
      <strong>🎣 Phishing Scams:</strong> Fake emails or messages pretending to be from Vendly asking for your password or payment details. We will NEVER ask for your password via email.
    </div>
    
    <div class="scam-item">
      <strong>💸 Advance Fee Fraud:</strong> Requests for payment before delivery that never happens. Always use Vendly's secure payment system.
    </div>
    
    <div class="scam-item">
      <strong>📦 Non-Delivery Scams:</strong> Sellers who take payment but never ship products. We track all shipments and require proof of delivery.
    </div>
    
    <div class="scam-item">
      <strong>🔄 Counterfeit Goods:</strong> Selling fake brand items. All listings are monitored and verified where possible.
    </div>
    
    <div class="scam-item">
      <strong>👤 Identity Theft:</strong> Using stolen personal or payment information. All transactions are verified against fraud databases.
    </div>
  </div>
  
  <div class="terms-section">
    <h3>⚖️ 4. LEGAL CONSEQUENCES OF SCAMMING</h3>
    
    <h4>4.1 Criminal Prosecution</h4>
    <p>Users caught engaging in fraudulent activities may be reported to local and international law enforcement agencies.</p>
    
    <h4>4.2 Civil Liability</h4>
    <p>Scammers may be held liable for full restitution, triple damages, legal fees, and punitive damages.</p>
    
    <h4>4.3 Financial Penalties</h4>
    <p>Depending on jurisdiction, penalties may include fines up to €250,000, asset seizure, and permanent bans from financial services.</p>
  </div>
  
  <div class="terms-section">
    <h3>📋 5. ACKNOWLEDGMENT</h3>
    
    <div class="legal-box">
      <p><strong>By clicking "Accept & Register", I hereby:</strong></p>
      <ul style="margin-top: 0.5rem;">
        <li>Certify that I have read and understood these Terms</li>
        <li>Agree to comply with all platform rules</li>
        <li>Acknowledge that violations may result in account termination</li>
        <li>Understand that scamming is a serious crime</li>
        <li>Consent to data processing for security purposes</li>
      </ul>
    </div>
  </div>
`;

// ============================
// Terms Content (Latvian)
// ============================
const termsContentLV = `
  <div class="terms-section">
    <h3>⚠️ SVARĪGS BRĪDINĀJUMS - PRETKRĀPŠANAS POLITIKA</h3>
    
    <div class="warning-box">
      <h4>🚨 NULLE TOLERANCE PRET KRĀPŠANU</h4>
      <p>Vendly ir NULLE TOLERANCE politika attiecībā uz krāpšanas darbībām. Jebkurs lietotājs, kas tiks pieķerts krāpšanas darbībās, tiks nekavējoties bloķēts.</p>
    </div>
    
    <div class="danger-box">
      <h4>⚖️ Juridiskās sekas</h4>
      <p>Izmantojot Vendly, jūs apzināties, ka krāpšanas darbības ir nelikumīgas un var izraisīt kriminālvajāšanu un būtiskus finansiālus sodus.</p>
    </div>
  </div>
  
  <div class="terms-section">
    <h3>📜 1. NOTEIKUMU PIEŅEMŠANA</h3>
    <p>Izveidojot kontu platformā Vendly, jūs piekrītat šiem Lietošanas noteikumiem. Ja jūs nepiekrītat šiem noteikumiem, jums ir jāpārtrauc izmantot mūsu platformu.</p>
    
    <h4>1.1 Vecuma prasības</h4>
    <p>Jums ir jābūt vismaz 18 gadus vecam, lai izmantotu Vendly.</p>
    
    <h4>1.2 Konta atbildība</h4>
    <p>Jūs esat atbildīgs par sava konta akreditācijas datu konfidencialitāti.</p>
  </div>
  
  <div class="terms-section">
    <h3>🛡️ 2. PRETKRĀPŠANAS SAISTĪBAS</h3>
    
    <div class="legal-box">
      <h4>📝 Lietotāja Pretkrāpšanas līgums</h4>
      <p>Jūs ar šo piekrītat sekojošajam:</p>
    </div>
    
    <ul>
      <li><strong>Es NEDARĪŠU</strong> nekādas krāpšanas darbības</li>
      <li><strong>Es NEDARĪŠU</strong> pārdot viltojumus vai zagtus produktus</li>
      <li><strong>Es NEDARĪŠU</strong> izmantot viltotas identitātes</li>
      <li><strong>Es NEDARĪŠU</strong> manipulēt ar cenām vai reitingiem</li>
      <li><strong>Es NEDARĪŠU</strong> mēģināt veikt maksājumus ārpus platformas</li>
      <li><strong>Es NEDARĪŠU</strong> iesaistīties pikšķerēšanā</li>
      <li><strong>Es NEDARĪŠU</strong> naudas atmazgāšanā</li>
      <li><strong>Es NEDARĪŠU</strong> draudēt vai aizskart citus lietotājus</li>
      <li><strong>Es NEDARĪŠU</strong> sniegt nepatiesu informāciju</li>
      <li><strong>Es NEDARĪŠU</strong> nepiegādāt produktus pēc maksājuma</li>
    </ul>
  </div>
  
  <div class="terms-section">
    <h3>🚫 3. AIZLIEGTAS AKTIVITĀTES</h3>
    
    <div class="scam-item">
      <strong>🎣 Pikšķerēšana:</strong> Viltoti e-pasti, kas izlikas par Vendly. Mēs NEKAD nelūgsim paroli pa e-pastu.
    </div>
    
    <div class="scam-item">
      <strong>💸 Iepriekšējās maksas krāpšana:</strong> Lūgumi par maksājumu pirms piegādes, kas nekad nenotiek.
    </div>
    
    <div class="scam-item">
      <strong>📦 Nepiegādes krāpšana:</strong> Pārdevēji, kas saņem maksājumu, bet nepiegādā produktus.
    </div>
    
    <div class="scam-item">
      <strong>🔄 Viltotas preces:</strong> Viltotu zīmolu preču pārdošana.
    </div>
    
    <div class="scam-item">
      <strong>👤 Identitātes zādzība:</strong> Izmantot svešu personīgo informāciju.
    </div>
  </div>
  
  <div class="terms-section">
    <h3>⚖️ 4. JURIDISKĀS SEKAS</h3>
    
    <h4>4.1 Kriminālvajāšana</h4>
    <p>Krāpnieki var tikt ziņoti tiesībsargājošām iestādēm.</p>
    
    <h4>4.2 Civiltiesiskā atbildība</h4>
    <p>Scammers var tikt saukti pie atbildības par zaudējumu atlīdzināšanu.</p>
    
    <h4>4.3 Finansiālie sodi</h4>
    <p>Sodi var ietvert naudas sodus līdz €250,000 un īpašuma konfiskāciju.</p>
  </div>
  
  <div class="terms-section">
    <h3>📋 5. APSTIPRINĀJUMS</h3>
    
    <div class="legal-box">
      <p><strong>Noklikšķinot "Pieņemt un reģistrēties", es ar šo:</strong></p>
      <ul style="margin-top: 0.5rem;">
        <li>Apstiprinu, ka esmu izlasījis šos noteikumus</li>
        <li>Piekrītu ievērot visus platformas noteikumus</li>
        <li>Apzinos, ka pārkāpumi var izraisīt konta izbeigšanu</li>
        <li>Izprotu, ka krāpšana ir nopietns noziegums</li>
      </ul>
    </div>
  </div>
`;

// ============================
// Terms Modal Functions
// ============================
function openTermsModal() {
  const modal = document.getElementById('termsModal');
  const body = document.getElementById('termsModalBody');
  const currentLang = i18n.lang || 'en';
  
  // Load terms content based on current language
  body.innerHTML = currentLang === 'lv' ? termsContentLV : termsContentEN;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
  const modal = document.getElementById('termsModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ============================
// Language Setup
// ============================
document.getElementById('langSelect').addEventListener('change', e => {
  i18n.setLang(e.target.value);
});

// ============================
// Dark/Light Mode Toggle
// ============================
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.classList.add(savedTheme);
document.documentElement.setAttribute("data-theme", savedTheme);
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.classList.remove('dark', 'light');
    html.classList.add(newTheme);
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? "☀️" : "🌙";
  });
}

// ============================
// Hamburger Mobile Menu
// ============================
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.querySelector('.navbar-links').classList.toggle('active');
});

// ============================
// Supabase Auth
// ============================
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const balanceBadge = document.getElementById('balanceBadge');

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if(user) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'flex';
    const { data } = await supabase.from('users').select('balance').eq('id', user.id).single();
    balanceBadge.querySelector('span').innerText = `€${parseFloat(data.balance).toFixed(2)}`;
    balanceBadge.style.display = 'flex';
  } else {
    loginBtn.style.display = 'flex';
    logoutBtn.style.display = 'none';
    balanceBadge.style.display = 'none';
  }
}

loginBtn.addEventListener('click', async () => {
  window.location.href = 'login.html';
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
});

loadUser();

// ============================
// Terms Modal Event Listeners
// ============================
document.getElementById('readTermsLink')?.addEventListener('click', openTermsModal);
document.getElementById('termsModalClose')?.addEventListener('click', closeTermsModal);
document.getElementById('termsModal')?.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeTermsModal();
});

document.getElementById('declineTerms')?.addEventListener('click', () => {
  document.getElementById('acceptTerms').checked = false;
  closeTermsModal();
});

document.getElementById('acceptTermsBtn')?.addEventListener('click', () => {
  document.getElementById('acceptTerms').checked = true;
  closeTermsModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeTermsModal();
});

// ============================
// Registration Form Submission
// ============================
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('usernameInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;
  const acceptTerms = document.getElementById('acceptTerms').checked;
  const termsError = document.getElementById('termsError');

  // Validation
  if (password !== confirmPassword) {
    alert(i18n.t('passwords_not_match') || 'Passwords do not match');
    return;
  }

  if (password.length < 6) {
    alert(i18n.t('password_too_short') || 'Password must be at least 6 characters');
    return;
  }

  // Terms acceptance validation
  if (!acceptTerms) {
    termsError.classList.add('show');
    openTermsModal(); // Open modal to show terms
    return;
  }
  termsError.classList.remove('show');

  // Anti-scam warning before final submission
  const { showConfirmModal } = await import('../ui/modal.js');
  const confirmScamWarning = await showConfirmModal({
    title: 'Anti-scam Warning',
    message: '⚠️ IMPORTANT ANTI-SCAM WARNING\n\nBy proceeding, you acknowledge that:\n• Scamming is a serious crime\n• You may face criminal prosecution\n• You may be sued civilly\n• We cooperate with law enforcement\n\nDo you acknowledge and agree?',
    okText: 'I Agree',
    cancelText: 'Cancel'
  });
  if (!confirmScamWarning) return;

  try {
    // First, check if email already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      alert('⚠️ Email Already Registered\n\nThis email address is already registered in our system.\n\nIf you already have an account, please log in instead.');
      return;
    }

    // Also check if email is already in auth (might not be in users table yet)
    // Note: We can't directly check auth.users table, but Supabase will return an error

    // Register user with Supabase Auth
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          accepted_terms_at: new Date().toISOString(),
          accepted_terms_version: '2026-01',
          accepted_terms_lang: i18n.lang || 'en'
        }
      }
    });

    if (result.error) {
      // Handle specific errors
      if (result.error.message.includes('already registered') || 
          result.error.message.includes('User already exists') ||
          result.error.message.includes('email')) {
        alert('⚠️ Email Already Registered\n\nThis email address is already registered in our system.\n\nIf you already have an account, please log in instead.');
        return;
      }
      throw result.error;
    }
    
    if (!result.data.user) throw new Error('User creation failed');
    
    // Insert user record into public users table
    const { error: insertError } = await supabase.from('users').upsert({
      id: result.data.user.id,
      email: email,
      username: username || email.split('@')[0],
      balance: 0,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    });

    if (insertError) {
      // Show warning but don't block registration - auth user was created
      console.error('Error inserting user record:', insertError);
      alert('⚠️ Account Created with Warning\n\nYour account was created in our authentication system, but there was a minor issue saving your profile data.\n\nPlease contact support if this persists.\n\nYou can still log in and use most features.');
    } else {
      // Success - user fully registered
      alert('Registration Successful!\n\nPlease check your email inbox for the verification link.\n\nIMPORTANT: You must verify your email address before you can log in.\n\nCheck your spam folder if you dont see the email.');
    }
    
    // Instead of redirecting to login, redirect to login with verify_required reason
    // which will show the resend verification form
    window.location.href = 'login.html?reason=verify_required&email=' + encodeURIComponent(email);

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message || 'Registration failed. Please try again.';
    
    if (errorMessage.includes('already registered') || 
        errorMessage.includes('User already exists') ||
        errorMessage.includes('email') && errorMessage.includes('already')) {
      alert('⚠️ Email Already Registered\n\nThis email address is already registered in our system.\n\nIf you already have an account, please log in instead.');
    } else if (errorMessage.includes('Password')) {
      alert('⚠️ Password Error\n\n' + errorMessage + '\n\nPlease choose a different password.');
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      alert('⚠️ Network Error\n\nUnable to connect to the server.\n\nPlease check your internet connection and try again.');
    } else {
      alert('Registration Error\n\n' + errorMessage + '\n\nPlease try again or contact support if the problem persists.');
    }
  }
});
