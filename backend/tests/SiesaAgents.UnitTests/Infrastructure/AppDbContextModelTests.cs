// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Updated in Epic 2: the Story 1.3 "no domain DbSets" scope-note guards were
//  intentionally invalidated when ClienteEntity landed. This suite now asserts
//  the positive shape: ClienteEntity is registered, snake_case is applied,
//  and the DbContext still boots on the InMemory provider (Docker-less CI).
// -----------------------------------------------------------------------------
using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class AppDbContextModelTests
{
    private static DbContextOptions<AppDbContext> InMemoryOptions(string dbName) =>
        new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

    [Fact]
    public void GivenAppDbContext_WhenOnModelCreatingRuns_ThenClienteEntityIsRegistered()
    {
        using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContext_WhenOnModelCreatingRuns_ThenClienteEntityIsRegistered)));

        var typeNames = ctx.Model.GetEntityTypes().Select(e => e.ClrType.Name).ToList();

        Assert.Contains("ClienteEntity", typeNames);
    }

    [Fact]
    public void GivenAppDbContext_WhenClienteEntityMapped_ThenTableAndColumnsAreSnakeCase()
    {
        using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContext_WhenClienteEntityMapped_ThenTableAndColumnsAreSnakeCase)));

        var clientes = ctx.Model.GetEntityTypes()
            .SingleOrDefault(e => e.ClrType.Name == "ClienteEntity");
        Assert.NotNull(clientes);

        Assert.Equal("clientes", clientes!.GetTableName());

        var columns = clientes.GetProperties().Select(p => p.GetColumnName()).ToList();
        Assert.Contains("id", columns);
        Assert.Contains("nombre", columns);
        Assert.Contains("nit", columns);
        Assert.Contains("telefono", columns);
        Assert.Contains("ciudad", columns);
        Assert.Contains("created_at", columns);
        Assert.Contains("updated_at", columns);

        // PascalCase leaks would break the snake_case convention (NFR6 / R-002).
        Assert.DoesNotContain("Id", columns);
        Assert.DoesNotContain("CreatedAt", columns);
    }

    [Fact]
    public void GivenAppDbContext_WhenConstructedWithInMemoryProvider_ThenOnModelCreatingCompletesWithoutThrowing()
    {
        var exception = Record.Exception(() =>
        {
            using var ctx = new AppDbContext(InMemoryOptions(nameof(GivenAppDbContext_WhenConstructedWithInMemoryProvider_ThenOnModelCreatingCompletesWithoutThrowing)));
            _ = ctx.Model.GetEntityTypes().ToList();
        });

        Assert.Null(exception);
    }

    [Fact]
    public void GivenAppDbContext_WhenInspected_ThenItInheritsFromDbContext()
    {
        Assert.True(typeof(DbContext).IsAssignableFrom(typeof(AppDbContext)));
    }

    [Fact]
    public void GivenAppDbContextType_WhenReflected_ThenClientesDbSetIsExposed()
    {
        var dbSetProperties = typeof(AppDbContext)
            .GetProperties(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance)
            .Where(p => p.PropertyType.IsGenericType
                        && p.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>))
            .ToList();

        Assert.Contains(dbSetProperties, p => p.Name == "Clientes");
    }
}
