using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

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

var app = builder.Build();

// Exception handling must be first — AC #implicit for Story 1.3 prep
app.UseMiddleware<ExceptionHandlingMiddleware>();

// CORS before endpoint mappings — AC #3
app.UseCors("DevCors");

// Scalar API documentation — NEVER UseSwagger — AC #2
app.MapOpenApi();
app.MapScalarApiReference();

app.Run();

// Expose for integration testing
public partial class Program { }
