using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// OpenAPI
builder.Services.AddOpenApi();

// EF Core — AppDbContext with Npgsql and snake_case naming convention
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

var app = builder.Build();

// Middleware order is critical
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
