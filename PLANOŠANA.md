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
created_at timestamptz, updated_at timestamptz
```

**`conversations`**
```
id uuid PK, product_id uuid → products(id) ON DELETE CASCADE,
buyer_id uuid → users(id), seller_id uuid → users(id),
status text DEFAULT 'active', last_message text, last_message_at timestamptz,
created_at timestamptz, updated_at timestamptz
```

**`messages`**
```
id uuid PK, conversation_id uuid → conversations(id) ON DELETE CASCADE,
sender_id uuid → users(id), content text,
message_type text DEFAULT 'text', is_read boolean DEFAULT false, created_at timestamptz
```

**`user_transactions`**
```
id uuid PK, user_id uuid → users(id) ON DELETE CASCADE,
amount numeric(12,2) NOT NULL,
transaction_type text CHECK(IN 'topup','purchase','refund','sale','fee'),
description text, reference_id uuid, created_at timestamptz
```

**`orders`**
```
id uuid PK, user_id uuid → users(id), total numeric(12,2),
status text DEFAULT 'pending', shipping_address text,
created_at timestamptz, updated_at timestamptz
```

**`reviews`**
```
id uuid PK, product_id uuid → products(id) ON DELETE CASCADE,
user_id uuid → users(id), rating integer CHECK(1–5), comment text, created_at timestamptz
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
id uuid PK, user_id uuid → users(id) ON DELETE CASCADE,
product_id uuid → products(id) ON DELETE CASCADE,
created_at timestamptz, UNIQUE(user_id, product_id)
```

#### Veiktie uzlabojumi un precizējumi

- ✅ `products` tabulā divvalodu lauki: `name_lv`, `description_lv` latviešu tulkojumam
- ✅ `products` tabulā pievienots `reserve_fee` (rezervācijas komisija, noklusējums €0.20)
- ✅ `users` tabulā `profile_image` un `language` lauki lietotāja preferenču glabāšanai
- ✅ `conversations` tabulā `last_message` un `last_message_at` sānjoslas priekšskatījumam
- ✅ Atsevišķas tabulas admin/AI čatam: `chat_sessions` un `chat_messages`
- ✅ Izveidota `favorites` tabula ar `UNIQUE(user_id, product_id)` ierobežojumu
- ✅ Ieviesti CHECK ierobežojumi: `users.role`, `user_transactions.transaction_type`, `reviews.rating`
- ✅ RLS politikas precizētas visām 10 tabulām
- ✅ Testdati: 1 admins un 2 lietotāji iepriekš ierakstīti ar sākotnējām bilancēm

#### Normalizācijas pārbaude (3NF)

Datu bāze ir pārbaudīta atbilstībai **3. normālformai (3NF)**:

- **1NF** ✅ – Visas kolonnas satur atomiskās vērtības; nav atkārtojošo grupu
- **2NF** ✅ – Visas tabulas izmanto vienkāršu UUID primāro atslēgu; nav daļējas atkarības no saliktas atslēgas
- **3NF** ✅ – Nav tranzitīvu atkarību; katrs atribūts ir atkarīgs tikai no primārās atslēgas

**Atklātās problēmas:**
- `products.category` glabājas kā brīvs teksts (nav atsevišķas `categories` atsauces tabulas) – risināms, pievienojot atsauces tabulu
- `products.seller_id` ir `ON DELETE SET NULL` (nevis CASCADE) – pēc dzēšanas paliek produkti bez pārdevēja; jāapsver biznesa loģika

#### Ievieستie ierobežojumi

| Tabula | Ierobežojums | Mērķis |
|--------|-------------|--------|
| `users` | `NOT NULL` (email) | Nodrošina, ka katram lietotājam ir e-pasts |
| `users` | `UNIQUE` (email) | Novērš dublikātu kontus |
| `users` | `CHECK (role IN ('user','admin','viewer'))` | Pieļauj tikai derīgas lomas |
| `products` | `NOT NULL` (name, price) | Garantē obligātos sludinājuma laukus |
| `products` | `REFERENCES users(id) ON DELETE SET NULL` | Produkts saglabājas pēc pārdevēja dzēšanas |
| `products` | `REFERENCES users(id)` uz `reserved_by` | Rezervācijas integritāte |
| `user_transactions` | `CHECK (transaction_type IN ('topup','purchase','refund','sale','fee'))` | Pieļauj tikai derīgus darījumu tipus |
| `reviews` | `CHECK (rating >= 1 AND rating <= 5)` | Vērtējums tikai 1–5 diapazonā |
| `reviews` | `REFERENCES products(id) ON DELETE CASCADE` | Dzēšot produktu, dzēš arī tā atsauksmes |
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
| `rpc_send_message(p_conversation_id, p_content)` | Atomiski ievieto ziņojumu un atjaunina `last_message` sarunā; pārbauda dalībnieku tiesības |

Visas RPC funkcijas izpildās ar `SECURITY DEFINER` un ir pieejamas autentificētiem lietotājiem (`GRANT EXECUTE TO authenticated`).

#### Indeksēšana

- ✅ `idx_favorites_user_id` – ātra lietotāja izlases iegūšana
- ✅ `idx_favorites_product_id` – ātra izlases produktu pārbaude
- ✅ `idx_favorites_created_at DESC` – izlases kārtošana pēc pievienošanas laika
- ⬜ Produktu meklēšanas indeksi (`category`, `price`, `name`) – vēl jāpievieno

#### Kas pabeigts un kas vēl trūkst

**Pabeigts:**
- ✅ Visas 10 tabulas izveidotas un darbojas ar RLS: `users`, `products`, `user_transactions`, `conversations`, `messages`, `orders`, `reviews`, `support_tickets`, `chat_sessions`, `chat_messages`
- ✅ `favorites` tabula ar unikālo ierobežojumu un kaskādes dzēšanu
- ✅ CHECK ierobežojumi uz `users.role`, `user_transactions.transaction_type`, `reviews.rating`
- ✅ Četras RPC funkcijas bilances, darījumu un ziņojumu atomiskai apstrādei
- ✅ Sākotnējie testdati: 1 admins un 2 lietotāji ar bilancēm
- ✅ Indeksi izlases tabulai

**Vēl trūkst:**
- ⬜ `categories` atsauces tabula (pašreiz kategorija ir brīvs teksts)
- ⬜ Indeksi produktu meklēšanai (`name`, `category`, `price`)
- ⬜ `orders` tabulas pilna integrācija front-endā (pasūtījumu statusi, piegāde)
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
