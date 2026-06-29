using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application;
using SiesaAgents.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar — NOT Swagger)
builder.Services.AddOpenApi();

// Infrastructure layer (AppDbContext + PostgreSQL provider + repositories)
builder.Services.AddInfrastructure(builder.Configuration);

// Application layer (CQRS handlers)
builder.Services.AddApplication();

// CORS for local frontend development
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

// Problem Details RFC 7807 — must precede any endpoints
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

// Scalar — corporate standard, NEVER Swagger
app.MapOpenApi();
app.MapScalarApiReference();

// Story 2.1 — /api/v1/clientes
app.MapClienteEndpoints();

// Development-only probe endpoint that exercises ExceptionHandlingMiddleware.
// Validates Problem Details RFC 7807 contract end-to-end (Story 1.3 AC #2 / TC-E1-P0-05).
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () => { throw new Exception("internal test"); });
}

app.Run();

// Required by WebApplicationFactory<Program> in the integration test project.
public partial class Program { }
