# 🗓️ Intelligens Munkaerő Beosztás Tervező (Smart Shift Scheduler)

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

> **Projekt Típusa:** Full-Stack Webalkalmazás & Algoritmikus Problémamegoldás
> **Fejlesztési Módszertan:** Agilis Scrum (8 Sprint)
> **Fókusz:** NP-nehéz optimalizáció, Vállalati szintű biztonság, Modern UI/UX

## 📖 A Projektről Röviden
A *Smart Shift Scheduler* egy komplex webalkalmazás, amely megoldást nyújt a kis- és középvállalkozások munkaerő-beosztási nehézségeire. A projekt nem csak egy hagyományos CRUD alkalmazás: a szívét egy **Constraint Satisfaction Problem (CSP)** alapú, visszalépéses (backtracking) algoritmus adja, amely automatikusan, emberi beavatkozás nélkül generál konfliktusmentes, a törvényi pihenőidőket és heti órakereteket tiszteletben tartó, kiegyensúlyozott munkabeosztást.

## 🚀 Főbb Funkciók és Üzleti Érték
- **Automatizált NP-Nehéz Ütemezés:** Az alkalmazás képes a dolgozói preferenciák (elérhetőség) és a műszaki követelmények metszetében optimális beosztást generálni, másodpercek alatt. Heurisztikák segítségével (Value Ordering) elkerüli az exponenciális futásidőt.
- **Szerepkör-alapú Hozzáférés Vezérlés (RBAC):** Szigorú JWT alapú hitelesítés védi az adatokat. A *HR Adminok* generálhatnak és módosíthatnak beosztásokat, míg a *Dolgozók* csak saját adataikat és naptárukat láthatják.
- **Iparági Biztonság (BCrypt):** Minden jelszó erős `BCrypt.Net-Next` sózott hasheléssel van védve a Firebase adatbázisban.
- **Adat Exportálás:** A véglegesített beosztásokat a HR egy kattintással letöltheti **CSV (Excel)** formátumban, míg a dolgozók egy **iCal (.ics)** fájl segítségével szinkronizálhatják azt a Google/Apple naptárukba.
- **Modern "Premium" UI:** React 19 alapú, "Glassmorphism" dizájnt követő, teljesen reszponzív felület, amely zökkenőmentes felhasználói élményt nyújt asztali és mobil környezetben is.

## 🏗️ Technológiai Stack és Architektúra

### Backend (.NET 8 Web API)
- A backend egy robusztus, háromrétegű architekturális mintát (Controller -> Service -> Data) követ, Dependency Injection (DI) használatával.
- **Adatbázis:** Firebase Firestore (NoSQL) használata Google Cloud RPC protokollon keresztül a gyors és rugalmas adatszerkezet miatt.
- **Hibakezelés:** Globális `ExceptionHandler Middleware`, amely elkapja az összes futásidejű hibát, és szabványos RFC 7807 `ProblemDetails` választ ad a kliensnek.
- **Biztonság:** Egyedi JWT token generálás, validálás middleware szinten, valamint BCrypt hashelés.

### Frontend (React + Vite)
- Tab-alapú (SPA) navigáció.
- **State Management:** React Context API (`AuthContext`) biztosítja a globális hitelesítési állapot (Token, User Info) menedzselését.
- Hálózati réteg (Service Layer) absztrakció izolálja a `fetch` hívásokat a UI komponensektől.

### DevOps & Tesztelés
- **Dockerizáció:** A teljes alkalmazás mikroszolgáltatásként futtatható egyetlen `docker-compose up` paranccsal (külön konténer a backendnek és a frontendnek).
- **TDD és xUnit:** A projekt `xUnit` alapú egységtesztekkel (Unit Tests) és integrációs tesztekkel rendelkezik. A Service logika tesztelhetősége érdekében a Firestore hívásokat is sikerült absztrahálni.

## 💡 Legnagyobb Szakmai Kihívások és Megoldásuk
1. **Az Ütemezés NP-Nehéz Jellege:** Ahogy nőtt a dolgozók száma, az egyszerű Brute Force algoritmus leállt. *Megoldás:* Egy optimalizált Backtracking (CSP) algoritmust írtam, amit kiegészítettem egy "Least Utilized Worker" (legkevésbé beosztott dolgozó) heurisztikával. Ez nemcsak exponenciálisan gyorsította a futást, de garantálta a fair munkaelosztást is.
2. **Aszinkron Állapotkezelés a Reactban:** A tokenek lejárati idejének és a jogosultságok azonnali UI-frissülésének kezelése. *Megoldás:* Globális `AuthContext` használata `localStorage` szinkronizációval és feltételes rendereléssel.
3. **NoSQL Adatmodellezés:** Relációs struktúrák (pl. dolgozó -> műszak kapcsolat) leképezése Firestore-ba. *Megoldás:* A `BeosztasReszlet` dokumentumok denormalizációjával optimalizáltam a naptár-nézet betöltési idejét.

## 🏁 Összegzés
A projekt kiválóan demonstrálja, hogyan lehet egy elméleti számítástudományi problémát (CSP beosztás) egy modern, felhő-natív, felhasználóbarát webalkalmazásba csomagolni. A fejlesztés során a Clean Code és az Agilis alapelvek betartása garantálta a fenntartható kódminőséget.
