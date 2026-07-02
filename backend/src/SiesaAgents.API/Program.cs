using Microsoft.AspNetCore.Http.Json;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

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
              .AllowAnyMethod());
});

// Enforce Problem Details on 404/405/415/etc. from the framework.
builder.Services.AddProblemDetails();

// Ensure JSON responses use camelCase.
builder.Services.Configure<JsonOptions>(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

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

app.Run();
