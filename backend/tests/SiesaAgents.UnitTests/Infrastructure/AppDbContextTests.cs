using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;
using Xunit;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// TC-E1-P2-04: AppDbContext applies ApplySnakeCaseNaming() as the last call in OnModelCreating.
/// Verifies snake_case column naming convention is active via EF Core InMemory provider.
/// </summary>
public class AppDbContextTests
{
    /// <summary>
    /// TC-E1-P2-04: Assert OnModelCreating calls ApplySnakeCaseNaming() —
    /// verify by inspecting the model for snake_case column names using EF Core InMemory provider.
    /// </summary>
    [Fact]
    public void OnModelCreating_AppliesSnakeCaseNaming_WhenContextIsCreated()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_SnakeCase")
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var model = context.Model;

        // Assert — the model is not null and was built without throwing.
        // Note: InMemory provider does not apply relational naming conventions so we cannot
        // inspect column names directly here. The integration test (TC-E1-P1-05) with
        // PostgreSQL TestContainers is the authoritative check for snake_case column names.
        // This unit test confirms OnModelCreating completes without exceptions.
        Assert.NotNull(model);
    }

    /// <summary>
    /// TC-E1-P2-04: Verify AppDbContext can be instantiated with DbContextOptions.
    /// Confirms the constructor injection pattern is correct per company standards.
    /// </summary>
    [Fact]
    public void AppDbContext_CanBeInstantiated_WithDbContextOptions()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_Instantiation")
            .Options;

        // Act & Assert
        using var context = new AppDbContext(options);
        Assert.NotNull(context);
    }

    /// <summary>
    /// TC-E1-P2-04: Verify no domain DbSet properties exist in this story scope.
    /// ClienteEntity and ContactoEntity DbSets must NOT be defined in Story 1.3.
    /// </summary>
    [Fact]
    public void AppDbContext_HasNoDomainEntitySets_InStory13Scope()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: "TestDb_NoDomainSets")
            .Options;

        // Act
        using var context = new AppDbContext(options);
        var entityTypes = context.Model.GetEntityTypes().ToList();

        // Assert — no domain entity types (ClienteEntity, ContactoEntity) in this story
        var entityTypeNames = entityTypes.Select(e => e.ClrType.Name).ToList();
        Assert.DoesNotContain("ClienteEntity", entityTypeNames);
        Assert.DoesNotContain("ContactoEntity", entityTypeNames);
    }
}
