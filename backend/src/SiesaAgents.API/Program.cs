using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicyName = "DevCors";

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddProblemDetails();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());

// Story 2.1 — Clientes domain wiring.
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Convert empty-body status code responses (e.g. 404 for unmatched routes) into
// Problem Details (RFC 7807) JSON so clients always receive a machine-readable error.
app.UseStatusCodePages(async statusCodeContext =>
{
    var httpContext = statusCodeContext.HttpContext;

    if (httpContext.Response.HasStarted)
    {
        return;
    }

    httpContext.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = httpContext.Response.StatusCode,
        Title = ReasonPhrases.GetReasonPhrase(httpContext.Response.StatusCode),
        Instance = httpContext.Request.Path,
    };

    await httpContext.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
});

app.UseCors(CorsPolicyName);

app.MapClienteEndpoints();

// Expose the OpenAPI document and the Scalar UI only in Development so the API
// surface is not leaked in Production.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Test-only endpoint used by ProblemDetailsMiddlewareTests. MUST be gated on
// the "Testing" environment so it never leaks into Development or Production.
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/_test/throw", () =>
    {
        throw new InvalidOperationException("secret sauce");
    });
}

app.Run();

public partial class Program;
