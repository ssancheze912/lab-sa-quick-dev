// Story 1.3: Backend Database Foundation
// Epic 1: Project Foundation & Application Shell
//
// ATDD Acceptance Tests — RED Phase (Unit Level)
// These tests are intentionally FAILING until SnakeCaseNamingConvention is implemented.
//
// Acceptance Criteria covered:
//   AC #4 — modelBuilder.ApplySnakeCaseNaming() rewrites ALL EF-managed identifiers to
//           lowercase snake_case (tables, columns, indexes, FK constraints)
//
// Test Design references:
//   TC-E1-P2-04 — snake_case column verification (unit-level coverage of the regex helper)
//
// Required implementation:
//   src/SiesaAgents.Infrastructure/Data/SnakeCaseNamingConvention.cs
//     public static class SnakeCaseNamingConvention {
//         public static string ToSnakeCase(string input);
//         public static void ApplySnakeCaseNaming(this ModelBuilder modelBuilder);
//     }

using SiesaAgents.Infrastructure.Data;

namespace SiesaAgents.UnitTests.Infrastructure;

public class SnakeCaseNamingConventionTests
{
    // ─────────────────────────────────────────────────────────────────────────
    // ToSnakeCase — regex pair behavior
    //   1) ([a-z0-9])([A-Z])      => $1_$2
    //   2) ([A-Z]+)([A-Z][a-z])   => $1_$2
    //   3) .ToLowerInvariant()
    // ─────────────────────────────────────────────────────────────────────────

    [Fact]
    public void ToSnakeCase_PascalCaseTwoWords_ReturnsSnakeCase()
    {
        // GIVEN: A PascalCase identifier with a clear word boundary
        var input = "CreatedAt";

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The result is lowercase with an underscore between words
        Assert.Equal("created_at", result);
    }

    [Fact]
    public void ToSnakeCase_AllUppercaseShortAcronym_ReturnsLowercaseNoUnderscore()
    {
        // GIVEN: A short all-uppercase acronym
        var input = "ID";

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: It collapses to lowercase with no inserted underscore
        Assert.Equal("id", result);
    }

    [Fact]
    public void ToSnakeCase_AcronymFollowedByPascalCase_InsertsUnderscoreBetweenAcronymAndWord()
    {
        // GIVEN: An acronym immediately followed by a PascalCase word
        var input = "APIKey";

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The acronym is preserved as one token and an underscore separates it from "Key"
        Assert.Equal("api_key", result);
    }

    [Fact]
    public void ToSnakeCase_LongAcronymFollowedByPascalCase_InsertsUnderscoreCorrectly()
    {
        // GIVEN: A longer acronym followed by a PascalCase word
        var input = "HTTPClient";

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The acronym stays grouped and the underscore lands before the final word
        Assert.Equal("http_client", result);
    }

    [Fact]
    public void ToSnakeCase_PascalWordEndingInAcronym_PrependsUnderscoreBeforeAcronym()
    {
        // GIVEN: A PascalCase word ending in an acronym (typical FK column name)
        var input = "ClienteID";

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: An underscore is inserted between the word and the acronym
        Assert.Equal("cliente_id", result);
    }

    [Fact]
    public void ToSnakeCase_NullInput_ReturnsInputUnchanged()
    {
        // GIVEN: A null input (defensive case — never thrown from EF metadata)
        string? input = null;

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input!);

        // THEN: The null is returned unchanged (no NullReferenceException)
        Assert.Null(result);
    }

    [Fact]
    public void ToSnakeCase_EmptyString_ReturnsInputUnchanged()
    {
        // GIVEN: An empty-string input
        var input = string.Empty;

        // WHEN: The snake_case transform is applied
        var result = SnakeCaseNamingConvention.ToSnakeCase(input);

        // THEN: The empty string is returned unchanged
        Assert.Equal(string.Empty, result);
    }
}
