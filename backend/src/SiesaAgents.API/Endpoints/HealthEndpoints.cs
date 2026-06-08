namespace SiesaAgents.API.Endpoints;

public static class HealthEndpoints
{
    public static void MapHealthEndpoints(this WebApplication app)
    {
        app.MapGet("/api/v1/health", () => Results.Ok(new { status = "healthy" }))
           .WithName("GetHealth")
           .WithTags("Health");
    }
}
