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
            // ═══════════════════════════════════════════════════════════════
            // 1. TELJES ADATBÁZIS TÖRLÉS (beleértve az elárvult kollekciókat is)
            // ═══════════════════════════════════════════════════════════════
            foreach (var col in new[] { "dolgozok", "muszakok", "elerhetosegek", "elerhetoseg", "beosztasok" })
            {
                var snap = await _db.Collection(col).GetSnapshotAsync();
                foreach (var doc in snap.Documents) await doc.Reference.DeleteAsync();
            }

            var pw = BCrypt.Net.BCrypt.HashPassword("Munka1234");
            var dolgozokRef = _db.Collection("dolgozok");
            var muszakokRef = _db.Collection("muszakok");
            var elerhetosegRef = _db.Collection("elerhetosegek");

            // ═══════════════════════════════════════════════════════════════
            // 2. DOLGOZÓK – 20 fő, valósághű éttermi csapat
            // ═══════════════════════════════════════════════════════════════
            var dolgozok = new (string nev, string email, string poz, string szerep, int maxOra, string tel)[]
            {
                // --- MENEDZSMENT (2 fő) ---
                ("Rácz László",       "racz.laszlo@etterem.hu",      "HR",      "HR",      40, "+36 30 100 0001"),
                ("Török Katalin",     "torok.katalin@etterem.hu",    "HR",      "HR",      40, "+36 30 100 0002"),

                // --- SZAKÁCSOK (5 fő) ---
                ("Molnár István",     "molnar.istvan@etterem.hu",    "Szakács", "Dolgozo", 40, "+36 30 200 0001"),
                ("Varga Péter",       "varga.peter@etterem.hu",      "Szakács", "Dolgozo", 40, "+36 30 200 0002"),
                ("Kiss Anita",        "kiss.anita@etterem.hu",       "Szakács", "Dolgozo", 32, "+36 30 200 0003"),
                ("Fekete Zsolt",      "fekete.zsolt@etterem.hu",     "Szakács", "Dolgozo", 40, "+36 30 200 0004"),
                ("Balogh Richárd",    "balogh.richard@etterem.hu",   "Szakács", "Dolgozo", 24, "+36 30 200 0005"),

                // --- PINCÉREK (6 fő) ---
                ("Szabó Eszter",      "szabo.eszter@etterem.hu",     "Pincér",  "Dolgozo", 40, "+36 30 300 0001"),
                ("Nagy Tamás",        "nagy.tamas@etterem.hu",       "Pincér",  "Dolgozo", 40, "+36 30 300 0002"),
                ("Kovács Dóra",       "kovacs.dora@etterem.hu",      "Pincér",  "Dolgozo", 32, "+36 30 300 0003"),
                ("Tóth Gergő",        "toth.gergo@etterem.hu",       "Pincér",  "Dolgozo", 40, "+36 30 300 0004"),
                ("Horváth Réka",      "horvath.reka@etterem.hu",     "Pincér",  "Dolgozo", 24, "+36 30 300 0005"),
                ("Papp Bence",        "papp.bence@etterem.hu",       "Pincér",  "Dolgozo", 20, "+36 30 300 0006"),

                // --- PULTOSOK (4 fő) ---
                ("Juhász Vivien",     "juhasz.vivien@etterem.hu",    "Pultos",  "Dolgozo", 40, "+36 30 400 0001"),
                ("Simon Ádám",        "simon.adam@etterem.hu",       "Pultos",  "Dolgozo", 40, "+36 30 400 0002"),
                ("Lakatos Nóra",      "lakatos.nora@etterem.hu",     "Pultos",  "Dolgozo", 32, "+36 30 400 0003"),
                ("Farkas Dániel",     "farkas.daniel@etterem.hu",    "Pultos",  "Dolgozo", 24, "+36 30 400 0004"),

                // --- VEGYES / GYAKORNOK (3 fő – bármilyen pozícióba beosztható) ---
                ("Németh Levente",    "nemeth.levente@etterem.hu",   "Vegyes",  "Dolgozo", 40, "+36 30 500 0001"),
                ("Pintér Luca",       "pinter.luca@etterem.hu",      "Vegyes",  "Dolgozo", 20, "+36 30 500 0002"),
                ("Szűcs Máté",        "szucs.mate@etterem.hu",       "Vegyes",  "Dolgozo", 24, "+36 30 500 0003"),
            };

            var napok = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
            var dolgozoIdLista = new List<(string id, string nev)>();

            // Determinisztikus elérhetőségi minta – minden dolgozónak van 1-2 szabadnapja
            var szabadnapok = new Dictionary<int, string[]>
            {
                // Menedzsment: hétvégén szabad
                { 0,  new[] { "Szombat", "Vasárnap" } },
                { 1,  new[] { "Szombat", "Vasárnap" } },

                // Szakácsok: rotációs szabadnapok
                { 2,  new[] { "Vasárnap" } },          // Molnár István
                { 3,  new[] { "Hétfő" } },             // Varga Péter
                { 4,  new[] { "Szerda", "Csütörtök" } }, // Kiss Anita (részmunkaidős)
                { 5,  new[] { "Kedd" } },               // Fekete Zsolt
                { 6,  new[] { "Hétfő", "Kedd", "Péntek" } }, // Balogh Richárd (részmunkaidős)

                // Pincérek: rotációs szabadnapok
                { 7,  new[] { "Vasárnap" } },           // Szabó Eszter
                { 8,  new[] { "Szerda" } },             // Nagy Tamás
                { 9,  new[] { "Péntek", "Szombat" } },  // Kovács Dóra (részmunkaidős)
                { 10, new[] { "Hétfő" } },              // Tóth Gergő
                { 11, new[] { "Kedd", "Csütörtök" } },  // Horváth Réka (részmunkaidős)
                { 12, new[] { "Hétfő", "Szerda", "Péntek", "Vasárnap" } }, // Papp Bence (diákmunka)

                // Pultosok: rotációs szabadnapok
                { 13, new[] { "Vasárnap" } },           // Juhász Vivien
                { 14, new[] { "Szombat" } },            // Simon Ádám
                { 15, new[] { "Csütörtök", "Péntek" } }, // Lakatos Nóra (részmunkaidős)
                { 16, new[] { "Hétfő", "Kedd", "Szombat" } }, // Farkas Dániel (részmunkaidős)

                // Vegyes / Gyakornokok
                { 17, new[] { "Szombat" } },            // Németh Levente
                { 18, new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök" } }, // Pintér Luca (hétvégi diák)
                { 19, new[] { "Péntek", "Szombat", "Vasárnap" } }, // Szűcs Máté (hétköznapi)
            };

            for (int i = 0; i < dolgozok.Length; i++)
            {
                var (nev, email, poz, szerep, maxOra, tel) = dolgozok[i];

                var docRef = await dolgozokRef.AddAsync(new Dictionary<string, object> {
                    {"Nev", nev},
                    {"Email", email},
                    {"Pozicio", poz},
                    {"Szerepkor", szerep},
                    {"Telefonszam", tel},
                    {"JelszoHash", pw},
                    {"MaxHetiOra", maxOra}
                });

                dolgozoIdLista.Add((docRef.Id, nev));

                // Elérhetőség beállítása az összes napra
                var szabadnapokLista = szabadnapok.ContainsKey(i) ? szabadnapok[i] : Array.Empty<string>();
                foreach (var nap in napok)
                {
                    bool elerheto = !szabadnapokLista.Contains(nap);
                    string megjegyzes = "";
                    if (!elerheto)
                    {
                        // Reális indoklások
                        if (nap == "Szombat" || nap == "Vasárnap") megjegyzes = "Hétvégi pihenőnap";
                        else if (maxOra <= 24) megjegyzes = "Részmunkaidős beosztás";
                        else megjegyzes = "Rotációs szabadnap";
                    }

                    await elerhetosegRef.AddAsync(new Dictionary<string, object> {
                        {"DolgozoId", docRef.Id},
                        {"DolgozoNev", nev},
                        {"Nap", nap},
                        {"Elerheto", elerheto},
                        {"Megjegyzes", megjegyzes}
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════════
            // 3. MŰSZAKOK – Valósághű éttermi heti beosztás
            // ═══════════════════════════════════════════════════════════════
            int muszakCount = 0;

            // Hétköznap (Hétfő-Péntek): kisebb létszám
            var hetkoziMuszakok = new (string megn, string kezd, string bef, int letsz, string poz)[] {
                ("Konyha Reggel",   "08:00", "16:00", 2, "Szakács"),
                ("Terem Reggel",    "09:00", "17:00", 2, "Pincér"),
                ("Bár Reggel",      "10:00", "18:00", 1, "Pultos"),
                ("Konyha Este",     "16:00", "00:00", 2, "Szakács"),
                ("Terem Este",      "17:00", "01:00", 2, "Pincér"),
                ("Bár Este",        "18:00", "02:00", 1, "Pultos"),
            };

            // Hétvége (Szombat-Vasárnap): megnövelt létszám
            var hetvegeMuszakok = new (string megn, string kezd, string bef, int letsz, string poz)[] {
                ("Konyha Reggel",   "08:00", "16:00", 2, "Szakács"),
                ("Terem Reggel",    "09:00", "17:00", 2, "Pincér"),
                ("Bár Reggel",      "10:00", "18:00", 2, "Pultos"),
                ("Konyha Este",     "16:00", "00:00", 2, "Szakács"),
                ("Terem Este",      "17:00", "01:00", 2, "Pincér"),
                ("Bár Este",        "18:00", "02:00", 1, "Pultos"),
            };

            foreach (var nap in napok)
            {
                bool hetvege = nap == "Szombat" || nap == "Vasárnap";
                var napiMuszakok = hetvege ? hetvegeMuszakok : hetkoziMuszakok;

                foreach (var (megn, kezd, bef, letsz, poz) in napiMuszakok)
                {
                    await muszakokRef.AddAsync(new Dictionary<string, object> {
                        {"Megnevezes", megn},
                        {"Kezdes", kezd},
                        {"Befejezes", bef},
                        {"Nap", nap},
                        {"SzuksegesLetszam", letsz},
                        {"Pozicio", poz}
                    });
                    muszakCount++;
                }
            }

            return Ok(new {
                message = "✅ Demo adatbázis feltöltve!",
                dolgozokSzama = dolgozok.Length,
                muszakokSzama = muszakCount,
                adminBejelentkezes = new {
                    email = "racz.laszlo@etterem.hu",
                    jelszo = "Munka1234"
                },
                dolgozoBejelentkezes = new {
                    email = "molnar.istvan@etterem.hu",
                    jelszo = "Munka1234"
                }
            });
        }
    }
}
