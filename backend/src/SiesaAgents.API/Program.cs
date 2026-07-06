using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

// EF Core's migrations history table is built outside AppDbContext.OnModelCreating, so
// ApplySnakeCaseNaming() never touches it. MigrationsHistoryTable renames the table itself
// to snake_case; SnakeCaseHistoryRepository renames its two columns (migration_id,
// product_version) to keep the whole schema consistently snake_case (AC #3).
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions => npgsqlOptions.MigrationsHistoryTable("__ef_migrations_history"))
        .ReplaceService<IHistoryRepository, SnakeCaseHistoryRepository>());

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
builder.Services.AddScoped<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>();
builder.Services.AddScoped<CreateClienteCommandHandler>();
builder.Services.AddScoped<IValidator<UpdateClienteRequest>, UpdateClienteRequestValidator>();
builder.Services.AddScoped<UpdateClienteCommandHandler>();
builder.Services.AddScoped<DeleteClienteCommandHandler>();

builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("AllowedOrigins")
        .Get<string[]>() ?? ["http://localhost:5173"];

    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStatusCodePages();

app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.MapClienteEndpoints();

// Test-only endpoint used by SiesaAgents.IntegrationTests to exercise ExceptionHandlingMiddleware
// (TC-E1-P0-05). Guarded so it never exists outside the "Testing" hosting environment.
if (app.Environment.IsEnvironment("Testing"))
{
    app.MapGet("/api/v1/test-error", IResult () => throw new Exception("test error"));
}

app.Run();

// Exposes the implicit Program class generated from top-level statements so
// WebApplicationFactory<Program> in SiesaAgents.IntegrationTests can reference it.
public partial class Program { }
