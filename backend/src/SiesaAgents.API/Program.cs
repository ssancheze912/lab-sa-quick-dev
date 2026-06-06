using Microsoft.AspNetCore.Mvc;
using Scalar.AspNetCore;
using SiesaAgents.API.Middleware;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

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

app.UseStatusCodePages(async statusCodeContext =>
{
    var context = statusCodeContext.HttpContext;
    var statusCode = context.Response.StatusCode;

    context.Response.ContentType = "application/problem+json";

    var problem = new ProblemDetails
    {
        Status = statusCode,
        Title = statusCode switch
        {
            404 => "Resource not found.",
            400 => "Bad request.",
            401 => "Unauthorized.",
            403 => "Forbidden.",
            405 => "Method not allowed.",
            _ => "An error occurred."
        }
    };

    var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    });
    await context.Response.WriteAsync(json);
});
app.MapScalarApiReference();

app.Run();
