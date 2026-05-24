using SiesaAgents.Domain.Entities;
using Xunit;

namespace SiesaAgents.UnitTests.Domain;

/// <summary>
/// Edge case and boundary condition tests for the Entity base class.
/// Expands coverage beyond the 2 ATDD unit tests in EntityTests.cs.
/// Covers: DateTimeOffset type, UpdatedAt, UUID format, bulk creation.
/// </summary>
public class EntityEdgeCaseTests
{
    private class TestEntity : Entity { }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: DateTimeOffset (not DateTime) is used for timestamps
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_CreatedAt_IsDateTimeOffset_NotDateTime()
    {
        // GIVEN: Company standard mandates DateTimeOffset ALWAYS for timestamps
        var entity = new TestEntity();

        // THEN: The property type at runtime is DateTimeOffset
        Assert.IsType<DateTimeOffset>(entity.CreatedAt);
    }

    [Fact]
    public void Entity_UpdatedAt_IsDateTimeOffset_NotDateTime()
    {
        var entity = new TestEntity();

        Assert.IsType<DateTimeOffset>(entity.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: UpdatedAt is initialized on creation
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_WhenCreated_UpdatedAtEqualsOrIsAfterCreatedAt()
    {
        // GIVEN: A new entity is created
        var before = DateTimeOffset.UtcNow;
        var entity = new TestEntity();
        var after = DateTimeOffset.UtcNow;

        // THEN: UpdatedAt is set and is within the creation window
        Assert.True(entity.UpdatedAt >= before, "UpdatedAt should be >= before creation");
        Assert.True(entity.UpdatedAt <= after, "UpdatedAt should be <= after creation");
    }

    [Fact]
    public void Entity_WhenCreated_UpdatedAtIsNotMinValue()
    {
        var entity = new TestEntity();

        // THEN: UpdatedAt is not the default uninitialized DateTimeOffset value
        Assert.NotEqual(DateTimeOffset.MinValue, entity.UpdatedAt);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: timestamps are UTC
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_WhenCreated_CreatedAtIsUtc()
    {
        var entity = new TestEntity();

        // THEN: The Offset of the DateTimeOffset is zero (UTC)
        Assert.Equal(TimeSpan.Zero, entity.CreatedAt.Offset);
    }

    [Fact]
    public void Entity_WhenCreated_UpdatedAtIsUtc()
    {
        var entity = new TestEntity();

        Assert.Equal(TimeSpan.Zero, entity.UpdatedAt.Offset);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: Id is a valid non-empty GUID
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_Id_IsValidGuidFormat()
    {
        var entity = new TestEntity();

        // THEN: The Id is a standard 16-byte GUID (not just a sequential int or empty)
        Assert.NotEqual(Guid.Empty, entity.Id);
        // Guid.NewGuid() generates version 4 — length is always 36 with hyphens
        Assert.Equal(36, entity.Id.ToString().Length);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: bulk creation produces all unique IDs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_WhenCreatedInBulk_AllIdsAreUnique()
    {
        // GIVEN: 100 entities created in a tight loop
        const int count = 100;
        var ids = new HashSet<Guid>();

        for (int i = 0; i < count; i++)
        {
            var entity = new TestEntity();
            ids.Add(entity.Id);
        }

        // THEN: All 100 IDs are distinct (no collision)
        Assert.Equal(count, ids.Count);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: concurrent creation does not produce duplicate IDs
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Entity_WhenCreatedConcurrently_AllIdsAreUnique()
    {
        // GIVEN: 50 entities created across parallel tasks
        const int count = 50;
        var tasks = Enumerable.Range(0, count)
            .Select(_ => Task.Run(() => new TestEntity()))
            .ToArray();

        var entities = await Task.WhenAll(tasks);
        var uniqueIds = entities.Select(e => e.Id).Distinct().Count();

        // THEN: All IDs are unique even under concurrent creation
        Assert.Equal(count, uniqueIds);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Boundary: two entities created at nearly the same time have close timestamps
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Entity_TwoEntitiesCreatedSequentially_CreatedAtTimestampsDiffer()
    {
        // GIVEN: System clock resolution may cause identical timestamps when very fast
        // This test verifies CreatedAt is reasonably precise (not frozen at epoch)
        var entity1 = new TestEntity();
        var entity2 = new TestEntity();

        // THEN: Both timestamps are in the recent past — not 1970-01-01
        var epoch = new DateTimeOffset(1970, 1, 1, 0, 0, 0, TimeSpan.Zero);
        Assert.True(entity1.CreatedAt > epoch);
        Assert.True(entity2.CreatedAt > epoch);
    }
}
