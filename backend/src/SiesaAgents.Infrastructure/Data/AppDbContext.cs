using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> here — domain entities added in Epic 2 & 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // NOTE: ApplySnakeCaseNaming() MUST be the last call in this method
        modelBuilder.ApplySnakeCaseNaming();
    }
}
