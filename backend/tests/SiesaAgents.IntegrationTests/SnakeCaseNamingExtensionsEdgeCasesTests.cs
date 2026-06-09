using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// Edge-case coverage for <see cref="SnakeCaseNamingExtensions.ToSnakeCase"/> beyond
/// the canonical conversions exercised by <see cref="SnakeCaseNamingExtensionsTests"/>.
///
/// Pins the conversion algorithm against PostgreSQL naming requirements:
///   * Digits never receive a leading underscore.
///   * Mixed PascalCase + numbers + acronyms behave predictably.
///   * Single-letter PascalCase tokens remain stable.
///   * Existing snake_case identifiers are idempotent (no double-underscoring).
///   * Strings containing only digits / only underscores pass through unchanged.
///   * <c>internal static</c> visibility is preserved (no accidental public exposure
///     in subsequent refactors).
/// </summary>
public class SnakeCaseNamingExtensionsEdgeCasesTests
{
    /// <summary>
    /// AC #4 — additional canonical conversions covering numeric boundaries,
    /// trailing acronyms, and idempotency.
    /// </summary>
    [Theory]
    [InlineData("ClienteId", "cliente_id")]
    [InlineData("Cliente_Id", "cliente_id")]
    [InlineData("Cliente2Id", "cliente2_id")]
    [InlineData("ID", "id")]
    [InlineData("V2", "v2")]
    [InlineData("HTTPS", "https")]
    [InlineData("XMLHttpRequest", "xml_http_request")]
    [InlineData("snake_case_already", "snake_case_already")]
    [InlineData("with_TrailingPascal", "with_trailing_pascal")]
    [InlineData("a_b_c", "a_b_c")]
    public void ToSnakeCase_AdditionalConversions(string input, string expected)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.Equal(expected, actual);
    }

    /// <summary>
    /// AC #4 — digit-only / underscore-only inputs pass through unchanged.
    /// </summary>
    [Theory]
    [InlineData("123")]
    [InlineData("_")]
    [InlineData("__")]
    [InlineData("___")]
    [InlineData("9_lives")]
    public void ToSnakeCase_DigitOrUnderscoreInputs_PassThroughUnchanged(string input)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.Equal(input, actual);
    }

    /// <summary>
    /// AC #4 idempotency — applying <c>ToSnakeCase</c> to an already-snake_case
    /// string yields the exact same string (load-bearing contract; the explicit
    /// <c>ApplySnakeCaseNaming()</c> call coexists with
    /// <c>UseSnakeCaseNamingConvention()</c> and must be a no-op the second time).
    /// </summary>
    [Theory]
    [InlineData("cliente")]
    [InlineData("cliente_id")]
    [InlineData("primary_email_address")]
    [InlineData("ix_clientes_codigo_unique")]
    public void ToSnakeCase_IsIdempotent_OnAlreadySnakeCaseInput(string input)
    {
        // GIVEN
        var once = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // WHEN — apply a second time
        var twice = SnakeCaseNamingExtensions.ToSnakeCase(once);

        // THEN
        Assert.Equal(once, twice);
        Assert.Equal(input, twice);
    }

    /// <summary>
    /// AC #4 — visibility contract. <c>ToSnakeCase</c> must remain
    /// <c>internal static</c>; it is consumed by the in-house naming extension
    /// and exposed to the test project via the <c>InternalsVisibleTo</c> implied
    /// by direct project reference + the helper's <c>internal</c> visibility.
    /// (If a refactor accidentally promotes it to <c>public</c>, this test fails
    /// and forces a deliberate review.)
    /// </summary>
    [Fact]
    public void ToSnakeCase_RemainsInternalStaticMember()
    {
        // GIVEN
        var method = typeof(SnakeCaseNamingExtensions)
            .GetMethod(
                nameof(SnakeCaseNamingExtensions.ToSnakeCase),
                System.Reflection.BindingFlags.Static
                    | System.Reflection.BindingFlags.NonPublic);

        // THEN
        Assert.NotNull(method);
        Assert.True(method!.IsStatic, "ToSnakeCase must be static.");
        Assert.False(method.IsPublic, "ToSnakeCase must NOT be public (internal contract).");
    }

    /// <summary>
    /// AC #4 — output must never start or end with an underscore for typical
    /// PascalCase identifiers used by EF Core entity / property names.
    /// </summary>
    [Theory]
    [InlineData("Cliente")]
    [InlineData("ClienteEntity")]
    [InlineData("PrimaryEmailAddress")]
    [InlineData("UUID")]
    public void ToSnakeCase_DoesNotProduceLeadingOrTrailingUnderscore(string input)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.False(actual.StartsWith('_'),
            $"'{actual}' must not start with an underscore.");
        Assert.False(actual.EndsWith('_'),
            $"'{actual}' must not end with an underscore.");
    }

    /// <summary>
    /// AC #4 — output is lowercase (PostgreSQL is case-folding by default; mixed
    /// case identifiers require quoting and break the convention).
    /// </summary>
    [Theory]
    [InlineData("Cliente")]
    [InlineData("ClienteEntity")]
    [InlineData("MyHTTPRequest")]
    [InlineData("XMLParser")]
    public void ToSnakeCase_ProducesLowercaseOutput(string input)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.Equal(actual.ToLowerInvariant(), actual);
    }
}
