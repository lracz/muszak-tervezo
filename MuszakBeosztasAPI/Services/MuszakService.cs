// Műszak szolgáltatás - Firestore CRUD műveletek a műszakokhoz
using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class MuszakService
    {
        private readonly FirestoreDb _firestore;
        private readonly string _kollekcioNev = "muszakok";

        public MuszakService(FirestoreDb firestore)
        {
            _firestore = firestore;
        }

        // Összes műszak lekérdezése
        public async Task<List<Muszak>> OsszesLekerese()
        {
            try
            {
                var pillanatkep = await _firestore.Collection(_kollekcioNev).GetSnapshotAsync();
                var muszakok = new List<Muszak>();

                foreach (var dokumentum in pillanatkep.Documents)
                {
                    var muszak = dokumentum.ConvertTo<Muszak>();
                    muszak.Id = dokumentum.Id;
                    muszakok.Add(muszak);
                }

                return muszakok;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a műszakok lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Egy műszak lekérdezése azonosító alapján
        public async Task<Muszak?> EgyLekerese(string id)
        {
            try
            {
                var dokumentum = await _firestore.Collection(_kollekcioNev).Document(id).GetSnapshotAsync();

                if (!dokumentum.Exists)
                    return null;

                var muszak = dokumentum.ConvertTo<Muszak>();
                muszak.Id = dokumentum.Id;
                return muszak;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a műszak lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Új műszak létrehozása
        public async Task<Muszak> Letrehozas(Muszak muszak)
        {
            try
            {
                var dokumentumRef = await _firestore.Collection(_kollekcioNev).AddAsync(muszak);
                muszak.Id = dokumentumRef.Id;
                return muszak;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a műszak létrehozásakor: {ex.Message}");
                throw;
            }
        }

        // Műszak frissítése
        public async Task<bool> Frissites(string id, Muszak muszak)
        {
            try
            {
                var dokumentumRef = _firestore.Collection(_kollekcioNev).Document(id);
                var meglevo = await dokumentumRef.GetSnapshotAsync();

                if (!meglevo.Exists)
                    return false;

                muszak.Id = id;
                await dokumentumRef.SetAsync(muszak, SetOptions.Overwrite);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a műszak frissítésekor: {ex.Message}");
                throw;
            }
        }

        // Műszak törlése
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
                Console.WriteLine($"Hiba a műszak törlésekor: {ex.Message}");
                throw;
            }
        }
    }
}
