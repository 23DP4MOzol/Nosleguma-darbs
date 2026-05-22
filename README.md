# Vendly - Modern Marketplace Web Application

A full-featured marketplace web application built with Vite, Vanilla JS, TailwindCSS, and Supabase. Vendly enables users to buy and sell products with secure messaging, balance management, escrow transactions, and multi-language support (English/Latvian).

![Vendly Logo](./assets/vendly-logo.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Project Structure](#-project-structure)
- [Available Pages](#-available-pages)
- [Development Commands](#-development-commands)
- [Deployment](#-deployment)
- [Database Schema](#-database-schema)
- [Email Verification Rules](#-email-verification-rules)
- [Platform Controls (Admin)](#-platform-controls-admin)
- [Audit Logs (14-days)](#-audit-logs-14-days)
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)
- [Latviešu (LV)](#-latviešu-lv)

---

## ✨ Features

### Recent Updates
- Parcel-locker selection on the Sell page now supports all configured carriers in one map: Omniva, Venipak, DPD, and Latvijas Pasts.
- Seller-side address origin entry was removed from the Sell flow; products are now listed using parcel-locker origin selection only.
- Home page now includes an Auto/Cars category drill-down with quick subcategory filters:
   Vieglie auto, Auto ar defektu, Preču auto, Kemperi, Piekabes, Riepas, Diski, Rezerves daļas, Dažādi.
- Additional Sell and Home UI text was moved into i18n keys for English and Latvian coverage.
- Email verification is enforced: users cannot log in until they have confirmed their email.
- Login page shows a “resend verification” option after ~15 minutes from signup (best-effort, using localStorage).
- Admin can publish a site-wide warning banner + temporarily disable buying and/or listing.
- Admin can view and purge a rolling ~14-day audit log of actions (page views, auth events, admin setting changes).

### Core Functionality
- **🛒 Product Marketplace** - Browse, search, and filter products across multiple categories
- **💰 Balance Management** - Add funds, make purchases, and track transactions
- **🔒 Secure Transactions** - Escrow-based purchases with dispute resolution
- **💬 Real-time Messaging** - Chat with buyers/sellers for negotiations
- **⭐ Reviews & Ratings** - Trust system with seller ratings
- **📦 Order Management** - Track orders with shipping integration
- **🎨 Favorites** - Save products to your wishlist

### User Features
- **🔐 Authentication** - Email/password with email verification
- **🌙 Dark/Light Mode** - Theme toggle with system preference detection
- **🌍 Multi-language Support** - English and Latvian localization
- **👤 User Profiles** - Edit profile, bio, and preferences
- **📱 Responsive Design** - Mobile-first design for all devices

### Admin Features
- **📊 Dashboard** - Overview of marketplace statistics
- **👥 User Management** - View and manage registered users
- **📦 Product Moderation** - Oversee product listings
- **🎫 Support Tickets** - Handle dispute resolution
- **💳 Transaction History** - Track all financial transactions

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **Vite** | Build tool and dev server |
| **Vanilla JS** | Frontend framework (ES6 modules) |
| **TailwindCSS v4** | Utility-first styling |
| **Supabase** | Backend-as-a-Service (Auth, DB, Storage) |
| **i18next** | Internationalization |
| **PostCSS** | CSS processing |

---

## 📦 Prerequisites

- Node.js >= 18
- npm or yarn
- Supabase account (free tier works)

---

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nosleguma-darbs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`

---

## ⚙️ Configuration

### Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** to get your project URL and anon key
3. Enable **Email Auth** in Authentication settings
4. Create the following database tables (see [Database Schema](#-database-schema))

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

---

## 📁 Project Structure

```
nosleguma-darbs/
├── _headers              # Netlify headers configuration
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── AGENTS.md            # Development agent instructions
├── netlify.toml         # Netlify deployment config
├── package.json         # Dependencies and scripts
├── postcss.config.cjs   # PostCSS configuration
├── tailwind.config.js   # TailwindCSS configuration
├── vite.config.js      # Vite configuration
│
├── admin.html           # Admin dashboard page
├── balance.html         # Balance management page
├── chat.html            # Messaging page
├── login.html           # Login page
├── product.html         # My products page
├── register.html        # Registration page
├── resend-verification.html  # Email verification page
├── sell.html            # Sell/listing page
├── settings.html        # User settings page
├── terms.html           # Terms of service (EN)
├── terms-lv.html       # Terms of service (LV)
│
├── assets/
│   ├── icons/           # Icon assets
│   ├── images/          # Image assets
│   └── vendly-logo.svg # Logo
│
├── css/
│   └── styles.css       # Global styles
│
└── src/
    ├── ai-widget.js     # AI chatbot widget
    ├── app.js          # Main app logic
    ├── i18n.js         # Internationalization
    ├── main.js         # Entry point
    ├── navbar.js       # Navigation component
    ├── product-modal.js # Product modal
    ├── supabase.js     # Supabase client & helpers
    │
    └── pages/
        ├── admin.js    # Admin page logic
        ├── balance.js  # Balance page logic
        ├── chat.js     # Chat page logic
        ├── login.js    # Login page logic
        ├── product.js  # Products page logic
        ├── register.js # Registration page logic
        ├── sell.js     # Sell page logic
        └── settings.js # Settings page logic
```

---

## 📄 Available Pages

| Page | File | Description |
|------|------|-------------|
| **Home** | `index.html` | Marketplace homepage with product grid |
| **Login** | `login.html` | User authentication |
| **Register** | `register.html` | New user registration |
| **Products** | `product.html` | My products & favorites |
| **Sell** | `sell.html` | List new products |
| **Balance** | `balance.html` | Funds & transactions |
| **Chat** | `chat.html` | Messaging system |
| **Admin** | `admin.html` | Admin dashboard |
| **Settings** | `settings.html` | User profile & preferences |
| **Terms** | `terms.html` | Terms of service (EN) |
| **Terms LV** | `terms-lv.html` | Terms of service (LV) |

---

## 🏗 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 5173 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview production build locally |

---

## 🚀 Deployment

### Netlify (Recommended)

1. Push your code to a Git repository
2. Connect to Netlify
3. Set environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

Netlify configuration is already set in [`netlify.toml`](./netlify.toml).

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel`
3. Set environment variables in Vercel dashboard

### Manual Build

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

---

## 📲 PWA Support

This project includes basic Progressive Web App support:

- `manifest.webmanifest` at project root (app name, icons, theme colors)
- `service-worker.js` at project root provides a simple offline cache for core assets
- `src/sw-register.js` registers the service worker in supported browsers

To test PWA behaviour locally:

```bash
npm run dev
# Open http://localhost:5173 in Chrome, then open DevTools > Application to inspect manifest and service worker
```

Note: For production hosting, ensure the service worker and manifest are served from the site root so the PWA scope covers the application.


## 🗄 Database Schema

### Main Tables

#### `users`
```sql
id UUID PRIMARY KEY,
email TEXT NOT NULL,
username TEXT,
balance DECIMAL DEFAULT 0,
role TEXT DEFAULT 'user',
avatar_url TEXT,
bio TEXT,
what_i_sell TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

#### `products`
```sql
id UUID PRIMARY KEY,
seller_id UUID REFERENCES users(id),
name TEXT NOT NULL,
description TEXT,
price DECIMAL NOT NULL,
category TEXT,
condition TEXT,
location TEXT,
image_url TEXT,
stock INTEGER DEFAULT 1,
is_reserved BOOLEAN DEFAULT FALSE,
reserved_by UUID,
reserved_at TIMESTAMP,
listing_fee DECIMAL,
original_price DECIMAL,
brand TEXT,
color TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

#### `user_transactions`
```sql
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
amount DECIMAL,
transaction_type TEXT,
description TEXT,
reference_id UUID,
escrow_id UUID,
escrow_status TEXT,
created_at TIMESTAMP
```

#### `conversations`
```sql
id UUID PRIMARY KEY,
product_id UUID,
buyer_id UUID REFERENCES users(id),
seller_id UUID REFERENCES users(id),
status TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

#### `messages`
```sql
id UUID PRIMARY KEY,
conversation_id UUID REFERENCES conversations(id),
sender_id UUID REFERENCES users(id),
content TEXT,
message_type TEXT,
is_read BOOLEAN,
created_at TIMESTAMP
```

#### `reviews`
```sql
id UUID PRIMARY KEY,
buyer_id UUID REFERENCES users(id),
seller_id UUID REFERENCES users(id),
product_id UUID REFERENCES products(id),
rating INTEGER,
comment TEXT,
created_at TIMESTAMP
```

#### `orders`
```sql
id UUID PRIMARY KEY,
product_id UUID,
buyer_id UUID REFERENCES users(id),
seller_id UUID REFERENCES users(id),
shipping_address TEXT,
shipping_cost DECIMAL,
order_status TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

#### `support_tickets`
```sql
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
issue_type TEXT,
description TEXT,
related_id UUID,
status TEXT,
resolution TEXT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

#### `favorites`
```sql
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
product_id UUID REFERENCES products(id),
created_at TIMESTAMP
```

---

## ✅ Email Verification Rules

Vendly enforces email verification before allowing a user to use an authenticated session.

- **Register**: After signup, Supabase sends a verification email. The app redirects the user back to `login.html` with a `verify_required` hint.
- **Login**: Even if Supabase returns a session, the app checks `email_confirmed_at`. If it’s missing, the app signs the user out and shows a verification-required state.
- **Resend verification**:
   - After signup, the app stores a local timestamp (`vendly_verify_email_state`) in `localStorage`.
   - If the email isn’t verified, the login page unlocks a resend option after ~15 minutes.
   - After an actual resend, there is also a short cooldown (60s) to prevent spam.

Note: The 15-minute unlock is **best-effort**. Clearing browser storage resets the timer.

---

## 🧰 Platform Controls (Admin)

Admins can manage site-wide switches from the Admin page. These settings are fetched on page load and applied globally.

### What it can do

- **Warning banner**: show a text-only warning at the top of every page.
- **Disable buying**: blocks checkout initiation.
- **Disable listing**: blocks new listings and disables Sell actions.

### Required database table: `platform_settings`

The frontend expects a single row with `id = 1`.

```sql
create table if not exists public.platform_settings (
   id integer primary key,
   warning_enabled boolean not null default false,
   warning_text text not null default '',
   disable_buying boolean not null default false,
   disable_listing boolean not null default false,
   updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
   new.updated_at = now();
   return new;
end;
$$;

drop trigger if exists set_platform_settings_updated_at on public.platform_settings;
create trigger set_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();
```

### Recommended RLS policies

```sql
alter table public.platform_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
   select exists (
      select 1
      from public.users u
      where u.id = auth.uid()
         and u.role = 'admin'
   );
$$;

drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read
on public.platform_settings
for select
using (true);

drop policy if exists platform_settings_admin_write on public.platform_settings;
create policy platform_settings_admin_write
on public.platform_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists platform_settings_admin_update on public.platform_settings;
create policy platform_settings_admin_update
on public.platform_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

To promote a user to admin, update their `role` in `public.users` (example):

```sql
update public.users
set role = 'admin'
where email = 'you@example.com';
```

---

## 🧾 Audit Logs (14-days)

Vendly includes a lightweight, best-effort audit log. The Admin page can display the last ~14 days and can purge older entries.

### What is logged (current)

- `page_view` (best-effort)
- auth events: signup, login success, login blocked (unverified), resend verification
- admin events: platform setting updates, audit purge
- enforcement events: checkout/listing blocked by admin toggles

### Required database table: `audit_logs`

```sql
create table if not exists public.audit_logs (
   id bigserial primary key,
   created_at timestamptz not null default now(),
   event_type text not null,
   event_data jsonb not null default '{}'::jsonb,
   actor_user_id uuid null references auth.users(id) on delete set null,
   actor_email text null,
   page_path text null,
   user_agent text null
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_event_type_idx on public.audit_logs (event_type);
```

### Recommended RLS policies

```sql
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
create policy audit_logs_insert_authenticated
on public.audit_logs
for insert
to authenticated
with check (
   actor_user_id is null or actor_user_id = auth.uid()
);

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists audit_logs_delete_admin on public.audit_logs;
create policy audit_logs_delete_admin
on public.audit_logs
for delete
to authenticated
using (public.is_admin());
```

Note: Because this is client-side logging (via the anon key), treat it as a **basic audit trail**. If you need stronger guarantees (tamper resistance, guaranteed actor identity), move logging into server-side RPC/functions.

---

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Email Verification** - Required before first login
- **Password Validation** - Minimum 6 characters
- **Input Sanitization** - XSS protection
- **Secure Messaging** - Private conversations
- **Escrow System** - Funds held until transaction complete
- **Anti-Scam Policy** - Built-in warnings and terms

---

## 🌍 Internationalization

Supported languages:
- **English (en)** - Default
- **Latvian (lv)** - Full localization

Language is auto-detected from browser settings and can be manually changed in the navbar.

---

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1024px)
- Mobile (< 768px)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues and questions:
1. Check the [Terms of Service](./terms.html) for platform policies
2. Contact support through the built-in chat system
3. Open an issue on GitHub

---

**Built with ❤️ using Vite, Supabase, and TailwindCSS**

---

## 🇱🇻 Latviešu (LV)

Vendly ir pilnvērtīga tirgus platformas tīmekļa lietotne, veidota ar Vite, Vanilla JS, TailwindCSS un Supabase. Tā ļauj lietotājiem pirkt un pārdot preces ar ziņapmaiņu, bilances pārvaldību, (iespējamu) escrow norēķinu loģiku un daudzvalodu atbalstu (EN/LV).

![Vendly Logo](./assets/vendly-logo.svg)

### Ātrā orientēšanās

- Izstrādes komandas: `npm run dev`, `npm run build`, `npm run preview`
- Vides mainīgie: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Papildu dokumentācija:
   - [ESCROW-SYSTEM.md](ESCROW-SYSTEM.md)
   - [ORDERS-SYSTEM-README.md](ORDERS-SYSTEM-README.md)
   - [FINAL-SETUP.md](FINAL-SETUP.md)

---

## ✨ Iespējas

### Pēdējie uzlabojumi

- Sūtījumu skapīšu izvēle pārdošanas plūsmā atbalsta vairākus pārvadātājus vienā kartē: Omniva, Venipak, DPD un Latvijas Pasts.
- Pārdevēja “izcelsmes adrese” pārdošanas plūsmā ir noņemta; preces tiek publicētas ar skapīša izcelsmes izvēli.
- Sākumlapā ir Auto/Karstās kategorijas apakškategoriju ātra izvēle.
- Papildu UI teksti tika pārcelti uz i18n atslēgām ar EN/LV atbalstu.
- E-pasta verifikācija ir obligāta: lietotājs nevar ielogoties, kamēr nav apstiprinājis e-pastu.
- Pieteikšanās lapā parādās iespēja “pārsūtīt verifikācijas e-pastu” pēc ~15 minūtēm kopš reģistrācijas (best-effort, izmanto `localStorage`).
- Admin var ieslēgt vietnes brīdinājuma joslu un īslaicīgi atslēgt pirkšanu un/vai sludinājumu publicēšanu.
- Admin var skatīt un tīrīt ~14 dienu audita ierakstus (lapu skatījumi, autentifikācija, admin iestatījumu maiņas u.c.).

### Pamatfunkcionalitāte

- **🛒 Tirgus** — preču pārlūkošana, filtrēšana, kategorizācija
- **💰 Bilance** — bilances pārvaldība un darījumu vēsture
- **💬 Ziņapmaiņa** — sarunas starp pircēju un pārdevēju
- **📦 Pasūtījumi** — pasūtījumu izveide un piegādes izvēles plūsma
- **🌍 Valodas** — EN/LV lokalizācija

### Admin funkcijas

- **📊 Admin panelis** — pārskats, lietotāji, sarunas/ziņas
- **⚠️ Vietnes brīdinājuma josla** — teksts parādās visās lapās (droši: tiek rādīts kā plain-text)
- **⛔ Funkciju slēdži** — atslēgt pirkšanu vai sludinājumu publicēšanu
- **🧾 Audits** — pēdējo ~14 dienu notikumi un iespēja izdzēst vecos ierakstus

---

## 🛠 Tehnoloģijas

| Tehnoloģija | Nolūks |
|------------|--------|
| **Vite** | Būvēšana un dev serveris |
| **Vanilla JS (ES modules)** | Frontend loģika |
| **TailwindCSS v4** | Stili |
| **Supabase** | Auth + DB + Storage |
| **i18next** | Lokalizācija |
| **PostCSS** | CSS apstrāde |

---

## 📦 Priekšnosacījumi

- Node.js >= 18
- npm (vai yarn/pnpm)
- Supabase konts/projekts

---

## 🚀 Instalēšana

1. Klonē repozitoriju
    ```bash
    git clone <your-repo-url>
    cd Nosleguma-darbs
    ```

2. Instalē atkarības
    ```bash
    npm install
    ```

3. Izveido `.env` ar Supabase datiem
    ```env
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```

4. Palaid dev serveri
    ```bash
    npm run dev
    ```

---

## 🏗 Izstrādes komandas

| Komanda | Apraksts |
|---------|----------|
| `npm run dev` | Startē Vite dev serveri (parasti ports 5173) |
| `npm run build` | Izbūvē produkcijai (izvade `dist/`) |
| `npm run preview` | Palaid lokālu preview no `dist/` |

---

## 🗄 Datubāzes shēma (Supabase)

Vendly izmanto vairākas tabulas (piem., `users`, `products`, `orders`, `messages` u.c.). Šajā README ir parādītas galveno tabulu kolonnas piemēra formā, bet pilna loģika ir izkliedēta kodā un papildu dokumentācijā.

### Papildus tabulas (platformas kontrole + audits)

Zemāk ir SQL, kas nepieciešams admin brīdinājuma joslai/funkciju slēdžiem un audita žurnālam.

---

## ✅ E-pasta verifikācijas noteikumi

- Pēc reģistrācijas Supabase nosūta verifikācijas e-pastu.
- Pieteikšanās laikā aplikācija pārbauda `email_confirmed_at`. Ja e-pasts nav apstiprināts, lietotājs tiek atslēgts (`signOut`) un tiek parādīta verifikācijas prasība.
- “Pārsūtīt verifikācijas e-pastu” opcija atslēdzas pēc ~15 minūtēm kopš reģistrācijas (best-effort, izmanto `localStorage`).

---

## 🧰 Platformas kontroles (Admin)

### Ko var ieslēgt/izslēgt

- Brīdinājuma josla visām lapām
- Pirkšanas atslēgšana (bloķē checkout)
- Sludinājumu publicēšanas atslēgšana (bloķē “Sell” plūsmu)

### Nepieciešamā tabula: `platform_settings`

```sql
create table if not exists public.platform_settings (
   id integer primary key,
   warning_enabled boolean not null default false,
   warning_text text not null default '',
   disable_buying boolean not null default false,
   disable_listing boolean not null default false,
   updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (1)
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
   new.updated_at = now();
   return new;
end;
$$;

drop trigger if exists set_platform_settings_updated_at on public.platform_settings;
create trigger set_platform_settings_updated_at
before update on public.platform_settings
for each row execute function public.set_updated_at();
```

### Ieteicamās RLS politikas

```sql
alter table public.platform_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
   select exists (
      select 1
      from public.users u
      where u.id = auth.uid()
         and u.role = 'admin'
   );
$$;

drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read
on public.platform_settings
for select
using (true);

drop policy if exists platform_settings_admin_write on public.platform_settings;
create policy platform_settings_admin_write
on public.platform_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists platform_settings_admin_update on public.platform_settings;
create policy platform_settings_admin_update
on public.platform_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

Admin lietotāja piešķiršana (piemērs):

```sql
update public.users
set role = 'admin'
where email = 'you@example.com';
```

---

## 🧾 Audita žurnāls (14 dienas)

Admin panelī ir iespējams apskatīt pēdējo ~14 dienu audita notikumus un izdzēst vecākus ierakstus.

### Nepieciešamā tabula: `audit_logs`

```sql
create table if not exists public.audit_logs (
   id bigserial primary key,
   created_at timestamptz not null default now(),
   event_type text not null,
   event_data jsonb not null default '{}'::jsonb,
   actor_user_id uuid null references auth.users(id) on delete set null,
   actor_email text null,
   page_path text null,
   user_agent text null
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_event_type_idx on public.audit_logs (event_type);
```

### Ieteicamās RLS politikas

```sql
alter table public.audit_logs enable row level security;

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;
create policy audit_logs_insert_authenticated
on public.audit_logs
for insert
to authenticated
with check (
   actor_user_id is null or actor_user_id = auth.uid()
);

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists audit_logs_delete_admin on public.audit_logs;
create policy audit_logs_delete_admin
on public.audit_logs
for delete
to authenticated
using (public.is_admin());
```

Piezīme: tā kā audita ierakstīšana ir klienta pusē, tā ir “best-effort” žurnāla pieeja. Ja vajag stingrākas garantijas, ieteicams pārcelt auditēšanu uz server-side (RPC/function).

---

## 📁 Projekta struktūra

Svarīgākās mapes/faili:

- `src/` — galvenie ES moduļi (kopējā loģika + lapu skripti)
- `src/pages/` — lapu specifiskā loģika (admin, login, sell, orders u.c.)
- `css/styles.css` — globālie stili
- `vite.config.js` — Vite konfigurācija (multi-page build)
- `netlify.toml` / `wrangler.toml` — izvietošanas konfigurācijas

---

## 📄 Pieejamās lapas

| Lapa | Fails | Apraksts |
|------|------|----------|
| Sākums | `index.html` | Preču plūsma / tirgus |
| Login | `login.html` | Pieteikšanās + verifikācijas statuss |
| Register | `register.html` | Reģistrācija + noteikumu pieņemšana |
| Sell | `sell.html` | Preces publicēšana |
| Orders | `orders.html` | Pasūtījumi + checkout plūsma |
| Product | `product.html` | “Manas preces” / profila preču skats |
| Balance | `balance.html` | Bilances un darījumu skats |
| Chat | `chat.html` | Sarunas/ziņas |
| Settings | `settings.html` | Lietotāja iestatījumi |
| Admin | `admin.html` | Admin panelis |

Papildus: noteikumi un pārvadātāju informācijas lapas.

---

## 🚀 Izvietošana

### Netlify

1. Pievieno repo Netlify
2. Iestati env mainīgos:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

Konfigurācija jau ir sagatavota [netlify.toml](netlify.toml).

### Manuāla būvēšana

```bash
npm run build
```

Tad augšupielādē `dist/` mapi savā hostinga platformā.

---

## 📲 PWA

Projektā ir pamata PWA atbalsts:

- `manifest.webmanifest`
- `service-worker.js`
- `src/sw-register.js`

---

## 🔒 Drošība

- RLS (Row Level Security) Supabase tabulām
- E-pasta verifikācija pirms pirmās pieteikšanās
- Klienta pusē ievades apstrāde (XSS aizsardzība modalos u.c.)
- Admin slēdži, lai īslaicīgi apturētu pirkšanu/publicēšanu

---

## 🌍 Lokalizācija

- Valodas: EN un LV
- i18n loģika: `src/i18n.js`
- UI izmanto `data-i18n` atslēgas un `i18n.t(...)`

---

## 🤝 Ieguldījumi

1. Fork repo
2. Izveido feature branch
3. Veic izmaiņas
4. Atver Pull Request

---

## 📄 Licence

Šis projekts ir proprietārs. Visas tiesības aizsargātas.

---

## 🆘 Atbalsts

- Pārskati noteikumus: `terms.html` / `terms-lv.html`
- Jautājumiem izmanto iebūvēto čatu
