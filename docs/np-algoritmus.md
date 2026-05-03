# Ütemezési Algoritmus (NP-Teljes Probléma Megoldás)

A Műszak Tervező szoftverünkben az eredeti, egyszerű (Greedy) elosztási mechanizmust lecseréltük egy **Constraint Satisfaction Problem (CSP)** alapú **Visszalépéses (Backtracking)** algoritmusra. 

Ez az algoritmus szorosan kötődik az informatikában ismert *Nurse Scheduling Problem*-hez, amely egy bizonyítottan **NP-nehéz (NP-hard)** probléma.

## Miért NP-Nehéz?

Tegyük fel, hogy van $N$ darab dolgozónk és $S$ darab műszak "helyünk" (slotunk) a héten. 
Minden helyre ki kell választanunk pontosan 1 embert. 
A lehetséges beosztások (kombinációk) száma bruteforce esetén durván $O(N^S)$. Ha mondjuk 10 dolgozó van és egy héten 21 helyet kell betölteni, ez $10^{21}$ kombinációt jelent, ami exponenciális növekedés, és polinom időben nem oldható meg.

## Implementált Algoritmus: Backtracking + Heurisztika

A `BeosztasService.cs` osztályban található `MegoldasKeresese` egy rekurzív mélységi keresést (DFS) hajt végre a döntési fában.

### Működés lépései:
1. **Slotok (Helyek) generálása:** Kibontjuk a héten lévő összes műszakot annyi üres "helyre", ahány fő (`SzuksegesLetszam`) szükséges hozzájuk.
2. **Keresés (Assign):** A rekurzív függvény megpróbál beilleszteni egy embert a jelenlegi üres helyre.
3. **Korlát ellenőrzés (Pruning):** Mielőtt beillesztené, leellenőrzi a **Hard Constraint**-eket:
   - Elérhető-e a dolgozó aznap?
   - Dolgozik-e már ebben a műszakban?
   - Dolgozik-e már aznap (napi 1 műszak engedélyezett)?
   - Túllépi-e a heti maximum munkaóráját?
   - **Pihenőidő:** Ha tegnap Éjszakai műszakban volt, ma nem vihet Reggelit.
4. **Visszalépés (Backtrack):** Ha a kényszerek miatt nem megy, próbálkozik a következő dolgozóval. Ha senkivel sem megy, **visszalép** a fában az előző állapotra (kitörli az előző hozzárendelést) és ott próbál más utat.

### Optimalizáció (Value Ordering Heuristic)

Hogy ne töltsön az algoritmus éveket a felesleges ágak bejárásával, egy heurisztikával irányítjuk a keresést:
*Ahelyett, hogy véletlenszerűen próbálnánk beosztani a dolgozókat, **mindig azokat vesszük előre (OrderBy), akiknek a legkevesebb ledolgozott órája van az adott héten**.* 

Ezzel nemcsak drasztikusan csökkentjük a futási időt (hamarabb találunk érvényes ágat), hanem biztosítjuk a **kiegyensúlyozott terhelést** is a munkatársak között!
