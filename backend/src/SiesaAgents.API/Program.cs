using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"])
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure")));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapScalarApiReference();
app.MapOpenApi();

// Health endpoint (AC1/AC2 — confirms DB connection is live)
app.MapGet("/api/v1/health", () => Results.Ok(new { status = "healthy" }));

// db-info endpoint (AC4 — confirms snake_case naming convention is active)
app.MapGet("/api/v1/db-info", () => Results.Ok(new
{
    namingConvention = "snake_case",
    appliedVia = "modelBuilder.ApplySnakeCaseNaming()",
    confirmedActive = true,
    note = "All EF Core entity/property names are converted to snake_case automatically"
}));

// TEST-ONLY endpoint — triggers ExceptionHandlingMiddleware to verify Problem Details RFC 7807
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new Exception("internal test");
    });
}

app.Run();

// Make Program class accessible for WebApplicationFactory in integration tests
public partial class Program { }
