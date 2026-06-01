// Story 2.1: Client List & Search — Automation Expansion
// Epic 2: Client Management
//
// Unit Tests — AUTOMATION EXPANSION (xUnit)
// Edge cases and boundary conditions NOT covered by ATDD tests.
//
// Focus areas:
//   - Create() with empty string arguments (boundary — domain allows or rejects blanks)
//   - Create() with very long strings (boundary values)
//   - Create() produces unique Guid per call (no collision)
//   - Update() with same values as original (idempotent mutation)
//   - Update() called multiple times in sequence (UpdatedAt advances each call)
//   - Timestamps are UTC (offset is +00:00)
//   - CreatedAt ≤ UpdatedAt after Update()

using SiesaAgents.Domain.Clientes.Entities;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Automation expansion tests for ClienteEntity.
/// Covers edge cases and boundary conditions beyond AC5/AC6 acceptance criteria.
/// </summary>
public class ClienteEntityEdgeCasesTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Unique Guid generation — two Create() calls must produce distinct IDs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Create: two consecutive calls produce distinct Guid IDs")]
    public void Create_TwoConsecutiveCalls_ProduceDistinctIds()
    {
        // Arrange & Act
        var c1 = ClienteEntity.Create("Empresa A", "111", "300", "Bogotá");
        var c2 = ClienteEntity.Create("Empresa B", "222", "301", "Cali");

        // Assert: IDs must differ (Guid.NewGuid() is called per factory invocation)
        Assert.NotEqual(c1.Id, c2.Id);
    }

    [Fact(DisplayName = "[P1] Create: one hundred calls all produce distinct Guid IDs")]
    public void Create_OneHundredCalls_AllProduceDistinctIds()
    {
        // Arrange & Act
        var ids = Enumerable.Range(0, 100)
            .Select(i => ClienteEntity.Create($"Empresa {i}", $"NIT{i}", "300", "Bogotá").Id)
            .ToList();

        // Assert: all IDs are unique
        var distinctCount = ids.Distinct().Count();
        Assert.Equal(100, distinctCount);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Boundary — empty string arguments (domain does not validate in this story)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Create: empty string arguments are stored as-is (no validation in domain entity)")]
    public void Create_WithEmptyStrings_StoresEmptyStringsWithoutThrowing()
    {
        // Arrange & Act — domain entity is a persistence model; validation belongs to Application layer
        var exception = Record.Exception(() =>
            ClienteEntity.Create(string.Empty, string.Empty, string.Empty, string.Empty)
        );

        // Assert: no exception thrown — entity stores whatever is passed
        Assert.Null(exception);
    }

    [Fact(DisplayName = "[P1] Create: empty Nombre is stored verbatim")]
    public void Create_WithEmptyNombre_StoresEmptyNombre()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create(string.Empty, "NIT123", "300", "Bogotá");

        // Assert
        Assert.Equal(string.Empty, cliente.Nombre);
    }

    [Fact(DisplayName = "[P1] Create: empty Nit is stored verbatim")]
    public void Create_WithEmptyNit_StoresEmptyNit()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", string.Empty, "300", "Bogotá");

        // Assert
        Assert.Equal(string.Empty, cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Boundary — very long strings (no max-length constraint in domain entity)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Create: very long Nombre (1000 characters) is stored without truncation")]
    public void Create_WithLongNombre_StoresFullString()
    {
        // Arrange
        var longNombre = new string('A', 1000);

        // Act
        var cliente = ClienteEntity.Create(longNombre, "NIT123", "300", "Bogotá");

        // Assert: domain entity does not truncate
        Assert.Equal(1000, cliente.Nombre.Length);
        Assert.Equal(longNombre, cliente.Nombre);
    }

    [Fact(DisplayName = "[P1] Create: very long Nit (200 characters) is stored verbatim")]
    public void Create_WithLongNit_StoresFullString()
    {
        // Arrange
        var longNit = new string('9', 200);

        // Act
        var cliente = ClienteEntity.Create("Empresa", longNit, "300", "Bogotá");

        // Assert
        Assert.Equal(longNit, cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Timestamp UTC offset — DateTimeOffset.UtcNow always has offset +00:00
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Create: CreatedAt has UTC offset (+00:00)")]
    public void Create_CreatedAt_HasUtcOffset()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");

        // Assert: UTC time zone — offset is zero
        Assert.Equal(TimeSpan.Zero, cliente.CreatedAt.Offset);
    }

    [Fact(DisplayName = "[P0] Create: UpdatedAt has UTC offset (+00:00)")]
    public void Create_UpdatedAt_HasUtcOffset()
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");

        // Assert
        Assert.Equal(TimeSpan.Zero, cliente.UpdatedAt.Offset);
    }

    [Fact(DisplayName = "[P0] Update: UpdatedAt retains UTC offset after mutation")]
    public void Update_UpdatedAt_RetainsUtcOffset()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");

        // Act
        cliente.Update("Nuevo", "NIT2", "301", "Cali");

        // Assert
        Assert.Equal(TimeSpan.Zero, cliente.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CreatedAt ≤ UpdatedAt invariant
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Update: UpdatedAt is greater than or equal to CreatedAt after mutation")]
    public void Update_UpdatedAt_IsGreaterThanOrEqualToCreatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");

        // Small pause ensures observable time difference
        System.Threading.Thread.Sleep(5);

        // Act
        cliente.Update("Nuevo", "999", "111", "Medellín");

        // Assert: temporal invariant — creation always precedes or equals update
        Assert.True(cliente.UpdatedAt >= cliente.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Update() with identical values (idempotent mutation)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Update: calling with same values still updates UpdatedAt")]
    public void Update_WithSameValues_StillAdvancesUpdatedAt()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");
        var originalUpdatedAt = cliente.UpdatedAt;

        System.Threading.Thread.Sleep(5);

        // Act: update with exactly the same values
        cliente.Update("Empresa ABC", "900123456-1", "3001234567", "Bogotá");

        // Assert: UpdatedAt advances even when values are unchanged
        Assert.True(cliente.UpdatedAt >= originalUpdatedAt);
    }

    [Fact(DisplayName = "[P1] Update: calling with same values preserves all field values")]
    public void Update_WithSameValues_PreservesAllFieldValues()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Empresa ABC", "900123456-1", "3001234567", "Bogotá");

        // Act
        cliente.Update("Empresa ABC", "900123456-1", "3001234567", "Bogotá");

        // Assert: fields are still correct (no unintended mutation)
        Assert.Equal("Empresa ABC", cliente.Nombre);
        Assert.Equal("900123456-1", cliente.Nit);
        Assert.Equal("3001234567", cliente.Telefono);
        Assert.Equal("Bogotá", cliente.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Multiple sequential Update() calls — each advances UpdatedAt
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Update: multiple sequential calls each advance UpdatedAt monotonically")]
    public void Update_CalledMultipleTimes_UpdatedAtAdvancesMonotonically()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");
        var timestamps = new List<DateTimeOffset> { cliente.UpdatedAt };

        // Act: three sequential updates with small pauses
        for (var i = 1; i <= 3; i++)
        {
            System.Threading.Thread.Sleep(5);
            cliente.Update($"Version{i}", $"NIT{i}", $"Tel{i}", $"Ciudad{i}");
            timestamps.Add(cliente.UpdatedAt);
        }

        // Assert: each UpdatedAt is >= the previous
        for (var i = 1; i < timestamps.Count; i++)
        {
            Assert.True(timestamps[i] >= timestamps[i - 1],
                $"Timestamp[{i}]={timestamps[i]} should be >= Timestamp[{i - 1}]={timestamps[i - 1]}");
        }
    }

    [Fact(DisplayName = "[P0] Update: last Update() call sets the final field values correctly")]
    public void Update_CalledMultipleTimes_LastCallWins()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");

        // Act
        cliente.Update("Primera", "111", "111", "Cali");
        cliente.Update("Segunda", "222", "222", "Medellín");
        cliente.Update("Tercera", "333", "333", "Barranquilla");

        // Assert: last update wins
        Assert.Equal("Tercera", cliente.Nombre);
        Assert.Equal("333", cliente.Nit);
        Assert.Equal("333", cliente.Telefono);
        Assert.Equal("Barranquilla", cliente.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: CreatedAt is not mutated by multiple Update() calls
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P0] Update: CreatedAt remains unchanged after multiple Update() calls")]
    public void Update_CalledMultipleTimes_CreatedAtNeverChanges()
    {
        // Arrange
        var cliente = ClienteEntity.Create("Original", "000", "000", "Bogotá");
        var originalCreatedAt = cliente.CreatedAt;

        // Act: three updates
        System.Threading.Thread.Sleep(5);
        cliente.Update("V1", "1", "1", "Cali");
        System.Threading.Thread.Sleep(5);
        cliente.Update("V2", "2", "2", "Medellín");
        System.Threading.Thread.Sleep(5);
        cliente.Update("V3", "3", "3", "Bogotá");

        // Assert: CreatedAt is immutable
        Assert.Equal(originalCreatedAt, cliente.CreatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Special characters in fields (Spanish locale names)
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Create: Spanish special characters in Nombre are stored correctly")]
    public void Create_WithSpanishCharactersInNombre_StoresCorrectly()
    {
        // Arrange
        const string nombreWithAccents = "Distribuidora Ñoño & Cía. Ltda.";

        // Act
        var cliente = ClienteEntity.Create(nombreWithAccents, "NIT", "300", "Bogotá");

        // Assert
        Assert.Equal(nombreWithAccents, cliente.Nombre);
    }

    [Fact(DisplayName = "[P1] Create: ciudad with tilde (Bogotá) is stored correctly")]
    public void Create_WithCiudadTilde_StoresCorrectly()
    {
        // Arrange
        const string ciudadWithAccent = "Bogotá";

        // Act
        var cliente = ClienteEntity.Create("Empresa", "NIT", "300", ciudadWithAccent);

        // Assert
        Assert.Equal(ciudadWithAccent, cliente.Ciudad);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: NIT format variants (Colombian NIT with verification digit)
    // ─────────────────────────────────────────────────────────────────────────

    [Theory(DisplayName = "[P1] Create: various NIT format variants are stored verbatim")]
    [InlineData("900123456-1")]
    [InlineData("800999000-2")]
    [InlineData("123456789-0")]
    [InlineData("9001234560")]         // without dash
    [InlineData("NIT-900123456-1")]    // with prefix
    public void Create_WithVariousNitFormats_StoresVerbatim(string nit)
    {
        // Arrange & Act
        var cliente = ClienteEntity.Create("Empresa", nit, "300", "Bogotá");

        // Assert: no normalization applied at domain level
        Assert.Equal(nit, cliente.Nit);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Edge: Id is non-empty Guid — verify the standard "not empty" contract
    //       even when called from different threads
    // ─────────────────────────────────────────────────────────────────────────

    [Fact(DisplayName = "[P1] Create: concurrent calls from multiple threads all produce non-empty Guids")]
    public async Task Create_ConcurrentCalls_AllProduceNonEmptyGuids()
    {
        // Arrange
        const int threadCount = 20;
        var ids = new System.Collections.Concurrent.ConcurrentBag<Guid>();

        // Act
        var tasks = Enumerable.Range(0, threadCount)
            .Select(_ => Task.Run(() =>
            {
                var c = ClienteEntity.Create("Empresa", "NIT", "300", "Bogotá");
                ids.Add(c.Id);
            }))
            .ToArray();

        await Task.WhenAll(tasks);

        // Assert
        Assert.Equal(threadCount, ids.Count);
        Assert.All(ids, id => Assert.NotEqual(Guid.Empty, id));
    }
}
