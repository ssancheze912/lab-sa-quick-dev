using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

/// <summary>
/// FluentValidation rules for <see cref="CreateClienteRequest"/>. Mirrors the
/// column limits from <c>ClienteConfiguration</c> (200/50/50/100) to fail-fast
/// with a 400 Problem Details before EF Core is touched.
/// <see cref="AbstractValidator{T}.RuleFor"/> + <c>.NotEmpty()</c> rejects null,
/// empty and whitespace-only inputs (equivalent to <c>string.IsNullOrWhiteSpace</c>).
/// </summary>
public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es requerido.")
            .MaximumLength(200).WithMessage("El nombre no puede exceder 200 caracteres.");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("El NIT/RUC es requerido.")
            .MaximumLength(50).WithMessage("El NIT/RUC no puede exceder 50 caracteres.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("El teléfono es requerido.")
            .MaximumLength(50).WithMessage("El teléfono no puede exceder 50 caracteres.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("La ciudad es requerida.")
            .MaximumLength(100).WithMessage("La ciudad no puede exceder 100 caracteres.");
    }
}
