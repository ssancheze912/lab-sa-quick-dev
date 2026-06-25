using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsqlOptions => npgsqlOptions.MigrationsAssembly("SiesaAgents.Infrastructure"))
           .UseSnakeCaseNamingConvention());

// Repositories
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();

// Query handlers
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();

// Command handlers
builder.Services.AddScoped<CreateClienteCommandHandler>();

// Validators
builder.Services.AddScoped<IValidator<CreateClienteCommand>, CreateClienteCommandValidator>();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();

// Endpoints
app.MapClienteEndpoints();

app.Run();

public partial class Program { }
