using System;
using System.IO;
using System.Linq;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AUTOMATE expansion - Story 1.3.
///
/// Edge-case coverage for the <c>InitialCreate</c> migration scaffold (AC #1
/// and AC #3). The ATDD pass only verifies the <c>Up()</c> method body has no
/// forbidden calls. This expansion adds:
///   - <c>Down()</c> method body is ALSO empty (rollback must be safe).
///   - <c>AppDbContextModelSnapshot</c> contains NO entity types (because no
///     <c>DbSet&lt;T&gt;</c> is declared in this story).
///   - Migration namespace + class name match the EF Core convention so
///     <c>dotnet ef</c> can discover and apply it.
///
/// Why these matter: AC #3 explicitly says the scope is an EMPTY migration so
/// downstream stories (2.1 / 3.1) can introduce <c>clientes</c> / <c>contactos</c>
/// in their own migrations without conflicts. A snapshot leaking entity
/// metadata or a <c>Down()</c> with side effects would break that contract.
/// </summary>
public class MigrationStructureTests
{
    private static string InfrastructureRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(dir.FullName, "src", "SiesaAgents.Infrastructure");
            if (Directory.Exists(candidate))
            {
                return candidate;
            }

            var sibling = Path.Combine(dir.FullName, "backend", "src", "SiesaAgents.Infrastructure");
            if (Directory.Exists(sibling))
            {
                return sibling;
            }

            dir = dir.Parent;
        }
        return string.Empty;
    }

    private static string MigrationsDir() =>
        Path.Combine(InfrastructureRoot(), "Data", "Migrations");

    /// <summary>
    /// AC #3 — The <c>Down()</c> method body of <c>InitialCreate</c> is empty.
    /// A non-empty Down() would silently drop tables that the migration never
    /// created, leading to a destructive rollback.
    /// </summary>
    [Fact]
    public void InitialCreate_Migration_HasEmptyDownMethod()
    {
        // GIVEN
        var migrationsDir = MigrationsDir();
        Assert.True(Directory.Exists(migrationsDir),
            $"Migrations directory not found at '{migrationsDir}'.");

        var files = Directory.GetFiles(migrationsDir, "*_InitialCreate.cs", SearchOption.TopDirectoryOnly);
        Assert.NotEmpty(files);
        var source = File.ReadAllText(files[0]);

        // WHEN / THEN — Down() must contain no schema-mutating calls
        var forbiddenCalls = new[]
        {
            "DropTable(",
            "DropIndex(",
            "DropColumn(",
            "DropForeignKey(",
            "DropPrimaryKey(",
            "DropUniqueConstraint(",
        };
        foreach (var call in forbiddenCalls)
        {
            Assert.DoesNotContain(call, source);
        }
    }

    /// <summary>
    /// AC #3 — <c>AppDbContextModelSnapshot.cs</c> contains NO entity-type
    /// metadata because no <c>DbSet&lt;T&gt;</c> is declared in Story 1.3.
    /// A non-empty snapshot would mean we accidentally registered an entity
    /// (which would force Stories 2.1 / 3.1 to scaffold a "Drop" first).
    /// </summary>
    [Fact]
    public void ModelSnapshot_DoesNotDeclareAnyEntityType()
    {
        // GIVEN
        var migrationsDir = MigrationsDir();
        var snapshotPath = Path.Combine(migrationsDir, "AppDbContextModelSnapshot.cs");
        Assert.True(File.Exists(snapshotPath),
            $"Model snapshot not found at '{snapshotPath}'.");

        var source = File.ReadAllText(snapshotPath);

        // WHEN / THEN — no entity-type registration calls
        Assert.DoesNotContain(".Entity(", source);
        Assert.DoesNotContain("HasAnnotation(\"Relational:Schema\"", source);
        Assert.DoesNotContain("modelBuilder.HasDefaultSchema", source);
    }

    /// <summary>
    /// AC #1 — The migration class lives under the expected EF Core namespace
    /// (<c>SiesaAgents.Infrastructure.Data.Migrations</c>) so <c>dotnet ef</c>
    /// can discover and apply it without manual configuration.
    /// </summary>
    [Fact]
    public void InitialCreate_Migration_UsesExpectedNamespace()
    {
        // GIVEN
        var migrationsDir = MigrationsDir();
        var files = Directory.GetFiles(migrationsDir, "*_InitialCreate.cs", SearchOption.TopDirectoryOnly);
        Assert.NotEmpty(files);

        // WHEN
        var source = File.ReadAllText(files[0]);

        // THEN
        Assert.Contains("namespace SiesaAgents.Infrastructure.Data.Migrations", source);
        Assert.Contains("class InitialCreate", source);
        Assert.Contains(": Migration", source);
    }

    /// <summary>
    /// AC #1 — The migration timestamp prefix (<c>{yyyyMMddHHmmss}_</c>) is
    /// strict 14 digits + underscore so EF Core can sort migrations
    /// deterministically when stories 2.1 / 3.1 add new migrations.
    /// </summary>
    [Fact]
    public void InitialCreate_Migration_FileName_HasValidTimestampPrefix()
    {
        // GIVEN
        var migrationsDir = MigrationsDir();
        var files = Directory.GetFiles(migrationsDir, "*_InitialCreate.cs", SearchOption.TopDirectoryOnly);
        Assert.NotEmpty(files);

        // WHEN
        var fileName = Path.GetFileName(files[0]);

        // THEN — matches EF Core convention "{14-digit-timestamp}_InitialCreate.cs"
        Assert.Matches(@"^\d{14}_InitialCreate\.cs$", fileName);
    }
}
