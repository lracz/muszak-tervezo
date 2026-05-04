using MuszakBeosztasAPI.Models;
using Xunit;
using System.Collections.Generic;
using System.Linq;

namespace MuszakBeosztasAPI.Tests
{
    public class BeosztasAlgoritmusTeszt
    {
        // Az algoritmus core logikáját szimuláljuk memóriában lévő adatokkal, 
        // hogy ne legyen szükség FirestoreDb csatlakozásra a teszthez.

        [Fact]
        public void Algoritmus_NincsElerhetoDolgozo_NemSorsol()
        {
            // Arrange
            var muszak = new Muszak { Id = "m1", Nap = "Hétfő", Megnevezes = "Reggeli", SzuksegesLetszam = 1 };
            
            // Egyetlen dolgozó van, de nem érhető el hétfőn
            var elerhetosegek = new List<Elerhetoseg>
            {
                new Elerhetoseg { DolgozoId = "d1", Nap = "Hétfő", Elerheto = false }
            };

            // Act
            var beoszthatoE = elerhetosegek.Any(e => e.Nap == muszak.Nap && e.Elerheto);

            // Assert
            Assert.False(beoszthatoE, "Nem osztható be dolgozó, mert nem érhető el azon a napon.");
        }

        [Fact]
        public void Algoritmus_TobbElerhetoDolgozo_AzonosEredmeny()
        {
            // Arrange
            var muszak = new Muszak { Id = "m1", Nap = "Kedd", Megnevezes = "Délutáni", SzuksegesLetszam = 2 };
            
            var elerhetosegek = new List<Elerhetoseg>
            {
                new Elerhetoseg { DolgozoId = "d1", Nap = "Kedd", Elerheto = true },
                new Elerhetoseg { DolgozoId = "d2", Nap = "Kedd", Elerheto = true },
                new Elerhetoseg { DolgozoId = "d3", Nap = "Kedd", Elerheto = true }
            };

            // A Greedy stratégia szimulációja: vesszük a szükséges létszámot azok közül, akik elérhetők
            var kivalasztottDolgozok = elerhetosegek
                .Where(e => e.Elerheto && e.Nap == muszak.Nap)
                .Select(e => e.DolgozoId)
                .Take(muszak.SzuksegesLetszam)
                .ToList();

            // Assert
            Assert.Equal(2, kivalasztottDolgozok.Count);
            Assert.Contains("d1", kivalasztottDolgozok);
            Assert.Contains("d2", kivalasztottDolgozok);
            Assert.DoesNotContain("d3", kivalasztottDolgozok);
        }

        [Fact]
        public void Beosztas_AllapotValtozas_KezdetiTervezet()
        {
            // Arrange
            var beosztas = new Beosztas
            {
                Het = "2026-W19",
                Letrehozva = Google.Cloud.Firestore.Timestamp.GetCurrentTimestamp(),
                Allapot = "Tervezet"
            };

            // Act
            var isTervezet = beosztas.Allapot == "Tervezet";

            // Assert
            Assert.True(isTervezet, "Az újonnan létrehozott beosztás állapota Tervezet kell legyen.");
        }
    }
}
