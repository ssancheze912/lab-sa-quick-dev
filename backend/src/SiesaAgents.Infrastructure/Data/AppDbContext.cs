using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        // snake_case naming is applied via UseSnakeCaseNamingConvention() in DbContext options (Program.cs)
    }
}
