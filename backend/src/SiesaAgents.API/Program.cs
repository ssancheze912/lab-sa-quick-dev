using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

// Serve OpenAPI JSON document (required by Scalar)
app.MapOpenApi();

// Scalar API Reference (replaces Swagger UI)
app.MapScalarApiReference();

if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("ATDD test exception — intentional error for middleware validation");
    });
}

app.Run();

// Expose Program class for WebApplicationFactory in integration tests
public partial class Program { }
