// Elérhetőség modell - a dolgozó mikor érhető el
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class Elerhetoseg
    {
        // A Firestore dokumentum azonosítója
        public string? Id { get; set; }

        [FirestoreProperty]
        public string DolgozoId { get; set; } = "";

        [FirestoreProperty]
        public string Nap { get; set; } = "";

        [FirestoreProperty]
        public bool Elerheto { get; set; } = true;

        [FirestoreProperty]
        public string Megjegyzes { get; set; } = "";
    }
}
