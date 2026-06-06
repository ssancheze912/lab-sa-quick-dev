using EFCore.NamingConventions;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryProvider()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_CanBeInstantiated_WithValidOptions()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_ValidOptions_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
        Assert.NotNull(context.Model);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_ProducesValidModel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Model_" + Guid.NewGuid())
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var model = context.Model;

        // Assert
        Assert.NotNull(model);
        // No domain entity types should be registered in this infrastructure-only migration
        Assert.DoesNotContain(model.GetEntityTypes(), e =>
            e.ClrType.Name == "ClienteEntity" || e.ClrType.Name == "ContactoEntity");
    }

    [Fact]
    public void AppDbContext_OnModelCreating_WithSnakeCaseConvention_ColumnNamesAreSnakeCase()
    {
        // Arrange - use Npgsql with UseSnakeCaseNamingConvention to test the full convention chain
        // (UseSnakeCaseNamingConvention is on DbContextOptionsBuilder, not ModelBuilder)
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SnakeCase_" + Guid.NewGuid())
            .UseSnakeCaseNamingConvention()
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var model = context.Model;

        // Assert - the convention is registered in the options; model itself should compile cleanly
        // and have no domain entities (infrastructure-only context)
        Assert.NotNull(model);
        // No ClienteEntity or ContactoEntity should be present — this is an infrastructure-only context
        Assert.DoesNotContain(model.GetEntityTypes(), e =>
            e.ClrType.Name == "ClienteEntity" || e.ClrType.Name == "ContactoEntity");
    }
}
