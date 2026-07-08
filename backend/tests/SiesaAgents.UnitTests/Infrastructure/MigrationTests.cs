using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 1.3 — AC #1, #2, #8 (RED phase).
///
/// Verifies the InitialCreate migration exists in the assembly and, because
/// Story 1.3 explicitly forbids domain entities, that the migration's <c>Up()</c>
/// method emits zero <see cref="CreateTableOperation"/>s.
///
/// SANDBOX NOTE: this test never opens a live PostgreSQL connection.
/// <c>Database.GetMigrations()</c> is pure assembly reflection, and the
/// <see cref="IMigrationsAssembly"/> resolved from <c>ctx.GetService</c>
/// reads compiled metadata — no I/O.
/// </summary>
public sealed class MigrationTests
{
    [Fact]
    public void MigrationsAssembly_Has_InitialCreate_And_No_Domain_Tables()
    {
        // GIVEN: A DbContext wired with Npgsql + snake_case (matches production
        // DI). Connection string is dummy — GetMigrations() reads metadata only.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=x;Username=x;Password=x")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var ctx = new AppDbContext(options);

        // WHEN: Enumerate registered migrations from the assembly.
        var migrations = ctx.Database.GetMigrations().ToArray();

        // THEN #1: The InitialCreate migration is still present (never squashed
        // nor removed) — Story 1.3 AC #1 remains true post-2.1. Additional
        // migrations added by later stories are allowed.
        Assert.NotEmpty(migrations);
        var initialCreateKey = migrations.SingleOrDefault(m => m.EndsWith("_InitialCreate"));
        Assert.NotNull(initialCreateKey);

        // THEN #2: The InitialCreate migration itself emits ZERO CreateTable
        // operations — its Up()/Down() are intentionally empty. Story 2.1
        // added a *separate* AddClientesTable migration for the clientes
        // table; the InitialCreate migration was NOT edited.
        var migrationsAssembly = ctx.GetService<IMigrationsAssembly>();
        var initialCreate = migrationsAssembly.CreateMigration(
            migrationsAssembly.Migrations[initialCreateKey!],
            activeProvider: "Npgsql.EntityFrameworkCore.PostgreSQL");

        var createTableOps = initialCreate.UpOperations
            .OfType<CreateTableOperation>()
            .ToArray();

        Assert.Empty(createTableOps);
    }
}
