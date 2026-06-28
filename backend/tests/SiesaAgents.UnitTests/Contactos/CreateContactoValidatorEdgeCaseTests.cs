using SiesaAgents.Application.Contactos.DTOs;
using SiesaAgents.Application.Contactos.Validators;
using Xunit;

namespace SiesaAgents.UnitTests.Contactos;

/// <summary>
/// Validator edge-case unit tests — Story 3.3: CreateContactoRequestValidator (automation expansion)
///
/// Covers edge cases NOT in CreateContactoValidatorTests.cs (which only tests null fields):
///   - Validator rejects empty string for each field (distinct from null)
///   - Validator rejects whitespace-only string for each field (.NotEmpty() trims)
///   - Validator rejects Nombre exceeding 255 chars (MaximumLength boundary)
///   - Validator rejects Nombre at exactly 256 chars (one over boundary)
///   - Validator accepts Nombre at exactly 255 chars (boundary: max allowed)
///   - Validator rejects Telefono exceeding 50 chars (MaximumLength boundary)
///   - Validator rejects malformed email format (.EmailAddress() rule)
///   - Validator rejects Email exceeding 255 chars
///   - Validator accepts a fully valid request (positive happy-path unit test)
///   - Validator reports the correct PropertyName for each failing field
/// </summary>
public class CreateContactoValidatorEdgeCaseTests
{
    private readonly CreateContactoRequestValidator _validator;

    // Valid baseline for single-field mutation tests
    private readonly CreateContactoRequest _validRequest = new(
        Nombre: "María López",
        Cargo: "Gerente Comercial",
        Telefono: "3001234567",
        Email: "maria.lopez@empresa.co"
    );

    public CreateContactoValidatorEdgeCaseTests()
    {
        _validator = new CreateContactoRequestValidator();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Happy path — valid request passes all rules
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] A fully valid request returns IsValid = true with no errors.
    /// </summary>
    [Fact]
    public void Validator_WhenAllFieldsValid_IsValid()
    {
        // ARRANGE: All fields present and within limits
        // ACT
        var result = _validator.Validate(_validRequest);

        // ASSERT
        Assert.True(result.IsValid);
        Assert.Empty(result.Errors);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Empty string (not null) — each field
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: empty string "" is treated as empty by .NotEmpty() — rejected.
    /// </summary>
    [Fact]
    public void Validator_WhenNombreIsEmpty_HasValidationError()
    {
        var request = _validRequest with { Nombre = string.Empty };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Nombre));
    }

    [Fact]
    public void Validator_WhenCargoIsEmpty_HasValidationError()
    {
        var request = _validRequest with { Cargo = string.Empty };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Cargo));
    }

    [Fact]
    public void Validator_WhenTelefonoIsEmpty_HasValidationError()
    {
        var request = _validRequest with { Telefono = string.Empty };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Telefono));
    }

    [Fact]
    public void Validator_WhenEmailIsEmpty_HasValidationError()
    {
        var request = _validRequest with { Email = string.Empty };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Email));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Whitespace-only strings — FluentValidation .NotEmpty() trims
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] FluentValidation .NotEmpty() treats whitespace-only strings as empty → rejected.
    /// </summary>
    [Fact]
    public void Validator_WhenNombreIsWhitespaceOnly_HasValidationError()
    {
        var request = _validRequest with { Nombre = "   " };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Nombre));
    }

    [Fact]
    public void Validator_WhenCargoIsWhitespaceOnly_HasValidationError()
    {
        var request = _validRequest with { Cargo = "\t\n" };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Cargo));
    }

    [Fact]
    public void Validator_WhenTelefonoIsWhitespaceOnly_HasValidationError()
    {
        var request = _validRequest with { Telefono = " " };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Telefono));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Nombre MaximumLength(255) boundary tests
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Nombre at exactly 255 characters is valid.
    /// </summary>
    [Fact]
    public void Validator_WhenNombreIsExactly255Chars_IsValid()
    {
        var request = _validRequest with { Nombre = new string('A', 255) };
        var result = _validator.Validate(request);

        Assert.True(result.IsValid);
    }

    /// <summary>
    /// [P2] Boundary: Nombre at 256 characters exceeds MaximumLength(255) → rejected.
    /// </summary>
    [Fact]
    public void Validator_WhenNombreExceeds255Chars_HasValidationError()
    {
        var request = _validRequest with { Nombre = new string('B', 256) };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Nombre));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cargo MaximumLength(255) boundary test
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Cargo at 256 characters exceeds MaximumLength(255) → rejected.
    /// </summary>
    [Fact]
    public void Validator_WhenCargoExceeds255Chars_HasValidationError()
    {
        var request = _validRequest with { Cargo = new string('C', 256) };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Cargo));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Telefono MaximumLength(50) boundary tests
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Telefono at exactly 50 characters is valid.
    /// </summary>
    [Fact]
    public void Validator_WhenTelefonoIsExactly50Chars_IsValid()
    {
        var request = _validRequest with { Telefono = new string('3', 50) };
        var result = _validator.Validate(request);

        Assert.True(result.IsValid);
    }

    /// <summary>
    /// [P2] Boundary: Telefono at 51 characters exceeds MaximumLength(50) → rejected.
    /// </summary>
    [Fact]
    public void Validator_WhenTelefonoExceeds50Chars_HasValidationError()
    {
        var request = _validRequest with { Telefono = new string('9', 51) };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Telefono));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Email format validation — .EmailAddress() rule
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Non-empty but malformed email fails .EmailAddress() rule.
    /// </summary>
    [Theory]
    [InlineData("notanemail")]
    [InlineData("@empresa.co")]
    [InlineData("user@")]
    [InlineData("user @empresa.co")]
    [InlineData("user..double@empresa.co")]
    public void Validator_WhenEmailIsMalformed_HasValidationError(string malformedEmail)
    {
        var request = _validRequest with { Email = malformedEmail };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Email));
    }

    /// <summary>
    /// [P2] Valid email formats pass .EmailAddress() rule.
    /// </summary>
    [Theory]
    [InlineData("user@empresa.co")]
    [InlineData("maria.lopez@corporacion.com")]
    [InlineData("usuario+tag@dominio.com.co")]
    public void Validator_WhenEmailIsValid_HasNoEmailError(string validEmail)
    {
        var request = _validRequest with { Email = validEmail };
        var result = _validator.Validate(request);

        // No errors on the Email property specifically
        var emailErrors = result.Errors.Where(e =>
            e.PropertyName == nameof(CreateContactoRequest.Email)).ToList();
        Assert.Empty(emailErrors);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Email MaximumLength(255) boundary test
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] Boundary: Email exceeding 255 chars is rejected (even if format would be valid).
    /// </summary>
    [Fact]
    public void Validator_WhenEmailExceeds255Chars_HasValidationError()
    {
        // Build a syntactically valid email that exceeds 255 chars total
        var localPart = new string('a', 250);
        var longEmail = $"{localPart}@emp.co"; // > 255 chars total

        var request = _validRequest with { Email = longEmail };
        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Email));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multiple simultaneous errors — boundary: all fields invalid
    // ─────────────────────────────────────────────────────────────────────────

    /// <summary>
    /// [P2] When all four fields are empty, validator reports 4 separate errors (one per field).
    /// </summary>
    [Fact]
    public void Validator_WhenAllFieldsEmpty_HasFourValidationErrors()
    {
        var request = new CreateContactoRequest(
            Nombre: string.Empty,
            Cargo: string.Empty,
            Telefono: string.Empty,
            Email: string.Empty
        );

        var result = _validator.Validate(request);

        Assert.False(result.IsValid);
        // Expect at least 4 errors: Nombre, Cargo, Telefono, Email (Email may fire both NotEmpty and EmailAddress)
        Assert.True(result.Errors.Count >= 4,
            $"Expected at least 4 validation errors, got {result.Errors.Count}.");

        // Each required field should have at least one error
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Nombre));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Cargo));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Telefono));
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateContactoRequest.Email));
    }
}
