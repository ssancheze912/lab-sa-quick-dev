using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

// Return Problem Details RFC 7807 for all unhandled status codes (including 404)
app.UseStatusCodePages(async statusCodeContext =>
{
    var context = statusCodeContext.HttpContext;
    var statusCode = context.Response.StatusCode;

    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = statusCode,
        Title = statusCode switch
        {
            400 => "Bad Request",
            401 => "Unauthorized",
            403 => "Forbidden",
            404 => "Resource Not Found",
            405 => "Method Not Allowed",
            _ => "An error occurred"
        },
        Instance = context.Request.Path
    };

    await context.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    }));
});

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
