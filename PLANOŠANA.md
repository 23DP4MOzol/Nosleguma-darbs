# Programmrisinājuma plānošana un progress

---

## 1. Plānotais risinājums atbilstoši Uzdevuma nostādnei

### a. Funkcionālās prasības (kas sistēmai jādara)

Sistēma **Vendly** ir tiešsaistes tirdzniecības platforma (marketplace), kas nodrošina šādas galvenās funkcijas:

| Nr. | Funkcija | Apraksts |
|-----|----------|----------|
| 1 | **Reģistrācija** | Lietotājs var izveidot kontu, norādot lietotājvārdu, e-pastu un paroli; jāpieņem lietošanas noteikumi |
| 2 | **Pieslēgšanās** | Lietotājs var autentificēties ar e-pastu un paroli; e-pasta verifikācija obligāta |
| 3 | **Produktu pievienošana** | Autentificēts lietotājs var publicēt sludinājumu ar nosaukumu, aprakstu, cenu, kategoriju, stāvokli, attēlu, krājumu skaitu u.c. |
| 4 | **Produktu meklēšana un filtrēšana** | Sākumlapā produktus var filtrēt pēc kategorijas, cenas, nosaukuma meklēšanas un citiem parametriem |
| 5 | **Produktu skatīšana** | Jebkurš apmeklētājs var aplūkot aktīvos sludinājumus; detalizēts skats ar attēlu, aprakstu, pārdevēja informāciju |
| 6 | **Produktu rediģēšana** | Pārdevējs var labot savus publicētos sludinājumus |
| 7 | **Produktu dzēšana** | Pārdevējs var dzēst savus sludinājumus |
| 8 | **Iegāde (pirkšana)** | Autentificēts lietotājs var iegādāties produktu, ja konta bilance ir pietiekama |
| 9 | **Bilances pārvaldība** | Lietotājs var papildināt konta bilanci un aplūkot darījumu vēsturi |
| 10 | **Ziņojumu sistēma (čats)** | Lietotāji var reāllaikā sazināties par konkrētiem produktiem; katra saruna ir saistīta ar produktu un pārdevēju |
| 11 | **Izlase (favorīti)** | Lietotājs var saglabāt produktus izlasē un tos vēlāk aplūkot |
| 12 | **Profils un iestatījumi** | Lietotājs var rediģēt lietotājvārdu, bio, avatāru un mainīt paroli |
| 13 | **Administratora panelis** | Admins var apskatīt statistiku, pārvaldīt lietotājus, produktus, atbalsta biļetes un darījumus |
| 14 | **E-pasta verifikācija** | Pēc reģistrācijas lietotājam jāapstiprina e-pasts, lai pieslēgtos |
| 15 | **Vērtējumi un atsauksmes** | Pircēji var atstāt vērtējumu un komentāru pārdevējiem (plānots) |

---

### b. Nefunkcionālās prasības (kā sistēma strādā)

| Nr. | Prasība | Detaļas |
|-----|---------|---------|
| 1 | **Drošība – paroles** | Minimālais paroles garums – 6 rakstzīmes; paroles tiek glabātas šifrēti (Supabase Auth) |
| 2 | **Piekļuves tiesības (lomas)** | Trīs lomas: `user` (parasts lietotājs), `admin` (administrators) un `viewer` (skatītājs ar lasīšanas piekļuvi); loma ir fiksēta ar CHECK ierobežojumu datubāzē |
| 3 | **Datu drošība (RLS)** | Katrai tabulai Supabase ir ieslēgts Row Level Security – lietotājs var rediģēt tikai savus datus |
| 4 | **E-pasta verifikācija** | Pieslēgšanās ir bloķēta, kamēr nav apstiprināts e-pasts |
| 5 | **Responsivitāte (saderība)** | Dizains ir pilnībā responsīvs – darbojas uz mobilajām ierīcēm (< 768px), planšetdatoriem (768–1024px) un datoriem (> 1024px) |
| 6 | **Daudzvalodība** | Platforma atbalsta divas valodas: angļu (en) un latviešu (lv); valoda tiek noteikta automātiski no pārlūkprogrammas |
| 7 | **Tumšais/gaišais režīms** | Lietotājs var pārslēgt dizaina tēmu; izvēle tiek saglabāta `localStorage` |
| 8 | **XSS aizsardzība** | Visas lietotāja ievades tiek "escapotas" pirms izvadīšanas HTML saturā |
| 9 | **Escrow darījumi** | Maksājumi tiek turēti sistēmas līmenī līdz darījuma apstiprināšanai |
| 10 | **Pretkrāpšanas politika** | Reģistrācijas laikā lietotājam jāpieņem pretkrāpšanas noteikumi ar brīdinājumu |
| 11 | **Veiktspēja** | Statiskai hostingam izmanto Vite build (minifikācija, kodu sadalīšana); Supabase nodrošina ātrās API atbildes |
| 12 | **Saderība ar pārlūkprogrammām** | Darbojas visos mūsdienu pārlūkos (Chrome, Firefox, Safari, Edge) |

---

## 2. Atskaites daļa: kas jau ir izdarīts

### a. Front-end progress

#### Izveidotās lapas

| Lapa | Fails | Apraksts |
|------|-------|----------|
| **Sākumlapa** | `index.html` | Galvenā tirdzniecības platforma ar produktu tīklu, meklēšanu, filtriem pēc kategorijas un cenas; produktu kartītes ar attēliem, cenām un "Pirkt" pogu |
| **Pieslēgšanās** | `login.html` | E-pasta un paroles autentifikācija; apstrāde gadījumam, ja e-pasts nav verificēts (ar iespēju atkārtoti nosūtīt verifikācijas saiti); parādīšanās no URL parametriem (piem., pēc reģistrācijas) |
| **Reģistrācija** | `register.html` | Reģistrācijas forma ar lietotājvārdu, e-pastu, paroli, paroles apstiprināšanu; obligāta noteikumu pieņemšana; pretkrāpšanas brīdinājums pirms iesniegšanas; terminu modāls (EN/LV) |
| **Mani produkti** | `product.html` | Produktu saraksts ar filtriem (visi / aktīvie / pārdotie / izlase); produktu rediģēšana un dzēšana; citu lietotāju profilu skatīšana; favorītu sistēma |
| **Pārdot** | `sell.html` | Produkta publicēšanas forma ar reālaika priekšskatījumu; atbalsts URL un failu augšupielādei; automātiska komisijas aprēķināšana |
| **Bilance** | `balance.html` | Konta bilances aplūkošana, līdzekļu papildināšana un darījumu vēsture |
| **Čats** | `chat.html` | Reāllaika ziņapmaiņa ar Supabase Realtime; sarunu saraksts; sarunu atvēršana no produktu lapas (URL parametri) |
| **Administratora panelis** | `admin.html` | Statistikas pārskats, lietotāju un produktu pārvaldība, atbalsta biļetes, darījumu vēsture (tikai admins) |
| **Iestatījumi** | `settings.html` | Profila rediģēšana (lietotājvārds, bio, avatārs), paroles maiņa, tēmas izvēle |
| **E-pasta verifikācija** | `resend-verification.html` | Iespēja atkārtoti nosūtīt e-pasta verifikācijas saiti |
| **Noteikumi (EN)** | `terms.html` | Pretkrāpšanas politika un platformas noteikumi angļu valodā |
| **Noteikumi (LV)** | `terms-lv.html` | Pretkrāpšanas politika un platformas noteikumi latviešu valodā |

#### Paveiktais front-endā

- ✅ Navigācijas josla ar autentifikācijas stāvokli (ielogošanās/izlogošanās, bilances žetons)
- ✅ Tumšā/gaišā tēma ar saglabāšanu `localStorage`
- ✅ Daudzvalodīgs interfeiss (i18next) ar automātisku valodas noteikšanu
- ✅ Responsīvs dizains ar hamburgeru izvēlni mobilajām ierīcēm
- ✅ Formu validācija (reģistrācija, parole, produkta publicēšana)
- ✅ Produktu kartītes ar attēliem, cenām, kategorijām, stāvokli
- ✅ Reālaika produktu priekšskatījums publicēšanas laikā
- ✅ Modālie logi (noteikumi, dzēšanas apstiprināšana, informācija)
- ✅ XSS aizsardzība ar `escapeHtml` funkcijām

---

### b. Back-end progress

Sistēmas aizmugure tiek realizēta caur **Supabase** (Backend-as-a-Service) bez atsevišķa servera.

#### Autorizācija un autentifikācija

- ✅ **Reģistrācija** – Supabase Auth `signUp()` ar e-pasta verifikāciju
- ✅ **Pieslēgšanās** – `signInWithPassword()` ar verifikācijas pārbaudi
- ✅ **Izlogošanās** – `signOut()` visās lapās
- ✅ **Sesijas pārvaldība** – automātiska tokena atjaunošana (`autoRefreshToken: true`), glabāšana `localStorage`
- ✅ **Paroles maiņa** – `updateUser()` ar apstiprināšanu

#### CRUD elementi

| Darbība | Produkti | Lietotāji | Ziņojumi | Darījumi | Izlase |
|---------|----------|-----------|----------|----------|--------|
| **Create** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Read** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Update** | ✅ | ✅ | — | — | — |
| **Delete** | ✅ | — | — | — | ✅ |

#### API maršruti (Supabase klienta vaicājumi)

- ✅ `getProducts()` – produktu iegūšana ar filtriem
- ✅ `listProduct(data, userId)` – jauna produkta publicēšana ar komisijas ieturēšanu
- ✅ `purchaseProduct(productId, userId)` – produkta iegāde ar bilances pārbaudi
- ✅ `reserveProduct(productId, userId)` – produkta rezervācija
- ✅ `getBalance(userId)` – konta bilances iegūšana
- ✅ `addBalance(userId, amount)` – bilances papildināšana
- ✅ `getUserTransactions(userId)` – darījumu vēsture
- ✅ `getOrCreateConversation(productId, buyerId, sellerId)` – sarunu inicializācija
- ✅ `rpc_send_message` – ziņojumu sūtīšana caur Supabase RPC (atomiska operācija)
- ✅ `addToFavorites / removeFromFavorites / getUserFavorites` – izlases pārvaldība

#### Kļūdu apstrāde

- ✅ Visu Supabase vaicājumu kļūdu apstrāde ar informatīviem ziņojumiem
- ✅ Atkārtotas reģistrācijas ar esošu e-pastu bloķēšana
- ✅ Tīkla kļūdu apstrāde
- ✅ Autorizācijas pārbaude visās aizsargātajās lapās (pāradresācija uz login.html)

---

### c. Datu bāze

#### Tabulu struktūra (faktiskā shēma)

**`users`**
```
id uuid PK, email text UNIQUE NOT NULL, username text,
role text CHECK(role IN ('user','admin','viewer')) DEFAULT 'user',
balance numeric(12,2) DEFAULT 0.00, profile_image text, language text DEFAULT 'en',
created_at timestamptz, updated_at timestamptz
```

**`products`**
```
id uuid PK, seller_id uuid → users(id) ON DELETE SET NULL,
name text NOT NULL, name_lv text, description text, description_lv text,
price numeric(12,2) NOT NULL, category text, condition text, location text,
image_url text, stock integer DEFAULT 0, is_reserved boolean DEFAULT false,
reserved_by uuid → users(id), reserved_at timestamptz,
listing_fee numeric(12,2), reserve_fee numeric(12,2) DEFAULT 0.20,
brand text, color text, weight_kg decimal(10,2),
seller_street text, seller_city text, seller_postal_code text,
original_price decimal(12,2), status text DEFAULT 'active',
likes_count integer DEFAULT 0, views_count integer DEFAULT 0,
sold_at timestamptz,
created_at timestamptz, updated_at timestamptz
```

**`conversations`**
```
id uuid PK,
buyer_id uuid NOT NULL → users(id) ON DELETE CASCADE,
seller_id uuid NOT NULL → users(id) ON DELETE CASCADE,
product_id uuid → products(id) ON DELETE SET NULL,
status text DEFAULT 'active' CHECK(IN 'active','archived','blocked'),
last_message text, last_message_at timestamptz,
created_at timestamptz, updated_at timestamptz
UNIQUE INDEX (buyer_id, seller_id, product_id) WHERE product_id IS NOT NULL
```

**`messages`**
```
id uuid PK, conversation_id uuid NOT NULL → conversations(id) ON DELETE CASCADE,
sender_id uuid NOT NULL → users(id) ON DELETE CASCADE,
content text NOT NULL,
message_type text DEFAULT 'text' CHECK(IN 'text','image','system'),
is_read boolean DEFAULT false, created_at timestamptz
```

**`user_transactions`**
```
id uuid PK, user_id uuid NOT NULL → users(id) ON DELETE CASCADE,
transaction_type text NOT NULL CHECK(IN 'deposit','withdrawal','purchase','sale','refund',
  'admin_adjustment','escrow_hold','escrow_release'),
amount decimal(10,2) NOT NULL,
description text, reference_id uuid,
created_at timestamptz, updated_at timestamptz
```

**`orders`**
```
id uuid PK, order_number text UNIQUE NOT NULL (auto-generated ORD-YYYY-NNNN),
buyer_id uuid NOT NULL → users(id),
seller_id uuid NOT NULL → users(id),
product_id uuid NOT NULL → products(id),
quantity integer NOT NULL DEFAULT 1,
unit_price decimal(10,2) NOT NULL, total_amount decimal(10,2) NOT NULL,
status text NOT NULL DEFAULT 'pending'
  CHECK(IN 'pending','paid','escrow','processing','ready_for_pickup',
         'shipped','in_transit','delivered','completed','cancelled','refunded','disputed'),
payment_method text DEFAULT 'balance' CHECK(IN 'balance','card','bank_transfer'),
payment_status text DEFAULT 'pending' CHECK(IN 'pending','paid','failed','refunded','escrowed'),
paid_at timestamptz,
escrow_amount decimal(10,2) DEFAULT 0,
escrow_released boolean DEFAULT false, escrow_released_at timestamptz,
delivery_method text NOT NULL CHECK(IN 'meetup','shipping'),
shipping_carrier text, shipping_service text, tracking_number text, shipping_cost decimal(10,2) DEFAULT 0,
recipient_name text, recipient_phone text,
shipping_address text, shipping_city text, shipping_postal_code text,
shipping_country text CHECK(IN 'LV','LT','EE'),
parcel_locker_id text, parcel_locker_address text,
meetup_location text, meetup_date timestamptz,
meetup_confirmed_by_buyer boolean DEFAULT false,
meetup_confirmed_by_seller boolean DEFAULT false,
buyer_notes text, seller_notes text, admin_notes text,
created_at timestamptz, updated_at timestamptz,
completed_at timestamptz, cancelled_at timestamptz
```

**`order_status_history`**
```
id uuid PK, order_id uuid NOT NULL → orders(id),
old_status text, new_status text NOT NULL,
changed_by uuid → users(id), notes text, created_at timestamptz
```

**`shipping_rates`**
```
id uuid PK, carrier text NOT NULL, service text NOT NULL,
from_country text NOT NULL, to_country text NOT NULL,
weight_min_kg decimal(5,2) NOT NULL DEFAULT 0,
weight_max_kg decimal(5,2) NOT NULL,
price_eur decimal(10,2) NOT NULL,
estimated_days_min integer, estimated_days_max integer,
active boolean DEFAULT true,
created_at timestamptz, updated_at timestamptz
```

**`parcel_lockers`**
```
id uuid PK, carrier text NOT NULL, locker_id text NOT NULL UNIQUE,
name text NOT NULL, address text NOT NULL, city text NOT NULL,
postal_code text, country text NOT NULL CHECK(IN 'LV','LT','EE'),
latitude decimal(10,7), longitude decimal(10,7),
active boolean DEFAULT true,
created_at timestamptz, updated_at timestamptz
```

**`reviews`**
```
id uuid PK,
buyer_id uuid NOT NULL → users(id) ON DELETE CASCADE,
seller_id uuid NOT NULL → users(id) ON DELETE CASCADE,
rating integer NOT NULL CHECK(1–5), comment text,
created_at timestamptz, updated_at timestamptz,
UNIQUE(buyer_id, seller_id), CHECK(buyer_id != seller_id)
```

**`product_views`** *(skatījumu izsekošana)*
```
id uuid PK,
user_id uuid NOT NULL → users(id) ON DELETE CASCADE,
product_id uuid NOT NULL → products(id) ON DELETE CASCADE,
created_at timestamptz,
UNIQUE(user_id, product_id)
```

**`support_tickets`**
```
id uuid PK, user_id uuid → users(id), title text, message text,
status text DEFAULT 'open', priority text DEFAULT 'normal',
created_at timestamptz, updated_at timestamptz, resolved_at timestamptz
```

**`chat_sessions`** *(admin/AI čats)*
```
id uuid PK, user_id uuid → users(id), admin_id uuid → users(id),
status text DEFAULT 'open', language text DEFAULT 'en', title text,
admin_joined_at timestamptz, created_at timestamptz, updated_at timestamptz
```

**`chat_messages`** *(admin/AI čata ziņojumi)*
```
id uuid PK, session_id uuid → chat_sessions(id) ON DELETE CASCADE,
sender_id uuid → users(id), content text,
sender_type text, message_type text DEFAULT 'text', created_at timestamptz
```

**`favorites`**
```
id uuid PK, user_id uuid NOT NULL → users(id) ON DELETE CASCADE,
product_id uuid NOT NULL → products(id) ON DELETE CASCADE,
created_at timestamptz, UNIQUE(user_id, product_id)
```

#### Veiktie uzlabojumi un precizējumi

- ✅ `products` tabulā pievienoti lauki: `brand`, `color`, `weight_kg`, `seller_street`, `seller_city`, `seller_postal_code`, `original_price`, `status`
- ✅ `products` tabulā pievienoti skaitītāji: `likes_count`, `views_count`, `sold_at`
- ✅ `products` tabulā divvalodu lauki: `name_lv`, `description_lv` latviešu tulkojumam
- ✅ `products` tabulā `reserve_fee` (rezervācijas komisija, noklusējums €0.20)
- ✅ Jauna tabula `product_views` – unikāls skatījums uz produktu vienam lietotājam
- ✅ Pārveidota `reviews` tabula: `buyer_id`/`seller_id` (bez `product_id`); `UNIQUE(buyer_id, seller_id)` un `CHECK(buyer_id != seller_id)` nodrošina 1 atsauksme pārdevējam un novērš pašvērtēšanu
- ✅ `user_transactions` CHECK ierobežojums paplašināts ar `deposit`, `withdrawal`, `admin_adjustment`, `escrow_hold`, `escrow_release`
- ✅ `conversations` tabula: `status` CHECK, `NOT NULL` uz `buyer_id`/`seller_id`, daļējais unikālais indekss pēc pircēja-pārdevēja-produkta
- ✅ `messages` tabula: `content NOT NULL`, `message_type` CHECK, `sender_id NOT NULL`
- ✅ Pārbūvēta `orders` tabula ar pilnu piegādes/maksājumu/eskrova loģiku; atsevišķas `order_status_history`, `shipping_rates`, `parcel_lockers` tabulas
- ✅ 77 paku automāti (Omniva + DPD) Latvijā, Lietuvā, Igaunijā
- ✅ 18 piegādes tarifi (`shipping_rates`)
- ✅ Trigeri skaitītāju automātiskai atjaunošanai:
  - `trigger_update_likes_count` – atjaunina `products.likes_count` pēc `favorites` INSERT/DELETE
  - `trigger_update_views_count` – atjaunina `products.views_count` pēc `product_views` INSERT
- ✅ Triggeris `handle_new_user()` – automātiski izveido `public.users` rindu, reģistrējoties caur Supabase Auth
- ✅ Indeksi produktu meklēšanai: `idx_products_status`, `idx_products_brand`
- ✅ `users` tabulā `profile_image` un `language` lauki lietotāja preferenču glabāšanai
- ✅ `conversations` tabulā `last_message` un `last_message_at` sānjoslas priekšskatījumam
- ✅ Atsevišķas tabulas admin/AI čatam: `chat_sessions` un `chat_messages`
- ✅ RLS politikas precizētas visām 17 tabulām
- ✅ Testdati: 1 admins un 2 lietotāji iepriekš ierakstīti ar sākotnējām bilancēm

#### Normalizācijas pārbaude (3NF)

Datu bāze ir pārbaudīta atbilstībai **3. normālformai (3NF)**:

- **1NF** ✅ – Visas kolonnas satur atomiskās vērtības; nav atkārtojošo grupu
- **2NF** ✅ – Visas tabulas izmanto vienkāršu UUID primāro atslēgu; nav daļējas atkarības no saliktas atslēgas
- **3NF** ✅ – Nav tranzitīvu atkarību; katrs atribūts ir atkarīgs tikai no primārās atslēgas

**Atklātās problēmas:**
- `products.category` glabājas kā brīvs teksts (nav atsevišķas `categories` atsauces tabulas) – risināms, pievienojot atsauces tabulu
- `products.seller_id` ir `ON DELETE SET NULL` – pēc pārdevēja dzēšanas paliek produkti bez pārdevēja; jāapsver biznesa loģika
- `products.likes_count` / `products.views_count` ir denormalizēti skaitītāji (trigeri uztur to pareizību), kas ir apzināts veiktspējas kompromiss

#### Ievieستie ierobežojumi

| Tabula | Ierobežojums | Mērķis |
|--------|-------------|--------|
| `users` | `NOT NULL` (email) | Nodrošina, ka katram lietotājam ir e-pasts |
| `users` | `UNIQUE` (email) | Novērš dublikātu kontus |
| `users` | `CHECK (role IN ('user','admin','viewer'))` | Pieļauj tikai derīgas lomas |
| `products` | `NOT NULL` (name, price) | Garantē obligātos sludinājuma laukus |
| `products` | `REFERENCES users(id) ON DELETE SET NULL` | Produkts saglabājas pēc pārdevēja dzēšanas |
| `conversations` | `CHECK (status IN ('active','archived','blocked'))` | Derīgi sarunu stāvokļi |
| `messages` | `NOT NULL` (content, sender_id) | Novērš tukšus ziņojumus |
| `messages` | `CHECK (message_type IN ('text','image','system'))` | Derīgi ziņojumu tipi |
| `user_transactions` | `CHECK (transaction_type IN ('deposit','withdrawal','purchase','sale','refund','admin_adjustment','escrow_hold','escrow_release'))` | Pieļauj tikai 8 derīgus darījumu tipus |
| `reviews` | `CHECK (rating >= 1 AND rating <= 5)` | Vērtējums tikai 1–5 diapazonā |
| `reviews` | `UNIQUE(buyer_id, seller_id)` | 1 atsauksme pārdevējam no katra pircēja |
| `reviews` | `CHECK (buyer_id != seller_id)` | Novērš pašvērtēšanu |
| `reviews` | `ON DELETE CASCADE` uz abām FK | Dzēšot lietotāju, dzēš arī viņa atsauksmes |
| `product_views` | `UNIQUE(user_id, product_id)` | Viens skatījums uz produktu vienam lietotājam |
| `messages` | `REFERENCES conversations(id) ON DELETE CASCADE` | Dzēšot sarunu, dzēš arī ziņojumus |
| `chat_messages` | `REFERENCES chat_sessions(id) ON DELETE CASCADE` | Dzēšot čata sesiju, dzēš arī ziņojumus |
| `favorites` | `UNIQUE(user_id, product_id)` | Novērš dublikātus izlasē |
| `favorites` | `ON DELETE CASCADE` uz abām FK | Dzēšot lietotāju vai produktu, dzēš favorītu |
| `user_transactions` | `ON DELETE CASCADE` uz `user_id` | Dzēšot lietotāju, dzēš arī viņa darījumus |

#### Ievieستās RPC funkcijas (Supabase)

| Funkcija | Mērķis |
|----------|--------|
| `rpc_topup(amount)` | Atomiski papildina bilanci un ieraksta darījumu; apstrādā gadījumu, ja rinda neeksistē (`unique_violation`) |
| `rpc_withdraw(amount)` | Atomiski atskaita summu no bilances; met kļūdu `insufficient_funds`, ja bilance nepietiekama |
| `rpc_charge_admin_fee(amount, description)` | Pārskaita komisiju no lietotāja uz adminu; ieraksta abpusējos darījumus |
| `rpc_send_message(p_conversation_id, p_content)` | Atomiski ievieto ziņojumu un atjaunina `last_message` sarunā; atgriež JSON `{success, message_id}` vai `{error}`; pārbauda dalībnieku tiesības un pielāgo saturu |
| `create_order_from_product(product_id, buyer_id, quantity, delivery_method, delivery_details)` | Izveido pasūtījumu, aprēķina piegādes izmaksas no `shipping_rates`, samazina krājumus; atgriež JSON `{success, order_id, total_amount}` |
| `process_order_payment(order_id, buyer_id)` | Apstrādā maksājumu: tikšanās — ievieto eskrovā; piegāde — nekavējoties pārskaita pārdevējam; ieraksta `user_transactions` |
| `release_escrow(order_id, confirmed_by)` | Reģistrē tikšanās apstiprinājumu; kad abi posmabiedri apstiprinājuši — pārskaita eskrova summu pārdevējam un atzīmē pasūtījumu kā `completed` |
| `refund_order(order_id, refund_reason)` | Atmaksā pircējam; atgriež krājumus; ja piegāde bija apmaksāta — atskaita no pārdevēja |
| `get_shipping_quote(carrier, service, from_country, to_country, weight_kg)` | Atgriež cenu un laiku no `shipping_rates` tabulas; JSON `{success, price, estimated_days_min, estimated_days_max}` |

Visas RPC funkcijas izpildās ar `SECURITY DEFINER` un ir pieejamas autentificētiem lietotājiem (`GRANT EXECUTE TO authenticated`).

#### Automātiskie trigeri

| Trigeris | Tabula | Mērķis |
|----------|--------|--------|
| `on_auth_user_created` | `auth.users` | Auto-izveido `public.users` rindu pēc reģistrācijas |
| `trigger_update_likes_count` | `favorites` | Atjaunina `products.likes_count` pēc INSERT/DELETE |
| `trigger_update_views_count` | `product_views` | Atjaunina `products.views_count` pēc INSERT |
| `update_conversations_updated_at` | `conversations` | Atjaunina `updated_at` laiku |
| `set_order_number_trigger` | `orders` | Auto-ģenerē `order_number` (`ORD-YYYY-NNNN`) pirms INSERT |
| `log_order_status_change_trigger` | `orders` | Ieraksta katru statusa maiņu `order_status_history` tabulā |
| `update_orders_updated_at` | `orders` | Atjaunina `updated_at` laiku |
| `update_user_transactions_updated_at` | `user_transactions` | Atjaunina `updated_at` laiku |

#### Indeksēšana

- ✅ `idx_favorites_user_id` – ātra lietotāja izlases iegūšana
- ✅ `idx_favorites_product_id` – ātra izlases produktu pārbaude
- ✅ `idx_favorites_created_at DESC` – izlases kārtošana pēc pievienošanas laika
- ✅ `idx_products_status` – filtrēšana pēc produkta statusa
- ✅ `idx_products_brand` – meklēšana pēc zīmola
- ✅ `idx_reviews_seller_id` – ātra pārdevēja vērtējumu iegūšana
- ✅ `idx_reviews_buyer_id` – pircēja atsauksmju atrašana
- ✅ `idx_product_views_product_id` – skatījumu skaita aprēķins
- ✅ `idx_conversations_buyer_id`, `idx_conversations_seller_id` – sarunu filtrēšana
- ✅ `idx_orders_buyer_id`, `idx_orders_seller_id`, `idx_orders_status`, `idx_orders_created_at` – pasūtījumu filtrēšana
- ✅ `idx_shipping_rates_carrier`, `idx_shipping_rates_countries` – tarifa meklēšana
- ✅ `idx_parcel_lockers_carrier`, `idx_parcel_lockers_country`, `idx_parcel_lockers_city` – paku automātu meklēšana
- ⬜ Pilna teksta meklēšanas indekss produktu nosaukumiem (`name`, `description`)

#### Kas pabeigts un kas vēl trūkst

**Pabeigts:**
- ✅ Visas 17 tabulas izveidotas un darbojas ar RLS: `users`, `products`, `user_transactions`, `conversations`, `messages`, `orders`, `order_status_history`, `shipping_rates`, `parcel_lockers`, `reviews`, `support_tickets`, `chat_sessions`, `chat_messages`, `favorites`, `product_views`
- ✅ CHECK ierobežojumi uz `users.role`, `user_transactions.transaction_type` (8 tipi), `reviews.rating`, `conversations.status`, `messages.message_type`, `orders.status`, `orders.payment_status`, `orders.delivery_method`
- ✅ 9 RPC funkcijas bilances, darījumu, ziņojumu un pasūtījumu atomiskai apstrādei
- ✅ 8 automātiski trigeri (lietotāju izveide, skaitītāji, laika zīmogi, pasūtījumu numuri, statusa vēsture)
- ✅ Sākotnējie testdati: 1 admins un 2 lietotāji ar bilancēm; 77 paku automāti; 18 piegādes tarifi
- ✅ 15+ indeksi ātrākai datu piekļuvei
- ✅ Realtime ieslēgts `messages` un `conversations` tabulām

**Vēl trūkst:**
- ⬜ `categories` atsauces tabula (pašreiz kategorija ir brīvs teksts)
- ⬜ Pilna teksta meklēšanas indekss (`name`, `description`)
- ⬜ `chat_sessions` / `chat_messages` integrācija admin panelī
- ⬜ Plašāki testdati demonstrācijai (produkti, sarakstes, atsauksmes)
- ⬜ Datubāzes migrācijas fails ar versiju kontroli

---

## 3. Darbu plāns līdz 23. martam

| Termiņš | Sasniedzamais rezultāts |
|---------|------------------------|
| **Līdz 7. martam** | Darbojas pilnvērtīga produktu meklēšana un filtrēšana sākumlapā (pēc nosaukuma, kategorijas, cenas intervāla); produktu lapa ar pilnu aprakstu un "Sazināties ar pārdevēju" pogu |
| **Līdz 11. martam** | Pabeigta vērtējumu un atsauksmju sistēma – pircējs pēc pirkuma var novērtēt pārdevēju (1–5 zvaigznes + komentārs); vērtējumu attēlošana profila un produktu lapās |
| **Līdz 14. martam** | `orders` tabulas pilna integrācija – pasūtījumu statusi (gaidošs / nosūtīts / pabeigts / atcelts); pircējs var aplūkot savu pasūtījumu vēsturi; pārdevējs var atzīmēt nosūtīšanu |
| **Līdz 17. martam** | Datu bāzes uzlabojumi: `categories` atsauces tabula, meklēšanas indeksi, testdati (seed) demonstrācijai; normalizācijas pārbaudes pabeigšana |
| **Līdz 20. martam** | Pilna front-end un back-end integrācijas testēšana; kļūdu labošana; mobilās versijas pārbaude; administratora paneļa pabeigšana (statistika, moderācija) |
| **Līdz 23. martam** | Pilnīgi integrēts front-end ar back-end; pabeigta demonstrācija ar testdatiem; dokumentācija aktualizēta; projekts izvietots (deployed) un gatavs prezentācijai |
