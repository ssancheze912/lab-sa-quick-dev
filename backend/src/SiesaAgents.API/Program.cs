using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SiesaAgents.API.Endpoints;
using SiesaAgents.API.Middleware;
using SiesaAgents.Application.Clientes.Queries;
using SiesaAgents.Domain.Clientes.Repositories;
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

builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IClienteRepository, ClienteRepository>();
builder.Services.AddScoped<GetClientesQueryHandler>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("DevCors");
app.MapOpenApi();
app.MapScalarApiReference();
app.MapClienteEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapGet("/api/v1/test-probes/throw-unhandled", () =>
    {
        throw new Exception("Unhandled test exception");
    });

    app.MapGet("/api/v1/test-probes/throw-not-found", () =>
    {
        throw new SiesaAgents.Domain.Exceptions.NotFoundException("Test resource", "test-id");
    });

    app.MapGet("/api/v1/test-probes/throw-validation", () =>
    {
        throw new SiesaAgents.Domain.Exceptions.ValidationException("Validation error");
    });
}

app.Run();
