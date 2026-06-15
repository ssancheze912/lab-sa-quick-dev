using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

// Shared JSON options for RFC 7807 Problem Details bodies: drop null members so
// only status/title/type/instance reach the wire (matches architecture standard).
var problemJsonOptions = new JsonSerializerOptions
{
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
};

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata used by Scalar (NOT Swagger UI).
builder.Services.AddOpenApi();

// CORS — origins are loaded from configuration (AllowedOrigins). In Development
// we fall back to the Vite dev server origin; in non-development environments we
// fail-fast if no origins are configured to avoid silently accepting dev origins.
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if (allowedOrigins.Length == 0)
{
    if (builder.Environment.IsDevelopment())
    {
        allowedOrigins = new[] { "http://localhost:5173" };
    }
    else
    {
        throw new InvalidOperationException(
            "AllowedOrigins configuration is required outside of Development.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddProblemDetails();

// EF Core — register AppDbContext with Npgsql. Connection string comes from
// configuration; appsettings.json keeps ConnectionStrings empty so non-Development
// environments must supply it explicitly.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Clientes — repository + CQRS handler. Story 2.1 wires the read side only;
// commands land in stories 2.3 / 2.4 / 2.5.
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

// Global exception handler — emits RFC 7807 Problem Details responses.
// MUST be the FIRST middleware so it captures exceptions from every downstream
// component (per AC #4 / NFR6).
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

// Scalar API documentation. NEVER use Swagger.
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health")
    .Produces<object>(StatusCodes.Status200OK);

// Clientes endpoints — MUST be registered BEFORE the fallback handler below,
// otherwise `MapFallback` would mask the route and return 404.
app.MapClienteEndpoints();

// Test-only endpoint used by integration tests to exercise the global
// exception middleware. Registered ONLY when ASPNETCORE_ENVIRONMENT=Testing
// so production / development never expose it.
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/__test/throw", (HttpContext _) =>
    {
        throw new InvalidOperationException("forced");
    });
}

// Fallback for unmatched routes — emits RFC 7807 Problem Details (application/problem+json).
// We serialize manually so the response keeps the application/problem+json content type
// (WriteAsJsonAsync would overwrite it with application/json — same fix pattern as
// ExceptionHandlingMiddleware).
app.MapFallback(async (HttpContext context) =>
{
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Resource not found.",
        Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
        Instance = context.Request.Path,
    };

    await JsonSerializer.SerializeAsync(context.Response.Body, problem, problemJsonOptions);
});

app.Run();

// Exposed for WebApplicationFactory<Program> in integration tests.
public partial class Program;
