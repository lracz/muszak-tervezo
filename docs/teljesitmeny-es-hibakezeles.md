# Teljesítményoptimalizálás és Hibakezelés

Ez a dokumentum bemutatja azokat az építészeti és implementációs döntéseket, amelyeket a rendszer stabilitásának (hibakezelés) és gyorsaságának (teljesítményoptimalizálás) érdekében hoztunk meg.

## 1. Hibakezelési Megoldások (Error Handling)

A robusztus működés érdekében a rendszer több szinten kezeli a kivételeket.

### 1.1 Backend: Global Exception Handler
Az ASP.NET Core API-ban egy egyedi `GlobalExceptionHandler` middleware-t implementáltunk. 
- **Célja:** Elfogja a rendszerben bárhol fellépő, le nem kezelt (unhandled) kivételeket.
- **Működése:** A kivételeket strukturált `ProblemDetails` JSON formátumra alakítja.
- **Előnyei:** A kliens alkalmazás (React) mindig egységes, jól értelmezhető hibaválaszt kap, függetlenül attól, hogy adatbázis hiba, üzleti logikai hiba vagy null-reference exception történt. Nem szivárog ki belső szerver log vagy stack trace a felhasználó felé.

### 1.2 Biztonsági Hibakezelés és Rate Limiting
A bejelentkezési (`/api/auth/login`) végpontok védelme érdekében IP-alapú **Rate Limiter**-t vezettünk be.
- **Brute-force védelem:** Egy IP címről percenként maximum 5 bejelentkezési kísérlet engedélyezett.
- **Hibakezelés:** A limit túllépése esetén a rendszer `429 Too Many Requests` hibakóddal válaszol, amit a frontend megfelelően lekezel.

### 1.3 Frontend: Felhasználóbarát hibaüzenetek (Toast)
A React kliens minden API hívást (fetch) egy globális hibakezelő blokkban végez.
- **UX fókusz:** Ha a backend 400-as vagy 500-as hibakóddal válaszol, a rendszer értelmezhető magyar nyelvű `Toast` (felugró értesítés) üzenetet jelenít meg (pl. "Hibás jelszó!", vagy "Szerverhiba történt, próbálja újra később").
- **Kliens oldali validáció:** A formok beküldése előtt JavaScript validáció fut (pl. kötelező mezők, jelszó komplexitás), így megelőzve a felesleges hálózati forgalmat és a backend terhelését.

### 1.4 Algoritmikus Hibakezelés (Timeout és Fallback)
A műszakbeosztás generálása (NP-nehéz probléma) esetén a Backtracking algoritmus végtelen ciklusának elkerülésére:
- **CancellationToken:** Bevezettünk egy 30 másodperces időtúllépést (Timeout).
- **Fallback (Mohó algoritmus):** Ha a rendszer nem talál tökéletes megoldást időre, az Exception elkapása után automatikusan átvált egy heurisztikus Mohó (Greedy) algoritmusra, így a felhasználó mindenképpen kap egy "Tervezet (Hiányos)" beosztást, ahelyett hogy a kérés "Időtúllépés" hibával elszállna.

---

## 2. Teljesítményoptimalizálás (Performance)

Az alkalmazás gyorsasága kritikus tényező a felhasználói élmény szempontjából. Ennek érdekében a következő technológiákat alkalmaztuk:

### 2.1 Firestore NoSQL Optimalizáció
- **Kliens-oldali Indexelés:** Az adatbázis lekérdezések (pl. egy adott dolgozó elérhetőségeinek lekérése) indexelt mezők alapján történnek (`dolgozoId`), ami megakadályozza a teljes adatbázis beolvasását (Full Table Scan).
- **Aszinkron műveletek:** Minden adatbázis hívás (I/O művelet) aszinkron (`async/await`) módon fut, így a szerver thread-poolja nincs leblokkolva, sokkal több egyidejű kérést tud kiszolgálni.

### 2.2 Response Compression Middleware
- **Sávszélesség csökkentése:** A backend egy beépített tömörítési middleware-t használ, amely a hálózaton utazó JSON válaszokat (különösen a nagy, több heti elérhetőséget vagy beosztást tartalmazó listákat) GZIP / Brotli algoritmussal tömöríti.
- **Hatás:** Gyorsabb letöltési idő, alacsonyabb hálózati terhelés.

### 2.3 JWT és Refresh Token Optimalizálás
- **Állapotmentes hitelesítés:** A szerver memóriája nem terhelődik a Session adatok tárolásával. A JWT token minden szükséges jogosultsági (RBAC) információt tartalmaz.
- **Optimalizált életciklus:** A gyors és biztonságos ellenőrzés miatt a JWT csak 15 percig érvényes, amit a kliens csendben (a háttérben) megújít a 7 napos Refresh Token használatával, elkerülve a felesleges és lassú adatbázis-ellenőrzéseket minden egyes HTTP kérésnél.

### 2.4 Frontend Optimalizálás
- **React Vite Bundler:** A Vite használatával a fejlesztési környezet (HMR) és az élesített (production) kód is drasztikusan gyorsabb és kisebb méretű, mint a korábbi Webpack alapú megoldásoknál.
- **Független komponensek:** A DOM fa csak ott frissül (re-render), ahol az adatok valóban megváltoztak, így az interaktív felületek (mint a naptár-szerkesztő) azonnal reagálnak.
