// Dolgozó controller - REST API végpontok
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DolgozoController : ControllerBase
    {
        private readonly DolgozoService _szolgaltatas;

        public DolgozoController(DolgozoService szolgaltatas)
        {
            _szolgaltatas = szolgaltatas;
        }

        // GET api/dolgozo - Összes dolgozó lekérdezése
        [HttpGet]
        public async Task<ActionResult<List<Dolgozo>>> OsszesLekerdezes()
        {
            try
            {
                var dolgozok = await _szolgaltatas.OsszesLekerese();
                return Ok(dolgozok);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // GET api/dolgozo/{id} - Egy dolgozó lekérdezése
        [HttpGet("{id}")]
        public async Task<ActionResult<Dolgozo>> EgyLekerdezes(string id)
        {
            try
            {
                var dolgozo = await _szolgaltatas.EgyLekerese(id);

                if (dolgozo == null)
                    return NotFound("A dolgozó nem található.");

                return Ok(dolgozo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // POST api/dolgozo - Új dolgozó hozzáadása
        [HttpPost]
        public async Task<ActionResult<Dolgozo>> Letrehozas([FromBody] Dolgozo dolgozo)
        {
            try
            {
                if (string.IsNullOrEmpty(dolgozo.Nev))
                    return BadRequest("A dolgozó neve kötelező.");

                var ujDolgozo = await _szolgaltatas.Letrehozas(dolgozo);
                return CreatedAtAction(nameof(EgyLekerdezes), new { id = ujDolgozo.Id }, ujDolgozo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // PUT api/dolgozo/{id} - Dolgozó frissítése
        [HttpPut("{id}")]
        public async Task<ActionResult> Frissites(string id, [FromBody] Dolgozo dolgozo)
        {
            try
            {
                var spikerult = await _szolgaltatas.Frissites(id, dolgozo);

                if (!spikerult)
                    return NotFound("A dolgozó nem található.");

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // DELETE api/dolgozo/{id} - Dolgozó törlése
        [HttpDelete("{id}")]
        public async Task<ActionResult> Torles(string id)
        {
            try
            {
                var sikerult = await _szolgaltatas.Torles(id);

                if (!sikerult)
                    return NotFound("A dolgozó nem található.");

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }
    }
}
