using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

/// <summary>
/// FluentValidation validator for <see cref="CreateClienteCommand"/>.
/// Backend enforces <c>Nombre</c> + <c>Nit</c> as required to match the entity
/// invariants and the NULL-able columns from Story 2.1's migration. Frontend
/// keeps Teléfono / Ciudad required at the form layer (Zod) per FR1.
/// </summary>
public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(c => c.Nombre)
            .NotEmpty().WithMessage("Nombre es requerido.")
            .MaximumLength(200).WithMessage("Nombre no puede exceder 200 caracteres.");

        RuleFor(c => c.Nit)
            .NotEmpty().WithMessage("NIT/RUC es requerido.")
            .MaximumLength(50).WithMessage("NIT/RUC no puede exceder 50 caracteres.");

        RuleFor(c => c.Telefono)
            .MaximumLength(50).WithMessage("Teléfono no puede exceder 50 caracteres.")
            .When(c => !string.IsNullOrWhiteSpace(c.Telefono));

        RuleFor(c => c.Ciudad)
            .MaximumLength(100).WithMessage("Ciudad no puede exceder 100 caracteres.")
            .When(c => !string.IsNullOrWhiteSpace(c.Ciudad));
    }
}
