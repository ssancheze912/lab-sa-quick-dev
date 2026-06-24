using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.DTOs;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddTransient<ExceptionHandlingMiddleware>();
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddTransient<GetClientesQueryHandler>();
builder.Services.AddTransient<GetClienteByIdQueryHandler>();
builder.Services.AddTransient<CreateClienteCommandHandler>();
builder.Services.AddTransient<IValidator<CreateClienteRequest>, CreateClienteRequestValidator>();
builder.Services.AddTransient<UpdateClienteCommandHandler>();
builder.Services.AddTransient<IValidator<UpdateClienteRequest>, UpdateClienteRequestValidator>();
builder.Services.AddTransient<DeleteClienteCommandHandler>();

builder.Services.AddScoped<IContactoRepository, ContactoRepository>();
builder.Services.AddTransient<GetContactosQueryHandler>();

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
app.MapContactoEndpoints();

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
