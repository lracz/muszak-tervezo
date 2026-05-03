using Microsoft.AspNetCore.Mvc;
using MuszakBeosztasAPI.Services;
using System.Text;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExportController : ControllerBase
    {
        private readonly BeosztasService _beosztasService;

        public ExportController(BeosztasService beosztasService)
        {
            _beosztasService = beosztasService;
        }

        [HttpGet("csv/{het}")]
        public async Task<IActionResult> ExportCsv(string het)
        {
            var beosztas = await _beosztasService.HetiBeosztasLekerdezese(het);
            if (beosztas == null) return NotFound("Erre a hétre nincs beosztás.");

            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine("DolgozoId,Nap,MuszakId");

            foreach (var reszlet in beosztas.Reszletek.OrderBy(r => r.Nap))
            {
                csvBuilder.AppendLine($"{reszlet.DolgozoId},{reszlet.Nap},{reszlet.MuszakId}");
            }

            var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv", $"beosztas_{het}.csv");
        }

        [HttpGet("ical/{het}/{dolgozoId}")]
        public async Task<IActionResult> ExportICal(string het, string dolgozoId)
        {
            var beosztas = await _beosztasService.HetiBeosztasLekerdezese(het);
            if (beosztas == null) return NotFound("Erre a hétre nincs beosztás.");

            var sajatReszletek = beosztas.Reszletek.Where(r => r.DolgozoId == dolgozoId).ToList();

            var iCalBuilder = new StringBuilder();
            iCalBuilder.AppendLine("BEGIN:VCALENDAR");
            iCalBuilder.AppendLine("VERSION:2.0");
            iCalBuilder.AppendLine("PRODID:-//Muszak Tervezo//HU");

            // Napok mapolása dátumra (Mivel nincs konkrét naptári napunk, csak "Hétfő", egy fiktív jövőheti dátumot adunk)
            DateTime alapDatum = GetNextMonday();
            var napokSzotar = new Dictionary<string, int> { {"Hétfő", 0}, {"Kedd", 1}, {"Szerda", 2}, {"Csütörtök", 3}, {"Péntek", 4}, {"Szombat", 5}, {"Vasárnap", 6} };

            foreach (var reszlet in sajatReszletek)
            {
                if (napokSzotar.TryGetValue(reszlet.Nap, out int napToltes))
                {
                    DateTime esemenyDatum = alapDatum.AddDays(napToltes);
                    string dstart = esemenyDatum.ToString("yyyyMMddT080000Z"); // Fix reggel 8 kezdés a demó miatt
                    string dend = esemenyDatum.ToString("yyyyMMddT160000Z"); // Fix du 4 befejezés a demó miatt

                    iCalBuilder.AppendLine("BEGIN:VEVENT");
                    iCalBuilder.AppendLine($"UID:{Guid.NewGuid()}@muszaktervezo.hu");
                    iCalBuilder.AppendLine($"DTSTAMP:{DateTime.UtcNow:yyyyMMddTHHmmssZ}");
                    iCalBuilder.AppendLine($"DTSTART:{dstart}");
                    iCalBuilder.AppendLine($"DTEND:{dend}");
                    iCalBuilder.AppendLine($"SUMMARY:Műszak - {reszlet.MuszakId}");
                    iCalBuilder.AppendLine("END:VEVENT");
                }
            }

            iCalBuilder.AppendLine("END:VCALENDAR");

            var bytes = Encoding.UTF8.GetBytes(iCalBuilder.ToString());
            return File(bytes, "text/calendar", $"beosztas_{het}_{dolgozoId}.ics");
        }

        private DateTime GetNextMonday()
        {
            DateTime date = DateTime.Today;
            int daysUntilMonday = ((int)DayOfWeek.Monday - (int)date.DayOfWeek + 7) % 7;
            if (daysUntilMonday == 0) daysUntilMonday = 7;
            return date.AddDays(daysUntilMonday);
        }
    }
}
