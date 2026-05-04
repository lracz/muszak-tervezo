using MuszakBeosztasAPI.Models;
using Xunit;

namespace MuszakBeosztasAPI.Tests
{
    public class DolgozoTeszt
    {
        [Fact]
        public void Dolgozo_AdatokHelyesek_Letrejott()
        {
            // Arrange
            var dolgozo = new Dolgozo
            {
                Id = "test-123",
                Nev = "Teszt Elek",
                Email = "teszt@example.com",
                MaxHetiOra = 40
            };

            // Act
            var nevUres = string.IsNullOrEmpty(dolgozo.Nev);

            // Assert
            Assert.False(nevUres, "A dolgozó neve nem lehet üres.");
            Assert.Equal(40, dolgozo.MaxHetiOra);
        }

        [Theory]
        [InlineData("Kis Pista", "kis@example.com", 20)]
        [InlineData("Nagy Lajos", "nagy@example.com", 30)]
        public void Dolgozo_Reszmunkaidos_Helyes(string nev, string email, int orak)
        {
            // Arrange
            var dolgozo = new Dolgozo
            {
                Nev = nev,
                Email = email,
                MaxHetiOra = orak,
                Pozicio = "Részmunkaidős"
            };

            // Act & Assert
            Assert.True(dolgozo.MaxHetiOra < 40, "A részmunkaidős dolgozónak 40 óránál kevesebb heti munkaideje kell legyen.");
            Assert.Equal(nev, dolgozo.Nev);
        }
    }
}
