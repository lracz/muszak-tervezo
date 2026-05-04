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
        private readonly DolgozoService _dolgozoService;
        private readonly MuszakService _muszakService;

        public ExportController(BeosztasService beosztasService, DolgozoService dolgozoService, MuszakService muszakService)
        {
            _beosztasService = beosztasService;
            _dolgozoService = dolgozoService;
            _muszakService = muszakService;
        }

        [HttpGet("csv/{het}")]
        public async Task<IActionResult> ExportCsv(string het)
        {
            var beosztas = await _beosztasService.HetiBeosztasLekerdezese(het);
            if (beosztas == null) return NotFound("Erre a hétre nincs beosztás.");

            var dolgozok = await _dolgozoService.OsszesLekerese();
            var muszakok = await _muszakService.OsszesLekerese();

            var csvBuilder = new StringBuilder();
            // UTF-8 BOM az Excelnek
            csvBuilder.Append('\uFEFF');
            csvBuilder.AppendLine("Dolgozó;Nap;Műszak;Kezdés;Befejezés");

            foreach (var reszlet in beosztas.Reszletek.OrderBy(r => GetNapIndex(r.Nap)))
            {
                var dolgozo = dolgozok.FirstOrDefault(d => d.Id == reszlet.DolgozoId);
                var muszak = muszakok.FirstOrDefault(m => m.Id == reszlet.MuszakId);
                
                string nev = dolgozo?.Nev ?? "Ismeretlen";
                string mNev = muszak?.Megnevezes ?? "Ismeretlen";
                string kezdes = muszak?.Kezdes ?? "";
                string veg = muszak?.Befejezes ?? "";

                csvBuilder.AppendLine($"{nev};{reszlet.Nap};{mNev};{kezdes};{veg}");
            }

            var bytes = Encoding.UTF8.GetBytes(csvBuilder.ToString());
            return File(bytes, "text/csv; charset=utf-8", $"beosztas_{het}.csv");
        }

        [HttpGet("ical/{het}/{dolgozoId}")]
        public async Task<IActionResult> ExportICal(string het, string dolgozoId)
        {
            var beosztas = await _beosztasService.HetiBeosztasLekerdezese(het);
            if (beosztas == null) return NotFound("Erre a hétre nincs beosztás.");

            var muszakok = await _muszakService.OsszesLekerese();
            var sajatReszletek = beosztas.Reszletek.Where(r => r.DolgozoId == dolgozoId).ToList();

            var iCalBuilder = new StringBuilder();
            iCalBuilder.AppendLine("BEGIN:VCALENDAR");
            iCalBuilder.AppendLine("VERSION:2.0");
            iCalBuilder.AppendLine("PRODID:-//Muszak Tervezo//HU");
            iCalBuilder.AppendLine("CALSCALE:GREGORIAN");

            DateTime alapDatum = GetNextMonday();
            var napokSzotar = new Dictionary<string, int> { {"Hétfő", 0}, {"Kedd", 1}, {"Szerda", 2}, {"Csütörtök", 3}, {"Péntek", 4}, {"Szombat", 5}, {"Vasárnap", 6} };

            foreach (var reszlet in sajatReszletek)
            {
                var muszak = muszakok.FirstOrDefault(m => m.Id == reszlet.MuszakId);
                if (muszak != null && napokSzotar.TryGetValue(reszlet.Nap, out int napToltes))
                {
                    DateTime esemenyDatum = alapDatum.AddDays(napToltes);
                    
                    // Kezdés és végidő kinyerése (HH:mm formátumból)
                    var kezdesArr = muszak.Kezdes.Split(':');
                    var vegArr = muszak.Befejezes.Split(':');
                    
                    int kOra = int.Parse(kezdesArr[0]);
                    int kPerc = int.Parse(kezdesArr[1]);
                    int vOra = int.Parse(vegArr[0]);
                    int vPerc = int.Parse(vegArr[1]);

                    DateTime start = esemenyDatum.Date.AddHours(kOra).AddMinutes(kPerc);
                    DateTime end = esemenyDatum.Date.AddHours(vOra).AddMinutes(vPerc);
                    if (end < start) end = end.AddDays(1); // Éjszakai műszak kezelése

                    iCalBuilder.AppendLine("BEGIN:VEVENT");
                    iCalBuilder.AppendLine($"UID:{Guid.NewGuid()}@muszaktervezo.hu");
                    iCalBuilder.AppendLine($"DTSTAMP:{DateTime.UtcNow:yyyyMMddTHHmmssZ}");
                    iCalBuilder.AppendLine($"DTSTART:{start.ToUniversalTime():yyyyMMddTHHmmssZ}");
                    iCalBuilder.AppendLine($"DTEND:{end.ToUniversalTime():yyyyMMddTHHmmssZ}");
                    iCalBuilder.AppendLine($"SUMMARY:Műszak: {muszak.Megnevezes}");
                    iCalBuilder.AppendLine($"DESCRIPTION:Pozíció: {muszak.Pozicio}");
                    iCalBuilder.AppendLine("END:VEVENT");
                }
            }

            iCalBuilder.AppendLine("END:VCALENDAR");

            var bytes = Encoding.UTF8.GetBytes(iCalBuilder.ToString());
            return File(bytes, "text/calendar; charset=utf-8", $"beosztas_{het}_{dolgozoId}.ics");
        }

        private int GetNapIndex(string nap)
        {
            var napok = new[] { "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap" };
            return Array.IndexOf(napok, nap);
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
