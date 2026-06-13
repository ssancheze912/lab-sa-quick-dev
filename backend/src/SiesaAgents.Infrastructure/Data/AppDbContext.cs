using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Future DbSet<> properties go here (Epic 2, 3)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // Snake_case naming convention is configured via UseSnakeCaseNamingConvention()
        // on DbContextOptionsBuilder in Program.cs (EFCore.NamingConventions package).
        // This ensures all future column names follow snake_case automatically.
    }
}
