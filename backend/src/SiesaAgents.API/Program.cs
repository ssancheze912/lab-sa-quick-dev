using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Queries.Clientes;
using SiesaAgents.Domain.Repositories;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>());

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();

// Registered before any test-only IStartupFilter (e.g. WebApplicationFactory.ConfigureWebHost)
// so ExceptionHandlingMiddleware and UseRouting() wrap the composed pipeline from the
// outermost layer — guaranteeing exceptions thrown by endpoints added via startup filters
// (integration tests) are caught, without altering this file per environment.
builder.Services.AddSingleton<IStartupFilter, ExceptionHandlingStartupFilter>();
builder.Services.AddSingleton<IStartupFilter, RoutingStartupFilter>();

var app = builder.Build();

app.UseStatusCodePages(async context =>
{
    context.HttpContext.Response.ContentType = "application/problem+json";
    await context.HttpContext.Response.WriteAsJsonAsync(new Microsoft.AspNetCore.Mvc.ProblemDetails
    {
        Status = context.HttpContext.Response.StatusCode,
        Title = "An error occurred processing the request.",
    });
});

app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.MapClienteEndpoints();

app.Run();

internal sealed class ExceptionHandlingStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) =>
        app =>
        {
            app.UseMiddleware<ExceptionHandlingMiddleware>();
            next(app);
        };
}

internal sealed class RoutingStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next) =>
        app =>
        {
            app.UseRouting();
            next(app);
        };
}
