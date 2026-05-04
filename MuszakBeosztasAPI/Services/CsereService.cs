using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class CsereService
    {
        private readonly FirestoreDb _db;

        public CsereService(FirestoreDb db)
        {
            _db = db;
        }

        public async Task<List<CsereKerelem>> OsszesLekerese()
        {
            var snapshot = await _db.Collection("csereKerelmek").GetSnapshotAsync();
            return snapshot.Documents.Select(d => d.ConvertTo<CsereKerelem>()).ToList();
        }

        public async Task<CsereKerelem> Hozzaadas(CsereKerelem kerelem)
        {
            var docRef = _db.Collection("csereKerelmek").Document();
            kerelem.Id = docRef.Id;
            kerelem.Statusz = "Fuggoben";
            kerelem.Letrehozva = DateTime.UtcNow;
            await docRef.SetAsync(kerelem);
            return kerelem;
        }

        public async Task StatuszFrissites(string id, string statusz)
        {
            var docRef = _db.Collection("csereKerelmek").Document(id);
            await docRef.UpdateAsync("Statusz", statusz);
        }
    }
}
