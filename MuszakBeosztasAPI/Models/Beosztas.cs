// Beosztás modell - egy heti beosztás fejléc adatai
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class Beosztas
    {
        // A Firestore dokumentum azonosítója
        [FirestoreDocumentId]
        public string? Id { get; set; }

        [FirestoreProperty]
        public string Het { get; set; } = "";

        [FirestoreProperty]
        public string Allapot { get; set; } = "Tervezet";

        [FirestoreProperty]
        public Timestamp Letrehozva { get; set; }

        [FirestoreProperty]
        public List<BeosztasReszlet> Reszletek { get; set; } = new List<BeosztasReszlet>();
    }
}
