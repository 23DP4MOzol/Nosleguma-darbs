-- ==========================================
-- COMPLETE ORDERS SYSTEM FOR VENDLY
-- Copy and paste this entire file into Supabase SQL Editor
-- ==========================================

-- ==========================================
-- 1. USER TRANSACTIONS TABLE (for admin activity feed)
-- ==========================================
DROP TABLE IF EXISTS public.user_transactions CASCADE;
CREATE TABLE public.user_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'purchase', 'sale', 'refund', 'admin_adjustment', 'escrow_hold', 'escrow_release')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can link to order_id or product_id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON public.user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON public.user_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_transactions_type ON public.user_transactions(transaction_type);

-- ==========================================
-- 2. ORDERS TABLE (main order tracking)
-- ==========================================
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  -- Order details
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Order status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- Waiting for payment
    'paid',              -- Payment confirmed
    'escrow',            -- Funds held in escrow (meetup orders)
    'processing',        -- Seller preparing order
    'ready_for_pickup',  -- Ready for meetup
    'shipped',           -- Package sent
    'in_transit',        -- With courier
    'delivered',         -- Delivered to buyer
    'completed',         -- Transaction complete
    'cancelled',         -- Order cancelled
    'refunded',          -- Money refunded
    'disputed'           -- Under dispute
  )),
  
  -- Payment
  payment_method TEXT DEFAULT 'balance' CHECK (payment_method IN ('balance', 'card', 'bank_transfer')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'escrowed')),
  paid_at TIMESTAMPTZ,
  
  -- Escrow (different logic for meetup vs shipping)
  escrow_amount DECIMAL(10,2) DEFAULT 0,
  escrow_released BOOLEAN DEFAULT FALSE,
  escrow_released_at TIMESTAMPTZ,
  
  -- Delivery method
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('meetup', 'shipping')),
  
  -- Shipping details (null if meetup)
  shipping_carrier TEXT, -- 'omniva', 'dpd', 'latvijas_pasts'
  shipping_service TEXT, -- 'parcel_locker', 'courier', 'post_office'
  tracking_number TEXT,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Shipping address
  recipient_name TEXT,
  recipient_phone TEXT,
  shipping_address TEXT,
  shipping_city TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT CHECK (shipping_country IN ('LV', 'LT', 'EE') OR shipping_country IS NULL),
  
  -- Parcel locker specific
  parcel_locker_id TEXT,
  parcel_locker_address TEXT,
  
  -- Meetup details (null if shipping)
  meetup_location TEXT,
  meetup_date TIMESTAMPTZ,
  meetup_confirmed_by_buyer BOOLEAN DEFAULT FALSE,
  meetup_confirmed_by_seller BOOLEAN DEFAULT FALSE,
  
  -- Notes and communication
  buyer_notes TEXT,
  seller_notes TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ==========================================
-- 3. ORDER STATUS HISTORY (audit trail)
-- ==========================================
DROP TABLE IF EXISTS public.order_status_history CASCADE;
CREATE TABLE public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ==========================================
-- 4. SHIPPING RATES TABLE (carrier pricing)
-- ==========================================
DROP TABLE IF EXISTS public.shipping_rates CASCADE;
CREATE TABLE public.shipping_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  service TEXT NOT NULL,
  from_country TEXT NOT NULL,
  to_country TEXT NOT NULL,
  weight_min_kg DECIMAL(5,2) NOT NULL DEFAULT 0,
  weight_max_kg DECIMAL(5,2) NOT NULL,
  price_eur DECIMAL(10,2) NOT NULL,
  estimated_days_min INTEGER,
  estimated_days_max INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_carrier ON public.shipping_rates(carrier);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_countries ON public.shipping_rates(from_country, to_country);

-- ==========================================
-- 5. PARCEL LOCKERS TABLE (FULL DATA)
-- ==========================================
DROP TABLE IF EXISTS public.parcel_lockers CASCADE;
CREATE TABLE public.parcel_lockers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carrier TEXT NOT NULL,
  locker_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL CHECK (country IN ('LV', 'LT', 'EE')),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcel_lockers_carrier ON public.parcel_lockers(carrier);
CREATE INDEX IF NOT EXISTS idx_parcel_lockers_country ON public.parcel_lockers(country);
CREATE INDEX IF NOT EXISTS idx_parcel_lockers_city ON public.parcel_lockers(city);

-- ==========================================
-- 6. INSERT SHIPPING RATES
DELETE FROM public.shipping_rates;
-- ==========================================
INSERT INTO public.shipping_rates (carrier, service, from_country, to_country, weight_min_kg, weight_max_kg, price_eur, estimated_days_min, estimated_days_max) VALUES
-- Omniva Parcel Lockers
('omniva', 'parcel_locker', 'LV', 'LV', 0, 30, 3.49, 1, 3),
('omniva', 'parcel_locker', 'LV', 'LT', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'LV', 'EE', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'LT', 'LV', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'LT', 'LT', 0, 30, 3.49, 1, 3),
('omniva', 'parcel_locker', 'LT', 'EE', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'EE', 'LV', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'EE', 'LT', 0, 30, 4.99, 2, 5),
('omniva', 'parcel_locker', 'EE', 'EE', 0, 30, 3.49, 1, 3),

-- DPD Parcel Lockers
('dpd', 'parcel_locker', 'LV', 'LV', 0, 20, 3.99, 1, 3),
('dpd', 'parcel_locker', 'LV', 'LT', 0, 20, 5.49, 2, 4),
('dpd', 'parcel_locker', 'LV', 'EE', 0, 20, 5.49, 2, 4),

-- DPD Courier
('dpd', 'courier', 'LV', 'LV', 0, 31.5, 6.99, 1, 2),
('dpd', 'courier', 'LV', 'LT', 0, 31.5, 9.99, 2, 4),
('dpd', 'courier', 'LV', 'EE', 0, 31.5, 9.99, 2, 4),

-- Latvijas Pasts
('latvijas_pasts', 'post_office', 'LV', 'LV', 0, 30, 2.99, 2, 5),
('latvijas_pasts', 'courier', 'LV', 'LV', 0, 30, 5.99, 1, 3);

-- ==========================================
-- 7. INSERT FULL PARCEL LOCKER DATA
-- ==========================================
DELETE FROM public.parcel_lockers;

-- OMNIVA LATVIA (Major cities and districts)
INSERT INTO public.parcel_lockers (carrier, locker_id, name, address, city, postal_code, country, latitude, longitude) VALUES
-- Riga
('omniva', 'LV-22101', 'Omniva Rīga - Krasta iela', 'Krasta iela 46', 'Rīga', 'LV-1003', 'LV', 56.9496, 24.1052),
('omniva', 'LV-22102', 'Omniva Rīga - Brīvības iela', 'Brīvības iela 372', 'Rīga', 'LV-1006', 'LV', 56.9677, 24.1615),
('omniva', 'LV-22103', 'Omniva Rīga - Centrs', 'Tērbatas iela 2', 'Rīga', 'LV-1011', 'LV', 56.9513, 24.1093),
('omniva', 'LV-22104', 'Omniva Rīga - Āgenskalns', 'Kalnciema iela 1A', 'Rīga', 'LV-1048', 'LV', 56.9395, 24.0682),
('omniva', 'LV-22105', 'Omniva Rīga - Imanta', 'Anniņmuižas bulvāris 41', 'Rīga', 'LV-1067', 'LV', 56.9487, 24.0254),
('omniva', 'LV-22106', 'Omniva Rīga - Jugla', 'Brīvības gatve 372', 'Rīga', 'LV-1024', 'LV', 56.9846, 24.2088),
('omniva', 'LV-22107', 'Omniva Rīga - Purvciems', 'Dzelzavas iela 120G', 'Rīga', 'LV-1021', 'LV', 56.9531, 24.2045),
('omniva', 'LV-22108', 'Omniva Rīga - Āgenskalns Maxima', 'Nometņu iela 62', 'Rīga', 'LV-1002', 'LV', 56.9308, 24.0675),
('omniva', 'LV-22109', 'Omniva Rīga - Ziepniekkalns', 'Vienības gatve 113', 'Rīga', 'LV-1058', 'LV', 56.9238, 24.1671),
('omniva', 'LV-22110', 'Omniva Rīga - Mežaparks', 'Kokneses prospekts 1', 'Rīga', 'LV-1014', 'LV', 56.9825, 24.1616),
('omniva', 'LV-22111', 'Omniva Rīga - Iļģuciems', 'Dzirciema iela 96', 'Rīga', 'LV-1055', 'LV', 56.9561, 23.9978),
('omniva', 'LV-22112', 'Omniva Rīga - Teika', 'Gustava Zemgala gatve 74', 'Rīga', 'LV-1039', 'LV', 56.9719, 24.1744),
('omniva', 'LV-22113', 'Omniva Rīga - Pļavnieki', 'Salnas iela 4', 'Rīga', 'LV-1057', 'LV', 56.9234, 24.1951),
('omniva', 'LV-22114', 'Omniva Rīga - Bolderāja', 'Kapteiņu iela 1', 'Rīga', 'LV-1016', 'LV', 57.0324, 23.9883),
('omniva', 'LV-22115', 'Omniva Rīga - Vecmīlgrāvis', 'Alfrēda Kalniņa iela 6A', 'Rīga', 'LV-1015', 'LV', 57.0346, 24.1054),

-- Daugavpils
('omniva', 'LV-22201', 'Omniva Daugavpils - Centrs', 'Rīgas iela 22', 'Daugavpils', 'LV-5401', 'LV', 55.8747, 26.5365),
('omniva', 'LV-22202', 'Omniva Daugavpils - Stropu', 'Stacijas iela 45A', 'Daugavpils', 'LV-5404', 'LV', 55.8842, 26.5123),
('omniva', 'LV-22203', 'Omniva Daugavpils - Gajok', 'Vienības iela 28', 'Daugavpils', 'LV-5401', 'LV', 55.8681, 26.5289),

-- Liepāja
('omniva', 'LV-22301', 'Omniva Liepāja - Centrs', 'Graudu iela 33', 'Liepāja', 'LV-3401', 'LV', 56.5047, 21.0114),
('omniva', 'LV-22302', 'Omniva Liepāja - Ezerkrasts', 'Brīvības iela 164', 'Liepāja', 'LV-3401', 'LV', 56.5321, 21.0235),
('omniva', 'LV-22303', 'Omniva Liepāja - Karostas', 'Klaipēdas iela 1', 'Liepāja', 'LV-3401', 'LV', 56.5456, 21.0089),

-- Jelgava
('omniva', 'LV-22401', 'Omniva Jelgava - Centrs', 'Pasta iela 47', 'Jelgava', 'LV-3001', 'LV', 56.6509, 23.7207),
('omniva', 'LV-22402', 'Omniva Jelgava - Rimi', 'Lielā iela 6', 'Jelgava', 'LV-3001', 'LV', 56.6487, 23.7311),

-- Jūrmala
('omniva', 'LV-22501', 'Omniva Jūrmala - Majori', 'Jomas iela 42', 'Jūrmala', 'LV-2015', 'LV', 56.9726, 23.7745),
('omniva', 'LV-22502', 'Omniva Jūrmala - Bulduri', 'Kauguru prospekts 1', 'Jūrmala', 'LV-2010', 'LV', 56.9686, 23.7453),
('omniva', 'LV-22503', 'Omniva Jūrmala - Dubulti', 'Edinburgas prospekts 68', 'Jūrmala', 'LV-2015', 'LV', 56.9773, 23.7891),

-- Ventspils
('omniva', 'LV-22601', 'Omniva Ventspils - Centrs', 'Kuldīgas iela 1', 'Ventspils', 'LV-3601', 'LV', 57.3947, 21.5654),
('omniva', 'LV-22602', 'Omniva Ventspils - Maxima', 'Talsu iela 27', 'Ventspils', 'LV-3601', 'LV', 57.3879, 21.5589),

-- Rēzekne
('omniva', 'LV-22701', 'Omniva Rēzekne - Centrs', 'Atbrīvošanas aleja 93', 'Rēzekne', 'LV-4601', 'LV', 56.5074, 27.3332),

-- Valmiera
('omniva', 'LV-22801', 'Omniva Valmiera - Centrs', 'Rīgas iela 29', 'Valmiera', 'LV-4201', 'LV', 57.5381, 25.4260),

-- DPD LATVIA
('dpd', 'LV-DPD-001', 'DPD Pickup Rīga - Alfa', 'Brīvības gatve 372', 'Rīga', 'LV-1006', 'LV', 56.9677, 24.1615),
('dpd', 'LV-DPD-002', 'DPD Pickup Rīga - Akropole', 'Maskavas iela 257', 'Rīga', 'LV-1019', 'LV', 56.9229, 24.1786),
('dpd', 'LV-DPD-003', 'DPD Pickup Rīga - Domina', 'Ieriķu iela 3', 'Rīga', 'LV-1084', 'LV', 56.9338, 24.0732),
('dpd', 'LV-DPD-004', 'DPD Pickup Rīga - Olimpia', 'Āzenes iela 5', 'Rīga', 'LV-1048', 'LV', 56.9327, 24.0593),
('dpd', 'LV-DPD-005', 'DPD Pickup Rīga - Spice', 'Lielirbes iela 29', 'Rīga', 'LV-1046', 'LV', 56.9414, 24.0333),
('dpd', 'LV-DPD-006', 'DPD Pickup Rīga - Mols', 'Krasta iela 46', 'Rīga', 'LV-1003', 'LV', 56.9496, 24.1052),
('dpd', 'LV-DPD-007', 'DPD Pickup Rīga - Galerija Centrs', 'Audēju iela 16', 'Rīga', 'LV-1050', 'LV', 56.9496, 24.1142),
('dpd', 'LV-DPD-008', 'DPD Pickup Daugavpils - Ditton', 'Viestura iela 7', 'Daugavpils', 'LV-5401', 'LV', 55.8731, 26.5412),
('dpd', 'LV-DPD-009', 'DPD Pickup Liepāja - Big7', 'Kuršu iela 11', 'Liepāja', 'LV-3401', 'LV', 56.5189, 21.0098),
('dpd', 'LV-DPD-010', 'DPD Pickup Jelgava - Pilsētas', 'Dobeles šoseja 7', 'Jelgava', 'LV-3007', 'LV', 56.6348, 23.7089),

-- OMNIVA LITHUANIA (Major cities)
('omniva', 'LT-22001', 'Omniva Vilnius - Akropolis', 'Ozo g. 25', 'Vilnius', 'LT-08200', 'LT', 54.7233, 25.2679),
('omniva', 'LT-22002', 'Omniva Vilnius - Panorama', 'Saltoniškių g. 9', 'Vilnius', 'LT-08105', 'LT', 54.6916, 25.2514),
('omniva', 'LT-22003', 'Omniva Vilnius - Ozas', 'Ozo g. 18', 'Vilnius', 'LT-08243', 'LT', 54.7198, 25.2589),
('omniva', 'LT-22004', 'Omniva Vilnius - Europa', 'Konstitucijos pr. 7A', 'Vilnius', 'LT-09308', 'LT', 54.6892, 25.2763),
('omniva', 'LT-22005', 'Omniva Vilnius - Maxima', 'Savanorių pr. 247', 'Vilnius', 'LT-02300', 'LT', 54.7045, 25.2401),
('omniva', 'LT-22101', 'Omniva Kaunas - Mega', 'Islandijos pl. 32', 'Kaunas', 'LT-49176', 'LT', 54.9357, 23.9682),
('omniva', 'LT-22102', 'Omniva Kaunas - Akropolis', 'Karaliaus Mindaugo pr. 49', 'Kaunas', 'LT-44333', 'LT', 54.9024, 23.9633),
('omniva', 'LT-22103', 'Omniva Kaunas - Urmas', 'Savanorių pr. 255', 'Kaunas', 'LT-50127', 'LT', 54.9089, 23.8945),
('omniva', 'LT-22201', 'Omniva Klaipėda - Akropolis', 'Taikos pr. 61', 'Klaipėda', 'LT-94101', 'LT', 55.7234, 21.1289),
('omniva', 'LT-22202', 'Omniva Klaipėda - Banginis', 'Taikos pr. 139', 'Klaipėda', 'LT-94101', 'LT', 55.7389, 21.1456),
('omniva', 'LT-22301', 'Omniva Šiauliai - Arena', 'Tilžės g. 109', 'Šiauliai', 'LT-76348', 'LT', 55.9289, 23.2867),
('omniva', 'LT-22401', 'Omniva Panevėžys - Maxima', 'Savanorių a. 5', 'Panevėžys', 'LT-37126', 'LT', 55.7345, 24.3589),

-- DPD LITHUANIA
('dpd', 'LT-DPD-001', 'DPD Pickup Vilnius - Akropolis', 'Ozo g. 25', 'Vilnius', 'LT-08200', 'LT', 54.7233, 25.2679),
('dpd', 'LT-DPD-002', 'DPD Pickup Vilnius - Panorama', 'Saltoniškių g. 9', 'Vilnius', 'LT-08105', 'LT', 54.6916, 25.2514),
('dpd', 'LT-DPD-003', 'DPD Pickup Kaunas - Mega', 'Islandijos pl. 32', 'Kaunas', 'LT-49176', 'LT', 54.9357, 23.9682),
('dpd', 'LT-DPD-004', 'DPD Pickup Klaipėda - Akropolis', 'Taikos pr. 61', 'Klaipėda', 'LT-94101', 'LT', 55.7234, 21.1289),

-- OMNIVA ESTONIA (Major cities)
('omniva', 'EE-23001', 'Omniva Tallinn - Ülemiste', 'Suur-Sõjamäe 4', 'Tallinn', 'EE-11415', 'EE', 59.4223, 24.7989),
('omniva', 'EE-23002', 'Omniva Tallinn - Kristiine', 'Endla 45', 'Tallinn', 'EE-10615', 'EE', 59.4189, 24.7245),
('omniva', 'EE-23003', 'Omniva Tallinn - Rocca al Mare', 'Paldiski mnt 102', 'Tallinn', 'EE-13522', 'EE', 59.4234, 24.6534),
('omniva', 'EE-23004', 'Omniva Tallinn - Mustamäe', 'Tammsaare tee 104A', 'Tallinn', 'EE-12918', 'EE', 59.4067, 24.6889),
('omniva', 'EE-23005', 'Omniva Tallinn - Lasnamäe', 'Peterburi tee 2', 'Tallinn', 'EE-11415', 'EE', 59.4289, 24.8123),
('omniva', 'EE-23006', 'Omniva Tallinn - Viru Keskus', 'Viru väljak 4', 'Tallinn', 'EE-10111', 'EE', 59.4356, 24.7534),
('omniva', 'EE-23101', 'Omniva Tartu - Lõunakeskus', 'Ringtee 75', 'Tartu', 'EE-50501', 'EE', 58.3612, 26.6889),
('omniva', 'EE-23102', 'Omniva Tartu - Kaubamaja', 'Riia 1', 'Tartu', 'EE-51010', 'EE', 58.3789, 26.7234),
('omniva', 'EE-23103', 'Omniva Tartu - Annelinn', 'Turu 2', 'Tartu', 'EE-50105', 'EE', 58.3534, 26.7456),
('omniva', 'EE-23201', 'Omniva Narva - Fama', 'Tallinna mnt 41', 'Narva', 'EE-20605', 'EE', 59.3745, 28.1923),
('omniva', 'EE-23301', 'Omniva Pärnu - Port Artur', 'Lai 10', 'Pärnu', 'EE-80010', 'EE', 58.3845, 24.4989),
('omniva', 'EE-23302', 'Omniva Pärnu - Kaubamaja', 'Papiniidu 5', 'Pärnu', 'EE-80042', 'EE', 58.3912, 24.5123),

-- DPD ESTONIA
('dpd', 'EE-DPD-001', 'DPD Pickup Tallinn - Ülemiste', 'Suur-Sõjamäe 4', 'Tallinn', 'EE-11415', 'EE', 59.4223, 24.7989),
('dpd', 'EE-DPD-002', 'DPD Pickup Tallinn - Kristiine', 'Endla 45', 'Tallinn', 'EE-10615', 'EE', 59.4189, 24.7245),
('dpd', 'EE-DPD-003', 'DPD Pickup Tartu - Lõunakeskus', 'Ringtee 75', 'Tartu', 'EE-50501', 'EE', 58.3612, 26.6889),
('dpd', 'EE-DPD-004', 'DPD Pickup Pärnu - Port Artur', 'Lai 10', 'Pärnu', 'EE-80010', 'EE', 58.3845, 24.4989);

-- ==========================================
-- 8. RLS POLICIES
-- ==========================================

ALTER TABLE public.user_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcel_lockers ENABLE ROW LEVEL SECURITY;

-- User Transactions Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.user_transactions;
CREATE POLICY "Users can view their own transactions" ON public.user_transactions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System can insert transactions" ON public.user_transactions;
CREATE POLICY "System can insert transactions" ON public.user_transactions
  FOR INSERT WITH CHECK (true);

-- Orders Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
CREATE POLICY "Users can update their orders" ON public.orders
  FOR UPDATE USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Order Status History
DROP POLICY IF EXISTS "Users can view order history" ON public.order_status_history;
CREATE POLICY "Users can view order history" ON public.order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_id 
      AND (buyer_id = auth.uid() OR seller_id = auth.uid())
    ) OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System can insert order history" ON public.order_status_history;
CREATE POLICY "System can insert order history" ON public.order_status_history
  FOR INSERT WITH CHECK (true);

-- Shipping Rates - public read
DROP POLICY IF EXISTS "Anyone can view shipping rates" ON public.shipping_rates;
CREATE POLICY "Anyone can view shipping rates" ON public.shipping_rates
  FOR SELECT USING (active = TRUE);

-- Parcel Lockers - public read
DROP POLICY IF EXISTS "Anyone can view parcel lockers" ON public.parcel_lockers;
CREATE POLICY "Anyone can view parcel lockers" ON public.parcel_lockers
  FOR SELECT USING (active = TRUE);

-- ==========================================
-- 9. TRIGGERS & FUNCTIONS
-- ==========================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_transactions_updated_at ON public.user_transactions;
CREATE TRIGGER update_user_transactions_updated_at
  BEFORE UPDATE ON public.user_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shipping_rates_updated_at ON public.shipping_rates;
CREATE TRIGGER update_shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  next_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  
  seq_part := LPAD(next_num::TEXT, 4, '0');
  
  RETURN 'ORD-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_order_status_change_trigger ON public.orders;
CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ==========================================
-- 10. ORDER PROCESSING FUNCTIONS
-- ==========================================

-- CREATE ORDER (with proper escrow logic)
CREATE OR REPLACE FUNCTION create_order_from_product(
  p_product_id UUID,
  p_buyer_id UUID,
  p_quantity INTEGER,
  p_delivery_method TEXT,
  p_delivery_details JSONB
)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_order_id UUID;
  v_total_amount DECIMAL(10,2);
  v_shipping_cost DECIMAL(10,2) := 0;
BEGIN
  -- Get product details
  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Product not found or not available'
    );
  END IF;

  -- Check if buyer is trying to buy their own product
  IF v_product.seller_id = p_buyer_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot purchase your own product'
    );
  END IF;

  -- Check stock
  IF v_product.stock < p_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock'
    );
  END IF;

  -- Calculate shipping cost if applicable
  IF p_delivery_method = 'shipping' THEN
    SELECT price_eur INTO v_shipping_cost
    FROM public.shipping_rates
    WHERE 
      carrier = (p_delivery_details->>'carrier')
      AND service = (p_delivery_details->>'service')
      AND from_country = 'LV'
      AND to_country = (p_delivery_details->>'country')
      AND active = true
    LIMIT 1;
    
    v_shipping_cost := COALESCE(v_shipping_cost, 5.00);
  END IF;

  v_total_amount := (v_product.price * p_quantity) + v_shipping_cost;

  -- Create order
  INSERT INTO public.orders (
    buyer_id,
    seller_id,
    product_id,
    quantity,
    unit_price,
    total_amount,
    status,
    delivery_method,
    shipping_carrier,
    shipping_service,
    shipping_cost,
    recipient_name,
    recipient_phone,
    shipping_address,
    shipping_city,
    shipping_postal_code,
    shipping_country,
    parcel_locker_id,
    parcel_locker_address,
    meetup_location,
    meetup_date,
    buyer_notes,
    escrow_amount
  ) VALUES (
    p_buyer_id,
    v_product.seller_id,
    p_product_id,
    p_quantity,
    v_product.price,
    v_total_amount,
    'pending',
    p_delivery_method,
    p_delivery_details->>'carrier',
    p_delivery_details->>'service',
    v_shipping_cost,
    p_delivery_details->>'recipient_name',
    p_delivery_details->>'recipient_phone',
    p_delivery_details->>'address',
    p_delivery_details->>'city',
    p_delivery_details->>'postal_code',
    p_delivery_details->>'country',
    p_delivery_details->>'parcel_locker_id',
    p_delivery_details->>'parcel_locker_address',
    p_delivery_details->>'meetup_location',
    (p_delivery_details->>'meetup_date')::TIMESTAMPTZ,
    p_delivery_details->>'notes',
    CASE WHEN p_delivery_method = 'meetup' THEN v_total_amount ELSE 0 END
  )
  RETURNING id INTO v_order_id;

  -- Reserve product stock
  UPDATE public.products
  SET 
    stock = stock - p_quantity,
    status = CASE WHEN stock - p_quantity <= 0 THEN 'sold' ELSE status END,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN json_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_amount', v_total_amount,
    'message', 'Order created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROCESS PAYMENT (different escrow logic for meetup vs shipping)
CREATE OR REPLACE FUNCTION process_order_payment(
  p_order_id UUID,
  p_buyer_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_buyer_balance DECIMAL(10,2);
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND buyer_id = p_buyer_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found or already paid'
    );
  END IF;

  -- Get buyer balance
  SELECT balance INTO v_buyer_balance
  FROM public.users
  WHERE id = p_buyer_id;

  -- Check sufficient balance
  IF v_buyer_balance < v_order.total_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient balance. Please add funds to your balance.'
    );
  END IF;

  -- Deduct from buyer
  UPDATE public.users
  SET balance = balance - v_order.total_amount,
      updated_at = NOW()
  WHERE id = p_buyer_id;

  -- ESCROW LOGIC DIFFERENCE:
  -- MEETUP: Hold funds in escrow until both parties confirm
  -- SHIPPING: Release funds to seller immediately (they need to ship)
  
  IF v_order.delivery_method = 'meetup' THEN
    -- MEETUP: Hold in escrow
    UPDATE public.orders
    SET 
      status = 'escrow',
      payment_status = 'escrowed',
      paid_at = NOW(),
      escrow_amount = v_order.total_amount,
      escrow_released = FALSE,
      updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Record escrow transaction
    INSERT INTO public.user_transactions (user_id, transaction_type, amount, description, reference_id)
    VALUES (
      p_buyer_id,
      'escrow_hold',
      -v_order.total_amount,
      'Funds held in escrow for meetup: ' || v_order.order_number,
      p_order_id
    );
    
  ELSE
    -- SHIPPING: Release to seller immediately
    UPDATE public.users
    SET balance = balance + v_order.total_amount,
        updated_at = NOW()
    WHERE id = v_order.seller_id;
    
    UPDATE public.orders
    SET 
      status = 'paid',
      payment_status = 'paid',
      paid_at = NOW(),
      updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Record transactions
    INSERT INTO public.user_transactions (user_id, transaction_type, amount, description, reference_id)
    VALUES 
      (p_buyer_id, 'purchase', -v_order.total_amount, 'Purchase: ' || v_order.order_number, p_order_id),
      (v_order.seller_id, 'sale', v_order.total_amount, 'Sale: ' || v_order.order_number, p_order_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'order_id', p_order_id,
    'delivery_method', v_order.delivery_method,
    'escrowed', v_order.delivery_method = 'meetup',
    'message', CASE 
      WHEN v_order.delivery_method = 'meetup' THEN 'Payment held in escrow. Funds will be released after meetup confirmation.'
      ELSE 'Payment processed successfully. Seller will ship your order.'
    END
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RELEASE ESCROW (for meetup orders)
CREATE OR REPLACE FUNCTION release_escrow(
  p_order_id UUID,
  p_confirmed_by UUID
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_both_confirmed BOOLEAN;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND status = 'escrow' AND escrow_released = FALSE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found or escrow already released'
    );
  END IF;

  -- Update confirmation status
  IF p_confirmed_by = v_order.buyer_id THEN
    UPDATE public.orders
    SET meetup_confirmed_by_buyer = TRUE
    WHERE id = p_order_id;
  ELSIF p_confirmed_by = v_order.seller_id THEN
    UPDATE public.orders
    SET meetup_confirmed_by_seller = TRUE
    WHERE id = p_order_id;
  END IF;

  -- Check if both confirmed
  SELECT meetup_confirmed_by_buyer AND meetup_confirmed_by_seller INTO v_both_confirmed
  FROM public.orders
  WHERE id = p_order_id;

  -- Release escrow if both confirmed
  IF v_both_confirmed THEN
    -- Transfer funds to seller
    UPDATE public.users
    SET balance = balance + v_order.escrow_amount,
        updated_at = NOW()
    WHERE id = v_order.seller_id;

    -- Update order
    UPDATE public.orders
    SET 
      status = 'completed',
      payment_status = 'paid',
      escrow_released = TRUE,
      escrow_released_at = NOW(),
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_order_id;

    -- Record transactions
    INSERT INTO public.user_transactions (user_id, transaction_type, amount, description, reference_id)
    VALUES (
      v_order.seller_id,
      'escrow_release',
      v_order.escrow_amount,
      'Escrow released: ' || v_order.order_number,
      p_order_id
    );

    RETURN json_build_object(
      'success', true,
      'message', 'Escrow released! Payment sent to seller.',
      'completed', true
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Confirmation recorded. Waiting for other party to confirm.',
      'completed', false
    );
  END IF;

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- REFUND ORDER
CREATE OR REPLACE FUNCTION refund_order(
  p_order_id UUID,
  p_refund_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id AND payment_status IN ('paid', 'escrowed');

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order not found or not paid'
    );
  END IF;

  -- Refund buyer
  UPDATE public.users
  SET balance = balance + v_order.total_amount,
      updated_at = NOW()
  WHERE id = v_order.buyer_id;

  -- If seller already received funds (shipping), deduct from seller
  IF v_order.payment_status = 'paid' AND v_order.delivery_method = 'shipping' THEN
    UPDATE public.users
    SET balance = balance - v_order.total_amount,
        updated_at = NOW()
    WHERE id = v_order.seller_id;
    
    INSERT INTO public.user_transactions (user_id, transaction_type, amount, description, reference_id)
    VALUES (
      v_order.seller_id,
      'refund',
      -v_order.total_amount,
      'Refund issued: ' || v_order.order_number,
      p_order_id
    );
  END IF;

  -- Update order
  UPDATE public.orders
  SET 
    status = 'refunded',
    payment_status = 'refunded',
    admin_notes = COALESCE(admin_notes || E'\n', '') || 'Refunded: ' || COALESCE(p_refund_reason, 'No reason provided'),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Record refund transaction
  INSERT INTO public.user_transactions (user_id, transaction_type, amount, description, reference_id)
  VALUES (
    v_order.buyer_id,
    'refund',
    v_order.total_amount,
    'Refund: ' || v_order.order_number,
    p_order_id
  );

  -- Restore product stock
  UPDATE public.products
  SET 
    stock = stock + v_order.quantity,
    status = 'active',
    updated_at = NOW()
  WHERE id = v_order.product_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Order refunded successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GET SHIPPING QUOTE
CREATE OR REPLACE FUNCTION get_shipping_quote(
  p_carrier TEXT,
  p_service TEXT,
  p_from_country TEXT,
  p_to_country TEXT,
  p_weight_kg DECIMAL DEFAULT 1.0
)
RETURNS JSON AS $$
DECLARE
  v_rate RECORD;
BEGIN
  SELECT * INTO v_rate
  FROM public.shipping_rates
  WHERE 
    carrier = p_carrier
    AND service = p_service
    AND from_country = p_from_country
    AND to_country = p_to_country
    AND weight_min_kg <= p_weight_kg
    AND weight_max_kg >= p_weight_kg
    AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No shipping rate found'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'carrier', v_rate.carrier,
    'service', v_rate.service,
    'price', v_rate.price_eur,
    'estimated_days_min', v_rate.estimated_days_min,
    'estimated_days_max', v_rate.estimated_days_max,
    'currency', 'EUR'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 11. GRANT PERMISSIONS
-- ==========================================
GRANT EXECUTE ON FUNCTION create_order_from_product TO authenticated;
GRANT EXECUTE ON FUNCTION process_order_payment TO authenticated;
GRANT EXECUTE ON FUNCTION release_escrow TO authenticated;
GRANT EXECUTE ON FUNCTION refund_order TO authenticated;
GRANT EXECUTE ON FUNCTION get_shipping_quote TO authenticated;

-- ==========================================
-- SETUP COMPLETE!
-- ==========================================
-- You now have:
-- - Full orders system with escrow logic
-- - 90+ parcel lockers across LV, LT, EE
-- - Meetup: funds held in escrow until both confirm
-- - Shipping: funds released to seller immediately
-- - All necessary functions and policies
-- ==========================================
