using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

/// <summary>
/// FluentValidation validator for <see cref="CreateClienteRequest"/> (Story 2.3).
///
/// Messages MUST match the frontend Zod schema strings VERBATIM to keep the
/// Zod ↔ FluentValidation contract stable (R-006 parity anchor).
/// </summary>
public sealed class CreateClienteRequestValidator : AbstractValidator<CreateClienteRequest>
{
    public CreateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es obligatorio");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es obligatorio");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es obligatorio");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es obligatoria");
    }
}
