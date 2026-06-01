using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // DbSet properties will be added in Epic 2 (ClienteEntity) and Epic 3 (ContactoEntity)
    // DO NOT add ClienteEntity or ContactoEntity here

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Apply entity type configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        // Note: UseSnakeCaseNamingConvention() is applied via DbContextOptionsBuilder in DI registration (Program.cs)
        // per EFCore.NamingConventions API — it configures the options extension, not the model builder
    }
}
