using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> here — domain entities added in Epic 2 & 3
    // snake_case naming convention is configured via UseSnakeCaseNamingConvention()
    // in Program.cs DbContext registration options (EFCore.NamingConventions package)

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
    }
}
