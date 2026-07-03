using System.Text.RegularExpressions;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Static-analysis coverage for the initial EF Core migration. These tests read
/// the generated migration source files off disk (no runtime, no Docker) and
/// enforce the Story 1.3 scope note: the initial migration MUST be empty — no
/// <c>CreateTable</c>, <c>CreateIndex</c>, or <c>EnsureSchema</c> calls. Any
/// leak here would prove a <c>DbSet&lt;T&gt;</c> slipped into
/// <see cref="SiesaAgents.Infrastructure.Data.AppDbContext"/> ahead of Epic 2 /
/// Epic 3.
///
/// Docker-less alternative to the SKIPPED <c>EfCoreMigrationTests</c> — provides
/// the AC #2 guardrail on machines without a container runtime.
/// </summary>
public class MigrationScopeGuardTests
{
    private static string MigrationsFolder =>
        Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations"));

    [Fact]
    public void InitialCreate_migration_file_exists_P1()
    {
        // GIVEN: the standard EF Core migrations layout
        // THEN:  the *_InitialCreate.cs file is on disk (proves Task 5 ran)
        var files = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.cs");
        Assert.NotEmpty(files);
    }

    [Fact]
    public void InitialCreate_migration_designer_and_snapshot_exist_P2()
    {
        // Guard: EF Core requires all three files to stay in lock-step. Missing
        // any one of them prevents `dotnet ef database update`.
        var designer = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.Designer.cs");
        var snapshot = Path.Combine(MigrationsFolder, "AppDbContextModelSnapshot.cs");

        Assert.NotEmpty(designer);
        Assert.True(File.Exists(snapshot), $"Model snapshot missing: {snapshot}");
    }

    [Fact]
    public void InitialCreate_Up_body_is_empty_P0()
    {
        // Scope enforcement: an empty initial migration is the whole point of
        // Story 1.3. If Up() has any statements, an entity leaked into AppDbContext.
        var migrationFile = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.cs").Single();
        var source = File.ReadAllText(migrationFile);

        var upBody = ExtractMethodBody(source, "Up");
        Assert.True(
            string.IsNullOrWhiteSpace(upBody),
            $"Up() must be empty (Story 1.3 scope note). Found body: <<{upBody}>>.");
    }

    [Fact]
    public void InitialCreate_Down_body_is_empty_P1()
    {
        // Down() has to mirror Up() — if Up is empty, Down must be too.
        var migrationFile = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.cs").Single();
        var source = File.ReadAllText(migrationFile);

        var downBody = ExtractMethodBody(source, "Down");
        Assert.True(
            string.IsNullOrWhiteSpace(downBody),
            $"Down() must be empty. Found body: <<{downBody}>>.");
    }

    [Theory]
    [InlineData("CreateTable")]
    [InlineData("CreateIndex")]
    [InlineData("EnsureSchema")]
    [InlineData("AddForeignKey")]
    [InlineData("AddPrimaryKey")]
    public void InitialCreate_contains_no_schema_builder_calls_P0(string forbiddenCall)
    {
        // Blanket guard for AC #2: any MigrationBuilder call proves a schema leak.
        var migrationFile = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.cs").Single();
        var source = File.ReadAllText(migrationFile);

        Assert.DoesNotContain($"migrationBuilder.{forbiddenCall}", source, StringComparison.Ordinal);
    }

    [Fact]
    public void InitialCreate_designer_snapshot_declares_no_entity_types_P1()
    {
        // The InitialCreate migration Designer.cs captures the model state AT
        // Story 1.3 landing time — it must contain no entity declarations. This
        // preserves the Epic 1 scope guard even after Epic 2 legitimately adds
        // ClienteEntity to the live AppDbContextModelSnapshot.
        var designer = Directory.EnumerateFiles(MigrationsFolder, "*_InitialCreate.Designer.cs").Single();
        var source = File.ReadAllText(designer);

        Assert.DoesNotContain("modelBuilder.Entity(", source, StringComparison.Ordinal);
        Assert.DoesNotContain("modelBuilder.HasSequence", source, StringComparison.Ordinal);
    }

    /// <summary>
    /// Extracts the body inside <c>protected override void {methodName}(MigrationBuilder ...)</c>.
    /// Returns whitespace when the method body has no statements — which is the
    /// Story 1.3 expected shape.
    /// </summary>
    private static string ExtractMethodBody(string source, string methodName)
    {
        // Non-greedy match up to the first closing brace of the method body.
        var pattern = $@"void\s+{methodName}\s*\(\s*MigrationBuilder[^)]*\)\s*\{{(?<body>[^}}]*)\}}";
        var match = Regex.Match(source, pattern, RegexOptions.Singleline);
        Assert.True(match.Success, $"Could not locate {methodName}() in migration source.");
        return match.Groups["body"].Value;
    }
}
