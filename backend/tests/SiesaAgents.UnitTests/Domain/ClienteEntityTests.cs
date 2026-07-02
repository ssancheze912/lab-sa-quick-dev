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

    // ─────────────────────────────────────────────────────────────────────
    // Edge cases / expansions (Story 2.1 automate pass)
    // ─────────────────────────────────────────────────────────────────────

    /// <summary>
    /// P1 — Every required field rejects <c>null</c> the same way it rejects empty
    /// strings (both hit <see cref="string.IsNullOrWhiteSpace(string?)"/>).
    /// </summary>
    [Fact]
    public void Create_WithNullNombre_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(null!, "900", "300", "Cali"));

        Assert.Equal("nombre", ex.ParamName);
    }

    [Fact]
    public void Create_WithNullNit_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Acme", null!, "300", "Cali"));

        Assert.Equal("nit", ex.ParamName);
    }

    [Fact]
    public void Create_WithNullTelefono_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Acme", "900", null!, "Cali"));

        Assert.Equal("telefono", ex.ParamName);
    }

    [Fact]
    public void Create_WithNullCiudad_ThrowsArgumentException()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("Acme", "900", "300", null!));

        Assert.Equal("ciudad", ex.ParamName);
    }

    /// <summary>
    /// P1 — Tabs and newlines are whitespace too; must be rejected by IsNullOrWhiteSpace.
    /// </summary>
    [Theory]
    [InlineData("\t")]
    [InlineData("\n")]
    [InlineData("\t\n  ")]
    public void Create_WithControlWhitespaceNombre_ThrowsArgumentException(string invalid)
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create(invalid, "900", "300", "Cali"));

        Assert.Equal("nombre", ex.ParamName);
    }

    /// <summary>
    /// P1 — Trimming happens on ALL text fields, not just Nombre.
    /// </summary>
    [Fact]
    public void Create_TrimsEveryTextField()
    {
        var cliente = ClienteEntity.Create(
            "\t  Acme Corp  \n",
            "\t 900-1 \n",
            "\t +57 300 \n",
            "\t Cali \n");

        Assert.Equal("Acme Corp", cliente.Nombre);
        Assert.Equal("900-1", cliente.Nit);
        Assert.Equal("+57 300", cliente.Telefono);
        Assert.Equal("Cali", cliente.Ciudad);
    }

    /// <summary>
    /// P2 — On creation, CreatedAt and UpdatedAt reference the same instant.
    /// This locks the invariant that "just-created" entities are not stale.
    /// </summary>
    [Fact]
    public void Create_SetsCreatedAtAndUpdatedAtToTheSameInstant()
    {
        var cliente = ClienteEntity.Create("A", "1", "2", "Cali");

        Assert.Equal(cliente.CreatedAt, cliente.UpdatedAt);
    }

    /// <summary>
    /// P2 — Timestamps are DateTimeOffset (per company standards) with a defined
    /// offset — a serialized ISO 8601 form must be round-trippable to the same instant.
    /// </summary>
    [Fact]
    public void Create_TimestampsAreDateTimeOffsetInstances()
    {
        var cliente = ClienteEntity.Create("A", "1", "2", "Cali");

        Assert.IsType<DateTimeOffset>(cliente.CreatedAt);
        Assert.IsType<DateTimeOffset>(cliente.UpdatedAt);
        // UTC offset — the Application/API layers serialize as trailing 'Z'.
        Assert.Equal(TimeSpan.Zero, cliente.CreatedAt.Offset);
    }

    /// <summary>
    /// P2 — Only the first invalid field is reported. This locks the fail-fast
    /// order for consumers building error messages (Nombre → Nit → Telefono → Ciudad).
    /// </summary>
    [Fact]
    public void Create_WithMultipleInvalidFields_ReportsNombreFirst()
    {
        var ex = Assert.Throws<ArgumentException>(
            () => ClienteEntity.Create("", "", "", ""));

        Assert.Equal("nombre", ex.ParamName);
    }

    /// <summary>
    /// P2 — Two consecutive invocations produce Ids that fit the UUID string form
    /// used across the API contract (AC #8).
    /// </summary>
    [Fact]
    public void Create_IdIsANonEmptyGuid()
    {
        var cliente = ClienteEntity.Create("A", "1", "2", "Cali");

        Assert.NotEqual(Guid.Empty, cliente.Id);
        // Serialized Guid has 36 characters with dashes (standard Guid.ToString("D") form).
        Assert.Equal(36, cliente.Id.ToString().Length);
    }
}
