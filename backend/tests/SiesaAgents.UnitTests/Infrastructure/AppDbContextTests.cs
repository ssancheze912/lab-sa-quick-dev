using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextTests
{
    private static DbContextOptions<AppDbContext> BuildInMemoryOptions() =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

    [Fact]
    public void AppDbContext_Instantiates_WithInMemoryOptions()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);

        // Assert
        Assert.NotNull(context);
    }

    [Fact]
    public void OnModelCreating_Runs_WithoutException()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);
        var exception = Record.Exception(() => context.Model); // triggers OnModelCreating

        // Assert
        Assert.Null(exception);
    }

    [Fact]
    public void AppDbContext_HasNoDbSets_AtInitialStage()
    {
        // Arrange
        var options = BuildInMemoryOptions();

        // Act
        using var context = new AppDbContext(options);

        // Assert — no domain entity types registered at this stage (Epic 2 and Epic 3 add them)
        var entityTypes = context.Model.GetEntityTypes().ToList();
        Assert.Empty(entityTypes);
    }
}
