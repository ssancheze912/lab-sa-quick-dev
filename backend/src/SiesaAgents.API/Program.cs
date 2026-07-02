using FluentValidation;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI document generation for Scalar reference UI.
builder.Services.AddOpenApi();

// Read allowed CORS origins from configuration (with sensible dev default).
const string DevCorsPolicy = "DevCors";
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              // Expose Location so cross-origin JS clients can read the header
              // set by Results.Created(...) on 201 responses (AC#4, AC#7 —
              // Story 2.3). Without this, browsers strip non-simple response
              // headers from cross-origin XHR/fetch reads.
              .WithExposedHeaders("Location"));
});

// Enforce Problem Details on 404/405/415/etc. from the framework.
builder.Services.AddProblemDetails();

// Ensure JSON responses use camelCase.
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// EF Core: register AppDbContext against Npgsql using the DefaultConnection.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Cliente aggregate — Story 2.1
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
// Story 2.2 — detail-view query handler.
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
// Story 2.3 — create-cliente wiring.
builder.Services.AddScoped<CreateClienteCommandHandler>();
builder.Services.AddScoped<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>();

var app = builder.Build();

// Global exception handler MUST run first so it catches everything downstream.
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Emit Problem Details for status-code-only responses (e.g. 404).
app.UseStatusCodePages();

// CORS must run before endpoints.
app.UseCors(DevCorsPolicy);

// Scalar API reference — Swagger/Swashbuckle is forbidden by architecture.
app.MapOpenApi();
app.MapScalarApiReference();

// Domain endpoints
app.MapClienteEndpoints();

// Testing-environment-only diagnostic endpoint used by integration tests to
// exercise ExceptionHandlingMiddleware. NOT exposed in Development/Production.
// IsEnvironment(...) does an OrdinalIgnoreCase comparison — robust to
// ASPNETCORE_ENVIRONMENT casing variants ("Testing"/"testing"/"TESTING").
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/api/v1/test-error", (Func<IResult>)(() =>
        throw new InvalidOperationException("integration-test-error")));
}

app.Run();

// Sentinel required so WebApplicationFactory<Program> in the integration test
// project can bind to the entry point of this minimal-API host.
public partial class Program;
