using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class BeosztasService
    {
        private readonly FirestoreDb _db;
        private readonly DolgozoService _dolgozoService;
        private readonly MuszakService _muszakService;
        private readonly ElerhetosegService _elerhetosegService;

        public BeosztasService(FirestoreDb db, DolgozoService dolgozoService, MuszakService muszakService, ElerhetosegService elerhetosegService)
        {
            _db = db;
            _dolgozoService = dolgozoService;
            _muszakService = muszakService;
            _elerhetosegService = elerhetosegService;
        }

        // ==============================================================================
        // NP-TELJES PROBLÉMA MEGOLDÓ: BACKTRACKING KÉNYSZER-KIELÉGÍTÉSI (CSP) ALGORITMUS
        // ==============================================================================
        
        public async Task<Beosztas> BeosztasGeneralas(string het)
        {
            var dolgozok = await _dolgozoService.OsszesLekerese();
            var muszakok = await _muszakService.OsszesLekerese();
            var elerhetosegek = await _elerhetosegService.OsszesLekerese();

            var ujBeosztas = new Beosztas
            {
                Het = het,
                Letrehozva = Timestamp.GetCurrentTimestamp(),
                Allapot = "Tervezet",
                Reszletek = new List<BeosztasReszlet>()
            };

            // Minden napra a műszakok sorrendbe állítása
            var napok = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
            
            // Létrehozunk egy listát azokról a "helyekről" (slot-okról) amiket be kell tölteni.
            // Egy slot = (Műszak, Nap) egy ember számára
            var betoltendoSlotok = new List<(Muszak muszak, string nap)>();
            foreach (var nap in napok)
            {
                foreach (var muszak in muszakok.Where(m => m.Nap == nap))
                {
                    for (int i = 0; i < muszak.SzuksegesLetszam; i++)
                    {
                        betoltendoSlotok.Add((muszak, nap));
                    }
                }
            }

            var beosztasLista = new List<BeosztasReszlet>();
            var hetiOrakDolgozonkent = dolgozok.ToDictionary(d => d.Id, d => 0);

            // 30 másodperces Biztonsági fék (Timeout) – bőven elég egy éttermi heti beosztás megoldásához
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

            bool Sikerult = false;
            try 
            {
                // A Backtracking hívása
                Sikerult = MegoldasKeresese(0, betoltendoSlotok, dolgozok, elerhetosegek, hetiOrakDolgozonkent, beosztasLista, cts.Token);
            }
            catch (OperationCanceledException)
            {
                // A timeout megtörtént
                Sikerult = false;
            }

            if (Sikerult)
            {
                ujBeosztas.Reszletek = beosztasLista;
                ujBeosztas.Allapot = "Tervezet (Tökéletes)";
            }
            else
            {
                // Ha elhasal a tökéletes megoldás, átváltunk a Mohó (Greedy) Algoritmusra!
                var greedyLista = GreedyBeosztas(betoltendoSlotok, dolgozok, elerhetosegek);
                ujBeosztas.Reszletek = greedyLista;
                ujBeosztas.Allapot = "Tervezet (Hiányos / Greedy)";
            }

            // Mentés Firestore-ba
            var docRef = _db.Collection("beosztasok").Document();
            ujBeosztas.Id = docRef.Id;
            await docRef.SetAsync(ujBeosztas);

            return ujBeosztas;
        }

        // Visszalépéses (Backtracking) CSP Algoritmus
        private bool MegoldasKeresese(
            int slotIndex, 
            List<(Muszak muszak, string nap)> slotok, 
            List<Dolgozo> dolgozok, 
            List<Elerhetoseg> elerhetosegek, 
            Dictionary<string, int> hetiOrak, 
            List<BeosztasReszlet> jelenlegiBeosztas,
            CancellationToken cancellationToken)
        {
            // Kilépés, ha lejárt a beállított Timeout
            if (cancellationToken.IsCancellationRequested)
                return false;

            // Ha az összes slot be van töltve, megvan a megoldás!
            if (slotIndex >= slotok.Count)
                return true;

            var aktualisSlot = slotok[slotIndex];
            var aktualisMuszak = aktualisSlot.muszak;
            
            // Value Ordering Heurisztika: Preferencia egyezés alapján, majd heti órák szerint
            var rendezettDolgozok = dolgozok.OrderByDescending(d => 
                !string.IsNullOrEmpty(d.PreferaltNapszak) && aktualisMuszak.Megnevezes.Contains(d.PreferaltNapszak, StringComparison.OrdinalIgnoreCase) ? 1 : 0
            ).ThenBy(d => hetiOrak[d.Id]).ToList();

            foreach (var dolgozo in rendezettDolgozok)
            {
                if (ValidE(dolgozo, aktualisSlot.nap, aktualisMuszak, elerhetosegek, hetiOrak, jelenlegiBeosztas, slotok))
                {
                    // Lépés megtétele (Assign)
                    var ujReszlet = new BeosztasReszlet
                    {
                        DolgozoId = dolgozo.Id,
                        MuszakId = aktualisMuszak.Id,
                        Nap = aktualisSlot.nap
                    };
                    
                    jelenlegiBeosztas.Add(ujReszlet);
                    
                    // Számoljuk a műszak hosszát (kb 8 óra feltételezéssel, vagy pontos parsolással)
                    int muszakOrak = SzamolOrakat(aktualisMuszak.Kezdes, aktualisMuszak.Befejezes);
                    hetiOrak[dolgozo.Id] += muszakOrak;

                    // Rekurzív hívás a következő slotra
                    if (MegoldasKeresese(slotIndex + 1, slotok, dolgozok, elerhetosegek, hetiOrak, jelenlegiBeosztas, cancellationToken))
                    {
                        return true; // Találtunk végleges megoldást mélyebben
                    }

                    // Visszalépés (Backtrack) ha a mélyebb hívás nem vezetett megoldásra
                    jelenlegiBeosztas.Remove(ujReszlet);
                    hetiOrak[dolgozo.Id] -= muszakOrak;
                }
            }

            // Ha egyetlen dolgozóval sem lehet betölteni ezt a slotot a jelenlegi konfiguráció mellett, visszalépünk.
            return false;
        }

        // Mohó (Greedy) Algoritmus vészhelyzetre
        private List<BeosztasReszlet> GreedyBeosztas(
            List<(Muszak muszak, string nap)> slotok, 
            List<Dolgozo> dolgozok, 
            List<Elerhetoseg> elerhetosegek)
        {
            var beosztasLista = new List<BeosztasReszlet>();
            var hetiOrak = dolgozok.ToDictionary(d => d.Id, d => 0);

            foreach (var slot in slotok)
            {
                var aktualisMuszak = slot.muszak;
                
                // Preferencia egyezés alapján, majd heti órák szerint
                var rendezettDolgozok = dolgozok.OrderByDescending(d => 
                    !string.IsNullOrEmpty(d.PreferaltNapszak) && aktualisMuszak.Megnevezes.Contains(d.PreferaltNapszak, StringComparison.OrdinalIgnoreCase) ? 1 : 0
                ).ThenBy(d => hetiOrak[d.Id]).ToList();

                foreach (var dolgozo in rendezettDolgozok)
                {
                    if (ValidE(dolgozo, slot.nap, aktualisMuszak, elerhetosegek, hetiOrak, beosztasLista, slotok))
                    {
                        var ujReszlet = new BeosztasReszlet
                        {
                            DolgozoId = dolgozo.Id,
                            MuszakId = aktualisMuszak.Id,
                            Nap = slot.nap
                        };
                        
                        beosztasLista.Add(ujReszlet);
                        
                        int muszakOrak = SzamolOrakat(aktualisMuszak.Kezdes, aktualisMuszak.Befejezes);
                        hetiOrak[dolgozo.Id] += muszakOrak;
                        
                        break; // Csak egy embert osztunk be erre a konkrét slot "helyre", majd megyünk a következő slotra.
                    }
                }
            }

            return beosztasLista;
        }

        // Hard Constraints ellenőrzése
        private bool ValidE(Dolgozo dolgozo, string nap, Muszak muszak, List<Elerhetoseg> elerhetosegek, Dictionary<string, int> hetiOrak, List<BeosztasReszlet> beosztas, List<(Muszak muszak, string nap)> slotok = null)
        {
            // 1. Elérhetőség vizsgálata aznapra
            var elerhetoE = elerhetosegek.FirstOrDefault(e => e.DolgozoId == dolgozo.Id && e.Nap == nap);
            if (elerhetoE != null && !elerhetoE.Elerheto) return false; // Nincs beállítva elérhetőnek

            // 2. Dolgozik-e már ebben a műszakban? (Ugyanazon a napon ugyanabban a műszakban nem lehet kétszer)
            if (beosztas.Any(b => b.DolgozoId == dolgozo.Id && b.MuszakId == muszak.Id)) return false;

            // 3. Egy embernek egy napra csak 1 műszakot adunk (Egyszerűsített szabály)
            if (beosztas.Any(b => b.DolgozoId == dolgozo.Id && b.Nap == nap)) return false;

            // 4. Heti max óraszám vizsgálata
            int pluszOrak = SzamolOrakat(muszak.Kezdes, muszak.Befejezes);
            if (hetiOrak[dolgozo.Id] + pluszOrak > dolgozo.MaxHetiOra) return false;

            // 5. Kötelező pihenőidő szabály: Ha előző nap éjszakai volt, ma nem lehet reggeli/délelőtt
            var napokSorrendje = new List<string> { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
            int maiIndex = napokSorrendje.IndexOf(nap);
            if (maiIndex > 0 && slotok != null)
            {
                string elozoNap = napokSorrendje[maiIndex - 1];
                var tegnapiBeosztas = beosztas.FirstOrDefault(b => b.DolgozoId == dolgozo.Id && b.Nap == elozoNap);
                if (tegnapiBeosztas != null)
                {
                    var tegnapiMuszak = slotok.FirstOrDefault(s => s.muszak.Id == tegnapiBeosztas.MuszakId).muszak;
                    if (tegnapiMuszak != null)
                    {
                        // Ha a mai műszak korán kezdődik, ellenőrizni kell a tegnapi zárást
                        if (muszak.Megnevezes.Contains("Reggel", StringComparison.OrdinalIgnoreCase) || 
                            muszak.Megnevezes.Contains("Délelőtt", StringComparison.OrdinalIgnoreCase))
                        {
                            if (tegnapiMuszak.Megnevezes.Contains("éjszaka", StringComparison.OrdinalIgnoreCase) || 
                                tegnapiMuszak.Megnevezes.Contains("ejszaka", StringComparison.OrdinalIgnoreCase) || 
                                tegnapiMuszak.Megnevezes.Contains("Este", StringComparison.OrdinalIgnoreCase))
                            {
                                return false; // Pihenőidő megsértése
                            }
                        }
                    }
                }
            }

            // 6. Pozíció (Munkakör) vizsgálata - SZIGORÚ ELLENŐRZÉS
            bool isMuszakVegyes = string.IsNullOrEmpty(muszak.Pozicio) || muszak.Pozicio.Equals("Vegyes", StringComparison.OrdinalIgnoreCase);
            bool isDolgozoVegyes = string.IsNullOrEmpty(dolgozo.Pozicio) || dolgozo.Pozicio.Equals("Vegyes", StringComparison.OrdinalIgnoreCase);

            // Ha a műszak specifikus (nem vegyes)
            if (!isMuszakVegyes)
            {
                // Akkor vagy a dolgozónak kell ugyanabban a pozícióban lennie, vagy Vegyesnek kell lennie
                if (!isDolgozoVegyes && !muszak.Pozicio.Equals(dolgozo.Pozicio, StringComparison.OrdinalIgnoreCase))
                {
                    return false; // Pozíció mismatch
                }
            }

            return true;
        }

        private int SzamolOrakat(string kezdes, string befejezes)
        {
            if (TimeSpan.TryParse(kezdes, out var k) && TimeSpan.TryParse(befejezes, out var b))
            {
                var orak = (b - k).TotalHours;
                if (orak < 0) orak += 24; // Éjszakai műszak átfordulása (pl. 22:00 - 06:00)
                return (int)Math.Round(orak);
            }
            return 8; // Alapértelmezett, ha hibás a formátum
        }


        // ==============================================================================
        // EGYÉB FUNKCIÓK (Lekérdezés, Véglegesítés)
        // ==============================================================================

        public async Task<Beosztas> HetiBeosztasLekerdezese(string het)
        {
            var query = _db.Collection("beosztasok").WhereEqualTo("Het", het);
            var snapshot = await query.GetSnapshotAsync();

            if (snapshot.Documents.Count > 0)
            {
                var beosztas = snapshot.Documents[0].ConvertTo<Beosztas>();
                beosztas.Id = snapshot.Documents[0].Id;
                return beosztas;
            }

            return null;
        }

        public async Task<bool> Veglegesites(string id)
        {
            var docRef = _db.Collection("beosztasok").Document(id);
            var snapshot = await docRef.GetSnapshotAsync();

            if (!snapshot.Exists) return false;

            await docRef.UpdateAsync("Allapot", "Végleges");
            return true;
        }

        public async Task<bool> ModositasMentese(string id, List<BeosztasReszlet> ujReszletek)
        {
            var docRef = _db.Collection("beosztasok").Document(id);
            var snapshot = await docRef.GetSnapshotAsync();

            if (!snapshot.Exists) return false;

            await docRef.UpdateAsync(new Dictionary<string, object>
            {
                { "Reszletek", ujReszletek },
                { "Allapot", "Tervezet (Manuálisan módosítva)" }
            });
            return true;
        }
    }
}
