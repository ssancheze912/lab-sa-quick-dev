using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties are added per story (Epic 2: ClienteEntity, Epic 3: ContactoEntity)
    // DO NOT add ClienteEntity or ContactoEntity here.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Entity configurations are applied here in future stories:
        // modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Snake_case naming convention is configured via UseSnakeCaseNamingConvention()
        // on DbContextOptionsBuilder in Program.cs — no ModelBuilder call needed here.
        // This method call is intentionally the last statement per company standards.
    }
}
