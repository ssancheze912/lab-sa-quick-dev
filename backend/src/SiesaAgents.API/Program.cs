using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

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

// EF Core / PostgreSQL — single registration of AppDbContext (Story 1.3 AC #5).
// Connection string is sourced from configuration; appsettings.Development.json carries the
// local dev credentials, production must override via env var ConnectionStrings__DefaultConnection.
//
// Story 1.3 AC #1 / AC #4 also mandate that the EF Core history table be
// `__ef_migrations_history` with snake_case columns `migration_id` / `product_version`.
// That table lives OUTSIDE `OnModelCreating` so `ApplySnakeCaseNaming()` cannot rewrite it.
// We force the snake_case shape here by (a) renaming the table via Npgsql options and
// (b) replacing the default history repository with a snake_case-aware override.
builder.Services.AddDbContext<AppDbContext>(options =>
    options
        .UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npg => npg.MigrationsHistoryTable("__ef_migrations_history"))
        .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>());

// Repository registrations (Epic 2 — Story 2.1).
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

var app = builder.Build();

// Global exception handler — must be first in pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Status-code handler — converts unmatched routes (404) and other status-code-only
// responses into RFC 7807 Problem Details (application/problem+json).
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    if (response.HasStarted)
    {
        return;
    }

    var problem = new ProblemDetails
    {
        Status = response.StatusCode,
        Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
        Type = $"https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.{response.StatusCode}",
        Instance = statusCodeContext.HttpContext.Request.Path
    };

    await response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
});

app.UseCors("DevCors");

// Scalar API documentation — exposes /scalar (NEVER /swagger)
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/", () => Results.Redirect("/scalar"));

// Dev-only endpoint that throws — used by QA's TC-E1-P0-05 integration test to
// drive ExceptionHandlingMiddleware end-to-end. MUST be gated by Development so
// it never ships to production (Story 1.3 AC #3).
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("Forced failure for Problem Details smoke test.");
    });
}

// Epic 2 — Clientes module endpoints.
app.MapClienteEndpoints();

app.Run();

// Required so WebApplicationFactory<Program> can boot the host from
// SiesaAgents.IntegrationTests (Microsoft minimal-hosting canonical pattern).
public partial class Program;
