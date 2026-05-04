using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class Szabadsag
    {
        [FirestoreDocumentId]
        public string? Id { get; set; }

        [FirestoreProperty]
        public string DolgozoId { get; set; } = "";

        [FirestoreProperty]
        public DateTime Mettol { get; set; }

        [FirestoreProperty]
        public DateTime Meddig { get; set; }

        [FirestoreProperty]
        public string Tipus { get; set; } = "Fizetett"; // Fizetett, Betegszabadsag, FizetesNelkuli

        [FirestoreProperty]
        public string Statusz { get; set; } = "Fuggoben"; // Fuggoben, Jovahagyva, Elutasitva

        [FirestoreProperty]
        public string? Indoklas { get; set; }
    }
}
