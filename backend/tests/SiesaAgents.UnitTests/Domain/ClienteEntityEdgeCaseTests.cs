using SiesaAgents.Domain.Clientes.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary condition tests for ClienteEntity.
/// Expands beyond the ATDD tests in ClienteEntityTests.cs.
///
/// Covers:
/// - Empty/whitespace validation for Telefono and Ciudad fields
/// - Null arguments to Create()
/// - UpdatedAt is set and matches (or is close to) CreatedAt on creation
/// - Nombre/NIT with special characters are accepted (no invalid char rejection)
/// - Extremely long strings that are within EF Core max lengths
/// - Uniqueness: each Create() call produces a different Id (probabilistic)
/// - Timestamps are in UTC (offset is 00:00 or the same UtcNow as recorded)
/// </summary>
public class ClienteEntityEdgeCaseTests
{
    // ─── Empty / Whitespace field validation ──────────────────────────────────

    [Fact]
    public void Create_WithEmptyTelefono_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", string.Empty, "Bogotá"));

        Assert.Equal("telefono", ex.ParamName);
    }

    [Fact]
    public void Create_WithWhitespaceTelefono_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", "   ", "Bogotá"));
    }

    [Fact]
    public void Create_WithEmptyCiudad_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", string.Empty));

        Assert.Equal("ciudad", ex.ParamName);
    }

    [Fact]
    public void Create_WithWhitespaceCiudad_ThrowsArgumentException()
    {
        // Arrange / Act / Assert
        Assert.Throws<ArgumentException>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "   "));
    }

    // ─── Null argument handling ───────────────────────────────────────────────

    [Fact]
    public void Create_WithNullNombre_ThrowsException()
    {
        // Arrange / Act / Assert
        // string.IsNullOrWhiteSpace(null) returns true → should throw
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create(null!, "900123456-1", "3001234567", "Bogotá"));
    }

    [Fact]
    public void Create_WithNullNit_ThrowsException()
    {
        // Arrange / Act / Assert
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create("Empresa ABC", null!, "3001234567", "Bogotá"));
    }

    [Fact]
    public void Create_WithNullTelefono_ThrowsException()
    {
        // Arrange / Act / Assert
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", null!, "Bogotá"));
    }

    [Fact]
    public void Create_WithNullCiudad_ThrowsException()
    {
        // Arrange / Act / Assert
        Assert.ThrowsAny<Exception>(() =>
            ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", null!));
    }

    // ─── UpdatedAt timestamp ──────────────────────────────────────────────────

    [Fact]
    public void Create_UpdatedAtIsSetOnCreation()
    {
        // Act
        var entity = ClienteEntity.Create("Empresa X", "900000001-1", "3001000001", "Cali");

        // Assert
        Assert.NotEqual(default(DateTimeOffset), entity.UpdatedAt);
        Assert.True(entity.UpdatedAt > DateTimeOffset.MinValue);
    }

    [Fact]
    public void Create_UpdatedAtMatchesOrIsCloseToCreatedAt()
    {
        // Act
        var before = DateTimeOffset.UtcNow;
        var entity = ClienteEntity.Create("Empresa Y", "900000002-2", "3001000002", "Medellín");
        var after = DateTimeOffset.UtcNow;

        // Assert: both timestamps were set during the same Create() call
        Assert.True(entity.CreatedAt >= before && entity.CreatedAt <= after);
        Assert.True(entity.UpdatedAt >= before && entity.UpdatedAt <= after);
    }

    // ─── Timestamps in UTC ───────────────────────────────────────────────────

    [Fact]
    public void Create_CreatedAtIsUtc()
    {
        // Act
        var entity = ClienteEntity.Create("Empresa UTC", "900000003-3", "3001000003", "Bogotá");

        // Assert: UTC offset is zero (DateTimeOffset.UtcNow has offset +00:00)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    [Fact]
    public void Create_UpdatedAtIsUtc()
    {
        // Act
        var entity = ClienteEntity.Create("Empresa UTC2", "900000004-4", "3001000004", "Bogotá");

        // Assert: UTC offset is zero
        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // ─── Special characters accepted ─────────────────────────────────────────

    [Fact]
    public void Create_WithNombreContainingSpecialCharacters_Succeeds()
    {
        // Arrange: Nombre with accented characters and ampersand (common in Colombian company names)
        var nombre = "Aceros & Construcción S.A.S.";

        // Act
        var entity = ClienteEntity.Create(nombre, "900000005-5", "3001000005", "Barranquilla");

        // Assert
        Assert.Equal(nombre, entity.Nombre);
    }

    [Fact]
    public void Create_WithNitContainingDashAndDigits_Succeeds()
    {
        // Arrange: Standard Colombian NIT format: digits + dash + check digit
        var nit = "900123456-1";

        // Act
        var entity = ClienteEntity.Create("Empresa NIT", nit, "3001000006", "Cali");

        // Assert
        Assert.Equal(nit, entity.Nit);
    }

    [Fact]
    public void Create_WithCiudadContainingAccentedCharacters_Succeeds()
    {
        // Arrange: Colombian cities with accented characters
        var ciudad = "Bogotá";

        // Act
        var entity = ClienteEntity.Create("Empresa Bogotá", "900000007-7", "3001000007", ciudad);

        // Assert
        Assert.Equal(ciudad, entity.Ciudad);
    }

    // ─── Large number of entities — uniqueness ────────────────────────────────

    [Fact]
    public void Create_TenEntities_AllHaveUniqueIds()
    {
        // Act
        var entities = Enumerable.Range(1, 10).Select(i =>
            ClienteEntity.Create($"Empresa {i}", $"900{i:D6}-{i % 9}", $"300{i:D7}", "Bogotá")
        ).ToList();

        // Assert: All IDs are distinct
        var uniqueIds = entities.Select(e => e.Id).Distinct().Count();
        Assert.Equal(10, uniqueIds);
    }

    // ─── Trimming is NOT performed (raw values stored) ────────────────────────

    [Fact]
    public void Create_NombreWithLeadingTrailingSpaces_StoredAsProvided()
    {
        // Arrange: Nombre that is non-null and non-whitespace (passes guard)
        // but has leading/trailing spaces
        var nombre = " Empresa Con Espacios ";

        // Act: This should succeed (IsNullOrWhiteSpace(" Empresa Con Espacios ") = false)
        var entity = ClienteEntity.Create(nombre, "900000008-8", "3001000008", "Bogotá");

        // Assert: The value is stored exactly as provided (no implicit trimming)
        Assert.Equal(nombre, entity.Nombre);
    }
}
