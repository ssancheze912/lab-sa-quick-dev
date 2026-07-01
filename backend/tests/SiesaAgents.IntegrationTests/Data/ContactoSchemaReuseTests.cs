using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.IntegrationTests.Data;

/// <summary>
/// Story 3.1 (TC-E3-P0-01 gate): proves that adding `ContactoRepository`,
/// `GetContactosQuery`/Handler and `ContactoEndpoints` on top of the EXISTING
/// `contactos` table/`ContactoEntity`/`ContactoConfiguration` (Story 2.5) does
/// NOT introduce any EF Core model drift — i.e. no new migration was
/// generated and `ContactoConfiguration.cs`'s FK definition
/// (`fk_contactos_clientes`, `ON DELETE SET NULL`) was not touched. Mirrors
/// `AppDbContextConfigurationTests.Database_HasNoPendingModelChanges`'s
/// pattern. MUST run against real PostgreSQL (`HasPendingModelChanges` needs
/// a live provider-backed model differ).
/// </summary>
public class ContactoSchemaReuseTests
{
    private const string ConnectionString =
        "Host=localhost;Database=siesa_agents_db;Username=postgres;Password=postgres";

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(ConnectionString, npgsql => { })
            .ReplaceService<IHistoryRepository, SnakeCaseNpgsqlHistoryRepository>()
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Database_HasNoPendingModelChanges_AfterAddingContactoRepositoryAndEndpoints()
    {
        // GIVEN a real AppDbContext connected to the migrated siesa_agents_db,
        // now that Story 3.1's ContactoRepository/GetContactosQuery/
        // ContactoEndpoints exist on top of the unchanged ContactoEntity/table
        await using var context = CreateContext();

        // WHEN checking for model/schema drift via EF's design-time model differ
        var hasPendingChanges = context.Database.HasPendingModelChanges();

        // THEN the current model still matches the last applied migration
        // snapshot (`20260701084227_AddContactoEntity`) exactly — this
        // story's repository/query/endpoint layer is purely additive and
        // triggered no new migration
        Assert.False(
            hasPendingChanges,
            "Expected no pending model changes for `contactos` after adding the Story 3.1 read path");
    }

    [Fact]
    public async Task AppliedMigrations_DoNotContainANewContactoMigration_BeyondAddContactoEntity()
    {
        // GIVEN the migrated database
        await using var context = CreateContext();

        // WHEN listing applied migrations
        var applied = (await context.Database.GetAppliedMigrationsAsync()).ToList();

        // THEN the only Contacto-related migration is the pre-existing
        // `AddContactoEntity` from Story 2.5 — Story 3.1 must not have
        // generated a second one
        var contactoMigrations = applied.Where(m => m.Contains("Contacto", StringComparison.OrdinalIgnoreCase)).ToList();
        Assert.Single(contactoMigrations);
        Assert.EndsWith("_AddContactoEntity", contactoMigrations.Single(), StringComparison.Ordinal);
    }
}
