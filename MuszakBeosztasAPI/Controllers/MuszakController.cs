// Műszak controller - REST API végpontok a műszakokhoz
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MuszakController : ControllerBase
    {
        private readonly MuszakService _szolgaltatas;

        public MuszakController(MuszakService szolgaltatas)
        {
            _szolgaltatas = szolgaltatas;
        }

        // GET api/muszak - Összes műszak lekérdezése
        [HttpGet]
        public async Task<ActionResult<List<Muszak>>> OsszesLekerdezes()
        {
            try
            {
                var muszakok = await _szolgaltatas.OsszesLekerese();
                return Ok(muszakok);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // GET api/muszak/{id} - Egy műszak lekérdezése
        [HttpGet("{id}")]
        public async Task<ActionResult<Muszak>> EgyLekerdezes(string id)
        {
            try
            {
                var muszak = await _szolgaltatas.EgyLekerese(id);
                if (muszak == null)
                    return NotFound("A műszak nem található.");
                return Ok(muszak);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // POST api/muszak - Új műszak hozzáadása
        [HttpPost]
        public async Task<ActionResult<Muszak>> Letrehozas([FromBody] Muszak muszak)
        {
            try
            {
                if (string.IsNullOrEmpty(muszak.Megnevezes))
                    return BadRequest("A műszak megnevezése kötelező.");
                if (string.IsNullOrEmpty(muszak.Kezdes) || string.IsNullOrEmpty(muszak.Befejezes))
                    return BadRequest("A kezdési és befejezési időpont kötelező.");

                var ujMuszak = await _szolgaltatas.Letrehozas(muszak);
                return CreatedAtAction(nameof(EgyLekerdezes), new { id = ujMuszak.Id }, ujMuszak);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // PUT api/muszak/{id} - Műszak frissítése
        [HttpPut("{id}")]
        public async Task<ActionResult> Frissites(string id, [FromBody] Muszak muszak)
        {
            try
            {
                var sikerult = await _szolgaltatas.Frissites(id, muszak);
                if (!sikerult)
                    return NotFound("A műszak nem található.");
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // DELETE api/muszak/{id} - Műszak törlése
        [HttpDelete("{id}")]
        public async Task<ActionResult> Torles(string id)
        {
            try
            {
                var sikerult = await _szolgaltatas.Torles(id);
                if (!sikerult)
                    return NotFound("A műszak nem található.");
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }
    }
}
