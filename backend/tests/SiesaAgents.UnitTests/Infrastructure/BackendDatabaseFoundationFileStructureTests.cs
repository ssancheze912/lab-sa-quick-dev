/**
 * Story 1.3: Backend Database Foundation
 * Epic 1: Project Foundation & Application Shell
 *
 * ATDD Acceptance Tests — RED Phase (Static File Structure / Unit Level)
 * Tests that verify required files exist and contain expected code patterns.
 * These tests run WITHOUT dotnet SDK — they use System.IO and string parsing only.
 *
 * Acceptance Criteria covered:
 *   AC1 — EF Core migrations folder exists in SiesaAgents.Infrastructure/Data/Migrations/
 *   AC2 — ExceptionHandlingMiddleware returns RFC 7807 Problem Details; registered before routing
 *   AC3 — AppDbContext.cs calls ApplySnakeCaseNaming() as last call in OnModelCreating
 *
 * RED phase: Tests will FAIL when:
 *   AC1 — Migrations folder has no migration files (empty folder = migrations not created)
 *   AC2 — ExceptionHandlingMiddleware exists but Program.cs does NOT yet register it before app.UseCors
 *          (currently it does, but the middleware detail field exposes no stack trace — verify)
 *   AC3 — AppDbContext.cs does NOT call ApplySnakeCaseNaming() yet
 */

using System.IO;
using System.Text;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Static file-structure tests that verify C# source patterns satisfy AC1, AC2, AC3
/// from Story 1.3 without requiring dotnet EF CLI or a running backend.
/// </summary>
public class BackendDatabaseFoundationFileStructureTests
{
    // Compute absolute path to the repository root from the test assembly location
    private static string RepoRoot
    {
        get
        {
            // Assembly lives at: {repo}/backend/tests/SiesaAgents.UnitTests/bin/...
            // Navigate up to repo root: bin → UnitTests → tests → backend → repo
            var assemblyDir = AppContext.BaseDirectory;
            var candidate = new DirectoryInfo(assemblyDir);
            while (candidate != null && !File.Exists(Path.Combine(candidate.FullName, "SiesaAgents.sln")))
            {
                candidate = candidate.Parent;
            }
            // If not found by sln, try locating by backend/src marker
            if (candidate == null)
            {
                candidate = new DirectoryInfo(assemblyDir);
                while (candidate != null && !Directory.Exists(Path.Combine(candidate.FullName, "backend", "src")))
                {
                    candidate = candidate.Parent;
                }
            }
            return candidate?.FullName ?? throw new DirectoryNotFoundException(
                $"Cannot locate repository root from: {assemblyDir}");
        }
    }

    private static string BackendRoot => Path.Combine(RepoRoot, "backend");

    // ─────────────────────────────────────────────────────────────────────────
    // AC1: EF Core Migrations Folder Exists with at Least One Migration
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AC1_MigrationsFolder_ExistsInInfrastructureProject()
    {
        // Given: The Infrastructure project exists at backend/src/SiesaAgents.Infrastructure/
        // When: We check for the Migrations directory
        // Then: The folder exists — dotnet ef migrations add has been executed

        // Arrange
        var migrationsPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations");

        // Act & Assert
        Assert.True(
            Directory.Exists(migrationsPath),
            $"Migrations folder not found at: {migrationsPath}\n" +
            "Run: dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure " +
            "--startup-project src/SiesaAgents.API from backend/ directory");
    }

    [Fact]
    public void AC1_MigrationsFolder_ContainsInitialCreateMigrationFile()
    {
        // Given: The Migrations folder exists
        // When: We look for the InitialCreate migration file
        // Then: At least one *_InitialCreate.cs file exists in Migrations/

        // Arrange
        var migrationsPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations");

        // Act
        var migrationFiles = Directory.Exists(migrationsPath)
            ? Directory.GetFiles(migrationsPath, "*InitialCreate.cs")
            : Array.Empty<string>();

        // Assert
        Assert.True(
            migrationFiles.Length > 0,
            $"No InitialCreate migration file found in: {migrationsPath}\n" +
            "Expected: <timestamp>_InitialCreate.cs\n" +
            "Run: dotnet ef migrations add InitialCreate --project src/SiesaAgents.Infrastructure " +
            "--startup-project src/SiesaAgents.API --output-dir Data/Migrations");
    }

    [Fact]
    public void AC1_MigrationsFolder_ContainsModelSnapshotFile()
    {
        // Given: The Migrations folder exists with InitialCreate migration
        // When: We look for the AppDbContextModelSnapshot.cs file
        // Then: The snapshot file exists — EF tooling generated it correctly

        // Arrange
        var migrationsPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "Migrations");

        // Act
        var snapshotFiles = Directory.Exists(migrationsPath)
            ? Directory.GetFiles(migrationsPath, "*ModelSnapshot.cs")
            : Array.Empty<string>();

        // Assert
        Assert.True(
            snapshotFiles.Length > 0,
            $"No ModelSnapshot.cs file found in: {migrationsPath}\n" +
            "AppDbContextModelSnapshot.cs is generated automatically by dotnet ef migrations add");
    }

    [Fact]
    public void AC1_InfrastructureCsproj_HasEfCoreDesignPackage()
    {
        // Given: The Infrastructure project file exists
        // When: We check for Microsoft.EntityFrameworkCore.Design package reference
        // Then: The package is present — required for dotnet ef CLI to run

        // Arrange
        var csprojPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "SiesaAgents.Infrastructure.csproj");

        // Act
        Assert.True(File.Exists(csprojPath), $"csproj not found: {csprojPath}");
        var content = File.ReadAllText(csprojPath);

        // Assert
        Assert.True(
            content.Contains("Microsoft.EntityFrameworkCore.Design"),
            $"SiesaAgents.Infrastructure.csproj is missing Microsoft.EntityFrameworkCore.Design package reference.\n" +
            "Add: <PackageReference Include=\"Microsoft.EntityFrameworkCore.Design\" Version=\"10.0.0\" />");
    }

    [Fact]
    public void AC1_AppDbContextFactory_ExistsInInfrastructureData()
    {
        // Given: The Infrastructure Data folder exists
        // When: We check for AppDbContextFactory.cs
        // Then: The file exists — required for dotnet ef CLI without running the API

        // Arrange
        var factoryPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContextFactory.cs");

        // Act & Assert
        Assert.True(
            File.Exists(factoryPath),
            $"AppDbContextFactory.cs not found at: {factoryPath}\n" +
            "Create a class implementing IDesignTimeDbContextFactory<AppDbContext>");
    }

    [Fact]
    public void AC1_AppDbContextFactory_ImplementsIDesignTimeDbContextFactory()
    {
        // Given: AppDbContextFactory.cs exists
        // When: We inspect its content
        // Then: It implements IDesignTimeDbContextFactory<AppDbContext>

        // Arrange
        var factoryPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContextFactory.cs");

        if (!File.Exists(factoryPath))
        {
            Assert.Fail($"AppDbContextFactory.cs does not exist at: {factoryPath}");
        }

        // Act
        var content = File.ReadAllText(factoryPath);

        // Assert
        Assert.True(
            content.Contains("IDesignTimeDbContextFactory<AppDbContext>"),
            "AppDbContextFactory.cs must implement IDesignTimeDbContextFactory<AppDbContext>");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC2: ExceptionHandlingMiddleware returns RFC 7807 Problem Details
    //      and is registered BEFORE routing in Program.cs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AC2_ExceptionHandlingMiddleware_FileExists()
    {
        // Given: Story 1.1 created the middleware
        // When: We check for the file
        // Then: ExceptionHandlingMiddleware.cs exists

        // Arrange
        var middlewarePath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.API", "Middleware", "ExceptionHandlingMiddleware.cs");

        // Act & Assert
        Assert.True(
            File.Exists(middlewarePath),
            $"ExceptionHandlingMiddleware.cs not found at: {middlewarePath}");
    }

    [Fact]
    public void AC2_ExceptionHandlingMiddleware_ReturnsProblemDetailsFormat()
    {
        // Given: ExceptionHandlingMiddleware.cs exists
        // When: We inspect the content for RFC 7807 Problem Details pattern
        // Then: The middleware writes application/problem+json with ProblemDetails fields:
        //       Status (int), Title (string), Detail (null — no stack traces per NFR6)

        // Arrange
        var middlewarePath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.API", "Middleware", "ExceptionHandlingMiddleware.cs");

        Assert.True(File.Exists(middlewarePath), $"File not found: {middlewarePath}");
        var content = File.ReadAllText(middlewarePath);

        // Assert: RFC 7807 content type
        Assert.True(
            content.Contains("application/problem+json"),
            "ExceptionHandlingMiddleware must set ContentType = \"application/problem+json\" (RFC 7807)");

        // Assert: Uses ProblemDetails type
        Assert.True(
            content.Contains("ProblemDetails"),
            "ExceptionHandlingMiddleware must write a ProblemDetails object");

        // Assert: Status 500
        Assert.True(
            content.Contains("500"),
            "ExceptionHandlingMiddleware must set Status = 500 for unhandled exceptions");
    }

    [Fact]
    public void AC2_ExceptionHandlingMiddleware_DoesNotExposeStackTrace()
    {
        // Given: ExceptionHandlingMiddleware.cs exists
        // When: We inspect the content for stack trace exposure
        // Then: The Detail field must be null (not ex.Message, not ex.StackTrace)
        //       This satisfies NFR6 — no sensitive info in error responses

        // Arrange
        var middlewarePath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.API", "Middleware", "ExceptionHandlingMiddleware.cs");

        Assert.True(File.Exists(middlewarePath), $"File not found: {middlewarePath}");
        var content = File.ReadAllText(middlewarePath);

        // Assert: StackTrace must NOT be referenced in the response
        Assert.False(
            content.Contains("ex.StackTrace"),
            "ExceptionHandlingMiddleware must NOT expose ex.StackTrace in the response (NFR6)");

        // Assert: Detail must be null (not ex.Message either)
        Assert.False(
            content.Contains("Detail = ex.Message"),
            "ExceptionHandlingMiddleware must NOT set Detail = ex.Message in production (NFR6: no stack traces)");
    }

    [Fact]
    public void AC2_ProgramCs_RegistersExceptionHandlingMiddlewareBeforeCors()
    {
        // Given: Program.cs exists and ExceptionHandlingMiddleware is from Story 1.1
        // When: We inspect middleware registration order in Program.cs
        // Then: app.UseMiddleware<ExceptionHandlingMiddleware>() appears BEFORE app.UseCors(...)
        //       Middleware must be first in the pipeline to catch ALL exceptions including CORS errors

        // Arrange
        var programPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.API", "Program.cs");

        Assert.True(File.Exists(programPath), $"Program.cs not found at: {programPath}");
        var content = File.ReadAllText(programPath);
        var lines = content.Split('\n');

        // Act: Find line numbers for each registration
        int exceptionMiddlewareLine = -1;
        int corsLine = -1;
        int mapEndpointsLine = -1;

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (line.Contains("UseMiddleware<ExceptionHandlingMiddleware>"))
                exceptionMiddlewareLine = i;
            if (line.Contains("UseCors"))
                corsLine = i;
            if (line.Contains("MapOpenApi") || line.Contains("MapScalarApiReference"))
                mapEndpointsLine = i;
        }

        // Assert: ExceptionHandlingMiddleware is registered
        Assert.True(
            exceptionMiddlewareLine >= 0,
            "Program.cs must register: app.UseMiddleware<ExceptionHandlingMiddleware>()");

        // Assert: ExceptionHandlingMiddleware appears before UseCors
        if (corsLine >= 0)
        {
            Assert.True(
                exceptionMiddlewareLine < corsLine,
                $"ExceptionHandlingMiddleware must be registered BEFORE UseCors in Program.cs.\n" +
                $"ExceptionHandlingMiddleware is on line {exceptionMiddlewareLine + 1}, " +
                $"UseCors is on line {corsLine + 1}");
        }

        // Assert: ExceptionHandlingMiddleware appears before endpoint mapping
        if (mapEndpointsLine >= 0)
        {
            Assert.True(
                exceptionMiddlewareLine < mapEndpointsLine,
                $"ExceptionHandlingMiddleware must be registered BEFORE endpoint mapping in Program.cs.\n" +
                $"ExceptionHandlingMiddleware is on line {exceptionMiddlewareLine + 1}, " +
                $"MapOpenApi/MapScalar is on line {mapEndpointsLine + 1}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AC3: ApplySnakeCaseNaming() is the LAST call in OnModelCreating
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void AC3_AppDbContext_FileExists()
    {
        // Given: Story 1.1 created the AppDbContext stub
        // When: We check for AppDbContext.cs
        // Then: The file exists in Infrastructure/Data/

        // Arrange
        var contextPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContext.cs");

        // Act & Assert
        Assert.True(
            File.Exists(contextPath),
            $"AppDbContext.cs not found at: {contextPath}");
    }

    [Fact]
    public void AC3_AppDbContext_CallsApplySnakeCaseNaming()
    {
        // Given: AppDbContext.cs exists
        // When: We inspect OnModelCreating content
        // Then: ApplySnakeCaseNaming() is called

        // Arrange
        var contextPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContext.cs");

        Assert.True(File.Exists(contextPath), $"AppDbContext.cs not found: {contextPath}");
        var content = File.ReadAllText(contextPath);

        // Assert
        Assert.True(
            content.Contains("ApplySnakeCaseNaming"),
            "AppDbContext.OnModelCreating must call modelBuilder.ApplySnakeCaseNaming().\n" +
            "Add: modelBuilder.ApplySnakeCaseNaming(); as the LAST line in OnModelCreating.\n" +
            "This is provided by Npgsql.EntityFrameworkCore.PostgreSQL and enforces snake_case " +
            "for all table and column names.");
    }

    [Fact]
    public void AC3_AppDbContext_ApplySnakeCaseNaming_IsLastCallInOnModelCreating()
    {
        // Given: AppDbContext.cs calls ApplySnakeCaseNaming()
        // When: We parse the OnModelCreating method body
        // Then: ApplySnakeCaseNaming() is the LAST substantive call —
        //       it must come after ApplyConfigurationsFromAssembly to override prior naming

        // Arrange
        var contextPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContext.cs");

        Assert.True(File.Exists(contextPath), $"AppDbContext.cs not found: {contextPath}");
        var content = File.ReadAllText(contextPath);

        // Act: Find line positions
        var lines = content.Split('\n');
        int snakeCaseLine = -1;
        int applyConfigurationsLine = -1;
        int baseOnModelCreatingLine = -1;

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            if (line.Contains("ApplySnakeCaseNaming"))
                snakeCaseLine = i;
            if (line.Contains("ApplyConfigurationsFromAssembly"))
                applyConfigurationsLine = i;
            if (line.Contains("base.OnModelCreating"))
                baseOnModelCreatingLine = i;
        }

        // Assert: ApplySnakeCaseNaming is present
        Assert.True(
            snakeCaseLine >= 0,
            "modelBuilder.ApplySnakeCaseNaming() must be called in OnModelCreating");

        // Assert: ApplySnakeCaseNaming comes AFTER ApplyConfigurationsFromAssembly
        if (applyConfigurationsLine >= 0)
        {
            Assert.True(
                snakeCaseLine > applyConfigurationsLine,
                $"ApplySnakeCaseNaming() must appear AFTER ApplyConfigurationsFromAssembly().\n" +
                $"ApplyConfigurationsFromAssembly is on line {applyConfigurationsLine + 1}, " +
                $"ApplySnakeCaseNaming is on line {snakeCaseLine + 1}.\n" +
                "Snake_case naming must be applied last to override all prior naming conventions.");
        }

        // Assert: ApplySnakeCaseNaming comes AFTER base.OnModelCreating
        if (baseOnModelCreatingLine >= 0)
        {
            Assert.True(
                snakeCaseLine > baseOnModelCreatingLine,
                $"ApplySnakeCaseNaming() must appear AFTER base.OnModelCreating(modelBuilder).\n" +
                $"base.OnModelCreating is on line {baseOnModelCreatingLine + 1}, " +
                $"ApplySnakeCaseNaming is on line {snakeCaseLine + 1}.");
        }
    }

    [Fact]
    public void AC3_AppDbContext_UsesNpgsqlProvider_InInfrastructureCsproj()
    {
        // Given: ApplySnakeCaseNaming() is from Npgsql.EntityFrameworkCore.PostgreSQL
        // When: We check the Infrastructure csproj
        // Then: Npgsql.EntityFrameworkCore.PostgreSQL package is referenced

        // Arrange
        var csprojPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "SiesaAgents.Infrastructure.csproj");

        Assert.True(File.Exists(csprojPath), $"csproj not found: {csprojPath}");
        var content = File.ReadAllText(csprojPath);

        // Assert
        Assert.True(
            content.Contains("Npgsql.EntityFrameworkCore.PostgreSQL"),
            "SiesaAgents.Infrastructure.csproj must reference Npgsql.EntityFrameworkCore.PostgreSQL " +
            "to enable ApplySnakeCaseNaming() extension method");
    }

    [Fact]
    public void AC3_AppDbContext_UsesPrimaryConstructorPattern()
    {
        // Given: AppDbContext.cs exists
        // When: We inspect the class definition
        // Then: Uses C# primary constructor: AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
        //       This is the company-approved pattern for .NET 10 EF Core contexts

        // Arrange
        var contextPath = Path.Combine(
            BackendRoot,
            "src", "SiesaAgents.Infrastructure", "Data", "AppDbContext.cs");

        Assert.True(File.Exists(contextPath), $"AppDbContext.cs not found: {contextPath}");
        var content = File.ReadAllText(contextPath);

        // Assert
        Assert.True(
            content.Contains("DbContextOptions<AppDbContext>"),
            "AppDbContext must accept DbContextOptions<AppDbContext> (primary constructor or injected via DI)");

        Assert.True(
            content.Contains(": DbContext"),
            "AppDbContext must inherit from DbContext");
    }
}
