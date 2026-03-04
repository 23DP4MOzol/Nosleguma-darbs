# 🔒 ESCROW SYSTEM DOCUMENTATION

## Overview
The orders system implements **different payment flows** for meetup vs shipping to ensure security for both buyers and sellers.

## 🤝 MEETUP Orders (ESCROW)

### Payment Flow
1. **Buyer pays** → Funds **held in escrow** (NOT sent to seller yet)
2. **Order status**: `escrow`
3. **Both parties meet** in person
4. **Both confirm** the successful meetup
5. **Escrow released** → Funds sent to seller
6. **Order status**: `completed`

### Why Escrow for Meetup?
- ✅ **Buyer protection**: Funds held until item received
- ✅ **Seller protection**: Can't be scammed by fake meetup
- ✅ **Mutual trust**: Both must confirm before money moves
- ✅ **Dispute prevention**: Clear confirmation process

### Meetup Confirmation Process
**Both parties must confirm:**
- Buyer clicks "Confirm Meetup" after receiving item
- Seller clicks "Confirm Meetup" after handing over item
- Once BOTH confirm → Escrow released automatically

**If only one confirms:**
- Funds remain in escrow
- Waiting for other party
- Shows "✓ Buyer confirmed" or "✓ Seller confirmed"

## 📦 SHIPPING Orders (IMMEDIATE RELEASE)

### Payment Flow
1. **Buyer pays** → Funds **immediately sent to seller**
2. **Order status**: `paid`
3. **Seller processes** and ships order
4. **Tracking number** added
5. **Buyer receives** package
6. **Buyer confirms** delivery (optional)
7. **Order status**: `completed`

### Why Immediate Release for Shipping?
- ✅ **Seller needs funds**: To pay for shipping and materials
- ✅ **Tracking protection**: Buyer has tracking number as proof
- ✅ **Platform protection**: Can still initiate refunds if needed
- ✅ **Standard practice**: Most marketplaces work this way

### Shipping Flow
1. Seller gets money immediately
2. Seller ships within 2-3 days
3. Buyer can track package
4. Delivery confirmation optional
5. Refund available if issues occur

## 💰 Transaction Types

### Escrow Transactions
```
BUYER:
- escrow_hold: -€20.00 (Funds held in escrow)

SELLER (after both confirm):
- escrow_release: +€20.00 (Escrow released)
```

### Shipping Transactions
```
BUYER:
- purchase: -€20.00 (Payment sent)

SELLER:
- sale: +€20.00 (Payment received)
```

## 📊 Order Status Flow

### Meetup Flow
```
pending → escrow → completed
   ↓         ↓
(payment) (both confirm)
```

### Shipping Flow
```
pending → paid → processing → shipped → completed
   ↓        ↓         ↓          ↓          ↓
(payment)(seller)(prepare)(track)(buyer confirms)
```

## 🛡️ Security Features

### Meetup Protection
1. **Funds locked** until both confirm
2. **No partial release** (all or nothing)
3. **Dispute option** if disagreement
4. **Admin override** for disputes

### Shipping Protection
1. **Tracking required** before marking shipped
2. **Refund available** within timeframe
3. **Dispute system** for non-delivery
4. **Seller ratings** affect future sales

## 🔄 Refund Logic

### Meetup Refunds
- If **before escrow**: Full refund (no seller deduction)
- If **during escrow**: Refund from escrow, seller gets nothing
- If **after release**: Refund from seller's balance

### Shipping Refunds
- **Before shipping**: Refund from seller's balance
- **After shipping**: Seller keeps shipping cost, refund product cost
- **Non-delivery**: Full refund including shipping

## 💡 User Experience

### Buyer View
**Meetup:**
- See "⏳ Funds in Escrow" badge
- See "Confirm Meetup" button
- See confirmation status (buyer/seller)
- Get notification when both confirm

**Shipping:**
- See "💰 Paid" badge
- See "Processing" status
- Get tracking number
- Optional delivery confirmation

### Seller View
**Meetup:**
- No funds until both confirm
- See "Awaiting Confirmation" status
- Must confirm meetup happened
- Get funds after mutual confirmation

**Shipping:**
- Get funds immediately
- Must ship within timeframe
- Add tracking number
- Can see delivery status

## 🎯 Database Fields

### Orders Table
```sql
escrow_amount DECIMAL(10,2)           -- Amount held in escrow (meetup only)
escrow_released BOOLEAN                -- Whether escrow was released
escrow_released_at TIMESTAMPTZ        -- When escrow released
meetup_confirmed_by_buyer BOOLEAN     -- Buyer confirmed meetup
meetup_confirmed_by_seller BOOLEAN    -- Seller confirmed meetup
```

### Transaction Types
```sql
'escrow_hold'      -- Funds held in escrow (meetup payment)
'escrow_release'   -- Escrow released to seller
'purchase'         -- Direct purchase (shipping payment)
'sale'             -- Direct sale (shipping receipt)
'refund'           -- Money returned to buyer
```

## 📱 UI Indicators

### Status Badges
- **🔒 Escrow**: Orange/yellow badge for meetup orders
- **💰 Paid**: Green badge for shipping orders
- **✅ Completed**: Both have money, order done

### Action Buttons
**Meetup:**
- "Pay Now" → Places funds in escrow
- "Confirm Meetup" → Records confirmation
- Shows confirmation status

**Shipping:**
- "Pay Now" → Sends money to seller
- "Start Processing" → Seller begins
- "Add Tracking" → Mark as shipped

## 🚨 Edge Cases

### Buyer doesn't confirm meetup
- Funds stuck in escrow
- Dispute system activated
- Admin can manually release or refund

### Seller doesn't confirm meetup
- Funds stuck in escrow
- Buyer can request refund after 7 days
- Admin mediates dispute

### Package not received (shipping)
- Buyer initiates dispute
- Tracking reviewed
- Refund or delivery proof required

### Seller doesn't ship (shipping)
- Buyer reports non-shipment
- Admin reviews order
- Forced refund if no tracking

## ✅ Best Practices

### For Buyers
**Meetup:**
1. Meet in public place
2. Inspect item before confirming
3. Confirm meetup ONLY after receiving item
4. Don't confirm if seller no-shows

**Shipping:**
1. Check tracking regularly
2. Confirm delivery when received
3. Report issues immediately
4. Rate seller honestly

### For Sellers
**Meetup:**
1. Bring item to meetup
2. Confirm ONLY after buyer receives item
3. Don't confirm if buyer no-shows
4. Be punctual

**Shipping:**
1. Ship within 2-3 days
2. Add tracking number
3. Use proper packaging
4. Insure valuable items

## 🛠️ Admin Functions

### Manual Escrow Release
```sql
SELECT release_escrow(
  'order-uuid',
  'admin-uuid'
);
```

### Force Refund
```sql
SELECT refund_order(
  'order-uuid',
  'Reason for refund'
);
```

### View Escrow Orders
```sql
SELECT * FROM orders 
WHERE status = 'escrow' 
  AND escrow_released = FALSE;
```

## 📈 Analytics

### Track Escrow Performance
- Average time to mutual confirmation
- % of escrow orders completed
- % requiring dispute resolution
- Meetup completion rate

### Compare Delivery Methods
- Meetup: Escrow completion rate
- Shipping: On-time delivery rate
- Refund rates by method
- User satisfaction scores

---

## 🎉 Summary

- **Meetup = Escrow** (secure for both parties)
- **Shipping = Immediate** (seller needs funds to ship)
- **Both confirmed = Release** (meetup only)
- **Tracking = Protection** (shipping proof)
- **Disputes = Admin mediation** (fairness)

This dual approach balances security with practicality! 🚀
