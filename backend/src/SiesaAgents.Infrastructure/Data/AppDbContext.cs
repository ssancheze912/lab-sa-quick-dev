using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // No DbSet<> properties yet — domain entities are added starting Epic 2 (ClienteEntity)
    // and Epic 3 (ContactoEntity). Do not add them in this story.

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // MUST remain the last call — converts all EF-managed identifiers to snake_case
        modelBuilder.ApplySnakeCaseNaming();
    }
}
