using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

// OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Middleware order is critical
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();

// Make Program accessible for integration tests
public partial class Program { }
