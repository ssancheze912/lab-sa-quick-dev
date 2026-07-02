// -----------------------------------------------------------------------------
//  Story 2.4 — Edit Client
//  Unit tests for ClienteEntity.Update method (AC #4, #9).
//  Verifies: trim + required invariants + UpdatedAt refresh + Id/CreatedAt preservation.
// -----------------------------------------------------------------------------
using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

public class ClienteEntityUpdateTests
{
    [Fact]
    public async Task Update_ValidValues_MutatesFieldsAndRefreshesUpdatedAt()
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");
        var originalId = cliente.Id;
        var originalCreatedAt = cliente.CreatedAt;
        var originalUpdatedAt = cliente.UpdatedAt;

        // Delay so UpdatedAt strictly moves forward.
        await Task.Delay(5);
        cliente.Update("New", "900-2", "+57 111", "Bogotá");

        Assert.Equal(originalId, cliente.Id);
        Assert.Equal(originalCreatedAt, cliente.CreatedAt);
        Assert.Equal("New", cliente.Nombre);
        Assert.Equal("900-2", cliente.Nit);
        Assert.Equal("+57 111", cliente.Telefono);
        Assert.Equal("Bogotá", cliente.Ciudad);
        Assert.True(cliente.UpdatedAt > originalUpdatedAt,
            $"UpdatedAt {cliente.UpdatedAt:o} must be > original {originalUpdatedAt:o}.");
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("   ")]
    public void Update_WithEmptyNombre_ThrowsArgumentException(string invalid)
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        var ex = Assert.Throws<ArgumentException>(() =>
            cliente.Update(invalid, "900-1", "+57 000", "Cali"));

        Assert.Equal("nombre", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Update_WithEmptyNit_ThrowsArgumentException(string invalid)
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        var ex = Assert.Throws<ArgumentException>(() =>
            cliente.Update("Nombre", invalid, "+57 000", "Cali"));

        Assert.Equal("nit", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Update_WithEmptyTelefono_ThrowsArgumentException(string invalid)
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        var ex = Assert.Throws<ArgumentException>(() =>
            cliente.Update("Nombre", "900-1", invalid, "Cali"));

        Assert.Equal("telefono", ex.ParamName);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    public void Update_WithEmptyCiudad_ThrowsArgumentException(string invalid)
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        var ex = Assert.Throws<ArgumentException>(() =>
            cliente.Update("Nombre", "900-1", "+57 000", invalid));

        Assert.Equal("ciudad", ex.ParamName);
    }

    [Fact]
    public void Update_TrimsAllFields()
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        cliente.Update("  New  ", "  900-2  ", "  +57 111  ", "  Bogotá  ");

        Assert.Equal("New", cliente.Nombre);
        Assert.Equal("900-2", cliente.Nit);
        Assert.Equal("+57 111", cliente.Telefono);
        Assert.Equal("Bogotá", cliente.Ciudad);
    }

    [Fact]
    public void Update_WithControlWhitespace_Throws()
    {
        var cliente = ClienteEntity.Create("Old", "900-1", "+57 000", "Cali");

        var ex = Assert.Throws<ArgumentException>(() =>
            cliente.Update("\t\n", "900-1", "+57 000", "Cali"));

        Assert.Equal("nombre", ex.ParamName);
    }
}
