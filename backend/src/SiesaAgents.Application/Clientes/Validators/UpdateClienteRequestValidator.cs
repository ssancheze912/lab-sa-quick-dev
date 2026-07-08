using FluentValidation;
using SiesaAgents.Application.Clientes.DTOs;

namespace SiesaAgents.Application.Clientes.Validators;

/// <summary>
/// FluentValidation validator for <see cref="UpdateClienteRequest"/> (Story 2.4).
///
/// Messages MUST be byte-for-byte identical to
/// <see cref="CreateClienteRequestValidator"/> AND the frontend Zod schema —
/// the drift-anchor lives IN the duplicate (R-006 parity).
/// </summary>
public sealed class UpdateClienteRequestValidator : AbstractValidator<UpdateClienteRequest>
{
    public UpdateClienteRequestValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().WithMessage("El nombre es obligatorio");
        RuleFor(x => x.Nit).NotEmpty().WithMessage("El NIT/RUC es obligatorio");
        RuleFor(x => x.Telefono).NotEmpty().WithMessage("El teléfono es obligatorio");
        RuleFor(x => x.Ciudad).NotEmpty().WithMessage("La ciudad es obligatoria");
    }
}
