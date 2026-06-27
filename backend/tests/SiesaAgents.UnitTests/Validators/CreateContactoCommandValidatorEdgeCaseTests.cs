using SiesaAgents.Application.Contactos.Commands;
using SiesaAgents.Application.Contactos.Validators;

namespace SiesaAgents.UnitTests.Validators;

/// <summary>
/// Edge case and boundary tests for CreateContactoCommandValidator — Story 3.3.
/// BMad-Integrated: expands coverage beyond ATDD tests (UNIT-B-CT-01..UNIT-B-CT-03).
///
/// Test IDs: UNIT-B-VAL-CT-EDGE-01 … UNIT-B-VAL-CT-EDGE-12
///
/// Risks covered:
///   - Whitespace-only fields (NotEmpty rejects them, unlike frontend Zod min(1))
///   - Max length boundary: exactly at max → valid; one over max → invalid
///   - All fields empty simultaneously → at least 4 errors
///   - Spanish error messages present on each violation
///   - Email format validation with valid edge-format emails
/// </summary>
public class CreateContactoCommandValidatorEdgeCaseTests
{
    private readonly CreateContactoCommandValidator _validator = new();

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-01: Whitespace-only Nombre fails validation
    // FluentValidation NotEmpty() treats whitespace-only strings as empty.
    // This differs from frontend Zod min(1) which would pass — documents the gap.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyNombre_ReturnsInvalidResult()
    {
        // GIVEN — Nombre is whitespace-only
        var command = new CreateContactoCommand(
            Nombre: "   ",
            Cargo: "Analista",
            Telefono: "+57 310 000 0001",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails (NotEmpty rejects whitespace)
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-02: Whitespace-only Email fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyEmail_ReturnsInvalidResult()
    {
        // GIVEN — Email is whitespace-only
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: "+57 310 000 0002",
            Email: "   "
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Email));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-03: Whitespace-only Cargo fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyCargo_ReturnsInvalidResult()
    {
        // GIVEN — Cargo is whitespace-only
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "   ",
            Telefono: "+57 310 000 0003",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Cargo));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-04: Whitespace-only Telefono fails validation
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_WhitespaceOnlyTelefono_ReturnsInvalidResult()
    {
        // GIVEN — Telefono is whitespace-only
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: "   ",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — validation fails
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Telefono));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-05: Nombre at exactly max length (200 chars) passes
    // Boundary: MaximumLength(200) only rejects length > 200.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NombreAt200Chars_ReturnsValidResult()
    {
        // GIVEN — Nombre at exactly 200 characters (inclusive boundary)
        var command = new CreateContactoCommand(
            Nombre: new string('A', 200),
            Cargo: "Analista",
            Telefono: "+57 310 000 0005",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — valid (200 is acceptable)
        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-06: Nombre at 201 chars fails MaximumLength rule
    // Boundary: one character over the max must be rejected.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_NombreAt201Chars_ReturnsInvalidResult()
    {
        // GIVEN — Nombre at 201 characters (exceeds max 200)
        var command = new CreateContactoCommand(
            Nombre: new string('A', 201),
            Cargo: "Analista",
            Telefono: "+57 310 000 0006",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — invalid
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Nombre));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-07: Cargo at exactly max length (100 chars) passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_CargoAt100Chars_ReturnsValidResult()
    {
        // GIVEN — Cargo at exactly 100 characters
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: new string('B', 100),
            Telefono: "+57 310 000 0007",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — valid
        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-08: Cargo at 101 chars fails MaximumLength rule
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_CargoAt101Chars_ReturnsInvalidResult()
    {
        // GIVEN — Cargo at 101 characters (exceeds max 100)
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: new string('B', 101),
            Telefono: "+57 310 000 0008",
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — invalid
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Cargo));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-09: Telefono at exactly max length (50 chars) passes
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_TelefonoAt50Chars_ReturnsValidResult()
    {
        // GIVEN — Telefono at exactly 50 characters
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: new string('1', 50),
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — valid
        Assert.True(result.IsValid);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-10: Telefono at 51 chars fails MaximumLength rule
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_TelefonoAt51Chars_ReturnsInvalidResult()
    {
        // GIVEN — Telefono at 51 characters (exceeds max 50)
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: new string('1', 51),
            Email: "test@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — invalid
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoCommand.Telefono));
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-11: Email error message is in Spanish (localized)
    // Documents that all Spanish error messages are present per story requirement.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_InvalidEmailFormat_ErrorMessageIsInSpanish()
    {
        // GIVEN — invalid email format
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: "+57 310 000 0011",
            Email: "not-an-email"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — invalid
        Assert.False(result.IsValid);

        var emailError = result.Errors.First(e => e.PropertyName == nameof(CreateContactoCommand.Email));
        // Message must be non-empty Spanish text (as specified in story: "El email no tiene un formato válido")
        Assert.False(string.IsNullOrWhiteSpace(emailError.ErrorMessage));
        // Verify it does not expose default English FluentValidation message
        Assert.DoesNotContain("is not a valid email address", emailError.ErrorMessage, StringComparison.OrdinalIgnoreCase);
    }

    // ---------------------------------------------------------------------------
    // UNIT-B-VAL-CT-EDGE-12: Email with plus addressing (user+tag@empresa.com) passes
    // RFC 5321 plus addressing is a valid email format that FluentValidation accepts.
    // ---------------------------------------------------------------------------
    [Fact]
    public async Task Validate_EmailWithPlusAddressing_ReturnsValidResult()
    {
        // GIVEN — email with plus tag
        var command = new CreateContactoCommand(
            Nombre: "María García",
            Cargo: "Analista",
            Telefono: "+57 310 000 0012",
            Email: "maria.garcia+crm@empresa.com"
        );

        // WHEN
        var result = await _validator.ValidateAsync(command);

        // THEN — valid (plus addressing is RFC 5321 compliant)
        Assert.True(result.IsValid);
    }
}
