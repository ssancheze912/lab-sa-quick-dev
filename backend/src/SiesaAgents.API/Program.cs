using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Commands;
using SiesaAgents.Application.Clientes.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Application.Clientes.Validators;
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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();
builder.Services.AddScoped<GetClienteByIdQueryHandler>();
builder.Services.AddScoped<CreateClienteCommandHandler>();
builder.Services.AddScoped<CreateClienteRequestValidator>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();

app.MapClienteEndpoints();

app.Run();

// Required for WebApplicationFactory<Program> in integration tests
public partial class Program { }
