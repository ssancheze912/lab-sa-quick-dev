using FluentValidation;

namespace SiesaAgents.Application.Clientes.Commands;

public sealed class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("'Nombre' must not be empty.")
            .Must(x => !string.IsNullOrWhiteSpace(x)).WithMessage("'Nombre' must not be whitespace.")
            .MaximumLength(200).WithMessage("'Nombre' must not exceed 200 characters.");

        RuleFor(x => x.Nit)
            .NotEmpty().WithMessage("'Nit' must not be empty.")
            .Must(x => !string.IsNullOrWhiteSpace(x)).WithMessage("'Nit' must not be whitespace.")
            .MaximumLength(200).WithMessage("'Nit' must not exceed 200 characters.");

        RuleFor(x => x.Telefono)
            .NotEmpty().WithMessage("'Telefono' must not be empty.")
            .Must(x => !string.IsNullOrWhiteSpace(x)).WithMessage("'Telefono' must not be whitespace.")
            .MaximumLength(200).WithMessage("'Telefono' must not exceed 200 characters.");

        RuleFor(x => x.Ciudad)
            .NotEmpty().WithMessage("'Ciudad' must not be empty.")
            .Must(x => !string.IsNullOrWhiteSpace(x)).WithMessage("'Ciudad' must not be whitespace.")
            .MaximumLength(200).WithMessage("'Ciudad' must not exceed 200 characters.");
    }
}
