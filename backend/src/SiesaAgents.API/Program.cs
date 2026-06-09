using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using SiesaAgents.Infrastructure;

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

builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors(DevCorsPolicy);

app.MapOpenApi();
app.MapScalarApiReference();

if (app.Environment.IsDevelopment())
{
    // Throw-test endpoint — Story 1.3 AC #3 / TC-E1-P0-05.
    // Verifies the Problem Details (RFC 7807) middleware does not leak stack traces.
    // Mapped ONLY in the Development environment; never reachable in Production.
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("internal test");
    });
}

app.Run();

// Exposed for WebApplicationFactory<Program> in SiesaAgents.IntegrationTests.
public partial class Program;
