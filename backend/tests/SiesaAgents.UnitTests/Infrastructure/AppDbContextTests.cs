using Xunit;
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithInMemoryDatabase()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_db_instantiation")
            .Options;

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    [Fact]
    public void AppDbContext_OnModelCreating_DoesNotThrow()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_db_model_creating")
            .Options;

        // Act & Assert — EnsureCreated triggers OnModelCreating
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Database.EnsureCreated());
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_HasNoEntityTypeTables_EmptyModel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "test_db_empty_model")
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Assert — no domain entity types registered in this story
        Assert.Empty(entityTypes);
    }
}
