using Microsoft.EntityFrameworkCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// OpenApi metadata (used by Scalar only — NEVER Swagger/Swashbuckle)
builder.Services.AddOpenApi();

// CORS — reads allowed origins from configuration
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

// EF Core — PostgreSQL via AppDbContext
// snake_case naming is applied automatically in AppDbContext.OnModelCreating
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Middleware pipeline (order matters)
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

// API documentation via Scalar (NEVER app.UseSwagger())
app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
