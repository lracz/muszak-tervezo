// Program.cs - Az alkalmazás belépési pontja
using Google.Cloud.Firestore;
using MuszakBeosztasAPI.Services;
using MuszakBeosztasAPI.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Firestore beállítása
// Cloud környezetben a GOOGLE_CREDENTIALS_JSON env varból olvassuk a service account JSON-t,
// lokálisan a firebase-config.json fájlból.
var credentialsJson = Environment.GetEnvironmentVariable("GOOGLE_CREDENTIALS_JSON");
if (!string.IsNullOrEmpty(credentialsJson))
{
    // Felhőben: a JSON stringet ideiglenes fájlba mentjük és arra mutatunk
    var tempPath = Path.Combine(Path.GetTempPath(), "firebase-config.json");
    File.WriteAllText(tempPath, credentialsJson);
    Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", tempPath);
    Console.WriteLine("Firebase: Credentials loaded from GOOGLE_CREDENTIALS_JSON environment variable.");
}
else
{
    // Lokálisan: a projekt mappából
    var firebaseKonfigUtvonal = Path.Combine(Directory.GetCurrentDirectory(), "firebase-config.json");
    Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", firebaseKonfigUtvonal);
    Console.WriteLine("Firebase: Credentials loaded from firebase-config.json file.");
}

// A projekt azonosítót a firebase-config.json fájlból olvassa ki automatikusan
var projektAzonosito = builder.Configuration["Firebase:ProjektAzonosito"] 
    ?? Environment.GetEnvironmentVariable("FIREBASE_PROJECT_ID") 
    ?? "muszak-tervezo";
var firestoreDb = FirestoreDb.Create(projektAzonosito);

// Szolgáltatások regisztrálása
builder.Services.AddSingleton(firestoreDb);
builder.Services.AddScoped<DolgozoService>();
builder.Services.AddScoped<MuszakService>();
builder.Services.AddScoped<ElerhetosegService>();
builder.Services.AddScoped<BeosztasService>();

// JWT Konfiguráció
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? builder.Configuration["Jwt:Key"] 
    ?? "NagyonTitkosKulcs1234567890NagyonTitkosKulcs";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MuszakAPI",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MuszakAPI",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Pld: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Response Compression a teljesítményoptimalizáláshoz
builder.Services.AddResponseCompression(beallitasok =>
{
    beallitasok.EnableForHttps = true;
});

// CORS beállítása - dinamikus originek a lokális és felhős futtatáshoz
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(",") 
    ?? new[] { "http://localhost:5173" };
builder.Services.AddCors(beallitasok =>
{
    beallitasok.AddPolicy("ReactKliens", szabaly =>
    {
        szabaly.WithOrigins(allowedOrigins)
               .AllowAnyHeader()
               .AllowAnyMethod();
    });
});

// Rate Limiting (Brute-Force védelem a loginra)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });
});

var app = builder.Build();

// Swagger csak fejlesztési módban
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // HSTS bekapcsolása Production környezetben
    app.UseHsts();
}

// HTTPS kikényszerítése
app.UseHttpsRedirection();

// Middleware-ek
app.UseMiddleware<GlobalExceptionHandler>();
app.UseResponseCompression();
app.UseCors("ReactKliens");

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();

Console.WriteLine("=== Műszak Beosztás API elindult ===");
Console.WriteLine($"Firestore projekt: {projektAzonosito}");
Console.WriteLine("Swagger UI: http://localhost:5148/swagger");

app.Run();
