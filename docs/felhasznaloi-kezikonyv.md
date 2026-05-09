# Felhasználói Kézikönyv – Intelligens Munkaerő Beosztás Tervező

Ez a dokumentum bemutatja, hogyan kell használni az alkalmazást a különböző szerepkörök (Dolgozó és HR/Admin) szerint.

---

## 1. Belépés és Regisztráció

A rendszer zárt, használatához felhasználói fiók szükséges.

### 1.1 Regisztráció
1. Nyissa meg a webes felületet (`http://localhost:5173` vagy az élesített URL).
2. A bejelentkezési ablak alján kattintson a **"Nincs még fiókod? Kattints ide a regisztrációhoz"** szövegre.
3. Töltse ki az űrlapot:
   - **Név:** Teljes név megadása.
   - **E-mail:** Kapcsolattartási cím.
   - **Jelszó:** Minimum 8 karakter, tartalmaznia kell kisbetűt, nagybetűt és számot.
   - **Pozíció / Szerepkör:** Rendszer adminisztrátor vagy normál dolgozó (tesztelési fázisban szabadon választható).
4. Kattintson a **"Regisztráció"** gombra. Sikeres regisztráció után a rendszer azonnal belépteti.

### 1.2 Bejelentkezés
- A bejelentkezési képernyőn adja meg a nevét, e-mail címét vagy azonosítóját, valamint a jelszavát.
- Biztonsági okokból (Brute-force védelem) percenként legfeljebb 5 hibás próbálkozás engedélyezett.

---

## 2. Dolgozói Funkciók (Minden felhasználó)

Normál dolgozóként a saját munkaidejét és elérhetőségeit tudja menedzselni.

### 2.1 Elérhetőség megadása
Az algoritmus az itt megadott információk alapján osztja be Önt.
1. Navigáljon az **"Elérhetőség"** fülre.
2. Válasszon ki egy adott napot vagy hetet a naptárból.
3. Jelölje be, hogy az adott napon elérhető-e vagy sem.
4. Ha nem elérhető, adjon meg egy indoklást (pl. "Egyetemi vizsga").

### 2.2 Szabadság igénylése
1. Navigáljon a **"Szabadságok"** fülre.
2. Itt láthatja a kiírt éves szabadságkeretét és a még felhasználható napok számát.
3. Adja meg a kezdő és végdátumot, majd küldje be a kérelmet.
4. A kérelem "Függőben" státuszba kerül, amíg a HR jóvá nem hagyja. (A jóváhagyott napokra az algoritmus automatikusan nem fogja beosztani).

### 2.3 Műszakcsere (Swap)
Ha egy kiírt beosztás mégsem jó, cserét kezdeményezhet egy kollégával.
1. Navigáljon a **"Műszakcsere"** fülre.
2. Válassza ki a saját műszakját, amit le szeretne adni.
3. Válassza ki a cél-dolgozót és a felajánlott / kért műszakot.
4. A csere a HR engedélyezése után válik véglegessé a naptárban.

### 2.4 Beosztás és Naptár Export
- A **"Beosztás"** fülön láthatja az egész heti ütemtervet.
- A **"Személyes iCal Export" (📅)** gombbal lementheti a saját műszakjait, amelyet importálhat Google Naptárba, Apple Naptárba vagy Outlookba.

---

## 3. HR és Adminisztrátori Funkciók

A HR jogosultsággal rendelkező felhasználók (adminok) hozzáférnek a teljes tervezési folyamathoz.

### 3.1 Dolgozók kezelése
1. A **"Dolgozók"** fülön listázhatja a cég alkalmazottait.
2. Új dolgozókat adhat hozzá (ha ők nem regisztrálnak maguknak), illetve módosíthatja a meglévők paramétereit:
   - **Maximális heti óraszám:** Az algoritmus nem enged ennél többet dolgozni.
   - **Preferált napszak:** Ha a dolgozó csak reggel tud jönni, itt állítható be.
   - **Órabér:** A bérköltség-kalkulátor alapja.

### 3.2 Műszakok felvitele
1. A **"Műszakok"** fülön definiálhatja a heti sémákat.
2. Adja meg a műszak nevét (pl. "Reggeli kiszolgálás"), a kezdés és befejezés idejét.
3. Fontos: Állítsa be a **Szükséges létszámot** (hány ember kell abba a műszakba).
4. Válassza ki, hogy a hét melyik napjára vonatkozik (pl. Hétfő).

### 3.3 Beosztás Generálása (Az Algoritmus futtatása)
1. Lépjen a **"Beosztás"** fülre.
2. A felső sávban a nyilakkal válassza ki a cél-hetet (pl. 2026-W15).
3. Kattintson az **"AI Generálás" (📢)** gombra.
4. A rendszer másodperceken belül lefut (Backtracking algoritmus), és legenerálja a heti beosztást, figyelembe véve a szabadságokat és elérhetőségeket.
5. A bal oldali "Kapacitás Panelon" láthatja a várható **Bérköltséget (Ft)** és a **Lefedettséget (%)**.

### 3.4 Manuális módosítás és Véglegesítés
1. Ha a gép által generált beosztáson (Tervezet) módosítani szeretne, a "Fogd és vidd" (Drag-and-Drop) módszerrel áthúzhat dolgozókat az egyik műszakból a másikba.
2. Ha az elrendezés megfelelő, kattintson a **"Publikálás" (Véglegesítés)** gombra.
3. Véglegesítés után a dolgozók számára is láthatóvá válik a beosztás.
4. Kimentheti az egészet Excel formátumban a **"CSV Export"** gombbal bérszámfejtéshez.

### 3.5 Szabadságok és Cserék elbírálása
- A dedikált HR füleken láthatja a dolgozók által beküldött kérelmeket.
- Két gomb áll rendelkezésre: **Jóváhagyás** vagy **Elutasítás**.
- Jóváhagyás esetén az adatbázis és a naptár automatikusan frissül.
