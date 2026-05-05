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
        private readonly SzabadsagService _szabadsagService;

        public BeosztasService(FirestoreDb db, DolgozoService dolgozoService, MuszakService muszakService, ElerhetosegService elerhetosegService, SzabadsagService szabadsagService)
        {
            _db = db;
            _dolgozoService = dolgozoService;
            _muszakService = muszakService;
            _elerhetosegService = elerhetosegService;
            _szabadsagService = szabadsagService;
        }

        // ==============================================================================
        // NP-TELJES PROBLÉMA MEGOLDÓ: BACKTRACKING KÉNYSZER-KIELÉGÍTÉSI (CSP) ALGORITMUS
        // ==============================================================================
        
        public async Task<Beosztas> BeosztasGeneralas(string het)
        {
            var dolgozok = await _dolgozoService.OsszesLekerese();
            var muszakok = await _muszakService.OsszesLekerese();
            var elerhetosegek = await _elerhetosegService.OsszesLekerese();
            var szabadsagok = await _szabadsagService.OsszesLekerese();

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
                Sikerult = MegoldasKeresese(0, betoltendoSlotok, dolgozok, elerhetosegek, szabadsagok, het, hetiOrakDolgozonkent, beosztasLista, cts.Token);
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
                var greedyLista = GreedyBeosztas(betoltendoSlotok, dolgozok, elerhetosegek, szabadsagok, het);
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
            List<Szabadsag> szabadsagok, 
            string het,
            Dictionary<string, int> hetiOrak, 
            List<BeosztasReszlet> beosztas, 
            CancellationToken ct)
        {
            if (ct.IsCancellationRequested) return false;
            if (slotIndex == slotok.Count) return true; // Minden slotot betöltöttünk!

            var slot = slotok[slotIndex];
            var aktualisMuszak = slot.muszak;

            // HEURISZTIKA: Dolgozók sorrendbe állítása (Preferált napszak és hátralévő órák alapján)
            var rendezettDolgozok = dolgozok
                .OrderByDescending(d => 
                {
                    int score = 0;
                    if (!string.IsNullOrEmpty(d.PreferaltNapszak) && aktualisMuszak.Megnevezes.Contains(d.PreferaltNapszak, StringComparison.OrdinalIgnoreCase)) 
                        score += 1000;
                    score += (d.MaxHetiOra - hetiOrak[d.Id]) * 10;
                    return score;
                })
                .ToList();

            foreach (var dolgozo in rendezettDolgozok)
            {
                if (ValidE(dolgozo, slot.nap, het, aktualisMuszak, elerhetosegek, szabadsagok, hetiOrak, beosztas, slotok))
                {
                    // Hozzáadás a beosztáshoz
                    var ujReszlet = new BeosztasReszlet { DolgozoId = dolgozo.Id, MuszakId = aktualisMuszak.Id, Nap = slot.nap };
                    beosztas.Add(ujReszlet);
                    int muszakHossza = SzamolOrakat(aktualisMuszak.Kezdes, aktualisMuszak.Befejezes);
                    hetiOrak[dolgozo.Id] += muszakHossza;

                    if (MegoldasKeresese(slotIndex + 1, slotok, dolgozok, elerhetosegek, szabadsagok, het, hetiOrak, beosztas, ct)) return true;

                    // Backtrack: ha nem vezetett sikerre, vonjuk vissza
                    beosztas.Remove(ujReszlet);
                    hetiOrak[dolgozo.Id] -= muszakHossza;
                }
            }

            return false;
        }

        // Mohó (Greedy) Algoritmus vészhelyzetre
        private List<BeosztasReszlet> GreedyBeosztas(List<(Muszak muszak, string nap)> slotok, List<Dolgozo> dolgozok, List<Elerhetoseg> elerhetosegek, List<Szabadsag> szabadsagok, string het)
        {
            var beosztasLista = new List<BeosztasReszlet>();
            var hetiOrak = dolgozok.ToDictionary(d => d.Id, d => 0);

            foreach (var slot in slotok)
            {
                var aktualisMuszak = slot.muszak;
                var rendezettDolgozok = dolgozok.OrderByDescending(d => 
                    !string.IsNullOrEmpty(d.PreferaltNapszak) && aktualisMuszak.Megnevezes.Contains(d.PreferaltNapszak, StringComparison.OrdinalIgnoreCase) ? 1 : 0
                ).ThenBy(d => hetiOrak[d.Id]).ToList();

                foreach (var dolgozo in rendezettDolgozok)
                {
                    if (ValidE(dolgozo, slot.nap, het, aktualisMuszak, elerhetosegek, szabadsagok, hetiOrak, beosztasLista, slotok))
                    {
                        beosztasLista.Add(new BeosztasReszlet { DolgozoId = dolgozo.Id, MuszakId = aktualisMuszak.Id, Nap = slot.nap });
                        hetiOrak[dolgozo.Id] += SzamolOrakat(aktualisMuszak.Kezdes, aktualisMuszak.Befejezes);
                        break;
                    }
                }
            }
            return beosztasLista;
        }

        // Hard Constraints ellenőrzése
        private bool ValidE(Dolgozo dolgozo, string nap, string het, Muszak muszak, List<Elerhetoseg> elerhetosegek, List<Szabadsag> szabadsagok, Dictionary<string, int> hetiOrak, List<BeosztasReszlet> beosztas, List<(Muszak muszak, string nap)> slotok)
        {
            // 0. Szabadság ellenőrzése (Konkrét dátumra)
            DateTime? aktualisDatum = GetDateFromWeekAndDay(het, nap);
            if (aktualisDatum.HasValue)
            {
                var szabadsagonVan = szabadsagok.Any(s => 
                    s.DolgozoId == dolgozo.Id && 
                    s.Statusz == "Jovahagyva" && 
                    aktualisDatum.Value.Date >= s.Mettol.Date && 
                    aktualisDatum.Value.Date <= s.Meddig.Date);
                
                if (szabadsagonVan) return false;
            }

            // 1. Elérhetőség vizsgálata aznapra
            var elerhetoE = elerhetosegek.FirstOrDefault(e => e.DolgozoId == dolgozo.Id && e.Nap == nap);
            if (elerhetoE != null && !elerhetoE.Elerheto) 
            {
                if (dolgozo.Nev == "Fekete Zsolt") {
                    Console.WriteLine($"[VALIDÁCIÓ] {dolgozo.Nev} elutasítva {nap} napra: SZABADNAP");
                }
                return false; 
            }

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
        private DateTime? GetDateFromWeekAndDay(string het, string nap)
        {
            try
            {
                // Formátum: YYYY-Www (pl. 2026-W13)
                var parts = het.Split("-W");
                int year = int.Parse(parts[0]);
                int week = int.Parse(parts[1]);

                DateTime jan1 = new DateTime(year, 1, 1);
                int daysOffset = DayOfWeek.Thursday - jan1.DayOfWeek;

                DateTime firstThursday = jan1.AddDays(daysOffset);
                var cal = System.Globalization.CultureInfo.CurrentCulture.Calendar;
                int firstWeek = cal.GetWeekOfYear(firstThursday, System.Globalization.DateTimeFormatInfo.CurrentInfo.CalendarWeekRule, System.Globalization.DateTimeFormatInfo.CurrentInfo.FirstDayOfWeek);

                var weekNum = week;
                if (firstWeek <= 1) weekNum -= 1;

                DateTime result = firstThursday.AddDays(weekNum * 7);
                DateTime monday = result.AddDays(-3);

                var napok = new List<string> { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
                int index = napok.IndexOf(nap);
                return monday.AddDays(index);
            }
            catch { return null; }
        }
    }
}
