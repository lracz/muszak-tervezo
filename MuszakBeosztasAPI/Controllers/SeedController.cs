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
            // 1. ADATTISZTÍTÁS
            foreach (var col in new[] { "dolgozok", "muszakok", "elerhetosegek", "beosztasok" })
            {
                var snap = await _db.Collection(col).GetSnapshotAsync();
                foreach (var doc in snap.Documents) await doc.Reference.DeleteAsync();
            }

            var pw = BCrypt.Net.BCrypt.HashPassword("Munka1234");
            var dolgozokRef = _db.Collection("dolgozok");
            var muszakokRef = _db.Collection("muszakok");
            var elerhetosegRef = _db.Collection("elerhetosegek");

            // 2. DOLGOZÓK GENERÁLÁSA (30 fő)
            var poziciok = new[] { "Szakács", "Pincér", "Pultos", "Vegyes" };
            var keresztnevek = new[] { "Anna", "Béla", "Csaba", "Dóra", "Erik", "Fanni", "Gábor", "Hanna", "Iván", "Júlia", "Károly", "Lilla", "Márk", "Nóra", "Ottó", "Péter", "Róza", "Sándor", "Tímea", "Viktor" };
            var vezeteknevek = new[] { "Kovács", "Nagy", "Szabó", "Tóth", "Varga", "Kiss", "Molnár", "Farkas", "Balogh", "Papp" };

            var random = new Random();
            var dolgozoIds = new List<string>();

            for (int i = 0; i < 30; i++)
            {
                string nev = $"{vezeteknevek[random.Next(vezeteknevek.Length)]} {keresztnevek[random.Next(keresztnevek.Length)]} {i}";
                string poz = poziciok[random.Next(poziciok.Length)];
                
                var dolgozoData = new Dictionary<string, object> {
                    {"Nev", nev}, 
                    {"Email", $"test{i}@ceg.hu"},
                    {"Pozicio", poz}, 
                    {"Szerepkor", i == 0 ? "HR" : "Dolgozo"}, 
                    {"Telefonszam", "+36300000000"},
                    {"JelszoHash", pw}, 
                    {"MaxHetiOra", random.Next(20, 41)} // 20-40 óra közötti szerződések
                };

                var docRef = await dolgozokRef.AddAsync(dolgozoData);
                dolgozoIds.Add(docRef.Id);

                // Elérhetőség generálás (a legtöbb napon elérhető, de néha nem)
                var napok = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
                foreach (var nap in napok)
                {
                    bool elerheto = random.Next(100) > 15; // 85% eséllyel ráér
                    await elerhetosegRef.AddAsync(new Dictionary<string, object> {
                        {"DolgozoId", docRef.Id},
                        {"DolgozoNev", nev}, // Beletesszük a nevet is a könnyebb megjelenítésért
                        {"Nap", nap},
                        {"Elerheto", elerheto}
                    });
                }
            }

            // 3. MŰSZAKOK GENERÁLÁSA (Minden napra 6 műszak)
            var napokSorrendje = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
            int muszakCount = 0;

            foreach (var nap in napokSorrendje)
            {
                var napiMuszakok = new[] {
                    ("Konyha Reggel", "08:00", "16:00", 2, "Szakács"),
                    ("Pult Reggel",   "08:00", "16:00", 1, "Pultos"),
                    ("Placc Reggel",  "09:00", "17:00", 2, "Pincér"),
                    ("Konyha Este",   "16:00", "00:00", 2, "Szakács"),
                    ("Pult Este",     "16:00", "01:00", 2, "Pultos"),
                    ("Placc Este",    "17:00", "01:00", 3, "Pincér")
                };

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
                message = "REÁLIS seed kész!",
                dolgozokSzama = 30,
                muszakokSzama = muszakCount,
                admin = "test0@ceg.hu / Munka1234"
            });
        }
    }
}
