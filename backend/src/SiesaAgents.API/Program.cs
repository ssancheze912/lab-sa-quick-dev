using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar — NEVER use Swagger/Swashbuckle)
builder.Services.AddOpenApi();

// CORS — allow frontend dev origin (configurable via appsettings AllowedOrigins)
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Global exception handler — must be first in pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

// Scalar API documentation — exposes /scalar (NEVER /swagger)
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/", () => Results.Redirect("/scalar"));

app.Run();
