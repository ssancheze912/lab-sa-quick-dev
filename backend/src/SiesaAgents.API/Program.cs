using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar).
builder.Services.AddOpenApi();

// Problem Details for framework-generated error responses.
builder.Services.AddProblemDetails();

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
    response.ContentType = "application/problem+json";

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
        Type = $"https://tools.ietf.org/html/rfc7231",
        Instance = statusContext.HttpContext.Request.Path
    };

    await response.WriteAsJsonAsync(problem);
});

app.UseCors("DevCors");

// OpenAPI JSON endpoint (used by Scalar).
app.MapOpenApi();

// Scalar API reference (replaces Swagger). NEVER use app.UseSwagger().
app.MapScalarApiReference();

app.Run();
