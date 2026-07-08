using Microsoft.EntityFrameworkCore;
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.Infrastructure.Data;

/// <summary>
/// Primary EF Core <see cref="DbContext"/> for the SiesaAgents backend.
/// </summary>
/// <remarks>
/// Story 1.3 introduced this context as an empty foundation. Story 2.1 adds
/// the first domain entity — <see cref="ClienteEntity"/> — and wires
/// <see cref="ModelBuilder.ApplyConfigurationsFromAssembly"/> so every
/// <c>IEntityTypeConfiguration&lt;&gt;</c> in this assembly is picked up
/// automatically (Story 1.3 placeholder → real code).
///
/// snake_case naming for tables/columns/keys is enforced by the
/// <c>EFCore.NamingConventions</c> plugin, registered at the options level in
/// <c>Program.cs</c> via <c>UseSnakeCaseNamingConvention()</c>. That plugin
/// rewrites names during model finalization — no <c>[Column]</c>/<c>[Table]</c>
/// attributes are ever needed.
/// </remarks>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<ClienteEntity> Clientes => Set<ClienteEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Story 2.1: pick up every IEntityTypeConfiguration<> defined in this
        // assembly (currently: ClienteConfiguration). Subsequent stories add
        // more configurations without touching this method again.
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // NOTE ON snake_case: the company standard describes an
        // "ApplySnakeCaseNaming()" call as the LAST line here, but that
        // extension method does NOT exist on ModelBuilder in
        // EFCore.NamingConventions 10.0.0-rc.2 — the package only exposes
        // options-level extensions. Snake_case is therefore enforced by
        // ".UseSnakeCaseNamingConvention()" in Program.cs (DI-time), which
        // installs a naming rewriter that runs during model finalization —
        // achieving the same outcome without a matching model-builder call.
        // Do NOT add a model-builder snake_case call here; it will not
        // compile against the current package.
    }
}
