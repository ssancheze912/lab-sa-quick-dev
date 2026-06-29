using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI metadata (consumed by Scalar — NOT Swagger)
builder.Services.AddOpenApi();

// CORS for local frontend development
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

// Problem Details RFC 7807 — must precede any endpoints
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

// Scalar — corporate standard, NEVER Swagger
app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
