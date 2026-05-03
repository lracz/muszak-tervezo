using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MuszakBeosztasAPI.Models;
using MuszakBeosztasAPI.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace MuszakBeosztasAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DolgozoService _dolgozoService;
        private readonly IConfiguration _configuration;

        public AuthController(DolgozoService dolgozoService, IConfiguration configuration)
        {
            _dolgozoService = dolgozoService;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var dolgozok = await _dolgozoService.OsszesLekerese();
            // A könnyebb belépés miatt Név vagy ID alapján is megkeressük
            var user = dolgozok.FirstOrDefault(d => 
                d.Id == request.Identifier || 
                d.Nev.Equals(request.Identifier, StringComparison.OrdinalIgnoreCase));

            if (user == null)
            {
                return Unauthorized(new { Message = "Nem található ilyen dolgozó!" });
            }

            // BCrypt jelszó ellenőrzés
            if (string.IsNullOrEmpty(user.JelszoHash))
            {
                return Unauthorized(new { Message = "Nincs jelszó beállítva ehhez a fiókhoz. Kérlek, regisztrálj egy új fiókot!" });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Jelszo, user.JelszoHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { Message = "Hibás jelszó!" });
            }

            // Ha nincs explicitly megadva Szerepkor, akkor legyen 'Dolgozo'
            var role = string.IsNullOrEmpty(user.Szerepkor) ? "Dolgozo" : user.Szerepkor;

            // JWT Token generálása (15 perc)
            var token = GenerateJwtToken(user, role);
            var refreshToken = GenerateRefreshToken();

            // Refresh token mentése a DB-be (7 nap élettartam)
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _dolgozoService.Frissites(user.Id, user);

            return Ok(new 
            { 
                Token = token, 
                RefreshToken = refreshToken,
                Dolgozo = new { user.Id, user.Nev, Szerepkor = role } 
            });
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenDto request)
        {
            if (string.IsNullOrEmpty(request.RefreshToken) || string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new { Message = "Érvénytelen kérés." });
            }

            var user = await _dolgozoService.EgyLekerese(request.UserId);
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized(new { Message = "Érvénytelen vagy lejárt Refresh Token. Kérlek, jelentkezz be újra!" });
            }

            var role = string.IsNullOrEmpty(user.Szerepkor) ? "Dolgozo" : user.Szerepkor;
            
            // Új JWT és Új Refresh Token
            var newJwt = GenerateJwtToken(user, role);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _dolgozoService.Frissites(user.Id, user);

            return Ok(new 
            { 
                Token = newJwt, 
                RefreshToken = newRefreshToken,
                Dolgozo = new { user.Id, user.Nev, Szerepkor = role } 
            });
        }

        private string GenerateJwtToken(Dolgozo user, string role)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"] ?? "NagyonTitkosKulcs1234567890NagyonTitkosKulcs");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim("Nev", user.Nev),
                new Claim(ClaimTypes.Role, role)
            };

            var credentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"] ?? "MuszakAPI",
                audience: jwtSettings["Audience"] ?? "MuszakAPI",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15), // 15 perc az új iparági sztenderd
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        [HttpPost("register")]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (string.IsNullOrEmpty(request.Nev) || string.IsNullOrEmpty(request.Jelszo))
            {
                return BadRequest(new { Message = "A név és a jelszó megadása kötelező!" });
            }

            // Jelszó komplexitás validálás
            var passwordRegex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$");
            if (!passwordRegex.IsMatch(request.Jelszo))
            {
                return BadRequest(new { Message = "A jelszónak legalább 8 karakter hosszúnak kell lennie, és tartalmaznia kell legalább egy kisbetűt, egy nagybetűt és egy számot!" });
            }

            var ujDolgozo = new Dolgozo
            {
                Nev = request.Nev,
                JelszoHash = BCrypt.Net.BCrypt.HashPassword(request.Jelszo),
                Szerepkor = string.IsNullOrEmpty(request.Szerepkor) ? "Dolgozo" : request.Szerepkor,
                Pozicio = string.IsNullOrEmpty(request.Pozicio) ? "Új dolgozó" : request.Pozicio,
                Email = request.Email ?? "",
                MaxHetiOra = 40
            };

            await _dolgozoService.Letrehozas(ujDolgozo);

            var token = GenerateJwtToken(ujDolgozo, ujDolgozo.Szerepkor);
            var refreshToken = GenerateRefreshToken();
            
            ujDolgozo.RefreshToken = refreshToken;
            ujDolgozo.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _dolgozoService.Frissites(ujDolgozo.Id, ujDolgozo);

            return Ok(new 
            { 
                Token = token, 
                RefreshToken = refreshToken,
                Dolgozo = new { ujDolgozo.Id, ujDolgozo.Nev, Szerepkor = ujDolgozo.Szerepkor } 
            });
        }
    }

    public class LoginDto
    {
        public string Identifier { get; set; } // Nev vagy ID
        public string Jelszo { get; set; }
    }

    public class RegisterDto
    {
        public string Nev { get; set; }
        public string Jelszo { get; set; }
        public string Szerepkor { get; set; } // HR vagy Dolgozo
        public string Pozicio { get; set; }
        public string Email { get; set; }
    }

    public class RefreshTokenDto
    {
        public string UserId { get; set; }
        public string RefreshToken { get; set; }
    }
}
