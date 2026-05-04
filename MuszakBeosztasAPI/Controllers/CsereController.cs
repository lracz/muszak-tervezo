using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CsereController : ControllerBase
    {
        private readonly CsereService _csereService;

        public CsereController(CsereService csereService)
        {
            _csereService = csereService;
        }

        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _csereService.OsszesLekerese());

        [HttpPost]
        public async Task<IActionResult> Post(CsereKerelem kerelem)
        {
            var uj = await _csereService.Hozzaadas(kerelem);
            return Ok(uj);
        }

        [HttpPut("{id}/statusz")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string statusz)
        {
            await _csereService.StatuszFrissites(id, statusz);
            return Ok();
        }
    }
}
