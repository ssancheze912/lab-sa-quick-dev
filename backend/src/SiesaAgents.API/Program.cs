using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// AddEndpointsApiExplorer + AddSwaggerGen used only to generate the OpenAPI JSON document
// consumed by Scalar. Swagger UI is NOT enabled (no app.UseSwaggerUI()).
// NOTE: .NET 8 environment — built-in app.MapOpenApi() is only available in .NET 9+.
// Per company standards, Scalar is the API documentation UI (never Swagger UI).
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Siesa Agents API", Version = "v1" });
});

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

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

// Serve OpenAPI JSON document (required by Scalar) — Swagger UI NOT enabled
app.UseSwagger();

// Scalar API Reference (replaces Swagger UI — per company standards)
app.MapScalarApiReference(options => options.WithOpenApiRoutePattern("/swagger/v1/swagger.json"));

app.MapClienteEndpoints();

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
