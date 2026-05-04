using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class CsereKerelem
    {
        [FirestoreDocumentId]
        public string? Id { get; set; }

        [FirestoreProperty]
        public string KezdemenyezoId { get; set; } = "";

        [FirestoreProperty]
        public string? CeltolgozoId { get; set; } // Opcionális, ha konkrét embernek küldi

        [FirestoreProperty]
        public string MuszakId { get; set; } = "";

        [FirestoreProperty]
        public string BeosztasReszletId { get; set; } = ""; // Melyik konkrét beosztást cserélné

        [FirestoreProperty]
        public string Nap { get; set; } = "";

        [FirestoreProperty]
        public string Statusz { get; set; } = "Fuggoben"; // Fuggoben, Jovahagyva, Elutasitva

        [FirestoreProperty]
        public DateTime Letrehozva { get; set; } = DateTime.UtcNow;
    }
}
