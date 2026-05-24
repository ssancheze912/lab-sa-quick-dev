using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class DbContextConfigurationTests
{
    [Fact]
    public void DbContext_CanBeInstantiated_WithInMemoryDatabase()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Act & Assert
        using var context = new SiesaAgentsDbContext(options);
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_DoesNotThrow_WithSnakeCaseNaming()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<SiesaAgentsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new SiesaAgentsDbContext(options);

        // Act — EnsureCreated triggers OnModelCreating
        Action act = () => context.Database.EnsureCreated();

        // Assert
        var exception = Record.Exception(act);
        Assert.Null(exception);
    }
}
