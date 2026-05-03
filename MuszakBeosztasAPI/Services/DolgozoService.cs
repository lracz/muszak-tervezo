// Dolgozó szolgáltatás - Firestore CRUD műveletek
using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class DolgozoService
    {
        private readonly FirestoreDb _firestore;
        private readonly string _kollekcioNev = "dolgozok";

        public DolgozoService(FirestoreDb firestore)
        {
            _firestore = firestore;
        }

        // Összes dolgozó lekérdezése
        public async Task<List<Dolgozo>> OsszesLekerese()
        {
            try
            {
                var pillanatkep = await _firestore.Collection(_kollekcioNev).GetSnapshotAsync();
                var dolgozok = new List<Dolgozo>();

                foreach (var dokumentum in pillanatkep.Documents)
                {
                    var dolgozo = dokumentum.ConvertTo<Dolgozo>();
                    dolgozo.Id = dokumentum.Id;
                    dolgozok.Add(dolgozo);
                }

                return dolgozok;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozók lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Egy dolgozó lekérdezése azonosító alapján
        public async Task<Dolgozo?> EgyLekerese(string id)
        {
            try
            {
                var dokumentum = await _firestore.Collection(_kollekcioNev).Document(id).GetSnapshotAsync();

                if (!dokumentum.Exists)
                    return null;

                var dolgozo = dokumentum.ConvertTo<Dolgozo>();
                dolgozo.Id = dokumentum.Id;
                return dolgozo;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozó lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Keresés név vagy email alapján az egyediség ellenőrzéséhez
        public async Task<bool> FoglaltNevVagyEmail(string nev, string? email)
        {
            try
            {
                var dolgozok = await OsszesLekerese();
                return dolgozok.Any(d => 
                    d.Nev.Equals(nev, StringComparison.OrdinalIgnoreCase) || 
                    (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(d.Email) && d.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba az egyediség ellenőrzésekor: {ex.Message}");
                throw;
            }
        }

        // Új dolgozó létrehozása
        public async Task<Dolgozo> Letrehozas(Dolgozo dolgozo)
        {
            try
            {
                var dokumentumRef = await _firestore.Collection(_kollekcioNev).AddAsync(dolgozo);
                dolgozo.Id = dokumentumRef.Id;
                return dolgozo;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozó létrehozásakor: {ex.Message}");
                throw;
            }
        }

        // Dolgozó frissítése
        public async Task<bool> Frissites(string id, Dolgozo dolgozo)
        {
            try
            {
                var dokumentumRef = _firestore.Collection(_kollekcioNev).Document(id);
                var meglevo = await dokumentumRef.GetSnapshotAsync();

                if (!meglevo.Exists)
                    return false;

                dolgozo.Id = id;
                await dokumentumRef.SetAsync(dolgozo, SetOptions.Overwrite);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozó frissítésekor: {ex.Message}");
                throw;
            }
        }

        // Dolgozó törlése
        public async Task<bool> Torles(string id)
        {
            try
            {
                var dokumentumRef = _firestore.Collection(_kollekcioNev).Document(id);
                var meglevo = await dokumentumRef.GetSnapshotAsync();

                if (!meglevo.Exists)
                    return false;

                await dokumentumRef.DeleteAsync();
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozó törlésekor: {ex.Message}");
                throw;
            }
        }
    }
}
