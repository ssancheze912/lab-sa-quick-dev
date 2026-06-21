using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSets in this story — added in Epics 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Future entity configurations go HERE (before snake_case)

        modelBuilder.ApplySnakeCaseNaming(); // MUST be last
    }
}
