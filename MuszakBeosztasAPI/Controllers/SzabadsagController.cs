using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;

namespace MuszakBeosztasAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SzabadsagController : ControllerBase
    {
        private readonly SzabadsagService _szabadsagService;

        public SzabadsagController(SzabadsagService szabadsagService)
        {
            _szabadsagService = szabadsagService;
        }

        [HttpGet]
        public async Task<IActionResult> Get() => Ok(await _szabadsagService.OsszesLekerese());

        [HttpPost]
        public async Task<IActionResult> Post(Szabadsag szabadsag)
        {
            var uj = await _szabadsagService.Hozzaadas(szabadsag);
            return Ok(uj);
        }

        [HttpPut("{id}/statusz")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] string statusz)
        {
            await _szabadsagService.StatuszFrissites(id, statusz);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            await _szabadsagService.Torles(id);
            return Ok();
        }
    }
}
