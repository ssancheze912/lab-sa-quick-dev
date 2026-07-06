using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStatusCodePages();

app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

// Test-only endpoint used by SiesaAgents.IntegrationTests to exercise ExceptionHandlingMiddleware
// (TC-E1-P0-05). Guarded so it never exists outside the "Testing" hosting environment.
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/api/v1/test-error", IResult () => throw new Exception("test error"));
}

app.Run();

// Exposes the implicit Program class generated from top-level statements so
// WebApplicationFactory<Program> in SiesaAgents.IntegrationTests can reference it.
public partial class Program { }
