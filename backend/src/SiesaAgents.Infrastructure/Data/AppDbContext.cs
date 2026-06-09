using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties in this story — domain tables are scoped to Epics 2 and 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Auto-register all IEntityTypeConfiguration<T> in this assembly
        // CRITICAL: This must come before ApplySnakeCaseNaming (registered via UseSnakeCaseNamingConvention in DbContextOptions)
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
