using FluentValidation;
using SiesaAgents.Application.Clientes.Commands;

namespace SiesaAgents.Application.Clientes.Validators;

/// <summary>
/// FluentValidation validator for <see cref="UpdateClienteCommand"/>. Story 2.4.
/// Mirrors <c>CreateClienteCommandValidator</c>: backend enforces
/// <c>Nombre</c> + <c>Nit</c> + <c>Id</c> as required; <c>Telefono</c> +
/// <c>Ciudad</c> remain optional to match the NULLable migration columns and
/// the entity invariants.
/// </summary>
public class UpdateClienteCommandValidator : AbstractValidator<UpdateClienteCommand>
{
    public UpdateClienteCommandValidator()
    {
        RuleFor(c => c.Id)
            .NotEmpty().WithMessage("Id es requerido.");

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
