// Műszak modell - a Firestore-ban tárolt műszak típus adatai
using Google.Cloud.Firestore;

namespace MuszakBeosztasAPI.Models
{
    [FirestoreData]
    public class Muszak
    {
        // A Firestore dokumentum azonosítója (nem tároljuk mezőként)
        public string? Id { get; set; }

        [FirestoreProperty]
        public string Megnevezes { get; set; } = "";

        [FirestoreProperty]
        public string Kezdes { get; set; } = "";

        [FirestoreProperty]
        public string Befejezes { get; set; } = "";

        [FirestoreProperty]
        public string Nap { get; set; } = "";

        [FirestoreProperty]
        public int SzuksegesLetszam { get; set; } = 1;

        [FirestoreProperty]
        public string Pozicio { get; set; } = "Vegyes";
    }
}
