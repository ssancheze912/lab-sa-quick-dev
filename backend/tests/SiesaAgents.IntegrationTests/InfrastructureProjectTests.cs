using System;
using System.IO;
using System.Linq;
using System.Xml.Linq;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// ATDD - RED phase tests for Story 1.3 (Backend Database Foundation).
///
/// Covers:
///   AC #6 — <c>SiesaAgents.Infrastructure.csproj</c> references the EF Core
///           v10.x packages (<c>Microsoft.EntityFrameworkCore</c>,
///           <c>Microsoft.EntityFrameworkCore.Design</c>) on top of the existing
///           <c>Npgsql.EntityFrameworkCore.PostgreSQL</c>.
///   AC #1 + #3 — The <c>InitialCreate</c> migration exists under
///           <c>backend/src/SiesaAgents.Infrastructure/Data/Migrations/</c> and
///           its <c>Up()</c> method body contains NO <c>CreateTable</c> /
///           <c>CreateIndex</c> calls.
///
/// These tests are expected to FAIL until:
///   1. EF Core 10.x and EF Core Design 10.x are added to the Infrastructure csproj.
///   2. <c>dotnet ef migrations add InitialCreate --output-dir Data/Migrations</c>
///      has been executed and an empty migration committed.
/// </summary>
public class InfrastructureProjectTests
{
    private static string InfrastructureProjectPath()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(
                dir.FullName,
                "src",
                "SiesaAgents.Infrastructure",
                "SiesaAgents.Infrastructure.csproj");
            if (File.Exists(candidate)) return candidate;

            var sibling = Path.Combine(
                dir.FullName,
                "backend",
                "src",
                "SiesaAgents.Infrastructure",
                "SiesaAgents.Infrastructure.csproj");
            if (File.Exists(sibling)) return sibling;

            dir = dir.Parent;
        }
        return string.Empty;
    }

    private static string InfrastructureDataMigrationsDir()
    {
        var csproj = InfrastructureProjectPath();
        if (string.IsNullOrEmpty(csproj)) return string.Empty;
        return Path.Combine(Path.GetDirectoryName(csproj)!, "Data", "Migrations");
    }

    /// <summary>
    /// AC #6 — <c>Microsoft.EntityFrameworkCore</c> 10.x reference present.
    ///
    /// GIVEN the Infrastructure project.
    /// WHEN  its csproj is inspected.
    /// THEN  it declares a <c>PackageReference</c> to
    ///       <c>Microsoft.EntityFrameworkCore</c> with version starting with <c>10.</c>.
    /// </summary>
    [Fact]
    public void Infrastructure_References_EntityFrameworkCore_10()
    {
        // GIVEN
        var path = InfrastructureProjectPath();
        Assert.True(File.Exists(path), $"Infrastructure csproj not found at '{path}'");

        // WHEN
        var doc = XDocument.Load(path);
        var refs = doc.Descendants("PackageReference")
            .Select(e => new
            {
                Name = (string?)e.Attribute("Include"),
                Version = (string?)e.Attribute("Version"),
            })
            .ToList();

        // THEN
        Assert.Contains(refs, r =>
            r.Name == "Microsoft.EntityFrameworkCore" &&
            r.Version is not null &&
            r.Version.StartsWith("10."));
    }

    /// <summary>
    /// AC #6 — <c>Microsoft.EntityFrameworkCore.Design</c> 10.x reference present.
    /// </summary>
    [Fact]
    public void Infrastructure_References_EntityFrameworkCore_Design_10()
    {
        // GIVEN
        var path = InfrastructureProjectPath();
        Assert.True(File.Exists(path), $"Infrastructure csproj not found at '{path}'");

        // WHEN
        var doc = XDocument.Load(path);
        var refs = doc.Descendants("PackageReference")
            .Select(e => new
            {
                Name = (string?)e.Attribute("Include"),
                Version = (string?)e.Attribute("Version"),
            })
            .ToList();

        // THEN
        Assert.Contains(refs, r =>
            r.Name == "Microsoft.EntityFrameworkCore.Design" &&
            r.Version is not null &&
            r.Version.StartsWith("10."));
    }

    /// <summary>
    /// AC #6 — <c>Npgsql.EntityFrameworkCore.PostgreSQL</c> stays on 10.x.
    /// </summary>
    [Fact]
    public void Infrastructure_References_NpgsqlEntityFrameworkCorePostgreSQL_10()
    {
        // GIVEN
        var path = InfrastructureProjectPath();
        Assert.True(File.Exists(path), $"Infrastructure csproj not found at '{path}'");

        // WHEN
        var doc = XDocument.Load(path);
        var refs = doc.Descendants("PackageReference")
            .Select(e => new
            {
                Name = (string?)e.Attribute("Include"),
                Version = (string?)e.Attribute("Version"),
            })
            .ToList();

        // THEN
        Assert.Contains(refs, r =>
            r.Name == "Npgsql.EntityFrameworkCore.PostgreSQL" &&
            r.Version is not null &&
            r.Version.StartsWith("10."));
    }

    /// <summary>
    /// AC #1 + AC #3 — An <c>InitialCreate</c> migration exists under
    /// <c>SiesaAgents.Infrastructure/Data/Migrations/</c>.
    ///
    /// GIVEN the Infrastructure project.
    /// WHEN  the Migrations folder is inspected.
    /// THEN  a file matching <c>*_InitialCreate.cs</c> exists.
    /// </summary>
    [Fact]
    public void InitialCreate_Migration_FileExists()
    {
        // GIVEN
        var migrationsDir = InfrastructureDataMigrationsDir();
        Assert.False(string.IsNullOrEmpty(migrationsDir),
            "Could not locate backend/src/SiesaAgents.Infrastructure/ from test bin output.");

        // WHEN
        var initialCreate = Directory.Exists(migrationsDir)
            ? Directory.GetFiles(migrationsDir, "*_InitialCreate.cs", SearchOption.TopDirectoryOnly)
            : Array.Empty<string>();

        // THEN
        Assert.NotEmpty(initialCreate);
    }

    /// <summary>
    /// AC #3 — The generated migration's <c>Up()</c> method body is empty
    /// (no <c>CreateTable</c> / <c>CreateIndex</c> / <c>AddColumn</c> /
    /// <c>AddForeignKey</c> calls).
    ///
    /// GIVEN the <c>InitialCreate</c> migration file exists.
    /// WHEN  its source is inspected.
    /// THEN  it contains NO calls to <c>CreateTable(</c> / <c>CreateIndex(</c> /
    ///       <c>AddColumn(</c> / <c>AddForeignKey(</c>.
    /// </summary>
    [Fact]
    public void InitialCreate_Migration_HasEmptyUpMethod()
    {
        // GIVEN
        var migrationsDir = InfrastructureDataMigrationsDir();
        Assert.True(Directory.Exists(migrationsDir),
            $"Migrations folder not found at '{migrationsDir}'");

        var files = Directory.GetFiles(migrationsDir, "*_InitialCreate.cs", SearchOption.TopDirectoryOnly);
        Assert.NotEmpty(files);
        var migrationSource = File.ReadAllText(files[0]);

        // WHEN / THEN — must not contain schema-mutating calls in Up().
        var forbiddenCalls = new[]
        {
            "CreateTable(",
            "CreateIndex(",
            "AddColumn(",
            "AddForeignKey(",
            "AddPrimaryKey(",
            "AddUniqueConstraint(",
        };
        foreach (var call in forbiddenCalls)
        {
            Assert.DoesNotContain(call, migrationSource);
        }
    }
}
