using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar).
builder.Services.AddOpenApi();

// Problem Details for framework-generated error responses.
builder.Services.AddProblemDetails();

// EF Core DbContext (Story 1.3) — registered before CORS/middleware per the DI
// registration sequence in architecture-both.md §2.4.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Clientes module (Story 2.1) — repository + CQRS handler registrations.
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

// CORS — allow the frontend origin(s) configured in appsettings.
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

// Global exception handling → Problem Details (RFC 7807).
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Emit Problem Details JSON for framework status code responses (e.g. 404).
app.UseStatusCodePages(async statusContext =>
{
    var response = statusContext.HttpContext.Response;

    var problem = new ProblemDetails
    {
        Status = response.StatusCode,
        Title = response.StatusCode switch
        {
            StatusCodes.Status404NotFound => "Not Found",
            StatusCodes.Status400BadRequest => "Bad Request",
            StatusCodes.Status405MethodNotAllowed => "Method Not Allowed",
            _ => "Error"
        },
        Type = "https://tools.ietf.org/html/rfc7231",
        Instance = statusContext.HttpContext.Request.Path
    };

    // Pass contentType explicitly — WriteAsJsonAsync would otherwise overwrite
    // Response.ContentType with "application/json", breaking RFC 7807 contract.
    // Mirrors the fix applied to ExceptionHandlingMiddleware in Story 1.3.
    await response.WriteAsJsonAsync(
        problem,
        options: null,
        contentType: "application/problem+json");
});

app.UseCors("DevCors");

// OpenAPI JSON endpoint (used by Scalar).
app.MapOpenApi();

// Scalar API reference (replaces Swagger). NEVER use app.UseSwagger().
app.MapScalarApiReference();

// Clientes endpoints (Story 2.1) — wired after middleware + OpenAPI.
app.MapClienteEndpoints();

app.Run();

// Expose the implicit Program type to WebApplicationFactory<Program> in tests.
public partial class Program { }
