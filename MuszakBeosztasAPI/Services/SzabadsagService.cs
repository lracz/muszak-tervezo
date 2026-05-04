using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Models;

namespace MuszakBeosztasAPI.Services
{
    public class SzabadsagService
    {
        private readonly FirestoreDb _db;

        public SzabadsagService(FirestoreDb db)
        {
            _db = db;
        }

        public async Task<List<Szabadsag>> OsszesLekerese()
        {
            var snapshot = await _db.Collection("szabadsagok").GetSnapshotAsync();
            return snapshot.Documents.Select(d => d.ConvertTo<Szabadsag>()).ToList();
        }

        public async Task<Szabadsag> Hozzaadas(Szabadsag szabadsag)
        {
            var docRef = _db.Collection("szabadsagok").Document();
            szabadsag.Id = docRef.Id;
            await docRef.SetAsync(szabadsag);
            return szabadsag;
        }

        public async Task StatuszFrissites(string id, string statusz)
        {
            var docRef = _db.Collection("szabadsagok").Document(id);
            await docRef.UpdateAsync("Statusz", statusz);
        }

        public async Task Torles(string id)
        {
            await _db.Collection("szabadsagok").Document(id).DeleteAsync();
        }
    }
}
