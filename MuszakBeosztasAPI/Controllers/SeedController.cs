using Microsoft.AspNetCore.Mvc;
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly FirestoreDb _db;
        public SeedController(FirestoreDb db) { _db = db; }

        [HttpPost("run")]
        public async Task<IActionResult> RunSeed()
        {
            // ═══════════════════════════════════════════════════════════
            // 1. TELJES TÖRLÉS (beleértve régi elárvult kollekciókat)
            // ═══════════════════════════════════════════════════════════
            foreach (var col in new[] { "dolgozok", "muszakok", "elerhetosegek", "elerhetoseg", "beosztasok" })
            {
                var snap = await _db.Collection(col).GetSnapshotAsync();
                foreach (var doc in snap.Documents) await doc.Reference.DeleteAsync();
            }

            var pw = BCrypt.Net.BCrypt.HashPassword("Munka1234");
            var dolgozokRef = _db.Collection("dolgozok");
            var muszakokRef = _db.Collection("muszakok");
            var elerhetosegRef = _db.Collection("elerhetosegek");

            // ═══════════════════════════════════════════════════════════
            // 2. DOLGOZÓK – 15 fő, kis étterem csapata
            // ═══════════════════════════════════════════════════════════
            var dolgozok = new (string nev, string email, string poz, string szerep, int maxOra, string tel)[]
            {
                // HR (2 fő) – nem kerülnek beosztásba
                ("Rácz László",       "racz.laszlo@etterem.hu",    "HR",      "HR",      40, "+36 30 100 0001"),
                ("Török Katalin",     "torok.katalin@etterem.hu",  "HR",      "HR",      40, "+36 30 100 0002"),

                // Szakácsok (4 fő)
                ("Molnár István",     "molnar.istvan@etterem.hu",  "Szakács", "Dolgozo", 40, "+36 30 200 0001"),
                ("Varga Péter",       "varga.peter@etterem.hu",    "Szakács", "Dolgozo", 40, "+36 30 200 0002"),
                ("Kiss Anita",        "kiss.anita@etterem.hu",     "Szakács", "Dolgozo", 40, "+36 30 200 0003"),
                ("Fekete Zsolt",      "fekete.zsolt@etterem.hu",   "Szakács", "Dolgozo", 32, "+36 30 200 0004"),

                // Pincérek (4 fő)
                ("Szabó Eszter",      "szabo.eszter@etterem.hu",   "Pincér",  "Dolgozo", 40, "+36 30 300 0001"),
                ("Nagy Tamás",        "nagy.tamas@etterem.hu",     "Pincér",  "Dolgozo", 40, "+36 30 300 0002"),
                ("Tóth Gergő",        "toth.gergo@etterem.hu",     "Pincér",  "Dolgozo", 40, "+36 30 300 0003"),
                ("Horváth Réka",      "horvath.reka@etterem.hu",   "Pincér",  "Dolgozo", 32, "+36 30 300 0004"),

                // Pultosok (3 fő)
                ("Juhász Vivien",     "juhasz.vivien@etterem.hu",  "Pultos",  "Dolgozo", 40, "+36 30 400 0001"),
                ("Simon Ádám",        "simon.adam@etterem.hu",     "Pultos",  "Dolgozo", 40, "+36 30 400 0002"),
                ("Lakatos Nóra",      "lakatos.nora@etterem.hu",   "Pultos",  "Dolgozo", 32, "+36 30 400 0003"),

                // Vegyes (2 fő) – bármilyen pozícióba beoszthatók
                ("Németh Levente",    "nemeth.levente@etterem.hu", "Vegyes",  "Dolgozo", 40, "+36 30 500 0001"),
                ("Pintér Luca",       "pinter.luca@etterem.hu",    "Vegyes",  "Dolgozo", 32, "+36 30 500 0002"),
            };

            var napok = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };

            // Mindenki 1 fix szabadnapot kap (rotációs)
            var szabadnapok = new Dictionary<int, string[]>
            {
                { 0,  new[] { "Szombat", "Vasárnap" } },  // HR – hétvége szabad
                { 1,  new[] { "Szombat", "Vasárnap" } },  // HR
                { 2,  new[] { "Vasárnap" } },              // Molnár István
                { 3,  new[] { "Hétfő" } },                 // Varga Péter
                { 4,  new[] { "Kedd" } },                  // Kiss Anita
                { 5,  new[] { "Szerda", "Csütörtök" } },   // Fekete Zsolt (részmunkaidős)
                { 6,  new[] { "Vasárnap" } },              // Szabó Eszter
                { 7,  new[] { "Szombat" } },               // Nagy Tamás
                { 8,  new[] { "Hétfő" } },                 // Tóth Gergő
                { 9,  new[] { "Kedd", "Péntek" } },        // Horváth Réka (részmunkaidős)
                { 10, new[] { "Csütörtök" } },             // Juhász Vivien
                { 11, new[] { "Szerda" } },                 // Simon Ádám
                { 12, new[] { "Péntek", "Szombat" } },     // Lakatos Nóra (részmunkaidős)
                { 13, new[] { "Vasárnap" } },              // Németh Levente
                { 14, new[] { "Szombat", "Vasárnap" } },   // Pintér Luca (részmunkaidős)
            };

            // Preferenciák a dolgozók számára
            var preferenciak = new Dictionary<int, string>
            {
                { 2, "Reggel" }, // Molnár István
                { 3, "Este" },   // Varga Péter
                { 4, "Reggel" }, // Kiss Anita
                { 5, "Reggel" }, // Fekete Zsolt (mindig reggel szeret lenni)
                { 6, "Reggel" }, // Szabó Eszter
                { 7, "Este" },   // Nagy Tamás
                { 8, "Este" },   // Tóth Gergő
                { 9, "Reggel" }, // Horváth Réka
                { 10, "Délután" },// Juhász Vivien
                { 11, "Délután" },// Simon Ádám
                { 12, "Délután" } // Lakatos Nóra
            };

            for (int i = 0; i < dolgozok.Length; i++)
            {
                var (nev, email, poz, szerep, maxOra, tel) = dolgozok[i];
                var pref = preferenciak.ContainsKey(i) ? preferenciak[i] : "";

                var docRef = await dolgozokRef.AddAsync(new Dictionary<string, object> {
                    {"Nev", nev}, {"Email", email}, {"Pozicio", poz},
                    {"Szerepkor", szerep}, {"Telefonszam", tel},
                    {"JelszoHash", pw}, {"MaxHetiOra", maxOra},
                    {"PreferaltNapszak", pref}
                });

                var szabad = szabadnapok.ContainsKey(i) ? szabadnapok[i] : Array.Empty<string>();
                foreach (var nap in napok)
                {
                    await elerhetosegRef.AddAsync(new Dictionary<string, object> {
                        {"DolgozoId", docRef.Id}, {"DolgozoNev", nev},
                        {"Nap", nap}, {"Elerheto", !szabad.Contains(nap)}
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════
            // 3. MŰSZAKOK – 5 per nap, egyszerű és átlátható
            // ═══════════════════════════════════════════════════════════
            //   Reggel: 1 Szakács + 1 Pincér
            //   Délután: 1 Pultos
            //   Este: 1 Szakács + 1 Pincér
            //   = 5 slot/nap × 7 = 35 heti slot (biztosan kitölthető)
            var napiMuszakok = new (string megn, string kezd, string bef, int letsz, string poz)[] {
                ("Konyha Reggel",  "06:00", "14:00", 1, "Szakács"),
                ("Terem Reggel",   "08:00", "16:00", 1, "Pincér"),
                ("Bár Délután",    "10:00", "18:00", 1, "Pultos"),
                ("Konyha Este",    "14:00", "22:00", 1, "Szakács"),
                ("Terem Este",     "16:00", "00:00", 1, "Pincér"),
            };

            int muszakCount = 0;
            foreach (var nap in napok)
            {
                foreach (var (megn, kezd, bef, letsz, poz) in napiMuszakok)
                {
                    await muszakokRef.AddAsync(new Dictionary<string, object> {
                        {"Megnevezes", megn}, {"Kezdes", kezd}, {"Befejezes", bef},
                        {"Nap", nap}, {"SzuksegesLetszam", letsz}, {"Pozicio", poz}
                    });
                    muszakCount++;
                }
            }

            return Ok(new {
                message = "✅ Demo adatbázis kész!",
                dolgozokSzama = dolgozok.Length,
                muszakokSzama = muszakCount,
                hetiSlotok = muszakCount,  // 1 fő/műszak
                admin = "racz.laszlo@etterem.hu / Munka1234",
                dolgozo = "molnar.istvan@etterem.hu / Munka1234"
            });
        }
    }
}
