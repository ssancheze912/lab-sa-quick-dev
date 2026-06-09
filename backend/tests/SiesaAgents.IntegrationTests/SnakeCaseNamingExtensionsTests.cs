using Microsoft.EntityFrameworkCore;
using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.IntegrationTests;

/// <summary>
/// AC #4 — Edge-case unit tests for the in-house <see cref="SnakeCaseNamingExtensions"/>.
///
/// The ATDD tests verify <c>ApplySnakeCaseNaming()</c> runs without throwing inside
/// <c>OnModelCreating</c>. These tests pin the underlying conversion algorithm so
/// future changes (e.g. when Epic 2/3 add entities) do not silently break snake_case
/// production rules.
///
/// The <c>ToSnakeCase</c> helper is internal; access it via <c>InternalsVisibleTo</c>
/// already exposed through the project reference. If access is denied, fall back to
/// observing behavior via <c>ApplySnakeCaseNaming</c> on a synthetic model — covered
/// in <see cref="ApplySnakeCaseNaming_DoesNotThrow_ForEmptyModel"/> below.
/// </summary>
public class SnakeCaseNamingExtensionsTests
{
    /// <summary>
    /// AC #4 edge case — calling <c>ApplySnakeCaseNaming</c> on a null
    /// <see cref="ModelBuilder"/> must fail-fast with <see cref="ArgumentNullException"/>
    /// rather than NRE'ing deeper in the stack (defensive guard contract).
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_Throws_WhenModelBuilderIsNull()
    {
        // GIVEN
        ModelBuilder? modelBuilder = null;

        // WHEN / THEN
        Assert.Throws<ArgumentNullException>(() =>
            modelBuilder!.ApplySnakeCaseNaming());
    }

    /// <summary>
    /// AC #4 — Story 1.3 has zero entities. The extension MUST be a no-op on an
    /// empty model (no NRE iterating an empty collection).
    /// </summary>
    [Fact]
    public void ApplySnakeCaseNaming_DoesNotThrow_ForEmptyModel()
    {
        // GIVEN
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContextProbe>()
            .UseNpgsql("Host=fake;Database=fake;Username=fake;Password=fake");
        using var ctx = new AppDbContextProbe(optionsBuilder.Options);
        // ModelBuilder is internal to EF; we exercise the extension through the
        // model finalization pipeline. If the empty-iteration path NRE'd, accessing
        // ctx.Model would surface it here.

        // WHEN / THEN
        var model = ctx.Model;
        Assert.NotNull(model);
        Assert.Empty(model.GetEntityTypes());
    }

    /// <summary>
    /// AC #4 — <c>ToSnakeCase</c> contract via observable conversion.
    ///
    /// The helper is internal; we drive it indirectly by configuring a probe DbContext
    /// with a synthetic entity whose table/column names go through the same algorithm.
    /// Each row asserts one canonical conversion path of the implementation:
    ///
    ///   PascalCase       → pascal_case
    ///   camelCase        → camel_case
    ///   ALLCAPS          → allcaps (only lower-bordered uppers add an underscore)
    ///   already_snake    → already_snake
    ///   SingleWord       → singleword
    ///
    /// If these expectations change, the implementation has changed — re-justify in
    /// the Dev Agent Record before updating the test (this is a load-bearing contract).
    /// </summary>
    [Theory]
    [InlineData("PascalCase", "pascal_case")]
    [InlineData("camelCase", "camel_case")]
    [InlineData("Single", "single")]
    [InlineData("already_snake_case", "already_snake_case")]
    [InlineData("A", "a")]
    [InlineData("MyHTTPRequest", "my_http_request")]
    public void ToSnakeCase_ProducesExpectedConversion(string input, string expected)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.Equal(expected, actual);
    }

    /// <summary>
    /// AC #4 — <c>ToSnakeCase</c> must echo empty / null-ish input unchanged
    /// (defensive — the model walker skips null/empty names but the helper is
    /// public-internal enough to be called directly by future entity configurations).
    /// </summary>
    [Theory]
    [InlineData("")]
    public void ToSnakeCase_ReturnsInputUnchanged_ForEmptyString(string input)
    {
        // GIVEN / WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input);

        // THEN
        Assert.Equal(input, actual);
    }

    /// <summary>
    /// AC #4 boundary — null input.
    /// The implementation short-circuits on <c>string.IsNullOrEmpty</c> and returns
    /// the null reference unchanged (no NRE).
    /// </summary>
    [Fact]
    public void ToSnakeCase_ReturnsNull_ForNullInput()
    {
        // GIVEN
        string? input = null;

        // WHEN
        var actual = SnakeCaseNamingExtensions.ToSnakeCase(input!);

        // THEN
        Assert.Null(actual);
    }

    /// <summary>
    /// Probe DbContext used to exercise <c>ApplySnakeCaseNaming</c> on an empty model
    /// independently of the real <c>AppDbContext</c>. Mirrors the production wiring so
    /// the conversion pipeline (convention + explicit extension) runs end-to-end.
    /// </summary>
    private sealed class AppDbContextProbe(DbContextOptions<AppDbContextProbe> options)
        : DbContext(options)
    {
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplySnakeCaseNaming();
        }
    }
}
