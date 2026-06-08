using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "DevCors";

// OpenAPI metadata feeds Scalar (NEVER add Swashbuckle/Swagger).
builder.Services.AddOpenApi();

// Problem Details (RFC 7807) for all error responses, including 404s for unmapped routes.
builder.Services.AddProblemDetails();

// PostgreSQL via EF Core (connection string comes from appsettings.Development.json /
// ConnectionStrings:DefaultConnection in production env vars). Migrations are run
// explicitly via `dotnet ef database update` — no auto-migration at startup.
//
// SKIPPED under the "Testing" host environment so WebApplicationFactory-based
// integration tests (Story 2.1+) can swap in EF Core InMemory without colliding
// with Npgsql's internal service registrations.
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
}

// CQRS-lite read-side handler for /api/v1/clientes.
builder.Services.AddScoped<GetClientesQueryHandler>();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Order: ExceptionHandlingMiddleware FIRST, then CORS, then routing/endpoints.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors(DevCorsPolicy);

// Convert empty error responses (e.g. 404 for unmapped routes) into RFC 7807 Problem Details JSON.
app.UseStatusCodePages(async context =>
{
    var response = context.HttpContext.Response;
    if (string.IsNullOrEmpty(response.ContentType))
    {
        response.ContentType = "application/problem+json";
        await response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = response.StatusCode,
            Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
            Type = $"https://tools.ietf.org/html/rfc7231#section-6.5.{response.StatusCode}",
            Instance = context.HttpContext.Request.Path,
        }, options: null, contentType: "application/problem+json");
    }
});

app.MapOpenApi();
app.MapScalarApiReference();

// Health endpoint used to validate CORS + server reachability from the frontend.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health");

// Clientes domain endpoints (Story 2.1: GET; future stories add commands).
app.MapClienteEndpoints();

// Test-only endpoint that intentionally throws, used by the Story 1.3 ProblemDetailsTests
// (TC-E1-P0-05) to verify the full ExceptionHandlingMiddleware → RFC 7807 pipeline.
// Activated only when the host environment is "Testing" — never reachable from
// Development or Production.
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("internal test message — must not leak");
    });
}

app.Run();

// Exposes Program for WebApplicationFactory in integration tests.
public partial class Program;
