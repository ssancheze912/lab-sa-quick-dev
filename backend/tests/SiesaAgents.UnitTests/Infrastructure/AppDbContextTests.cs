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
}
