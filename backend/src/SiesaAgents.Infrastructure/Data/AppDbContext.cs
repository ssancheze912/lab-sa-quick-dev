using Microsoft.EntityFrameworkCore;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Application database context.
/// Snake_case naming is applied automatically via UseSnakeCaseNamingConvention()
/// registered on DbContextOptionsBuilder (DI configuration).
/// No [Column] or [Table] attributes are used on any entity — naming is fully automatic.
/// </summary>
public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // NOTE: UseSnakeCaseNamingConvention() is configured on DbContextOptionsBuilder
        // in the DI registration (AddDbContext call in Program.cs / extension method).
        // EFCore.NamingConventions v10 applies naming via model conventions — this call
        // is the LAST statement per AC8 requirement.
    }
}
