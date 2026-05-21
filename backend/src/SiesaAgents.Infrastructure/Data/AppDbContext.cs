using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Main EF Core DbContext. Uses automatic snake_case naming via ApplySnakeCaseNaming().
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.ApplySnakeCaseNaming();
    }
}
