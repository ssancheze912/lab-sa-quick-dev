using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.UnitTests.Data.Extensions;

/// <summary>
/// AUTOMATE expansion - Story 1.3.
///
/// Edge-case and negative-path coverage for
/// <see cref="ModelBuilderSnakeCaseExtensions.ToSnakeCase"/> beyond the happy
/// path already tested in <c>ToSnakeCaseTests</c>. Covers:
///   - Idempotency (applying the conversion twice yields the same result).
///   - Single-character inputs (boundary).
///   - Digits and mixed alpha-numerics.
///   - EF Core key prefixes (FK_, UK_).
///   - Acronym + suffix combinations (HTTPSEnabled, XMLParser).
///   - Leading and trailing underscores.
///   - Long identifiers (stress, not perf).
/// </summary>
public class ToSnakeCaseEdgeCaseTests
{
    [Theory]
    [InlineData("A", "a")]
    [InlineData("a", "a")]
    [InlineData("1", "1")]
    [InlineData("_", "_")]
    public void ToSnakeCase_SingleCharacters_AreReturnedLowercased(string input, string expected)
    {
        // GIVEN a single-character identifier
        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN it is returned lowercase, no transformation
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("Order123", "order123")]
    [InlineData("Order123Item", "order123_item")]
    [InlineData("V2Migration", "v2_migration")]
    [InlineData("DateTime2", "date_time2")]
    public void ToSnakeCase_MixedAlphaNumerics_AreSplitOnCasingBoundaries(string input, string expected)
    {
        // GIVEN PascalCase identifier with digits
        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN digit segments stay attached to the preceding lowercase word
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("FK_Clientes_Contactos", "fk_clientes_contactos")]
    [InlineData("UK_Clientes_NIT", "uk_clientes_nit")]
    [InlineData("PK_Contactos_Email", "pk_contactos_email")]
    [InlineData("IX_Clientes_NITNumber", "ix_clientes_nit_number")]
    public void ToSnakeCase_EfCoreKeyPrefixes_AreLowercased(string input, string expected)
    {
        // GIVEN an EF Core constraint identifier (FK_/UK_/PK_/IX_)
        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN the prefix is lowercased and acronym words are split
        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("HTTPSEnabled", "https_enabled")]
    [InlineData("XMLParser", "xml_parser")]
    [InlineData("JSONResponse", "json_response")]
    [InlineData("URLPath", "url_path")]
    public void ToSnakeCase_AcronymPrefixedWords_AreSplitCorrectly(string input, string expected)
    {
        // GIVEN an identifier starting with an acronym followed by a capitalized word
        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN the acronym is treated as a unit and split before the next word
        Assert.Equal(expected, actual);
    }

    [Fact]
    public void ToSnakeCase_IsIdempotent_WhenAppliedTwice()
    {
        // GIVEN a PascalCase identifier
        var input = "IX_Contactos_ClienteId";

        // WHEN snake-cased twice
        var once = input.ToSnakeCase();
        var twice = once.ToSnakeCase();

        // THEN the result is stable
        Assert.Equal(once, twice);
        Assert.Equal("ix_contactos_cliente_id", twice);
    }

    [Theory]
    [InlineData("_LeadingUnderscore", "_leading_underscore")]
    [InlineData("TrailingUnderscore_", "trailing_underscore_")]
    [InlineData("__DoubleLeading", "_double_leading")]
    public void ToSnakeCase_HandlesUnderscoreEdges_WithoutDuplication(string input, string expected)
    {
        // GIVEN an identifier with leading/trailing/repeated underscores
        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN no duplicate underscores are produced (collapse step is applied)
        Assert.Equal(expected, actual);
        Assert.DoesNotContain("__", actual);
    }

    [Fact]
    public void ToSnakeCase_HandlesLongMixedIdentifier()
    {
        // GIVEN a long PascalCase identifier with embedded acronyms and digits
        var input = "FK_OrderLine2_OrderHeaderId_RestrictV2";

        // WHEN snake-cased
        var actual = input.ToSnakeCase();

        // THEN every word is split deterministically
        Assert.Equal("fk_order_line2_order_header_id_restrict_v2", actual);
    }
}
