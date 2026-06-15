using Microsoft.AspNetCore.Mvc;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata used by Scalar (NOT Swagger UI).
builder.Services.AddOpenApi();

// CORS — origins are loaded from configuration (AllowedOrigins). In Development
// we fall back to the Vite dev server origin; in non-development environments we
// fail-fast if no origins are configured to avoid silently accepting dev origins.
var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? Array.Empty<string>();

if (allowedOrigins.Length == 0)
{
    if (builder.Environment.IsDevelopment())
    {
        allowedOrigins = new[] { "http://localhost:5173" };
    }
    else
    {
        throw new InvalidOperationException(
            "AllowedOrigins configuration is required outside of Development.");
    }
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddProblemDetails();

var app = builder.Build();

// Global exception handler — emits RFC 7807 Problem Details responses.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

// Scalar API documentation. NEVER use Swagger.
app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health")
    .Produces<object>(StatusCodes.Status200OK);

// Fallback for unmatched routes — emits RFC 7807 Problem Details (application/problem+json).
app.MapFallback(async (HttpContext context) =>
{
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Resource not found.",
        Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
        Instance = context.Request.Path,
    };

    await context.Response.WriteAsJsonAsync(problem);
});

app.Run();
