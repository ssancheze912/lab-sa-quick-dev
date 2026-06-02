using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar — NEVER use Swagger/Swashbuckle)
builder.Services.AddOpenApi();

// CORS — allow frontend dev origin (configurable via appsettings AllowedOrigins)
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

// Global exception handler — must be first in pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Status-code handler — converts unmatched routes (404) and other status-code-only
// responses into RFC 7807 Problem Details (application/problem+json).
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    if (response.HasStarted)
    {
        return;
    }

    var problem = new ProblemDetails
    {
        Status = response.StatusCode,
        Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
        Type = $"https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.{response.StatusCode}",
        Instance = statusCodeContext.HttpContext.Request.Path
    };

    await response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
});

app.UseCors("DevCors");

// Scalar API documentation — exposes /scalar (NEVER /swagger)
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/", () => Results.Redirect("/scalar"));

app.Run();
