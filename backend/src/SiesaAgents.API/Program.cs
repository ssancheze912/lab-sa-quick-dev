using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.Queries;
using SiesaAgents.Application.Contactos.Validators;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Domain.Contactos.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString)
           .UseSnakeCaseNamingConvention());

// Domain / Application services
builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<CreateClienteCommandHandler>();
builder.Services.AddScoped<UpdateClienteCommandHandler>();
builder.Services.AddScoped<DeleteClienteCommandHandler>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();

// Contactos
builder.Services.AddScoped<IContactoRepository, ContactoRepository>();
builder.Services.AddScoped<GetContactosQueryHandler>();
builder.Services.AddScoped<GetContactoByIdQueryHandler>();
builder.Services.AddScoped<CreateContactoCommandValidator>();
builder.Services.AddScoped<CreateContactoCommandHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();

app.MapClienteEndpoints();
app.MapContactoEndpoints();

app.Run();
