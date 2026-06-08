using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;

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

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseCors("AllowFrontend");

// Scalar API reference — NO Swagger/OpenAPI, only Scalar
app.MapScalarApiReference();

// Endpoints
app.MapHealthEndpoints();

app.Run();
