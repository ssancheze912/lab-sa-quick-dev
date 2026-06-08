using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// CORS — allow frontend origin
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Problem Details support
builder.Services.AddProblemDetails();

// EF Core — PostgreSQL with snake_case naming convention
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IApplicationDbContext, AppDbContext>();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowFrontend");

// Scalar API reference — NO Swagger/OpenAPI, only Scalar
app.MapScalarApiReference();

// Endpoints
app.MapHealthEndpoints();

// Catch-all fallback: return Problem Details RFC 7807 for unmatched routes (404)
app.MapFallback(context =>
{
    context.Response.StatusCode = StatusCodes.Status404NotFound;
    context.Response.ContentType = "application/problem+json";

    var problemDetails = new ProblemDetails
    {
        Status = StatusCodes.Status404NotFound,
        Title = "Not Found",
        Detail = $"The requested resource '{context.Request.Path}' was not found.",
        Instance = context.Request.Path,
    };

    problemDetails.Extensions["traceId"] = context.TraceIdentifier;

    return context.Response.WriteAsJsonAsync(problemDetails, new System.Text.Json.JsonSerializerOptions
    {
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
    });
});

app.Run();
