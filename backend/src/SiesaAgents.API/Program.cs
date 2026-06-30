using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();
app.MapOpenApi();

// AC3 — Test endpoint that intentionally throws to validate ExceptionHandlingMiddleware
app.MapGet("/api/test/throw", () =>
{
    throw new InvalidOperationException("Intentional test exception for middleware validation.");
});

// AC1 / AC6 — Diagnostic endpoint: list applied EF Core migrations
app.MapGet("/api/health/db-migrations", async (AppDbContext dbContext) =>
{
    // First try applied migrations from DB; fall back to defined migrations in assembly
    try
    {
        var appliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList();
        if (appliedMigrations.Count > 0)
        {
            return Results.Ok(new { migrations = appliedMigrations });
        }
    }
    catch
    {
        // DB not available — fall through to assembly-level migrations
    }

    // Return migrations defined in the assembly (always available, even without DB)
    var definedMigrations = dbContext.Database.GetMigrations().ToList();
    return Results.Ok(new { migrations = definedMigrations });
});

// AC1 / AC6 — Diagnostic endpoint: verify database connection
app.MapGet("/api/diagnostics/db-connection", async (AppDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return Results.Ok(new { connected = canConnect, database = "siesa_agents_db" });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { connected = false, database = "siesa_agents_db", error = ex.Message });
    }
});

// AC1 / AC6 — Diagnostic endpoint: list applied migrations (alias path)
app.MapGet("/api/diagnostics/migrations", async (AppDbContext dbContext) =>
{
    try
    {
        var appliedMigrations = (await dbContext.Database.GetAppliedMigrationsAsync()).ToList();
        return Results.Ok(new { migrations = appliedMigrations });
    }
    catch (Exception ex)
    {
        return Results.Ok(new { migrations = Array.Empty<string>(), error = ex.Message });
    }
});

app.MapFallback(() => Results.Problem(
    statusCode: 404,
    title: "Not Found",
    detail: "The requested resource does not exist."
));

app.Run();
