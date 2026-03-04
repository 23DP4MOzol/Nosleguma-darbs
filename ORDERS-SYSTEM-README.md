# Orders System Setup Guide

## 🎯 Overview
A complete orders and logistics management system with integrated shipping carriers (Omniva, DPD, Latvijas Pasts) for Latvia, Lithuania, and Estonia.

## 📦 Features Implemented

### ✅ Orders Management
- **Full order lifecycle tracking** (pending → paid → processing → shipped → delivered → completed)
- **Buyer and seller views** with role-based filtering
- **Order details modal** with comprehensive information
- **Order status history** with audit trail
- **Real-time order updates** with status changes

### ✅ Delivery Methods
1. **Meetup** 🤝
   - Free local pickup option
   - Meeting location and date/time selection
   - Confirmation required from both buyer and seller

2. **Shipping** 📦
   - **Omniva Parcel Lockers** (€3.49+)
   - **DPD Pickup Points** (€3.99+)
   - **DPD Courier** (€6.99+)
   - **Latvijas Pasts** (€2.99+)
   - Real-time shipping cost calculation
   - Support for LV, LT, EE destinations

### ✅ Payment System
- **Balance-based payments** (deduct from buyer, add to seller)
- **Transaction recording** for both parties
- **Payment confirmation** with order status update
- **Refund functionality** with stock restoration

### ✅ Checkout Flow
1. Product selection
2. Delivery method choice (meetup or shipping)
3. Shipping carrier and service selection (if shipping)
4. Parcel locker or address entry
5. Order summary with total calculation
6. Payment processing

### ✅ Admin Features
- **Recent activities feed** (fixed - now uses user_transactions table)
- **Order management** in admin panel
- **Transaction tracking**
- **Balance adjustments**

## 🚀 Setup Instructions

### 1. Database Setup
Run these SQL scripts in Supabase SQL Editor **in order**:

```bash
1. create-orders-system.sql       # Creates tables, policies, functions
2. create-order-functions.sql     # Creates payment/order functions
3. add-avatar-url-column.sql      # Adds user profile columns
4. cleanup-duplicate-admin.sql    # Cleanup (if needed)
```

**What gets created:**
- `user_transactions` - Activity feed for admin panel
- `orders` - Main order tracking table
- `order_status_history` - Audit trail for status changes
- `shipping_rates` - Carrier pricing for LV/LT/EE
- `parcel_lockers` - Omniva/DPD locker locations
- Database functions:
  - `process_order_payment()` - Handle order payments
  - `create_order_from_product()` - Create order from product
  - `refund_order()` - Process refunds
  - `get_shipping_quote()` - Calculate shipping costs

### 2. File Structure
New files created:
```
orders.html                    # Orders page UI
src/pages/orders.js           # Orders page logic
src/checkout-modal.js         # Checkout modal with delivery options
create-orders-system.sql      # Database schema
create-order-functions.sql    # Payment functions
```

Modified files:
```
src/main.js                   # Import checkout-modal.js
src/product-modal.js          # Use checkout modal
src/i18n.js                   # Orders translations (EN/LV)
vite.config.js                # Added orders.html to build
tailwind.config.js            # Updated content paths
css/styles.css                # Orders & checkout styles added
```

### 3. Carrier Integration

#### Omniva Parcel Lockers
- **API**: Not required for basic functionality (locations pre-populated)
- **Advanced**: Use Omniva API for real-time availability
- **Tracking**: `https://www.omniva.lv/private/track_and_trace?barcode={tracking}`

#### DPD
- **API**: Not required for basic functionality
- **Advanced**: DPD Web Services for label generation
- **Tracking**: `https://www.dpd.com/lv/en/tracking/?query={tracking}`

#### Latvijas Pasts
- **Tracking**: `https://www.pasts.lv/lv/palidziba/sut-ijumu-mekle-ana/?number={tracking}`

### 4. Test the System

1. **Create sample products** (via sell page)
2. **Click "Buy Now"** on a product
3. **Choose delivery method**:
   - Meetup: Enter location and date
   - Shipping: Select carrier and locker/address
4. **Complete checkout** (creates pending order)
5. **Go to Orders page** to see your order
6. **Pay the order** (processes payment from balance)
7. **Seller actions**:
   - Mark as processing
   - Add tracking number / mark ready for pickup
8. **Buyer actions**:
   - Track shipment
   - Confirm delivery

## 🎨 User Interface

### Orders Page (`/orders.html`)
- **Filter tabs**: All Orders / Buying / Selling
- **Status filter**: All Status / Pending / Paid / etc.
- **Delivery filter**: All / Meetup / Shipping
- **Order cards** with:
  - Order number and date
  - Product image and details
  - Status badge
  - Delivery method and tracking info
  - Action buttons (Pay, Track, Confirm, Cancel)

### Checkout Modal
- **Product summary** with quantity selector
- **Delivery tabs**: Meetup vs Shipping
- **Meetup form**: Location, date, notes
- **Shipping options**:
  - Country selector (LV/LT/EE)
  - Carrier cards with pricing
  - Parcel locker search and selection
  - Courier address form
- **Order summary** with totals
- **Proceed to Payment** button

### Order Details Modal
- Product information with images
- Order status timeline
- Delivery information (address/locker)
- Payment details with breakdown
- Buyer/seller information
- Notes section
- Action buttons

## 🔒 Security & Permissions

### RLS Policies
- ✅ Users can only view their own orders (as buyer or seller)
- ✅ Admins can view all orders
- ✅ Users can only create orders as buyer
- ✅ Buyers and sellers can update their orders
- ✅ Order status history is auditable
- ✅ Shipping rates and parcel lockers are publicly readable

### Payment Security
- Balance checks before payment processing
- Atomic transactions (buyer deduction + seller credit)
- Transaction logging for audit trail
- Refund protection (can't refund unpaid orders)

## 🌐 Internationalization

### Supported Languages
- **English (EN)** - Full support
- **Latvian (LV)** - Full support

### Translation Keys
All orders-related UI text is translatable via `src/i18n.js`:
- Order status labels
- Delivery method names
- Checkout form labels
- Button text
- Empty states
- Error messages

## 📊 Database Schema

### Orders Table Structure
```sql
orders (
  id, order_number, buyer_id, seller_id, product_id,
  quantity, unit_price, total_amount,
  status, payment_status, delivery_method,
  shipping_carrier, shipping_service, tracking_number, shipping_cost,
  recipient_name, recipient_phone, shipping_address,
  parcel_locker_id, meetup_location, meetup_date,
  buyer_notes, seller_notes, admin_notes,
  created_at, updated_at, completed_at, cancelled_at
)
```

### Shipping Rates Pre-populated
| Carrier | Service | From | To | Price | Days |
|---------|---------|------|----|----|------|
| Omniva | Parcel Locker | LV | LV | €3.49 | 1-3 |
| Omniva | Parcel Locker | LV | LT/EE | €4.99 | 2-5 |
| DPD | Parcel Locker | LV | LV | €3.99 | 1-3 |
| DPD | Courier | LV | LV | €6.99 | 1-2 |
| Latvijas Pasts | Post Office | LV | LV | €2.99 | 2-5 |

## 🐛 Troubleshooting

### Admin Panel Recent Activities Not Showing
**Fixed!** Now uses `user_transactions` table instead of non-existent table.

### Orders Not Creating
1. Check if `create-orders-system.sql` was run
2. Verify RLS policies allow inserts
3. Check browser console for errors
4. Ensure product has stock available

### Payment Failing
1. Check user balance is sufficient
2. Verify `process_order_payment()` function exists
3. Check database logs for errors
4. Ensure order status is 'pending'

### Shipping Cost Not Calculating
1. Verify `shipping_rates` table has data
2. Check carrier/service/country combination exists
3. Look for console errors in checkout modal
4. Default fallback is €5.00 if query fails

## 🔄 Order Status Flow

```
pending → paid → processing → [shipped/ready_for_pickup] → completed
                              ↓
                          cancelled
                              ↓
                          refunded
```

### Status Transitions
- **pending**: Order created, awaiting payment
- **paid**: Payment confirmed, seller notified
- **processing**: Seller preparing order
- **shipped**: Package sent with tracking (shipping)
- **ready_for_pickup**: Item ready at meetup location
- **completed**: Buyer confirmed delivery
- **cancelled**: Order cancelled (refundable if paid)
- **refunded**: Payment returned, stock restored

## 📱 Responsive Design
All order pages and modals are fully responsive:
- Mobile-first approach
- Grid layouts adapt to screen size
- Touch-friendly buttons and cards
- Scrollable order lists
- Collapsible sections on mobile

## 🚀 Next Steps

### Recommended Enhancements
1. **Email notifications** for order status changes
2. **Real-time tracking** with carrier APIs
3. **Automatic label generation** for shipping
4. **Review system** after order completion
5. **Dispute resolution** for problematic orders
6. **Multi-item cart** (currently single-product checkout)
7. **Payment methods** (cards, bank transfer, not just balance)
8. **Shipping insurance** options
9. **Export orders** to CSV/PDF
10. **Advanced analytics** in admin panel

### Optional Carrier API Integration
For production, integrate real APIs:
- **Omniva API**: Automated label printing, locker availability
- **DPD Web Services**: Label generation, real-time tracking
- **Latvijas Pasts API**: Tracking updates, label printing

## ✅ Checklist

- [x] Database tables created
- [x] Orders page UI built
- [x] Checkout modal with delivery options
- [x] Payment processing implemented
- [x] Shipping carriers integrated (Omniva, DPD, Latvijas Pasts)
- [x] Parcel locker selection
- [x] Order status tracking
- [x] Buyer and seller actions
- [x] Admin panel fixed (recent activities)
- [x] i18n translations (EN/LV)
- [x] Responsive design
- [x] CSS styling complete
- [x] Vite config updated
- [x] Tailwind config updated

## 🎉 System is Ready!

Run the SQL scripts, restart your dev server (`npm run dev`), and start testing the full orders flow from product purchase to delivery confirmation!
