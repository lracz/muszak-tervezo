# Tesztelési Stratégia

A Projekt Labor 2 keretében fejlesztett Műszak Tervező szoftver minőségbiztosításához az alábbi tesztelési stratégiát alkalmazzuk, követve az V-modell és az Agilis fejlesztés minőségi irányelveit.

## 1. Egységtesztek (Unit Tests)

Az egységtesztek célja az üzleti logika izolált vizsgálata, hálózati és adatbázis hívások nélkül. A teszteket a Sprint 5 során valósítottuk meg.

**Technológia:** xUnit keretrendszer, .NET 8 környezetben, Moq (mocking framework)

### Implementált Tesztesetek (`MuszakBeosztasAPI.Tests` projekt)

#### 1. Modell és Validáció (`DolgozoTeszt.cs`)
- **Tulajdonság ellenőrzések:** Biztosítjuk, hogy az entitások (pl. `Dolgozo`) alapértelmezett értékei és validációs logikája helyes.
- **Részmunkaidő validálás (`[Theory]` és `[InlineData]` használatával):** Ellenőrizzük, hogy ha valaki részmunkaidős, akkor a `MaxHetiOra` tulajdonsága ténylegesen kisebb-e mint 40 óra.
- *Eredmény:* 3/3 teszt sikeres. A modellek állapotai konzisztensek.

#### 2. Algoritmus Tesztelés (`BeosztasAlgoritmusTeszt.cs`)
- **Greedy Stratégia izolált tesztelése:** A FirestoreDb mockolásának elkerülése végett a beosztás-generáló tiszta függvényeket in-memory adatokkal (listákkal) teszteljük.
- **Tesztek listája:**
  - `Algoritmus_NincsElerhetoDolgozo_NemSorsol`: Validálja, hogy ha egy dolgozó a megadott napon nem érhető el (`Elerheto = false`), akkor az algoritmus biztosan kihagyja őt.
  - `Algoritmus_TobbElerhetoDolgozo_AzonosEredmeny`: Ha több elérhető dolgozó van, mint ahány szükséges, a kívánt (`SzuksegesLetszam`) számú dolgozó kerül csak kiválasztásra, méghozzá a korábbi óraszámokat/prioritásokat figyelembe véve.
  - `Beosztas_AllapotValtozas_KezdetiTervezet`: Biztosítja, hogy az újonnan legenerált beosztások státusza alapértelmezetten "Tervezet" lesz.
- *Eredmény:* 3/3 teszt sikeres. A core üzleti logika a Firestore nélkül is robusztus.

---

## 2. Integrációs Tesztek

Az integrációs tesztek célja a rendszer különböző rétegeinek (Controller -> Service -> Firestore) együttes működésének ellenőrzése.

**Eszközök:** Postman, Swagger UI
- Beépített `GlobalExceptionHandler.cs` middleware tesztelése hibás formátumú API lekérésekkel (JSON validation).
- Végpontok tesztelése éles Firebase tesztadatbázissal (CRUD tesztek API hívásokon keresztül).

---

## 3. Rendszer- és Felhasználói Elfogadási Tesztek (UAT)

A projekt átadásakor vizuális és funkcionális manuális tesztelésen esett át a rendszer.

**Tesztelési forgatókönyvek (Frontend - React):**
1. **Dolgozó Kezelés:** Új dolgozó rögzítése, megjelenik-e a listában azonnal.
2. **Műszak Adminisztráció:** Különböző (reggeli, délutáni) műszakok létrehozása és színek szerinti megjelenésük az UI-on.
3. **Elérhetőség:** Dolgozó elérhetetlenné tétele adott napra, és annak ellenőrzése, hogy az ütemező algoritmus nem osztja be.
4. **Beosztás Generálás:** Heti nézet (Grid) betöltése, automatikus generálás indítása, majd az eredmény vizuális validálása és véglegesítése.

A felhasználói felület reszponzivitása is ellenőrzésre került (mobilnézet és asztali monitorok támogatása CSS Flex/Grid segítségével).
