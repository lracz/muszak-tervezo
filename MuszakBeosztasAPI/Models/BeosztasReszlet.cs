// Beosztás részlet modell - egy dolgozó hozzárendelése egy műszakhoz egy adott napon
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class BeosztasReszlet
    {
        // A Firestore dokumentum azonosítója
        public string? Id { get; set; }

        [FirestoreProperty]
        public string BeosztasId { get; set; } = "";

        [FirestoreProperty]
        public string MuszakId { get; set; } = "";

        [FirestoreProperty]
        public string DolgozoId { get; set; } = "";

        [FirestoreProperty]
        public string Nap { get; set; } = "";
    }
}
