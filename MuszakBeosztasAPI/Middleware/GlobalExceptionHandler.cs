// Globális hibakezelő middleware - strukturált hibaválaszok
using System.Net;
using System.Text.Json;

namespace MuszakBeosztasAPI.Middleware
{
    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _kovetkezo;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(RequestDelegate kovetkezo, ILogger<GlobalExceptionHandler> logger)
        {
            _kovetkezo = kovetkezo;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext kontextus)
        {
            try
            {
                await _kovetkezo(kontextus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Nem kezelt kivétel történt: {Uzenet}", ex.Message);
                await HibaValaszKuldese(kontextus, ex);
            }
        }

        private static async Task HibaValaszKuldese(HttpContext kontextus, Exception kivet)
        {
            kontextus.Response.ContentType = "application/json";
            kontextus.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var hibaValasz = new
            {
                statusCode = kontextus.Response.StatusCode,
                message = "Szerverhiba történt.",
                detail = kivet.Message,
                timestamp = DateTime.UtcNow
            };

            var json = JsonSerializer.Serialize(hibaValasz, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await kontextus.Response.WriteAsync(json);
        }
    }
}
