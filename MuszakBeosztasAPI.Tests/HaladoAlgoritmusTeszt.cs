using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;
using System.Collections.Generic;
using System.Reflection;
using Xunit;

namespace MuszakBeosztasAPI.Tests
{
    public class HaladoAlgoritmusTeszt
    {
        [Fact]
        public void Backtracking_KotelezoPihenoIdo_Megsertese_Eseten_Elutasit()
        {
            // Arrange
            // Nem kell adatbázis kapcsolat, csak a service példánya
            var service = new BeosztasService(null, null, null, null);
            
            var dolgozo = new Dolgozo { Id = "d1", Nev = "Teszt", MaxHetiOra = 40 };
            var maiMuszak = new Muszak { Id = "m_mai", Megnevezes = "Reggeli", Kezdes = "06:00", Befejezes = "14:00" };
            
            // Tegyük fel, hogy tegnap (Hétfőn) "Éjszakai" műszakja volt
            var elozoBeosztasok = new List<BeosztasReszlet>
            {
                new BeosztasReszlet { DolgozoId = "d1", Nap = "Hétfő", MuszakId = "m_ejszaka" }
            };

            var hetiOrak = new Dictionary<string, int> { { "d1", 8 } };
            var elerhetosegek = new List<Elerhetoseg> { new Elerhetoseg { DolgozoId = "d1", Nap = "Kedd", Elerheto = true } };

            // Act - A private "ValidE" metódus meghívása reflexióval
            MethodInfo validEMethod = typeof(BeosztasService).GetMethod("ValidE", BindingFlags.NonPublic | BindingFlags.Instance);
            
            // paraméterek: dolgozo, nap, muszak, elerhetosegek, hetiOrak, beosztas
            object[] parameters = new object[] { dolgozo, "Kedd", maiMuszak, elerhetosegek, hetiOrak, elozoBeosztasok };
            
            bool eredmeny = (bool)validEMethod.Invoke(service, parameters);

            // Assert
            // A Hard Constraint-nek el kell utasítania, mert előző nap dolgozott (az algoritmusban most ideiglenesen minden előző napi műszak után tilt a kód ha ma reggelis)
            Assert.False(eredmeny, "A kötelező pihenőidőt (éjszaka utáni reggelizés) az NP constraint solvernek el kell utasítania.");
        }

        [Fact]
        public void Backtracking_MaxOrakSzamanak_Kiszurese()
        {
            // Arrange
            var service = new BeosztasService(null, null, null, null);
            var dolgozo = new Dolgozo { Id = "d1", MaxHetiOra = 10 }; // Max 10 óra
            var ujMuszak = new Muszak { Id = "m1", Kezdes = "08:00", Befejezes = "16:00" }; // 8 órás műszak
            
            var hetiOrak = new Dictionary<string, int> { { "d1", 8 } }; // Már dolgozott 8 órát!

            var elerhetosegek = new List<Elerhetoseg> { new Elerhetoseg { DolgozoId = "d1", Nap = "Kedd", Elerheto = true } };
            var jelenlegiBeosztas = new List<BeosztasReszlet>();

            // Act
            MethodInfo validEMethod = typeof(BeosztasService).GetMethod("ValidE", BindingFlags.NonPublic | BindingFlags.Instance);
            object[] parameters = new object[] { dolgozo, "Kedd", ujMuszak, elerhetosegek, hetiOrak, jelenlegiBeosztas };
            bool eredmeny = (bool)validEMethod.Invoke(service, parameters);

            // Assert
            Assert.False(eredmeny, "A dolgozó nem osztható be, mert a 8+8 = 16 óra túllépné a megengedett 10 órát.");
        }
    }
}
