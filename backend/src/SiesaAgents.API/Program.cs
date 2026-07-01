using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata is required for Scalar API documentation.
builder.Services.AddOpenApi();

// CORS: allow the Vite dev server (frontend) during development.
const string DevCorsPolicy = "DevCors";
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// EF Core: register AppDbContext with PostgreSQL provider + snake_case naming convention.
// The connection string is sourced from ConnectionStrings:DefaultConnection (appsettings.*.json).
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString,
               npgsql => npgsql.MigrationsHistoryTable("__ef_migrations_history"))
           .UseSnakeCaseNamingConvention());

// Story 2.1 — Clientes read side.
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

// Global exception handler → RFC 7807 Problem Details.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors(DevCorsPolicy);

// OpenAPI JSON + Scalar UI (NEVER Swagger — per company standards).
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.WithTitle("Siesa Agents API")
           .WithTheme(ScalarTheme.Default);
});

app.MapGet("/", () => Results.Redirect("/scalar"));

// Story 2.1 — Clientes endpoints.
app.MapClienteEndpoints();

// Test-only endpoints: only registered when SIESA_TEST_ENDPOINTS=1 (used by integration tests).
// Never enabled in production or development runs.
if (Environment.GetEnvironmentVariable("SIESA_TEST_ENDPOINTS") == "1")
{
    app.MapGet("/test-error", () =>
    {
        throw new Exception("SECRET-INTERNAL-DETAIL: this should never reach the client");
    });
    app.MapGet("/test-error-invalidop", () =>
    {
        throw new InvalidOperationException("SECRET-INTERNAL-DETAIL: invalid op");
    });
}

app.Run();

public partial class Program;
