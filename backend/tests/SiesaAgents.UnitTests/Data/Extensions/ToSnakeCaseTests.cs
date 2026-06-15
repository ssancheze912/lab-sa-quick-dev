using SiesaAgents.Infrastructure.Data.Extensions;

namespace SiesaAgents.UnitTests.Data.Extensions;

/// <summary>
/// Unit tests for the <see cref="ModelBuilderSnakeCaseExtensions.ToSnakeCase"/>
/// helper. Covers PascalCase, camelCase, acronyms, prefixed identifiers, and
/// the idempotent path for already-snake_case input.
/// </summary>
public class ToSnakeCaseTests
{
    [Theory]
    [InlineData("CreatedAt", "created_at")]
    [InlineData("ClienteId", "cliente_id")]
    [InlineData("NITNumber", "nit_number")]
    [InlineData("PK_Clientes", "pk_clientes")]
    [InlineData("IX_Contactos_ClienteId", "ix_contactos_cliente_id")]
    [InlineData("already_snake", "already_snake")]
    [InlineData("Id", "id")]
    [InlineData("UUID", "uuid")]
    public void ToSnakeCase_ConvertsKnownIdentifiers(string input, string expected)
    {
        var actual = input.ToSnakeCase();

        Assert.Equal(expected, actual);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void ToSnakeCase_ReturnsInputForBlankStrings(string input)
    {
        var actual = input.ToSnakeCase();

        Assert.Equal(input, actual);
    }
}
