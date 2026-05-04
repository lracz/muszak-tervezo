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
            // 1. TELJES TÖRLÉS
            foreach (var col in new[] { "dolgozok", "muszakok", "elerhetosegek", "beosztasok" })
            {
                var snap = await _db.Collection(col).GetSnapshotAsync();
                foreach (var doc in snap.Documents) await doc.Reference.DeleteAsync();
            }

            var pw = BCrypt.Net.BCrypt.HashPassword("Munka1234");
            var dolgozokRef = _db.Collection("dolgozok");
            var muszakokRef = _db.Collection("muszakok");

            // 2. DOLGOZÓK - 10 fő, egyértelmű pozíciókkal
            var dolgozoIds = new Dictionary<string, string>(); // name -> id

            var dolgozok = new (string nev, string poz, string szerep, int maxOra)[] {
                ("Szakács Anna", "Szakács", "Dolgozo", 40),
                ("Szakács Béla", "Szakács", "Dolgozo", 40),
                ("Szakács Csaba", "Szakács", "Dolgozo", 40),
                ("Pultos Dóra", "Pultos", "Dolgozo", 40),
                ("Pultos Erik", "Pultos", "Dolgozo", 40),
                ("Pultos Fanni", "Pultos", "Dolgozo", 40),
                ("Pincér Gábor", "Pincér", "Dolgozo", 40),
                ("Pincér Hanna", "Pincér", "Dolgozo", 40),
                ("Pincér Iván", "Pincér", "Dolgozo", 40),
                ("Admin Klára", "HR", "HR", 40),
            };

            foreach (var (nev, poz, szerep, maxOra) in dolgozok)
            {
                var docRef = await dolgozokRef.AddAsync(new Dictionary<string, object> {
                    {"Nev", nev}, {"Email", nev.Replace(" ",".").ToLower()+"@ceg.hu"},
                    {"Pozicio", poz}, {"Szerepkor", szerep}, {"Telefonszam", "+36301111111"},
                    {"JelszoHash", pw}, {"MaxHetiOra", maxOra}
                });
                dolgozoIds[nev] = docRef.Id;
            }

            // 3. MŰSZAKOK - CSAK Hétfő, egyszerű: 1 Szakács reggel, 1 Pultos reggel, 1 Pincér reggel
            var muszakIds = new Dictionary<string, string>();

            var muszakok = new (string megn, string kezd, string bef, string nap, int letsz, string poz)[] {
                ("Séf Reggel",    "08:00", "16:00", "Hétfő", 1, "Szakács"),
                ("Pult Reggel",   "08:00", "16:00", "Hétfő", 1, "Pultos"),
                ("Pincér Reggel", "08:00", "16:00", "Hétfő", 1, "Pincér"),
                ("Séf Este",      "16:00", "00:00", "Hétfő", 1, "Szakács"),
                ("Pult Este",     "16:00", "00:00", "Hétfő", 1, "Pultos"),
                ("Pincér Este",   "16:00", "00:00", "Hétfő", 1, "Pincér"),
            };

            foreach (var (megn, kezd, bef, nap, letsz, poz) in muszakok)
            {
                var docRef = await muszakokRef.AddAsync(new Dictionary<string, object> {
                    {"Megnevezes", megn}, {"Kezdes", kezd}, {"Befejezes", bef},
                    {"Nap", nap}, {"SzuksegesLetszam", letsz}, {"Pozicio", poz}
                });
                muszakIds[megn] = docRef.Id;
            }

            return Ok(new {
                message = "TESZT seed kész: 10 dolgozó, 6 műszak (csak Hétfő)",
                dolgozoIds,
                muszakIds
            });
        }
    }
}
