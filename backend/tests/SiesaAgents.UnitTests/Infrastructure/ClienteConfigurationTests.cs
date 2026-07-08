using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using SiesaAgents.Domain.Clientes.Entities;
using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

/// <summary>
/// Story 2.1 — ATDD (RED phase).
///
/// Verifies the <c>ClienteConfiguration</c> EF Core mapping (Task 2) at the
/// model-builder level, without touching a live PostgreSQL database:
///   * Table is named "clientes" (AC #9).
///   * Every string column is required (NOT NULL) (AC #9).
///   * String columns have the max-length constraints from AC #9
///     (Nombre 200, Nit 50, Telefono 50, Ciudad 100).
///   * A UNIQUE index exists on Nit with the name "uk_clientes_nit" (AC #9, FR7).
///   * <see cref="ClienteEntity"/> is present as a DbSet in the model (AC #9).
///
/// The model is built via a fresh <see cref="AppDbContext"/> with the same
/// options profile used at runtime (Npgsql + snake_case). No DB I/O.
/// </summary>
public sealed class ClienteConfigurationTests
{
    private static IEntityType BuildEntityType()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=x;Database=x;Username=x;Password=x")
            .UseSnakeCaseNamingConvention()
            .Options;

        using var ctx = new AppDbContext(options);
        var entity = ctx.Model.FindEntityType(typeof(ClienteEntity));
        Assert.NotNull(entity);
        return entity!;
    }

    // AC #9 — Table name is "clientes".
    [Fact]
    public void Configuration_MapsClienteEntity_ToClientesTable()
    {
        var entity = BuildEntityType();
        Assert.Equal("clientes", entity.GetTableName());
    }

    // AC #9 — All string properties are required (NOT NULL).
    [Theory]
    [InlineData(nameof(ClienteEntity.Nombre))]
    [InlineData(nameof(ClienteEntity.Nit))]
    [InlineData(nameof(ClienteEntity.Telefono))]
    [InlineData(nameof(ClienteEntity.Ciudad))]
    public void Configuration_MarksStringProperty_AsRequired(string propertyName)
    {
        var entity = BuildEntityType();
        var property = entity.FindProperty(propertyName);
        Assert.NotNull(property);
        Assert.False(property!.IsNullable, $"Property {propertyName} must be NOT NULL.");
    }

    // AC #9 — Max lengths for strings.
    [Theory]
    [InlineData(nameof(ClienteEntity.Nombre), 200)]
    [InlineData(nameof(ClienteEntity.Nit), 50)]
    [InlineData(nameof(ClienteEntity.Telefono), 50)]
    [InlineData(nameof(ClienteEntity.Ciudad), 100)]
    public void Configuration_SetsMaxLength_ForStringProperty(string propertyName, int expectedMaxLength)
    {
        var entity = BuildEntityType();
        var property = entity.FindProperty(propertyName);
        Assert.NotNull(property);
        Assert.Equal(expectedMaxLength, property!.GetMaxLength());
    }

    // AC #9 — UNIQUE index on Nit with database name "uk_clientes_nit".
    [Fact]
    public void Configuration_DefinesUniqueIndex_OnNit_NamedUkClientesNit()
    {
        var entity = BuildEntityType();

        var uniqueIndex = entity.GetIndexes()
            .Where(i => i.IsUnique)
            .FirstOrDefault(i => i.Properties.Count == 1
                && i.Properties[0].Name == nameof(ClienteEntity.Nit));

        Assert.NotNull(uniqueIndex);
        Assert.Equal("uk_clientes_nit", uniqueIndex!.GetDatabaseName());
    }

    // AC #9 — Timestamps are required (server-side default DateTimeOffset).
    [Theory]
    [InlineData(nameof(ClienteEntity.CreatedAt))]
    [InlineData(nameof(ClienteEntity.UpdatedAt))]
    public void Configuration_MarksTimestampProperty_AsRequired(string propertyName)
    {
        var entity = BuildEntityType();
        var property = entity.FindProperty(propertyName);
        Assert.NotNull(property);
        Assert.False(property!.IsNullable, $"Property {propertyName} must be NOT NULL.");
    }

    // AC #9 — Primary key is Id (Guid).
    [Fact]
    public void Configuration_UsesId_AsPrimaryKey()
    {
        var entity = BuildEntityType();
        var pk = entity.FindPrimaryKey();
        Assert.NotNull(pk);
        var pkProperty = Assert.Single(pk!.Properties);
        Assert.Equal(nameof(ClienteEntity.Id), pkProperty.Name);
        Assert.Equal(typeof(Guid), pkProperty.ClrType);
    }
}
