using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

const string DevCorsPolicy = "DevCors";

// OpenAPI metadata feeds Scalar (NEVER add Swashbuckle/Swagger).
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Order: ExceptionHandlingMiddleware FIRST, then CORS, then routing/endpoints.
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors(DevCorsPolicy);

app.MapOpenApi();
app.MapScalarApiReference();

// Health endpoint used to validate CORS + server reachability from the frontend.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .WithName("Health");

app.Run();

// Exposes Program for WebApplicationFactory in integration tests.
public partial class Program;
