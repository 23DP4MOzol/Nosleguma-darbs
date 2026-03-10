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
- [Security Features](#-security-features)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

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
user_id UUID NOT NULL,
transaction_type TEXT NOT NULL CHECK (IN 'deposit','withdrawal','purchase','sale','refund','admin_adjustment','escrow_hold','escrow_release'),
amount DECIMAL(10,2) NOT NULL,
description TEXT,
reference_id UUID,   -- links to order_id or product_id
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
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
order_number TEXT UNIQUE NOT NULL,    -- auto-generated: ORD-YYYY-NNNN
buyer_id UUID NOT NULL,
seller_id UUID NOT NULL,
product_id UUID NOT NULL,
quantity INTEGER NOT NULL DEFAULT 1,
unit_price DECIMAL(10,2) NOT NULL,
total_amount DECIMAL(10,2) NOT NULL,
status TEXT DEFAULT 'pending' CHECK (IN 'pending','paid','escrow','processing','ready_for_pickup','shipped','in_transit','delivered','completed','cancelled','refunded','disputed'),
payment_method TEXT DEFAULT 'balance' CHECK (IN 'balance','card','bank_transfer'),
payment_status TEXT DEFAULT 'pending' CHECK (IN 'pending','paid','failed','refunded','escrowed'),
paid_at TIMESTAMPTZ,
escrow_amount DECIMAL(10,2) DEFAULT 0,
escrow_released BOOLEAN DEFAULT FALSE,
escrow_released_at TIMESTAMPTZ,
delivery_method TEXT NOT NULL CHECK (IN 'meetup','shipping'),
shipping_carrier TEXT,               -- 'omniva','dpd','latvijas_pasts'
shipping_service TEXT,               -- 'parcel_locker','courier','post_office'
tracking_number TEXT,
shipping_cost DECIMAL(10,2) DEFAULT 0,
recipient_name TEXT,
recipient_phone TEXT,
shipping_address TEXT,
shipping_city TEXT,
shipping_postal_code TEXT,
shipping_country TEXT CHECK (IN 'LV','LT','EE'),
parcel_locker_id TEXT,
parcel_locker_address TEXT,
meetup_location TEXT,
meetup_date TIMESTAMPTZ,
meetup_confirmed_by_buyer BOOLEAN DEFAULT FALSE,
meetup_confirmed_by_seller BOOLEAN DEFAULT FALSE,
buyer_notes TEXT,
seller_notes TEXT,
admin_notes TEXT,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ,
completed_at TIMESTAMPTZ,
cancelled_at TIMESTAMPTZ
```

#### `order_status_history`
```sql
id UUID PRIMARY KEY,
order_id UUID NOT NULL,
old_status TEXT,
new_status TEXT NOT NULL,
changed_by UUID,
notes TEXT,
created_at TIMESTAMPTZ
```

#### `shipping_rates`
```sql
id UUID PRIMARY KEY,
carrier TEXT NOT NULL,          -- 'omniva','dpd','latvijas_pasts'
service TEXT NOT NULL,          -- 'parcel_locker','courier','post_office'
from_country TEXT NOT NULL,     -- 'LV','LT','EE'
to_country TEXT NOT NULL,
weight_min_kg DECIMAL(5,2) NOT NULL DEFAULT 0,
weight_max_kg DECIMAL(5,2) NOT NULL,
price_eur DECIMAL(10,2) NOT NULL,
estimated_days_min INTEGER,
estimated_days_max INTEGER,
active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
```

#### `parcel_lockers`
```sql
id UUID PRIMARY KEY,
carrier TEXT NOT NULL,
locker_id TEXT NOT NULL UNIQUE,
name TEXT NOT NULL,
address TEXT NOT NULL,
city TEXT NOT NULL,
postal_code TEXT,
country TEXT NOT NULL CHECK (IN 'LV','LT','EE'),
latitude DECIMAL(10,7),
longitude DECIMAL(10,7),
active BOOLEAN DEFAULT TRUE,
created_at TIMESTAMPTZ,
updated_at TIMESTAMPTZ
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
