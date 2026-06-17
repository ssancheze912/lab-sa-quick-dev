using FluentValidation;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// Database context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// DI registrations
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
builder.Services.AddScoped<CreateClienteCommandHandler>();
builder.Services.AddScoped<CreateClienteRequestValidator>();
builder.Services.AddScoped<UpdateClienteCommandHandler>();
builder.Services.AddScoped<IValidator<UpdateClienteCommand>, UpdateClienteCommandValidator>();

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
app.MapClienteEndpoints();

// Test endpoint — triggers middleware error handling (used by integration tests TC-E1-P0-05)
// Registered only in Development to avoid exposing an error-triggering route in production
if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-error", () =>
    {
        throw new InvalidOperationException("Test exception for middleware validation");
    });
}

app.Run();
