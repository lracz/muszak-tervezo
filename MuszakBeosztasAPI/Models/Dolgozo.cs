// Dolgozó modell - a Firestore-ban tárolt munkavállaló adatai
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class Dolgozo
    {
        // A Firestore dokumentum azonosítója (nem tároljuk mezőként)
        [FirestoreDocumentId]
        public string? Id { get; set; }

        [FirestoreProperty]
        public string PreferaltNapszak { get; set; } = "";

        [FirestoreProperty]
        public string Nev { get; set; } = "";

        [FirestoreProperty]
        public string Email { get; set; } = "";

        [FirestoreProperty]
        public string Telefonszam { get; set; } = "";

        [FirestoreProperty]
        public string Pozicio { get; set; } = "";
        [FirestoreProperty]
        public string Szerepkor { get; set; } = "Dolgozo"; // "HR" vagy "Dolgozo"

        [FirestoreProperty]
        public int MaxHetiOra { get; set; } = 40;

        [FirestoreProperty]
        public int Oraber { get; set; } = 2500; // Alapértelmezett órabér

        [FirestoreProperty]
        public string JelszoHash { get; set; } = ""; // Belső loginhez egy hash
        
        [FirestoreProperty]
        public string? RefreshToken { get; set; }

        [FirestoreProperty]
        public DateTime? RefreshTokenExpiryTime { get; set; }
    }
}
