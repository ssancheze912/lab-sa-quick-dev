using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.Application.Interfaces;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Domain.Clientes.Interfaces;
using SiesaAgents.Infrastructure.Data;
using SiesaAgents.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.MigrationsAssembly("SiesaAgents.Infrastructure")
    ));

builder.Services.AddScoped<IApplicationDbContext>(provider =>
    provider.GetRequiredService<AppDbContext>());

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();
app.MapClienteEndpoints();

app.Run();
