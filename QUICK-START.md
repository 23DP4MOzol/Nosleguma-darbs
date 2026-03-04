# 🚀 QUICK START - Orders System

## ⚡ Get Started in 3 Steps

### Step 1: Run SQL Scripts in Supabase
Open Supabase SQL Editor and run these scripts **in order**:

1. **create-orders-system.sql** - Creates all tables, policies, and sample data
2. **create-order-functions.sql** - Creates payment processing functions

That's it for database setup!

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Test the System

1. **Login** to your account
2. **Browse products** on homepage
3. **Click "Buy Now"** on any product
4. **Choose delivery**:
   - **Meetup**: Enter location (e.g., "Starbucks, Brīvības iela, Rīga")
   - **Shipping**: Select Omniva/DPD, pick a parcel locker
5. **Complete checkout** → Order created!
6. **Go to Orders page** (in dropdown menu)
7. **Pay the order** (deducts from your balance)
8. **Track status** as it progresses

## 📋 What You Get

### ✅ New Pages
- **/orders.html** - Full orders management page
  - Filter by buying/selling
  - Filter by status and delivery method
  - Order cards with actions
  - Detailed order modal

### ✅ New Features
- **Checkout Modal** with:
  - Meetup option (free)
  - Shipping with Omniva, DPD carriers
  - Parcel locker selection
  - Real-time shipping cost calculation
  - Order summary

- **Payment System**:
  - Balance-based payments
  - Transaction recording
  - Refund functionality

- **Order Tracking**:
  - Status timeline
  - Real tracking links (Omniva, DPD, Latvijas Pasts)
  - Buyer/seller actions
  - Delivery confirmation

### ✅ Admin Panel Fixed
- Recent activities feed now works (uses user_transactions table)

### ✅ Internationalization
- Full English and Latvian translations
- All UI text translatable

## 🌍 Supported Carriers & Countries

### Carriers
- **Omniva** - Parcel Lockers (€3.49+)
- **DPD** - Pickup Points (€3.99+) & Courier (€6.99+)
- **Latvijas Pasts** - Post Office (€2.99+)

### Countries
- 🇱🇻 Latvia
- 🇱🇹 Lithuania
- 🇪🇪 Estonia

## 🎯 Test Scenarios

### Scenario 1: Meetup Purchase
1. Buy product → Choose meetup
2. Enter location: "Starbucks, Krasta iela 46, Rīga"
3. Set date/time
4. Complete checkout → Pay order
5. Seller marks "Ready for Pickup"
6. Meet and confirm delivery

### Scenario 2: Shipping Purchase
1. Buy product → Choose shipping
2. Select country (LV/LT/EE)
3. Pick carrier (Omniva Parcel Locker)
4. Search and select locker
5. Complete checkout → Pay order
6. Seller adds tracking number
7. Track shipment online
8. Confirm delivery when received

### Scenario 3: Admin View
1. Login as admin
2. Go to Admin panel
3. See recent activities (now working!)
4. Click Orders tab
5. View all orders, manage statuses

## 📦 Pre-populated Data

The SQL scripts automatically create:
- ✅ 10+ shipping rates for all carrier/country combinations
- ✅ 6 sample parcel lockers (Omniva & DPD) in Rīga
- ✅ All necessary database functions
- ✅ RLS policies for security

## 🔧 Troubleshooting

**Orders page is blank?**
- Run create-orders-system.sql first
- Check browser console for errors

**Can't pay for order?**
- Make sure you have sufficient balance (go to Balance page)
- Check order status is "pending"

**Recent activities not showing in admin?**
- ✅ Fixed! Now uses user_transactions table

**Shipping cost shows €0.00?**
- Select a carrier and parcel locker/address
- Check shipping_rates table has data

## 📁 Files Created

### Frontend
- `orders.html` - Orders page
- `src/pages/orders.js` - Orders logic (650+ lines)
- `src/checkout-modal.js` - Checkout modal (600+ lines)
- `css/styles.css` - Orders styles (600+ lines added)

### Backend
- `create-orders-system.sql` - Database schema (400+ lines)
- `create-order-functions.sql` - Payment functions (300+ lines)

### Documentation
- `ORDERS-SYSTEM-README.md` - Full documentation
- `QUICK-START.md` - This file

### Modified
- `src/main.js` - Import checkout modal
- `src/product-modal.js` - Use checkout
- `src/i18n.js` - 50+ translations added
- `vite.config.js` - Added orders.html
- `tailwind.config.js` - Updated paths

## ✨ That's It!

You now have a **fully working orders and logistics system** with:
- 🛒 Product checkout
- 📦 Multiple delivery options
- 💳 Payment processing
- 📍 Parcel locker integration
- 🚚 3 shipping carriers
- 🌍 3 Baltic countries
- 🔒 Secure RLS policies
- 🌐 EN/LV translations
- 📱 Responsive design

**Start the dev server and test it out!** 🚀
