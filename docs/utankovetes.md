# Utánkövetés és Felhasználói Visszajelzések

A szoftverfejlesztés iteratív (Agilis) jellege miatt a projekt élesítésével (Deployment) a munka nem ér véget. A szoftver folyamatos javítása és bővítése a felhasználóktól érkező visszajelzések alapján történik.

## 1. Visszajelzések Gyűjtése

A projekt tesztidőszakában (Béta fázis) és a mindennapi használat során a visszajelzések begyűjtése az alábbi csatornákon történik:

1. **GitHub Issues (Hibajegyek):** A fejlesztői és tesztelői csapat a GitHub integrált "Issues" menüpontját használja. Itt lehetőség van kategóriák (Bug, Feature Request, Enhancement) szerinti bontásra.
2. **Közvetlen Felhasználói Interjúk (HR és Dolgozók):** A szoftvert elsőként tesztelő HR menedzserekkel heti rendszerességgel rövid (15 perces) interjúkat készítünk, hogy felmérjük a UI/UX élményt.
3. **Beépített Analitika és Hibanaplózás:** A rendszer szerveroldalon (Backend) rögzíti a kritikus hibákat (500 Internal Server Error) és az esetleges algoritmus-fagyásokat, melyeket a fejlesztők proaktívan tudnak orvosolni anélkül is, hogy a felhasználó hivatalos hibajegyet nyitna.

## 2. A Visszajelzések Feldolgozása (Triage Process)

A beérkező hibajegyeket és kéréseket a Scrum metodológia szerint a **Product Owner** (esetünkben a vezető fejlesztő) az alábbiak szerint kategorizálja és priorizálja:

| Prioritás | Reakcióidő | Példa eset |
|-----------|------------|------------|
| **P0 (Kritikus)** | 24 órán belül | Az ütemező algoritmus összeomlik, a felhasználók nem tudnak belépni, adatvesztés. |
| **P1 (Magas)** | Következő Sprint | Hibás heti óraszám számítás, a felület bizonyos része (pl. Naptár) nehezen olvasható mobilon. |
| **P2 (Közepes)** | Backlogba kerül | Új UI téma (Dark/Light mode automatizálása), apróbb gépelési elírások. |
| **P3 (Alacsony)** | Jövőbeli tervek | Prediktív AI bevezetése, egyedi riporting táblázatok generálása. |

## 3. Utánkövetés (Follow-up) és Javítás (Patching)

Miután egy hiba kijavításra, vagy egy új funkció lefejlesztésre került:

1. **Javítás Integrálása (Pull Request):** A kódot a `main` ágba integráljuk szigorú Code Review után.
2. **Telepítés (Deployment):** A CI/CD folyamatok (pl. Render, Docker) segítségével az új verziót azonnal élesítjük.
3. **Kommunikáció:** A hibát bejelentő felhasználót értesítjük a javítás tényéről (pl. GitHub Issue lezárásával).
4. **Validáció:** Egy héttel a javítás bevezetése után ellenőrizzük, hogy a hiba újra jelentkezett-e, illetve az új funkció beváltotta-e a hozzá fűzött reményeket.

## 4. Jelenleg Feldolgozás Alatt Lévő Visszajelzések (Példák az elmúlt sprintekből)

* **Visszajelzés:** *"Világos módban nehezen látszanak a lapozó nyilak a naptárnál."*
  * **Javítás:** CSS változók (Glassmorphism border és ikon színek) optimalizálása világos/sötét mód alapján. (Kész)
* **Visszajelzés:** *"A Backtracker sokszor végtelen ciklusba kerül, ha túl szigorúak a feltételek."*
  * **Javítás:** 30 másodperces Timeout bevezetése, valamint egy Mohó (Greedy) algoritmusos "Fallback" vészhelyzeti megoldás implementálása, ami hiányosan ugyan, de lezárja a beosztást fagyás helyett. (Kész)
* **Visszajelzés:** *"A dolgozók nem veszik észre, ha a HR módosítja a beosztást."*
  * **Tervezett javítás:** Valós idejű értesítések bevezetése SignalR használatával. (P3 - Backlog)
