using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "DevCors";

// OpenAPI metadata feeds Scalar (NEVER add Swashbuckle/Swagger).
builder.Services.AddOpenApi();

// Problem Details (RFC 7807) for all error responses, including 404s for unmapped routes.
builder.Services.AddProblemDetails();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Order: ExceptionHandlingMiddleware FIRST, then CORS, then routing/endpoints.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors(DevCorsPolicy);

// Convert empty error responses (e.g. 404 for unmapped routes) into RFC 7807 Problem Details JSON.
app.UseStatusCodePages(async context =>
{
    var response = context.HttpContext.Response;
    if (string.IsNullOrEmpty(response.ContentType))
    {
        response.ContentType = "application/problem+json";
        await response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = response.StatusCode,
            Title = ReasonPhrases.GetReasonPhrase(response.StatusCode),
            Type = $"https://tools.ietf.org/html/rfc7231#section-6.5.{response.StatusCode}",
        }, options: null, contentType: "application/problem+json");
    }
});

app.MapOpenApi();
app.MapScalarApiReference();

// Health endpoint used to validate CORS + server reachability from the frontend.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health");

app.Run();

// Exposes Program for WebApplicationFactory in integration tests.
public partial class Program;
