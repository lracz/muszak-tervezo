// Beosztás controller - REST API végpontok a beosztás generáláshoz és kezeléshez
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BeosztasController : ControllerBase
    {
        private readonly BeosztasService _szolgaltatas;

        public BeosztasController(BeosztasService szolgaltatas)
        {
            _szolgaltatas = szolgaltatas;
        }

        // POST api/beosztas/general/{het} - Beosztás generálása az adott hétre
        [HttpPost("general/{het}")]
        public async Task<ActionResult> Generalas(string het)
        {
            try
            {
                if (string.IsNullOrEmpty(het))
                    return BadRequest("A hét azonosítója kötelező (pl. 2026-W19).");

                var beosztas = await _szolgaltatas.BeosztasGeneralas(het);
                return CreatedAtAction(nameof(HetiBeosztas), new { het }, beosztas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba a generálás során: {ex.Message}");
            }
        }

        // GET api/beosztas/{het} - Heti beosztás lekérdezése
        [HttpGet("{het}")]
        public async Task<ActionResult> HetiBeosztas(string het)
        {
            try
            {
                var eredmeny = await _szolgaltatas.HetiBeosztasLekerdezese(het);

                if (eredmeny == null)
                    return NotFound($"Nincs beosztás a(z) {het} hétre.");

                return Ok(eredmeny);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }

        // PUT api/beosztas/{id}/veglegesit - Beosztás véglegesítése
        [HttpPut("{id}/veglegesit")]
        public async Task<ActionResult> Veglegesites(string id)
        {
            try
            {
                var sikerult = await _szolgaltatas.Veglegesites(id);

                if (!sikerult)
                    return NotFound("A beosztás nem található.");

                return Ok(new { uzenet = "A beosztás véglegesítve." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Szerverhiba: {ex.Message}");
            }
        }
    }
}
