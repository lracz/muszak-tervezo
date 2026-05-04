// Elérhetőség szolgáltatás - Firestore CRUD műveletek az elérhetőségekhez
using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class ElerhetosegService
    {
        private readonly FirestoreDb _firestore;
        private readonly string _kollekcioNev = "elerhetosegek";

        public ElerhetosegService(FirestoreDb firestore)
        {
            _firestore = firestore;
        }

        // Összes elérhetőség lekérdezése
        public async Task<List<Elerhetoseg>> OsszesLekerese()
        {
            try
            {
                var pillanatkep = await _firestore.Collection(_kollekcioNev).GetSnapshotAsync();
                var lista = new List<Elerhetoseg>();

                foreach (var dokumentum in pillanatkep.Documents)
                {
                    var elem = dokumentum.ConvertTo<Elerhetoseg>();
                    elem.Id = dokumentum.Id;
                    lista.Add(elem);
                }

                return lista;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba az elérhetőségek lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Egy dolgozó elérhetőségeinek lekérdezése
        public async Task<List<Elerhetoseg>> DolgozoElerhetosegei(string dolgozoId)
        {
            try
            {
                var pillanatkep = await _firestore.Collection(_kollekcioNev)
                    .WhereEqualTo("DolgozoId", dolgozoId)
                    .GetSnapshotAsync();

                var lista = new List<Elerhetoseg>();

                foreach (var dokumentum in pillanatkep.Documents)
                {
                    var elem = dokumentum.ConvertTo<Elerhetoseg>();
                    elem.Id = dokumentum.Id;
                    lista.Add(elem);
                }

                return lista;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba a dolgozó elérhetőségeinek lekérdezésekor: {ex.Message}");
                throw;
            }
        }

        // Új elérhetőség létrehozása
        public async Task<Elerhetoseg> Letrehozas(Elerhetoseg elerhetoseg)
        {
            try
            {
                var dokumentumRef = await _firestore.Collection(_kollekcioNev).AddAsync(elerhetoseg);
                elerhetoseg.Id = dokumentumRef.Id;
                return elerhetoseg;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba az elérhetőség létrehozásakor: {ex.Message}");
                throw;
            }
        }

        // Elérhetőség frissítése
        public async Task<bool> Frissites(string id, Elerhetoseg elerhetoseg)
        {
            try
            {
                var dokumentumRef = _firestore.Collection(_kollekcioNev).Document(id);
                var meglevo = await dokumentumRef.GetSnapshotAsync();

                if (!meglevo.Exists)
                    return false;

                elerhetoseg.Id = id;
                await dokumentumRef.SetAsync(elerhetoseg, SetOptions.Overwrite);
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Hiba az elérhetőség frissítésekor: {ex.Message}");
                throw;
            }
        }

        // Elérhetőség törlése
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
                Console.WriteLine($"Hiba az elérhetőség törlésekor: {ex.Message}");
                throw;
            }
        }
    }
}
