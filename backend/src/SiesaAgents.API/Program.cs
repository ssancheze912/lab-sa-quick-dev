using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// API documentation metadata (Scalar uses OpenAPI spec)
builder.Services.AddOpenApi();

// CORS — allow frontend origin from configuration
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// Database — EF Core + PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// Repositories
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

// Query handlers
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

// Exception handling must be first
app.UseMiddleware<ExceptionHandlingMiddleware>();

// CORS before endpoint mappings
app.UseCors("DevCors");

// Scalar API documentation — NEVER UseSwagger
app.MapOpenApi();
app.MapScalarApiReference();

// Business endpoints
app.MapClienteEndpoints();

app.Run();

// Expose for integration testing
public partial class Program { }
