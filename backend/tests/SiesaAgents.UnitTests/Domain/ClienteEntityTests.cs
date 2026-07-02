// -----------------------------------------------------------------------------
//  Story 2.1 — Client List & Search
//  Unit tests for the ClienteEntity factory and invariants (AC #8).
// -----------------------------------------------------------------------------
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityTests
{
    [Fact]
    public void Create_WithValidData_ReturnsEntityWithTrimmedFieldsAndTimestamps()
    {
        var before = DateTimeOffset.UtcNow;

        var cliente = ClienteEntity.Create(
            "  Acme Corp  ",
            " 900123456-7 ",
            "+57 300 111 1111",
            " Cali ");

        var after = DateTimeOffset.UtcNow;

        Assert.NotEqual(Guid.Empty, cliente.Id);
        Assert.Equal("Acme Corp", cliente.Nombre);
        Assert.Equal("900123456-7", cliente.Nit);
        Assert.Equal("+57 300 111 1111", cliente.Telefono);
        Assert.Equal("Cali", cliente.Ciudad);
        Assert.InRange(cliente.CreatedAt, before, after);
        Assert.InRange(cliente.UpdatedAt, before, after);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    public void Create_WithEmptyNombre_ThrowsArgumentException(string invalid)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(invalid, "900", "300", "Cali"));

        Assert.Equal("nombre", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithEmptyNit_ThrowsArgumentException(string invalid)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Nombre", invalid, "300", "Cali"));

        Assert.Equal("nit", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithEmptyTelefono_ThrowsArgumentException(string invalid)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Nombre", "900", invalid, "Cali"));

        Assert.Equal("telefono", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithEmptyCiudad_ThrowsArgumentException(string invalid)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Nombre", "900", "300", invalid));

        Assert.Equal("ciudad", ex.ParamName);
    }

    [Fact]
    public void Create_TwoInstances_GenerateDistinctGuids()
    {
        var a = ClienteEntity.Create("A", "900", "300", "Cali");
        var b = ClienteEntity.Create("B", "800", "301", "Bogotá");

        Assert.NotEqual(a.Id, b.Id);
    }
}
