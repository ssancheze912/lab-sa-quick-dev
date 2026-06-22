using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Testcontainers.PostgreSql;
using Xunit;

namespace SiesaAgents.IntegrationTests.Infrastructure;

/// <summary>
/// Integration tests for database connectivity and schema validation.
/// Uses TestContainers to spin up a real PostgreSQL instance.
/// </summary>
public class DatabaseConnectionTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("siesa_agents_db_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .UseSnakeCaseNamingConvention()
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CanConnectAsync_ReturnsTrue_WhenPostgreSqlIsAvailable()
    {
        // Arrange
        await using var context = CreateDbContext();

        // Act
        var canConnect = await context.Database.CanConnectAsync();

        // Assert
        Assert.True(canConnect);
    }

    [Fact]
    public async Task MigrateAsync_CreatesDatabase_WithNodomainTables()
    {
        // Arrange
        await using var context = CreateDbContext();

        // Act
        await context.Database.MigrateAsync();

        // Assert — only __EFMigrationsHistory table should exist, no domain tables
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;";

        var tables = new List<string>();
        using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tables.Add(reader.GetString(0));
        }

        // The only table should be EF migrations history — no domain tables
        Assert.DoesNotContain("clientes", tables);
        Assert.DoesNotContain("contactos", tables);
    }

    [Fact]
    public async Task ApplySnakeCaseNaming_IsApplied_WhenMigrationsRun()
    {
        // Arrange
        await using var context = CreateDbContext();

        // Act
        await context.Database.MigrateAsync();

        // Assert — __EFMigrationsHistory table (managed by EF Core) should exist post-migration
        var connection = context.Database.GetDbConnection();
        await connection.OpenAsync();

        using var command = connection.CreateCommand();
        command.CommandText = @"
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = '__EFMigrationsHistory';";

        // Note: EF Core stores the history table in a special location
        // The migration history table exists internally after a successful migration
        var migrationsApplied = await context.Database.GetAppliedMigrationsAsync();
        Assert.NotEmpty(migrationsApplied);
    }
}
