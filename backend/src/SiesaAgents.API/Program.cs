using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Contactos.Interfaces;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// EF Core + PostgreSQL with snake_case naming convention
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
           .UseSnakeCaseNamingConvention());

// Application services
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<IGetClientesQueryHandler, GetClientesQueryHandler>();
builder.Services.AddScoped<IGetClienteByIdQueryHandler, GetClienteByIdQueryHandler>();
builder.Services.AddScoped<ICreateClienteCommandHandler, CreateClienteCommandHandler>();
builder.Services.AddScoped<IUpdateClienteCommandHandler, UpdateClienteCommandHandler>();
builder.Services.AddScoped<IDeleteClienteCommandHandler, DeleteClienteCommandHandler>();

// Contactos services
builder.Services.AddScoped<IContactoRepository, ContactoRepository>();
builder.Services.AddScoped<IGetContactosQueryHandler, GetContactosQueryHandler>();

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

app.MapClientesEndpoints();
app.MapContactosEndpoints();

app.Run();

// Needed for WebApplicationFactory in integration tests
public partial class Program { }
