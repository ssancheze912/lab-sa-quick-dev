using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// EF Core + PostgreSQL with snake_case naming convention
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// OpenApi metadata (required by Scalar)
builder.Services.AddOpenApi();

// CORS — allow frontend dev origin
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

// ExceptionHandlingMiddleware MUST be first
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.MapGet("/api/v1/health/db", async (AppDbContext context) =>
{
    try
    {
        var canConnect = await context.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "healthy" })
            : Results.Json(new { status = "unhealthy" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        return Results.Json(new { status = "unhealthy" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapGet("/api/v1/test/trigger-exception", IResult () =>
{
    throw new InvalidOperationException("Deliberate test exception for middleware validation.");
});

app.Run();
