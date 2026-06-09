using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "DevCors";

var allowedOrigins = builder.Configuration
    .GetSection("AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors(DevCorsPolicy);

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
