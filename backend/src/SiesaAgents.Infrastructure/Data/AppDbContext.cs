using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<T> here — domain entities added in Epic 2 & 3

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Snake_case naming is applied via UseSnakeCaseNamingConvention() in DbContextOptionsBuilder (Program.cs)
        // EFCore.NamingConventions intercepts the convention pipeline — no explicit call needed here
    }
}
