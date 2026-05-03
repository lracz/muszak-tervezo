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
// A GOOGLE_APPLICATION_CREDENTIALS környezeti változóra van szükség,
// amely a firebase-config.json fájlra mutat
var firebaseKonfigUtvonal = Path.Combine(Directory.GetCurrentDirectory(), "firebase-config.json");
Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", firebaseKonfigUtvonal);

// A projekt azonosítót a firebase-config.json fájlból olvassa ki automatikusan
var projektAzonosito = builder.Configuration["Firebase:ProjektAzonosito"] ?? "muszak-beosztas";
var firestoreDb = FirestoreDb.Create(projektAzonosito);

// Szolgáltatások regisztrálása
builder.Services.AddSingleton(firestoreDb);
builder.Services.AddScoped<DolgozoService>();
builder.Services.AddScoped<MuszakService>();
builder.Services.AddScoped<ElerhetosegService>();
builder.Services.AddScoped<BeosztasService>();

// JWT Konfiguráció
var jwtKey = builder.Configuration["Jwt:Key"] ?? "NagyonTitkosKulcs1234567890NagyonTitkosKulcs";
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

// CORS beállítása - a React kliens elérhesse az API-t
builder.Services.AddCors(beallitasok =>
{
    beallitasok.AddPolicy("ReactKliens", szabaly =>
    {
        szabaly.WithOrigins("http://localhost:5173")
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
