using SiesaAgents.API.Middleware;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.UseUrls("http://localhost:5000");

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173"];

builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
    options.AddPolicy("DevCors", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseStatusCodePages(async context =>
{
    context.HttpContext.Response.ContentType = "application/problem+json";
    await context.HttpContext.Response.WriteAsJsonAsync(new Microsoft.AspNetCore.Mvc.ProblemDetails
    {
        Status = context.HttpContext.Response.StatusCode,
        Title = "An error occurred processing the request.",
    });
});

app.UseCors("DevCors");

app.MapOpenApi();
app.MapScalarApiReference();

app.Run();
