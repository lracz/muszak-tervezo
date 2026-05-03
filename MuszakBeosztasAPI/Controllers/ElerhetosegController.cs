// Elérhetőség controller - REST API végpontok a dolgozói elérhetőségekhez
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ElerhetosegController : ControllerBase
    {
        private readonly ElerhetosegService _szolgaltatas;

        public ElerhetosegController(ElerhetosegService szolgaltatas)
        {
            _szolgaltatas = szolgaltatas;
        }

        // GET api/elerhetoseg - Összes elérhetőség lekérdezése
        [HttpGet]
        public async Task<ActionResult<List<Elerhetoseg>>> OsszesLekerdezes()
        {
            try
            {
                var lista = await _szolgaltatas.OsszesLekerese();
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // GET api/elerhetoseg/dolgozo/{dolgozoId} - Egy dolgozó elérhetőségei
        [HttpGet("dolgozo/{dolgozoId}")]
        public async Task<ActionResult<List<Elerhetoseg>>> DolgozoElerhetosegei(string dolgozoId)
        {
            try
            {
                var lista = await _szolgaltatas.DolgozoElerhetosegei(dolgozoId);
                return Ok(lista);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // POST api/elerhetoseg - Új elérhetőség hozzáadása
        [HttpPost]
        public async Task<ActionResult<Elerhetoseg>> Letrehozas([FromBody] Elerhetoseg elerhetoseg)
        {
            try
            {
                if (string.IsNullOrEmpty(elerhetoseg.DolgozoId))
                    return BadRequest("A dolgozó azonosítója kötelező.");
                if (string.IsNullOrEmpty(elerhetoseg.Nap))
                    return BadRequest("A nap megadása kötelező.");

                var ujElerhetoseg = await _szolgaltatas.Letrehozas(elerhetoseg);
                return CreatedAtAction(nameof(OsszesLekerdezes), new { }, ujElerhetoseg);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // PUT api/elerhetoseg/{id} - Elérhetőség frissítése
        [HttpPut("{id}")]
        public async Task<ActionResult> Frissites(string id, [FromBody] Elerhetoseg elerhetoseg)
        {
            try
            {
                var sikerult = await _szolgaltatas.Frissites(id, elerhetoseg);
                if (!sikerult)
                    return NotFound("Az elérhetőség nem található.");
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // DELETE api/elerhetoseg/{id} - Elérhetőség törlése
        [HttpDelete("{id}")]
        public async Task<ActionResult> Torles(string id)
        {
            try
            {
                var sikerult = await _szolgaltatas.Torles(id);
                if (!sikerult)
                    return NotFound("Az elérhetőség nem található.");
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }
    }
}
