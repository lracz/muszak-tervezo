# Munkanapló – Projekt Labor 2

## Projekt: Intelligens Munkaerő Beosztás Tervező
## Módszertan: Agilis Scrum (1 sprint = 1 hét)

---

## Sprint 1 – Projekt alapok és Dolgozó CRUD

**Cél:** Projekt infrastruktúra felállítása, alapvető dolgozó kezelés implementálása

| # | Feladat | Státusz |
|---|---|---|
| 1.1 | Projekt struktúra kialakítása (C# Web API + React) | ✅ |
| 1.2 | Firebase Firestore kapcsolat beállítása | ✅ |
| 1.3 | Dolgozó adatmodell létrehozása | ✅ |
| 1.4 | CRUD műveletek (Service réteg) | ✅ |
| 1.5 | REST API végpontok | ✅ |
| 1.6 | React frontend – űrlap és lista | ✅ |
| 1.7 | CORS + Swagger konfiguráció | ✅ |
| 1.8 | Start script (`start.bat`) | ✅ |

**Sprint Review:** Teljes Dolgozó CRUD működik (backend + frontend).
**Retrospective:** Gyors prototípus, de input validáció hiányos.

---

## Sprint 2 – Műszakok és Elérhetőség

**Cél:** Műszak típusok és dolgozói elérhetőségek kezelése

| # | Feladat | Státusz |
|---|---|---|
| 2.1 | Muszak modell + service + controller | ✅ |
| 2.2 | Elerhetoseg modell + service + controller | ✅ |
| 2.3 | Frontend – Műszak kezelés komponensek | ✅ |
| 2.4 | Frontend – Elérhetőség kezelés | ✅ |
| 2.5 | Tab-alapú navigáció | ✅ |
| 2.6 | Program.cs DI frissítés | ✅ |

**Sprint Review:** Műszak és elérhetőség CRUD teljesen működőképes. C#-ban a FirestoreDb-n keresztül végzünk aszinkron adatmódosításokat.
**Retrospective:** A Frontend-en bevezetett React fetch service-ek jól izolálják az API hívásokat a UI-tól.

---

## Sprint 3 – Ütemezési Algoritmus

**Cél:** Automatikus beosztás generáló algoritmus

| # | Feladat | Státusz |
|---|---|---|
| 3.1 | Beosztas + BeosztasReszlet modellek | ✅ |
| 3.2 | Greedy ütemezési algoritmus | ✅ |
| 3.3 | BeosztasService + Controller | ✅ |
| 3.4 | Frontend beosztás service | ✅ |

**Sprint Review:** Az algoritmus elérhetőség alapján generál beosztást. A `BeosztasService` sikeresen párosítja a heti műszakokat az elérhető dolgozókkal egy Greedy stratégia mentén.
**Retrospective:** A beosztás algoritmus továbbfejleszthető lenne pl. havi munkaidőkeret és speciális kompetenciák figyelembevételével, de a laborhoz elegendő ez a baseline.

---

## Sprint 4 – Beosztás Megjelenítés

**Cél:** Heti beosztás vizuális megjelenítése

| # | Feladat | Státusz |
|---|---|---|
| 4.1 | BeosztasNezet – heti naptár grid | ✅ |
| 4.2 | HetValaszto – hét navigáció | ✅ |
| 4.3 | Műszak színkódolás | ✅ |
| 4.4 | Premium UI redesign | ✅ |

**Sprint Review:** Az alkalmazás egy modern "Premium" stílust kapott (glassmorphism, animációk, tabulátoros navigáció). A naptárnézet tökéletesen illusztrálja a heti algoritmus kimenetét.
**Retrospective:** CSS flexbox/grid intenzív használata nagymértékben növelte az UI reszponzivitását mobil képernyőkön is.

---

## Sprint 5 – Tesztelés és Hibakezelés

**Cél:** Tesztek, hibakezelés, teljesítmény

| # | Feladat | Státusz |
|---|---|---|
| 5.1 | xUnit teszt projekt | ✅ |
| 5.2 | Egységtesztek (Service + Algoritmus) | ✅ |
| 5.3 | Integrációs tesztek | ✅ |
| 5.4 | GlobalExceptionHandler middleware | ✅ |
| 5.5 | Pagination + Response Compression | ✅ |

**Sprint Review:** XUnit alapú tesztek validálják a `Dolgozo` modelljeinket és a `BeosztasAlgoritmus` mockolt verzióját. A `GlobalExceptionHandler` middleware megakadályozza a szerver crash-eket és szabványos 500-as JSON válaszokat ad.
**Retrospective:** A FirestoreDb mockolása az algoritmustesztekhez problémás, emiatt izolált pure function-öket kellett tesztelni adatok in-memory átadásával.

---

## Sprint 6 – Autentikáció és Véglegesítés

**Cél:** Firebase Auth + dokumentáció lezárás

| # | Feladat | Státusz |
|---|---|---|
| 6.1 | Dokumentáció véglegesítése (README) | ✅ |
| 6.2 | Tesztelési stratégia frissítése | ✅ |
| 6.3 | Utánkövetési terv / Architektúra | ✅ |
| 6.4 | Deployment előkészületek | ✅ |

**Sprint Review:** A Projekt Labor 2 kiírásához igazítva teljesen véglegesítettük a repót: README integrálása a Sprintekkel, tesztek és algoritmus leírása. A szoftver fejlesztési ciklus (SDLC) minden lépését kipipáltuk.
**Retrospective:** Egy nagyon sikeres, full-stack agilis fejlesztésen vagyunk túl. A backend és frontend robusztusan tud kommunikálni.

---

## Sprint 7 – Haladó Funkciók: NP-algoritmus & Docker & Cloud (Extra)

**Cél:** A műszakbeosztás professzionális, CSP alapú megoldása, konténerizáció és felhős telepítési tervek.
**Időtartam:** [2026. Május eleje]

| # | Feladat | Státusz |
|---|---|---|
| 7.1 | NP-nehéz algoritmus (Backtracking/CSP) implementálása | ✅ |
| 7.2 | Heurisztika hozzáadása (Kiegyensúlyozott terhelés) | ✅ |
| 7.3 | Backend és Frontend `Dockerfile` | ✅ |
| 7.4 | Orchestráció (`docker-compose.yml`) | ✅ |
| 7.5 | Algoritmus (`np-algoritmus.md`) dokumentálása | ✅ |
| 7.6 | Deployment útmutató (`docker-cloud-deployment.md`) | ✅ |
| 7.7 | Haladó xUnit tesztek írása (Constraint validálás) | ✅ |

**Sprint Review:** Kicseréltük az egyszerű greedy beosztó algoritmust egy Backtracking Constraint Satisfaction Problem (CSP) solverre. Hard constrainteket adtunk meg (kötelező pihenőidők, túlóra limit). A rendszert teljesen felkészítettük a mikroszolgáltatás alapú lokális tesztelésre Dockerrel.
**Retrospective:** A probléma NP-nehézsége miatti exponenciális futási időt egy remek "Value Ordering" heurisztikával csökkentettük, ami ráadásul igazságos munkaelosztást is eredményezett.

---

## Sprint 8 – Autentikáció és Exportálás (Extra 2)

**Cél:** A szoftver vállalati szintre emelése JWT alapú hitelesítéssel és naptár/táblázat export funkciókkal.
**Időtartam:** [2026. Május eleje]

| # | Feladat | Státusz |
|---|---|---|
| 8.1 | Dolgozó modell bővítése (`JelszoHash`, `Szerepkör`) | ✅ |
| 8.2 | JWT generáló `AuthController` létrehozása | ✅ |
| 8.3 | API Végpontok levédése (Admin / HR) | ✅ |
| 8.4 | React `Login` oldal elkészítése és Session kezelés (`AuthContext`) | ✅ |
| 8.5 | CSV Export generátor írása | ✅ |
| 8.6 | iCal (`.ics`) telefonos szinkronizáció írása | ✅ |
| 8.7 | Iparági BCrypt jelszó-hashelés bevezetése és Regisztrációs felület | ✅ |

**Sprint Review:** Sikeresen integráltuk a JWT (JSON Web Token) alapú bejelentkezési rendszert. A HR-esek és a normál dolgozók szét lettek választva. A beosztásokat immáron be lehet importálni személyes naptárakba (iCal), a HR pedig le tudja húzni CSV/Excel formátumba!
**Retrospective:** Zseniális bónusz sprint, a munkaerőbeosztó így már teljesen piacképes szoftvernek minősül.

---

## Sprint 9 – Vállalati Biztonság (Enterprise Security)

**Cél:** Az alkalmazás felkészítése éles (production) környezetre haladó biztonsági mechanizmusokkal.
**Időtartam:** [2026. Május eleje]

| # | Feladat | Státusz |
|---|---|---|
| 9.1 | IP-alapú Rate Limiter beépítése (Brute-Force védelem) | ✅ |
| 9.2 | Szigorú jelszó komplexitás validálása (Regex) | ✅ |
| 9.3 | JWT élettartam csökkentése (15 perc) | ✅ |
| 9.4 | Kriptográfiai Refresh Tokenek generálása és tárolása Firestore-ban | ✅ |
| 9.5 | `POST /api/auth/refresh` API végpont létrehozása | ✅ |
| 9.6 | React `AuthContext` átírása az Access Token automatikus háttérbeli megújítására | ✅ |
| 9.7 | HSTS és HTTPS Redirection bekapcsolása Production környezetben | ✅ |

**Sprint Review:** Az alkalmazás hitelesítése immáron vállalati szintű. A Token-ek lopásának kockázata minimális a 15 perces lejárattal, a Rate Limiting pedig véd az esetleges bot támadások ellen. A React kliens transzparensen újítja meg a tokeneket, így a UX továbbra is kiváló.
**Retrospective:** A .NET 8 beépített Rate Limiter-e rendkívül gyorsan bevezethetővé tette ezt az iparági védelmet.

---

## Sprint 10 – Zero-Trust Networking (Élesítés)

**Cél:** Az alkalmazás biztonságos kihelyezése a nyílt internetre port nyitás nélkül.

| # | Feladat | Státusz |
|---|---|---|
| 10.1 | Cloudflare Tunnel daemon (cloudflared) beállítása | ✅ |
| 10.2 | Zero-Trust házirend kialakítása | ✅ |

**Sprint Review:** A rendszer a Cloudflare hálózatán keresztül lett publikálva, így a szerver rejtve marad az internet elől (DDoS védelem, SSL biztosítva).

---

## Sprint 11 – Algoritmus Fagyás Védelem és Munkakörök

**Cél:** Az NP-nehéz probléma (szerver kifagyás) végleges megoldása és szigorú "Munkakör" alapú ütemezés bevezetése.

| # | Feladat | Státusz |
|---|---|---|
| 11.1 | `CancellationToken` bevezetése az algoritmusba (5 másodperces Timeout) | ✅ |
| 11.2 | Mohó (Greedy) vészhelyzeti Fallback megírása részleges eredmény kiadására | ✅ |
| 11.3 | Állapotkövetés UI-on: "Tervezet (Tökéletes)" vs "Tervezet (Hiányos / Greedy)" | ✅ |
| 11.4 | Hard Constraint (6-os szabály): A műszak "Pozíciója" és a dolgozó "Pozíciója" egyezni kell | ✅ |
| 11.5 | Jolly Joker (Vegyes) munkakörök és műszakok globális kezelése | ✅ |

**Sprint Review:** A rendszer most már ipari sztenderdek szerint működik. Lehetetlen peremfeltételek (pl. túl kevés ember) esetén is ad részleges, használható eredményt ahelyett, hogy végtelen ciklusba fagyna!

---

## Sprint 12 – Interaktív UI és Dolgozói Felület

**Cél:** A generált beosztások emberi felülbírálatának biztosítása, illetve a normál dolgozók "Szabadságigénylő" felületének kidolgozása.

| # | Feladat | Státusz |
|---|---|---|
| 12.1 | `@hello-pangea/dnd` beépítése a React Frontendbe | ✅ |
| 12.2 | Beosztásnézet refaktorálása: Húzd-és-Ejtsd (Drag & Drop) "Puzzle" szerkesztő | ✅ |
| 12.3 | `PUT /api/beosztas/{id}/modosit` végpont (Módosítás mentése az adatbázisba) | ✅ |
| 12.4 | Szerepkör alapú UI korlátozás bevezetése a Szabadságigénylőnél | ✅ |
| 12.5 | Éves Szabadság Keret indikátor beépítése a normál dolgozóknak | ✅ |

**Sprint Review:** Hatalmas UX (User Experience) mérföldkő. A HR most már szabadon mozgathatja a dolgozókat a műszakok között (Override). A dolgozók egy dedikált felületen jelezhetik, hogy mikor nem érnek rá, ami automatikusan vizuálisan követi a felhasználható (éves) szabadnapok számát.
**Retrospective:** Ezzel a lépéssel a projekt egy komplett, funkciókban gazdag, termelésre érett szoftverré nőtte ki magát.
